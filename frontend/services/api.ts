/**
 * No Limits REST API Client & Service Contract
 * Conectado al Backend Express.js / Node.js + MongoDB (nolimits_db)
 */

import {
  Product,
  Order,
  Review,
  BlacklistCustomer,
  BranchAnalytics,
  AdminAlertNotification,
  User,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_BRANCHES,
  INITIAL_REVIEWS,
  INITIAL_BLACKLIST,
  INITIAL_ANALYTICS,
} from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const DIRECT_BACKEND_URL = 'http://localhost:5000/api';

export interface AuthResponse {
  ok: boolean;
  user: User;
  token?: string;
}

class ApiClient {
  // Sesión gestionada por cookie HttpOnly; no conservar tokens en JavaScript.
  getToken(): string | null { return null; }
  setToken(_token: string): void { /* Se usa la cookie de sesión segura. */ }
  clearToken(): void { /* El backend revoca la sesión vía logout. */ }

  /**
   * Realiza una petición HTTP hacia el Backend (intenta /api por proxy y, si falla por red en local,
   * intenta http://localhost:5000/api directamente).
   */
  private async fetchBackend<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };


    const executeFetch = async (baseUrl: string): Promise<Response> => {
      return fetch(`${baseUrl}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers,
      });
    };

    let response: Response;
    try {
      response = await executeFetch(API_BASE_URL);
      // Si el proxy de Vite devuelve 502/504 o HTML en vez de JSON, probamos directo al puerto 5000
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json') && API_BASE_URL === '/api') {
        response = await executeFetch(DIRECT_BACKEND_URL);
      }
    } catch {
      if (API_BASE_URL === '/api') {
        response = await executeFetch(DIRECT_BACKEND_URL);
      } else {
        throw new Error('No se pudo conectar con el servidor Backend.');
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage =
        data?.error || data?.message || `Error del servidor (${response.status})`;
      const err = new Error(errorMessage) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    return data as T;
  }

  // =========================================================================
  // 1. MÓDULO DE AUTENTICACIÓN Y PERFIL (/api/auth/*) -> MongoDB `users`
  // =========================================================================

  async login(email: string, password?: string): Promise<AuthResponse> {
    const res = await this.fetchBackend<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return res;
  }

  async register(
    name: string,
    email: string,
    password?: string,
    extra?: { rut?: string; phone?: string }
  ): Promise<AuthResponse> {
    const res = await this.fetchBackend<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        rut: extra?.rut,
        phone: extra?.phone,
      }),
    });
    return res;
  }

  async loginWithGoogle(payload?: {
    email?: string;
    name?: string;
    googleId?: string;
    avatarUrl?: string;
  }): Promise<AuthResponse> {
    const res = await this.fetchBackend<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload || {}),
    });
    return res;
  }

  async getMe(): Promise<{ ok: boolean; user: User }> {
    return this.fetchBackend<{ ok: boolean; user: User }>('/auth/me', {
      method: 'GET',
    });
  }

  async logout(): Promise<void> {
    this.clearToken();
    await this.fetchBackend('/auth/logout', {
      method: 'POST',
    }).catch(() => {});
  }

  async updateProfile(userId: string, data: Partial<User>): Promise<{ ok: boolean; user: User }> {
    return this.fetchBackend<{ ok: boolean; user: User }>(`/auth/profile/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // =========================================================================
  // 2. PRODUCTOS Y SERVICIOS EXISTENTES
  // =========================================================================

  async getProducts(params?: {
    category?: string;
    branchId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  }): Promise<Product[]> {
    let list = [...INITIAL_PRODUCTS];
    if (params?.category && params.category !== 'all') {
      list = list.filter((p) =>
        p.category.toLowerCase().includes(params.category!.toLowerCase())
      );
    }
    if (params?.branchId && params.branchId !== 'all') {
      list = list.filter((p) => (p.stockPerBranch[params.branchId!] || 0) > 0);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return INITIAL_PRODUCTS.find((p) => p.id === id);
  }

  async createProductExpress(productData: Partial<Product>): Promise<Product> {
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      sku: productData.sku || `NL-${Math.floor(100 + Math.random() * 900)}`,
      title: productData.title || 'Prenda Exclusiva',
      description: productData.description || '',
      price: productData.price || 0,
      salePrice: productData.salePrice,
      category: productData.category || 'Poleras',
      subCategory:
        productData.subCategory || productData.subcategory || 'Oversize / Boxy Fit',
      subcategory:
        productData.subCategory || productData.subcategory || 'Oversize / Boxy Fit',
      weightGrams: productData.weightGrams || 250,
      tags: productData.tags || ['Drop Exclusivo'],
      images: productData.images || [
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80',
      ],
      sizes: productData.sizes || ['M', 'L'],
      colors: productData.colors || [{ name: 'Void Black', hex: '#000000' }],
      stockPerBranch: productData.stockPerBranch || {
        vina_del_mar: 1,
        valparaiso: 1,
        quilpue: 1,
      },
      totalStock: productData.totalStock || 3,
      isExclusive: productData.isExclusive ?? true,
      isFeatured: productData.isFeatured ?? false,
      isHidden: productData.isHidden ?? false,
      allowStorePickup: productData.allowStorePickup ?? true,
      branchesEnabled: productData.branchesEnabled || [
        'vina_del_mar',
        'valparaiso',
        'quilpue',
      ],
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newProduct;
  }

  async initiateWebpayTransaction(orderId: string, amount: number) {
    return {
      token: `tbk_${Date.now()}`,
      url: `https://webpay3gint.transbank.cl/webpayserver/initTransaction`,
      status: 'INITIALIZED',
    };
  }

  async uploadAndScanVoucher(file: File): Promise<{
    verified: boolean;
    confidence: number;
    extractedAmount: number;
    bankName: string;
    transactionCode: string;
    isDuplicate: boolean;
  }> {
    await new Promise((r) => setTimeout(r, 1200));
    return {
      verified: true,
      confidence: 0.96,
      extractedAmount: 38990,
      bankName: 'BancoEstado / CuentaRUT',
      transactionCode: `TRANS-${Math.floor(100000 + Math.random() * 900000)}`,
      isDuplicate: false,
    };
  }

  async trackShipment(
    carrier: 'starken' | 'blue_express' | 'paket',
    trackingCode: string
  ) {
    return {
      carrier,
      trackingCode,
      status: 'En tránsito a sucursal de destino',
      estimatedDelivery: '24-48 hrs hábiles',
      origin: 'Viña del Mar Central Hub',
      destination: 'Valparaíso Puerto Cyber Lab',
      checkpoints: [
        { time: '10:30 hrs', event: 'Paquete recibido en centro de distribución Viña' },
        { time: '14:15 hrs', event: 'Clasificado y despachado en ruta troncal' },
      ],
    };
  }
}

export const api = new ApiClient();

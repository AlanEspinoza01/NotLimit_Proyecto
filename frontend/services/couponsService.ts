import api from '../api/axios';

export interface AdminCouponTemplate {
  id: string;
  name: string;
  badge: string;
  pointsCost: number;
  code: string; // Prefijo base del cupón (ej: "DROP3K", "CYBER5K", "NL-VIP")
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number; // % o $ CLP (0 si es free_shipping)
  expirationRule: string; // ej: "2 semanas de vida tiene después del canjeo"
  expirationDays: number; // 7, 14, 21, 28
  minPurchase: number; // Monto mínimo en CLP
  totalRedemptions: number;
  maxUses: number;
  isActive: boolean;
  createdAt: string;
}

export interface RedeemedUserCoupon {
  id: string;
  code: string; // Código único e irrepetible de 1 solo uso (ej: DROP3K-XP-7721)
  templateId: string;
  title: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
  discount: string; // Descripción legible (ej: "$3.000 CLP" o "15% OFF")
  minPurchase: number;
  pointsSpent: number;
  userEmail: string;
  userName: string;
  date: string; // Fecha legible de canje
  redeemedAtIso: string;
  expiresAtIso: string;
  expiresAtLabel: string;
  status: 'disponible' | 'usado' | 'expirado';
  usedAtDate?: string;
  usedOrderNumber?: string;
}

export const STORAGE_COUPONS_KEY = 'nl_admin_coupons_catalog_v1';
export const STORAGE_REDEEMED_COUPONS_KEY = 'nolimits_redeemed_coupons';
export const STORAGE_ACTIVE_CART_COUPON_KEY = 'nolimits_active_cart_coupon_v1';

// No cargar promociones ni contadores ficticios por defecto. Se gestiona todo desde MongoDB.
export const DEFAULT_ADMIN_COUPONS: AdminCouponTemplate[] = [];

export const formatClpAmount = (val: number): string => {
  return '$' + Math.round(val).toLocaleString('es-CL');
};

export const getCouponDiscountDescription = (coup: Pick<AdminCouponTemplate, 'discountType' | 'discountValue' | 'minPurchase'>): string => {
  const minText =
    coup.minPurchase > 0
      ? `en compras sobre ${formatClpAmount(coup.minPurchase)} CLP`
      : 'aplicable al total de tu compra';

  if (coup.discountType === 'free_shipping') {
    return `Envío gratuito a domicilio en todo Chile (${minText})`;
  }
  if (coup.discountType === 'percentage') {
    return `${coup.discountValue}% de descuento ${minText}`;
  }
  return `${formatClpAmount(coup.discountValue)} CLP ${minText}`;
};

export const getCouponShortDiscountLabel = (coup: Pick<AdminCouponTemplate, 'discountType' | 'discountValue'>): string => {
  if (coup.discountType === 'free_shipping') return 'Envío Gratis';
  if (coup.discountType === 'percentage') return `${coup.discountValue}% OFF`;
  return `${formatClpAmount(coup.discountValue)} CLP`;
};

export const getCouponMinPurchaseLabel = (minPurchase: number): string => {
  if (!minPurchase || minPurchase <= 0) return 'Sin monto mínimo';
  return `Mínimo ${formatClpAmount(minPurchase)} CLP`;
};

export const normalizeAdminCoupon = (raw: any, index: number = 0): AdminCouponTemplate => {
  const discountType: 'percentage' | 'fixed' | 'free_shipping' =
    raw.discountType === 'percentage' || raw.discountType === 'fixed' || raw.discountType === 'free_shipping'
      ? raw.discountType
      : 'fixed';

  const discountValue = Number(raw.discountValue) || 0;

  // Si un cupón guardado anteriormente no tenía pointsCost, lo calculamos según la regla 1 Punto = $10 CLP
  let pointsCost = Number(raw.pointsCost);
  if (!pointsCost || isNaN(pointsCost) || pointsCost <= 0) {
    if (discountType === 'fixed' && discountValue > 0) {
      pointsCost = Math.max(50, Math.round(discountValue / 10));
    } else if (discountType === 'percentage') {
      pointsCost = Math.max(100, discountValue * 30);
    } else {
      pointsCost = 350;
    }
  }

  let expirationDays = Number(raw.expirationDays) || 14;
  const expirationRule =
    typeof raw.expirationRule === 'string' && raw.expirationRule.trim()
      ? raw.expirationRule
      : `${Math.round(expirationDays / 7)} semanas de vida tiene después del canjeo`;

  // Limpiar el prefijo si venía con formato antiguo (ej: NL-WELCOME-2026 -> NL-WELCOME)
  const rawCode = typeof raw.code === 'string' && raw.code.trim() ? raw.code.trim().toUpperCase() : `NL-CUPON-${index + 1}`;

  return {
    id: raw.id || `coup_${Date.now()}_${index}`,
    name: raw.name || raw.title || 'Cupón Exclusivo NoLimits',
    badge: raw.badge || (discountType === 'free_shipping' ? 'AHORRO ENVÍO' : discountValue >= 10000 ? 'PREMIO MAYOR' : 'EXCLUSIVO'),
    pointsCost,
    code: rawCode,
    discountType,
    discountValue,
    expirationRule,
    expirationDays,
    minPurchase: Number(raw.minPurchase) || 0,
    totalRedemptions: Number(raw.totalRedemptions) || 0,
    maxUses: Number(raw.maxUses) || 100,
    isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : true,
    createdAt: raw.createdAt || '2026-03-01'
  };
};

// Caché efímera solo para dibujar la interfaz; no es fuente de verdad ni persiste entre sesiones.
let catalogCache: AdminCouponTemplate[] = [];
let walletCache: RedeemedUserCoupon[] = [];
let cacheIdentity = '';
let cacheGeneration = 0;
const emitCouponEvent = () => { if (typeof window !== 'undefined') window.dispatchEvent(new Event('nl_coupons_updated')); };

export const clearCouponCache = (userId = ''): void => {
  ++cacheGeneration; cacheIdentity = userId; catalogCache = []; walletCache = []; emitCouponEvent();
};
export const loadAdminCouponsCatalog = (): AdminCouponTemplate[] => catalogCache.map(c=>({...c}));
export const loadRedeemedCoupons = (): RedeemedUserCoupon[] => walletCache.map(c=>({...c}));
// Estas funciones antiguas ahora actualizan SOLO la vista en memoria.
export const saveAdminCouponsCatalog = (list: AdminCouponTemplate[]): void => {
  catalogCache = list.map(c=>({...c})); emitCouponEvent();
};
export const saveRedeemedCoupons = (list: RedeemedUserCoupon[]): void => {
  walletCache = list.map(c=>({...c})); emitCouponEvent();
};

/** Consulta las plantillas y los códigos REALES en MongoDB; no migra automáticamente localStorage. */
export const refreshCouponsFromBackend = async (userId = cacheIdentity): Promise<void> => {
  const generation = cacheGeneration;
  const identity = userId;
  const catalogResponse = await api.get('/payments/coupons/catalog');
  if (generation !== cacheGeneration || identity !== cacheIdentity) return;
  saveAdminCouponsCatalog(Array.isArray(catalogResponse.data?.data) ? catalogResponse.data.data : []);
  if (identity) {
    const walletResponse = await api.get('/payments/coupons/mine');
    if (generation !== cacheGeneration || identity !== cacheIdentity) return;
    saveRedeemedCoupons(Array.isArray(walletResponse.data?.data) ? walletResponse.data.data : []);
  } else {
    saveRedeemedCoupons([]);
  }
};

export const normalizeRedeemedCoupon = (raw: any, index: number = 0): RedeemedUserCoupon => {
  const code = (raw.code || `DROP3K-XP-${7000 + index}`).toUpperCase().trim();
  const discountType: 'percentage' | 'fixed' | 'free_shipping' =
    raw.discountType === 'percentage' || raw.discountType === 'fixed' || raw.discountType === 'free_shipping'
      ? raw.discountType
      : typeof raw.discount === 'string' && raw.discount.includes('%')
      ? 'percentage'
      : typeof raw.discount === 'string' && raw.discount.toLowerCase().includes('envío')
      ? 'free_shipping'
      : 'fixed';

  let discountValue = Number(raw.discountValue);
  if (isNaN(discountValue) || discountValue <= 0) {
    if (typeof raw.discount === 'string') {
      const digits = parseInt(raw.discount.replace(/[^0-9]/g, ''), 10);
      discountValue = !isNaN(digits) ? digits : 3000;
    } else {
      discountValue = 3000;
    }
  }

  const now = Date.now();
  const redeemedAtIso = raw.redeemedAtIso || new Date(now - 86400000).toISOString();
  const expiresAtIso = raw.expiresAtIso || new Date(now + 14 * 86400000).toISOString();

  // Verificar si ya venció por fecha
  let status: 'disponible' | 'usado' | 'expirado' = raw.status || 'disponible';
  if (status === 'disponible' && new Date(expiresAtIso).getTime() < now) {
    status = 'expirado';
  }

  return {
    id: raw.id || `red_${Date.now()}_${index}`,
    code,
    templateId: raw.templateId || 'coup_3k',
    title: raw.title || 'Cupón de Descuento NoLimits',
    discountType,
    discountValue,
    discount: raw.discount || getCouponShortDiscountLabel({ discountType, discountValue }),
    minPurchase: Number(raw.minPurchase) || 0,
    pointsSpent: Number(raw.pointsSpent) || 300,
    userEmail: raw.userEmail || 'valeria.k@gmail.com',
    userName: raw.userName || 'Valeria Neo-Goth',
    date: raw.date || '10 de Octubre 2026',
    redeemedAtIso,
    expiresAtIso,
    expiresAtLabel:
      raw.expiresAtLabel ||
      new Date(expiresAtIso).toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
    status,
    usedAtDate: raw.usedAtDate,
    usedOrderNumber: raw.usedOrderNumber
  };
};

/**
 * Genera un código único e irrepetible de 1 solo uso para un canje de usuario.
 * Ejemplo: si el prefijo del Admin es "CYBER5K", genera "CYBER5K-XP-4829"
 * verificando que jamás se haya generado antes en el historial de canjes.
 */
export const generateUniqueSingleUseCode = (basePrefix: string, existingRedeemed: RedeemedUserCoupon[]): string => {
  const cleanPrefix = (basePrefix || 'NL')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-XP-\d+$/, '')
    .slice(0, 12);

  const existingCodes = new Set(existingRedeemed.map((c) => c.code.toUpperCase()));
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let attempt = 0; attempt < 50; attempt++) {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const randTag =
      chars.charAt(Math.floor(Math.random() * chars.length)) +
      chars.charAt(Math.floor(Math.random() * chars.length));
    const candidate = attempt < 25 ? `${cleanPrefix}-XP-${randNum}` : `${cleanPrefix}-${randTag}-${randNum}`;
    if (!existingCodes.has(candidate)) {
      return candidate;
    }
  }

  return `${cleanPrefix}-XP-${Date.now().toString().slice(-5)}`;
};

/**
 * Ejecuta el canje de una plantilla de cupón por parte de un usuario:
 * 1. Genera un código único de 1 solo uso
 * 2. Calcula su fecha exacta de vencimiento según las semanas configuradas por el Admin
 * 3. Incrementa el contador de canjes (totalRedemptions) en la tabla del Admin
 * 4. Guarda el cupón en la billetera del usuario
 */
export const redeemCouponTemplateForUser = (_params: {
  template: AdminCouponTemplate; userEmail: string; userName: string;
}): never => {
  // Por seguridad el canje debe ejecutarse en el backend con una transacción MongoDB.
  throw new Error('Canje local deshabilitado: utiliza POST /api/payments/coupons/redeem');
};

/**
 * Valida si un código único ingresado en el Carrito / Checkout puede utilizarse
 */
export const validateRedeemedCouponForCart = (
  rawCode: string,
  cartSubtotalAfterDirectDiscount: number
): { valid: boolean; error?: string; coupon?: RedeemedUserCoupon; calculatedDiscountClp: number } => {
  const cleanCode = (rawCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, error: 'Ingresa un código de cupón válido.', calculatedDiscountClp: 0 };
  }

  const allRedeemed = loadRedeemedCoupons();
  const found = allRedeemed.find((c) => c.code.toUpperCase() === cleanCode);

  if (!found) {
    // Verificar si el usuario escribió por error el prefijo de la plantilla en vez de su código único canjeado
    const catalog = loadAdminCouponsCatalog();
    const isTemplatePrefix = catalog.some((t) => t.code.toUpperCase() === cleanCode);
    if (isTemplatePrefix) {
      return {
        valid: false,
        error: `El código "${cleanCode}" es un prefijo de catálogo. Primero debes canjearlo con tus puntos en "Mi Perfil > Puntos Acumulados" para obtener tu código único personal.`,
        calculatedDiscountClp: 0
      };
    }
    return {
      valid: false,
      error: 'El código ingresado no existe. Canjea tus puntos en "Mi Perfil > Puntos Acumulados" para generar un código único.',
      calculatedDiscountClp: 0
    };
  }

  if (found.status === 'usado') {
    return {
      valid: false,
      error: `Este código único (${found.code}) ya fue utilizado${found.usedOrderNumber ? ` en la orden #${found.usedOrderNumber}` : ''}. Recuerda que cada código es de 1 solo uso.`,
      calculatedDiscountClp: 0
    };
  }

  if (found.status === 'expirado' || new Date(found.expiresAtIso).getTime() < Date.now()) {
    return {
      valid: false,
      error: `Este código único (${found.code}) venció el ${found.expiresAtLabel}.`,
      calculatedDiscountClp: 0
    };
  }

  if (found.minPurchase > 0 && cartSubtotalAfterDirectDiscount < found.minPurchase) {
    return {
      valid: false,
      error: `El cupón "${found.title}" requiere una compra mínima de ${formatClpAmount(found.minPurchase)} CLP (tu subtotal actual es ${formatClpAmount(cartSubtotalAfterDirectDiscount)} CLP).`,
      calculatedDiscountClp: 0
    };
  }

  let calculatedDiscountClp = 0;
  if (found.discountType === 'percentage') {
    calculatedDiscountClp = Math.round((cartSubtotalAfterDirectDiscount * found.discountValue) / 100);
  } else if (found.discountType === 'fixed') {
    calculatedDiscountClp = Math.min(cartSubtotalAfterDirectDiscount, found.discountValue);
  } else if (found.discountType === 'free_shipping') {
    calculatedDiscountClp = 0; // Se bonifica el costo de envío en el carrito/checkout
  }

  return {
    valid: true,
    coupon: found,
    calculatedDiscountClp
  };
};

/**
 * Marca un código único como 'usado' de forma permanente cuando el usuario confirma su compra en Checkout
 */
export const markRedeemedCouponAsUsed = (_code: string, _orderNumber: string): void => {
  // No cambia estados económicos en el navegador: sincroniza la decisión del backend.
  void refreshCouponsFromBackend().catch((error) => console.error('No se pudieron actualizar cupones', error));
};

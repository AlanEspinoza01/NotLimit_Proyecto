import { BranchScheduleBlock } from '../../types';
import { AdminCouponTemplate } from '../../services/couponsService';
import { ShippingCourierId } from '../../services/shippingQuotesEngine';
import { INITIAL_PRODUCTS } from '../../services/mockData';
import { ProductStockDetail } from '../../views/admin/ProductStockSummaryView';

export type ProfileTabId =
  | 'orders'
  | 'points'
  | 'wishlist'
  | 'addresses'
  | 'returns'
  | 'reviews'
  | 'settings';

/**
 * Interfaz para las direcciones del usuario con soporte de predeterminada
 */
export interface UserAddress {
  id: string;
  alias?: string;
  recipientName: string;
  street: string;
  number: string;
  apartment?: string;
  comuna: string;
  city: string;
  region: string;
  postalCode?: string;
  phone?: string;
  notes?: string;
  isDefault: boolean;
}

/**
 * Motivos oficiales de solicitud de devolución adaptados a las instrucciones del dueño
 * (Exclusivamente productos con defectos de fabricación o fallas no informadas antes de la compra)
 */
export const OWNER_RETURN_REASONS = [
  'Defecto de fabricación (Costuras, cierres o confección)',
  'Falla o detalle en el material no informado antes de la compra',
  'Producto recibido con daño o falla previa al uso',
  'Error de despacho de la tienda (Producto o medida distinta a la comprada)',
  'Otra falla de fábrica no informada en la publicación'
] as const;

/**
 * Interfaz para casos de Devolución con los 4 estados obligatorios
 */
export interface ReturnRequest {
  id: string;
  ticketNumber: string;
  orderNumber: string;
  productId: string;
  productTitle: string;
  productSize: string;
  productImage: string;
  reason: string;
  requestedSize?: string;
  returnMethod: 'branch_dropoff' | 'courier_shipping';
  returnCourier?: ShippingCourierId;
  shippingCostClp?: number;
  paidByStore?: boolean;
  targetBranchId: string;
  targetBranchName: string;
  requestDate: string;
  currentStatus:
    | 'Solicitud recibida'
    | 'Revisión de equipo'
    | 'Aprobada'
    | 'Rechazada'
    | 'Envió a punto'
    | 'Retiro Presencial'
    | 'Envió a punto/sucursal';
  notes?: string;
  rejectionReason?: string;
  rejectionDate?: string;
  adminInspector?: string;
  photos?: string[];
}

/**
 * Interfaz para las reseñas ya realizadas por el usuario
 */
export interface UserPublishedReview {
  id: string;
  productId: string;
  productTitle: string;
  productImage: string;
  productSize?: string;
  orderNumber: string;
  orderId?: string; // Identificador persistente de MongoDB de la compra verificada.
  rating: number;
  title: string;
  comment: string;
  photos: string[];
  date: string;
  pointsEarned: number;
}

/**
 * Información oficial de horarios de atención física de sucursales
 */
export interface BranchScheduleInfo {
  id: string;
  name: string;
  city: string;
  address: string;
  scheduleWeekdays: string;
  scheduleSaturday: string;
  scheduleSunday: string;
  scheduleBlocks?: BranchScheduleBlock[];
  pickupSummary?: string;
  phone: string;
  whatsapp: string;
  leadContact: string;
  returnInstructions: string;
  badge: string;
}

export const BRANCH_PHYSICAL_SCHEDULES: BranchScheduleInfo[] = [
  {
    id: 'vina_del_mar',
    name: 'Sucursal Viña del Mar - Mall Marina Studio',
    city: 'Viña del Mar',
    address: 'Av. Libertad 1348, Local 204 (Segundo Nivel)',
    scheduleWeekdays: 'Lunes a Viernes: 10:30 a 19:30 hrs',
    scheduleSaturday: 'Sábados: 11:00 a 17:00 hrs',
    scheduleSunday: 'Domingos y Feriados: Cerrado',
    phone: '+56 9 8452 1190',
    whatsapp: '+56 9 8452 1190',
    leadContact: 'Sebastián Valdés (Store Lead)',
    returnInstructions: 'Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central.',
    badge: 'Tienda Matriz & Devolución Rápida'
  },
  {
    id: 'valparaiso',
    name: 'Sucursal Valparaíso - Puerto Cyber Lab',
    city: 'Valparaíso',
    address: 'Calle Prat 740, Nivel 1 (Frente a Plaza Sotomayor)',
    scheduleWeekdays: 'Lunes a Viernes: 11:00 a 19:00 hrs',
    scheduleSaturday: 'Sábados: 11:00 a 16:30 hrs',
    scheduleSunday: 'Domingos: Cerrado',
    phone: '+56 9 7312 9044',
    whatsapp: '+56 9 7312 9044',
    leadContact: 'Camila Rojas (Jefa de Sucursal)',
    returnInstructions: 'Módulo Express Drop-off para cambios de talla inmediatos y pruebas de calce.',
    badge: 'Hub Urbano Puerto'
  },
  {
    id: 'quilpue',
    name: 'Sucursal Quilpué - Centro Drop Hub',
    city: 'Quilpué',
    address: 'Los Carrera 880, Edificio Sol, Local 12',
    scheduleWeekdays: 'Lunes a Sábado: 10:00 a 20:00 hrs (Continuado)',
    scheduleSaturday: 'Sábados: 10:00 a 20:00 hrs',
    scheduleSunday: 'Domingos: 11:00 a 16:00 hrs',
    phone: '+56 9 6128 4402',
    whatsapp: '+56 9 6128 4402',
    leadContact: 'Martín Araya (Atención al Cliente)',
    returnInstructions: 'Punto oficial de recepción de prendas para inspección técnica y retiro de nueva prenda.',
    badge: 'Horario Extendido'
  }
];

/**
 * Interfaz para las órdenes de compra con la nomenclatura obligatoria de estados
 */
export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  date: string;
  total: number;
  // Importes históricos capturados al pagar; nunca se recalculan con el catálogo actual.
  subtotal?: number;
  shippingCost?: number;
  discountAmount?: number;
  purchasedAt?: number;
  paymentStatus?: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'REFUNDED';
  paymentMethod?: string;
  deliveryMethod: 'pickup' | 'shipping';
  branchName?: string; // Valparaíso, Viña del Mar, Quilpué
  branchId?: string;
  courier?: string; // Starken, Blue Express, Paket
  shippingAddress?: string;
  trackingNumber?: string;
  items: {
    productId: string;
    title: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
    image: string;
    isReviewed?: boolean; // Estado real del ítem en orders de MongoDB.
  }[];
  // Estados obligatorios según requerimiento
  currentStatus:
    | 'Solicitud recibida'
    | 'En Preparación'
    | 'En transito'
    | 'Listo para el retiro de sucursal'
    | 'Entregado'
    | 'Retirado'
    | 'Pendiente de Pago'
    | 'Pago Anulado'
    | 'Reembolsado';
}

/**
 * Cupones canjeables con Puntos NoLimits (Sincronizados desde Super Admin > Editar Cupones)
 */
export type CouponItem = AdminCouponTemplate;

export const PRESET_AVATARS = [
  {
    id: 'cyber_girl',
    name: 'Cyberpunk Neon',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'streetwear_hoodie',
    name: 'Streetwear Void',
    url: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'gothic_chrome',
    name: 'Gothic Chrome',
    url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'matrix_hacker',
    name: 'Matrix Retro',
    url: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=200&auto=format&fit=crop&q=80'
  },
  {
    id: 'y2k_aesthetic',
    name: 'Y2K Street',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&auto=format&fit=crop&q=80'
  }
];

// Helper para formatear RUT con puntos y guion automáticos (ej: 19.876.543-2)
export const formatRutWithDotsAndDash = (raw: string): string => {
  const cleaned = (raw || '').replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
  if (!cleaned) return '';
  if (cleaned.length === 1) return cleaned;
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  let formattedBody = '';
  for (let i = body.length - 1, j = 1; i >= 0; i--, j++) {
    formattedBody = body[i] + formattedBody;
    if (j % 3 === 0 && i !== 0) {
      formattedBody = '.' + formattedBody;
    }
  }
  return `${formattedBody}-${dv}`;
};

// Helper para formatear teléfono móvil con separación automática (ejemplo: 9 5689 6328)
export const formatChileanMobilePhone = (raw: string): string => {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('56') && digits.length > 9) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 9);
  if (!digits) return '';
  if (digits.length <= 1) return digits;
  if (digits.length <= 5) {
    return `${digits.slice(0, 1)} ${digits.slice(1)}`;
  }
  return `${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5, 9)}`;
};

// Helper para convertir fechas en español a timestamp para ordenamiento cronológico
export const parseOrderDate = (orderDateStr: string): number => {
  if (!orderDateStr) return 0;
  if (orderDateStr.toLowerCase().includes('reciente')) return Date.now();
  const spanishMonths: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
  };
  const match = orderDateStr.toLowerCase().match(/(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+(?:de\s+)?(\d{4})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthName = match[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const year = parseInt(match[3], 10);
    if (spanishMonths[monthName] !== undefined) {
      return new Date(year, spanishMonths[monthName], day).getTime();
    }
  }
  const direct = new Date(orderDateStr);
  if (!isNaN(direct.getTime())) return direct.getTime();
  return 0;
};

/**
 * Helper para calcular la antigüedad de una compra y si está dentro de los 7 días de garantía para devolución
 */
export const getReturnEligibility = (orderDateStr: string) => {
  if (!orderDateStr || orderDateStr.toLowerCase().includes('reciente')) {
    return {
      isEligible: true,
      daysElapsed: 0,
      daysLeft: 7,
      statusLabel: '7 días restantes'
    };
  }

  let orderDate: Date | null = null;
  const spanishMonths: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11
  };

  const match = orderDateStr.toLowerCase().match(/(\d{1,2})\s+de\s+([a-záéíóúñ]+)\s+(?:de\s+)?(\d{4})/);
  if (match) {
    const day = parseInt(match[1], 10);
    const monthName = match[2].normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const year = parseInt(match[3], 10);
    if (spanishMonths[monthName] !== undefined) {
      orderDate = new Date(year, spanishMonths[monthName], day);
    }
  } else {
    const direct = new Date(orderDateStr);
    if (!isNaN(direct.getTime())) orderDate = direct;
  }

  if (!orderDate) {
    return {
      isEligible: true,
      daysElapsed: 1,
      daysLeft: 6,
      statusLabel: '6 días restantes'
    };
  }

  const now = new Date();
  const diffTime = Math.max(0, now.getTime() - orderDate.getTime());
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const isEligible = daysElapsed <= 7;
  const daysLeft = Math.max(0, 7 - daysElapsed);

  return {
    isEligible,
    daysElapsed,
    daysLeft,
    statusLabel: isEligible
      ? (daysLeft === 0 ? 'Último día disponible' : `${daysLeft} día${daysLeft > 1 ? 's' : ''} restante${daysLeft > 1 ? 's' : ''}`)
      : `Plazo de 7 días expirado (+${daysElapsed} días)`
  };
};

// Helper para generar una fecha reciente válida dentro de la ventana de 7 días de garantía para testeo de devolución
export const getRecentTestOrderDateStr = (): string => {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const minRef = new Date(2026, 9, 18).getTime();
  const refTime = Math.max(Date.now() - 24 * 60 * 60 * 1000, minRef);
  const d = new Date(refTime);
  const day = String(d.getDate()).padStart(2, '0');
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} de ${month} ${year}`;
};

export const resolveCatalogProductForOrderItem = (
  rawProductId: string,
  fallbackTitle?: string,
  catalogList: ProductStockDetail[] = []
): ProductStockDetail => {
  const list = catalogList.length > 0 ? catalogList : (INITIAL_PRODUCTS as ProductStockDetail[]);
  const exact = list.find(p => p.id === rawProductId);
  if (exact) return exact;

  const legacyIdMap: Record<string, string> = {
    prod_test_return_hoodie_01: 'prod_cyber_hoodie_01',
    prod_test_return_cargo_02: 'prod_goth_cargo_02',
    prod_gothic_cargo_02: 'prod_goth_cargo_02',
    prod_collar_chain_04: 'prod_metal_choker_04',
    prod_baguette_bag_03: 'prod_cartera_holographic_05',
    prod_acid_babytee_05: 'prod_chaqueta_windbreaker_sale_11'
  };

  const mappedTargetId = legacyIdMap[rawProductId];
  if (mappedTargetId) {
    const mappedProd = list.find(p => p.id === mappedTargetId);
    if (mappedProd) return mappedProd;
  }

  if (fallbackTitle) {
    const byTitle = list.find(
      p => p.title.trim().toLowerCase() === fallbackTitle.trim().toLowerCase()
    );
    if (byTitle) return byTitle;
  }

  return list[0];
};

export const resolveCatalogSizeForOrderItem = (rawSize: string, prod: ProductStockDetail): string => {
  const sizes = prod.sizes || [];
  if (sizes.length === 0) return 'Talla Única';
  const clean = (rawSize || '').trim();
  if (sizes.includes(clean)) return clean;
  const prefix = clean.split(' ')[0].toUpperCase();
  const matched = sizes.find(s => s.toUpperCase().startsWith(`${prefix} `));
  return matched || sizes[1] || sizes[0];
};

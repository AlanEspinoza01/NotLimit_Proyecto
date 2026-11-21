import {
  BASE_3KG_RATES_FROM_V_REGION
} from '../../../services/shippingQuotesEngine';
import { INITIAL_REVIEWS, INITIAL_PRODUCTS } from '../../../services/mockData';
import { Review } from '../../../types';
import { AdminCouponTemplate } from '../../../services/couponsService';
import {
  NOLIMITS_PRIVACY_TITLE,
  NOLIMITS_PRIVACY_TEXT,
  NOLIMITS_PRIVACY_FOOTER,
  NOLIMITS_TERMS_TITLE,
  NOLIMITS_TERMS_TEXT
} from '../../legal/legalCopy';

// ============================================================================
// TABS PRINCIPALES DEL EDITOR MAESTRO
// ============================================================================
export type EditorTab =
  | 'informativas'
  | 'home_media'
  | 'slider'
  | 'resenas'
  | 'envios'
  | 'cupones'
  | 'categorias'
  | 'fondo';

// ============================================================================
// 1. CONSTANTES Y TIPOS PARA PÁGINAS INFORMATIVAS
// ============================================================================
export type InformativeSectionKey =
  | 'quienesSomos'
  | 'comoPagar'
  | 'mediosDePago'
  | 'politicasPrivacidad'
  | 'terminosCondiciones'
  | 'metodosEnvio'
  | 'retiroSucursal'
  | 'cambiosDevoluciones';

export interface InformativeConfig {
  whatsappNumber: string;
  instagramUrl: string;
  tiktokUrl: string;
  // 1. Quienes Somos
  quienesSomosBanner: string;
  quienesSomos: string;
  quienesSomosFooter: string;
  // 2. Cómo Pagar / Cómo Comprar
  comoPagarTitle: string;
  comoPagar: string;
  // 3. Medios de Pago
  mediosDePagoBanner: string;
  mediosDePagoIntro: string;
  mediosDePago: string;
  mediosDePagoFooter: string;
  // 4. Políticas de Privacidad
  politicasPrivacidadTitle: string;
  politicasPrivacidad: string;
  politicasPrivacidadFooter: string;
  // 5. Términos y Condiciones
  terminosCondicionesTitle: string;
  terminosCondiciones: string;
  // 6. Métodos de Envío
  metodosEnvioTitle: string;
  metodosEnvioStarken: string;
  metodosEnvioBlue: string;
  metodosEnvioPaket: string;
  metodosEnvio: string;
  metodosEnvioFooter: string;
  // 7. Retiro en Sucursal
  retiroSucursalTitle: string;
  retiroSucursalVina: string;
  retiroSucursalValpo: string;
  retiroSucursalQuilpue: string;
  retiroSucursal: string;
  retiroSucursalFooter: string;
  // 8. Cambios y Devoluciones
  cambiosDevolucionesTitle: string;
  cambiosDevoluciones: string;
}

export const STORAGE_INFORMATIVE_KEY = 'nl_admin_informative_config_v1';
export const STORAGE_SLIDER_KEY = 'nolimits_home_carousel_slides_v2';
export const STORAGE_SLIDER_SPEED_KEY = 'nolimits_home_carousel_speed_v1';
export const STORAGE_REVIEWS_KEY = 'nl_admin_reviews_catalog_v1';
export const STORAGE_SHIPPING_RATES_KEY = 'nl_admin_shipping_rates_matrix_v1';
export const STORAGE_SHIPPING_HISTORY_KEY = 'nl_admin_shipping_rates_history_v1';
export const STORAGE_COUPONS_KEY = 'nl_admin_coupons_catalog_v1';

export type ShippingRatesMatrix = Record<
  string,
  Record<string, Record<string, Record<WeightTierKey, number>>>
>;

export interface ShippingMatrixSnapshot {
  id: string;
  date: string;
  actionLabel: string;
  matrix: ShippingRatesMatrix;
}

export const DEFAULT_INFORMATIVE_CONFIG: InformativeConfig = {
  whatsappNumber: '+56 9 8451 9283',
  instagramUrl: 'https://instagram.com/nolimits.chile',
  tiktokUrl: 'https://tiktok.com/@nolimits.cyber',
  // 1. Quienes Somos
  quienesSomosBanner: '⚡ NOLIMITS APPAREL CORE // CHILE',
  quienesSomos:
    'NoLimits es una marca chilena pionera en indumentaria urbana alternativa, cyber-gótica y streetwear técnico inspirada en la estética nostálgica de Windows XP y los años 2000.\n\nNuestras colecciones se fabrican con altos estándares de gramaje y durabilidad, diseñadas para quienes buscan un estilo audaz, cortes oversized y siluetas auténticas.',
  quienesSomosFooter:
    'Puntos de presencia física: Mall Marina Studio (Viña del Mar), Valparaíso Cerro Alegre Drop Store y Quilpué Drop Hub.',
  // 2. Cómo Pagar / Cómo Comprar
  comoPagarTitle: '¿Cómo comprar en NoLimits?',
  comoPagar:
    '1. Explora el Catálogo: Selecciona tus prendas favoritas y escoge tu talla.\n2. Agrega al Carro: Presiona "Agregar al Carro" para asegurar tu stock físico en tiempo real.\n3. Datos del Titular (Paso 1): Completa tus nombres, apellidos, RUT chileno (con máscara automática), teléfono y correo electrónico.\n4. Selecciona Retiro o Despacho (Paso 2): Escoge retiro inmediato en nuestras sucursales físicas (sin costo) o envío a domicilio por courier (Starken, bluexpress o Paket).\n5. Pago Seguro (Paso 3): Presiona "Proceder con el Pago" para ingresar a la pasarela protegida de Transbank Webpay Plus.',
  // 3. Medios de Pago
  mediosDePagoBanner: 'Pasarela Oficial Transbank Webpay Plus (Cifrado SSL 128-Bits)',
  mediosDePagoIntro: 'Aceptamos todos los medios de pago bancarios nacionales chilenos:',
  mediosDePago:
    '• Tarjetas de Débito: Redcompra, CuentaRUT, Cuenta Corriente de cualquier banco chileno.\n• Tarjetas de Crédito: Visa, Mastercard, Magna, American Express, Diners.\n• Tarjetas de Prepago Digital: Tenpo, MACH, Mercado Pago.',
  mediosDePagoFooter: '✓ Transacciones directas y seguras procesadas por los servidores de Transbank.',
  // 4 y 5. Documentos legales redactados para el e-commerce NoLimits.
  politicasPrivacidadTitle: NOLIMITS_PRIVACY_TITLE,
  politicasPrivacidad: NOLIMITS_PRIVACY_TEXT,
  politicasPrivacidadFooter: NOLIMITS_PRIVACY_FOOTER,
  terminosCondicionesTitle: NOLIMITS_TERMS_TITLE,
  terminosCondiciones: NOLIMITS_TERMS_TEXT,
  // 6. Métodos de Envío
  metodosEnvioTitle: 'Couriers Oficiales de Despacho a Todo Chile',
  metodosEnvioStarken:
    '1. Starken: Cobertura nacional a domicilio y agencias de Arica a Punta Arenas. Plazo: 24 a 72 hrs hábiles.',
  metodosEnvioBlue:
    '2. bluexpress: Despacho express regional y metropolitano con seguimiento satelital paso a paso.',
  metodosEnvioPaket:
    '3. Paket: Envíos urbanos inteligentes con tarifa competitiva en comunas centrales.',
  metodosEnvio:
    'Despachamos a todo el territorio chileno con 3 agencias oficiales: Starken, bluexpress y Paket.',
  metodosEnvioFooter:
    '* El número de seguimiento (tracking) se enviará directamente a tu correo electrónico una vez despachado el paquete.',
  // 7. Retiro en Sucursal
  retiroSucursalTitle: 'Retiro Inmediato Gratuito ($0 CLP) en 15 Minutos',
  retiroSucursalVina:
    'Sucursal Viña del Mar - Mall Marina Studio\nAv. Libertad 1348, Local 204 · hora de retiro entre 10:00 hasta 20:30 hrs',
  retiroSucursalValpo:
    'Sucursal Valparaíso - Cerro Alegre Drop Store\nCalle Urriola 450 · hora de retiro entre 10:30 hasta 19:30 hrs',
  retiroSucursalQuilpue:
    'Sucursal Quilpué - Centro Drop Hub\nLos Carrera 880, Edificio Sol · hora de retiro entre 11:00 hasta 20:00 hrs',
  retiroSucursal:
    'Retiro Inmediato Gratuito ($0 CLP) en nuestras 3 tiendas físicas de Viña del Mar, Valparaíso y Quilpué.',
  retiroSucursalFooter:
    '✓ Para retirar solo debes presentar tu cédula de identidad o el número de orden de compra.',
  // 8. Cambios y Devoluciones
  cambiosDevolucionesTitle: 'Garantía de Satisfacción y Cambio de Tallas',
  cambiosDevoluciones:
    'Si la talla no te acomoda o requieres cambiar tu prenda, cuentas con 30 días corridos desde la fecha de recepción para solicitar cambio o devolución.\n• La prenda debe encontrarse sin uso, sin lavar y con sus etiquetas originales intactas.\n• Puedes realizar el cambio directamente en cualquiera de nuestras sucursales físicas sin costo adicional.\n• Para cambios por despacho, puedes coordinarlo mediante nuestra Mesa de Ayuda de WhatsApp.'
};

// ============================================================================
// 2. CONSTANTES PARA EL SLIDER (MÁXIMO 8 IMÁGENES)
// ============================================================================
export interface SliderItem {
  id: string;
  imageUrl: string;
  title: string;
  tag?: string;
  link?: string;
}

export const DEFAULT_SLIDES: SliderItem[] = [
  {
    id: 'slide-1',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1600&auto=format&fit=crop&q=85',
    title: 'NEW DROP CYBER-GOTHIC 2026 // COLECCIÓN LIMITADA',
    tag: 'DROP EXCLUSIVO',
    link: '/catalog'
  },
  {
    id: 'slide-2',
    imageUrl: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1600&auto=format&fit=crop&q=85',
    title: 'HEAVYWEIGHT OVERSIZED HOODIES & TECHWEAR CHILE',
    tag: 'INDUMENTARIA URBANA',
    link: '/catalog'
  },
  {
    id: 'slide-3',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1600&auto=format&fit=crop&q=85',
    title: 'RETIRO GRATUITO EN TIENDAS VIÑA DEL MAR & VALPARAÍSO',
    tag: 'STOCKS EN VIVO',
    link: '/cart'
  },
  {
    id: 'slide-4',
    imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1600&auto=format&fit=crop&q=85',
    title: 'ACCESORIOS Y2K, CARTERAS BAGUETTE & CADENAS DARK METAL',
    tag: 'ACCESORIOS DROP',
    link: '/catalog'
  },
  {
    id: 'slide-5',
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=1600&auto=format&fit=crop&q=85',
    title: 'TACTICAL PARACHUTE CARGOS // SILUETA NOVENTERA BAGGY',
    tag: 'PANTALONES & CARGOS',
    link: '/catalog'
  },
  {
    id: 'slide-6',
    imageUrl: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1600&auto=format&fit=crop&q=85',
    title: 'CHAQUETAS DE CUERO VINTAGE & BOMBERS DISTÓPICAS',
    tag: 'OUTERWEAR SPECIAL',
    link: '/catalog'
  },
  {
    id: 'slide-7',
    imageUrl: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=1600&auto=format&fit=crop&q=85',
    title: 'POLERAS OVERSIZE ACID WASH & BORDADOS GÓTICOS CROMADOS',
    tag: 'DROP VERANO/OTOÑO',
    link: '/catalog'
  },
  {
    id: 'slide-8',
    imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1600&auto=format&fit=crop&q=85',
    title: 'GORRAS SNAPBACK CYBER & ACCESORIOS STREETWEAR EXCLUSIVOS',
    tag: 'EDICIÓN LIMITADA',
    link: '/catalog'
  }
];

// ============================================================================
// 3. TIPOS PARA CUPONES EXCLUSIVOS (SINCRONIZADO CON PERFIL & PUNTOS)
// ============================================================================
export type CouponItem = AdminCouponTemplate;

// ============================================================================
// 4. TRAMOS DE PESO Y MATRIZ DE ENVÍOS
// ============================================================================
export type WeightTierKey = '0-1KG' | '1KG-3KG' | '3KG-6KG' | '6KG-12KG' | '12KG-20KG';

export const WEIGHT_TIERS: WeightTierKey[] = [
  '0-1KG',
  '1KG-3KG',
  '3KG-6KG',
  '6KG-12KG',
  '12KG-20KG'
];

export const TIER_MULTIPLIERS: Record<WeightTierKey, number> = {
  '0-1KG': 0.72,
  '1KG-3KG': 1.0, // tarifa base 3KG
  '3KG-6KG': 1.15,
  '6KG-12KG': 1.45,
  '12KG-20KG': 1.85
};

export const COURIER_FACTORS: Record<string, number> = {
  starken: 1.0,
  blue_express: 0.94,
  paket: 0.88
};

export const MAX_SHIPPING_HISTORY_SNAPSHOTS = 100;

export function buildDefaultShippingRatesMatrix(): ShippingRatesMatrix {
  const initial: ShippingRatesMatrix = {
    starken: {},
    blue_express: {},
    paket: {}
  };

  ['starken', 'blue_express', 'paket'].forEach((courier) => {
    const cFactor = COURIER_FACTORS[courier] || 1.0;
    Object.keys(BASE_3KG_RATES_FROM_V_REGION).forEach((region) => {
      if (!initial[courier][region]) initial[courier][region] = {};
      const cities = BASE_3KG_RATES_FROM_V_REGION[region];
      Object.keys(cities).forEach((city) => {
        const base3kg = cities[city];
        initial[courier][region][city] = {
          '0-1KG': Math.round((base3kg * cFactor * TIER_MULTIPLIERS['0-1KG']) / 10) * 10,
          '1KG-3KG': Math.round((base3kg * cFactor * TIER_MULTIPLIERS['1KG-3KG']) / 10) * 10,
          '3KG-6KG': Math.round((base3kg * cFactor * TIER_MULTIPLIERS['3KG-6KG']) / 10) * 10,
          '6KG-12KG': Math.round((base3kg * cFactor * TIER_MULTIPLIERS['6KG-12KG']) / 10) * 10,
          '12KG-20KG': Math.round((base3kg * cFactor * TIER_MULTIPLIERS['12KG-20KG']) / 10) * 10
        };
      });
    });
  });

  return initial;
}

export function getCourierDisplayName(courierKey: string): string {
  if (courierKey === 'starken') return 'Starken';
  if (courierKey === 'blue_express') return 'Blue Express';
  if (courierKey === 'paket') return 'Paket';
  return courierKey.toUpperCase();
}

export function formatCLP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$ 0';
  return '$ ' + Math.round(amount).toLocaleString('es-CL');
}

export function formatChileanWhatsApp(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('569')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('56')) {
    digits = digits.slice(2);
    if (digits.startsWith('9')) {
      digits = digits.slice(1);
    }
  }
  const cleanDigits = digits.slice(0, 8);
  if (cleanDigits.length === 0) {
    return '+56 9 ';
  }
  if (cleanDigits.length <= 4) {
    return `+56 9 ${cleanDigits}`;
  }
  return `+56 9 ${cleanDigits.slice(0, 4)} ${cleanDigits.slice(4, 8)}`;
}

// ============================================================================
// 5. HELPERS DE RESEÑAS
// ============================================================================
export function getReviewProductInfo(rev: Review) {
  const found = INITIAL_PRODUCTS.find((p) => p.id === rev.productId);
  return {
    title: rev.productName || found?.title || 'Cyber-Tribal Overkill Zip Hoodie',
    sku: found?.sku || 'NL-CYB-001',
    category: found?.category || 'Polerones & Hoodies',
    price: found?.salePrice || found?.price || 44990,
    image:
      found?.images?.[0] ||
      rev.photos?.[0] ||
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800'
  };
}

export function getReviewUserEmail(rev: Review): string {
  if (rev.userEmail && rev.userEmail.trim()) return rev.userEmail;
  const initialMatch = INITIAL_REVIEWS.find((ir) => ir.id === rev.id);
  if (initialMatch?.userEmail) return initialMatch.userEmail;
  const slug = rev.userName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return `${slug || 'cliente'}@gmail.com`;
}

// ============================================================================
// 6. FONDO PERSONALIZADO DE LA PÁGINA
// ============================================================================
export const STORAGE_BACKGROUND_KEY = 'nl_admin_custom_background_v1';

export interface CustomBackgroundConfig {
  imageUrl: string;
  fileName?: string;
  fitMode?: 'cover' | 'contain' | 'repeat';
  updatedAt?: string;
}

export function loadCustomBackgroundConfig(): CustomBackgroundConfig {
  try {
    const raw = localStorage.getItem(STORAGE_BACKGROUND_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        imageUrl: typeof parsed.imageUrl === 'string' ? parsed.imageUrl : '',
        fileName: typeof parsed.fileName === 'string' ? parsed.fileName : '',
        fitMode:
          parsed.fitMode === 'contain' || parsed.fitMode === 'repeat'
            ? parsed.fitMode
            : 'cover',
        updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : ''
      };
    }
  } catch (e) {}
  return {
    imageUrl: '',
    fileName: '',
    fitMode: 'cover',
    updatedAt: ''
  };
}



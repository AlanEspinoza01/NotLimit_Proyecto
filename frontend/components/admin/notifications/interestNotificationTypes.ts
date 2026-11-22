import React from 'react';
import {
  DollarSign,
  PackageX,
  MessageSquare,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { INITIAL_PRODUCTS } from '../../../services/mockData';
import { ShippingCourierId } from '../../../services/shippingQuotesEngine';
import type { CustomerRecord } from '../customers/customerManagerTypes';

// Claves de almacenamiento local para persistencia
export const STORAGE_ALERTS_KEY = 'nl_admin_system_alerts_v8';
export const STORAGE_PURCHASE_ORDERS_SUPER_KEY = 'nl_super_admin_purchase_orders_v1';
export const STORAGE_PURCHASE_ORDERS_ADMIN_KEY = 'nl_admin_purchase_orders_v1';

// Motivos oficiales de devolución que elige el usuario en el formulario de Solicitud de Devolución
export const OFFICIAL_RETURN_REASONS = [
  'Defecto de fabricación (Costuras, cierres o confección)',
  'Falla o detalle en el material no informado antes de la compra',
  'Producto recibido con daño o falla previa al uso',
  'Error de despacho de la tienda (Producto o medida distinta a la comprada)',
  'Otra falla de fábrica no informada en la publicación'
] as const;

// Esquema de Alertas definitivo (5 categorías oficiales)
export type AlertCategory =
  | 'cobro_pendiente'
  | 'atencion_cliente'
  | 'producto_agotado'
  | 'devolucion'
  | 'producto_personalizado';

export interface AlertProductItem {
  id?: string;
  name: string;
  quantity: number;
  size?: string;
  price?: number;
  sku?: string;
  image?: string;
  images?: string[];
  description?: string;
  category?: string;
  colors?: { name: string; hex: string }[];
  returnReason?: string;
}

export interface AlertShippingAddress {
  region: string;
  comuna: string;
  street: string;
  number?: string;
  apartment?: string;
  postalCode?: string;
  notes?: string;
}

export type AlertStatusFilterValue =
  | 'all'
  | 'active'
  | 'resolved'
  | 'por_cobrar'
  | 'pago_confirmado'
  | 'pago_anulado'
  | 'revision_equipo'
  | 'aprobada_admin'
  | 'rechazada_admin'
  | 'activa'
  | 'resuelta';

export interface SystemAlert {
  id: string;
  category: AlertCategory;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  customerName: string;
  customerRut?: string;
  deliveryType?: 'envio' | 'retiro';
  deliveryMethodText?: string;
  shippingAddress?: AlertShippingAddress;
  trackingCode?: string;
  paymentResolutionStatus?: 'confirmed' | 'cancelled';
  customerPhone: string;
  customerEmail?: string;
  orderNumber?: string;
  amount?: number;
  productName?: string;
  productLink?: string;
  productSku?: string;
  productImage?: string;
  sizeRequested?: string;
  referencePhotos?: string[];
  products?: AlertProductItem[];
  timeLimitText?: string;
  dueHours?: number;
  expiresAt?: string;
  createdAt: string;
  status: 'active' | 'resolved';
  resolvedAt?: string;
  replyNote?: string;
  returnReviewStatus?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  returnReason?: string;
  returnCourier?: ShippingCourierId;
  returnShippingCostCustomerClp?: number;
  returnShippingCostOwnerClp?: number;
  shippingCourier?: ShippingCourierId;
  shippingCostClp?: number;
  isAutomated: boolean;
}

export interface DecisionModalState {
  alert: SystemAlert;
  action: 'confirmar' | 'anular';
  trackingCode: string;
  errorMessage?: string;
}

export interface ConfirmActionModalState {
  alert: SystemAlert;
  action: 'resolve' | 'delete';
}

export interface ProductDetailModalState {
  alert: SystemAlert;
  product: AlertProductItem;
  activeImageIndex: number;
}

export interface ReturnReviewModalState {
  alert: SystemAlert;
  decision: 'approved' | 'rejected' | null;
  rejectionReason: string;
  trackingCode: string;
  errorMessage?: string;
}

export interface ReferencePhotosModalState {
  alert: SystemAlert;
  photos: string[];
  activeIndex: number;
}

export interface AddCustomerReportModalState {
  alert: SystemAlert;
  customer: CustomerRecord;
  targetType: 'preferencial' | 'negra';
  reason: string;
  debtAmount: string;
  benefit: string;
  notes: string;
  errorMessage?: string;
}

export type CategoryCountMap = Record<
  AlertCategory,
  { total: number; active: number; amount: number }
>;

// Configuración visual por categoría
export const ALERT_CATEGORY_CONFIG: Record<
  AlertCategory,
  {
    label: string;
    badgeBg: string;
    borderCol: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    description: string;
  }
> = {
  cobro_pendiente: {
    label: 'Cobro Pendiente',
    badgeBg: 'bg-rose-700',
    borderCol: 'border-rose-400',
    icon: DollarSign,
    description: 'Reservas impagas y transferencias pendientes con liberación de stock'
  },
  atencion_cliente: {
    label: 'Atención al Cliente',
    badgeBg: 'bg-blue-700',
    borderCol: 'border-blue-400',
    icon: MessageSquare,
    description: 'Consultas de clientes, cambios de dirección y soporte prioritario'
  },
  producto_agotado: {
    label: 'Solicitud de Producto Agotado',
    badgeBg: 'bg-purple-700',
    borderCol: 'border-purple-400',
    icon: PackageX,
    description: 'Clientes en lista de espera para reposición y drops de stock'
  },
  devolucion: {
    label: 'Solicitud de Devolución',
    badgeBg: 'bg-amber-700',
    borderCol: 'border-amber-400',
    icon: RefreshCw,
    description: 'Cambios de talla, reembolsos y solicitudes de garantía'
  },
  producto_personalizado: {
    label: 'Solicitud de Productos Personalizado',
    badgeBg: 'bg-emerald-700',
    borderCol: 'border-emerald-400',
    icon: Sparkles,
    description: 'Encargos a medida, personalizaciones Y2K y diseños exclusivos'
  }
};

// Datos iniciales de demostración organizados según el esquema definitivo
export const INITIAL_SYSTEM_ALERTS: SystemAlert[] = [
  // 1. Cobro Pendiente (Con RUT cuando es por Envío; incluye correo, modalidad de entrega, agencia de transporte con valor de envío cuando es por Envío, y lista de productos)
  {
    id: 'alert_cp_01',
    category: 'cobro_pendiente',
    title: 'Cobro Pendiente: Reserva en Live Stream #NL-9420',
    description:
      'Cliente Ignacio Soto mantiene saldo impago tras reserva en Live con despacho por Starken. Protocolo automático: Si no adjunta comprobante en el tiempo límite, se anula la orden y se liberan las prendas al catálogo público.',
    severity: 'critical',
    customerName: 'Ignacio Soto',
    customerRut: '20.104.992-1',
    deliveryType: 'envio',
    deliveryMethodText: 'Envío a Domicilio — Starken',
    shippingCourier: 'starken',
    shippingCostClp: 3150,
    shippingAddress: {
      region: 'Región de Valparaíso',
      comuna: 'Viña del Mar',
      street: 'Av. Libertad',
      number: '1240',
      apartment: 'Depto 804, Torre B',
      postalCode: '2520000',
      notes: 'Dejar en conserjería principal, portón gris frente a plaza.'
    },
    customerPhone: '+56 9 7123 4499',
    customerEmail: 'ignacio.soto@live.cl',
    orderNumber: 'NL-9420',
    amount: 38990,
    timeLimitText: 'Expira en 2 horas',
    dueHours: 2,
    createdAt: 'Hace 45 min',
    status: 'active',
    isAutomated: true,
    products: [
      {
        id: 'prod_cyber_hoodie_01',
        name: 'Cyber-Tribal Overkill Zip Hoodie',
        quantity: 1,
        size: 'Talla L',
        price: 38990,
        sku: 'NL-CYB-001',
        image:
          INITIAL_PRODUCTS[0]?.images[0] ||
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
        images: INITIAL_PRODUCTS[0]?.images || [
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
          'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800',
          'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800'
        ],
        description:
          INITIAL_PRODUCTS[0]?.description ||
          'Polerón oversize grueso de 480 GSM con serigrafía cromada reflectante Y2K, cierres metálicos dobles, detalles gótico-digitales bordados en mangas y capucha con forro satén púrpura.',
        category: 'Hoodies / Heavyweight',
        colors: INITIAL_PRODUCTS[0]?.colors
      }
    ]
  },
  {
    id: 'alert_cp_02',
    category: 'cobro_pendiente',
    title: 'Cobro Pendiente: Transferencia BancoEstado #NL-8910',
    description:
      'Cliente Valentina Muñoz solicitó plazo para abonar $64.980 por 2 prendas Y2K. En espera de recepción y validación de comprobante bancario antes del corte de inventario.',
    severity: 'warning',
    customerName: 'Valentina Muñoz',
    deliveryType: 'retiro',
    deliveryMethodText: 'Retiro en Tienda (Sucursal Viña del Mar)',
    customerPhone: '+56 9 6611 7733',
    customerEmail: 'valentina.m@live.cl',
    orderNumber: 'NL-8910',
    amount: 64980,
    timeLimitText: 'Plazo 6 horas',
    dueHours: 6,
    createdAt: 'Ayer, 16:30',
    status: 'active',
    isAutomated: true,
    products: [
      {
        id: 'prod_cyber_hoodie_01',
        name: 'Cyber-Tribal Overkill Zip Hoodie',
        quantity: 1,
        size: 'Talla M',
        price: 38990,
        sku: 'NL-CYB-001',
        image:
          INITIAL_PRODUCTS[0]?.images[0] ||
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
        images: INITIAL_PRODUCTS[0]?.images || [
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
          'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800',
          'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800'
        ],
        description:
          INITIAL_PRODUCTS[0]?.description ||
          'Polerón oversize grueso de 480 GSM con serigrafía cromada reflectante Y2K.',
        category: 'Hoodies / Heavyweight',
        colors: INITIAL_PRODUCTS[0]?.colors
      },
      {
        id: 'prod_gorra_trucker_07',
        name: 'Gorra Foam Trucker "NoLimits" Y2K Glitch',
        quantity: 1,
        size: 'Talla Única',
        price: 25990,
        sku: 'NL-CAP-007',
        image:
          INITIAL_PRODUCTS[6]?.images[0] ||
          'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
        images: [
          INITIAL_PRODUCTS[6]?.images[0] ||
            'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
          'https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=800',
          'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800'
        ],
        description:
          INITIAL_PRODUCTS[6]?.description ||
          'Gorra trucker de espuma frontal con panel trasero de malla transpirable, visera semicurva y parche bordado con tipografía pixel y cromo.',
        category: 'Jockey / Trucker',
        colors: INITIAL_PRODUCTS[6]?.colors
      }
    ]
  },
  {
    id: 'alert_cp_03',
    category: 'cobro_pendiente',
    title: 'Cobro Pendiente: Reserva con Despacho #NL-9428',
    description:
      'Cliente Sebastián Riquelme reservó 1 pantalón cargo Y2K con envío a domicilio mediante Blue Express. En espera de transferencia bancaria para liberar orden a despacho.',
    severity: 'warning',
    customerName: 'Sebastián Riquelme',
    customerRut: '19.882.410-3',
    deliveryType: 'envio',
    deliveryMethodText: 'Envío a Domicilio — Blue Express',
    shippingCourier: 'blue_express',
    shippingCostClp: 5110,
    shippingAddress: {
      region: 'Región Metropolitana de Santiago',
      comuna: 'Providencia',
      street: 'Av. Providencia',
      number: '1980',
      apartment: 'Depto 1102',
      postalCode: '7500000',
      notes: 'Conserjería 24 hrs.'
    },
    customerPhone: '+56 9 8341 2290',
    customerEmail: 'seba.riquelme@gmail.com',
    orderNumber: 'NL-9428',
    amount: 35990,
    timeLimitText: 'Expira en 4 horas',
    dueHours: 4,
    createdAt: 'Hace 1 hora',
    status: 'active',
    isAutomated: true,
    products: [
      {
        id: 'prod_goth_cargo_02',
        name: 'Gothic Parachute Multipocket Cargo',
        quantity: 1,
        size: '42 (Chile) - 32 (USA/W)',
        price: 35990,
        sku: 'NL-PAN-002',
        image:
          INITIAL_PRODUCTS[1]?.images[0] ||
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
        images: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800'
        ],
        description:
          INITIAL_PRODUCTS[1]?.description ||
          'Pantalón parachute técnico con tiradores metálicos cromados, correas góticas desmontables y rodillas reforzadas.',
        category: 'Pantalones / Parachute',
        colors: INITIAL_PRODUCTS[1]?.colors
      }
    ]
  },
  {
    id: 'alert_cp_04',
    category: 'cobro_pendiente',
    title: 'Cobro Pendiente: Reserva Live Drop #NL-9431',
    description:
      'Cliente Martina Cáceres mantiene reserva pendiente de pago con envío a domicilio por Paket Express hacia Quilpué.',
    severity: 'info',
    customerName: 'Martina Cáceres',
    customerRut: '21.045.772-K',
    deliveryType: 'envio',
    deliveryMethodText: 'Envío a Domicilio — Paket Express',
    shippingCourier: 'paket',
    shippingCostClp: 2990,
    shippingAddress: {
      region: 'Región de Valparaíso',
      comuna: 'Quilpué',
      street: 'Av. Los Carrera',
      number: '740',
      apartment: 'Casa 4',
      postalCode: '2430000',
      notes: 'Timbre exterior.'
    },
    customerPhone: '+56 9 9410 5521',
    customerEmail: 'martina.caceres@outlook.cl',
    orderNumber: 'NL-9431',
    amount: 19990,
    timeLimitText: 'Expira en 8 horas',
    dueHours: 8,
    createdAt: 'Hoy, 11:20',
    status: 'active',
    isAutomated: true,
    products: [
      {
        id: 'prod_vintage_tee_03',
        name: 'Windows XP Glitch 2000 Graphic Tee',
        quantity: 1,
        size: 'Talla M',
        price: 19990,
        sku: 'NL-TEE-003',
        image:
          INITIAL_PRODUCTS[2]?.images[0] ||
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800'
        ],
        description:
          INITIAL_PRODUCTS[2]?.description ||
          'Polera de algodón peinado 240g con estampado frontal estilo BSOD y vector Y2K en serigrafía tacto cero.',
        category: 'Poleras / Graphic Tees',
        colors: INITIAL_PRODUCTS[2]?.colors
      }
    ]
  },

  // 2. Atención al Cliente (Sin orden, sin monto, sin plazo, sin producto)
  {
    id: 'alert_ac_01',
    category: 'atencion_cliente',
    title: 'Consulta General: Factibilidad de Envío Express a Valparaíso',
    description:
      'Cliente Diego Aravena consulta vía formulario de soporte sobre tiempos de entrega para festival en Valparaíso este fin de semana.',
    severity: 'warning',
    customerName: 'Diego Aravena',
    customerPhone: '+56 9 6632 1109',
    customerEmail: 'diego.aravena@yahoo.com',
    createdAt: 'Hace 20 min',
    status: 'active',
    isAutomated: true
  },
  {
    id: 'alert_ac_02',
    category: 'atencion_cliente',
    title: 'Cambio de Dirección de Despacho Domiciliario',
    description:
      'Cliente Constanza Rivera solicita rectificar numeración en Quilpué (Calle Los Carrera #1420 Depto 302). Notificación automática generada tras solicitud ingresada en portal de soporte.',
    severity: 'info',
    customerName: 'Constanza Rivera',
    customerPhone: '+56 9 8812 4433',
    customerEmail: 'cony.rivera.y2k@gmail.com',
    createdAt: 'Hace 1 hora',
    status: 'active',
    isAutomated: true
  },

  // 3. Solicitud de Producto Agotado (Con RUT, sin Plazo/Expiración)
  {
    id: 'alert_pa_01',
    category: 'producto_agotado',
    title: 'Solicitud de Agotado: Chaleco Táctico Cyber-Rave Arnés Cromado',
    description:
      'Cliente Camila Henríquez intentó comprar durante Drop pero la Talla L se encontraba agotada. Solicita aviso inmediato de reposición o confirmación de retiro en tienda física de Viña del Mar.',
    severity: 'critical',
    customerName: 'Camila Henríquez',
    customerRut: '18.332.198-K',
    customerPhone: '+56 9 8451 9283',
    customerEmail: 'camila.henriquez@gmail.com',
    productName: 'Chaleco Táctico Cyber-Rave Arnés Cromado [EDICIÓN AGOTADA]',
    productSku: 'NL-VST-012',
    productImage:
      INITIAL_PRODUCTS[11]?.images[0] ||
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
    sizeRequested: 'Talla L',
    amount: 38990,
    createdAt: '2026-10-20 08:30',
    status: 'active',
    isAutomated: true
  },
  {
    id: 'alert_pa_02',
    category: 'producto_agotado',
    title: 'Solicitud de Agotado: Cyber-Tribal Overkill Zip Hoodie',
    description:
      'Cliente Matías Berríos busca polerón en talla XL para despacho a Santiago. Agotado en drop anterior. Desea reserva preferente antes del próximo Live Stream.',
    severity: 'warning',
    customerName: 'Matías Berríos',
    customerRut: '20.334.881-9',
    customerPhone: '+56 9 9234 1188',
    customerEmail: 'matias.berrios.y2k@hotmail.com',
    productName: 'Cyber-Tribal Overkill Zip Hoodie',
    productSku: 'NL-CYB-001',
    productImage:
      INITIAL_PRODUCTS[0]?.images[0] ||
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
    sizeRequested: 'Talla XL',
    amount: 49990,
    createdAt: '2026-10-19 19:45',
    status: 'active',
    isAutomated: true
  },

  // 4. Solicitud de Devolución
  {
    id: 'alert_dev_01',
    category: 'devolucion',
    title: 'Solicitud de Devolución #DEV-1044: Gothic Parachute Multipocket Cargo',
    description:
      'Cliente Francisca Silva ingresó solicitud de devolución por defecto de fabricación en costuras laterales de su orden #NL-8790 y seleccionó envío de retorno por Paket Express (al cliente le sale $0 CLP porque el envío lo paga el dueño). Adjunta 3 fotografías de respaldo.',
    severity: 'warning',
    customerName: 'Francisca Silva',
    customerRut: '19.442.810-5',
    deliveryType: 'envio',
    deliveryMethodText: 'Devolución por Envío — Paket Express',
    shippingAddress: {
      region: 'Región de Valparaíso',
      comuna: 'Viña del Mar',
      street: 'Av. Libertad',
      number: '1348',
      apartment: 'Depto 602',
      postalCode: '2520000',
      notes: 'Conserjería habilitada 24/7 para retiro o recepción por Paket Express.'
    },
    customerPhone: '+56 9 5543 9921',
    customerEmail: 'francisca.silva.m@gmail.com',
    orderNumber: 'NL-8790',
    productName: 'Gothic Parachute Multipocket Cargo',
    productSku: 'NL-PAN-002',
    productImage:
      INITIAL_PRODUCTS[1]?.images[0] ||
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
    sizeRequested: '42 (Chile) - 32 (USA/W)',
    amount: 35990,
    createdAt: 'Hoy, 10:15',
    status: 'active',
    returnReviewStatus: 'pending',
    returnReason: 'Defecto de fabricación (Costuras, cierres o confección)',
    returnCourier: 'paket',
    returnShippingCostCustomerClp: 0,
    returnShippingCostOwnerClp: 2990,
    isAutomated: true,
    products: [
      {
        id: 'prod_goth_cargo_02',
        name: 'Gothic Parachute Multipocket Cargo',
        quantity: 1,
        size: '42 (Chile) - 32 (USA/W)',
        price: 35990,
        sku: 'NL-PAN-002',
        image:
          INITIAL_PRODUCTS[1]?.images[0] ||
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
        images: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
          'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800',
          'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800'
        ],
        description:
          INITIAL_PRODUCTS[1]?.description ||
          'Pantalón parachute técnico con tiradores metálicos cromados, correas góticas desmontables y rodillas reforzadas.',
        category: 'Pantalones / Parachute',
        colors: INITIAL_PRODUCTS[1]?.colors,
        returnReason: 'Defecto de fabricación (Costuras, cierres o confección)'
      }
    ]
  },
  {
    id: 'alert_dev_02',
    category: 'devolucion',
    title: 'Solicitud de Devolución #DEV-1045: Cadena Cyber-Choker & Graphic Tee',
    description:
      'Cliente Lucas Peña reporta producto recibido con falla en el mosquetón de cierre al abrir encomienda y solicita devolución de 2 artículos de su orden #NL-8802 mediante envío de retorno por Starken (envío pagado por el usuario). Adjunta fotografías de evidencia.',
    severity: 'info',
    customerName: 'Lucas Peña',
    customerRut: '20.771.339-2',
    deliveryType: 'envio',
    deliveryMethodText: 'Devolución por Envío — Starken',
    shippingAddress: {
      region: 'Región Metropolitana de Santiago',
      comuna: 'Providencia',
      street: 'Av. Nueva Providencia',
      number: '2155',
      apartment: 'Oficina 502',
      postalCode: '7500000',
      notes: 'Recepción habilitada de 09:00 a 18:30 hrs. Llamar al llegar.'
    },
    customerPhone: '+56 9 7722 8844',
    customerEmail: 'lucas.pena@outlook.cl',
    orderNumber: 'NL-8802',
    productName: 'Cybernetic Chrome Spiked Collar & Chain',
    productSku: 'NL-ACC-004',
    productImage:
      INITIAL_PRODUCTS[3]?.images[0] ||
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
    sizeRequested: 'Talla Única',
    amount: 38980,
    createdAt: 'Ayer, 18:20',
    status: 'active',
    returnReviewStatus: 'pending',
    returnReason: 'Producto recibido con daño o falla previa al uso',
    returnCourier: 'starken',
    returnShippingCostCustomerClp: 5110,
    returnShippingCostOwnerClp: 0,
    isAutomated: true,
    products: [
      {
        id: 'prod_metal_choker_04',
        name: 'Cybernetic Chrome Spiked Collar & Chain',
        quantity: 1,
        size: 'Talla Única',
        price: 18990,
        sku: 'NL-ACC-004',
        image:
          INITIAL_PRODUCTS[3]?.images[0] ||
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
        images: [
          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
          'https://images.unsplash.com/photo-1611591475152-47354c5ec054?w=800'
        ],
        description:
          INITIAL_PRODUCTS[3]?.description ||
          'Choker gótico de aleación de zinc hipoalergénica con acabado cromado espejo, eslabones industriales y remates en punta biselada.',
        category: 'Accesorios / Chrome',
        colors: INITIAL_PRODUCTS[3]?.colors,
        returnReason: 'Producto recibido con daño o falla previa al uso'
      },
      {
        id: 'prod_vintage_tee_03',
        name: 'Windows XP Glitch 2000 Graphic Tee',
        quantity: 1,
        size: 'Talla L',
        price: 19990,
        sku: 'NL-TEE-003',
        image:
          INITIAL_PRODUCTS[2]?.images[0] ||
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800'
        ],
        description:
          INITIAL_PRODUCTS[2]?.description ||
          'Polera de algodón peinado 240g con estampado frontal estilo BSOD y vector Y2K en serigrafía tacto cero.',
        category: 'Poleras / Graphic Tees',
        colors: INITIAL_PRODUCTS[2]?.colors,
        returnReason: 'Producto recibido con daño o falla previa al uso'
      }
    ]
  },
  {
    id: 'alert_dev_03',
    category: 'devolucion',
    title: 'Solicitud de Devolución #DEV-1046: Chaqueta Biker Cyber-Goth Cuero Vegano',
    description:
      'Cliente Javiera Morales solicita devolución por falla o detalle en el material no informado antes de la compra de su orden #NL-8955 mediante envío por Blue Express (envío pagado por el usuario). Adjunta fotografías del detalle.',
    severity: 'warning',
    customerName: 'Javiera Morales',
    customerRut: '20.118.490-7',
    deliveryType: 'envio',
    deliveryMethodText: 'Devolución por Envío — Blue Express',
    shippingAddress: {
      region: 'Región de Valparaíso',
      comuna: 'Quilpué',
      street: 'Av. Los Carrera',
      number: '880',
      apartment: 'Depto 404',
      postalCode: '2430000',
      notes: 'Entregar o retirar en recepción del Edificio Sol.'
    },
    customerPhone: '+56 9 6128 4402',
    customerEmail: 'javiera.morales@gmail.com',
    orderNumber: 'NL-8955',
    productName: 'Chaqueta Biker Cyber-Goth Cuero Vegano con Cierres Y2K',
    productSku: 'NL-JKT-010',
    productImage:
      INITIAL_PRODUCTS[9]?.images[0] ||
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
    sizeRequested: 'Talla L',
    amount: 68990,
    createdAt: 'Ayer, 15:40',
    status: 'active',
    returnReviewStatus: 'pending',
    returnReason: 'Falla o detalle en el material no informado antes de la compra',
    returnCourier: 'blue_express',
    returnShippingCostCustomerClp: 3830,
    returnShippingCostOwnerClp: 0,
    isAutomated: true,
    products: [
      {
        id: 'prod_chaqueta_biker_10',
        name: 'Chaqueta Biker Cyber-Goth Cuero Vegano con Cierres Y2K',
        quantity: 1,
        size: 'Talla L',
        price: 68990,
        sku: 'NL-JKT-010',
        image:
          INITIAL_PRODUCTS[9]?.images[0] ||
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
        images: [
          INITIAL_PRODUCTS[9]?.images[0] ||
            'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
          'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800'
        ],
        description:
          INITIAL_PRODUCTS[9]?.description ||
          'Chaqueta biker estructurada en cuero vegano de alto espesor con herrajes cromados y cierres diagonales Y2K.',
        category: 'Ropa Superior / Chaquetas',
        colors: INITIAL_PRODUCTS[9]?.colors,
        returnReason: 'Falla o detalle en el material no informado antes de la compra'
      }
    ]
  },

  // 5. Solicitud de Productos Personalizado
  {
    id: 'alert_cust_01',
    category: 'producto_personalizado',
    title: 'Encargo Personalizado: Hoodie Cyber-Tribal Custom Print & Argollas',
    description:
      'Cliente Benjamín Castro solicita personalización exclusiva con parches reflectantes Y2K y argollas metálicas extra para show musical en Santiago. Adjunta 10 fotografías de referencia del diseño, costuras y herrajes.',
    severity: 'warning',
    customerName: 'Benjamín Castro',
    customerRut: '20.512.884-3',
    customerPhone: '+56 9 9123 6677',
    customerEmail: 'benja.castro.music@gmail.com',
    productName: 'Hoodie Cyber-Tribal Custom Print & Argollas',
    productSku: 'NL-CUST-991',
    productImage:
      INITIAL_PRODUCTS[0]?.images[0] ||
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
    referencePhotos: [
      INITIAL_PRODUCTS[0]?.images[0] ||
        'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
      'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
      'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800'
    ],
    createdAt: 'Hoy, 09:30',
    status: 'active',
    isAutomated: true
  },
  {
    id: 'alert_cust_02',
    category: 'producto_personalizado',
    title: 'Encargo Personalizado: Chaleco Táctico con Bordado Luminiscente',
    description:
      'Solicitud de diseño especial con bordado cyberpunk de logo personalizado en espalda. Cliente envió boceto técnico y fotografías de referencia para confirmar factibilidad.',
    severity: 'info',
    customerName: 'Isidora Valenzuela',
    customerRut: '19.671.402-7',
    customerPhone: '+56 9 4432 7788',
    customerEmail: 'isi.valenzuela@gmail.com',
    productName: 'Chaleco Táctico Bordado Cyberpunk',
    productSku: 'NL-CUST-992',
    productImage:
      INITIAL_PRODUCTS[11]?.images[0] ||
      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
    referencePhotos: [
      INITIAL_PRODUCTS[11]?.images[0] ||
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
      'https://images.unsplash.com/photo-1611591475152-47354c5ec054?w=800',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800',
      'https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=800',
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?w=800',
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800'
    ],
    createdAt: '2026-10-21 14:00',
    status: 'active',
    isAutomated: true
  }
];

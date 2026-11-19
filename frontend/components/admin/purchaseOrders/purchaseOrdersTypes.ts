import { INITIAL_PRODUCTS, INITIAL_BRANCHES } from '../../../services/mockData';

export const STORAGE_ORDERS_KEY = 'nl_super_admin_purchase_orders_v3';

// Métodos de pago sincronizados con el esquema actual
export type OrderPaymentMethod = 'Sistema POS' | 'Khipu' | 'Webpay' | 'Mercado Pago';

// Servicios de transporte sincronizados
export type ShippingCourierType = 'Starken' | 'Blue Express' | 'Paket';

// Todos los 15 Estados del esquema oficial
export type PurchaseOrderStatus =
  | 'Pendiente de Pago'
  | 'Pago Confirmando'
  | 'Pago Anulado'
  | 'Solicitud recibida'
  | 'En Preparación'
  | 'En transito'
  | 'Entregado'
  | 'Listo para el retiro de sucursal'
  | 'Retirado'
  | 'Solicitud de Devolución recibida'
  | 'Revisión de equipo'
  | 'Aprobada por Admin'
  | 'Rechazada por Admin'
  | 'Envió a punto'
  | 'Retiro Presencial';

export interface PurchasedProductItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
  sku?: string;
  image?: string;
  subtotal: number;
}

export interface PurchaseOrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryType: 'Despacho a Domicilio' | 'Retiro en Sucursal';
  branchId: string;
  branchName: string; // Sucursal donde se registró la venta
  registeredByAdmin?: string; // Nombre del admin que registró la venta (Sistema POS)
  pickupBranchId?: string;
  pickupBranchName?: string; // Sucursal donde se realizará el retiro presencial
  shippingAddress?: string;
  shippingCourier?: ShippingCourierType;
  trackingNumber?: string;
  date: string;
  timestamp: number;
  total: number;
  status: PurchaseOrderStatus;
  paymentMethod: OrderPaymentMethod;
  items: PurchasedProductItem[];
  notes?: string;
  statusAuditLog?: { status: PurchaseOrderStatus; timestamp: string; note?: string }[];
}

export interface PendingStatusTransition {
  order: PurchaseOrderRecord;
  nextStatus: PurchaseOrderStatus;
  auditNote: string;
  descriptionText: string;
}

export interface PurchaseOrdersSummaryKPIs {
  totalOrders: number;
  totalRevenue: number;
  pendingPaymentCount: number;
  returnsCount: number;
}

// Helper: Obtiene el nombre del administrador de la sucursal que registró la venta
export const getAdminNameByBranchId = (
  branchId?: string,
  customAdmin?: string,
  branchList: typeof INITIAL_BRANCHES = INITIAL_BRANCHES
): string => {
  if (customAdmin && customAdmin.trim()) return customAdmin.trim();
  const branch =
    branchList.find((b) => b.id === branchId) ||
    INITIAL_BRANCHES.find((b) => b.id === branchId);
  if (branch?.managerName) {
    return branch.managerName.replace(/\s*\(.*?\)\s*/g, '').trim();
  }
  switch (branchId) {
    case 'vina_del_mar':
      return 'Sebastián Valdés';
    case 'valparaiso':
      return 'Camila Rojas';
    case 'quilpue':
      return 'Martín Araya';
    case 'casa_matriz':
      return 'Super Administrador';
    default:
      return 'Sebastián Valdés';
  }
};

// Helper: Solo "Sistema POS" y "Khipu" permiten estados de pago manual/transferencia
export const isManualTransferPayment = (method: OrderPaymentMethod): boolean => {
  return method === 'Sistema POS' || method === 'Khipu';
};

// Estilo de insignia según Método de Pago
export const getPaymentMethodBadge = (method: OrderPaymentMethod): string => {
  switch (method) {
    case 'Sistema POS':
      return 'bg-amber-50 text-amber-950 border-amber-400';
    case 'Khipu':
      return 'bg-emerald-50 text-emerald-950 border-emerald-400';
    case 'Webpay':
      return 'bg-rose-50 text-rose-950 border-rose-400';
    case 'Mercado Pago':
      return 'bg-sky-50 text-sky-950 border-sky-400';
    default:
      return 'bg-gray-100 text-gray-900 border-gray-400';
  }
};

// Descripción y reglas operativas de cada uno de los 15 estados sincronizados
export const STATUS_DEFINITIONS: Record<
  PurchaseOrderStatus,
  { label: string; description: string; badgeClass: string; category: 'pago' | 'operacion' | 'entrega' | 'devolucion' }
> = {
  'Pendiente de Pago': {
    label: 'Pendiente de Pago',
    description: 'Exclusivo Sistema POS / Khipu: Cliente pidió un producto sin dinero en el momento o transferencia en revisión',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-400 font-bold',
    category: 'pago'
  },
  'Pago Confirmando': {
    label: 'Pago Confirmando',
    description: 'Exclusivo Sistema POS / Khipu: Cuando se confirma el pago del cliente antes de pasar a Solicitud recibida',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-400 font-bold',
    category: 'pago'
  },
  'Pago Anulado': {
    label: 'Pago Anulado',
    description: 'Exclusivo Sistema POS / Khipu: Cliente no pagó en el tiempo que correspondía; se anula la orden y se liberan las prendas',
    badgeClass: 'bg-red-100 text-red-900 border-red-400 font-bold',
    category: 'pago'
  },
  'Solicitud recibida': {
    label: 'Solicitud recibida',
    description: 'El pago ya se realizó (directo por Webpay/Mercado Pago o tras confirmar Sistema POS/Khipu)',
    badgeClass: 'bg-cyan-100 text-cyan-900 border-cyan-400 font-bold',
    category: 'operacion'
  },
  'En Preparación': {
    label: 'En Preparación',
    description: 'Los productos solicitados se están preparando y empaquetando en bodega',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-400 font-bold',
    category: 'operacion'
  },
  'En transito': {
    label: 'En transito',
    description: 'Envío: viajando por servicio de transporte (Starken, Blue Express, Paket). Retiro: moviéndose a la sucursal elegida',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-400 font-bold',
    category: 'operacion'
  },
  'Entregado': {
    label: 'Entregado',
    description: 'Exclusivo Envío a Domicilio: Los productos llegaron con éxito al destino solicitado por el cliente',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-500 font-black',
    category: 'entrega'
  },
  'Listo para el retiro de sucursal': {
    label: 'Listo para el retiro de sucursal',
    description: 'Exclusivo Retiro Presencial: Los productos llegaron con éxito a la sucursal donde el cliente decidió retirarlos',
    badgeClass: 'bg-teal-100 text-teal-900 border-teal-500 font-bold',
    category: 'entrega'
  },
  'Retirado': {
    label: 'Retirado',
    description: 'Exclusivo Retiro Presencial: El cliente ya retiró sus productos de la sucursal presencialmente',
    badgeClass: 'bg-green-100 text-green-950 border-green-600 font-black',
    category: 'entrega'
  },
  'Solicitud de Devolución recibida': {
    label: 'Solicitud de Devolución recibida',
    description: 'Cuando llega la notificación de devolución al panel del admin pero aún no la revisa',
    badgeClass: 'bg-orange-100 text-orange-900 border-orange-400 font-bold',
    category: 'devolucion'
  },
  'Revisión de equipo': {
    label: 'Revisión de equipo',
    description: 'El admin ya está revisando la solicitud de devolución y evaluando si rechazar o aceptar',
    badgeClass: 'bg-amber-100 text-amber-950 border-amber-500 font-bold',
    category: 'devolucion'
  },
  'Aprobada por Admin': {
    label: 'Aprobada por Admin',
    description: 'El admin decidió aprobar la solicitud de devolución desde el módulo de notificaciones',
    badgeClass: 'bg-emerald-100 text-emerald-950 border-emerald-600 font-bold',
    category: 'devolucion'
  },
  'Rechazada por Admin': {
    label: 'Rechazada por Admin',
    description: 'El admin decidió rechazar la solicitud de devolución desde el módulo de notificaciones',
    badgeClass: 'bg-rose-100 text-rose-950 border-rose-500 font-bold',
    category: 'devolucion'
  },
  'Envió a punto': {
    label: 'Envió a punto',
    description: 'Exclusivo para los CLIENTES que pidieron hacer su DEVOLUCIÓN por envío a domicilio',
    badgeClass: 'bg-violet-100 text-violet-950 border-violet-500 font-bold',
    category: 'devolucion'
  },
  'Retiro Presencial': {
    label: 'Retiro Presencial',
    description: 'Exclusivo para los CLIENTES que realizan su DEVOLUCIÓN presencialmente en la sucursal que eligieron',
    badgeClass: 'bg-sky-100 text-sky-950 border-sky-500 font-bold',
    category: 'devolucion'
  }
};

// Órdenes iniciales de demostración sincronizadas con las reglas de método de pago y estados
export const DEFAULT_INITIAL_ORDERS: PurchaseOrderRecord[] = [
  {
    id: 'ord_01',
    orderNumber: 'NL-9420',
    customerName: 'Ignacio Soto',
    customerEmail: 'ignacio.soto@live.cl',
    customerPhone: '+56 9 7123 4499',
    deliveryType: 'Despacho a Domicilio',
    branchId: 'vina_del_mar',
    branchName: 'Viña del Mar',
    registeredByAdmin: 'Sebastián Valdés',
    shippingAddress: 'Av. Libertad 1240, Dpto 804, Viña del Mar',
    shippingCourier: 'Starken',
    date: '2026-10-20 18:45',
    timestamp: 1792539900000,
    total: 38990,
    status: 'Pendiente de Pago',
    paymentMethod: 'Sistema POS',
    items: [
      {
        id: 'it_01',
        name: 'Cyber-Tribal Overkill Zip Hoodie',
        quantity: 1,
        price: 38990,
        size: 'Talla L',
        sku: 'NL-HOOD-001',
        image: INITIAL_PRODUCTS[0]?.images[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
        subtotal: 38990
      }
    ],
    notes: 'Reserva manual vía Sistema POS. Transferencia en revisión dentro del plazo establecido.'
  },
  {
    id: 'ord_02',
    orderNumber: 'NL-9419',
    customerName: 'Camila Rojas',
    customerEmail: 'camila.rojas.v@gmail.com',
    customerPhone: '+56 9 8451 9283',
    deliveryType: 'Retiro en Sucursal',
    branchId: 'valparaiso',
    branchName: 'Valparaíso',
    pickupBranchId: 'valparaiso',
    pickupBranchName: 'Valparaíso',
    date: '2026-10-20 17:30',
    timestamp: 1792535400000,
    total: 45990,
    status: 'Pago Confirmando',
    paymentMethod: 'Khipu',
    items: [
      {
        id: 'it_02',
        name: 'Gothic Parachute Multipocket Cargo',
        quantity: 1,
        price: 45990,
        size: 'Talla M',
        sku: 'NL-PAN-002',
        image: INITIAL_PRODUCTS[1]?.images[0] || 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
        subtotal: 45990
      }
    ],
    notes: 'Transferencia Khipu confirmada por administración. Lista para pasar a Solicitud recibida.'
  },
  {
    id: 'ord_03',
    orderNumber: 'NL-9418',
    customerName: 'Franco Navarrete',
    customerEmail: 'franco.n99@live.cl',
    customerPhone: '+56 9 7788 1122',
    deliveryType: 'Despacho a Domicilio',
    branchId: 'quilpue',
    branchName: 'Quilpué',
    shippingAddress: 'Calle Freire 890, Quilpué',
    shippingCourier: 'Blue Express',
    date: '2026-10-20 15:10',
    timestamp: 1792527000000,
    total: 39980,
    status: 'Pago Anulado',
    paymentMethod: 'Khipu',
    items: [
      {
        id: 'it_03',
        name: 'Gorra Foam Trucker "NoLimits" Y2K Glitch',
        quantity: 2,
        price: 19990,
        size: 'Talla Única',
        sku: 'NL-CAP-007',
        image: INITIAL_PRODUCTS[6]?.images[0] || 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
        subtotal: 39980
      }
    ],
    notes: 'Cliente no pagó en el tiempo que correspondía. Orden anulada y prendas liberadas a stock.'
  },
  {
    id: 'ord_15',
    orderNumber: 'NL-9417',
    customerName: 'Nicolás Tapia',
    customerEmail: 'nico.tapia@gmail.com',
    customerPhone: '+56 9 5566 7788',
    deliveryType: 'Despacho a Domicilio',
    branchId: 'vina_del_mar',
    branchName: 'Viña del Mar',
    shippingAddress: 'Álvares 1500, Viña del Mar',
    shippingCourier: 'Paket',
    date: '2026-10-20 13:40',
    timestamp: 1792521600000,
    total: 24990,
    status: 'Solicitud recibida',
    paymentMethod: 'Webpay',
    items: [
      {
        id: 'it_15',
        name: 'Windows XP Glitch 2000 Graphic Tee',
        quantity: 1,
        price: 24990,
        size: 'Talla M',
        sku: 'NL-TEE-003',
        image: INITIAL_PRODUCTS[2]?.images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
        subtotal: 24990
      }
    ],
    notes: 'Compra completada por pasarela Webpay; ingresó directamente a Solicitud recibida.'
  },
  {
    id: 'ord_04',
    orderNumber: 'NL-9416',
    customerName: 'Valeria Neo-Goth',
    customerEmail: 'valeria.k@gmail.com',
    customerPhone: '+56 9 9123 4567',
    deliveryType: 'Despacho a Domicilio',
    branchId: 'vina_del_mar',
    branchName: 'Viña del Mar',
    shippingAddress: 'Av. Borgoño 1420, Reñaca, Viña del Mar',
    shippingCourier: 'Starken',
    date: '2026-10-20 12:20',
    timestamp: 1792516800000,
    total: 68990,
    status: 'En Preparación',
    paymentMethod: 'Mercado Pago',
    items: [
      {
        id: 'it_04',
        name: 'Chaqueta Biker Cyber-Goth Cuero Vegano con Cierres Y2K',
        quantity: 1,
        price: 68990,
        size: 'Talla M',
        sku: 'NL-JKT-010',
        image: INITIAL_PRODUCTS[9]?.images[0] || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
        subtotal: 68990
      }
    ],
    notes: 'Productos solicitados preparándose en bodega para despacho a domicilio.'
  },
  {
    id: 'ord_16',
    orderNumber: 'NL-9415-R',
    customerName: 'Bastián Araya',
    customerEmail: 'bastian.araya@live.cl',
    customerPhone: '+56 9 6234 9901',
    deliveryType: 'Retiro en Sucursal',
    branchId: 'vina_del_mar',
    branchName: 'Viña del Mar',
    registeredByAdmin: 'Sebastián Valdés',
    pickupBranchId: 'quilpue',
    pickupBranchName: 'Quilpué',
    date: '2026-10-20 11:05',
    timestamp: 1792512300000,
    total: 38990,
    status: 'En Preparación',
    paymentMethod: 'Sistema POS',
    items: [
      {
        id: 'it_16',
        name: 'Cyber-Tribal Overkill Zip Hoodie',
        quantity: 1,
        price: 38990,
        size: 'Talla XL',
        sku: 'NL-HOOD-001',
        image: INITIAL_PRODUCTS[0]?.images[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
        subtotal: 38990
      }
    ],
    notes: 'Preparando prenda para traslado a sucursal Quilpué (Retiro en Sucursal).'
  },
  {
    id: 'ord_05',
    orderNumber: 'NL-9414',
    customerName: 'Matías Berríos',
    customerEmail: 'matias.b@hotmail.com',
    customerPhone: '+56 9 9234 1188',
    deliveryType: 'Despacho a Domicilio',
    branchId: 'valparaiso',
    branchName: 'Valparaíso',
    shippingAddress: 'Cerro Alegre, Pasaje Bavestrello 14, Valparaíso',
    shippingCourier: 'Blue Express',
    trackingNumber: 'BX-8829104',
    date: '2026-10-19 19:15',
    timestamp: 1792455300000,
    total: 24990,
    status: 'En transito',
    paymentMethod: 'Khipu',
    items: [
      {
        id: 'it_05',
        name: 'Windows XP Glitch 2000 Graphic Tee',
        quantity: 1,
        price: 24990,
        size: 'Talla XL',
        sku: 'NL-TEE-003',
        image: INITIAL_PRODUCTS[2]?.images[0] || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800',
        subtotal: 24990
      }
    ],
    notes: 'Viajando vía Blue Express con código de seguimiento BX-8829104.'
  },
  {
    id: 'ord_17',
    orderNumber: 'NL-9413-T',
    customerName: 'Constanza Lagos',
    customerEmail: 'coni.lagos@gmail.com',
    customerPhone: '+56 9 7412 3389',
    deliveryType: 'Retiro en Sucursal',
    branchId: 'valparaiso',
    branchName: 'Valparaíso',
    pickupBranchId: 'valparaiso',
    pickupBranchName: 'Valparaíso',
    date: '2026-10-19 17:45',
    timestamp: 1792449900000,
    total: 42990,
    status: 'En transito',
    paymentMethod: 'Webpay',
    items: [
      {
        id: 'it_17',
        name: 'Bolso Bandolera Cyber-Goth con Cadena Gruesa & Remaches',
        quantity: 1,
        price: 42990,
        size: 'Talla Única',
        sku: 'NL-BAG-006',
        image: INITIAL_PRODUCTS[5]?.images[0] || 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
        subtotal: 42990
      }
    ],
    notes: 'Productos en tránsito interno hacia la sucursal Valparaíso para retiro del cliente.'
  },
  {
    id: 'ord_06',
    orderNumber: 'NL-9412',
    customerName: 'Sofía Moraga',
    customerEmail: 'sofia.m@gmail.com',
    customerPhone: '+56 9 6655 4433',
    deliveryType: 'Despacho a Domicilio',
    branchId: 'vina_del_mar',
    branchName: 'Viña del Mar',
    shippingAddress: '1 Norte 750, Viña del Mar',
    shippingCourier: 'Starken',
    trackingNumber: 'STK-9120482',
    date: '2026-10-19 14:00',
    timestamp: 1792436400000,
    total: 34990,
    status: 'Entregado',
    paymentMethod: 'Webpay',
    items: [
      {
        id: 'it_06',
        name: 'Cartera Y2K Mini Baguette Plateada Mirror',
        quantity: 1,
        price: 34990,
        size: 'Talla Única',
        sku: 'NL-BAG-005',
        image: INITIAL_PRODUCTS[4]?.images[0] || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
        subtotal: 34990
      }
    ],
    notes: 'Entregado en destino solicitado a las 16:30 hrs.'
  },
  {
    id: 'ord_07',
    orderNumber: 'NL-9411',
    customerName: 'Lucas Vera',
    customerEmail: 'lucas.v@outlook.cl',
    customerPhone: '+56 9 5544 3322',
    deliveryType: 'Retiro en Sucursal',
    branchId: 'quilpue',
    branchName: 'Quilpué',
    pickupBranchId: 'quilpue',
    pickupBranchName: 'Quilpué',
    date: '2026-10-19 11:30',
    timestamp: 1792427400000,
    total: 18990,
    status: 'Listo para el retiro de sucursal',
    paymentMethod: 'Mercado Pago',
    items: [
      {
        id: 'it_07',
        name: 'Cybernetic Chrome Spiked Collar & Chain',
        quantity: 1,
        price: 18990,
        size: 'Talla Única',
        sku: 'NL-ACC-004',
        image: INITIAL_PRODUCTS[3]?.images[0] || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
        subtotal: 18990
      }
    ],
    notes: 'Disponible en sucursal Quilpué para retiro presencial del cliente.'
  },
  {
    id: 'ord_08',
    orderNumber: 'NL-9410',
    customerName: 'Fernanda Zúñiga',
    customerEmail: 'fer.zuniga@gmail.com',
    customerPhone: '+56 9 8877 6655',
    deliveryType: 'Retiro en Sucursal',
    branchId: 'vina_del_mar',
    branchName: 'Viña del Mar',
    registeredByAdmin: 'Sebastián Valdés',
    pickupBranchId: 'vina_del_mar',
    pickupBranchName: 'Viña del Mar',
    date: '2026-10-18 17:00',
    timestamp: 1792360800000,
    total: 42990,
    status: 'Retirado',
    paymentMethod: 'Sistema POS',
    items: [
      {
        id: 'it_08',
        name: 'Bolso Bandolera Cyber-Goth con Cadena Gruesa & Remaches',
        quantity: 1,
        price: 42990,
        size: 'Talla Única',
        sku: 'NL-BAG-006',
        image: INITIAL_PRODUCTS[5]?.images[0] || 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800',
        subtotal: 42990
      }
    ],
    notes: 'Cliente ya retiró sus productos presencialmente en Sucursal Viña del Mar.'
  },
  {
    id: 'ord_09',
    orderNumber: 'NL-9409',
    customerName: 'Diego Morales',
    customerEmail: 'diego.m@hotmail.com',
    customerPhone: '+56 9 9988 2211',
    deliveryType: 'Despacho a Domicilio',
    branchId: 'valparaiso',
    branchName: 'Valparaíso',
    shippingAddress: 'Av. Argentina 550, Valparaíso',
    shippingCourier: 'Paket',
    date: '2026-10-18 10:15',
    timestamp: 1792336500000,
    total: 49990,
    status: 'Solicitud de Devolución recibida',
    paymentMethod: 'Mercado Pago',
    items: [
      {
        id: 'it_09',
        name: 'Chaqueta Cortavientos Reflectante Cyber-Track Y2K',
        quantity: 1,
        price: 49990,
        size: 'Talla M',
        sku: 'NL-JKT-011',
        image: INITIAL_PRODUCTS[10]?.images[0] || 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800',
        subtotal: 49990
      }
    ],
    notes: 'Notificación de solicitud de devolución recibida en el panel del admin; pendiente de revisión.'
  },
  {
    id: 'ord_10',
    orderNumber: 'NL-9408',
    customerName: 'Andrés Pavez',
    customerEmail: 'andres.p@live.cl',
    customerPhone: '+56 9 7711 2233',
    deliveryType: 'Despacho a Domicilio',
    branchId: 'vina_del_mar',
    branchName: 'Viña del Mar',
    shippingAddress: 'Calle Viana 320, Viña del Mar',
    shippingCourier: 'Blue Express',
    date: '2026-10-17 16:30',
    timestamp: 1792272600000,
    total: 38990,
    status: 'Revisión de equipo',
    paymentMethod: 'Webpay',
    items: [
      {
        id: 'it_10',
        name: 'Cyber-Tribal Overkill Zip Hoodie',
        quantity: 1,
        price: 38990,
        size: 'Talla S',
        sku: 'NL-HOOD-001',
        image: INITIAL_PRODUCTS[0]?.images[0] || 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
        subtotal: 38990
      }
    ],
    notes: 'El equipo/admin está revisando la solicitud de devolución para evaluar si rechazar o aceptar.'
  },
  {
    id: 'ord_11',
    orderNumber: 'NL-9407',
    customerName: 'Valentina Muñoz',
    customerEmail: 'valen.m@gmail.com',
    customerPhone: '+56 9 6611 7733',
    deliveryType: 'Despacho a Domicilio',
    branchId: 'quilpue',
    branchName: 'Quilpué',
    shippingAddress: 'Los Carrera 1120, Quilpué',
    shippingCourier: 'Starken',
    date: '2026-10-17 11:00',
    timestamp: 1792252800000,
    total: 21990,
    status: 'Aprobada por Admin',
    paymentMethod: 'Khipu',
    items: [
      {
        id: 'it_11',
        name: 'Choker Industrial O-Ring con Cadena Triple Cromada',
        quantity: 1,
        price: 21990,
        size: 'Talla Única',
        sku: 'NL-ACC-009',
        image: INITIAL_PRODUCTS[8]?.images[0] || 'https://images.unsplash.com/photo-1611591475152-47354c5ec054?w=800',
        subtotal: 21990
      }
    ],
    notes: 'Solicitud de devolución aprobada por el Admin desde el módulo de notificaciones.'
  },
  {
    id: 'ord_12',
    orderNumber: 'NL-9406',
    customerName: 'Carolina Pizarro',
    customerEmail: 'carito.piz@outlook.com',
    customerPhone: '+56 9 6655 4433',
    deliveryType: 'Despacho a Domicilio',
    branchId: 'valparaiso',
    branchName: 'Valparaíso',
    shippingAddress: 'Plaza Victoria 210, Valparaíso',
    shippingCourier: 'Starken',
    date: '2026-10-16 18:00',
    timestamp: 1792191600000,
    total: 23990,
    status: 'Rechazada por Admin',
    paymentMethod: 'Mercado Pago',
    items: [
      {
        id: 'it_12',
        name: 'Gorra Snapback Cyber-Gothic Bordado Neón 3D',
        quantity: 1,
        price: 23990,
        size: 'Talla Única',
        sku: 'NL-CAP-008',
        image: INITIAL_PRODUCTS[7]?.images[0] || 'https://images.unsplash.com/photo-1534215754734-18e55d13e346?w=800',
        subtotal: 23990
      }
    ],
    notes: 'Solicitud rechazada por el Admin desde el módulo de notificaciones.'
  },
  {
    id: 'ord_13',
    orderNumber: 'NL-9405',
    customerName: 'Matías Silva',
    customerEmail: 'm.silva@y2k.cl',
    customerPhone: '+56 9 8452 9012',
    deliveryType: 'Despacho a Domicilio',
    branchId: 'vina_del_mar',
    branchName: 'Viña del Mar',
    shippingAddress: '7 Norte 430, Viña del Mar',
    shippingCourier: 'Paket',
    trackingNumber: 'PKT-550192',
    date: '2026-10-16 14:20',
    timestamp: 1792178400000,
    total: 45990,
    status: 'Envió a punto',
    paymentMethod: 'Webpay',
    items: [
      {
        id: 'it_13',
        name: 'Gothic Parachute Multipocket Cargo',
        quantity: 1,
        price: 45990,
        size: 'Talla L',
        sku: 'NL-PAN-002',
        image: INITIAL_PRODUCTS[1]?.images[0] || 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800',
        subtotal: 45990
      }
    ],
    notes: 'Cliente pidió realizar su devolución por envío a punto.'
  },
  {
    id: 'ord_14',
    orderNumber: 'NL-9404',
    customerName: 'Javiera Gómez',
    customerEmail: 'javi.gomez@gmail.com',
    customerPhone: '+56 9 7321 8844',
    deliveryType: 'Retiro en Sucursal',
    branchId: 'vina_del_mar',
    branchName: 'Viña del Mar',
    pickupBranchId: 'valparaiso',
    pickupBranchName: 'Valparaíso',
    date: '2026-10-15 15:40',
    timestamp: 1792096800000,
    total: 34990,
    status: 'Retiro Presencial',
    paymentMethod: 'Sistema POS',
    items: [
      {
        id: 'it_14',
        name: 'Cartera Y2K Mini Baguette Plateada Mirror',
        quantity: 1,
        price: 34990,
        size: 'Talla Única',
        sku: 'NL-BAG-005',
        image: INITIAL_PRODUCTS[4]?.images[0] || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
        subtotal: 34990
      }
    ],
    notes: 'El cliente realiza su devolución presencialmente en la sucursal Valparaíso.'
  }
];

// Normaliza órdenes guardadas previamente para garantizar cumplimiento estricto del esquema
export const normalizeStoredOrders = (rawOrders: any[]): PurchaseOrderRecord[] => {
  return rawOrders.map((ord) => {
    const validMethods: OrderPaymentMethod[] = ['Sistema POS', 'Khipu', 'Webpay', 'Mercado Pago'];
    let paymentMethod: OrderPaymentMethod = validMethods.includes(ord.paymentMethod)
      ? ord.paymentMethod
      : 'Sistema POS';

    const isPaymentPendingOrCancelled =
      ord.status === 'Pendiente de Pago' ||
      ord.status === 'Pago Confirmando' ||
      ord.status === 'Pago Anulado';

    if (isPaymentPendingOrCancelled && !isManualTransferPayment(paymentMethod)) {
      paymentMethod = ord.status === 'Pendiente de Pago' ? 'Sistema POS' : 'Khipu';
    }

    let shippingCourier: ShippingCourierType | undefined = undefined;
    if (ord.shippingCourier === 'Starken' || ord.shippingCourier === 'Blue Express' || ord.shippingCourier === 'Paket') {
      shippingCourier = ord.shippingCourier;
    } else if (ord.deliveryType === 'Despacho a Domicilio') {
      shippingCourier = 'Starken';
    }

    const isPickup = ord.deliveryType === 'Retiro en Sucursal';
    const effectivePickupBranchId = isPickup ? ord.pickupBranchId || ord.branchId : undefined;
    const effectivePickupBranchName = isPickup ? ord.pickupBranchName || ord.branchName : undefined;

    // Corregir órdenes online de retiro (ej. ord_07 Lucas Vera) para que branchId coincida con su sucursal de retiro si no fue Sistema POS
    const normalizedBranchId =
      isPickup && paymentMethod !== 'Sistema POS' && effectivePickupBranchId
        ? effectivePickupBranchId
        : ord.branchId;
    const normalizedBranchName =
      isPickup && paymentMethod !== 'Sistema POS' && effectivePickupBranchName
        ? effectivePickupBranchName
        : ord.branchName;

    return {
      ...ord,
      branchId: normalizedBranchId,
      branchName: normalizedBranchName,
      paymentMethod,
      shippingCourier,
      registeredByAdmin: getAdminNameByBranchId(normalizedBranchId, ord.registeredByAdmin),
      pickupBranchId: effectivePickupBranchId,
      pickupBranchName: effectivePickupBranchName
    };
  });
};

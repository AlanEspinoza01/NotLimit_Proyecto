import { INITIAL_PRODUCTS } from '../../../services/mockData';
import {
  calculateCourierQuotes,
  getProductWeightGrams,
  getWeightTierInfo,
  ShippingCourierId
} from '../../../services/shippingQuotesEngine';
import {
  STORAGE_ALERTS_KEY,
  STORAGE_PURCHASE_ORDERS_SUPER_KEY,
  STORAGE_PURCHASE_ORDERS_ADMIN_KEY,
  OFFICIAL_RETURN_REASONS,
  INITIAL_SYSTEM_ALERTS,
  AlertCategory,
  AlertProductItem,
  AlertShippingAddress,
  SystemAlert
} from './interestNotificationTypes';

// Helper para enriquecer las imágenes y metadatos de un producto desde INITIAL_PRODUCTS
export function enrichAlertProductItem(
  p: AlertProductItem,
  idx: number,
  fallbackAmount?: number,
  totalCount = 1
): AlertProductItem {
  const fallbackImg =
    INITIAL_PRODUCTS[0]?.images[0] ||
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800';
  const catalogMatch =
    INITIAL_PRODUCTS.find(
      (cp) =>
        (p.id && cp.id === p.id) ||
        (p.sku && cp.sku.toLowerCase() === p.sku.toLowerCase()) ||
        (p.name && cp.title.toLowerCase().includes(p.name.toLowerCase())) ||
        (p.name && p.name.toLowerCase().includes(cp.title.toLowerCase()))
    ) || INITIAL_PRODUCTS[idx % INITIAL_PRODUCTS.length];

  const primaryImg = p.image && p.image.trim() ? p.image : catalogMatch?.images[0] || fallbackImg;
  const galleryImages =
    p.images && p.images.length > 0
      ? p.images
      : catalogMatch && catalogMatch.images.length > 1
      ? catalogMatch.images
      : [
          primaryImg,
          'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800',
          'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800'
        ];

  return {
    ...p,
    id: p.id || catalogMatch?.id,
    name: p.name || catalogMatch?.title || 'Prenda Y2K NoLimits',
    quantity: p.quantity && p.quantity > 0 ? p.quantity : 1,
    size: p.size || 'Talla L',
    price:
      p.price ??
      (fallbackAmount
        ? Math.round(fallbackAmount / totalCount)
        : catalogMatch?.salePrice || catalogMatch?.price || 38990),
    sku: p.sku || catalogMatch?.sku || `NL-ITEM-${idx + 1}`,
    image: primaryImg,
    images: galleryImages,
    description:
      p.description ||
      catalogMatch?.description ||
      'Prenda de colección oficial NoLimits con confección de alto gramaje y detalles Y2K.',
    category:
      p.category ||
      (catalogMatch
        ? `${catalogMatch.category}${catalogMatch.subCategory ? ` / ${catalogMatch.subCategory}` : ''}`
        : 'Colección Y2K'),
    colors: p.colors || catalogMatch?.colors || [{ name: 'Void Black', hex: '#0a0a0c' }]
  };
}

// Helper para extraer lista de productos de una alerta (Cobro Pendiente o Solicitud de Devolución) con fotos y detalles garantizados
export function getAlertProducts(al: SystemAlert): AlertProductItem[] {
  if (al.products && al.products.length > 0) {
    return al.products.map((p, idx) =>
      enrichAlertProductItem(p, idx, al.amount, al.products?.length || 1)
    );
  }

  // Si no vienen en la alerta, buscar en el listado de órdenes en localStorage
  if (al.orderNumber) {
    try {
      const stored =
        localStorage.getItem(STORAGE_PURCHASE_ORDERS_SUPER_KEY) ||
        localStorage.getItem(STORAGE_PURCHASE_ORDERS_ADMIN_KEY);
      if (stored) {
        const orderList = JSON.parse(stored);
        const match = orderList.find((o: any) => o.orderNumber === al.orderNumber);
        if (match && match.items && match.items.length > 0) {
          return match.items.map((it: any, idx: number) =>
            enrichAlertProductItem(
              {
                id: it.id,
                name: it.name || 'Prenda Y2K NoLimits',
                quantity: it.quantity || 1,
                size: it.size || (it.sizes ? String(it.sizes) : undefined),
                price:
                  it.price ||
                  it.subtotal ||
                  Math.round((match.total || 38990) / match.items.length),
                sku: it.sku || `NL-ITEM-${idx + 1}`,
                image: it.image
              },
              idx,
              match.total,
              match.items.length
            )
          );
        }
      }
    } catch (e) {
      console.warn('Error leyendo ordenes en getAlertProducts', e);
    }
  }

  // Buscar coincidencia en INITIAL_SYSTEM_ALERTS
  const initialMatch = INITIAL_SYSTEM_ALERTS.find(
    (i) => i.id === al.id || (al.orderNumber && i.orderNumber === al.orderNumber)
  );
  if (initialMatch && initialMatch.products && initialMatch.products.length > 0) {
    return initialMatch.products.map((p, idx) =>
      enrichAlertProductItem(p, idx, initialMatch.amount, initialMatch.products!.length)
    );
  }

  if (al.productName) {
    return [
      enrichAlertProductItem(
        {
          name: al.productName,
          quantity: 1,
          size: al.sizeRequested || 'Talla Única',
          price: al.amount || 38990,
          sku: al.productSku || 'NL-ITEM-001',
          image: al.productImage
        },
        0,
        al.amount,
        1
      )
    ];
  }

  // Para alertas de cobro pendiente o devolución sin datos previos, garantizar prenda demostrativa completa
  if (al.category === 'cobro_pendiente' || al.category === 'devolucion') {
    return [
      enrichAlertProductItem(
        {
          name: 'Cyber-Tribal Overkill Zip Hoodie',
          quantity: 1,
          size: 'Talla L',
          price: al.amount || 38990,
          sku: 'NL-CYB-001'
        },
        0,
        al.amount,
        1
      )
    ];
  }

  return [];
}

// Helper para obtener el correo de la alerta
export function getAlertEmail(al: SystemAlert): string {
  if (al.customerEmail && al.customerEmail.trim()) {
    return al.customerEmail.trim();
  }
  if (al.orderNumber) {
    try {
      const stored =
        localStorage.getItem(STORAGE_PURCHASE_ORDERS_SUPER_KEY) ||
        localStorage.getItem(STORAGE_PURCHASE_ORDERS_ADMIN_KEY);
      if (stored) {
        const orderList = JSON.parse(stored);
        const match = orderList.find((o: any) => o.orderNumber === al.orderNumber);
        if (match && (match.customerEmail || match.email)) {
          return match.customerEmail || match.email;
        }
      }
    } catch (e) {
      console.warn('Error leyendo correo de orden', e);
    }
  }
  return 'cliente@live.cl';
}

// Helper para obtener la ruta de detalle del producto (especialmente para Solicitud de Producto Agotado)
export function getAlertProductLink(al: SystemAlert): string {
  // 0. Priorizar el enlace real o el ID del producto guardado en MongoDB
  if (al.productLink && al.productLink.trim()) {
    return al.productLink.trim();
  }
  if (al.products && al.products[0]?.id) {
    return `/product/${al.products[0].id}`;
  }

  // 1. Buscar por SKU exacto en INITIAL_PRODUCTS
  if (al.productSku) {
    const skuNorm = al.productSku.trim().toLowerCase();
    const bySku = INITIAL_PRODUCTS.find((p) => p.sku.toLowerCase() === skuNorm);
    if (bySku) {
      return al.category === 'producto_agotado' && bySku.totalStock > 0
        ? `/product/${bySku.id}?agotado=1`
        : `/product/${bySku.id}`;
    }
  }

  // 2. Buscar por nombre de producto en INITIAL_PRODUCTS
  if (al.productName) {
    const cleanName = al.productName.replace(/\[.*?\]/g, '').trim().toLowerCase();
    const byName = INITIAL_PRODUCTS.find((p) => {
      const pTitle = p.title.replace(/\[.*?\]/g, '').trim().toLowerCase();
      return pTitle.includes(cleanName) || cleanName.includes(pTitle);
    });
    if (byName) {
      return al.category === 'producto_agotado' && byName.totalStock > 0
        ? `/product/${byName.id}?agotado=1`
        : `/product/${byName.id}`;
    }
  }

  // 3. Fallback al producto agotado oficial del catálogo
  return '/product/prod_cyber_vest_soldout_12';
}

// Helper para obtener la Dirección de Envío completa cuando la modalidad es envío a domicilio
export function getAlertShippingAddress(al: SystemAlert): AlertShippingAddress | null {
  if (al.deliveryType !== 'envio') return null;
  if (
    al.shippingAddress &&
    al.shippingAddress.region &&
    al.shippingAddress.comuna &&
    al.shippingAddress.street
  ) {
    return al.shippingAddress;
  }

  const initialMatch = INITIAL_SYSTEM_ALERTS.find(
    (init) => init.id === al.id || (al.orderNumber && init.orderNumber === al.orderNumber)
  );
  if (initialMatch?.shippingAddress) {
    return initialMatch.shippingAddress;
  }

  if (al.category === 'devolucion') {
    return {
      region: 'Región Metropolitana de Santiago',
      comuna: 'Providencia',
      street: 'Av. Nueva Providencia',
      number: '2155',
      apartment: 'Oficina 502',
      postalCode: '7500000',
      notes: 'Recepción habilitada de 09:00 a 18:30 hrs. Llamar al llegar.'
    };
  }

  return {
    region: 'Región de Valparaíso',
    comuna: 'Viña del Mar',
    street: 'Av. Libertad',
    number: '1240',
    apartment: 'Depto 804, Torre B',
    postalCode: '2520000',
    notes: 'Dejar en conserjería principal, portón gris frente a plaza.'
  };
}

// Helper para calcular y resolver el Motivo de Devolución, Agencia de Envío escogida (Paket, Starken o Blue Express)
// y el Valor de Envío (si es Starken o Blue Express: lo que paga el usuario; si es Paket: lo que paga el dueño / NoLimits)
export function getAlertReturnLogistics(al: SystemAlert): {
  motivo: string;
  isShipping: boolean;
  courierId: ShippingCourierId | null;
  courierName: string;
  paidByOwner: boolean;
  customerShippingCostClp: number;
  ownerShippingCostClp: number;
} {
  const initialMatch = INITIAL_SYSTEM_ALERTS.find(
    (init) => init.id === al.id || (al.orderNumber && init.orderNumber === al.orderNumber)
  );

  // 1. Resolver el Motivo de la Devolución seleccionado por el usuario
  const rawReason =
    al.returnReason ||
    al.products?.find((p) => p.returnReason)?.returnReason ||
    initialMatch?.returnReason ||
    OFFICIAL_RETURN_REASONS[0];

  const lowerReason = rawReason.toLowerCase();
  const normalizedMotivo =
    lowerReason.includes('cambio de talla') || lowerReason.includes('talla l por talla m')
      ? OFFICIAL_RETURN_REASONS[0]
      : rawReason;

  // 2. Resolver si es envío por agencia o entrega presencial en sucursal
  const combinedMethodText = `${al.deliveryMethodText || ''} ${al.description || ''} ${
    initialMatch?.deliveryMethodText || ''
  }`.toLowerCase();

  let courierId: ShippingCourierId | null = al.returnCourier || initialMatch?.returnCourier || null;
  if (!courierId) {
    if (combinedMethodText.includes('paket')) {
      courierId = 'paket';
    } else if (combinedMethodText.includes('blue')) {
      courierId = 'blue_express';
    } else if (combinedMethodText.includes('starken')) {
      courierId = 'starken';
    } else if (al.deliveryType === 'envio') {
      courierId = 'paket';
    }
  }

  const isShipping = al.deliveryType === 'envio' || courierId !== null;

  if (!isShipping || !courierId) {
    return {
      motivo: normalizedMotivo,
      isShipping: false,
      courierId: null,
      courierName: 'Sucursal Física (Presencial)',
      paidByOwner: false,
      customerShippingCostClp: 0,
      ownerShippingCostClp: 0
    };
  }

  // 3. Calcular tarifa de envío según peso de los productos y comuna de origen del envío
  const prods = getAlertProducts(al);
  const totalWeightGrams = Math.max(
    400,
    prods.reduce((acc, p) => {
      const unitWeight = getProductWeightGrams({ category: p.category || p.name });
      return acc + unitWeight * (p.quantity || 1);
    }, 0)
  );

  const addr = getAlertShippingAddress(al);
  const destinationRegion = addr?.region || 'Región de Valparaíso';
  const destinationCommune = addr?.comuna || 'Viña del Mar';

  const quotes = calculateCourierQuotes({
    totalWeightGrams,
    destinationRegion,
    destinationCommune,
    originBranch: 'vina_del_mar'
  });
  const tierInfo = getWeightTierInfo(totalWeightGrams);

  const paketQuote = quotes.find((q) => q.courierId === 'paket');
  const starkenQuote = quotes.find((q) => q.courierId === 'starken');
  const blueQuote = quotes.find((q) => q.courierId === 'blue_express');

  if (courierId === 'paket') {
    const calculatedOwnerCost =
      (typeof al.returnShippingCostOwnerClp === 'number' && al.returnShippingCostOwnerClp > 0
        ? al.returnShippingCostOwnerClp
        : undefined) ??
      (typeof initialMatch?.returnShippingCostOwnerClp === 'number' &&
      initialMatch.returnShippingCostOwnerClp > 0
        ? initialMatch.returnShippingCostOwnerClp
        : undefined) ??
      (paketQuote && paketQuote.priceClp > 0 ? paketQuote.priceClp : tierInfo?.paketRmRate || 2990);

    return {
      motivo: normalizedMotivo,
      isShipping: true,
      courierId: 'paket',
      courierName: 'Paket Express',
      paidByOwner: true,
      customerShippingCostClp: 0,
      ownerShippingCostClp: calculatedOwnerCost
    };
  }

  if (courierId === 'blue_express') {
    const calculatedCustomerCost =
      (typeof al.returnShippingCostCustomerClp === 'number' && al.returnShippingCostCustomerClp > 0
        ? al.returnShippingCostCustomerClp
        : undefined) ??
      (typeof initialMatch?.returnShippingCostCustomerClp === 'number' &&
      initialMatch.returnShippingCostCustomerClp > 0
        ? initialMatch.returnShippingCostCustomerClp
        : undefined) ??
      (blueQuote && blueQuote.priceClp > 0 ? blueQuote.priceClp : 3830);

    return {
      motivo: normalizedMotivo,
      isShipping: true,
      courierId: 'blue_express',
      courierName: 'Blue Express',
      paidByOwner: false,
      customerShippingCostClp: calculatedCustomerCost,
      ownerShippingCostClp: 0
    };
  }

  // Starken
  const calculatedStarkenCost =
    (typeof al.returnShippingCostCustomerClp === 'number' && al.returnShippingCostCustomerClp > 0
      ? al.returnShippingCostCustomerClp
      : undefined) ??
    (typeof initialMatch?.returnShippingCostCustomerClp === 'number' &&
    initialMatch.returnShippingCostCustomerClp > 0
      ? initialMatch.returnShippingCostCustomerClp
      : undefined) ??
    (starkenQuote && starkenQuote.priceClp > 0 ? starkenQuote.priceClp : 5110);

  return {
    motivo: normalizedMotivo,
    isShipping: true,
    courierId: 'starken',
    courierName: 'Starken',
    paidByOwner: false,
    customerShippingCostClp: calculatedStarkenCost,
    ownerShippingCostClp: 0
  };
}

// Helper para calcular y resolver la Agencia de Transporte escogida y el Valor de Envío en "Cobro Pendiente" cuando es por Envío
export function getAlertPendingPaymentLogistics(al: SystemAlert): {
  isShipping: boolean;
  courierId: ShippingCourierId | null;
  courierName: string;
  shippingCostClp: number;
  productsSubtotalClp: number;
  totalWithShippingClp: number;
} {
  const initialMatch = INITIAL_SYSTEM_ALERTS.find(
    (init) => init.id === al.id || (al.orderNumber && init.orderNumber === al.orderNumber)
  );

  const prods = getAlertProducts(al);
  const productsSubtotalClp =
    prods.length > 0
      ? prods.reduce((acc, p) => acc + (p.price || 0) * (p.quantity || 1), 0)
      : al.amount || 38990;

  if (al.deliveryType !== 'envio') {
    return {
      isShipping: false,
      courierId: null,
      courierName: 'Retiro en Tienda',
      shippingCostClp: 0,
      productsSubtotalClp,
      totalWithShippingClp: al.amount || productsSubtotalClp
    };
  }

  const combinedText = `${al.deliveryMethodText || ''} ${al.description || ''} ${
    initialMatch?.deliveryMethodText || ''
  }`.toLowerCase();

  let courierId: ShippingCourierId =
    al.shippingCourier || initialMatch?.shippingCourier || 'starken';
  if (!al.shippingCourier && !initialMatch?.shippingCourier) {
    if (combinedText.includes('paket')) {
      courierId = 'paket';
    } else if (combinedText.includes('blue')) {
      courierId = 'blue_express';
    } else if (combinedText.includes('starken')) {
      courierId = 'starken';
    }
  }

  const courierName =
    courierId === 'paket'
      ? 'Paket Express'
      : courierId === 'blue_express'
      ? 'Blue Express'
      : 'Starken';

  const totalWeightGrams = Math.max(
    400,
    prods.reduce((acc, p) => {
      const unitWeight = getProductWeightGrams({ category: p.category || p.name });
      return acc + unitWeight * (p.quantity || 1);
    }, 0)
  );

  const addr = getAlertShippingAddress(al);
  const destinationRegion = addr?.region || 'Región de Valparaíso';
  const destinationCommune = addr?.comuna || 'Viña del Mar';

  const quotes = calculateCourierQuotes({
    totalWeightGrams,
    destinationRegion,
    destinationCommune,
    originBranch: 'vina_del_mar'
  });
  const tierInfo = getWeightTierInfo(totalWeightGrams);
  const matchedQuote = quotes.find((q) => q.courierId === courierId);

  const explicitCost =
    typeof al.shippingCostClp === 'number' && al.shippingCostClp > 0
      ? al.shippingCostClp
      : typeof initialMatch?.shippingCostClp === 'number' && initialMatch.shippingCostClp > 0
      ? initialMatch.shippingCostClp
      : undefined;

  const fallbackByCourier =
    courierId === 'paket'
      ? tierInfo?.paketUrbanRate || 2990
      : courierId === 'blue_express'
      ? 3830
      : 3150;

  const shippingCostClp =
    explicitCost ??
    (matchedQuote && matchedQuote.priceClp > 0 ? matchedQuote.priceClp : fallbackByCourier);

  return {
    isShipping: true,
    courierId,
    courierName,
    shippingCostClp,
    productsSubtotalClp,
    totalWithShippingClp: productsSubtotalClp + shippingCostClp
  };
}

// Helper para determinar el estado específico de una alerta dentro del nuevo esquema de estados
export function getAlertSpecificState(
  al: SystemAlert
):
  | 'por_cobrar'
  | 'pago_confirmado'
  | 'pago_anulado'
  | 'revision_equipo'
  | 'aprobada_admin'
  | 'rechazada_admin'
  | 'activa'
  | 'resuelta' {
  if (al.category === 'cobro_pendiente') {
    if (al.status === 'active') return 'por_cobrar';
    if (
      al.paymentResolutionStatus === 'cancelled' ||
      (al.replyNote && al.replyNote.toLowerCase().includes('pago anulado'))
    ) {
      return 'pago_anulado';
    }
    return 'pago_confirmado';
  }

  if (al.category === 'devolucion') {
    if (al.returnReviewStatus === 'approved') return 'aprobada_admin';
    if (al.returnReviewStatus === 'rejected') return 'rechazada_admin';
    return 'revision_equipo';
  }

  return al.status === 'resolved' ? 'resuelta' : 'activa';
}

// Helper para obtener las fotos de referencia enviadas por el cliente en Solicitud de Productos Personalizado (máximo 10)
export function getAlertReferencePhotos(al: SystemAlert): string[] {
  if (al.referencePhotos && al.referencePhotos.length > 0) {
    return al.referencePhotos.slice(0, 10);
  }
  const initialMatch = INITIAL_SYSTEM_ALERTS.find((init) => init.id === al.id);
  if (initialMatch?.referencePhotos && initialMatch.referencePhotos.length > 0) {
    return initialMatch.referencePhotos.slice(0, 10);
  }
  const fallbackList = [
    al.productImage ||
      INITIAL_PRODUCTS[0]?.images[0] ||
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800',
    'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800',
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'
  ];
  return fallbackList.slice(0, 10);
}

// Helper para ordenar notificaciones por fecha de registro ("Notificaciones más nuevas" vs "Notificaciones más antiguas")
export function getAlertTimestampScore(al: SystemAlert): number {
  const raw = (al.createdAt || '').trim().toLowerCase();
  const refYear = 2026;
  const refMonth = 9; // Octubre (0-indexed)
  const refDay = 27;
  const baseNowMs = new Date(refYear, refMonth, refDay, 23, 45, 0).getTime();

  // 1. "hace X min"
  const minMatch = raw.match(/hace\s+(\d+)\s*min/);
  if (minMatch) {
    return baseNowMs - parseInt(minMatch[1], 10) * 60 * 1000;
  }

  // 2. "hace X hora(s)"
  const hourMatch = raw.match(/hace\s+(\d+)\s*hora/);
  if (hourMatch) {
    return baseNowMs - parseInt(hourMatch[1], 10) * 3600 * 1000;
  }

  // 3. "hoy, HH:MM"
  const todayMatch = raw.match(/hoy,\s*(\d{1,2}):(\d{2})/);
  if (todayMatch) {
    const hh = parseInt(todayMatch[1], 10);
    const mm = parseInt(todayMatch[2], 10);
    return new Date(refYear, refMonth, refDay, hh, mm, 0).getTime();
  }

  // 4. "ayer, HH:MM"
  const yesterdayMatch = raw.match(/ayer,\s*(\d{1,2}):(\d{2})/);
  if (yesterdayMatch) {
    const hh = parseInt(yesterdayMatch[1], 10);
    const mm = parseInt(yesterdayMatch[2], 10);
    return new Date(refYear, refMonth, refDay - 1, hh, mm, 0).getTime();
  }

  // 5. "YYYY-MM-DD HH:MM"
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+|t)(\d{1,2}):(\d{2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const hh = parseInt(isoMatch[4], 10);
    const mm = parseInt(isoMatch[5], 10);
    return new Date(y, m, d, hh, mm, 0).getTime();
  }

  // 6. "DD-MM-YYYY HH:MM" o "DD/MM/YYYY HH:MM"
  const clMatch = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[\s,]+(\d{1,2}):(\d{2}))?/);
  if (clMatch) {
    const d = parseInt(clMatch[1], 10);
    const m = parseInt(clMatch[2], 10) - 1;
    const y = parseInt(clMatch[3], 10);
    const hh = clMatch[4] ? parseInt(clMatch[4], 10) : 0;
    const mm = clMatch[5] ? parseInt(clMatch[5], 10) : 0;
    return new Date(y, m, d, hh, mm, 0).getTime();
  }

  // 7. Fallback genérico Date.parse
  const parsedDate = Date.parse(al.createdAt.replace(' ', 'T'));
  if (!Number.isNaN(parsedDate)) {
    return parsedDate;
  }

  return 0;
}

// Carga y reconciliación inicial de alertas desde localStorage
export function loadAndReconcileSystemAlerts(): SystemAlert[] {
  try {
    const saved = localStorage.getItem(STORAGE_ALERTS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validCategories: AlertCategory[] = [
          'cobro_pendiente',
          'atencion_cliente',
          'producto_agotado',
          'devolucion',
          'producto_personalizado'
        ];
        const currentList: SystemAlert[] = parsed.filter((a: any) =>
          validCategories.includes(a.category)
        );

        INITIAL_SYSTEM_ALERTS.filter(
          (init) => init.category === 'devolucion' || init.category === 'cobro_pendiente'
        ).forEach((initAlert) => {
          if (!currentList.some((c) => c.id === initAlert.id)) {
            currentList.push(initAlert);
          }
        });

        if (currentList.length > 0) {
          return currentList.map((a: SystemAlert) => {
            const initial = INITIAL_SYSTEM_ALERTS.find((init) => init.id === a.id);
            if (a.category === 'cobro_pendiente') {
              const existingProds =
                a.products && a.products.length > 0 ? a.products : initial?.products || [];
              const resolvedDeliveryType = a.deliveryType || initial?.deliveryType || 'envio';
              return {
                ...a,
                customerRut:
                  a.customerRut ||
                  initial?.customerRut ||
                  (resolvedDeliveryType === 'envio' ? '20.104.992-1' : undefined),
                deliveryType: resolvedDeliveryType,
                deliveryMethodText:
                  a.deliveryMethodText ||
                  initial?.deliveryMethodText ||
                  'Envío a Domicilio — Starken',
                shippingCourier: a.shippingCourier || initial?.shippingCourier,
                shippingCostClp:
                  typeof a.shippingCostClp === 'number'
                    ? a.shippingCostClp
                    : initial?.shippingCostClp,
                shippingAddress: a.shippingAddress || initial?.shippingAddress,
                customerEmail: a.customerEmail || initial?.customerEmail || 'cliente@live.cl',
                replyNote: undefined,
                products: existingProds.length > 0 ? existingProds : undefined
              };
            }
            if (a.category === 'devolucion') {
              const existingProds =
                initial &&
                (a.id === 'alert_dev_01' || a.id === 'alert_dev_02' || a.id === 'alert_dev_03')
                  ? initial.products || a.products || []
                  : a.products && a.products.length > 0
                  ? a.products
                  : initial?.products || [];
              const isPresetDev =
                a.id === 'alert_dev_01' || a.id === 'alert_dev_02' || a.id === 'alert_dev_03';
              return {
                ...a,
                title: isPresetDev && initial ? initial.title : a.title,
                description: isPresetDev && initial ? initial.description : a.description,
                customerRut: a.customerRut || initial?.customerRut || '19.442.810-5',
                deliveryType:
                  isPresetDev && initial
                    ? initial.deliveryType
                    : a.deliveryType || initial?.deliveryType || 'envio',
                deliveryMethodText:
                  isPresetDev && initial
                    ? initial.deliveryMethodText
                    : a.deliveryMethodText ||
                      initial?.deliveryMethodText ||
                      'Devolución por Envío — Paket Express',
                shippingAddress: a.shippingAddress || initial?.shippingAddress,
                returnReason:
                  isPresetDev && initial
                    ? initial.returnReason
                    : a.returnReason || initial?.returnReason || OFFICIAL_RETURN_REASONS[0],
                returnCourier:
                  isPresetDev && initial
                    ? initial.returnCourier
                    : a.returnCourier || initial?.returnCourier,
                returnShippingCostCustomerClp:
                  typeof a.returnShippingCostCustomerClp === 'number'
                    ? a.returnShippingCostCustomerClp
                    : initial?.returnShippingCostCustomerClp,
                returnShippingCostOwnerClp:
                  typeof a.returnShippingCostOwnerClp === 'number'
                    ? a.returnShippingCostOwnerClp
                    : initial?.returnShippingCostOwnerClp,
                timeLimitText: undefined,
                returnReviewStatus: a.returnReviewStatus || 'pending',
                products: existingProds.length > 0 ? existingProds : undefined
              };
            }
            if (a.category === 'producto_agotado') {
              return {
                ...a,
                customerRut: a.customerRut || initial?.customerRut || '18.332.198-K',
                timeLimitText: undefined
              };
            }
            if (a.category === 'atencion_cliente') {
              return {
                ...a,
                productName: undefined,
                productSku: undefined,
                productImage: undefined,
                amount: undefined,
                timeLimitText: undefined,
                orderNumber: undefined
              };
            }
            if (a.category === 'producto_personalizado') {
              const refPhotos =
                a.referencePhotos && a.referencePhotos.length > 0
                  ? a.referencePhotos.slice(0, 10)
                  : initial?.referencePhotos?.slice(0, 10);
              return {
                ...a,
                customerRut: a.customerRut || initial?.customerRut || '20.512.884-3',
                sizeRequested: undefined,
                amount: undefined,
                timeLimitText: undefined,
                referencePhotos: refPhotos
              };
            }
            return a;
          });
        }
      }
    }
  } catch (e) {
    console.error('Error cargando alertas', e);
  }
  return INITIAL_SYSTEM_ALERTS;
}

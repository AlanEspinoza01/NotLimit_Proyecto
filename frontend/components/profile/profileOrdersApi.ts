import type { ProductStockDetail } from '../../views/admin/ProductStockSummaryView';
import type { PurchaseOrder } from './profileTypes';

/** Normaliza los estados almacenados por Webpay/administración para el perfil. */
export const normalizeProfileOrderStatus = (
  raw: unknown,
  payment: string
): PurchaseOrder['currentStatus'] => {
  if (payment === 'PENDING') return 'Pendiente de Pago';
  if (payment === 'REJECTED') return 'Pago Anulado';
  if (payment === 'REFUNDED') return 'Reembolsado';
  const label = String(raw || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[_-]/g, ' ').trim();
  if (label.includes('retirado') && !label.includes('listo')) return 'Retirado';
  if (label.includes('entregado')) return 'Entregado';
  if (label.includes('listo') && label.includes('retiro')) return 'Listo para el retiro de sucursal';
  if (label.includes('transito')) return 'En transito';
  if (label.includes('preparacion')) return 'En Preparación';
  return 'Solicitud recibida';
};

/**
 * Convierte únicamente las compras CONFIRMED autenticadas devueltas por la API.
 * El catálogo puede aportar fotos, pero nunca sustituye precios históricos,
 * IDs comprados, cantidades ni el estado isReviewed registrado en MongoDB.
 */
export const mapConfirmedProfileOrders = (
  rows: any[],
  catalogProducts: ProductStockDetail[]
): PurchaseOrder[] => rows
  .filter(o => o && String(o.paymentStatus || '').toUpperCase() === 'CONFIRMED')
  .map((o): PurchaseOrder => {
    const timestamp = new Date(o.createdAt || o.date || 0).getTime();
    const purchasedAt = Number.isFinite(timestamp) ? timestamp : 0;
    const subtotal = Number(o.subtotal ?? o.total ?? 0) || 0;
    const shippingCost = Number(o.shippingCost ?? 0) || 0;
    const total = Number(o.total ?? 0) || 0;
    const address = o.shippingDetails?.address;
    const itemRows = Array.isArray(o.items) ? o.items : [];
    const storedStatus = /solicitud[ _]recibida|preparaci[oó]n|[ _]transit[oó]|listo.*retiro|retirad|entregad/i
      .test(String(o.fulfillmentStatus || '')) ? o.fulfillmentStatus : (o.status || o.fulfillmentStatus);

    return {
      id: String(o._id || o.id || ''),
      orderNumber: String(o.orderNumber || 'Orden sin número'),
      date: purchasedAt ? new Date(purchasedAt).toLocaleString('es-CL', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : 'Fecha no registrada',
      purchasedAt,
      subtotal,
      shippingCost,
      total,
      discountAmount: Math.max(0, subtotal + shippingCost - total),
      paymentStatus: 'CONFIRMED',
      paymentMethod: String(o.paymentMethod || 'No registrado'),
      deliveryMethod: o.deliveryType === 'envio' ? 'shipping' : 'pickup',
      branchId: String(o.pickupBranchId || o.branchId || ''),
      branchName: String(o.branchName || o.pickupBranchId || 'Sucursal no indicada'),
      courier: o.shippingDetails?.courier || undefined,
      shippingAddress: address
        ? [address.street, address.number, address.apartment, address.comuna, address.region].filter(Boolean).join(', ')
        : undefined,
      trackingNumber: o.shippingDetails?.trackingNumber || undefined,
      currentStatus: normalizeProfileOrderStatus(storedStatus, 'CONFIRMED'),
      items: itemRows.map((it: any) => {
        const productId = String(it.productId || '');
        // Coincidencia exacta con el producto comprado; sin imágenes de demostración.
        const match = catalogProducts.find(p => p.id === productId || (it.sku && p.sku === it.sku));
        return {
          productId,
          title: String(it.name || it.title || 'Producto'),
          size: String(it.size || 'Única'),
          color: match?.colors?.[0]?.name || '',
          quantity: Number(it.quantity ?? 1) || 1,
          price: Number(it.price ?? it.unitPrice ?? 0) || 0,
          image: match?.images?.[0] || '',
          isReviewed: Boolean(it.isReviewed),
        };
      }),
    };
  });

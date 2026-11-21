import { OrderModel, type IOrderItem } from '../../models/Order.model';
import { WebpayAttemptModel } from '../../models/WebpayAttempt.model';

/**
 * Comprobante informativo, basado exclusivamente en la orden persistida.
 * No es boleta/factura tributaria ni contiene claves de Webpay.
 * La lectura está protegida por el controlador que llama a esta función.
 */
export async function getOrderReceipt(orderNumber: string) {
  const order = await OrderModel.findOne({ orderNumber }).lean();
  if (!order) return null;

  const isWebpay = /webpay/i.test(String(order.paymentMethod || ''));
  const attempt = isWebpay
    ? await WebpayAttemptModel.findOne({ orderNumber }).select('state couponCode').lean()
    : null;
  // Para Webpay, solo la orden CONFIRMED + intento CONFIRMED prueban el pago.
  const verified = order.paymentStatus === 'CONFIRMED' &&
    (!isWebpay || attempt?.state === 'CONFIRMED');
  const subtotal = Number(order.subtotal || 0);
  const shippingCost = Number(order.shippingCost || 0);
  const total = Number(order.total || 0);
  const discountAmount = Math.max(0, subtotal + shippingCost - total);
  const couponCode = attempt?.couponCode || '';

  return {
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    verified,
    paymentMethod: order.paymentMethod,
    purchaseDate: order.createdAt,
    transactionDate: order.webpayTransactionDate || null,
    authorizationCode: verified ? order.webpayAuthorizationCode || null : null,
    customer: {
      name: order.customerName,
      rut: order.customerRut,
      email: order.customerEmail,
      phone: order.customerPhone,
    },
    delivery: {
      type: order.deliveryType,
      branch: order.branchName || order.pickupBranchId || '',
      courier: order.shippingDetails?.courier || '',
      address: order.shippingDetails?.address || null,
    },
    // IOrderItem es el tipo real declarado en Order.model.ts.
    items: (order.items || []).map((item: IOrderItem) => ({
      sku: item.sku,
      name: item.name,
      size: item.size,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: item.price * item.quantity,
    })),
    subtotal,
    shippingCost,
    discountAmount,
    couponCode,
    total,
    fulfillmentStatus: order.fulfillmentStatus || order.status,
  };
}

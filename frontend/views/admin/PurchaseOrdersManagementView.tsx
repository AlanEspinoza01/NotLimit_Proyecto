import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { WindowFrame } from '../../components/layout/WindowFrame';
import { PixelIcon } from '../../components/common/PixelIcon';
import { INITIAL_BRANCHES } from '../../services/mockData';
import { useAuth } from '../../context/AuthContext';
import { useBranch } from '../../context/BranchContext';
import api from '../../api/axios';

import '../../components/admin/purchaseOrders/PurchaseOrdersManagementView.css';
import {
  STORAGE_ORDERS_KEY,
  OrderPaymentMethod,
  ShippingCourierType,
  PurchaseOrderStatus,
  PurchasedProductItem,
  PurchaseOrderRecord,
  PendingStatusTransition,
  PurchaseOrdersSummaryKPIs,
  getAdminNameByBranchId,
  isManualTransferPayment,
  getPaymentMethodBadge,
  STATUS_DEFINITIONS,
  DEFAULT_INITIAL_ORDERS,
  normalizeStoredOrders
} from '../../components/admin/purchaseOrders/purchaseOrdersTypes';
import { PurchaseOrdersHeader } from '../../components/admin/purchaseOrders/PurchaseOrdersHeader';
import { PurchaseOrdersFiltersBar } from '../../components/admin/purchaseOrders/PurchaseOrdersFiltersBar';
import { PurchaseOrdersTable } from '../../components/admin/purchaseOrders/PurchaseOrdersTable';
import { PurchaseOrdersModals } from '../../components/admin/purchaseOrders/PurchaseOrdersModals';

export {
  STORAGE_ORDERS_KEY,
  getAdminNameByBranchId,
  isManualTransferPayment,
  getPaymentMethodBadge,
  STATUS_DEFINITIONS,
  DEFAULT_INITIAL_ORDERS,
  normalizeStoredOrders
};

export type {
  OrderPaymentMethod,
  ShippingCourierType,
  PurchaseOrderStatus,
  PurchasedProductItem,
  PurchaseOrderRecord,
  PendingStatusTransition,
  PurchaseOrdersSummaryKPIs
};

// Mapear estado de MongoDB (status / fulfillmentStatus / paymentStatus) a PurchaseOrderStatus
const normalizeMongoOrderStatus = (doc: any): PurchaseOrderStatus => {
  const payStatus = String(doc.paymentStatus || '').toUpperCase();
  const rawFulfillment = String(doc.fulfillmentStatus || '').trim();
  const rawStatus = String(doc.status || '').trim();

  if (payStatus === 'REJECTED' || rawStatus === 'Pago Anulado' || rawFulfillment === 'Pago Anulado') {
    return 'Pago Anulado';
  }
  if (payStatus === 'PENDING' || rawStatus === 'Pendiente de Pago' || rawFulfillment === 'Pendiente de Pago') {
    return 'Pendiente de Pago';
  }

  // Si fulfillmentStatus tiene un estado logístico más avanzado que 'Pago Confirmando', priorizarlo
  const candidate =
    rawFulfillment &&
    rawFulfillment !== 'Pago Confirmando' &&
    rawFulfillment !== 'en_preparacion'
      ? rawFulfillment
      : rawStatus || rawFulfillment;

  if (candidate && STATUS_DEFINITIONS[candidate as PurchaseOrderStatus]) {
    return candidate as PurchaseOrderStatus;
  }

  const lower = candidate.toLowerCase();
  switch (lower) {
    case 'en_preparacion':
    case 'en preparación':
    case 'en preparacion':
      return 'En Preparación';
    case 'en_transito':
    case 'en transito':
    case 'en tránsito':
      return 'En transito';
    case 'entregado':
      return 'Entregado';
    case 'listo_retiro':
    case 'listo para el retiro de sucursal':
      return 'Listo para el retiro de sucursal';
    case 'retirado':
      return 'Retirado';
    case 'solicitud_recibida':
    case 'solicitud recibida':
      return 'Solicitud recibida';
    default:
      return 'Pago Confirmando';
  }
};

/// Mapear paymentMethod de MongoDB al tipo OrderPaymentMethod de la vista
const normalizeMongoPaymentMethod = (rawMethod: string): OrderPaymentMethod => {
  const m = String(rawMethod || '').toLowerCase();
  if (m.includes('pos') || m.includes('reserva') || m.includes('efectivo') || m.includes('directo')) {
    return 'Sistema POS';
  }
  if (m.includes('mercado')) return 'Mercado Pago';
  if (m.includes('khipu') || m.includes('transferencia')) return 'Khipu';
  return 'WebPay' as OrderPaymentMethod;
};

// Mapear courier de MongoDB a ShippingCourierType
const normalizeMongoCourier = (rawCourier?: string): ShippingCourierType | undefined => {
  if (!rawCourier) return undefined;
  const c = rawCourier.toLowerCase();
  if (c.includes('blue')) return 'Blue Express' as ShippingCourierType;
  if (c.includes('paket')) return 'Paket' as ShippingCourierType;
  return 'Starken' as ShippingCourierType;
};

// Convertir un documento IOrder de MongoDB al formato PurchaseOrderRecord del frontend
const mapMongoOrderToPurchaseOrderRecord = (
  doc: any,
  branchesList: any[]
): PurchaseOrderRecord => {
  const id = doc._id?.toString() || doc.id || `ord_${Date.now()}`;
  const rawBranchId = doc.branchId || 'casa_matriz';
  const branchId =
    rawBranchId === 'branch-corporativo' || rawBranchId === 'central'
      ? 'casa_matriz'
      : rawBranchId;

  const isPickup =
    doc.deliveryType === 'retiro' ||
    doc.deliveryType === 'Retiro en Sucursal' ||
    doc.deliveryType === 'Retiro en Tienda' ||
    doc.deliveryMethod === 'pickup';

  const deliveryType = isPickup ? 'Retiro en Sucursal' : 'Despacho a Domicilio';

  const pickupBranchId = isPickup
    ? doc.pickupBranchId || (branchId !== 'casa_matriz' ? branchId : 'vina_del_mar')
    : undefined;

  const branchObj = branchesList.find((b) => b.id === branchId);
  const pickupBranchObj = pickupBranchId
    ? branchesList.find((b) => b.id === pickupBranchId)
    : null;

  const branchName =
    doc.branchName ||
    (branchId === 'casa_matriz'
      ? 'Casa Matriz / Central (Corporativo)'
      : branchObj
      ? `${branchObj.city} (${branchObj.name})`
      : branchId);

  const pickupBranchName = isPickup
    ? pickupBranchObj
      ? `${pickupBranchObj.city} (${pickupBranchObj.name})`
      : doc.pickupBranchName || branchName
    : undefined;

  const addrObj = doc.shippingDetails?.address;
  const formattedAddress =
    doc.shippingAddress ||
    (addrObj && (addrObj.street || addrObj.comuna)
      ? `${addrObj.street || ''} ${addrObj.number ? `#${addrObj.number}` : ''}${
          addrObj.apartment ? `, Depto ${addrObj.apartment}` : ''
        }, ${addrObj.comuna || ''}, ${addrObj.region || ''}`.trim()
      : isPickup
      ? `Retiro Presencial en Sucursal ${pickupBranchName || branchName}`
      : 'Despacho a Domicilio');

  const createdDate = doc.createdAt ? new Date(doc.createdAt) : new Date();
  const timestamp =
    doc.timestamp || (!isNaN(createdDate.getTime()) ? createdDate.getTime() : Date.now());

  const dateStr =
    doc.date ||
    (!isNaN(createdDate.getTime())
      ? `${createdDate.toLocaleDateString('es-CL', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })} ${createdDate.toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit'
        })}`
      : new Date().toLocaleString('es-CL'));

  const items: PurchasedProductItem[] = Array.isArray(doc.items)
    ? doc.items.map((it: any, idx: number) => ({
        id: it._id?.toString() || it.id || `item_${idx}`,
        sku: it.sku || `NL-SKU-${idx + 1}`,
        name: it.name || it.title || 'Prenda NoLimits',
        size: it.size || it.sizes || 'Única',
        quantity: Number(it.quantity ?? 1) || 1,
        price: Number(it.price ?? it.unitPrice ?? 0) || 0,
        image:
          it.image ||
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80'
      }))
    : [];

  const shippingCourier = !isPickup
    ? normalizeMongoCourier(doc.shippingDetails?.courier || doc.shippingCourier)
    : undefined;

  const trackingNumber = !isPickup
    ? doc.shippingDetails?.trackingNumber || doc.trackingNumber || ''
    : undefined;

  const status = normalizeMongoOrderStatus(doc);

  return {
    id,
    orderNumber: doc.orderNumber || `NL-${id.slice(-4).toUpperCase()}`,
    customerName: doc.customerName || 'Cliente NoLimits',
    customerRut: doc.customerRut || doc.rut || 'Sin RUT',
    customerPhone: doc.customerPhone || doc.phone || '+56 9 0000 0000',
    customerEmail: doc.customerEmail || doc.guestEmail || doc.email || 'sin-correo@nolimits.cl',
    deliveryType,
    branchId,
    branchName,
    pickupBranchId: pickupBranchId || undefined,
    pickupBranchName,
    shippingAddress: formattedAddress,
    shippingRegion: addrObj?.region || '',
    shippingComuna: addrObj?.comuna || '',
    shippingCourier,
    trackingNumber,
    date: dateStr,
    timestamp,
    subtotal: Number(doc.subtotal ?? doc.total ?? 0) || 0,
    shippingCost: Number(doc.shippingCost ?? 0) || 0,
    total: Number(doc.total ?? 0) || 0,
    status,
    paymentMethod: normalizeMongoPaymentMethod(doc.paymentMethod),
    registeredByAdmin: doc.registeredByAdmin || 'Sistema Web',
    items,
    notes: doc.cancellationReason || doc.notes || '',
    statusAuditLog:
      Array.isArray(doc.statusAuditLog) && doc.statusAuditLog.length > 0
        ? doc.statusAuditLog
        : [
            {
              status,
              timestamp: dateStr,
              note: `Orden registrada en MongoDB (${doc.registeredByAdmin || 'Sistema'})`
            }
          ]
  } as unknown as PurchaseOrderRecord;
};

export const PurchaseOrdersManagementView: React.FC = () => {
  const { currentUser } = useAuth();
  const { branches } = useBranch();
  const allBranches = useMemo(() => {
    const raw = branches.length > 0 ? branches : INITIAL_BRANCHES;
    const seen = new Set<string>();
    return raw.filter((b) => {
      const k = b.id === 'branch-corporativo' ? 'casa_matriz' : b.id;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [branches]);

  const isBranchAdmin = currentUser?.role === 'branch_admin';
  const assignedBranchId = isBranchAdmin ? (currentUser?.branchId || 'vina_del_mar') : null;
  const activeBranchObj = useMemo(() => {
    if (!assignedBranchId) return null;
    return (
      allBranches.find((b) => b.id === assignedBranchId) ||
      INITIAL_BRANCHES.find((b) => b.id === assignedBranchId) ||
      null
    );
  }, [allBranches, assignedBranchId]);

  // 1. Estado de Órdenes conectado a la colección 'orders' de MongoDB
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);

  // Feedback y modales
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<PurchaseOrderRecord | null>(null);

  const [transitShippingModalOrder, setTransitShippingModalOrder] = useState<PurchaseOrderRecord | null>(null);
  const [trackingCodeInput, setTrackingCodeInput] = useState<string>('');
  const [transitConfirmWordInput, setTransitConfirmWordInput] = useState<string>('');
  const [trackingError, setTrackingError] = useState<string>('');

  const [pendingStatusTransition, setPendingStatusTransition] = useState<PendingStatusTransition | null>(null);

  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrderRecord | null>(null);
  const [deleteConfirmWordInput, setDeleteConfirmWordInput] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Cargar órdenes reales desde MongoDB
  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await api.get('/admin/orders');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const mappedOrders = response.data.data.map((dbOrder: any) =>
          mapMongoOrderToPurchaseOrderRecord(dbOrder, allBranches)
        );
        setOrders(mappedOrders);
        localStorage.setItem(STORAGE_ORDERS_KEY, JSON.stringify(mappedOrders));
      }
    } catch (e) {
      console.error('Error cargando órdenes reales desde MongoDB:', e);
      triggerToast('Error de conexión: No se pudieron descargar las órdenes desde MongoDB');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Órdenes acotadas a la sucursal específica si es Admin de Sucursal:
  const branchScopedOrders = useMemo(() => {
    if (isBranchAdmin && assignedBranchId) {
      return orders.filter((ord) => {
        const isPickupOrder = ord.deliveryType === 'Retiro en Sucursal';
        const effectivePickupBranchId = ord.pickupBranchId || ord.branchId;
        if (isPickupOrder && effectivePickupBranchId === assignedBranchId) {
          return true;
        }
        if (ord.branchId === assignedBranchId) {
          return true;
        }
        return false;
      });
    }
    return orders;
  }, [orders, isBranchAdmin, assignedBranchId]);

  // 2. Filtros
  const [dateSortOrder, setDateSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDeliveryType, setSelectedDeliveryType] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Control de expansión de productos comprados por fila
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleExpandProducts = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  // Filtrado y Ordenamiento
  const filteredAndSortedOrders = useMemo(() => {
    return branchScopedOrders
      .filter((ord) => {
        if (selectedStatus !== 'all' && ord.status !== selectedStatus) return false;
        if (selectedDeliveryType !== 'all' && ord.deliveryType !== selectedDeliveryType) return false;
        if (!isBranchAdmin && selectedBranch !== 'all') {
          const effectiveBranchId = ord.pickupBranchId || ord.branchId;
          if (effectiveBranchId !== selectedBranch && ord.branchId !== selectedBranch) return false;
        }
        if (selectedPaymentMethod !== 'all' && ord.paymentMethod !== selectedPaymentMethod) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchOrder = ord.orderNumber.toLowerCase().includes(q);
          const matchCustomer = ord.customerName.toLowerCase().includes(q);
          const matchPhone = ord.customerPhone.toLowerCase().includes(q);
          const matchEmail = ord.customerEmail.toLowerCase().includes(q);
          const matchTracking = ord.trackingNumber ? ord.trackingNumber.toLowerCase().includes(q) : false;
          const matchProduct = ord.items.some(
            (it) => it.name.toLowerCase().includes(q) || (it.sku && it.sku.toLowerCase().includes(q))
          );
          if (!matchOrder && !matchCustomer && !matchPhone && !matchEmail && !matchTracking && !matchProduct) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (dateSortOrder === 'desc') {
          return b.timestamp - a.timestamp;
        } else {
          return a.timestamp - b.timestamp;
        }
      });
  }, [
    branchScopedOrders,
    isBranchAdmin,
    selectedStatus,
    selectedDeliveryType,
    selectedBranch,
    selectedPaymentMethod,
    searchQuery,
    dateSortOrder
  ]);

  // KPIs de resumen
  const summaryKPIs = useMemo<PurchaseOrdersSummaryKPIs>(() => {
    let totalRevenue = 0;
    let pendingPaymentCount = 0;
    let returnsCount = 0;

    branchScopedOrders.forEach((o) => {
      if (
        o.status !== 'Pago Anulado' &&
        o.status !== 'Rechazada por Admin' &&
        o.status !== 'Pendiente de Pago'
      ) {
        totalRevenue += o.total;
      }
      if (o.status === 'Pendiente de Pago') pendingPaymentCount++;
      if (
        o.status === 'Solicitud de Devolución recibida' ||
        o.status === 'Revisión de equipo' ||
        o.status === 'Aprobada por Admin' ||
        o.status === 'Envió a punto' ||
        o.status === 'Retiro Presencial'
      ) {
        returnsCount++;
      }
    });

    return {
      totalOrders: branchScopedOrders.length,
      totalRevenue,
      pendingPaymentCount,
      returnsCount
    };
  }, [branchScopedOrders]);

  // Aplicación efectiva de cambio de estado (Conectado a MongoDB)
  const updateOrderStatusDirect = async (
    orderId: string,
    nextStatus: PurchaseOrderStatus,
    auditNote?: string,
    extraFields?: Partial<PurchaseOrderRecord>
  ) => {
    const targetOrder = orders.find((o) => o.id === orderId);

    if (
      isBranchAdmin &&
      (STATUS_DEFINITIONS[nextStatus]?.category === 'devolucion' ||
        (targetOrder && STATUS_DEFINITIONS[targetOrder.status]?.category === 'devolucion'))
    ) {
      triggerToast('Acción restringida: Solo el Super Admin puede modificar los estados de devoluciones');
      return;
    }

    if (
      isBranchAdmin &&
      targetOrder &&
      targetOrder.deliveryType === 'Despacho a Domicilio' &&
      (nextStatus === 'En Preparación' || nextStatus === 'En transito' || nextStatus === 'Entregado')
    ) {
      triggerToast('Acción restringida: Los estados de Envío a Domicilio son supervisados por el Super Admin');
      return;
    }

    try {
      const isCancelled = nextStatus === 'Pago Anulado' || nextStatus === 'Rechazada por Admin';
      const isPending = nextStatus === 'Pendiente de Pago';

      const payload = {
        status: nextStatus,
        fulfillmentStatus: nextStatus,
        paymentStatus: isCancelled ? 'REJECTED' : isPending ? 'PENDING' : 'CONFIRMED',
        auditNote,
        cancellationReason: isCancelled ? auditNote : undefined,
        trackingNumber: extraFields?.trackingNumber,
        shippingCourier: extraFields?.shippingCourier
      };

      const response = await api.put(`/admin/orders/${orderId}/status`, payload);

      if (response.data?.success) {
        const updatedDoc = response.data.data;
        setOrders((prev) =>
          prev.map((ord) => {
            if (ord.id !== orderId) return ord;
            return {
              ...ord,
              ...extraFields,
              status: nextStatus,
              notes: auditNote ? `${ord.notes ? ord.notes + ' // ' : ''}${auditNote}` : ord.notes,
              statusAuditLog: updatedDoc?.statusAuditLog || [
                ...(ord.statusAuditLog || []),
                {
                  status: nextStatus,
                  timestamp: new Date().toLocaleString('es-CL'),
                  note: auditNote
                }
              ]
            };
          })
        );
        if (targetOrder) {
          triggerToast(`✓ Orden ${targetOrder.orderNumber} actualizada a "${nextStatus}" en MongoDB`);
        }
      }
    } catch (error) {
      console.error('Error actualizando estado en MongoDB:', error);
      triggerToast('Error de conexión: No se pudo actualizar el estado en MongoDB');
    }
  };

  const requestStatusConfirmation = (
    order: PurchaseOrderRecord,
    nextStatus: PurchaseOrderStatus,
    auditNote: string,
    descriptionText: string
  ) => {
    if (
      isBranchAdmin &&
      (STATUS_DEFINITIONS[order.status]?.category === 'devolucion' ||
        STATUS_DEFINITIONS[nextStatus]?.category === 'devolucion')
    ) {
      triggerToast('Acción restringida: Solo el Super Admin puede modificar los estados de devoluciones');
      return;
    }
    if (
      isBranchAdmin &&
      order.deliveryType === 'Despacho a Domicilio' &&
      (nextStatus === 'En Preparación' || nextStatus === 'En transito' || nextStatus === 'Entregado')
    ) {
      triggerToast('Acción restringida: Los estados de Envío a Domicilio son supervisados por el Super Admin');
      return;
    }
    setPendingStatusTransition({
      order,
      nextStatus,
      auditNote,
      descriptionText
    });
  };

  const handleConfirmPendingStatusTransition = async () => {
    if (!pendingStatusTransition) return;
    await updateOrderStatusDirect(
      pendingStatusTransition.order.id,
      pendingStatusTransition.nextStatus,
      pendingStatusTransition.auditNote
    );
    setPendingStatusTransition(null);
  };

  const handleInitiatePassToTransit = (order: PurchaseOrderRecord) => {
    if (order.deliveryType === 'Despacho a Domicilio') {
      if (isBranchAdmin) {
        triggerToast('Acción restringida: Los envíos por courier son supervisados exclusivamente por el Super Admin');
        return;
      }
      setTransitShippingModalOrder(order);
      setTrackingCodeInput(order.trackingNumber || '');
      setTransitConfirmWordInput('');
      setTrackingError('');
    } else {
      const targetBranch = order.pickupBranchName || order.branchName;
      requestStatusConfirmation(
        order,
        'En transito',
        `Productos en tránsito hacia sucursal ${targetBranch} para retiro del cliente.`,
        `La orden ${order.orderNumber} de ${order.customerName} pasará del estado "En Preparación" a "En transito", indicando que los productos ya preparados se están trasladando a la sucursal ${targetBranch} para su retiro.`
      );
    }
  };

  const handleConfirmTransitShipping = async () => {
    if (!transitShippingModalOrder) return;
    const cleanCode = trackingCodeInput.trim();
    if (!cleanCode) {
      setTrackingError('Debes ingresar el código de seguimiento para pasar a "En transito".');
      return;
    }
    if (transitConfirmWordInput.trim() !== 'Confirmar') {
      setTrackingError('Debes escribir exactamente la palabra "Confirmar" para continuar.');
      return;
    }

    const fixedCourier: ShippingCourierType = transitShippingModalOrder.shippingCourier || 'Starken';

    await updateOrderStatusDirect(
      transitShippingModalOrder.id,
      'En transito',
      `Despachado en tránsito por servicio de transporte ${fixedCourier}. Código de seguimiento: ${cleanCode}`,
      {
        trackingNumber: cleanCode,
        shippingCourier: fixedCourier
      }
    );
    setTransitShippingModalOrder(null);
    setTrackingCodeInput('');
    setTransitConfirmWordInput('');
    setTrackingError('');
  };

  const handleOpenDeleteOrderModal = (order: PurchaseOrderRecord) => {
    setOrderToDelete(order);
    setDeleteConfirmWordInput('');
    setDeleteError('');
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    if (deleteConfirmWordInput.trim() !== 'Eliminar') {
      setDeleteError('Debes escribir exactamente la palabra "Eliminar" para confirmar.');
      return;
    }
    const orderNum = orderToDelete.orderNumber;
    const orderId = orderToDelete.id;

    try {
      const response = await api.delete(`/admin/orders/${orderId}`);

      if (response.data?.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setOrderToDelete(null);
        setDeleteConfirmWordInput('');
        setDeleteError('');
        triggerToast(`✓ Orden ${orderNum} eliminada permanentemente de MongoDB`);
      }
    } catch (error) {
      console.error('Error eliminando orden:', error);
      triggerToast('Error de conexión: No se pudo eliminar la orden de MongoDB');
    }
  };

  // Botón Refrescar consulta nuevamente MongoDB
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
    triggerToast('✓ Órdenes y estados sincronizados desde MongoDB');
  };

  const handleResetFilters = () => {
    setSelectedStatus('all');
    setSelectedDeliveryType('all');
    setSelectedBranch('all');
    setSelectedPaymentMethod('all');
    setSearchQuery('');
  };

  const handleExportExcel = () => {
    const BOM = '\uFEFF';
    const separator = ';';
    const headers = [
      'Orden', 'Cliente', 'Teléfono', 'Correo', 'Modalidad de Entrega',
      'Venta Registrada en (Sistema POS)', 'Sucursal de Retiro',
      'Servicio de Transporte', 'Código de Seguimiento', 'Fecha',
      'Total (CLP)', 'Estado', 'Método de Pago', 'Productos'
    ].join(separator);

    const rows = filteredAndSortedOrders
      .map((o) => {
        const itemsText = o.items.map((it) => `${it.quantity}x ${it.name} ($${it.price})`).join(' | ');
        const isShipping = o.deliveryType === 'Despacho a Domicilio';
        const adminName = getAdminNameByBranchId(o.branchId, o.registeredByAdmin, allBranches);
        const posBranch = o.paymentMethod === 'Sistema POS' ? adminName : '';
        const pickupBranch = !isShipping ? o.pickupBranchName || o.branchName : '';
        return [
          `"${o.orderNumber}"`, `"${o.customerName.replace(/"/g, '""')}"`,
          `"${o.customerPhone}"`, `"${o.customerEmail}"`,
          `"${isShipping ? 'Envío a Domicilio' : 'Retiro Presencial'}"`,
          `"${posBranch}"`, `"${pickupBranch}"`,
          `"${isShipping ? o.shippingCourier || '' : ''}"`,
          `"${isShipping ? o.trackingNumber || '' : ''}"`,
          `"${o.date}"`, o.total, `"${o.status}"`,
          `"${o.paymentMethod}${o.paymentMethod === 'Khipu' ? ' (Solo por transferencias)' : ''}"`,
          `"${itemsText.replace(/"/g, '""')}"`
        ].join(separator);
      })
      .join('\n');

    const csvContent = BOM + headers + '\n' + rows;
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ordenes_de_Compra_NoLimits_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Archivo Excel descargado correctamente');
  };

  const handleExportPDF = () => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const rowsHtml = filteredAndSortedOrders
      .map((o) => {
        const isShipping = o.deliveryType === 'Despacho a Domicilio';
        const pickupBranch = o.pickupBranchName || o.branchName;
        const adminName = getAdminNameByBranchId(o.branchId, o.registeredByAdmin, allBranches);
        const deliveryDetail = [
          `<strong>${isShipping ? 'Envío a Domicilio' : 'Retiro Presencial'}</strong>`,
          o.paymentMethod === 'Sistema POS' ? `Venta registrada en: ${adminName}` : '',
          !isShipping ? `Sucursal de retiro: ${pickupBranch}` : '',
          isShipping && o.shippingCourier ? `servicio de transporte: ${o.shippingCourier}` : '',
          isShipping && o.trackingNumber ? `Seguimiento: ${o.trackingNumber}` : ''
        ].filter(Boolean).join('<br/>');

        const paymentDetail = o.paymentMethod === 'Khipu'
          ? 'Khipu <div style="font-size:9px;color:#4b5563;">Solo por transferencias</div>'
          : o.paymentMethod;

        return `
          <tr>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${o.orderNumber}</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1;">
              <strong>${o.customerName}</strong><br/>
              <span style="font-size: 9px; color: #475569;">${o.customerPhone}</span>
            </td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-size: 10px;">${deliveryDetail}</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-family: monospace; font-size: 10px;">${o.date}</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: right; font-family: monospace; font-weight: bold;">$${o.total.toLocaleString('es-CL')}</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 10px;">${o.status}</td>
            <td style="padding: 6px; border: 1px solid #cbd5e1; text-align: center; font-size: 10px;">${paymentDetail}</td>
          </tr>
        `;
      })
      .join('');

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Reporte de Órdenes de Compra - No Limits</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; color: #0f172a; }
              .header { border-bottom: 2px solid #003c74; padding-bottom: 10px; margin-bottom: 14px; }
              h1 { margin: 0; font-size: 16px; color: #003c74; text-transform: uppercase; }
              .sub { font-size: 11px; color: #475569; margin-top: 4px; }
              table { width: 100%; border-collapse: collapse; font-size: 11px; }
              th { background: #003c74; color: #ffffff; padding: 7px 6px; text-align: left; border: 1px solid #002a52; font-size: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>NO LIMITS APPAREL OS — REPORTE DE ÓRDENES DE COMPRA (MONGODB)</h1>
              <div class="sub">Super Administrador // Órdenes listadas: ${filteredAndSortedOrders.length} // Emisión: ${new Date().toLocaleString('es-CL')}</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ORDEN</th>
                  <th>CLIENTE</th>
                  <th>MODALIDAD DE ENTREGA & SUCURSAL</th>
                  <th>FECHA</th>
                  <th style="text-align: right;">TOTAL</th>
                  <th>ESTADO</th>
                  <th style="text-align: center;">MÉTODO DE PAGO</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </body>
        </html>
      `);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1500);
      }, 300);
    }
    triggerToast('Preparando documento PDF de Órdenes de Compra');
  };

  const isAllQuickFilterActive =
    selectedStatus === 'all' &&
    selectedDeliveryType === 'all' &&
    selectedBranch === 'all' &&
    selectedPaymentMethod === 'all';

  return (
    <div className="nl-purchase-orders-root space-y-4 font-sans text-gray-900 pb-16 relative">
      {/* Pantalla de carga superpuesta estilo Windows XP */}
      {isLoadingOrders && (
        <div className="absolute inset-0 z-50 bg-white/70 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#ece9d8] border-2 border-blue-900 p-4 shadow-xl flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-700 animate-spin" />
            <span className="font-bold text-xs text-blue-950">DESCARGANDO ÓRDENES DESDE MONGODB...</span>
          </div>
        </div>
      )}

      <WindowFrame
        title={
          isBranchAdmin && activeBranchObj
            ? `PURCHASE_ORDERS_MANAGER.SYS - [Órdenes de Compra - Sucursal ${activeBranchObj.city}]`
            : 'PURCHASE_ORDERS_MANAGER.SYS - [Gestión Integral de Órdenes de Compra - Super Admin]'
        }
        icon={<PixelIcon name="computer" size={16} />}
        statusBarText={
          isBranchAdmin && activeBranchObj
            ? `ADMIN SUCURSAL (${activeBranchObj.city.toUpperCase()}) // MONGODB ACTIVO // ÓRDENES DE SUCURSAL: ${branchScopedOrders.length} // MONTO SUCURSAL: $${summaryKPIs.totalRevenue.toLocaleString('es-CL')}`
            : `SUPER ADMIN // MONGODB ACTIVO // ÓRDENES AUDITADAS: ${branchScopedOrders.length} // SUCURSALES ACTIVAS: ${allBranches.length} // MONTO AUDITADO: $${summaryKPIs.totalRevenue.toLocaleString('es-CL')}`
        }
      >
        <div className="space-y-4 text-xs">
          <PurchaseOrdersHeader
            isBranchAdmin={isBranchAdmin}
            activeBranchObj={activeBranchObj}
            isRefreshing={isRefreshing}
            handleRefresh={handleRefresh}
            handleExportPDF={handleExportPDF}
            handleExportExcel={handleExportExcel}
            toastMessage={toastMessage}
            setToastMessage={setToastMessage}
            summaryKPIs={summaryKPIs}
          />

          <PurchaseOrdersFiltersBar
            branchScopedOrders={branchScopedOrders}
            filteredAndSortedOrders={filteredAndSortedOrders}
            dateSortOrder={dateSortOrder}
            setDateSortOrder={setDateSortOrder}
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
            selectedDeliveryType={selectedDeliveryType}
            setSelectedDeliveryType={setSelectedDeliveryType}
            selectedPaymentMethod={selectedPaymentMethod}
            setSelectedPaymentMethod={setSelectedPaymentMethod}
            selectedBranch={selectedBranch}
            setSelectedBranch={setSelectedBranch}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isBranchAdmin={isBranchAdmin}
            activeBranchObj={activeBranchObj}
            allBranches={allBranches}
            isAllQuickFilterActive={isAllQuickFilterActive}
          />

          <PurchaseOrdersTable
            filteredAndSortedOrders={filteredAndSortedOrders}
            expandedOrders={expandedOrders}
            toggleExpandProducts={toggleExpandProducts}
            setSelectedOrderForDetail={setSelectedOrderForDetail}
            isBranchAdmin={isBranchAdmin}
            allBranches={allBranches}
            requestStatusConfirmation={requestStatusConfirmation}
            handleInitiatePassToTransit={handleInitiatePassToTransit}
            handleOpenDeleteOrderModal={handleOpenDeleteOrderModal}
            handleResetFilters={handleResetFilters}
          />
        </div>
      </WindowFrame>

      <PurchaseOrdersModals
        transitShippingModalOrder={transitShippingModalOrder}
        setTransitShippingModalOrder={setTransitShippingModalOrder}
        trackingCodeInput={trackingCodeInput}
        setTrackingCodeInput={setTrackingCodeInput}
        transitConfirmWordInput={transitConfirmWordInput}
        setTransitConfirmWordInput={setTransitConfirmWordInput}
        trackingError={trackingError}
        setTrackingError={setTrackingError}
        handleConfirmTransitShipping={handleConfirmTransitShipping}
        pendingStatusTransition={pendingStatusTransition}
        setPendingStatusTransition={setPendingStatusTransition}
        handleConfirmPendingStatusTransition={handleConfirmPendingStatusTransition}
        orderToDelete={orderToDelete}
        setOrderToDelete={setOrderToDelete}
        deleteConfirmWordInput={deleteConfirmWordInput}
        setDeleteConfirmWordInput={setDeleteConfirmWordInput}
        deleteError={deleteError}
        setDeleteError={setDeleteError}
        handleConfirmDeleteOrder={handleConfirmDeleteOrder}
        selectedOrderForDetail={selectedOrderForDetail}
        setSelectedOrderForDetail={setSelectedOrderForDetail}
        allBranches={allBranches}
      />
    </div>
  );
};

export default PurchaseOrdersManagementView;
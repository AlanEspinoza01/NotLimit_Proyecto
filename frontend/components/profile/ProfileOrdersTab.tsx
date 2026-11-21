
import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Package,
  Clock,
  Truck,
  Store,
  CheckCircle2,
  Lock,
  RotateCcw,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  PurchaseOrder,
  ReturnRequest,
  getReturnEligibility,
  parseOrderDate
} from './profileTypes';
import { ProductStockDetail } from '../../views/admin/ProductStockSummaryView';

interface ProfileOrdersTabProps {
  orders: PurchaseOrder[];
  filteredOrders: PurchaseOrder[];
  ordersFilter: 'all' | 'solicitud' | 'preparation_transit' | 'pickup' | 'delivered';
  setOrdersFilter: (filter: 'all' | 'solicitud' | 'preparation_transit' | 'pickup' | 'delivered') => void;
  ordersSort: 'newest' | 'oldest';
  setOrdersSort: (sort: 'newest' | 'oldest') => void;
  returnRequests: ReturnRequest[];
  catalogProducts: ProductStockDetail[];
  setIsPickupScheduleModalOpen: (open: boolean) => void;
  handleOpenOrderReturn: (order: PurchaseOrder) => void;
  setRejectionModalReturn: (ret: ReturnRequest | null) => void;
}

export const ProfileOrdersTab: React.FC<ProfileOrdersTabProps> = ({
  orders,
  ordersFilter,
  setOrdersFilter,
  ordersSort,
  setOrdersSort,
  returnRequests,
  catalogProducts,
  setIsPickupScheduleModalOpen,
  handleOpenOrderReturn,
  setRejectionModalReturn
}) => {
  // El componente lee las órdenes desde la API autenticada para no depender del
  // localStorage anterior ni de precios reescritos con el catálogo vigente.
  // ProfileView.tsx no figura en el TXT nuevo: evitamos reemplazarlo con una versión antigua.
  const { currentUser, isLoading: isLoadingSession } = useAuth();
  const [serverOrders, setServerOrders] = useState<PurchaseOrder[] | null>(null);
  const [historyError, setHistoryError] = useState('');

  const normalizeStep = (raw: unknown, payment: string): PurchaseOrder['currentStatus'] => {
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

  useEffect(() => {
    if (isLoadingSession) return;
    if (!currentUser?.id || currentUser.role === 'guest') {
      setServerOrders([]);
      setHistoryError('');
      return;
    }
    let active = true;
    setServerOrders(null);
    setHistoryError('');
    void api.get('/orders/my-orders').then(({ data }) => {
      if (!active) return;
      if (!data?.success || !Array.isArray(data?.data)) throw new Error('Respuesta de órdenes inválida');
      // Defensa adicional: aunque el servidor ya filtra, no exhibir intentos
      // de pago pendientes, rechazados ni reembolsados en el historial.
      const paidOrders = data.data.filter((o: any) => String(o.paymentStatus || '').toUpperCase() === 'CONFIRMED');
      const mapped: PurchaseOrder[] = paidOrders.map((o: any) => {
        const paymentStatus: PurchaseOrder['paymentStatus'] =
          ['PENDING', 'CONFIRMED', 'REJECTED', 'REFUNDED'].includes(String(o.paymentStatus).toUpperCase())
            ? String(o.paymentStatus).toUpperCase() as PurchaseOrder['paymentStatus']
            : 'PENDING';
        const timestamp = new Date(o.createdAt || o.date || 0).getTime();
        const purchasedAt = Number.isFinite(timestamp) ? timestamp : 0;
        const subtotal = Number(o.subtotal ?? o.total ?? 0) || 0;
        const shippingCost = Number(o.shippingCost ?? 0) || 0;
        const total = Number(o.total ?? 0) || 0;
        const address = o.shippingDetails?.address;
        const itemRows = Array.isArray(o.items) ? o.items : [];
        return {
          id: String(o._id || o.id || o.orderNumber),
          orderNumber: String(o.orderNumber || 'Orden sin número'),
          date: purchasedAt ? new Date(purchasedAt).toLocaleString('es-CL', {
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
          }) : 'Fecha no registrada',
          purchasedAt,
          subtotal, shippingCost, total,
          discountAmount: Math.max(0, subtotal + shippingCost - total),
          paymentStatus,
          paymentMethod: String(o.paymentMethod || 'No registrado'),
          deliveryMethod: o.deliveryType === 'envio' ? 'shipping' : 'pickup',
          branchId: String(o.pickupBranchId || o.branchId || ''),
          branchName: String(o.branchName || o.pickupBranchId || 'Sucursal no indicada'),
          courier: o.shippingDetails?.courier || undefined,
          shippingAddress: address
            ? [address.street, address.number, address.apartment, address.comuna, address.region].filter(Boolean).join(', ')
            : undefined,
          trackingNumber: o.shippingDetails?.trackingNumber || undefined,
          // En una orden pagada, prevalece fulfillmentStatus. En una no pagada no
          // se debe mostrar un pedido como ya preparado o entregado.
          currentStatus: normalizeStep(
            /solicitud[ _]recibida|preparaci[oó]n|[ _]transit[oó]|listo.*retiro|retirad|entregad/i.test(String(o.fulfillmentStatus || ''))
              ? o.fulfillmentStatus : (o.status || o.fulfillmentStatus),
            String(paymentStatus)
          ),
          items: itemRows.map((it: any) => {
            const productId = String(it.productId || '');
            const match = catalogProducts.find(product =>
              product.id === productId || (it.sku && product.sku === it.sku)
            );
            return {
              productId,
              title: String(it.name || it.title || 'Producto'),
              size: String(it.size || 'Única'),
              color: match?.colors?.[0]?.name || '',
              quantity: Number(it.quantity ?? 1) || 1,
              // PRECIO CONGELADO DE LA ORDEN; no el precio actualizado del catálogo.
              price: Number(it.price ?? it.unitPrice ?? 0) || 0,
              image: match?.images?.[0] || '',
              isReviewed: Boolean(it.isReviewed)
            };
          })
        };
      });
      setServerOrders(mapped);
    }).catch(() => {
      if (active) {
        setServerOrders([]);
        setHistoryError('No se pudo cargar el historial desde MongoDB. Actualiza la página para volver a intentarlo.');
      }
    });
    return () => { active = false; };
  }, [currentUser?.id, currentUser?.role, isLoadingSession]);

  const historyOrders = useMemo(() => {
    const base = serverOrders || [];
    const selected = base.filter(o => {
      if (ordersFilter === 'solicitud') return o.currentStatus === 'Solicitud recibida';
      if (ordersFilter === 'preparation_transit') return o.currentStatus === 'En Preparación' || o.currentStatus === 'En transito';
      if (ordersFilter === 'pickup') return o.currentStatus === 'Listo para el retiro de sucursal';
      if (ordersFilter === 'delivered') return o.currentStatus === 'Entregado' || o.currentStatus === 'Retirado';
      return true;
    });
    return selected.sort((a, b) => {
      const da = a.purchasedAt ?? parseOrderDate(a.date);
      const db = b.purchasedAt ?? parseOrderDate(b.date);
      return (ordersSort === 'oldest' ? da - db : db - da) || a.orderNumber.localeCompare(b.orderNumber);
    });
  }, [serverOrders, ordersFilter, ordersSort]);

  /**
   * Helper para obtener los pasos obligatorios según método de entrega
   */
  const getOrderSteps = (order: PurchaseOrder) => {
    if (order.deliveryMethod === 'shipping') {
      return [
        { label: 'Solicitud recibida', key: 'Solicitud recibida' },
        { label: 'En Preparación', key: 'En Preparación' },
        { label: 'En transito', key: 'En transito' },
        { label: 'Entregado', key: 'Entregado' }
      ];
    }

    // Modalidad Retiro en Sucursal: incluye la sucursal específica (Valparaíso, Viña del Mar, Quilpué)
    const branchLabel = order.branchName || 'Viña del Mar';
    return [
      { label: 'Solicitud recibida', key: 'Solicitud recibida' },
      { label: 'En Preparación', key: 'En Preparación' },
      { label: 'En transito', key: 'En transito' },
      { label: `Listo para el retiro de sucursal (${branchLabel})`, key: 'Listo para el retiro de sucursal' },
      { label: 'Retirado', key: 'Retirado' }
    ];
  };

  /**
   * Helper para calcular el índice de progreso actual
   */
  const getStepStatus = (order: PurchaseOrder, stepKey: string, stepIndex: number) => {
    const steps = getOrderSteps(order);
    if (order.paymentStatus && order.paymentStatus !== 'CONFIRMED') return 'pending';
    const currentIndex = steps.findIndex(s => s.key === order.currentStatus);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  return (
    <div className="space-y-4">
      {/* Cabecera de la Pestaña */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-300 gap-2">
        <div>
          <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-blue-700" />
            Historial de Compras
          </h4>
          <p className="text-[11px] text-gray-500">
            Trazabilidad completa con estados oficiales de preparación, tránsito y entrega.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIsPickupScheduleModalOpen(true)}
            className="winxp-button winxp-button-primary text-xs py-1 px-3 font-bold flex items-center gap-1.5 cursor-pointer text-blue-900 bg-blue-50 hover:bg-blue-100 border-blue-600 shadow-xs transition-colors"
            title="Ver horarios de retiro de las sucursales disponibles"
          >
            <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>Ver Horarios de Retiro</span>
          </button>
          <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 border border-gray-300">
            {historyOrders.length} de {serverOrders?.length ?? 0} compras registradas
          </span>
        </div>
      </div>

      {/* Filtros de Compras y Ordenamiento Cronológico */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* Filtros por Estado */}
        <div className="flex flex-wrap gap-1 text-xs">
          <button
            type="button"
            onClick={() => setOrdersFilter('all')}
            className={`winxp-button text-[11px] py-1 px-2.5 cursor-pointer flex items-center gap-1.5 ${
              ordersFilter === 'all' ? 'winxp-button-primary font-bold' : ''
            }`}
          >
            <Package className="w-3 h-3 text-blue-700 shrink-0" />
            <span>Todas ({serverOrders?.length ?? 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setOrdersFilter('solicitud')}
            className={`winxp-button text-[11px] py-1 px-2.5 cursor-pointer flex items-center gap-1.5 ${
              ordersFilter === 'solicitud' ? 'winxp-button-primary font-bold' : ''
            }`}
          >
            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Solicitud</span>
          </button>
          <button
            type="button"
            onClick={() => setOrdersFilter('preparation_transit')}
            className={`winxp-button text-[11px] py-1 px-2.5 cursor-pointer flex items-center gap-1.5 ${
              ordersFilter === 'preparation_transit' ? 'winxp-button-primary font-bold' : ''
            }`}
          >
            <Truck className="w-3 h-3 text-blue-600 shrink-0" />
            <span>En Preparación / Transito</span>
          </button>
          <button
            type="button"
            onClick={() => setOrdersFilter('pickup')}
            className={`winxp-button text-[11px] py-1 px-2.5 cursor-pointer flex items-center gap-1.5 ${
              ordersFilter === 'pickup' ? 'winxp-button-primary font-bold' : ''
            }`}
          >
            <Store className="w-3 h-3 text-purple-700 shrink-0" />
            <span>Retiro en Sucursal</span>
          </button>
          <button
            type="button"
            onClick={() => setOrdersFilter('delivered')}
            className={`winxp-button text-[11px] py-1 px-2.5 cursor-pointer flex items-center gap-1.5 ${
              ordersFilter === 'delivered' ? 'winxp-button-primary font-bold' : ''
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
            <span>Entregados / Retirados</span>
          </button>
        </div>

        {/* Filtros de Orden Cronológico: Ordenes mas Nuevas / Ordenes mas Viejas */}
        <div className="flex items-center gap-1 text-xs shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setOrdersSort('newest')}
            className={`winxp-button text-[11px] py-1 px-2.5 cursor-pointer ${
              ordersSort === 'newest' ? 'winxp-button-primary font-bold shadow-inner' : ''
            }`}
            title="Mostrar desde las órdenes más nuevas hasta las más viejas"
          >
            Ordenes mas Nuevas
          </button>
          <button
            type="button"
            onClick={() => setOrdersSort('oldest')}
            className={`winxp-button text-[11px] py-1 px-2.5 cursor-pointer ${
              ordersSort === 'oldest' ? 'winxp-button-primary font-bold shadow-inner' : ''
            }`}
            title="Mostrar desde las órdenes más viejas hasta las más nuevas"
          >
            Ordenes mas Viejas
          </button>
        </div>
      </div>

      {/* Listado de Órdenes */}
      <div className="space-y-4">
        {serverOrders === null ? (
          <div className="p-8 text-center text-gray-600 text-xs border border-gray-300">Cargando historial de compras desde MongoDB…</div>
        ) : historyError ? (
          <div role="alert" className="p-5 text-center text-red-800 text-xs border border-red-300 bg-red-50">{historyError}</div>
        ) : historyOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-xs border border-dashed border-gray-300 bg-gray-50">
            No se encontraron compras en esta categoría.
          </div>
        ) : (
          historyOrders.map((order) => {
            const steps = getOrderSteps(order);
            const isPickup = order.deliveryMethod === 'pickup';
            // Solo se muestra un seguimiento realmente registrado por el administrador.
            const resolvedTrackingNumber = order.trackingNumber?.trim();

            return (
              <div
                key={order.id}
                className="bg-[#fafbfc] border border-gray-400 p-3.5 space-y-3 winxp-bevel-out shadow-xs"
              >
                {/* Fila Superior: Número de Orden, Tipo de Entrega, Botón de Solicitud de Devolución y Estado Actual */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-300 pb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-blue-900 font-mono">
                        Orden #{order.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 border ${
                          isPickup
                            ? 'bg-purple-100 text-purple-900 border-purple-400'
                            : 'bg-blue-100 text-blue-900 border-blue-400'
                        }`}
                      >
                        {isPickup ? `🏪 Retiro en ${order.branchName}` : `🚚 Envío (${order.courier || 'servicio sin asignar'})`}
                      </span>
                      {!isPickup && order.currentStatus === 'En transito' && resolvedTrackingNumber && (
                        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 border border-indigo-400 bg-indigo-50 text-indigo-950 rounded-xs inline-flex items-center gap-1.5 shadow-2xs">
                          <Truck className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                          <span>
                            Código de seguimiento: <strong className="text-indigo-900">{resolvedTrackingNumber}</strong>
                          </span>
                        </span>
                      )}

                      {/* UBICACIÓN EXACTA: Cuadro rojo indicado por el usuario para el botón "Solicitud de Devolución" */}
                      {(() => {
                        const isDeliveredOrPickedUp =
                          order.currentStatus === 'Entregado' || order.currentStatus === 'Retirado';
                        const returnEligibility = getReturnEligibility(order.date);

                        // Verificar si todas las prendas de la orden ya tienen devolución aprobada
                        const allItemsCompletedReturn =
                          order.items.length > 0 &&
                          order.items.every(it => {
                            const ret = returnRequests.find(
                              r => r.orderNumber === order.orderNumber && r.productId === it.productId
                            );
                            return (
                              ret &&
                              (ret.currentStatus === 'Aprobada' ||
                                ret.currentStatus === 'Envió a punto' ||
                                ret.currentStatus === 'Retiro Presencial' ||
                                ret.currentStatus === 'Envió a punto/sucursal')
                            );
                          });

                        if (allItemsCompletedReturn) {
                          return (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 border border-emerald-500 text-emerald-900 rounded-xs text-xs font-bold shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span>Ya se hizo la devolución (Aprobada)</span>
                            </div>
                          );
                        }

                        // Si la orden aún no está Retirada ni Entregada
                        if (!isDeliveredOrPickedUp) {
                          const isReadyPickup = order.currentStatus === 'Listo para el retiro de sucursal';
                          return (
                            <button
                              type="button"
                              disabled
                              className="winxp-button text-xs py-0.5 px-2.5 font-medium flex items-center gap-1.5 cursor-not-allowed opacity-60 bg-gray-100 text-gray-500 border-gray-300 select-none"
                              title={
                                isReadyPickup
                                  ? `Esta orden está lista pero aún no ha sido retirada de ${order.branchName || 'sucursal'}. No se pueden solicitar ni rechazar devoluciones sin haber retirado el producto.`
                                  : 'La solicitud de devolución sólo está disponible cuando la orden esté Retirada o Entregada'
                              }
                            >
                              <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                              <span>
                                {isReadyPickup
                                  ? 'No retirada aún (Disponible tras retiro)'
                                  : 'Disponible tras entrega o retiro'}
                              </span>
                            </button>
                          );
                        }

                        // REGLA OBLIGATORIA:
                        // En el estado "Retirado" o "Entregado", si se hizo una devolución pero esta fue rechazada,
                        // se tiene que bloquear el botón de "Solicitud de Devolución".
                        const hasRejectedReturn = order.items.some(it => {
                          const ret = returnRequests.find(
                            r => r.orderNumber === order.orderNumber && r.productId === it.productId
                          );
                          return ret && (ret.currentStatus === 'Rechazada' || !!ret.rejectionReason);
                        });

                        // Prendas de la orden que aún no tienen ninguna solicitud de devolución registrada
                        const remainingItemsWithoutReturn = order.items.filter(it => {
                          const ret = returnRequests.find(
                            r => r.orderNumber === order.orderNumber && r.productId === it.productId
                          );
                          return !ret;
                        });

                        // Si se hizo una devolución y fue rechazada:
                        if (hasRejectedReturn) {
                          return (
                            <button
                              type="button"
                              disabled
                              className="winxp-button text-xs py-1 px-3 font-bold flex items-center gap-1.5 cursor-not-allowed opacity-60 bg-gray-100 text-gray-500 border-gray-400 select-none shadow-xs"
                              title="La solicitud de devolución para esta orden fue rechazada por la administración. El botón de solicitud de devolución está bloqueado."
                            >
                              <Lock className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              <span className="font-bold">Solicitud de Devolución</span>
                              <span
                                data-force-white
                                style={{ color: '#ffffff', backgroundColor: '#dc2626' }}
                                className="!text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 inline-flex items-center shadow-xs"
                              >
                                Bloqueada (Rechazada)
                              </span>
                            </button>
                          );
                        }

                        // Si todas las prendas de la orden ya tienen solicitud en revisión o proceso
                        const allItemsInReview =
                          order.items.length > 0 &&
                          order.items.every(it => {
                            const ret = returnRequests.find(
                              r => r.orderNumber === order.orderNumber && r.productId === it.productId
                            );
                            return ret && (ret.currentStatus === 'Solicitud recibida' || ret.currentStatus === 'Revisión de equipo');
                          });

                        if (allItemsInReview) {
                          return (
                            <button
                              type="button"
                              disabled
                              className="winxp-button text-xs py-1 px-3 font-bold flex items-center gap-1.5 cursor-not-allowed opacity-75 bg-blue-50 text-blue-800 border-blue-300 select-none shadow-xs"
                              title="La solicitud de devolución para esta orden se encuentra actualmente en revisión por el equipo"
                            >
                              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span className="font-bold">Devolución en Revisión</span>
                            </button>
                          );
                        }

                        // Si pasaron más de 7 días
                        if (!returnEligibility.isEligible) {
                          return (
                            <button
                              type="button"
                              disabled
                              className="winxp-button text-xs py-0.5 px-2.5 font-medium flex items-center gap-1.5 cursor-not-allowed opacity-60 bg-gray-100 text-gray-500 border-gray-300 select-none"
                              title="Plazo de garantía de 7 días expirado"
                            >
                              <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                              <span>Plazo de 7 días expirado</span>
                            </button>
                          );
                        }

                        // Orden Retirada o Entregada y dentro de plazo -> Botón Habilitado
                        return (
                          <button
                            type="button"
                            onClick={() => handleOpenOrderReturn(order)}
                            className="winxp-button winxp-button-primary text-xs py-1 px-3 font-bold flex items-center gap-1.5 cursor-pointer shadow-xs bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-600 transition-colors"
                            title={
                              order.items.length > 1
                                ? `Esta orden tiene ${order.items.length} productos (${remainingItemsWithoutReturn.length} disponibles). Haz clic para seleccionar cuál devolver`
                                : 'Iniciar solicitud de cambio o devolución'
                            }
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span className="font-bold">Solicitud de Devolución</span>
                            <span
                              data-force-white
                              style={{ color: '#ffffff' }}
                              className="bg-blue-700 !text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 inline-flex items-center shadow-xs"
                            >
                              {returnEligibility.daysLeft} {returnEligibility.daysLeft === 1 ? 'día rest.' : 'días rest.'}
                            </span>
                          </button>
                        );
                      })()}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                      <span>Fecha de compra: {order.date} · {order.paymentStatus === 'CONFIRMED' ? 'Pagado' : 'Total de orden'}: ${order.total.toLocaleString('es-CL')} CLP</span>
                      <span className={`px-1.5 py-0.5 border font-semibold ${order.paymentStatus === 'CONFIRMED' ? 'text-green-900 bg-green-50 border-green-300' : order.paymentStatus === 'PENDING' ? 'text-amber-900 bg-amber-50 border-amber-300' : 'text-red-900 bg-red-50 border-red-300'}`}>
                        {order.paymentStatus === 'CONFIRMED' ? 'Pago confirmado' : order.paymentStatus === 'PENDING' ? 'Pago pendiente' : order.paymentStatus === 'REFUNDED' ? 'Reembolsado' : 'Pago rechazado / anulado'}
                      </span>
                      {order.items.length > 1 && (
                        <span className="text-[10px] text-blue-800 font-semibold bg-blue-50 px-1.5 py-0.2 border border-blue-200 rounded-xs">
                          {order.items.length} prendas en esta compra
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Badge con el Estado Actual Oficial (Diseño Vibrante con Texto Blanco Garantizado) */}
                  <div className="shrink-0">
                    {(() => {
                      const isFinished = order.currentStatus === 'Entregado' || order.currentStatus === 'Retirado';
                      const isReadyPickup = order.currentStatus === 'Listo para el retiro de sucursal';
                      const isTransit = order.currentStatus === 'En transito';

                      let badgeBg = 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)';
                      let badgeBorder = '#075985';
                      let BadgeIcon = Clock;

                      if (isFinished) {
                        badgeBg = 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)';
                        badgeBorder = '#14532d';
                        BadgeIcon = Check;
                      } else if (isReadyPickup) {
                        badgeBg = 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)';
                        badgeBorder = '#92400e';
                        BadgeIcon = Store;
                      } else if (isTransit) {
                        badgeBg = 'linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)';
                        badgeBorder = '#1e3a8a';
                        BadgeIcon = Truck;
                      }

                      const displayText = isReadyPickup
                        ? `Listo para retiro (${order.branchName})`
                        : order.currentStatus;

                      return (
                        <span
                          style={{
                            background: badgeBg,
                            borderColor: badgeBorder,
                            color: '#ffffff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)'
                          }}
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 border rounded-xs select-none ${
                            isReadyPickup ? 'animate-pulse' : ''
                          }`}
                        >
                          <BadgeIcon className="w-3.5 h-3.5 shrink-0" style={{ color: '#ffffff' }} />
                          <span style={{ color: '#ffffff', fontWeight: 'bold' }}>
                            {displayText}
                          </span>
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* =========================================================
                    DISEÑO DE ESTADOS OBLIGATORIOS (Timeline / Pipeline Retro)
                    Solicitud recibida -> En Preparación -> En transito -> 
                    Listo para el retiro de sucursal -> Entregado / Retirado
                    ========================================================= */}
                <div className="bg-white border border-gray-300 p-2.5 space-y-2">
                  <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Línea de Estado del Pedido:</span>
                    <span className="text-blue-800 font-mono text-[10px]">
                      {isPickup ? 'Flujo de Retiro Presencial' : 'Flujo de Despacho Domicilio'}
                    </span>
                  </div>

                  {order.paymentStatus !== 'CONFIRMED' && (
                    <p className="bg-amber-50 border border-amber-300 p-2 text-xs text-amber-950">
                      {order.paymentStatus === 'PENDING' ? 'La preparación comienza una vez confirmado el pago.'
                        : order.paymentStatus === 'REFUNDED' ? 'Esta compra fue reembolsada.'
                        : 'Esta compra fue anulada o rechazada; no sigue avanzando.'}
                    </p>
                  )}

                  {/* Visual Stepper Horizontal con Estado Actual Embellecido y Texto Blanco */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-5 gap-1.5 pt-1">
                    {steps.map((step, idx) => {
                      const status = getStepStatus(order, step.key, idx);

                      if (status === 'current') {
                        return (
                          <div
                            key={idx}
                            style={{
                              background: 'linear-gradient(180deg, #1e69de 0%, #0050cf 45%, #003fb5 50%, #002d8f 100%)',
                              borderColor: '#06266f',
                              color: '#ffffff',
                              boxShadow: '0 2px 5px rgba(0, 30, 90, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.45)'
                            }}
                            className="p-2 border rounded-xs text-center transition-all flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#ffffff] animate-ping" />
                              <span className="font-mono text-[11px] font-black" style={{ color: '#ffffff' }}>
                                {idx + 1}.
                              </span>
                            </div>
                            <div
                              className="text-[11px] leading-snug font-bold tracking-tight my-0.5"
                              style={{ color: '#ffffff' }}
                            >
                              {step.label}
                            </div>
                            <div className="pt-1">
                              <span
                                className="inline-block px-1.5 py-0.5 text-[9px] uppercase font-black tracking-wider rounded-xs shadow-xs"
                                style={{
                                  backgroundColor: '#ffffff',
                                  color: '#003fb5',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                }}
                              >
                                ★ Estado Actual ★
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (status === 'completed') {
                        return (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: '#f0fdf4',
                              borderColor: '#86efac',
                              color: '#166534'
                            }}
                            className="p-2 border rounded-xs text-center transition-all flex flex-col justify-between"
                          >
                            <div className="flex items-center justify-center gap-1 mb-1 text-[11px]">
                              <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />
                              <span className="font-mono font-bold text-green-800">{idx + 1}.</span>
                            </div>
                            <div className="text-[10px] leading-snug text-green-900 font-semibold">
                              {step.label}
                            </div>
                            <div className="text-[9px] text-green-600 font-bold uppercase mt-1">
                              ✓ Completado
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: '#f8fafc',
                            borderColor: '#e2e8f0',
                            color: '#94a3b8'
                          }}
                          className="p-2 border rounded-xs text-center transition-all flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-center gap-1 mb-1 text-[11px] font-mono text-gray-400">
                            <span>{idx + 1}.</span>
                          </div>
                          <div className="text-[10px] leading-snug text-gray-400 font-medium">
                            {step.label}
                          </div>
                          <div className="text-[9px] text-gray-400 font-mono mt-1">
                            Pendiente
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!isPickup && order.currentStatus === 'En transito' && (
                    <div className="mt-2 p-2 bg-indigo-50 border border-indigo-300 rounded-xs flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-indigo-950">
                        <Truck className="w-4 h-4 text-indigo-700 shrink-0" />
                        <span>
                          Envío en tránsito vía <strong>{order.courier || 'servicio aún no asignado'}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono text-xs bg-white px-2.5 py-1 border border-indigo-300 rounded-xs shadow-2xs">
                        <span className="text-gray-600 font-sans font-semibold">Código de seguimiento:</span>
                        <strong className="text-indigo-900 font-black tracking-wide">{resolvedTrackingNumber || 'Aún no disponible'}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Montos históricos guardados en orders: no recalcular precios con el catálogo actual. */}
                <div className="bg-blue-50 border border-blue-200 p-2.5 text-xs text-gray-800 space-y-1">
                  <div className="flex justify-between gap-2"><span>Subtotal de productos al comprar</span><strong>${Number(order.subtotal ?? order.total).toLocaleString('es-CL')} CLP</strong></div>
                  {(order.discountAmount ?? 0) > 0 && (
                    <div className="flex justify-between gap-2 text-green-900"><span>Descuento aplicado (cupón u otro beneficio)</span><strong>−${Number(order.discountAmount).toLocaleString('es-CL')} CLP</strong></div>
                  )}
                  <div className="flex justify-between gap-2"><span>Envío</span><strong>${Number(order.shippingCost ?? 0).toLocaleString('es-CL')} CLP</strong></div>
                  <div className="flex justify-between gap-2 border-t border-blue-200 pt-1 font-bold text-blue-950"><span>{order.paymentStatus === 'CONFIRMED' ? 'Monto pagado' : 'Total de la orden'}</span><span>${order.total.toLocaleString('es-CL')} CLP</span></div>
                </div>

                {/* Lista de Prendas Compradas en este Pedido */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-bold text-gray-700">Prendas de esta Compra:</div>
                  {order.items.map((item, idx) => {
                    const catalogProd = catalogProducts.find(p => p.id === item.productId || p.title === item.title);
                    // Mantener el nombre, talla y precio que figuraban en la compra original.
                    const displayTitle = item.title;
                    const displayImage = item.image || catalogProd?.images?.[0] || '';
                    const displayPrice = item.price;
                    const taxonomyLabel = catalogProd
                      ? [catalogProd.section, catalogProd.category, catalogProd.subCategory]
                          .filter(Boolean)
                          .join(' › ')
                      : '';

                    return (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-white border border-gray-300"
                      >
                        <div className="flex items-center gap-2.5">
                          <Link to={`/product/${catalogProd?.id || item.productId}`} className="shrink-0">
                            <img
                              src={displayImage}
                              alt={displayTitle}
                              className="w-12 h-12 object-cover border border-gray-400 shrink-0 hover:opacity-90 transition-opacity"
                            />
                          </Link>
                          <div>
                            {taxonomyLabel && (
                              <div className="text-[9px] font-bold text-blue-700 uppercase tracking-tight">
                                {taxonomyLabel}
                              </div>
                            )}
                            <Link
                              to={`/product/${catalogProd?.id || item.productId}`}
                              className="font-bold text-xs text-gray-900 hover:text-blue-800 hover:underline block"
                            >
                              {displayTitle}
                            </Link>
                            <div className="text-[11px] text-gray-500">
                              Talla: <strong className="text-gray-700">{item.size}</strong> · Cantidad:{' '}
                              <strong className="text-gray-700">{item.quantity}</strong>
                            </div>
                            <div className="text-[11px] font-bold text-red-700">
                              ${displayPrice.toLocaleString('es-CL')} CLP por unidad
                            </div>
                            <div className="text-[10px] text-gray-600">
                              Subtotal de esta prenda: ${(displayPrice * item.quantity).toLocaleString('es-CL')} CLP
                            </div>
                          </div>
                        </div>

                        {/* Estado de Devolución a Nivel de Prenda */}
                        <div className="shrink-0 sm:text-right">
                          {(() => {
                            const isDeliveredOrPickedUp =
                              order.currentStatus === 'Entregado' || order.currentStatus === 'Retirado';

                            // REGLA OBLIGATORIA:
                            // En el estado "Listo para el retiro de sucursal" (o cualquier estado previo al retiro o entrega),
                            // una devolución NO puede ser rechazada si nunca fue retirada.
                            if (!isDeliveredOrPickedUp) {
                              if (order.currentStatus === 'Listo para el retiro de sucursal') {
                                return (
                                  <div className="flex flex-col items-start sm:items-end gap-0.5">
                                    <span className="text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-300 px-2 py-0.5 rounded-xs flex items-center gap-1 shadow-2xs">
                                      <Store className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      <span>No retirada aún · Retiro en sucursal pendiente</span>
                                    </span>
                                    <span className="text-[9px] text-gray-500 font-medium">
                                      Devoluciones disponibles solo tras retirar en {order.branchName || 'sucursal'}
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                                  Disponible solo al ser Retirado o Entregado
                                </span>
                              );
                            }

                            // Si la orden ya fue "Retirado" o "Entregado":
                            const existingReturn = returnRequests.find(
                              r => r.orderNumber === order.orderNumber && r.productId === item.productId
                            );

                            // Caso 1: Ya existe una devolución registrada para este producto en orden retirada o entregada
                            if (existingReturn) {
                              const isRejected = existingReturn.currentStatus === 'Rechazada' || !!existingReturn.rejectionReason;
                              if (isRejected) {
                                return (
                                  <div className="flex flex-col items-start sm:items-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setRejectionModalReturn(existingReturn)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 hover:bg-red-200 border border-red-500 text-red-900 rounded-xs text-xs font-bold shadow-xs cursor-pointer transition-colors"
                                      title="Hacer clic para ver el motivo del rechazo en una ventanita"
                                    >
                                      <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                                      <span>Devolución rechazada</span>
                                      <span className="text-[10px] text-red-700 underline font-semibold ml-0.5">(Ver motivo)</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setRejectionModalReturn(existingReturn)}
                                      className="winxp-button text-[11px] py-0.5 px-2.5 font-bold text-red-800 hover:bg-red-50 border-red-400 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                                      title="Ver ventanita con el motivo del rechazo de la devolución"
                                    >
                                      <span>Ver motivo del rechazo</span>
                                      <span className="text-[10px]">🔍</span>
                                    </button>
                                  </div>
                                );
                              }

                              // Devolución aprobada o en proceso
                              const isApproved = existingReturn.currentStatus === 'Aprobada';
                              return (
                                <div className="flex flex-col items-start sm:items-end gap-1">
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 border border-emerald-500 text-emerald-900 rounded-xs text-xs font-bold shadow-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                    <span>Ya se hizo la devolución</span>
                                  </div>
                                  <span className="text-[10px] text-emerald-700 font-semibold">
                                    {isApproved ? 'Devolución Aprobada' : `Estado: ${existingReturn.currentStatus}`}
                                  </span>
                                </div>
                              );
                            }

                            // Caso 2: El pedido fue Entregado o Retirado
                            const returnEligibility = getReturnEligibility(order.date);
                            if (returnEligibility.isEligible) {
                              return (
                                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  Garantía de 7 días activa ({returnEligibility.statusLabel})
                                </span>
                              );
                            }

                            return (
                              <span className="text-[10px] text-red-600 font-medium flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-red-500 shrink-0" />
                                Plazo de 7 días expirado (+{returnEligibility.daysElapsed} días desde la compra)
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

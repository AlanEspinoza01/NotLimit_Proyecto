import React from 'react';
import {
  ShoppingBag,
  Receipt,
  Eye,
  User,
  Phone,
  Truck,
  Store,
  Calendar,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
  Package,
  Lock,
  Trash2,
  Info
} from 'lucide-react';
import { Branch } from '../../../types';
import {
  PurchaseOrderRecord,
  PurchaseOrderStatus,
  STATUS_DEFINITIONS,
  getAdminNameByBranchId,
  getPaymentMethodBadge
} from './purchaseOrdersTypes';

interface PurchaseOrdersTableProps {
  filteredAndSortedOrders: PurchaseOrderRecord[];
  expandedOrders: Record<string, boolean>;
  toggleExpandProducts: (orderId: string) => void;
  setSelectedOrderForDetail: (order: PurchaseOrderRecord | null) => void;
  isBranchAdmin: boolean;
  allBranches: Branch[];
  requestStatusConfirmation: (
    order: PurchaseOrderRecord,
    nextStatus: PurchaseOrderStatus,
    auditNote: string,
    descriptionText: string
  ) => void;
  handleInitiatePassToTransit: (order: PurchaseOrderRecord) => void;
  handleOpenDeleteOrderModal: (order: PurchaseOrderRecord) => void;
  handleResetFilters: () => void;
}

export const PurchaseOrdersTable: React.FC<PurchaseOrdersTableProps> = ({
  filteredAndSortedOrders,
  expandedOrders,
  toggleExpandProducts,
  setSelectedOrderForDetail,
  isBranchAdmin,
  allBranches,
  requestStatusConfirmation,
  handleInitiatePassToTransit,
  handleOpenDeleteOrderModal,
  handleResetFilters
}) => {
  return (
    <>
      {/* TABLA PRINCIPAL DE ÓRDENES DE COMPRA */}
      <div className="nl-orders-table-scroll border border-gray-400 bg-white shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#ece9d8] border-b-2 border-gray-400 text-gray-900 font-bold text-[11px]">
            <tr>
              <th className="p-2.5 border-r border-gray-300 w-28">ORDEN</th>
              <th className="p-2.5 border-r border-gray-300">CLIENTE / CONTACTO</th>
              <th className="p-2.5 border-r border-gray-300">MODALIDAD DE ENTREGA &amp; SUCURSAL</th>
              <th className="p-2.5 border-r border-gray-300 w-32">FECHA</th>
              <th className="p-2.5 border-r border-gray-300 text-right w-24">TOTAL</th>
              <th className="p-2.5 border-r border-gray-300 w-52">ESTADO</th>
              <th className="p-2.5 border-r border-gray-300 w-36 text-center">MÉTODO DE PAGO</th>
              <th className="p-2.5 text-center w-64">PRODUCTOS / ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-gray-500">
                  <ShoppingBag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="font-bold text-sm text-gray-700">
                    No se encontraron órdenes con los filtros seleccionados.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Prueba cambiando el estado, modalidad de entrega, método de pago o sucursal seleccionada.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="winxp-button text-xs py-1 px-3 mt-3 text-blue-900 font-bold"
                  >
                    Restablecer todos los filtros
                  </button>
                </td>
              </tr>
            ) : (
              filteredAndSortedOrders.map((ord) => {
                const statusMeta = STATUS_DEFINITIONS[ord.status] || {
                  label: ord.status,
                  description: '',
                  badgeClass: 'bg-gray-100 text-gray-900 border-gray-400',
                  category: 'operacion'
                };
                const isExpanded = !!expandedOrders[ord.id];
                const isShipping = ord.deliveryType === 'Despacho a Domicilio';
                const pickupBranch = ord.pickupBranchName || ord.branchName;

                return (
                  <React.Fragment key={ord.id}>
                    <tr className="hover:bg-blue-50/70 transition-colors">
                      {/* 1. ORDEN */}
                      <td className="p-2.5 border-r border-gray-200 align-middle">
                        <div className="font-mono font-black text-xs text-[#003c74] flex items-center gap-1">
                          <Receipt className="w-3.5 h-3.5 text-blue-700" />
                          <span>{ord.orderNumber}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5 font-mono">
                          ID: {ord.id}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForDetail(ord)}
                          className="mt-1 text-[10px] text-blue-800 hover:underline flex items-center gap-0.5 font-bold"
                          title="Ver comprobante detallado"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Ver Comprobante</span>
                        </button>
                      </td>

                      {/* 2. CLIENTE (Nombre y Teléfono) */}
                      <td className="p-2.5 border-r border-gray-200 align-middle">
                        <div className="font-bold text-gray-900 text-xs flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          <span>{ord.customerName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px]">
                          <a
                            href={`tel:${ord.customerPhone}`}
                            className="font-mono font-bold text-blue-900 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-emerald-700 shrink-0" />
                            <span>{ord.customerPhone}</span>
                          </a>
                        </div>
                        <div className="text-[10px] text-gray-500 truncate mt-0.5">
                          {ord.customerEmail}
                        </div>
                      </td>

                      {/* 3. MODALIDAD DE ENTREGA & SUCURSAL */}
                      <td className="p-2.5 border-r border-gray-200 align-middle">
                        <div className="flex items-center gap-1.5 font-bold text-[11px] text-gray-900">
                          {isShipping ? (
                            <span className="flex items-center gap-1 text-purple-900 bg-purple-50 px-1.5 py-0.5 border border-purple-300 rounded-xs">
                              <Truck className="w-3.5 h-3.5 text-purple-700" />
                              <span>Envío a Domicilio</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-teal-900 bg-teal-50 px-1.5 py-0.5 border border-teal-300 rounded-xs">
                              <Store className="w-3.5 h-3.5 text-teal-700" />
                              <span>Retiro Presencial</span>
                            </span>
                          )}
                        </div>

                        {/* Solo cuando la venta es registrada por "Sistema POS" sale solo el admin que la registró */}
                        {ord.paymentMethod === 'Sistema POS' && (
                          <div className="text-[11px] text-gray-700 mt-1">
                            <span className="text-gray-600">Venta registrada por: </span>
                            <strong className="text-blue-900">
                              {getAdminNameByBranchId(ord.branchId, ord.registeredByAdmin, allBranches)}
                            </strong>
                          </div>
                        )}

                        {/* Si es Retiro Presencial: mostrar en qué sucursal será el retiro */}
                        {!isShipping && (
                          <div className="text-[11px] text-teal-900 font-semibold mt-0.5">
                            <span className="text-gray-600 font-normal">Sucursal de retiro: </span>
                            <strong className="text-teal-950">{pickupBranch}</strong>
                          </div>
                        )}

                        {/* Si es Envío a Domicilio: mostrar servicio de transporte, dirección y seguimiento */}
                        {isShipping && ord.shippingCourier && (
                          <div className="mt-1">
                            <span className="font-mono text-[10px] bg-blue-50 text-blue-900 px-1.5 py-0.5 border border-blue-200 rounded-xs inline-block">
                              servicio de transporte: <strong>{ord.shippingCourier}</strong>
                            </span>
                          </div>
                        )}
                        {isShipping && ord.shippingAddress && (
                          <div
                            className="text-[10px] text-gray-500 truncate max-w-xs mt-0.5"
                            title={ord.shippingAddress}
                          >
                            {ord.shippingAddress}
                          </div>
                        )}
                        {isShipping && ord.trackingNumber && (
                          <div className="text-[10px] font-mono font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 mt-1 inline-block rounded-xs">
                            Seguimiento: {ord.trackingNumber}
                          </div>
                        )}
                      </td>

                      {/* 4. FECHA */}
                      <td className="p-2.5 border-r border-gray-200 align-middle font-mono text-[11px] text-gray-700">
                        <div className="flex items-center gap-1 font-bold text-gray-900">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span>{ord.date.split(' ')[0]}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {ord.date.split(' ')[1] || ''} hrs
                        </div>
                      </td>

                      {/* 5. TOTAL */}
                      <td className="p-2.5 border-r border-gray-200 text-right align-middle">
                        <div className="font-mono font-black text-sm text-gray-900">
                          ${ord.total.toLocaleString('es-CL')}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {ord.items.reduce((acc, it) => acc + it.quantity, 0)} prendas
                        </div>
                      </td>

                      {/* 6. ESTADO */}
                      <td className="p-2.5 border-r border-gray-200 align-middle">
                        <div className="space-y-1">
                          <span
                            className={`inline-block text-[10px] uppercase tracking-wider px-2 py-0.5 border rounded-xs ${statusMeta.badgeClass}`}
                            title={statusMeta.description}
                          >
                            {ord.status}
                          </span>
                          <p className="text-[9px] text-gray-600 leading-tight">
                            {statusMeta.description}
                          </p>
                        </div>
                      </td>

                      {/* 7. MÉTODO DE PAGO */}
                      <td className="p-2.5 border-r border-gray-200 text-center align-middle">
                        <span
                          className={`inline-block font-mono font-bold text-[11px] px-2 py-0.5 border rounded-xs ${getPaymentMethodBadge(
                            ord.paymentMethod
                          )}`}
                        >
                          {ord.paymentMethod}
                        </span>
                        <div className="text-[9px] text-gray-600 font-semibold mt-1 leading-tight">
                          {ord.paymentMethod === 'Khipu'
                            ? 'Solo por transferencias'
                            : ord.paymentMethod === 'Sistema POS'
                            ? 'Pago manual (Sistema POS)'
                            : 'Pasarela directa (Solicitud recibida)'}
                        </div>
                      </td>

                      {/* 8. PRODUCTOS / ACCIONES */}
                      <td className="p-2.5 text-center align-middle">
                        <div className="flex flex-col items-stretch gap-1.5">
                          {/* Botón desplegable de Productos */}
                          <button
                            type="button"
                            onClick={() => toggleExpandProducts(ord.id)}
                            className="winxp-button text-[11px] py-1 px-2 font-bold text-blue-900 flex items-center gap-1 w-full justify-center"
                            title="Ver lista de productos comprados"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span>
                              {isExpanded ? 'Ocultar' : 'Ver'} Productos ({ord.items.length})
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>

                          {/* ACCIONES SEGÚN EL ESTADO ACTUAL DE LA ORDEN */}
                          {/* 1) Estado: "Pendiente de Pago" */}
                          {ord.status === 'Pendiente de Pago' && (
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  requestStatusConfirmation(
                                    ord,
                                    'Pago Confirmando',
                                    `Pago confirmado manualmente (${ord.paymentMethod}).`,
                                    `La orden ${ord.orderNumber} de ${ord.customerName} pasará del estado "Pendiente de Pago" a "Pago Confirmando".`
                                  )
                                }
                                className="winxp-button text-[11px] py-1 px-2 font-bold text-blue-950 bg-blue-100 hover:bg-blue-200 border-blue-700 flex items-center justify-center gap-1"
                              >
                                <CheckCircle2 className="w-3 h-3 text-blue-700 shrink-0" />
                                <span>Pago Confirmando</span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  requestStatusConfirmation(
                                    ord,
                                    'Pago Anulado',
                                    'Cliente no pagó en el tiempo correspondiente; orden anulada y prendas liberadas.',
                                    `La orden ${ord.orderNumber} de ${ord.customerName} pasará a "Pago Anulado" y se liberarán las prendas reservadas.`
                                  )
                                }
                                className="winxp-button text-[11px] py-1 px-2 font-bold text-amber-950 bg-amber-50 hover:bg-amber-100 border-amber-600 flex items-center justify-center gap-1"
                              >
                                <XCircle className="w-3 h-3 text-amber-800 shrink-0" />
                                <span>Pago Anulado</span>
                              </button>
                            </div>
                          )}

                          {/* 2) Estado: "Pago Confirmando" */}
                          {ord.status === 'Pago Confirmando' && (
                            <button
                              type="button"
                              onClick={() =>
                                requestStatusConfirmation(
                                  ord,
                                  'Solicitud recibida',
                                  'Pago validado; ingresa a flujo de Solicitud recibida.',
                                  `La orden ${ord.orderNumber} de ${ord.customerName} pasará del estado "Pago Confirmando" a "Solicitud recibida".`
                                )
                              }
                              className="winxp-button text-[11px] py-1 px-2 font-bold text-cyan-950 bg-cyan-100 hover:bg-cyan-200 border-cyan-700 flex items-center justify-center gap-1"
                            >
                              <ClipboardCheck className="w-3 h-3 text-cyan-800 shrink-0" />
                              <span>Solicitud recibida</span>
                            </button>
                          )}

                          {/* 3) Estado: "Solicitud recibida" */}
                          {ord.status === 'Solicitud recibida' && (
                            <div className="space-y-1">
                              <button
                                type="button"
                                disabled={isBranchAdmin && isShipping}
                                onClick={() =>
                                  requestStatusConfirmation(
                                    ord,
                                    'En Preparación',
                                    'Orden en preparación de prendas solicitadas.',
                                    `La orden ${ord.orderNumber} de ${ord.customerName} pasará del estado "Solicitud recibida" a "En Preparación".`
                                  )
                                }
                                title={
                                  isBranchAdmin && isShipping
                                    ? 'Los estados de Envío a Domicilio los supervisa el Super Admin'
                                    : 'Pasar a En Preparación'
                                }
                                className={`winxp-button text-[11px] py-1 px-2 font-bold text-indigo-950 bg-indigo-100 border-indigo-700 flex items-center justify-center gap-1 w-full ${
                                  isBranchAdmin && isShipping
                                    ? 'opacity-60 cursor-not-allowed'
                                    : 'hover:bg-indigo-200'
                                }`}
                              >
                                <Package className="w-3 h-3 text-indigo-800 shrink-0" />
                                <span>En Preparación</span>
                              </button>
                              {isBranchAdmin && isShipping && (
                                <div className="text-[9px] text-purple-900 bg-purple-50 border border-purple-300 px-1.5 py-0.5 rounded-xs flex items-center justify-center gap-1 font-semibold">
                                  <Lock className="w-2.5 h-2.5 text-purple-700 shrink-0" />
                                  <span>Envío supervisado por Super Admin</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 4) Estado: "En Preparación" */}
                          {ord.status === 'En Preparación' && (
                            <div className="space-y-1">
                              <button
                                type="button"
                                disabled={isBranchAdmin && isShipping}
                                onClick={() => handleInitiatePassToTransit(ord)}
                                title={
                                  isBranchAdmin && isShipping
                                    ? 'Los estados de Envío a Domicilio los supervisa el Super Admin'
                                    : 'Pasar a En transito'
                                }
                                className={`winxp-button text-[11px] py-1 px-2 font-bold text-purple-950 bg-purple-100 border-purple-700 flex items-center justify-center gap-1 w-full ${
                                  isBranchAdmin && isShipping
                                    ? 'opacity-60 cursor-not-allowed'
                                    : 'hover:bg-purple-200'
                                }`}
                              >
                                <Truck className="w-3 h-3 text-purple-800 shrink-0" />
                                <span>En transito</span>
                              </button>
                              {isBranchAdmin && isShipping && (
                                <div className="text-[9px] text-purple-900 bg-purple-50 border border-purple-300 px-1.5 py-0.5 rounded-xs flex items-center justify-center gap-1 font-semibold">
                                  <Lock className="w-2.5 h-2.5 text-purple-700 shrink-0" />
                                  <span>Envío supervisado por Super Admin</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 5) Estado: "En transito" */}
                          {ord.status === 'En transito' && (
                            <>
                              {isShipping ? (
                                <div className="space-y-1">
                                  <button
                                    type="button"
                                    disabled={isBranchAdmin}
                                    onClick={() =>
                                      requestStatusConfirmation(
                                        ord,
                                        'Entregado',
                                        'Productos entregados con éxito en el domicilio solicitado.',
                                        `La orden ${ord.orderNumber} de ${ord.customerName} pasará del estado "En transito" a "Entregado".`
                                      )
                                    }
                                    title={
                                      isBranchAdmin
                                        ? 'Los estados de Envío a Domicilio los supervisa el Super Admin'
                                        : 'Pasar a Entregado'
                                    }
                                    className={`winxp-button text-[11px] py-1 px-2 font-bold text-emerald-950 bg-emerald-100 border-emerald-700 flex items-center justify-center gap-1 w-full ${
                                      isBranchAdmin
                                        ? 'opacity-60 cursor-not-allowed'
                                        : 'hover:bg-emerald-200'
                                    }`}
                                  >
                                    <CheckCircle2 className="w-3 h-3 text-emerald-800 shrink-0" />
                                    <span>Entregado</span>
                                  </button>
                                  {isBranchAdmin && (
                                    <div className="text-[9px] text-purple-900 bg-purple-50 border border-purple-300 px-1.5 py-0.5 rounded-xs flex items-center justify-center gap-1 font-semibold">
                                      <Lock className="w-2.5 h-2.5 text-purple-700 shrink-0" />
                                      <span>Envío supervisado por Super Admin</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    requestStatusConfirmation(
                                      ord,
                                      'Listo para el retiro de sucursal',
                                      `Productos arribaron con éxito a la sucursal ${pickupBranch} para retiro.`,
                                      `La orden ${ord.orderNumber} de ${ord.customerName} pasará del estado "En transito" a "Listo para el retiro de sucursal" en ${pickupBranch}.`
                                    )
                                  }
                                  className="winxp-button text-[11px] py-1 px-2 font-bold text-teal-950 bg-teal-100 hover:bg-teal-200 border-teal-700 flex items-center justify-center gap-1"
                                >
                                  <Store className="w-3 h-3 text-teal-800 shrink-0" />
                                  <span>Listo para el retiro de sucursal</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* 6) Estado: "Listo para el retiro de sucursal" */}
                          {ord.status === 'Listo para el retiro de sucursal' && (
                            <button
                              type="button"
                              onClick={() =>
                                requestStatusConfirmation(
                                  ord,
                                  'Retirado',
                                  `Cliente retiró presencialmente sus productos en la sucursal ${pickupBranch}.`,
                                  `La orden ${ord.orderNumber} de ${ord.customerName} pasará del estado "Listo para el retiro de sucursal" a "Retirado".`
                                )
                              }
                              className="winxp-button text-[11px] py-1 px-2 font-bold text-green-950 bg-green-100 hover:bg-green-200 border-green-700 flex items-center justify-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3 text-green-800 shrink-0" />
                              <span>Retirado</span>
                            </button>
                          )}

                          {/* Acciones de flujo de Devolución */}
                          {ord.status === 'Solicitud de Devolución recibida' && (
                            <div className="space-y-1">
                              <button
                                type="button"
                                disabled={isBranchAdmin}
                                onClick={() =>
                                  requestStatusConfirmation(
                                    ord,
                                    'Revisión de equipo',
                                    'Admin inició revisión y evaluación de la solicitud de devolución.',
                                    `La orden ${ord.orderNumber} pasará a "Revisión de equipo".`
                                  )
                                }
                                title={
                                  isBranchAdmin
                                    ? 'Solo el Super Admin puede modificar los estados de las devoluciones'
                                    : 'Pasar a Revisión de equipo'
                                }
                                className={`winxp-button text-[11px] py-1 px-2 font-bold text-amber-950 bg-amber-100 border-amber-700 flex items-center justify-center gap-1 w-full ${
                                  isBranchAdmin
                                    ? 'opacity-60 cursor-not-allowed'
                                    : 'hover:bg-amber-200'
                                }`}
                              >
                                <ClipboardCheck className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                                <span>Revisión de equipo</span>
                              </button>
                              {isBranchAdmin && (
                                <div className="text-[9px] text-amber-900 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-xs flex items-center justify-center gap-1 font-semibold">
                                  <Lock className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                  <span>Exclusivo Super Admin</span>
                                </div>
                              )}
                            </div>
                          )}

                          {ord.status === 'Revisión de equipo' && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={isBranchAdmin}
                                  onClick={() =>
                                    requestStatusConfirmation(
                                      ord,
                                      'Aprobada por Admin',
                                      'Devolución aprobada por Admin.',
                                      `La solicitud de devolución de la orden ${ord.orderNumber} pasará a "Aprobada por Admin".`
                                    )
                                  }
                                  title={
                                    isBranchAdmin
                                      ? 'Solo el Super Admin puede modificar los estados de las devoluciones'
                                      : 'Aprobar devolución'
                                  }
                                  className={`winxp-button text-[10px] py-1 px-1.5 font-bold text-emerald-950 bg-emerald-100 border-emerald-700 flex-1 flex items-center justify-center gap-1 ${
                                    isBranchAdmin
                                      ? 'opacity-60 cursor-not-allowed'
                                      : 'hover:bg-emerald-200'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3 h-3 text-emerald-800 shrink-0" />
                                  <span>Aprobada por Admin</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isBranchAdmin}
                                  onClick={() =>
                                    requestStatusConfirmation(
                                      ord,
                                      'Rechazada por Admin',
                                      'Devolución rechazada por Admin.',
                                      `La solicitud de devolución de la orden ${ord.orderNumber} pasará a "Rechazada por Admin".`
                                    )
                                  }
                                  title={
                                    isBranchAdmin
                                      ? 'Solo el Super Admin puede modificar los estados de las devoluciones'
                                      : 'Rechazar devolución'
                                  }
                                  className={`winxp-button text-[10px] py-1 px-1.5 font-bold text-rose-950 bg-rose-100 border-rose-700 flex-1 flex items-center justify-center gap-1 ${
                                    isBranchAdmin
                                      ? 'opacity-60 cursor-not-allowed'
                                      : 'hover:bg-rose-200'
                                  }`}
                                >
                                  <XCircle className="w-3 h-3 text-rose-800 shrink-0" />
                                  <span>Rechazada por Admin</span>
                                </button>
                              </div>
                              {isBranchAdmin && (
                                <div className="text-[9px] text-amber-900 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-xs flex items-center justify-center gap-1 font-semibold">
                                  <Lock className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                  <span>Exclusivo Super Admin</span>
                                </div>
                              )}
                            </div>
                          )}

                          {ord.status === 'Aprobada por Admin' && (
                            <div className="space-y-1">
                              <button
                                type="button"
                                disabled={isBranchAdmin}
                                onClick={() =>
                                  requestStatusConfirmation(
                                    ord,
                                    isShipping ? 'Envió a punto' : 'Retiro Presencial',
                                    isShipping
                                      ? 'Devolución gestionada modalidad Envió a punto.'
                                      : `Devolución gestionada modalidad Retiro Presencial en ${pickupBranch}.`,
                                    `La orden ${ord.orderNumber} pasará al estado "${
                                      isShipping ? 'Envió a punto' : 'Retiro Presencial'
                                    }".`
                                  )
                                }
                                title={
                                  isBranchAdmin
                                    ? 'Solo el Super Admin puede modificar los estados de las devoluciones'
                                    : isShipping
                                    ? 'Pasar a Envió a punto'
                                    : 'Pasar a Retiro Presencial'
                                }
                                className={`winxp-button text-[11px] py-1 px-2 font-bold text-violet-950 bg-violet-100 border-violet-700 flex items-center justify-center gap-1 w-full ${
                                  isBranchAdmin
                                    ? 'opacity-60 cursor-not-allowed'
                                    : 'hover:bg-violet-200'
                                }`}
                              >
                                {isShipping ? (
                                  <Truck className="w-3.5 h-3.5 text-violet-800 shrink-0" />
                                ) : (
                                  <Store className="w-3.5 h-3.5 text-violet-800 shrink-0" />
                                )}
                                <span>{isShipping ? 'Envió a punto' : 'Retiro Presencial'}</span>
                              </button>
                              {isBranchAdmin && (
                                <div className="text-[9px] text-amber-900 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded-xs flex items-center justify-center gap-1 font-semibold">
                                  <Lock className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                                  <span>Exclusivo Super Admin</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Botón "Eliminar" */}
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteOrderModal(ord)}
                            className="winxp-button text-[11px] py-1 px-2 font-bold text-red-900 bg-red-50 hover:bg-red-100 border-red-400 flex items-center justify-center gap-1 w-full"
                            title="Eliminar esta orden de compra"
                          >
                            <Trash2 className="w-3 h-3 text-red-700 shrink-0" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* FILA EXPANDIBLE: PRODUCTOS COMPRADOS */}
                    {isExpanded && (
                      <tr className="bg-blue-50/40 border-b-2 border-blue-200">
                        <td colSpan={8} className="p-3">
                          <div className="p-2.5 bg-white border border-blue-300 rounded-xs shadow-2xs space-y-2">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
                              <div className="flex items-center gap-1.5 font-bold text-xs text-[#003c74] uppercase">
                                <Package className="w-4 h-4 text-blue-700" />
                                <span>Productos Comprados en Orden {ord.orderNumber}:</span>
                              </div>
                              <span className="font-mono text-xs font-bold text-gray-700">
                                Total: ${ord.total.toLocaleString('es-CL')}
                              </span>
                            </div>

                            <div className="divide-y divide-gray-100">
                              {ord.items.map((it, idx) => (
                                <div
                                  key={idx}
                                  className="py-2 flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <img
                                      src={it.image}
                                      alt={it.name}
                                      className="w-10 h-10 object-cover border border-gray-300 rounded-xs shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <div className="font-bold text-gray-900 truncate">
                                        {it.name}
                                      </div>
                                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono mt-0.5">
                                        {it.sku && <span>SKU: {it.sku}</span>}
                                        {it.size && (
                                          <span className="font-bold text-purple-900 bg-purple-50 px-1 border border-purple-200">
                                            {it.size}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-center font-mono font-bold text-xs text-gray-800 w-24">
                                    <span className="text-[10px] text-gray-500 block font-sans">
                                      Cantidad
                                    </span>
                                    {it.quantity} un.
                                  </div>

                                  <div className="text-right font-mono font-black text-xs text-[#003c74] w-28">
                                    <span className="text-[10px] text-gray-500 block font-sans">
                                      Precio
                                    </span>
                                    ${it.price.toLocaleString('es-CL')}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Guía Operativa del Esquema Sincronizado */}
      <div className="p-3 bg-cyan-50 border border-cyan-300 flex items-start gap-2.5 shadow-xs">
        <Info className="w-4 h-4 text-cyan-800 shrink-0 mt-0.5" />
        <div className="text-[11px] text-cyan-950 space-y-1">
          <strong className="block font-bold">
            Esquema Sincronizado de Métodos de Pago, Estados y Acciones (Super Admin):
          </strong>
          <p>
            • <strong>Métodos de Pago:</strong> Solo los pagos por <code>Sistema POS</code> o{' '}
            <code>Khipu</code> pueden tener los estados <code>Pendiente de Pago</code>,{' '}
            <code>Pago Confirmando</code> y <code>Pago Anulado</code>. Por las pasarelas{' '}
            <code>Webpay</code> o <code>Mercado Pago</code>, cuando la compra se completa pasa
            directamente a <code>Solicitud recibida</code> (si no se concretó, no se registra en el
            sistema).
          </p>
          <p>
            • <strong>Flujo de Entrega:</strong> <code>Solicitud recibida</code> →{' '}
            <code>En Preparación</code> → <code>En transito</code> (en Envío solicita ingresar
            código de seguimiento y la palabra <em>Confirmar</em> con el servicio de transporte
            escogido por el cliente; en Retiro solicita confirmación <em>¿Estás seguro?</em>) →{' '}
            <code>Entregado</code> (exclusivo Envío a Domicilio) o{' '}
            <code>Listo para el retiro de sucursal</code> → <code>Retirado</code> (exclusivos
            Retiro Presencial).
          </p>
          <p>
            • <strong>Flujo de Devolución:</strong> <code>Solicitud de Devolución recibida</code> →{' '}
            <code>Revisión de equipo</code> → <code>Rechazada por Admin</code> o{' '}
            <code>Aprobada por Admin</code> → <code>Envió a punto</code> (devolución a domicilio) /{' '}
            <code>Retiro Presencial</code> (devolución en sucursal).
          </p>
        </div>
      </div>
    </>
  );
};

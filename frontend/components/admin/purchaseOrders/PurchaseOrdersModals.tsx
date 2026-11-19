import React from 'react';
import {
  Truck,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Printer
} from 'lucide-react';
import { WindowFrame } from '../../layout/WindowFrame';
import { PixelIcon } from '../../common/PixelIcon';
import { Branch } from '../../../types';
import {
  PurchaseOrderRecord,
  PendingStatusTransition,
  getAdminNameByBranchId
} from './purchaseOrdersTypes';

interface PurchaseOrdersModalsProps {
  transitShippingModalOrder: PurchaseOrderRecord | null;
  setTransitShippingModalOrder: (order: PurchaseOrderRecord | null) => void;
  trackingCodeInput: string;
  setTrackingCodeInput: (val: string) => void;
  transitConfirmWordInput: string;
  setTransitConfirmWordInput: (val: string) => void;
  trackingError: string;
  setTrackingError: (val: string) => void;
  handleConfirmTransitShipping: () => void;
  pendingStatusTransition: PendingStatusTransition | null;
  setPendingStatusTransition: (val: PendingStatusTransition | null) => void;
  handleConfirmPendingStatusTransition: () => void;
  orderToDelete: PurchaseOrderRecord | null;
  setOrderToDelete: (order: PurchaseOrderRecord | null) => void;
  deleteConfirmWordInput: string;
  setDeleteConfirmWordInput: (val: string) => void;
  deleteError: string;
  setDeleteError: (val: string) => void;
  handleConfirmDeleteOrder: () => void;
  selectedOrderForDetail: PurchaseOrderRecord | null;
  setSelectedOrderForDetail: (order: PurchaseOrderRecord | null) => void;
  allBranches: Branch[];
}

export const PurchaseOrdersModals: React.FC<PurchaseOrdersModalsProps> = ({
  transitShippingModalOrder,
  setTransitShippingModalOrder,
  trackingCodeInput,
  setTrackingCodeInput,
  transitConfirmWordInput,
  setTransitConfirmWordInput,
  trackingError,
  setTrackingError,
  handleConfirmTransitShipping,
  pendingStatusTransition,
  setPendingStatusTransition,
  handleConfirmPendingStatusTransition,
  orderToDelete,
  setOrderToDelete,
  deleteConfirmWordInput,
  setDeleteConfirmWordInput,
  deleteError,
  setDeleteError,
  handleConfirmDeleteOrder,
  selectedOrderForDetail,
  setSelectedOrderForDetail,
  allBranches
}) => {
  return (
    <>
      {/* =========================================================================
          MODAL A: PASAR DE "EN PREPARACIÓN" A "EN TRANSITO" (MODALIDAD ENVÍO A DOMICILIO)
          - El Método de Envío (servicio de transporte escogido por el cliente) NO se puede modificar
          - Pide ingresar Código de Seguimiento *
          - Pide ingresar la palabra "Confirmar" *
         ========================================================================= */}
      {transitShippingModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-md nl-orders-modal-window animate-in zoom-in-95 duration-150">
            <WindowFrame
              title={`EN TRANSITO (ENVÍO) // ${transitShippingModalOrder.orderNumber}`}
              icon={<PixelIcon name="computer" size={16} />}
              onClose={() => {
                setTransitShippingModalOrder(null);
                setTrackingError('');
              }}
              statusBarText="INGRESO DE CÓDIGO DE SEGUIMIENTO Y CONFIRMACIÓN // ENVÍO A DOMICILIO"
            >
              <div className="space-y-3 p-2 text-xs">
                <div className="p-2.5 bg-purple-50 border border-purple-300 text-purple-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-purple-700" />
                    <span>Envío a Domicilio — Orden {transitShippingModalOrder.orderNumber}</span>
                  </div>
                  <p className="text-[11px]">
                    Cliente: <strong>{transitShippingModalOrder.customerName}</strong>
                  </p>
                  {transitShippingModalOrder.shippingAddress && (
                    <p className="text-[11px]">
                      Dirección: <strong>{transitShippingModalOrder.shippingAddress}</strong>
                    </p>
                  )}
                </div>

                {/* Método de envío escogido por el cliente (NO modificable) */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-800 mb-1">
                    Método de Envío (servicio de transporte escogido por el cliente):
                  </label>
                  <input
                    type="text"
                    value={transitShippingModalOrder.shippingCourier || 'Starken'}
                    disabled
                    readOnly
                    className="w-full winxp-input text-xs py-1.5 px-2 bg-gray-100 border border-gray-400 font-bold text-gray-700 cursor-not-allowed select-none"
                  />
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    Este servicio de transporte fue escogido por el cliente y no se puede modificar.
                  </span>
                </div>

                {/* Código de Seguimiento */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-800 mb-1">
                    Ingresar Código de Seguimiento <span className="text-red-600">*</span>:
                  </label>
                  <input
                    type="text"
                    value={trackingCodeInput}
                    onChange={(e) => {
                      setTrackingCodeInput(e.target.value);
                      if (trackingError) setTrackingError('');
                    }}
                    placeholder="Ej: STK-948201 / BX-772819 / PKT-10293"
                    className="w-full winxp-input text-xs py-1.5 px-2 bg-white border border-[#7f9db9] font-mono font-bold text-gray-900"
                    autoFocus
                  />
                </div>

                {/* Palabra "Confirmar" */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-800 mb-1">
                    Escribe la palabra{' '}
                    <span className="font-mono text-purple-900">&quot;Confirmar&quot;</span> para
                    validar <span className="text-red-600">*</span>:
                  </label>
                  <input
                    type="text"
                    value={transitConfirmWordInput}
                    onChange={(e) => {
                      setTransitConfirmWordInput(e.target.value);
                      if (trackingError) setTrackingError('');
                    }}
                    placeholder='Escribe "Confirmar"'
                    className="w-full winxp-input text-xs py-1.5 px-2 bg-white border border-[#7f9db9] font-bold text-gray-900"
                  />
                  {trackingError && (
                    <p className="text-[11px] text-red-700 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{trackingError}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => {
                      setTransitShippingModalOrder(null);
                      setTrackingError('');
                    }}
                    className="winxp-button text-xs py-1 px-3 text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmTransitShipping}
                    className="winxp-button winxp-button-primary text-xs py-1 px-4 text-purple-950 font-bold flex items-center gap-1.5 border-purple-800 bg-purple-100 hover:bg-purple-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" />
                    <span>Confirmar y Pasar a &quot;En transito&quot;</span>
                  </button>
                </div>
              </div>
            </WindowFrame>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL B: VENTANA DE CONFIRMACIÓN "¿ESTÁS SEGURO?" PARA CAMBIOS DE ESTADO
         ========================================================================= */}
      {pendingStatusTransition && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-md nl-orders-modal-window animate-in zoom-in-95 duration-150">
            <WindowFrame
              title={`CONFIRMACIÓN // ${pendingStatusTransition.order.orderNumber}`}
              icon={<PixelIcon name="computer" size={16} />}
              onClose={() => setPendingStatusTransition(null)}
              statusBarText={`CAMBIO DE ESTADO A: ${pendingStatusTransition.nextStatus.toUpperCase()}`}
            >
              <div className="space-y-3 p-3 text-xs">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-black text-sm text-gray-900">¿Estás seguro?</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {pendingStatusTransition.descriptionText}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => setPendingStatusTransition(null)}
                    className="winxp-button text-xs py-1 px-3 text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPendingStatusTransition}
                    className="winxp-button winxp-button-primary text-xs py-1 px-4 text-blue-950 font-bold flex items-center gap-1.5 border-blue-800 bg-blue-100 hover:bg-blue-200"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                    <span>Sí, confirmar &quot;{pendingStatusTransition.nextStatus}&quot;</span>
                  </button>
                </div>
              </div>
            </WindowFrame>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL C: CONFIRMACIÓN PARA ELIMINAR ORDEN ("¿Estás seguro?" + escribir "Eliminar")
         ========================================================================= */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-md nl-orders-modal-window animate-in zoom-in-95 duration-150">
            <WindowFrame
              title={`ELIMINAR ORDEN // ${orderToDelete.orderNumber}`}
              icon={<PixelIcon name="computer" size={16} />}
              onClose={() => {
                setOrderToDelete(null);
                setDeleteConfirmWordInput('');
                setDeleteError('');
              }}
              statusBarText="CONFIRMACIÓN DE ELIMINACIÓN DE REGISTRO"
            >
              <div className="space-y-3 p-3 text-xs">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h3 className="font-black text-sm text-gray-900">¿Estás seguro?</h3>
                    <p className="text-gray-700 leading-relaxed">
                      Estás a punto de eliminar la orden{' '}
                      <strong>{orderToDelete.orderNumber}</strong> del cliente{' '}
                      <strong>{orderToDelete.customerName}</strong> (Estado actual:{' '}
                      <strong>{orderToDelete.status}</strong>).
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-800 mb-1">
                    Para confirmar, escribe la palabra{' '}
                    <span className="font-mono text-red-700">&quot;Eliminar&quot;</span>{' '}
                    <span className="text-red-600">*</span>:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmWordInput}
                    onChange={(e) => {
                      setDeleteConfirmWordInput(e.target.value);
                      if (deleteError) setDeleteError('');
                    }}
                    placeholder='Escribe "Eliminar"'
                    className="w-full winxp-input text-xs py-1.5 px-2 bg-white border border-[#7f9db9] font-bold text-gray-900"
                    autoFocus
                  />
                  {deleteError && (
                    <p className="text-[11px] text-red-700 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{deleteError}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderToDelete(null);
                      setDeleteConfirmWordInput('');
                      setDeleteError('');
                    }}
                    className="winxp-button text-xs py-1 px-3 text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteOrder}
                    className="winxp-button text-xs py-1 px-4 text-red-950 font-bold flex items-center gap-1.5 border-red-800 bg-red-100 hover:bg-red-200"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-700" />
                    <span>Sí, Eliminar</span>
                  </button>
                </div>
              </div>
            </WindowFrame>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DETALLE COMPLETO DE ORDEN / BOLETA XP
         ========================================================================= */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="w-full max-w-2xl nl-orders-modal-window animate-in zoom-in-95 duration-150">
            <WindowFrame
              title={`DETALLE DE ORDEN DE COMPRA // ${selectedOrderForDetail.orderNumber}`}
              icon={<PixelIcon name="floppy" size={16} />}
              onClose={() => setSelectedOrderForDetail(null)}
              statusBarText="COMPROBANTE DE PAGO AUDITABLE // NO LIMITS OS"
            >
              <div className="space-y-3 p-2 text-xs bg-white">
                {/* Cabecera Tipo Comprobante de Pago */}
                <div className="flex flex-wrap items-start justify-between gap-2 border-b-2 border-gray-800 pb-3">
                  <div>
                    <h2 className="text-base font-black text-[#003c74] tracking-tight">
                      NO LIMITS APPAREL OS
                    </h2>
                    <p className="text-[10px] text-gray-600">
                      RUT: 76.842.119-0 • Giro: Confección y Venta de Indumentaria Cyber-Goth
                    </p>
                    <p className="text-[10px] text-gray-600">
                      Sucursal de Registro de Venta: {selectedOrderForDetail.branchName}
                    </p>
                  </div>
                  <div className="text-right border-2 border-red-700 p-2 rounded-xs bg-red-50/50">
                    <span className="font-mono font-bold text-red-900 block text-[11px]">
                      COMPROBANTE DE PAGO
                    </span>
                    <span className="font-mono font-black text-sm text-red-700">
                      {selectedOrderForDetail.orderNumber}
                    </span>
                  </div>
                </div>

                {/* Datos del Cliente y Entrega */}
                <div className="nl-orders-receipt-info-grid p-2.5 bg-gray-50 border border-gray-300">
                  <div>
                    <span className="font-bold text-gray-700 block">Datos del Cliente:</span>
                    <div className="font-black text-gray-900 mt-0.5">
                      {selectedOrderForDetail.customerName}
                    </div>
                    <div className="text-gray-600 font-mono text-[11px]">
                      {selectedOrderForDetail.customerPhone}
                    </div>
                    <div className="text-gray-600 text-[11px]">
                      {selectedOrderForDetail.customerEmail}
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-gray-700 block">Modalidad de Entrega:</span>
                    <div className="font-bold text-[#003c74] mt-0.5">
                      {selectedOrderForDetail.deliveryType === 'Despacho a Domicilio'
                        ? 'Envío a Domicilio'
                        : 'Retiro Presencial'}
                    </div>
                    {selectedOrderForDetail.paymentMethod === 'Sistema POS' && (
                      <div className="text-gray-600 text-[11px]">
                        Venta registrada por:{' '}
                        <strong className="text-blue-900">
                          {getAdminNameByBranchId(
                            selectedOrderForDetail.branchId,
                            selectedOrderForDetail.registeredByAdmin,
                            allBranches
                          )}
                        </strong>
                      </div>
                    )}
                    {selectedOrderForDetail.deliveryType === 'Retiro en Sucursal' && (
                      <div className="text-teal-900 text-[11px]">
                        Sucursal de retiro:{' '}
                        <strong>
                          {selectedOrderForDetail.pickupBranchName ||
                            selectedOrderForDetail.branchName}
                        </strong>
                      </div>
                    )}
                    {selectedOrderForDetail.shippingCourier && (
                      <div className="text-gray-600 text-[11px]">
                        servicio de transporte:{' '}
                        <strong>{selectedOrderForDetail.shippingCourier}</strong>
                      </div>
                    )}
                    {selectedOrderForDetail.trackingNumber && (
                      <div className="text-indigo-900 font-mono font-bold text-[11px]">
                        Código de Seguimiento: {selectedOrderForDetail.trackingNumber}
                      </div>
                    )}
                    {selectedOrderForDetail.shippingAddress && (
                      <div className="text-gray-600 text-[11px] mt-0.5">
                        {selectedOrderForDetail.shippingAddress}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabla de Productos Comprados */}
                <div className="border border-gray-300 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#ece9d8] border-b border-gray-300 font-bold">
                      <tr>
                        <th className="p-1.5">PRODUCTO</th>
                        <th className="p-1.5 text-center">TALLA</th>
                        <th className="p-1.5 text-center">CANT.</th>
                        <th className="p-1.5 text-right">PRECIO</th>
                        <th className="p-1.5 text-right">SUBTOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrderForDetail.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5 font-bold text-gray-900 flex items-center gap-2">
                            <img
                              src={it.image}
                              alt=""
                              className="w-7 h-7 object-cover border border-gray-300 shrink-0"
                            />
                            <span>{it.name}</span>
                          </td>
                          <td className="p-1.5 text-center font-mono">{it.size || 'Única'}</td>
                          <td className="p-1.5 text-center font-mono font-bold">{it.quantity}</td>
                          <td className="p-1.5 text-right font-mono">
                            ${it.price.toLocaleString('es-CL')}
                          </td>
                          <td className="p-1.5 text-right font-mono font-bold text-[#003c74]">
                            ${it.subtotal.toLocaleString('es-CL')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Resumen Total y Método de Pago */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-gray-100 border border-gray-300">
                  <div>
                    <span className="font-bold text-gray-700">Método de Pago:</span>{' '}
                    <strong className="text-gray-900">
                      {selectedOrderForDetail.paymentMethod}
                    </strong>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      Fecha: {selectedOrderForDetail.date} • Estado: {selectedOrderForDetail.status}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-xs text-gray-700 mr-2">TOTAL FINAL:</span>
                    <span className="font-mono font-black text-lg text-emerald-800">
                      ${selectedOrderForDetail.total.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>

                {/* Notas si existen */}
                {selectedOrderForDetail.notes && (
                  <div className="p-2 bg-amber-50 border border-amber-200 text-[11px] text-amber-950">
                    <strong>Notas de la orden:</strong> {selectedOrderForDetail.notes}
                  </div>
                )}

                {/* Botones */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="winxp-button text-xs py-1 px-3 text-gray-800 flex items-center gap-1.5 font-bold"
                  >
                    <Printer className="w-3.5 h-3.5 text-gray-700" />
                    <span>Imprimir Comprobante</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedOrderForDetail(null)}
                    className="winxp-button text-xs py-1 px-4 text-blue-900 font-bold"
                  >
                    Cerrar Detalle
                  </button>
                </div>
              </div>
            </WindowFrame>
          </div>
        </div>
      )}
    </>
  );
};

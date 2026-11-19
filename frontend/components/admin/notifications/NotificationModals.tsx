import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Mail,
  ChevronLeft,
  ChevronRight,
  Send,
  Package,
  XCircle,
  HelpCircle,
  Truck,
  Star,
  ShieldAlert
} from 'lucide-react';
import { WindowFrame } from '../../layout/WindowFrame';
import { PixelIcon } from '../../common/PixelIcon';
import { INITIAL_PRODUCTS } from '../../../services/mockData';
import {
  ALERT_CATEGORY_CONFIG,
  SystemAlert,
  DecisionModalState,
  ConfirmActionModalState,
  ProductDetailModalState,
  ReturnReviewModalState,
  ReferencePhotosModalState,
  AddCustomerReportModalState
} from './interestNotificationTypes';
import {
  getAlertEmail,
  getAlertProducts,
  getAlertReturnLogistics,
  getAlertPendingPaymentLogistics
} from './interestNotificationHelpers';

export interface NotificationModalsProps {
  decisionModal: DecisionModalState | null;
  setDecisionModal: (val: DecisionModalState | null) => void;
  handleExecuteDecision: () => void;
  replyingAlert: SystemAlert | null;
  setReplyingAlert: (val: SystemAlert | null) => void;
  replyChannel: 'whatsapp' | 'email';
  setReplyChannel: (val: 'whatsapp' | 'email') => void;
  replyCustomText: string;
  setReplyCustomText: (val: string) => void;
  handleSendReply: () => void;
  confirmActionModal: ConfirmActionModalState | null;
  setConfirmActionModal: (val: ConfirmActionModalState | null) => void;
  handleExecuteConfirmAction: () => void;
  productDetailModal: ProductDetailModalState | null;
  setProductDetailModal: React.Dispatch<React.SetStateAction<ProductDetailModalState | null>>;
  returnReviewModal: ReturnReviewModalState | null;
  setReturnReviewModal: React.Dispatch<React.SetStateAction<ReturnReviewModalState | null>>;
  handleExecuteReturnReview: () => void;
  referencePhotosModal: ReferencePhotosModalState | null;
  setReferencePhotosModal: React.Dispatch<React.SetStateAction<ReferencePhotosModalState | null>>;
  addReportModal: AddCustomerReportModalState | null;
  setAddReportModal: React.Dispatch<React.SetStateAction<AddCustomerReportModalState | null>>;
  handleSaveCustomerReport: (e: React.FormEvent) => void;
}

export const NotificationModals: React.FC<NotificationModalsProps> = ({
  decisionModal,
  setDecisionModal,
  handleExecuteDecision,
  replyingAlert,
  setReplyingAlert,
  replyChannel,
  setReplyChannel,
  replyCustomText,
  setReplyCustomText,
  handleSendReply,
  confirmActionModal,
  setConfirmActionModal,
  handleExecuteConfirmAction,
  productDetailModal,
  setProductDetailModal,
  returnReviewModal,
  setReturnReviewModal,
  handleExecuteReturnReview,
  referencePhotosModal,
  setReferencePhotosModal,
  addReportModal,
  setAddReportModal,
  handleSaveCustomerReport
}) => {
  return (
    <>
      {/* =========================================================================
          MODAL DE CONFIRMACIÓN: "¿ESTÁS SEGURO?" PARA COBRO PENDIENTE
         ========================================================================= */}
      {decisionModal && (
        <div className="interest-notif-modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-150 my-auto">
            <WindowFrame
              title={
                decisionModal.action === 'confirmar'
                  ? `CONFIRMAR PAGO // ORDEN #${decisionModal.alert.orderNumber || 'NL-LIVE'}`
                  : `ANULAR VENTA & LIBERAR STOCK // ORDEN #${decisionModal.alert.orderNumber || 'NL-LIVE'}`
              }
              icon={<PixelIcon name="computer" size={16} />}
              onClose={() => setDecisionModal(null)}
              statusBarText="VALIDACIÓN TRANSACCIONAL // ACCIÓN ADMINISTRATIVA OFICIAL"
            >
              <div className="p-2 space-y-3 text-xs bg-[#ece9d8]">
                {/* Cuadro de Advertencia estilo Windows XP */}
                <div
                  className={`p-3 border-2 rounded-xs flex items-start gap-3 ${
                    decisionModal.action === 'confirmar'
                      ? 'bg-emerald-50 border-emerald-600'
                      : 'bg-rose-50 border-rose-600'
                  }`}
                >
                  <div
                    className={`p-2 rounded-full shrink-0 ${
                      decisionModal.action === 'confirmar'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {decisionModal.action === 'confirmar' ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-rose-700" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3
                      className={`text-sm font-black uppercase tracking-wide ${
                        decisionModal.action === 'confirmar' ? 'text-emerald-950' : 'text-rose-950'
                      }`}
                    >
                      {decisionModal.action === 'confirmar'
                        ? '¿Estás seguro de confirmar el pago de esta venta?'
                        : '¿Estás seguro de anular esta venta y liberar el stock?'}
                    </h3>

                    <p className="text-gray-800 leading-snug">
                      {decisionModal.action === 'confirmar' ? (
                        <>
                          Al confirmar, la orden <strong>#{decisionModal.alert.orderNumber || 'NL-LIVE'}</strong> pasará
                          automáticamente al estado{' '}
                          <span className="font-extrabold text-blue-900 bg-blue-100 px-1 py-0.2 border border-blue-300 rounded-2xs">
                            "Solicitud recibida"
                          </span>{' '}
                          en el módulo de <strong>Órdenes de Compra</strong>, permitiendo que el equipo proceda con la
                          preparación y despacho de las prendas.
                        </>
                      ) : (
                        <>
                          Al anular, la orden se cancelará por falta de pago o descarte administrativo. Pasará al
                          estado{' '}
                          <span className="font-extrabold text-red-900 bg-red-100 px-1 py-0.2 border border-red-300 rounded-2xs">
                            "Pago Anulado"
                          </span>{' '}
                          en <strong>Órdenes de Compra</strong> y{' '}
                          <strong>todas las prendas reservadas se liberarán inmediatamente</strong> para que vuelvan a
                          estar disponibles en el stock comercial.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Detalle de la Orden y Prendas Involucradas */}
                <div className="p-2.5 bg-white border border-[#7f9db9] rounded-xs space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] border-b border-gray-200 pb-2">
                    <div>
                      <span className="text-gray-500 font-bold block">Cliente:</span>
                      <strong className="text-gray-900 block">{decisionModal.alert.customerName}</strong>
                      {decisionModal.alert.deliveryType === 'envio' && (
                        <span className="text-gray-800 font-mono font-bold text-[10px] block">
                          RUT: {decisionModal.alert.customerRut || '20.104.992-1'}
                        </span>
                      )}
                      <span className="text-gray-600 font-mono text-[10px]">
                        {decisionModal.alert.customerPhone}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500 font-bold block">Correo Electrónico:</span>
                      <strong className="text-blue-900 block truncate">
                        {getAlertEmail(decisionModal.alert)}
                      </strong>
                      <span className="text-gray-500 font-mono text-[10px]">
                        Orden: #{decisionModal.alert.orderNumber || 'NL-LIVE'}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Prendas */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide block">
                      Prendas a {decisionModal.action === 'confirmar' ? 'procesar' : 'liberar'}:
                    </span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {getAlertProducts(decisionModal.alert).map((p, pIdx) => {
                        const img =
                          p.image ||
                          INITIAL_PRODUCTS[pIdx % INITIAL_PRODUCTS.length]?.images[0] ||
                          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800';
                        const qty = p.quantity || 1;
                        const pr = p.price || 0;
                        return (
                          <div
                            key={pIdx}
                            className="flex items-center justify-between gap-2 p-1.5 bg-gray-50 border border-gray-300 rounded-xs text-[11px]"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={img}
                                alt={p.name}
                                className="w-10 h-10 object-cover rounded-xs border border-gray-400 shrink-0 bg-white"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    INITIAL_PRODUCTS[0]?.images[0] ||
                                    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800';
                                }}
                              />
                              <div className="min-w-0">
                                <span className="font-extrabold text-gray-900 truncate block leading-tight">
                                  {p.name}
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-gray-600 mt-0.5">
                                  <span className="font-bold text-gray-800 bg-gray-200 px-1 py-0.2 rounded-2xs border border-gray-300">
                                    Unidades: {qty}
                                  </span>
                                  {p.size && <span className="font-mono text-gray-600">{p.size}</span>}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[9px] font-bold text-gray-500 block uppercase">Precio</span>
                              <span className="font-mono font-black text-rose-900 text-xs block">
                                ${(pr * qty).toLocaleString('es-CL')} CLP
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {decisionModal.alert.deliveryType === 'envio' &&
                    (() => {
                      const modalShippingInfo = getAlertPendingPaymentLogistics(decisionModal.alert);
                      return (
                        <div className="p-2 bg-blue-50 border border-blue-300 rounded-xs space-y-1 text-[11px]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-950 flex items-center gap-1">
                              <Truck className="w-3.5 h-3.5 text-blue-700" />
                              <span>Agencia de Transporte Escogida:</span>
                            </span>
                            <strong className="text-blue-950">{modalShippingInfo.courierName}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-700 font-semibold">
                              Valor del Envío ({modalShippingInfo.courierName}):
                            </span>
                            <span className="font-mono font-black text-blue-900">
                              ${modalShippingInfo.shippingCostClp.toLocaleString('es-CL')} CLP
                            </span>
                          </div>
                        </div>
                      );
                    })()}

                  <div className="flex items-center justify-between pt-1 border-t border-gray-200 font-bold text-xs">
                    <span>Monto Total de la Transacción:</span>
                    <span className="font-mono font-black text-rose-800 text-sm">
                      $
                      {(decisionModal.alert.deliveryType === 'envio'
                        ? getAlertPendingPaymentLogistics(decisionModal.alert).totalWithShippingClp
                        : decisionModal.alert.amount || 0
                      ).toLocaleString('es-CL')}{' '}
                      CLP
                    </span>
                  </div>
                </div>

                {decisionModal.errorMessage && (
                  <p className="text-[11px] font-black text-red-700 bg-red-100 border border-red-400 p-2 rounded-xs flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{decisionModal.errorMessage}</span>
                  </p>
                )}

                {/* Botones de Confirmación / Cancelación */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => setDecisionModal(null)}
                    className="winxp-button text-xs py-1.5 px-4 text-gray-800 font-bold"
                  >
                    Cancelar
                  </button>

                  {decisionModal.action === 'confirmar' ? (
                    <button
                      type="button"
                      onClick={handleExecuteDecision}
                      className="winxp-button winxp-button-primary text-xs py-1.5 px-4 text-emerald-950 font-black flex items-center gap-1.5 border-emerald-800 bg-emerald-200 hover:bg-emerald-300 shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                      <span>Sí, Confirmar Pago y Pasar a "Solicitud recibida"</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleExecuteDecision}
                      className="winxp-button text-xs py-1.5 px-4 text-white font-black flex items-center gap-1.5 border-red-900 bg-red-700 hover:bg-red-800 shadow-xs"
                    >
                      <XCircle className="w-4 h-4 text-white" />
                      <span>Sí, Anular Pago y Liberar Stock</span>
                    </button>
                  )}
                </div>
              </div>
            </WindowFrame>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL DE CONTACTO / RESPUESTA RÁPIDA AL CLIENTE
         ========================================================================= */}
      {replyingAlert && (
        <div className="interest-notif-modal-overlay fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="w-full max-w-lg animate-in zoom-in-95 duration-150 my-auto">
            <WindowFrame
              title={
                replyingAlert.category === 'cobro_pendiente'
                  ? `NOTIFICACIÓN POR CORREO ELECTRÓNICO // ${replyingAlert.customerName}`
                  : `CONTACTAR CLIENTE // ${replyingAlert.customerName}`
              }
              icon={<PixelIcon name="floppy" size={16} />}
              onClose={() => setReplyingAlert(null)}
              statusBarText={
                replyingAlert.category === 'cobro_pendiente'
                  ? 'NOTIFICACIÓN AUTOMATIZADA POR CORREO // COBRO PENDIENTE'
                  : `CANAL DIRECTO // ${ALERT_CATEGORY_CONFIG[replyingAlert.category]?.label.toUpperCase()}`
              }
            >
              <div className="space-y-3 p-1 text-xs">
                {/* Resumen del cliente y alerta */}
                <div className="p-2.5 bg-gray-100 border border-gray-300 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-sm">{replyingAlert.customerName}</span>
                    <span className="font-mono text-gray-700 font-bold">{replyingAlert.customerPhone}</span>
                  </div>
                  <div className="text-gray-700 flex items-center justify-between">
                    <span>
                      Alerta: <strong>{replyingAlert.title}</strong>
                    </span>
                    {replyingAlert.amount && (
                      <span className="font-mono text-rose-800 font-bold">
                        ${replyingAlert.amount.toLocaleString('es-CL')} CLP
                      </span>
                    )}
                  </div>
                </div>

                {/* Canal de respuesta */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-800 mb-1">
                    Canal de Comunicación:
                  </label>
                  {replyingAlert.category === 'cobro_pendiente' ? (
                    <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-300 rounded-xs">
                      <Mail className="w-4 h-4 text-blue-700 shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold text-gray-800">Canal Automatizado Exclusivo: </span>
                        <strong className="text-blue-900 font-mono">
                          Correo Electrónico ({getAlertEmail(replyingAlert)})
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                        <input
                          type="radio"
                          name="channel"
                          checked={replyChannel === 'whatsapp'}
                          onChange={() => setReplyChannel('whatsapp')}
                        />
                        <span>WhatsApp Directo (+56)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                        <input
                          type="radio"
                          name="channel"
                          checked={replyChannel === 'email'}
                          onChange={() => setReplyChannel('email')}
                        />
                        <span>Correo Electrónico ({getAlertEmail(replyingAlert)})</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Mensaje de respuesta */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-800 mb-1">
                    {replyingAlert.category === 'cobro_pendiente'
                      ? 'Mensaje automatizado de cobro a enviar al correo:'
                      : 'Mensaje automatizado redactado:'}
                  </label>
                  <textarea
                    rows={5}
                    value={replyCustomText}
                    onChange={(e) => setReplyCustomText(e.target.value)}
                    className="w-full winxp-input text-xs p-2 bg-white border border-[#7f9db9]"
                    placeholder="Escribe el mensaje..."
                  />
                </div>

                {/* Botones */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => setReplyingAlert(null)}
                    className="winxp-button text-xs py-1 px-3 text-gray-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSendReply}
                    className="winxp-button winxp-button-primary text-xs py-1 px-4 text-blue-950 font-bold flex items-center gap-1.5 shadow-xs border-blue-800 bg-blue-100"
                  >
                    <Send className="w-3.5 h-3.5 text-blue-700" />
                    <span>
                      {replyingAlert.category === 'cobro_pendiente'
                        ? 'Enviar Correo & Notificar'
                        : 'Enviar Mensaje & Resolver'}
                    </span>
                  </button>
                </div>
              </div>
            </WindowFrame>
          </div>
        </div>
      )}

      {/* =========================================================================
          VENTANITA DE CONFIRMACIÓN: "¿ESTÁS SEGURO?" PARA MARCAR RESUELTA O ELIMINAR
         ========================================================================= */}
      {confirmActionModal && (
        <div className="interest-notif-modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150">
            <WindowFrame
              title={
                confirmActionModal.action === 'delete'
                  ? `ELIMINAR SOLICITUD // ¿ESTÁS SEGURO?`
                  : `MARCAR RESUELTA // ¿ESTÁS SEGURO?`
              }
              icon={<PixelIcon name="computer" size={16} />}
              onClose={() => setConfirmActionModal(null)}
              statusBarText="CONFIRMACIÓN DE SEGURIDAD // SUPER ADMIN"
            >
              <div className="p-3 space-y-3 text-xs bg-[#ece9d8]">
                <div
                  className={`p-3 border-2 rounded-xs flex items-start gap-3 ${
                    confirmActionModal.action === 'delete'
                      ? 'bg-red-50 border-red-600'
                      : 'bg-emerald-50 border-emerald-600'
                  }`}
                >
                  <div
                    className={`p-2 rounded-full shrink-0 ${
                      confirmActionModal.action === 'delete'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {confirmActionModal.action === 'delete' ? (
                      <AlertTriangle className="w-6 h-6 text-red-700" />
                    ) : (
                      <HelpCircle className="w-6 h-6 text-emerald-700" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3
                      className={`text-sm font-black uppercase tracking-wide ${
                        confirmActionModal.action === 'delete' ? 'text-red-950' : 'text-emerald-950'
                      }`}
                    >
                      ¿Estás seguro?
                    </h3>
                    <p className="text-gray-800 leading-snug">
                      {confirmActionModal.action === 'delete' ? (
                        <>
                          Vas a <strong>eliminar permanentemente</strong> la solicitud{' '}
                          <strong>"{confirmActionModal.alert.title}"</strong> del cliente{' '}
                          <strong>{confirmActionModal.alert.customerName}</strong>.
                        </>
                      ) : confirmActionModal.alert.status === 'resolved' ? (
                        <>
                          Vas a <strong>reactivar</strong> la solicitud{' '}
                          <strong>"{confirmActionModal.alert.title}"</strong> del cliente{' '}
                          <strong>{confirmActionModal.alert.customerName}</strong>.
                        </>
                      ) : (
                        <>
                          Vas a <strong>marcar como resuelta</strong> la solicitud{' '}
                          <strong>"{confirmActionModal.alert.title}"</strong> del cliente{' '}
                          <strong>{confirmActionModal.alert.customerName}</strong>.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => setConfirmActionModal(null)}
                    className="winxp-button text-xs py-1 px-4 text-gray-800 font-bold"
                  >
                    Cancelar
                  </button>

                  {confirmActionModal.action === 'delete' ? (
                    <button
                      type="button"
                      onClick={handleExecuteConfirmAction}
                      className="winxp-button text-xs py-1 px-4 text-white font-black flex items-center gap-1.5 border-red-900 bg-red-700 hover:bg-red-800 shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                      <span>Sí, Eliminar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleExecuteConfirmAction}
                      className="winxp-button winxp-button-primary text-xs py-1 px-4 text-emerald-950 font-black flex items-center gap-1.5 border-emerald-800 bg-emerald-200 hover:bg-emerald-300 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                      <span>
                        {confirmActionModal.alert.status === 'resolved'
                          ? 'Sí, Reactivar Alerta'
                          : 'Sí, Marcar Resuelta'}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </WindowFrame>
          </div>
        </div>
      )}

      {/* =========================================================================
          VENTANITA DE DETALLE COMPLETO DEL PRODUCTO Y GALERÍA DE IMÁGENES
         ========================================================================= */}
      {productDetailModal &&
        (() => {
          const { alert: modalAlert, product: modalProd, activeImageIndex } = productDetailModal;
          const galleryImages =
            modalProd.images && modalProd.images.length > 0
              ? modalProd.images
              : modalProd.image
              ? [modalProd.image]
              : [
                  'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80'
                ];
          const safeImgIdx = Math.min(Math.max(0, activeImageIndex), galleryImages.length - 1);
          const currentImageSrc = galleryImages[safeImgIdx];
          const unitPrice = modalProd.price || 0;

          return (
            <div className="interest-notif-modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150 overflow-y-auto">
              <div className="interest-notif-modal-fixed-frame w-full max-w-4xl h-[660px] max-h-[660px] shadow-2xl animate-in zoom-in-95 duration-150 my-auto">
                <WindowFrame
                  title={`DETALLE DE PRODUCTO // ${modalProd.name}`}
                  icon={<PixelIcon name="folder" size={16} />}
                  onClose={() => setProductDetailModal(null)}
                  className="interest-notif-modal-fixed-frame h-[660px] max-h-[660px] flex flex-col"
                  bodyClassName="flex-1 min-h-0 flex flex-col overflow-hidden"
                  statusBarText={`SKU: ${modalProd.sku || 'S/N'} // ${galleryImages.length} IMAGEN(ES) SUBIDA(S)`}
                >
                  <div className="flex-1 min-h-0 flex flex-col justify-between p-3.5 space-y-3 text-xs bg-[#ece9d8] overflow-y-auto">
                    {/* Encabezado de contexto de la solicitud */}
                    <div className="shrink-0 p-2.5 bg-white border border-gray-400 rounded-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          style={{ color: '#ffffff' }}
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-xs !text-white ${
                            modalAlert.category === 'devolucion' ? 'bg-amber-700' : 'bg-rose-700'
                          }`}
                        >
                          {modalAlert.category === 'devolucion'
                            ? 'SOLICITUD DE DEVOLUCIÓN'
                            : 'COBRO PENDIENTE'}
                        </span>
                        <span className="font-bold text-gray-900">{modalAlert.title}</span>
                      </div>
                      <div className="text-[11px] font-mono text-gray-700">
                        Cliente: <strong className="text-gray-950">{modalAlert.customerName}</strong>
                        {modalAlert.orderNumber && (
                          <>
                            {' '}
                            • Orden:{' '}
                            <strong className="text-blue-900">#{modalAlert.orderNumber}</strong>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Contenedor Principal: Galería de Imágenes (Izquierda) + Detalles del Producto (Derecha) */}
                    <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-3.5">
                      {/* Columna Galería de Imágenes */}
                      <div className="md:col-span-5 bg-white border border-gray-400 rounded-xs p-2.5 flex flex-col justify-between space-y-2">
                        <div>
                          <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-gray-200">
                            <span className="text-[10px] font-black uppercase text-gray-700 flex items-center gap-1">
                              <Package className="w-3.5 h-3.5 text-blue-700" />
                              <span>Imágenes Subidas ({galleryImages.length})</span>
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded-xs border border-blue-200">
                              Imagen {safeImgIdx + 1} de {galleryImages.length}
                            </span>
                          </div>

                          {/* Visor Principal */}
                          <div className="relative w-full h-[250px] bg-gray-100 border border-gray-300 rounded-xs overflow-hidden flex items-center justify-center group">
                            <img
                              src={currentImageSrc}
                              alt={`${modalProd.name} - Imagen ${safeImgIdx + 1}`}
                              className="w-full h-full object-cover"
                            />

                            {galleryImages.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProductDetailModal((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            activeImageIndex:
                                              (safeImgIdx - 1 + galleryImages.length) %
                                              galleryImages.length
                                          }
                                        : null
                                    )
                                  }
                                  className="winxp-button absolute left-1.5 top-1/2 -translate-y-1/2 p-1 bg-white/95 hover:bg-white shadow-md border-gray-600"
                                  title="Imagen anterior"
                                >
                                  <ChevronLeft className="w-4 h-4 text-gray-900" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProductDetailModal((prev) =>
                                      prev
                                        ? {
                                            ...prev,
                                            activeImageIndex: (safeImgIdx + 1) % galleryImages.length
                                          }
                                        : null
                                    )
                                  }
                                  className="winxp-button absolute right-1.5 top-1/2 -translate-y-1/2 p-1 bg-white/95 hover:bg-white shadow-md border-gray-600"
                                  title="Siguiente imagen"
                                >
                                  <ChevronRight className="w-4 h-4 text-gray-900" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Miniaturas de todas las imágenes subidas */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-gray-600 block">
                            {galleryImages.length > 1
                              ? 'Selecciona una miniatura para inspeccionar cada foto subida:'
                              : '1 fotografía registrada para este producto:'}
                          </span>
                          <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                            {galleryImages.map((imgUrl, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() =>
                                  setProductDetailModal((prev) =>
                                    prev ? { ...prev, activeImageIndex: idx } : null
                                  )
                                }
                                className={`relative aspect-square rounded-xs overflow-hidden border-2 transition-all cursor-pointer ${
                                  idx === safeImgIdx
                                    ? 'border-blue-700 ring-2 ring-blue-400 scale-[1.02]'
                                    : 'border-gray-300 opacity-75 hover:opacity-100 hover:border-gray-500'
                                }`}
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Miniatura ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <span
                                  style={{ color: '#ffffff' }}
                                  className="absolute bottom-0 right-0 bg-black/75 !text-white text-[9px] font-mono font-bold px-1 leading-tight"
                                >
                                  #{idx + 1}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Columna Detalles Completos del Producto */}
                      <div className="md:col-span-7 bg-white border border-gray-400 rounded-xs p-3 space-y-2.5 flex flex-col justify-between">
                        <div className="space-y-2.5">
                          <div className="border-b border-gray-200 pb-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 bg-gray-100 border border-gray-300 text-gray-700 rounded-xs">
                                {modalProd.category || 'Prenda Y2K / Streetwear'}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-gray-600">
                                SKU: <strong className="text-gray-900">{modalProd.sku || 'S/N'}</strong>
                              </span>
                            </div>
                            <h3 className="text-sm font-black text-gray-950 mt-1.5 leading-snug">
                              {modalProd.name}
                            </h3>
                          </div>

                          {/* Grilla de Especificaciones Comerciales */}
                          <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-xs border border-gray-200 text-[11px]">
                            <div>
                              <span className="text-gray-500 font-bold block">Talla Seleccionada:</span>
                              <span className="font-black text-blue-950 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-xs inline-block mt-0.5">
                                Talla {modalProd.size || 'Única'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 font-bold block">
                                {modalAlert.category === 'devolucion'
                                  ? 'Unidades a Devolver:'
                                  : 'Unidades por Pagar:'}
                              </span>
                              <span className="font-black text-gray-900 text-xs block mt-0.5">
                                {modalProd.quantity}{' '}
                                {modalProd.quantity === 1 ? 'unidad' : 'unidades'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 font-bold block">Precio Unitario:</span>
                              <span className="font-mono font-bold text-gray-900 block mt-0.5">
                                ${unitPrice.toLocaleString('es-CL')} CLP
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 font-bold block">Subtotal Ítem:</span>
                              <span className="font-mono font-black text-rose-800 text-xs block mt-0.5">
                                ${(unitPrice * modalProd.quantity).toLocaleString('es-CL')} CLP
                              </span>
                            </div>
                          </div>

                          {/* Descripción técnica del producto */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase text-gray-600 block">
                              Descripción y Especificaciones del Producto:
                            </span>
                            <p className="text-[11px] text-gray-800 bg-gray-50 p-2.5 rounded-xs border border-gray-200 leading-relaxed">
                              {modalProd.description ||
                                'Prenda original del catálogo New Life Y2K. Confección de alta resistencia con costuras reforzadas y control de calidad verificado en sucursal.'}
                            </p>
                          </div>

                          {/* Motivo y Agencia de Envío si es Solicitud de Devolución */}
                          {modalAlert.category === 'devolucion' &&
                            (() => {
                              const retLogistics = getAlertReturnLogistics(modalAlert);
                              return (
                                <div className="space-y-2 pt-1 border-t border-gray-200">
                                  <div className="p-2 rounded-xs bg-amber-50 border border-amber-300 text-[11px]">
                                    <span className="text-[9px] font-black uppercase text-amber-900 block">
                                      Motivo de la Solicitud (Seleccionado por el Usuario):
                                    </span>
                                    <span className="font-black text-amber-950 block mt-0.5">
                                      {retLogistics.motivo}
                                    </span>
                                  </div>
                                  {modalAlert.deliveryType === 'envio' && (
                                    <div
                                      className={`p-2 rounded-xs border text-[11px] ${
                                        retLogistics.paidByOwner
                                          ? 'bg-emerald-50 border-emerald-400'
                                          : 'bg-blue-50 border-blue-300'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-black text-gray-900">
                                          Agencia: {retLogistics.courierName}
                                        </span>
                                        <span
                                          data-force-white="true"
                                          style={{ color: '#ffffff' }}
                                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-xs !text-white ${
                                            retLogistics.paidByOwner ? 'bg-emerald-700' : 'bg-blue-800'
                                          }`}
                                        >
                                          {retLogistics.paidByOwner ? 'PAGA EL DUEÑO' : 'PAGA EL USUARIO'}
                                        </span>
                                      </div>
                                      {retLogistics.paidByOwner ? (
                                        <div className="mt-1 flex items-center justify-between text-[11px]">
                                          <span className="text-emerald-950 font-semibold">
                                            Valor envío a pagar por el dueño (Cliente: $0 CLP):
                                          </span>
                                          <span className="font-mono font-black text-rose-800">
                                            ${retLogistics.ownerShippingCostClp.toLocaleString('es-CL')} CLP
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="mt-1 flex items-center justify-between text-[11px]">
                                          <span className="text-blue-950 font-semibold">
                                            Valor envío que el usuario va a pagar:
                                          </span>
                                          <span className="font-mono font-black text-blue-950">
                                            ${retLogistics.customerShippingCostClp.toLocaleString('es-CL')} CLP
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                          {/* Agencia de Transporte y Valor de Envío si es Cobro Pendiente con Envío */}
                          {modalAlert.category === 'cobro_pendiente' &&
                            modalAlert.deliveryType === 'envio' &&
                            (() => {
                              const pendingLogistics = getAlertPendingPaymentLogistics(modalAlert);
                              return (
                                <div className="space-y-2 pt-1 border-t border-gray-200">
                                  <div className="p-2 rounded-xs bg-rose-50 border border-rose-300 text-[11px] space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-black text-rose-950 flex items-center gap-1">
                                        <Truck className="w-3.5 h-3.5 text-rose-700" />
                                        <span>Agencia de Transporte: {pendingLogistics.courierName}</span>
                                      </span>
                                      <span
                                        data-force-white="true"
                                        style={{ color: '#ffffff' }}
                                        className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-xs !text-white bg-rose-700"
                                      >
                                        ENVÍO POR {pendingLogistics.courierName.toUpperCase()}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-gray-700 font-semibold">
                                        Valor de Envío ({pendingLogistics.courierName}):
                                      </span>
                                      <span className="font-mono font-black text-blue-900">
                                        ${pendingLogistics.shippingCostClp.toLocaleString('es-CL')} CLP
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                        </div>

                        {/* Pie de información de galería */}
                        <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-600">
                          <span>
                            Total de fotos subidas en esta ficha:{' '}
                            <strong className="text-gray-900">{galleryImages.length} imágenes</strong>
                          </span>
                          <span className="font-mono text-gray-500">ID: {modalProd.id || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Botón cerrar ventana */}
                    <div className="flex items-center justify-end pt-2 border-t border-gray-300">
                      <button
                        type="button"
                        onClick={() => setProductDetailModal(null)}
                        className="winxp-button winxp-button-primary text-xs py-1 px-5 text-gray-900 font-bold"
                      >
                        Cerrar Detalles del Producto
                      </button>
                    </div>
                  </div>
                </WindowFrame>
              </div>
            </div>
          );
        })()}

      {/* =========================================================================
          VENTANITA DE REVISIÓN DE EQUIPO (SOLICITUD DE DEVOLUCIÓN)
         ========================================================================= */}
      {returnReviewModal &&
        (() => {
          const reviewLogistics = getAlertReturnLogistics(returnReviewModal.alert);
          return (
            <div className="interest-notif-modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150 overflow-y-auto">
              <div className="w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-150 my-auto">
                <WindowFrame
                  title={`REVISIÓN DE EQUIPO // ${
                    returnReviewModal.alert.orderNumber
                      ? `#${returnReviewModal.alert.orderNumber}`
                      : returnReviewModal.alert.title
                  }`}
                  icon={<PixelIcon name="computer" size={16} />}
                  onClose={() => setReturnReviewModal(null)}
                  statusBarText="DICTAMEN DE SOLICITUD DE DEVOLUCIÓN // SUPER ADMIN"
                >
                  <div className="p-3.5 space-y-3.5 text-xs bg-[#ece9d8]">
                    {/* Resumen de la solicitud */}
                    <div className="p-2.5 bg-white border border-gray-400 rounded-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span
                          data-force-white="true"
                          style={{ color: '#ffffff' }}
                          className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-xs bg-amber-700 !text-white"
                        >
                          SOLICITUD DE DEVOLUCIÓN
                        </span>
                        {returnReviewModal.alert.orderNumber && (
                          <span className="text-[11px] font-mono font-bold text-blue-900">
                            #{returnReviewModal.alert.orderNumber}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 text-xs pt-0.5">
                        {returnReviewModal.alert.title}
                      </p>
                      <p className="text-[11px] text-gray-700">
                        Cliente: <strong>{returnReviewModal.alert.customerName}</strong> (
                        {returnReviewModal.alert.customerRut || 'Sin RUT'}) • Modalidad escogida:{' '}
                        <strong className="text-gray-900">
                          {returnReviewModal.alert.deliveryType === 'retiro'
                            ? 'Retiro / Presencial en Tienda'
                            : `Envío por ${reviewLogistics.courierName}`}
                        </strong>
                      </p>
                      <div className="pt-1.5 border-t border-gray-200 space-y-1 text-[11px]">
                        <div>
                          <span className="text-amber-900 font-bold">
                            Motivo seleccionado por el usuario:{' '}
                          </span>
                          <strong className="text-gray-900">{reviewLogistics.motivo}</strong>
                        </div>
                        {returnReviewModal.alert.deliveryType === 'envio' && (
                          <div className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded-xs border border-gray-200">
                            <span className="font-semibold text-gray-700">
                              {reviewLogistics.paidByOwner
                                ? `Envío ${reviewLogistics.courierName} (Cliente: $0 CLP · Paga el dueño):`
                                : `Envío ${reviewLogistics.courierName} (Paga el usuario):`}
                            </span>
                            <span
                              className={`font-mono font-black ${
                                reviewLogistics.paidByOwner ? 'text-rose-800' : 'text-blue-950'
                              }`}
                            >
                              $
                              {(reviewLogistics.paidByOwner
                                ? reviewLogistics.ownerShippingCostClp
                                : reviewLogistics.customerShippingCostClp
                              ).toLocaleString('es-CL')}{' '}
                              CLP
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selección de las 2 opciones: Aprobada por Admin / Rechazada por Admin */}
                    <div className="space-y-2">
                      <label className="block text-[11px] font-black uppercase text-gray-800">
                        Selecciona la resolución de Revisión de Equipo:
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Opción 1: Aprobada por Admin */}
                        <button
                          type="button"
                          onClick={() =>
                            setReturnReviewModal((prev) =>
                              prev
                                ? { ...prev, decision: 'approved', errorMessage: undefined }
                                : null
                            )
                          }
                          className={`p-3 rounded-xs border-2 text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                            returnReviewModal.decision === 'approved'
                              ? 'bg-emerald-50 border-emerald-700 ring-2 ring-emerald-300 shadow-xs'
                              : 'bg-white border-gray-300 hover:border-emerald-500'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-5 h-5 shrink-0 mt-0.5 ${
                              returnReviewModal.decision === 'approved'
                                ? 'text-emerald-700'
                                : 'text-gray-400'
                            }`}
                          />
                          <div>
                            <span className="font-black text-emerald-950 block text-xs">
                              Aprobada por Admin
                            </span>
                            <span className="text-[10px] text-gray-600 block mt-0.5 leading-snug">
                              Autoriza la devolución o cambio de prenda solicitado por el cliente.
                            </span>
                          </div>
                        </button>

                        {/* Opción 2: Rechazada por Admin */}
                        <button
                          type="button"
                          onClick={() =>
                            setReturnReviewModal((prev) =>
                              prev
                                ? { ...prev, decision: 'rejected', errorMessage: undefined }
                                : null
                            )
                          }
                          className={`p-3 rounded-xs border-2 text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                            returnReviewModal.decision === 'rejected'
                              ? 'bg-red-50 border-red-700 ring-2 ring-red-300 shadow-xs'
                              : 'bg-white border-gray-300 hover:border-red-500'
                          }`}
                        >
                          <XCircle
                            className={`w-5 h-5 shrink-0 mt-0.5 ${
                              returnReviewModal.decision === 'rejected'
                                ? 'text-red-700'
                                : 'text-gray-400'
                            }`}
                          />
                          <div>
                            <span className="font-black text-red-950 block text-xs">
                              Rechazada por Admin
                            </span>
                            <span className="text-[10px] text-gray-600 block mt-0.5 leading-snug">
                              Deniega la devolución indicando obligatoriamente la razón del rechazo.
                            </span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* En caso de que sea Aprobada por Admin y la modalidad de entrega sea Envío a Domicilio: pedir Código de Seguimiento */}
                    {returnReviewModal.decision === 'approved' &&
                      returnReviewModal.alert.deliveryType === 'envio' && (
                        <div className="p-3 bg-blue-50/90 border-2 border-blue-500 rounded-xs space-y-1.5 animate-in fade-in duration-150">
                          <label className="block text-[11px] font-black text-blue-950 uppercase flex items-center gap-1.5">
                            <Truck className="w-4 h-4 text-blue-700 shrink-0" />
                            <span>
                              Código de seguimiento de la devolución (Obligatorio para Envío a Domicilio):
                            </span>
                          </label>
                          <input
                            type="text"
                            value={returnReviewModal.trackingCode}
                            onChange={(e) =>
                              setReturnReviewModal((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      trackingCode: e.target.value,
                                      errorMessage: undefined
                                    }
                                  : null
                              )
                            }
                            placeholder="Ingresa el código de seguimiento para confirmar la devolución (ej. STARKEN-DEV-8802)..."
                            className="w-full winxp-input text-xs py-1.5 px-2.5 bg-white border border-blue-600 font-mono font-bold text-gray-900 focus:outline-none"
                          />
                        </div>
                      )}

                    {/* En caso de que se rechace: escribir la razón del rechazo */}
                    {returnReviewModal.decision === 'rejected' && (
                      <div className="p-3 bg-red-50/80 border-2 border-red-400 rounded-xs space-y-1.5 animate-in fade-in duration-150">
                        <label className="block text-[11px] font-black text-red-950 uppercase">
                          Razón del rechazo de la devolución (Obligatorio):
                        </label>
                        <textarea
                          rows={3}
                          value={returnReviewModal.rejectionReason}
                          onChange={(e) =>
                            setReturnReviewModal((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rejectionReason: e.target.value,
                                    errorMessage: undefined
                                  }
                                : null
                            )
                          }
                          placeholder="Escribe detalladamente la razón por la cual se rechaza la solicitud de devolución (ej. prenda sin etiqueta de seguridad, fuera de plazo, uso evidente)..."
                          className="w-full winxp-input text-xs p-2 bg-white border border-red-500 focus:outline-none"
                        />
                      </div>
                    )}

                    {returnReviewModal.errorMessage && (
                      <p className="text-[11px] font-black text-red-700 bg-red-100 border border-red-400 p-2 rounded-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>{returnReviewModal.errorMessage}</span>
                      </p>
                    )}

                    {/* Botones de Confirmación */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-300">
                      <button
                        type="button"
                        onClick={() => setReturnReviewModal(null)}
                        className="winxp-button text-xs py-1 px-4 text-gray-800 font-bold"
                      >
                        Cancelar
                      </button>

                      {returnReviewModal.decision === 'approved' ? (
                        <button
                          type="button"
                          onClick={handleExecuteReturnReview}
                          className="winxp-button winxp-button-primary text-xs py-1 px-4 text-emerald-950 font-black flex items-center gap-1.5 border-emerald-800 bg-emerald-200 hover:bg-emerald-300 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" />
                          <span>Confirmar: Aprobada por Admin</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleExecuteReturnReview}
                          className="winxp-button text-xs py-1 px-4 text-white font-black flex items-center gap-1.5 border-red-900 bg-red-700 hover:bg-red-800 shadow-xs"
                        >
                          <XCircle className="w-3.5 h-3.5 text-white" />
                          <span>Confirmar Rechazo de la Devolución</span>
                        </button>
                      )}
                    </div>
                  </div>
                </WindowFrame>
              </div>
            </div>
          );
        })()}

      {/* =========================================================================
          VENTANITA VISOR DE FOTOS DE REFERENCIA (SOLICITUD DE PRODUCTOS PERSONALIZADO - MÁX 10)
         ========================================================================= */}
      {referencePhotosModal &&
        (() => {
          const { alert: refAlert, photos, activeIndex } = referencePhotosModal;
          const cappedPhotos = photos.slice(0, 10);
          const safeIdx = Math.min(Math.max(0, activeIndex), cappedPhotos.length - 1);
          const currentPhoto = cappedPhotos[safeIdx];

          return (
            <div className="interest-notif-modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150 overflow-y-auto">
              <div className="w-full max-w-3xl shadow-2xl animate-in zoom-in-95 duration-150 my-auto">
                <WindowFrame
                  title={`FOTOS DE REFERENCIA // ${refAlert.productName || refAlert.title}`}
                  icon={<PixelIcon name="folder" size={16} />}
                  onClose={() => setReferencePhotosModal(null)}
                  statusBarText={`CLIENTE: ${refAlert.customerName} // ${cappedPhotos.length} DE MÁXIMO 10 FOTOS DE REFERENCIA`}
                  className="interest-notif-modal-fixed-frame h-[660px] max-h-[660px] flex flex-col"
                  bodyClassName="flex-1 min-h-0 flex flex-col overflow-hidden"
                >
                  <div className="p-3.5 space-y-3 text-xs bg-[#ece9d8] flex-1 min-h-0 flex flex-col justify-between overflow-y-auto">
                    <div className="p-2.5 bg-white border border-gray-400 rounded-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <span
                          style={{ color: '#ffffff' }}
                          className="text-[10px] font-black uppercase px-2 py-0.5 rounded-xs bg-emerald-700 !text-white"
                        >
                          SOLICITUD DE PRODUCTOS PERSONALIZADO
                        </span>
                        <span className="font-bold text-gray-900">{refAlert.title}</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-xs">
                        Foto #{safeIdx + 1} de {cappedPhotos.length} (Máx. 10)
                      </span>
                    </div>

                    {/* Imagen Principal */}
                    <div className="relative w-full flex-1 min-h-[260px] bg-gray-900 border-2 border-gray-400 rounded-xs overflow-hidden flex items-center justify-center">
                      <img
                        src={currentPhoto}
                        alt={`Referencia #${safeIdx + 1}`}
                        className="max-w-full max-h-full object-contain"
                      />
                      {cappedPhotos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setReferencePhotosModal((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      activeIndex:
                                        (safeIdx - 1 + cappedPhotos.length) % cappedPhotos.length
                                    }
                                  : null
                              )
                            }
                            className="winxp-button absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/95 hover:bg-white shadow-md"
                            title="Foto anterior"
                          >
                            <ChevronLeft className="w-4 h-4 text-gray-900" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setReferencePhotosModal((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      activeIndex: (safeIdx + 1) % cappedPhotos.length
                                    }
                                  : null
                              )
                            }
                            className="winxp-button absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-white/95 hover:bg-white shadow-md"
                            title="Siguiente foto"
                          >
                            <ChevronRight className="w-4 h-4 text-gray-900" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Tira de miniaturas (hasta 10 fotos) */}
                    <div className="bg-white border border-gray-400 p-2.5 rounded-xs space-y-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-gray-700 block">
                        Selecciona una fotografía de referencia enviada por {refAlert.customerName} (
                        {cappedPhotos.length} / 10):
                      </span>
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                        {cappedPhotos.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() =>
                              setReferencePhotosModal((prev) =>
                                prev ? { ...prev, activeIndex: idx } : null
                              )
                            }
                            className={`relative aspect-square rounded-xs overflow-hidden border-2 cursor-pointer transition-all ${
                              idx === safeIdx
                                ? 'border-emerald-700 ring-2 ring-emerald-400 scale-105'
                                : 'border-gray-300 opacity-75 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={imgUrl}
                              alt={`Miniatura #${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                            <span
                              style={{ color: '#ffffff' }}
                              className="absolute bottom-0 right-0 bg-black/80 !text-white text-[8px] font-mono font-bold px-1 leading-tight"
                            >
                              #{idx + 1}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1 border-t border-gray-300 shrink-0">
                      <button
                        type="button"
                        onClick={() => setReferencePhotosModal(null)}
                        className="winxp-button winxp-button-primary text-xs py-1 px-5 text-gray-900 font-bold"
                      >
                        Cerrar Galería de Referencia
                      </button>
                    </div>
                  </div>
                </WindowFrame>
              </div>
            </div>
          );
        })()}

      {/* =========================================================================
          MODAL: "AGREGAR REPORTE" (LISTA PREFERENCIAL O LISTA NEGRA -> ADMINISTRADOR DE CLIENTES)
         ========================================================================= */}
      {addReportModal && (
        <div className="interest-notif-modal-overlay fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 overflow-y-auto">
          <div className="w-full max-w-lg bg-white border-4 border-[#003c74] shadow-2xl animate-in zoom-in-95 duration-150 my-auto">
            {/* Barra de título con color según la lista seleccionada */}
            <div
              className={`p-2.5 px-3 flex items-center justify-between text-white text-xs font-bold transition-colors ${
                addReportModal.targetType === 'preferencial'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-900'
                  : 'bg-gradient-to-r from-rose-700 to-rose-950'
              }`}
            >
              <span className="flex items-center gap-1.5" style={{ color: '#ffffff' }}>
                {addReportModal.targetType === 'preferencial' ? (
                  <Star className="w-4 h-4 text-amber-200 fill-amber-300" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-rose-200" />
                )}
                <span style={{ color: '#ffffff' }}>
                  AÑADIR REPORTE // {addReportModal.customer.nombre}{' '}
                  {addReportModal.customer.apellido}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setAddReportModal(null)}
                className="w-5 h-5 bg-black/40 text-white flex items-center justify-center font-bold cursor-pointer"
                style={{ color: '#ffffff' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomerReport} className="p-4 space-y-3.5 text-xs">
              {/* Resumen del Cliente y Etiquetas Actuales */}
              <div className="p-2.5 bg-[#f0f4f8] border border-gray-300 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="font-black text-sm text-gray-950">
                    {addReportModal.customer.nombre} {addReportModal.customer.apellido}
                  </div>
                  {addReportModal.alert.category === 'devolucion' && (
                    <span className="font-mono text-[10px] text-gray-600">
                      RUT: {addReportModal.customer.rut}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-600">
                  <span className="font-bold">Etiquetas actuales en Administrador de Clientes:</span>
                  {addReportModal.customer.etiquetas.map((t, i) => (
                    <span
                      key={i}
                      className={`px-1.5 py-0.2 rounded-2xs font-mono font-bold text-[9px] border ${
                        t === 'Lista Negra'
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : t === 'Lista Preferencial'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-gray-100 text-gray-800 border-gray-300'
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* SELECTOR OBLIGATORIO: ¿A qué lista desea añadir el reporte? */}
              <div className="space-y-1.5">
                <label className="font-black text-gray-900 block text-xs uppercase tracking-wide">
                  Seleccione la Lista a la que desea Añadir el Reporte:{' '}
                  <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setAddReportModal({
                        ...addReportModal,
                        targetType: 'preferencial',
                        errorMessage: undefined
                      })
                    }
                    className={`p-2.5 border-2 text-left rounded-xs transition-all flex items-center gap-2 cursor-pointer ${
                      addReportModal.targetType === 'preferencial'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-300 shadow-xs'
                        : 'bg-white border-gray-300 hover:bg-amber-50/40 text-gray-600'
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 shrink-0 ${
                        addReportModal.targetType === 'preferencial'
                          ? 'text-amber-600 fill-amber-500'
                          : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <div className="font-black text-xs text-amber-950">Lista Preferencial</div>
                      <div className="text-[10px] text-gray-500">Buen comportamiento / VIP</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setAddReportModal({
                        ...addReportModal,
                        targetType: 'negra',
                        errorMessage: undefined
                      })
                    }
                    className={`p-2.5 border-2 text-left rounded-xs transition-all flex items-center gap-2 cursor-pointer ${
                      addReportModal.targetType === 'negra'
                        ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-300 shadow-xs'
                        : 'bg-white border-gray-300 hover:bg-rose-50/40 text-gray-600'
                    }`}
                  >
                    <ShieldAlert
                      className={`w-4 h-4 shrink-0 ${
                        addReportModal.targetType === 'negra' ? 'text-rose-600' : 'text-gray-400'
                      }`}
                    />
                    <div>
                      <div className="font-black text-xs text-rose-950">Lista Negra</div>
                      <div className="text-[10px] text-gray-500">Mal comportamiento / Deuda</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* CAMPOS ESPECÍFICOS SEGÚN LISTA SELECCIONADA */}
              {addReportModal.targetType === 'preferencial' ? (
                <div className="space-y-3 bg-amber-50/60 p-3 border border-amber-200 rounded-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-amber-950 block">
                      Motivo / Causa del Buen Comportamiento: <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Ej: Cliente VIP con retiro puntual, pagos instantáneos en Live Streams, alta fidelidad..."
                      value={addReportModal.reason}
                      onChange={(e) =>
                        setAddReportModal({
                          ...addReportModal,
                          reason: e.target.value,
                          errorMessage: undefined
                        })
                      }
                      className="w-full winxp-input text-xs p-2 bg-white border border-[#7f9db9]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-800 block">
                      Beneficio Otorgado: <span className="text-gray-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 15% Descuento Permanente, Regalo de prenda Y2K, Acceso prioritario"
                      value={addReportModal.benefit}
                      onChange={(e) =>
                        setAddReportModal({
                          ...addReportModal,
                          benefit: e.target.value
                        })
                      }
                      className="w-full winxp-input text-xs py-1 bg-white border border-[#7f9db9]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-800 block">
                      Observaciones / Instrucciones:{' '}
                      <span className="text-gray-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Atender prioritariamente por jefatura de sucursal"
                      value={addReportModal.notes}
                      onChange={(e) =>
                        setAddReportModal({
                          ...addReportModal,
                          notes: e.target.value
                        })
                      }
                      className="w-full winxp-input text-xs py-1 bg-white border border-[#7f9db9]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-rose-50/60 p-3 border border-rose-200 rounded-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-rose-950 block">
                      Motivo / Causa del Mal Comportamiento: <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Ej: Comprobante adulterado, insultos a personal, reserva en Live Stream sin pagar reteniendo stock..."
                      value={addReportModal.reason}
                      onChange={(e) =>
                        setAddReportModal({
                          ...addReportModal,
                          reason: e.target.value,
                          errorMessage: undefined
                        })
                      }
                      className="w-full winxp-input text-xs p-2 bg-white border border-[#7f9db9]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-800 block">
                      Deuda Impaga Registrada ($ CLP):{' '}
                      <span className="text-gray-500 font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs font-bold text-gray-500">
                        $
                      </span>
                      <input
                        type="text"
                        placeholder="Ej: 38.990"
                        value={addReportModal.debtAmount}
                        onChange={(e) => {
                          const num = e.target.value.replace(/[^0-9]/g, '');
                          setAddReportModal({
                            ...addReportModal,
                            debtAmount: num ? parseInt(num, 10).toLocaleString('es-CL') : ''
                          });
                        }}
                        className="w-full winxp-input pl-7 text-xs py-1 font-bold text-rose-800 bg-white border border-[#7f9db9]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-800 block">
                      Instrucción / Observación de Seguridad:{' '}
                      <span className="text-gray-500 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: No aceptar transferencias manuales; solo pago Webpay en línea confirmado"
                      value={addReportModal.notes}
                      onChange={(e) =>
                        setAddReportModal({
                          ...addReportModal,
                          notes: e.target.value
                        })
                      }
                      className="w-full winxp-input text-xs py-1 bg-white border border-[#7f9db9]"
                    />
                  </div>
                </div>
              )}

              {addReportModal.errorMessage && (
                <p className="text-[11px] font-black text-red-700 bg-red-100 border border-red-400 p-2 rounded-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{addReportModal.errorMessage}</span>
                </p>
              )}

              {/* Botones de Acción */}
              <div className="pt-2 border-t border-gray-300 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddReportModal(null)}
                  className="winxp-button text-xs py-1 px-3 font-semibold text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ color: '#000000' }}
                  className={`winxp-button winxp-button-primary text-xs py-1.5 px-4 font-black !text-black shadow-xs ${
                    addReportModal.targetType === 'preferencial'
                      ? 'bg-amber-200 hover:bg-amber-300 border-amber-800'
                      : 'bg-rose-200 hover:bg-rose-300 border-rose-900'
                  }`}
                >
                  <span style={{ color: '#000000' }} className="!text-black">
                    {addReportModal.targetType === 'preferencial'
                      ? 'Añadir a Lista Preferencial'
                      : 'Añadir a Lista Negra'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

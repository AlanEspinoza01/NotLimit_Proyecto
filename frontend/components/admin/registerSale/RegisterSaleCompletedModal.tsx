import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, Mail } from 'lucide-react';
import { PixelIcon } from '../../common/PixelIcon';
import { CompletedSaleModalData, formatCLP } from './registerSaleTypes';

interface RegisterSaleCompletedModalProps {
  completedSaleModal: CompletedSaleModalData | null;
  onClose: () => void;
  onResetAll: () => void;
}

export const RegisterSaleCompletedModal: React.FC<RegisterSaleCompletedModalProps> = ({
  completedSaleModal,
  onClose,
  onResetAll
}) => {
  if (!completedSaleModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center rs-modal-overlay overflow-y-auto">
      <div className="rs-modal-window bg-white border-4 border-[#003c74] shadow-2xl animate-fadeIn">
        <div className="bg-gradient-to-r from-[#0055ea] to-[#003c74] p-2 px-3 flex items-center justify-between text-white text-xs font-bold">
          <div className="flex items-center gap-2">
            <PixelIcon name="computer" size={16} />
            <span>ORDEN GENERADA // {completedSaleModal.orderNumber}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-5 h-5 bg-[#c75050] hover:bg-red-700 text-white flex items-center justify-center font-bold text-xs"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4 text-xs">
          {completedSaleModal.status === 'Pendiente de Pago' ? (
            <div className="p-3 bg-amber-50 border-2 border-amber-500 text-amber-950 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-700 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm uppercase">
                    Venta Registrada como "Pago Pendiente"
                  </h3>
                  <p className="text-[11px] text-amber-800">
                    La orden <strong>{completedSaleModal.orderNumber}</strong> se guardó sin contabilizar ingresos. Se programó recordatorio con expiración en <strong>{completedSaleModal.deadlineHours} horas</strong>.
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-amber-300 rounded-xs space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-blue-900">
                    <Mail className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>Simulador de Correo Automatizado al Cliente:</span>
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">Enviado a: {completedSaleModal.email}</span>
                </div>

                <div className="p-2.5 bg-[#f8fafc] border border-gray-200 text-gray-800 font-mono text-[11px] leading-relaxed">
                  <p><strong>De:</strong> pagos@nolimits.cl (No Limits Apparel OS)</p>
                  <p><strong>Para:</strong> {completedSaleModal.email} ({completedSaleModal.customerName})</p>
                  <p><strong>Asunto:</strong> ⚠️ Recordatorio: Tu reserva en No Limits #{completedSaleModal.orderNumber} expira en {completedSaleModal.deadlineHours} horas</p>
                  <hr className="my-1.5 border-gray-300" />
                  <p>Hola <strong>{completedSaleModal.customerName}</strong>,</p>
                  <p>Tu orden por un total de <strong>{formatCLP(completedSaleModal.total)} CLP</strong> se encuentra actualmente reservada pero con <strong>Pago Pendiente</strong>.</p>
                  <p>El tiempo límite para realizar tu pago expira en <strong>{completedSaleModal.deadlineHours} horas</strong>. Por favor efectúa tu transferencia o pago antes del corte; de lo contrario, las prendas serán liberadas automáticamente al stock público de la tienda.</p>
                  <p className="mt-1 text-blue-900 font-bold">Instrucción: {completedSaleModal.instruction}</p>
                </div>
              </div>

              <div className="text-[11px] text-gray-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Se generó una alerta de "COBRO PENDIENTE" visible para el Super Administrador en la sección Notificaciones de Interés.</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-500 text-emerald-950 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm uppercase">
                    ¡Venta Confirmada con Éxito!
                  </h3>
                  <p className="text-[11px] text-emerald-800">
                    La orden <strong>{completedSaleModal.orderNumber}</strong> ingresó oficialmente a la contabilidad y suma al historial y promedios de la sucursal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Resumen de Detalles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 border border-gray-300">
            <div>
              <span className="text-[10px] text-gray-500 font-bold block">CLIENTE:</span>
              <span className="font-bold text-gray-900">{completedSaleModal.customerName}</span>
              <span className="text-[10px] text-gray-600 block">{completedSaleModal.phone}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 font-bold block">ENTREGA:</span>
              <span className="font-bold text-gray-900">
                {completedSaleModal.deliveryType === 'retiro' ? 'Retiro en Sucursal' : `Envío (${completedSaleModal.courier})`}
              </span>
              <span className="text-[10px] text-gray-600 block line-clamp-1">{completedSaleModal.fullAddress}</span>
            </div>
          </div>

          {/* Botón de Cierre */}
          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={onResetAll}
              className="winxp-button text-xs py-1.5 px-4 font-bold text-gray-700"
            >
              Registrar Otra Venta
            </button>
            <Link to="/admin/orders">
              <button
                type="button"
                onClick={onClose}
                className="winxp-button winxp-button-primary text-xs py-1.5 px-4 font-bold text-white bg-blue-700"
              >
                Ver en Órdenes de Compra
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

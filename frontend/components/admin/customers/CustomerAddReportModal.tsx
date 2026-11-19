import React from 'react';
import { Star, ShieldAlert } from 'lucide-react';
import { CustomerRecord } from './customerManagerTypes';

export interface CustomerAddReportModalProps {
  addReportCustomer: CustomerRecord | null;
  setAddReportCustomer: (cust: CustomerRecord | null) => void;
  reportTargetType: 'preferencial' | 'negra';
  setReportTargetType: (val: 'preferencial' | 'negra') => void;
  reportReason: string;
  setReportReason: (val: string) => void;
  reportDebtAmount: string;
  setReportDebtAmount: (val: string) => void;
  reportBenefit: string;
  setReportBenefit: (val: string) => void;
  reportNotes: string;
  setReportNotes: (val: string) => void;
  handleSaveReport: (e: React.FormEvent) => void;
}

export const CustomerAddReportModal: React.FC<CustomerAddReportModalProps> = ({
  addReportCustomer,
  setAddReportCustomer,
  reportTargetType,
  setReportTargetType,
  reportReason,
  setReportReason,
  reportDebtAmount,
  setReportDebtAmount,
  reportBenefit,
  setReportBenefit,
  reportNotes,
  setReportNotes,
  handleSaveReport
}) => {
  if (!addReportCustomer) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="nl-cust-modal-window w-full max-w-lg bg-white border-4 border-[#003c74] shadow-2xl animate-fadeIn">
        {/* Barra de título con color según la lista seleccionada */}
        <div
          className={`p-2.5 px-3 flex items-center justify-between text-white text-xs font-bold transition-colors ${
            reportTargetType === 'preferencial'
              ? 'bg-gradient-to-r from-amber-600 to-amber-900'
              : 'bg-gradient-to-r from-rose-700 to-rose-950'
          }`}
        >
          <span className="flex items-center gap-1.5">
            {reportTargetType === 'preferencial' ? (
              <Star className="w-4 h-4 text-amber-200 fill-amber-300 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-200 shrink-0" />
            )}
            <span>
              AÑADIR REPORTE // {addReportCustomer.nombre} {addReportCustomer.apellido}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setAddReportCustomer(null)}
            className="w-5 h-5 bg-black/40 text-white flex items-center justify-center font-bold shrink-0"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveReport} className="p-4 space-y-3.5 text-xs">
          {/* Resumen del Cliente y Etiquetas Actuales */}
          <div className="p-2.5 bg-[#f0f4f8] border border-gray-300 space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="font-black text-sm text-gray-950">
                {addReportCustomer.nombre} {addReportCustomer.apellido}
              </div>
              <span className="font-mono text-[10px] text-gray-600">RUT: {addReportCustomer.rut}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-600 flex-wrap">
              <span className="font-bold">Etiquetas actuales:</span>
              {addReportCustomer.etiquetas.map((t, i) => (
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
              Seleccione la Lista a la que desea Añadir el Reporte: <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setReportTargetType('preferencial')}
                className={`p-2.5 border-2 text-left rounded-xs transition-all flex items-center gap-2 ${
                  reportTargetType === 'preferencial'
                    ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-300 shadow-xs'
                    : 'bg-white border-gray-300 hover:bg-amber-50/40 text-gray-600'
                }`}
              >
                <Star
                  className={`w-4 h-4 shrink-0 ${
                    reportTargetType === 'preferencial' ? 'text-amber-600 fill-amber-500' : 'text-gray-400'
                  }`}
                />
                <div>
                  <div className="font-black text-xs text-amber-950">Lista Preferencial</div>
                  <div className="text-[10px] text-gray-500">Buen comportamiento / VIP</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReportTargetType('negra')}
                className={`p-2.5 border-2 text-left rounded-xs transition-all flex items-center gap-2 ${
                  reportTargetType === 'negra'
                    ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-300 shadow-xs'
                    : 'bg-white border-gray-300 hover:bg-rose-50/40 text-gray-600'
                }`}
              >
                <ShieldAlert
                  className={`w-4 h-4 shrink-0 ${
                    reportTargetType === 'negra' ? 'text-rose-600' : 'text-gray-400'
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
          {reportTargetType === 'preferencial' ? (
            /* FORMULARIO LISTA PREFERENCIAL */
            <div className="space-y-3 bg-amber-50/60 p-3 border border-amber-200 rounded-xs">
              <div className="space-y-1">
                <label className="font-bold text-amber-950 block">
                  Motivo / Causa del Buen Comportamiento: <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ej: Cliente VIP con retiro puntual, pagos instantáneos en Live Streams, alta fidelidad..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
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
                  value={reportBenefit}
                  onChange={(e) => setReportBenefit(e.target.value)}
                  className="w-full winxp-input text-xs py-1 bg-white border border-[#7f9db9]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-800 block">
                  Observaciones / Instrucciones: <span className="text-gray-500 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Atender prioritariamente por jefatura de sucursal"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full winxp-input text-xs py-1 bg-white border border-[#7f9db9]"
                />
              </div>
            </div>
          ) : (
            /* FORMULARIO LISTA NEGRA */
            <div className="space-y-3 bg-rose-50/60 p-3 border border-rose-200 rounded-xs">
              <div className="space-y-1">
                <label className="font-bold text-rose-950 block">
                  Motivo / Causa del Mal Comportamiento: <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ej: Comprobante adulterado, insultos a personal, reserva en Live Stream sin pagar reteniendo stock..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full winxp-input text-xs p-2 bg-white border border-[#7f9db9]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-800 block">
                  Deuda Impaga Registrada ($ CLP): <span className="text-gray-500 font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-gray-500">$</span>
                  <input
                    type="text"
                    placeholder="Ej: 38.990"
                    value={reportDebtAmount}
                    onChange={(e) => {
                      const num = e.target.value.replace(/[^0-9]/g, '');
                      setReportDebtAmount(num ? parseInt(num, 10).toLocaleString('es-CL') : '');
                    }}
                    className="w-full winxp-input pl-7 text-xs py-1 font-bold text-rose-800 bg-white border border-[#7f9db9]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-800 block">
                  Instrucción / Observación de Seguridad: <span className="text-gray-500 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: No aceptar transferencias manuales; solo pago Webpay en línea confirmado"
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  className="w-full winxp-input text-xs py-1 bg-white border border-[#7f9db9]"
                />
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-2 border-t border-gray-300 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddReportCustomer(null)}
              className="winxp-button text-xs py-1 px-3 font-semibold text-gray-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`winxp-button winxp-button-primary text-xs py-1.5 px-4 font-black text-white shadow-xs ${
                reportTargetType === 'preferencial'
                  ? 'bg-amber-600 hover:bg-amber-700 border-amber-800'
                  : 'bg-rose-700 hover:bg-rose-800 border-rose-900'
              }`}
            >
              {reportTargetType === 'preferencial'
                ? 'Añadir a Lista Preferencial'
                : 'Añadir a Lista Negra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

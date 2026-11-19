import React from 'react';
import { Clock, CheckCircle2, ShieldAlert, BellRing, AlertTriangle } from 'lucide-react';
import { PixelIcon } from '../../common/PixelIcon';
import { REMINDER_DEADLINE_OPTIONS, formatCLP } from './registerSaleTypes';

interface RegisterSalePaymentSectionProps {
  paymentStatus: 'pendiente' | 'confirmado';
  onChangePaymentStatus: (status: 'pendiente' | 'confirmado') => void;
  showReminderModal: boolean;
  onToggleReminderModal: () => void;
  reminderTitle: string;
  onChangeReminderTitle: (val: string) => void;
  clientFirstName: string;
  clientLastName: string;
  reminderDeadlineHours: number;
  onChangeReminderDeadlineHours: (hours: number) => void;
  grandTotal: number;
  reminderInstruction: string;
  onChangeReminderInstruction: (val: string) => void;
  saleProductsListLength: number;
  onResetAll: () => void;
  onFinalizeSale: (e: React.FormEvent) => void;
}

export const RegisterSalePaymentSection: React.FC<RegisterSalePaymentSectionProps> = ({
  paymentStatus,
  onChangePaymentStatus,
  showReminderModal,
  onToggleReminderModal,
  reminderTitle,
  onChangeReminderTitle,
  clientFirstName,
  clientLastName,
  reminderDeadlineHours,
  onChangeReminderDeadlineHours,
  grandTotal,
  reminderInstruction,
  onChangeReminderInstruction,
  saleProductsListLength,
  onResetAll,
  onFinalizeSale
}) => {
  return (
    <div className="bg-white border-2 border-gray-400 p-4 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <PixelIcon name="computer" size={16} />
          <span className="font-extrabold text-xs text-[#003c74] uppercase">
            3. Estado de la Transacción: Seleccione el Tipo de Pago
          </span>
        </div>
        <span className="text-[11px] font-mono text-gray-500">
          Acción Contable Requerida
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Botón Pago Pendiente */}
        <button
          type="button"
          onClick={() => onChangePaymentStatus('pendiente')}
          className={`p-3.5 text-left border-2 transition-all flex items-start gap-3 relative ${
            paymentStatus === 'pendiente'
              ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-300 shadow-sm'
              : 'bg-[#f8fafc] border-gray-300 hover:border-gray-400 opacity-80'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xs flex items-center justify-center shrink-0 border ${
              paymentStatus === 'pendiente'
                ? 'bg-amber-500 text-white border-amber-700 shadow-xs'
                : 'bg-gray-200 text-gray-600 border-gray-300'
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase text-amber-950">
                Pago Pendiente
              </span>
              {paymentStatus === 'pendiente' && (
                <span className="bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-xs">
                  ACTIVO
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-600 mt-1 leading-tight">
              Para cuando el cliente no tiene el dinero en el momento pero pide más tiempo.{' '}
              <strong>NO se registra como ingreso en el sistema</strong>.
            </p>
          </div>
        </button>

        {/* Botón Pago Confirmado */}
        <button
          type="button"
          onClick={() => onChangePaymentStatus('confirmado')}
          className={`p-3.5 text-left border-2 transition-all flex items-start gap-3 relative ${
            paymentStatus === 'confirmado'
              ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-300 shadow-sm'
              : 'bg-[#f8fafc] border-gray-300 hover:border-gray-400 opacity-80'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xs flex items-center justify-center shrink-0 border ${
              paymentStatus === 'confirmado'
                ? 'bg-emerald-600 text-white border-emerald-800 shadow-xs'
                : 'bg-gray-200 text-gray-600 border-gray-300'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase text-emerald-950">
                Pago Confirmado
              </span>
              {paymentStatus === 'confirmado' && (
                <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-xs">
                  ACTIVO
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-600 mt-1 leading-tight">
              El cliente abonó el 100% de la venta.{' '}
              <strong>SÍ se registra inmediatamente como ingreso</strong> oficial en la contabilidad.
            </p>
          </div>
        </button>
      </div>

      {/* SECCIÓN ESPECIAL CUANDO ESTÁ EN "PAGO PENDIENTE" */}
      {paymentStatus === 'pendiente' && (
        <div className="mt-3 p-3.5 bg-amber-50/90 border-2 border-amber-400 space-y-3 animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-300 pb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <span className="font-extrabold text-xs text-amber-950 uppercase">
                  Protocolo de Cobro Pendiente y Liberación de Stock
                </span>
                <span className="text-[11px] text-amber-800 block">
                  Al aplicar un pago pendiente, se creará una alerta automatizada de "COBRO PENDIENTE" para el admin y correos recordatorios para el cliente.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleReminderModal}
              className="winxp-button text-xs py-1.5 px-3 font-bold text-amber-950 bg-amber-100 hover:bg-amber-200 border-amber-600 flex items-center gap-1.5 shadow-xs"
            >
              <BellRing className="w-4 h-4 text-amber-700" />
              <span>
                {showReminderModal ? 'Cerrar Parámetros de Recordatorio' : '🔔 Programar Recordatorio de Cobro'}
              </span>
            </button>
          </div>

          {/* Formulario de Configuración del Recordatorio */}
          {showReminderModal && (
            <div className="bg-white border border-amber-300 p-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs items-end">
                {/* Título del recordatorio */}
                <div className="flex flex-col justify-end">
                  <label className="font-bold text-gray-800 text-xs h-[30px] flex items-end pb-1 leading-tight">
                    <span>Título del Recordatorio:</span>
                  </label>
                  <input
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => onChangeReminderTitle(e.target.value)}
                    style={{ height: '32px' }}
                    className="w-full winxp-input text-xs h-[32px] font-semibold"
                    placeholder="Ej: Cobro Pendiente Reserva Live Stream"
                  />
                </div>

                {/* Nombre del Cliente Asociado */}
                <div className="flex flex-col justify-end">
                  <label className="font-bold text-gray-800 text-xs h-[30px] flex items-end pb-1 leading-tight">
                    <span>Nombre del Cliente Asociado:</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={
                      clientFirstName || clientLastName
                        ? `${clientFirstName} ${clientLastName}`
                        : 'Se vinculará con datos de cliente ingresados arriba'
                    }
                    style={{ height: '32px' }}
                    className="w-full winxp-input text-xs h-[32px] bg-gray-100 text-gray-700 font-bold truncate"
                  />
                </div>

                {/* Plazo de Expiración del Recordatorio con DELGADO BORDE NEGRO */}
                <div className="flex flex-col justify-end">
                  <label className="font-bold text-amber-950 text-xs h-[30px] flex items-end pb-1 leading-tight">
                    <span>Plazo de Expiración del Recordatorio:</span>
                  </label>
                  <select
                    value={reminderDeadlineHours}
                    onChange={(e) => onChangeReminderDeadlineHours(Number(e.target.value))}
                    style={{ border: '1px solid #000000', height: '32px' }}
                    className="w-full winxp-select text-xs h-[32px] font-black text-amber-900 bg-amber-50 border border-black"
                  >
                    {REMINDER_DEADLINE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Monto Del Ingreso */}
                <div className="flex flex-col justify-end">
                  <label className="font-bold text-gray-800 text-xs h-[30px] flex items-end pb-1 leading-tight">
                    <span>Monto Del Ingreso (Por Cobrar):</span>
                  </label>
                  <div
                    style={{ height: '32px' }}
                    className="winxp-input text-xs h-[32px] font-black text-amber-900 bg-amber-50 flex items-center"
                  >
                    {formatCLP(grandTotal)} CLP
                  </div>
                </div>
              </div>

              {/* Instrucción / Descripción del Recordatorio */}
              <div className="space-y-1 text-xs">
                <label className="font-bold text-gray-800 block">
                  Instrucción / Descripción del Recordatorio:
                </label>
                <textarea
                  rows={2}
                  value={reminderInstruction}
                  onChange={(e) => onChangeReminderInstruction(e.target.value)}
                  className="w-full winxp-input text-xs p-1.5"
                  placeholder="Instrucciones en caso de que expire el plazo y cómo liberar las prendas..."
                />
              </div>

              {/* Aviso Regulatorio Contable */}
              <div className="p-2 bg-rose-50 border border-rose-300 text-rose-900 text-[11px] font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>RECORDATORIO CONTABLE:</strong> Al aplicar este pago pendiente,{' '}
                  <strong>esto no se registrará como un ingreso en el sistema</strong>, ya que en este caso la venta aún no ha sido confirmada ni recaudada.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RESUMEN CONTABLE FINAL Y BOTÓN DE REGISTRO */}
      <div className="pt-3 border-t-2 border-gray-400 rs-final-summary-bar bg-[#f8fafc] -mx-4 -mb-4 p-4">
        <div>
          <div className="text-xs text-gray-600">
            Total de la Operación:{' '}
            <strong className="text-gray-900 font-mono">{saleProductsListLength || 1} producto(s)</strong>
          </div>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-xl font-black text-[#003c74]">
              {formatCLP(grandTotal)} CLP
            </span>
            {paymentStatus === 'pendiente' ? (
              <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-400 px-2 py-0.5">
                ⚠️ $0 Ingreso Contable (Pago Pendiente)
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-400 px-2 py-0.5">
                ✓ Ingreso Confirmado en Sistema
              </span>
            )}
          </div>
        </div>

        <div className="rs-final-actions">
          <button
            type="button"
            onClick={onResetAll}
            className="winxp-button text-xs py-2 px-4 font-bold text-gray-700"
          >
            Limpiar Todo
          </button>

          <button
            type="button"
            onClick={onFinalizeSale}
            style={
              paymentStatus === 'pendiente'
                ? { backgroundColor: '#fef3c7', color: '#000000', borderColor: '#92400e' }
                : { backgroundColor: '#e6f4ea', color: '#000000', borderColor: '#064e3b' }
            }
            className={`winxp-button text-xs py-2 px-6 font-extrabold flex items-center gap-2 shadow-md transition-colors cursor-pointer ${
              paymentStatus === 'pendiente'
                ? 'bg-[#fef3c7] hover:bg-[#fde68a] active:bg-[#fcd34d] !text-black border-2 border-[#92400e]'
                : 'bg-[#e6f4ea] hover:bg-[#ceead6] active:bg-[#a7f3d0] !text-black border-2 border-[#064e3b]'
            }`}
          >
            {paymentStatus === 'pendiente' ? (
              <>
                <Clock
                  className="w-4 h-4 !text-[#92400e] shrink-0"
                  style={{ color: '#92400e', stroke: '#92400e' }}
                />
                <span style={{ color: '#000000' }} className="!text-black font-black">
                  Registrar Venta con Pago Pendiente
                </span>
              </>
            ) : (
              <>
                <CheckCircle2
                  className="w-4 h-4 !text-[#064e3b] shrink-0"
                  style={{ color: '#064e3b', stroke: '#064e3b' }}
                />
                <span style={{ color: '#000000' }} className="!text-black font-black">
                  Registrar Venta con Pago Confirmado
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

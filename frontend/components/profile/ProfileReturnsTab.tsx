import React from 'react';
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Check,
  Truck,
  Store,
  X,
  Camera
} from 'lucide-react';
import { ReturnRequest } from './profileTypes';

export interface ProfileReturnsTabProps {
  returnRequests: ReturnRequest[];
  filteredReturnRequests: ReturnRequest[];
  returnsFilter: 'all' | 'in_progress' | 'approved' | 'rejected';
  setReturnsFilter: (val: 'all' | 'in_progress' | 'approved' | 'rejected') => void;
  returnSuccessMessage: string | null;
  setIsPickupScheduleModalOpen: (val: boolean) => void;
  getReturnSteps: (ret: ReturnRequest) => { key: string; label: string }[];
  getReturnStepStatus: (ret: ReturnRequest, stepIndex: number) => 'completed' | 'current' | 'rejected' | 'cancelled' | 'pending';
}

export const ProfileReturnsTab: React.FC<ProfileReturnsTabProps> = ({
  returnRequests,
  filteredReturnRequests,
  returnsFilter,
  setReturnsFilter,
  returnSuccessMessage,
  setIsPickupScheduleModalOpen,
  getReturnSteps,
  getReturnStepStatus
}) => {
  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-300 gap-2">
        <div>
          <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-blue-700" />
            Módulo Oficial de Devoluciones y Cambios de Talla
          </h4>
          <p className="text-[11px] text-gray-500">
            Trazabilidad garantizada de estados y atención física presencial en sucursales.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPickupScheduleModalOpen(true)}
          className="winxp-button winxp-button-primary text-xs py-1 px-3 font-bold flex items-center gap-1.5 cursor-pointer text-blue-900 bg-blue-50 hover:bg-blue-100 border-blue-600 shadow-xs transition-colors self-start sm:self-auto"
          title="Ver horarios de retiro de las sucursales disponibles"
        >
          <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <span>Ver Horarios de Retiro</span>
        </button>
      </div>

      {/* Notificación de Solicitud */}
      {returnSuccessMessage && (
        <div className="p-2.5 bg-green-100 border border-green-500 text-green-900 text-xs flex items-center gap-2 rounded-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
          <span className="font-bold">{returnSuccessMessage}</span>
        </div>
      )}

      {/* Banner de Política Oficial de Devoluciones (Sin mencionar leyes) */}
      <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-300 text-xs flex items-start gap-2.5 winxp-bevel-in">
        <div className="p-1 bg-purple-100 border border-purple-400 text-purple-900 rounded-xs shrink-0 mt-0.5">
          <RotateCcw className="w-4 h-4" />
        </div>
        <div className="space-y-1 text-gray-800">
          <div className="font-bold text-purple-950 text-[11px]">
            Política Oficial de Evaluación de Devoluciones y Envíos Nolimits
          </div>
          <div className="text-[11px] text-gray-700 leading-relaxed">
            En Nolimits evaluamos solicitudes exclusivamente por <strong>productos con defectos de fabricación o fallas que no fueron informadas antes de la compra</strong>. No realizamos cambios voluntarios por gusto personal, elección de talla, medida, color/modelo o cambio de opinión. En devoluciones por envío, <strong>Nolimits paga la devolución por Paket ($0 CLP)</strong>; no se realizan devoluciones pagadas por Starken ni Blue Express.
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: Solicitudes de Devolución Activas */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-300 pb-2 gap-2">
          <div>
            <h5 className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-700" />
              <span>Mis Solicitudes de Devolución ({returnRequests.length}):</span>
            </h5>
            <span className="text-[10px] text-gray-500 font-mono">
              Estados: Solicitud recibida → Revisión de equipo → Aprobado / Rechazado → Envió a punto (Envío) / Retiro Presencial (Sucursal)
            </span>
          </div>

          {/* Botones de filtro rápido */}
          <div className="nl-profile-filter-bar flex items-center gap-1 flex-wrap">
            <button
              type="button"
              onClick={() => setReturnsFilter('all')}
              className={`winxp-button text-[10px] py-0.5 px-2 font-bold cursor-pointer flex items-center gap-1 ${
                returnsFilter === 'all'
                  ? 'winxp-button-primary bg-blue-100 text-blue-900 shadow-inner'
                  : 'text-gray-700'
              }`}
            >
              <RotateCcw className="w-3 h-3 text-blue-700 shrink-0" />
              <span>Todas ({returnRequests.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setReturnsFilter('in_progress')}
              className={`winxp-button text-[10px] py-0.5 px-2 font-bold cursor-pointer flex items-center gap-1 ${
                returnsFilter === 'in_progress'
                  ? 'winxp-button-primary bg-blue-100 text-blue-900 shadow-inner'
                  : 'text-gray-700'
              }`}
            >
              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
              <span>En Revisión ({returnRequests.filter(r => r.currentStatus === 'Solicitud recibida' || r.currentStatus === 'Revisión de equipo').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setReturnsFilter('approved')}
              className={`winxp-button text-[10px] py-0.5 px-2 font-bold cursor-pointer flex items-center gap-1 ${
                returnsFilter === 'approved'
                  ? 'winxp-button-primary bg-green-100 text-green-900 shadow-inner'
                  : 'text-gray-700'
              }`}
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
              <span>Aprobadas ({returnRequests.filter(r => r.currentStatus === 'Aprobada' || r.currentStatus === 'Envió a punto' || r.currentStatus === 'Retiro Presencial' || r.currentStatus === 'Envió a punto/sucursal').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setReturnsFilter('rejected')}
              className={`winxp-button text-[10px] py-0.5 px-2 font-bold cursor-pointer flex items-center gap-1 ${
                returnsFilter === 'rejected'
                  ? 'winxp-button-primary bg-red-100 text-red-900 shadow-inner'
                  : 'text-gray-700'
              }`}
            >
              <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
              <span>Rechazadas ({returnRequests.filter(r => r.currentStatus === 'Rechazada').length})</span>
            </button>
          </div>
        </div>

        {filteredReturnRequests.length === 0 ? (
          <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-300">
            No hay solicitudes registradas bajo el filtro seleccionado.
          </div>
        ) : (
          filteredReturnRequests.map((ret) => (
            <div
              key={ret.id}
              className={`p-3.5 space-y-3 winxp-bevel-out shadow-xs border ${
                ret.currentStatus === 'Rechazada'
                  ? 'bg-[#fffbfa] border-red-300'
                  : 'bg-[#fafbfc] border-gray-400'
              }`}
            >
              {/* Cabecera del Caso */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-300 pb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-purple-950 font-mono">
                      Ticket #{ret.ticketNumber}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 border bg-purple-100 text-purple-900 border-purple-400">
                      {ret.reason}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      (Orden #{ret.orderNumber})
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Ingresado: {ret.requestDate} · Sucursal asignada: <strong className="text-gray-700">{ret.targetBranchName}</strong>
                  </div>
                </div>

                {/* Badge de Estado Actual Oficial de Devolución */}
                <div className="shrink-0">
                  {(() => {
                    let bg = 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)';
                    let border = '#075985';
                    let icon = Clock;

                    if (ret.currentStatus === 'Revisión de equipo') {
                      bg = 'linear-gradient(180deg, #4f46e5 0%, #4338ca 100%)';
                      border = '#312e81';
                      icon = Sparkles;
                    } else if (ret.currentStatus === 'Aprobada') {
                      bg = 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)';
                      border = '#14532d';
                      icon = Check;
                    } else if (ret.currentStatus === 'Envió a punto') {
                      bg = 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)';
                      border = '#075985';
                      icon = Truck;
                    } else if (ret.currentStatus === 'Retiro Presencial' || ret.currentStatus === 'Envió a punto/sucursal') {
                      bg = 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)';
                      border = '#92400e';
                      icon = Store;
                    } else if (ret.currentStatus === 'Rechazada') {
                      bg = 'linear-gradient(180deg, #dc2626 0%, #b91c1c 100%)';
                      border = '#7f1d1d';
                      icon = X;
                    }

                    const IconComp = icon;

                    return (
                      <span
                        style={{
                          background: bg,
                          borderColor: border,
                          color: '#ffffff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.35)'
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 border rounded-xs select-none"
                      >
                        <IconComp className="w-3.5 h-3.5 shrink-0" style={{ color: '#ffffff' }} />
                        <span style={{ color: '#ffffff', fontWeight: 'bold' }}>
                          {ret.currentStatus === 'Rechazada' ? 'Devolución Rechazada' : ret.currentStatus}
                        </span>
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Prenda Involucrada */}
              <div className="flex items-center gap-3 p-2 bg-white border border-gray-300">
                <img
                  src={ret.productImage}
                  alt={ret.productTitle}
                  className="w-12 h-12 object-cover border border-gray-400 shrink-0"
                />
                <div className="text-xs">
                  <h5 className="font-bold text-gray-900">{ret.productTitle}</h5>
                  <div className="text-[11px] text-gray-500">
                    Talla original: <strong className="text-gray-700">{ret.productSize}</strong>
                    {ret.requestedSize && (
                      <> · Talla solicitada para cambio: <strong className="text-blue-700">{ret.requestedSize}</strong></>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-600 italic mt-0.5">
                    "{ret.notes}"
                  </div>
                </div>
              </div>

              {/* LÍNEA DE ESTADOS OBLIGATORIOS PARA DEVOLUCIONES */}
              <div className="bg-white border border-gray-300 p-2.5 space-y-2">
                <div className="text-[10px] font-bold text-gray-700 uppercase tracking-wider flex flex-wrap items-center justify-between gap-1">
                  <span>Línea Oficial de Estado de Devolución:</span>
                  <span className="text-purple-900 font-mono text-[10px]">
                    Resolución Máxima: 24 a 48 hrs hábiles
                  </span>
                </div>

                <div className="nl-profile-steps-grid nl-profile-steps-grid--4 grid grid-cols-1 sm:grid-cols-4 gap-1.5 pt-1">
                  {getReturnSteps(ret).map((step, idx) => {
                    const stepStatus = getReturnStepStatus(ret, idx);

                    if (stepStatus === 'rejected') {
                      return (
                        <div
                          key={idx}
                          style={{
                            background: 'linear-gradient(180deg, #dc2626 0%, #b91c1c 45%, #991b1b 50%, #7f1d1d 100%)',
                            borderColor: '#450a0a',
                            color: '#ffffff',
                            boxShadow: '0 2px 5px rgba(120, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.45)'
                          }}
                          className="p-2 border rounded-xs text-center transition-all flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <X className="w-3.5 h-3.5 text-white stroke-[3]" />
                            <span className="font-mono text-[11px] font-black" style={{ color: '#ffffff' }}>
                              {idx + 1}.
                            </span>
                          </div>
                          <div
                            className="text-[11px] leading-snug font-bold tracking-tight my-0.5"
                            style={{ color: '#ffffff' }}
                          >
                            Rechazada por Admin
                          </div>
                          <div className="pt-1">
                            <span
                              className="inline-block px-1.5 py-0.5 text-[9px] uppercase font-black tracking-wider rounded-xs shadow-xs"
                              style={{
                                backgroundColor: '#ffffff',
                                color: '#b91c1c',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                              }}
                            >
                              ✕ Rechazada ✕
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (stepStatus === 'cancelled') {
                      return (
                        <div
                          key={idx}
                          style={{
                            backgroundColor: '#f1f5f9',
                            borderColor: '#cbd5e1',
                            color: '#94a3b8'
                          }}
                          className="p-2 border rounded-xs text-center transition-all flex flex-col justify-between opacity-75"
                        >
                          <div className="flex items-center justify-center gap-1 mb-1 text-[11px] font-mono text-gray-400">
                            <span>{idx + 1}.</span>
                          </div>
                          <div className="text-[10px] leading-snug text-gray-400 font-medium line-through">
                            {step.label}
                          </div>
                          <div className="text-[9px] text-gray-400 font-mono mt-1 italic">
                            No Aplica (Rechazada)
                          </div>
                        </div>
                      );
                    }

                    if (stepStatus === 'current') {
                      const stepText = idx === 2 && ret.currentStatus === 'Aprobada'
                        ? '3. Aprobada por Admin'
                        : step.label;

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
                            {stepText}
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

                    if (stepStatus === 'completed') {
                      const completedLabel = idx === 2 ? '3. Aprobada' : step.label;
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
                            {completedLabel}
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
              </div>

              {/* EXPLICACIÓN OFICIAL DEL RECHAZO */}
              {ret.currentStatus === 'Rechazada' && (
                <div className="p-3 bg-red-50 border-2 border-red-500 text-xs space-y-2 winxp-bevel-out">
                  <div className="flex items-center justify-between border-b border-red-200 pb-1.5">
                    <div className="font-bold text-red-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="font-bold">
                        Explicación Oficial del Rechazo por el Administrador:
                      </span>
                    </div>
                    {ret.rejectionDate && (
                      <span className="text-[10px] font-mono text-red-700 bg-red-100 px-1.5 py-0.5 border border-red-300">
                        {ret.rejectionDate}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 bg-white border border-red-300 text-gray-800 leading-relaxed space-y-1.5 shadow-inner">
                    <div className="text-[11px] font-bold text-red-950 flex items-center gap-1">
                      <span>Dictamen de Inspección de Calidad:</span>
                    </div>
                    <p className="text-xs text-gray-700 italic">
                      "{ret.rejectionReason || 'La prenda no cumple con los requisitos de aprobación de Nolimits (debe conservar etiquetas originales, sin indicios de uso ni lavado, y corresponder a un defecto de fabricación o falla no informada antes de la compra).'}"
                    </p>
                    {ret.adminInspector && (
                      <div className="pt-1.5 border-t border-gray-200 text-[10px] text-gray-500 flex items-center justify-between font-mono">
                        <span>Responsable: {ret.adminInspector}</span>
                        <span className="text-red-700 font-bold uppercase tracking-wider">
                          Ticket No Aprobado
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5 text-[11px] text-red-900">
                    <span>
                      Si necesitas mayor información o apelar esta resolución, contáctanos indicando el Ticket <strong>#{ret.ticketNumber}</strong>.
                    </span>
                    <span className="font-bold text-red-700 text-[10px] uppercase font-mono">
                      Estado Final: Rechazado
                    </span>
                  </div>
                </div>
              )}

              {/* Mensaje Informativo para Aprobada por Admin */}
              {ret.currentStatus === 'Aprobada' && (
                <div className="p-2.5 bg-green-50 border border-green-500 text-xs flex items-center justify-between gap-2 text-green-950 winxp-bevel-in shadow-2xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
                    <span className="font-medium">
                      Tu solicitud ha sido <strong>Aprobada por Administración</strong>. Pronto avanzará al estado{' '}
                      <strong className="text-blue-900">
                        {ret.returnMethod === 'courier_shipping' ? '"Envió a punto"' : '"Retiro Presencial"'}
                      </strong>{' '}
                      para coordinar la entrega de tu prenda.
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 border bg-green-200 text-green-900 border-green-400 shrink-0 shadow-xs">
                    Aprobada por Admin
                  </span>
                </div>
              )}

              {/* Indicación de Retiro Presencial en Sucursal */}
              {(ret.currentStatus === 'Retiro Presencial' ||
                (ret.currentStatus === 'Envió a punto/sucursal' && ret.returnMethod !== 'courier_shipping')) && (
                <div className="p-2.5 text-xs flex items-center justify-between gap-2 border bg-amber-50 border-amber-300 text-amber-950 winxp-bevel-in shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-700 shrink-0" />
                    <span className="font-medium">
                      Ya puedes acudir a <strong>{ret.targetBranchName}</strong> para entregar tu prenda y retirar tu cambio presencial.
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 border bg-amber-200 text-amber-900 border-amber-400 shrink-0 shadow-xs">
                    Atención Habilitada
                  </span>
                </div>
              )}

              {/* Indicación de Envío a Punto / Courier */}
              {(ret.currentStatus === 'Envió a punto' ||
                (ret.currentStatus === 'Envió a punto/sucursal' && ret.returnMethod === 'courier_shipping')) && (
                <div className="p-2.5 text-xs flex items-center justify-between gap-2 border bg-blue-50 border-blue-300 text-blue-950 winxp-bevel-in shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-700 shrink-0" />
                    <span className="font-medium">
                      Ya puedes despachar tu prenda mediante <strong>{ret.targetBranchName}</strong> para tu cambio o nota de crédito.
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 border bg-blue-200 text-blue-900 border-blue-400 shrink-0 shadow-xs">
                    Envío Habilitado
                  </span>
                </div>
              )}

              {/* Fotos Adjuntas de Respaldo */}
              {ret.photos && ret.photos.length > 0 && (
                <div className="p-2 bg-gray-50 border border-gray-200 rounded-xs space-y-1">
                  <div className="text-[10px] font-bold text-gray-700 flex items-center gap-1">
                    <Camera className="w-3 h-3 text-blue-700" />
                    <span>Fotos de respaldo adjuntadas ({ret.photos.length}/6):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {ret.photos.map((ph, pIdx) => (
                      <img
                        key={pIdx}
                        src={ph}
                        alt={`Foto respaldo ${pIdx + 1}`}
                        className="w-12 h-12 object-cover border border-gray-300 rounded-xs shadow-xs"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Acceso rápido a Horarios de Retiro de Sucursales */}
      <div className="p-3 bg-[#f8fafc] border border-gray-300 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 winxp-bevel-out">
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <Store className="w-4 h-4 text-blue-700 shrink-0" />
          <span>
            ¿Necesitas consultar los horarios de atención y retiro presencial en <strong>Viña del Mar, Valparaíso o Quilpué</strong>?
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsPickupScheduleModalOpen(true)}
          className="winxp-button winxp-button-primary text-xs py-1 px-3 font-bold flex items-center gap-1.5 cursor-pointer text-blue-900 bg-blue-50 hover:bg-blue-100 border-blue-600 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
          <span>Ver Horarios de Retiro</span>
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Clock, Store, MapPin, Phone } from 'lucide-react';
import { getBranchScheduleBlocks } from '../../context/BranchContext';
import { BranchScheduleInfo } from '../profile/profileTypes';

export interface CartPickupScheduleModalProps {
  isPickupScheduleModalOpen: boolean;
  setIsPickupScheduleModalOpen: (val: boolean) => void;
  liveBranchSchedules: BranchScheduleInfo[];
}

export const CartPickupScheduleModal: React.FC<CartPickupScheduleModalProps> = ({
  isPickupScheduleModalOpen,
  setIsPickupScheduleModalOpen,
  liveBranchSchedules
}) => {
  if (!isPickupScheduleModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 animate-in fade-in"
      onClick={() => setIsPickupScheduleModalOpen(false)}
    >
      <div
        className="nl-cart-modal-window w-full max-w-3xl bg-[#ece9d8] border-2 border-blue-900 shadow-2xl winxp-bevel-out max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de Título Windows XP */}
        <div
          style={{
            background: 'linear-gradient(180deg, #0058ee 0%, #288eff 25%, #0055ea 75%, #003db3 100%)'
          }}
          className="winxp-titlebar flex items-center justify-between px-2.5 py-1.5 select-none text-white shrink-0"
        >
          <div className="winxp-titlebar-title flex items-center gap-1.5 text-xs text-white font-bold">
            <Clock className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
            <span>Horarios_Retiro_Sucursales.exe - [Sucursales Disponibles]</span>
          </div>
          <button
            type="button"
            onClick={() => setIsPickupScheduleModalOpen(false)}
            className="winxp-btn-ctrl winxp-btn-close w-4 h-4 text-[10px] font-bold text-white flex items-center justify-center cursor-pointer"
            title="Cerrar ventana"
          >
            ×
          </button>
        </div>

        {/* Contenido de la Ventanita */}
        <div className="p-4 space-y-3.5 bg-white text-xs text-gray-800 overflow-y-auto">
          {/* Banner Informativo */}
          <div className="p-3 bg-blue-50 border border-blue-300 rounded-xs flex items-start gap-2.5 winxp-bevel-in">
            <div className="p-1.5 bg-blue-100 border border-blue-400 text-blue-800 rounded-xs shrink-0 mt-0.5">
              <Store className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="font-bold text-blue-950 text-xs">
                Horarios Oficiales de Retiro en Sucursales Físicas NoLimits
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Presenta tu cédula de identidad y el número de orden o ticket de devolución en cualquiera de nuestras sucursales habilitadas en la V Región.
              </p>
            </div>
          </div>

          {/* Grilla con las Sucursales Disponibles Sincronizadas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {liveBranchSchedules.map((branch) => (
              <div
                key={branch.id}
                className="p-3 bg-[#fafbfc] border-2 border-gray-300 rounded-xs space-y-2.5 winxp-bevel-out flex flex-col justify-between"
              >
                <div className="space-y-2">
                  {/* Insignia y Ciudad */}
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-900 px-2 py-0.5 border border-blue-400">
                      {branch.badge}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-gray-600">
                      {branch.city}
                    </span>
                  </div>

                  <h6 className="font-bold text-xs text-gray-900 leading-snug">
                    {branch.name}
                  </h6>

                  <div className="text-[11px] text-gray-600 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                    <span>{branch.address}</span>
                  </div>

                  {/* Tabla de Horarios de Retiro */}
                  <div className="p-2 bg-white border border-gray-300 text-[11px] space-y-1 winxp-bevel-in">
                    <div className="font-bold text-blue-950 flex items-center gap-1 border-b border-gray-200 pb-1">
                      <Clock className="w-3 h-3 text-blue-700 shrink-0" />
                      <span>Horario de Retiro:</span>
                    </div>
                    {(branch.scheduleBlocks && branch.scheduleBlocks.length > 0
                      ? branch.scheduleBlocks
                      : getBranchScheduleBlocks(branch)
                    ).map((blk) => {
                      const isClosedRow = blk.isClosed || /cerrado/i.test(blk.hoursText);
                      return (
                        <div
                          key={blk.id}
                          className={`flex justify-between gap-1 ${
                            isClosedRow ? 'text-gray-500' : 'text-gray-700'
                          }`}
                        >
                          <span>{blk.dayLabel.replace(/:$/, '')}:</span>
                          {isClosedRow ? (
                            <span className="italic text-right">{blk.hoursText || 'Cerrado'}</span>
                          ) : (
                            <strong className="text-gray-900 text-right">{blk.hoursText}</strong>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Contacto */}
                  <div className="text-[11px] text-gray-600 space-y-0.5 pt-0.5">
                    <div className="flex items-center gap-1.5 text-blue-900 font-semibold">
                      <Phone className="w-3 h-3 text-blue-700 shrink-0" />
                      <span>WhatsApp: {branch.whatsapp}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Encargado: {branch.leadContact}
                    </div>
                  </div>
                </div>

                {/* Protocolo de retiro */}
                <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-600 bg-gray-50 p-1.5 border border-gray-200">
                  <strong className="text-gray-800">Importante:</strong> {branch.returnInstructions}
                </div>
              </div>
            ))}
          </div>

          {/* Pie de la Ventanita */}
          <div className="pt-2 flex items-center justify-end border-t border-gray-300">
            <button
              type="button"
              onClick={() => setIsPickupScheduleModalOpen(false)}
              className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-900 cursor-pointer shadow-sm"
            >
              Cerrar Ventana
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

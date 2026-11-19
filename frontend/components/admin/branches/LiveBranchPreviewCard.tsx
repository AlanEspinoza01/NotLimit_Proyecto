import React from 'react';
import { MapPin, Clock, Phone } from 'lucide-react';
import { BranchScheduleBlock } from '../../../types';

export interface LiveBranchPreviewCardProps {
  badge: string;
  city: string;
  name: string;
  address: string;
  phone: string;
  managerName: string;
  returnInstructions: string;
  scheduleBlocks: BranchScheduleBlock[];
  activeBlockId?: string | null;
  onSelectBlock?: (blockId: string) => void;
  editableInline?: boolean;
  onChangeBadge?: (val: string) => void;
  onChangeReturnInstructions?: (val: string) => void;
  onChangeBlock?: (blockId: string, patch: Partial<BranchScheduleBlock>) => void;
}

export const LiveBranchPreviewCard: React.FC<LiveBranchPreviewCardProps> = ({
  badge,
  city,
  name,
  address,
  phone,
  managerName,
  returnInstructions,
  scheduleBlocks,
  activeBlockId,
  onSelectBlock,
  editableInline = false,
  onChangeBadge,
  onChangeReturnInstructions,
  onChangeBlock
}) => {
  return (
    <div className="p-3.5 bg-[#fafbfc] border-2 border-gray-300 rounded-xs space-y-2.5 winxp-bevel-out flex flex-col justify-between text-xs text-gray-800 shadow-sm">
      <div className="space-y-2">
        {/* Insignia Superior y Ciudad */}
        <div className="flex items-start justify-between gap-2">
          {editableInline && onChangeBadge ? (
            <input
              type="text"
              value={badge}
              onChange={(e) => onChangeBadge(e.target.value)}
              placeholder="ETIQUETA DE SUCURSAL"
              title="Haz clic para editar la insignia superior directamente en la vista previa"
              className="text-[10px] font-bold uppercase bg-blue-100 text-blue-900 px-2 py-0.5 border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-[210px]"
            />
          ) : (
            <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-900 px-2 py-0.5 border border-blue-400 leading-tight">
              {badge || 'PUNTO OFICIAL DE RETIRO'}
            </span>
          )}
          <span className="text-[11px] font-mono font-bold text-gray-700 shrink-0 text-right">
            {city || 'Ciudad'}
          </span>
        </div>

        {/* Nombre de la Sucursal */}
        <h6 className="font-bold text-sm text-gray-900 leading-snug">
          {name || 'Sucursal NoLimits'}
        </h6>

        {/* Dirección con Pin */}
        <div className="text-[11px] text-gray-600 flex items-start gap-1">
          <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
          <span>{address || 'Dirección de la sucursal'}</span>
        </div>

        {/* Cuadro Interno: Horario de Retiro */}
        <div className="p-2.5 bg-white border border-gray-300 text-[11px] space-y-1.5 winxp-bevel-in">
          <div className="font-bold text-blue-950 flex items-center justify-between gap-1 border-b border-gray-200 pb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
              <span>Horario de Retiro:</span>
            </span>
            {editableInline && (
              <span className="text-[9px] font-normal text-blue-700 bg-blue-50 px-1.5 py-0.2 border border-blue-200 rounded-xs">
                Editable en vivo
              </span>
            )}
          </div>

          <div className="space-y-1">
            {scheduleBlocks.map((blk) => {
              const isClosedRow = blk.isClosed || /cerrado/i.test(blk.hoursText);
              const isSelected = activeBlockId === blk.id;
              return (
                <div
                  key={blk.id}
                  onClick={() => onSelectBlock && onSelectBlock(blk.id)}
                  className={`flex items-baseline justify-between gap-2 px-1 py-0.5 rounded-xs transition-colors ${
                    onSelectBlock ? 'cursor-pointer hover:bg-blue-50/80' : ''
                  } ${isSelected ? 'bg-blue-50 ring-1 ring-blue-400' : ''} ${
                    isClosedRow ? 'text-gray-500' : 'text-gray-700'
                  }`}
                  title={
                    editableInline
                      ? 'Puedes editar el texto directamente aquí o usar los selectores de días y horas a la izquierda'
                      : undefined
                  }
                >
                  {editableInline && onChangeBlock ? (
                    <>
                      <div className="flex items-center gap-0.5 min-w-[85px] max-w-[46%]">
                        <input
                          type="text"
                          value={blk.dayLabel}
                          onChange={(e) =>
                            onChangeBlock(blk.id, { dayLabel: e.target.value })
                          }
                          className="w-full bg-transparent border-b border-dashed border-gray-300 focus:border-blue-600 focus:bg-white focus:outline-none text-[11px] text-gray-700 px-0.5"
                        />
                        <span>:</span>
                      </div>
                      <input
                        type="text"
                        value={blk.hoursText}
                        onChange={(e) => {
                          const val = e.target.value;
                          onChangeBlock(blk.id, {
                            hoursText: val,
                            isClosed: /^cerrado$/i.test(val.trim())
                          });
                        }}
                        className={`flex-1 bg-transparent border-b border-dashed border-gray-300 focus:border-blue-600 focus:bg-white focus:outline-none text-right text-[11px] px-0.5 ${
                          isClosedRow
                            ? 'italic text-gray-500 font-normal'
                            : 'font-bold text-gray-900'
                        }`}
                      />
                    </>
                  ) : (
                    <>
                      <span>{blk.dayLabel.replace(/:$/, '')}:</span>
                      {isClosedRow ? (
                        <span className="italic text-right">{blk.hoursText || 'Cerrado'}</span>
                      ) : (
                        <strong className="text-gray-900 text-right">{blk.hoursText}</strong>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contacto WhatsApp & Encargado */}
        <div className="text-[11px] text-gray-600 space-y-0.5 pt-0.5">
          <div className="flex items-center gap-1.5 text-blue-900 font-bold">
            <Phone className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>WhatsApp: {phone || '+56 9 8452 1190'}</span>
          </div>
          <div className="text-[11px] text-gray-500">
            Encargado: {managerName || 'Jefe de Sucursal'}
          </div>
        </div>
      </div>

      {/* Cuadro Inferior: Importante */}
      <div className="pt-2 border-t border-gray-200 text-[11px] text-gray-600 bg-gray-50 p-2 border border-gray-200">
        <strong className="text-gray-900">Importante:</strong>{' '}
        {editableInline && onChangeReturnInstructions ? (
          <textarea
            rows={2}
            value={returnInstructions}
            onChange={(e) => onChangeReturnInstructions(e.target.value)}
            className="w-full mt-1 bg-white border border-dashed border-gray-300 focus:border-blue-600 focus:outline-none p-1 text-[11px] text-gray-700 leading-snug resize-none"
            placeholder="Instrucciones de retiro o devolución en mesón..."
          />
        ) : (
          <span>
            {returnInstructions ||
              'Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central.'}
          </span>
        )}
      </div>
    </div>
  );
};

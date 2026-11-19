import React from 'react';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Calendar
} from 'lucide-react';
import {
  SCHEDULE_DAY_OPTIONS,
  formatDaysToSmartLabel,
  buildHoursTextFromBlock
} from '../../../context/BranchContext';
import { BranchScheduleBlock } from '../../../types';
import { SCHEDULE_PRESETS } from './branchManagementTypes';

export interface FlexibleScheduleBuilderProps {
  blocks: BranchScheduleBlock[];
  onChange: (nextBlocks: BranchScheduleBlock[]) => void;
  activeBlockId?: string | null;
  onSelectBlock?: (id: string | null) => void;
}

export const FlexibleScheduleBuilder: React.FC<FlexibleScheduleBuilderProps> = ({
  blocks,
  onChange,
  activeBlockId,
  onSelectBlock
}) => {
  const updateSingleBlock = (id: string, patch: Partial<BranchScheduleBlock>) => {
    const next = blocks.map((blk) => {
      if (blk.id !== id) return blk;
      const merged: BranchScheduleBlock = { ...blk, ...patch };

      // Si cambiaron openTime, closeTime, note o isClosed (y no se editó hoursText manualmente en este mismo patch)
      if (
        ('openTime' in patch || 'closeTime' in patch || 'note' in patch || 'isClosed' in patch) &&
        !('hoursText' in patch)
      ) {
        merged.hoursText = buildHoursTextFromBlock(merged);
      }
      return merged;
    });
    onChange(next);
  };

  const handleToggleDayChip = (block: BranchScheduleBlock, dayKey: string) => {
    const currentDays = block.days || [];
    const exists = currentDays.includes(dayKey);
    const nextDays = exists
      ? currentDays.filter((d) => d !== dayKey)
      : [...currentDays, dayKey];

    const autoLabel =
      nextDays.length > 0 ? formatDaysToSmartLabel(nextDays) : block.dayLabel;

    updateSingleBlock(block.id, {
      days: nextDays,
      dayLabel: autoLabel
    });
  };

  const handleAddBlock = () => {
    const newBlk: BranchScheduleBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      days: ['Vie'],
      dayLabel: 'Viernes',
      isClosed: false,
      openTime: '11:00',
      closeTime: '20:00',
      note: '',
      hoursText: '11:00 a 20:00 hrs'
    };
    onChange([...blocks, newBlk]);
    if (onSelectBlock) onSelectBlock(newBlk.id);
  };

  const handleRemoveBlock = (id: string) => {
    if (blocks.length <= 1) return;
    onChange(blocks.filter((b) => b.id !== id));
  };

  const handleMoveBlock = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      {/* Barra de Plantillas Rápidas Recomendadas */}
      <div className="bg-[#eef4fb] border border-[#9cb6d6] p-2.5 rounded-xs space-y-1.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] font-black text-[#003c74] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0055ea] shrink-0" />
            <span>PLANTILLAS FLEXIBLES RÁPIDAS (1 CLIC):</span>
          </span>
          <span className="text-[10px] text-blue-800 font-medium">
            O personaliza cada tramo de días abajo
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SCHEDULE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.createBlocks())}
              title={preset.description}
              className="winxp-button text-[11px] py-1 px-2.5 bg-white hover:bg-blue-50 text-blue-950 font-semibold border border-blue-300 flex items-center gap-1 cursor-pointer"
            >
              <Calendar className="w-3 h-3 text-blue-700 shrink-0" />
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lista Dinámica de Tramos de Días y Horas */}
      <div className="space-y-2.5">
        {blocks.map((block, idx) => {
          const isSelected = activeBlockId === block.id;
          return (
            <div
              key={block.id}
              onClick={() => onSelectBlock && onSelectBlock(block.id)}
              className={`p-3 bg-white border-2 transition-all rounded-xs space-y-2.5 ${
                isSelected
                  ? 'border-[#0055ea] bg-blue-50/20 shadow-xs'
                  : 'border-[#b5c7de] hover:border-[#7f9db9]'
              }`}
            >
              {/* Encabezado del Tramo */}
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-200 pb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    data-force-white="true"
                    style={{ backgroundColor: '#003c74', color: '#ffffff' }}
                    className="bg-[#003c74] !text-white text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-xs"
                  >
                    TRAMO #{idx + 1}
                  </span>
                  <span className="font-bold text-xs text-[#003c74]">
                    {block.dayLabel}:{' '}
                    <span className={block.isClosed ? 'italic text-gray-500 font-normal' : 'text-emerald-800'}>
                      {block.hoursText}
                    </span>
                  </span>
                </div>

                {/* Botones de Ordenar y Eliminar Tramo */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveBlock(idx, -1);
                    }}
                    title="Subir tramo"
                    className={`winxp-button p-1 text-xs ${
                      idx === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-50'
                    }`}
                  >
                    <ArrowUp className="w-3 h-3 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === blocks.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveBlock(idx, 1);
                    }}
                    title="Bajar tramo"
                    className={`winxp-button p-1 text-xs ${
                      idx === blocks.length - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-blue-50'
                    }`}
                  >
                    <ArrowDown className="w-3 h-3 text-gray-700" />
                  </button>
                  {blocks.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBlock(block.id);
                      }}
                      title="Eliminar este tramo horario"
                      className="winxp-button px-1.5 py-1 text-[10px] text-red-700 border-red-300 hover:bg-red-50 flex items-center gap-0.5"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                      <span>Quitar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 1. Selector de Días por Chips + Nombre del Tramo */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center">
                <div className="lg:col-span-7 space-y-1">
                  <label className="block text-[10px] font-bold text-gray-700 uppercase">
                    1. Selecciona los Días (arma el rango automáticamente):
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {SCHEDULE_DAY_OPTIONS.map((dayOpt) => {
                      const active = (block.days || []).includes(dayOpt.key);
                      return (
                        <button
                          key={dayOpt.key}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDayChip(block, dayOpt.key);
                          }}
                          data-force-white={active ? 'true' : undefined}
                          style={
                            active
                              ? {
                                  backgroundColor: '#0055ea',
                                  color: '#ffffff',
                                  borderColor: '#003c74'
                                }
                              : undefined
                          }
                          className={`px-2 py-0.5 text-[11px] font-bold border rounded-xs cursor-pointer transition-all ${
                            active
                              ? 'shadow-2xs !text-white'
                              : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-50'
                          }`}
                          title={`Incluir/quitar ${dayOpt.full}`}
                        >
                          {dayOpt.key}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-1">
                  <label className="block text-[10px] font-bold text-gray-700 uppercase">
                    Etiqueta de Días en Tarjeta:
                  </label>
                  <input
                    type="text"
                    value={block.dayLabel}
                    onChange={(e) =>
                      updateSingleBlock(block.id, { dayLabel: e.target.value })
                    }
                    placeholder="Ej: Lun - Jue, Viernes, Sábados..."
                    className="winxp-input w-full text-xs py-1 bg-white font-bold text-gray-900"
                  />
                </div>
              </div>

              {/* 2. Estado Abierto/Cerrado + Selector de Hora Apertura / Cierre + Nota */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end pt-1 border-t border-gray-100">
                {/* Toggle Abierto / Cerrado */}
                <div className="sm:col-span-3 space-y-1">
                  <label className="block text-[10px] font-bold text-gray-700 uppercase">
                    2. Estado del Día:
                  </label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => updateSingleBlock(block.id, { isClosed: false })}
                      data-force-white={!block.isClosed ? 'true' : undefined}
                      style={
                        !block.isClosed
                          ? { backgroundColor: '#15803d', color: '#ffffff', borderColor: '#14532d' }
                          : undefined
                      }
                      className={`py-1 px-1.5 text-[11px] font-bold border rounded-xs cursor-pointer ${
                        !block.isClosed
                          ? 'shadow-2xs !text-white'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      Abierto
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateSingleBlock(block.id, { isClosed: true, hoursText: 'Cerrado' })
                      }
                      data-force-white={block.isClosed ? 'true' : undefined}
                      style={
                        block.isClosed
                          ? { backgroundColor: '#4b5563', color: '#ffffff', borderColor: '#1f2937' }
                          : undefined
                      }
                      className={`py-1 px-1.5 text-[11px] font-bold border rounded-xs cursor-pointer ${
                        block.isClosed
                          ? 'shadow-2xs !text-white'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      Cerrado
                    </button>
                  </div>
                </div>

                {!block.isClosed ? (
                  <>
                    {/* Hora Apertura */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[10px] font-bold text-gray-700 uppercase">
                        Apertura:
                      </label>
                      <input
                        type="time"
                        value={block.openTime || '10:30'}
                        onChange={(e) =>
                          updateSingleBlock(block.id, { openTime: e.target.value })
                        }
                        className="winxp-input w-full text-xs py-1 bg-white font-mono font-bold"
                      />
                    </div>

                    {/* Hora Cierre */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[10px] font-bold text-gray-700 uppercase">
                        Cierre:
                      </label>
                      <input
                        type="time"
                        value={block.closeTime || '19:30'}
                        onChange={(e) =>
                          updateSingleBlock(block.id, { closeTime: e.target.value })
                        }
                        className="winxp-input w-full text-xs py-1 bg-white font-mono font-bold"
                      />
                    </div>

                    {/* Nota opcional (Ej: Continuado, Colación) */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[10px] font-bold text-gray-700 uppercase">
                        Nota (Opcional):
                      </label>
                      <input
                        type="text"
                        value={block.note || ''}
                        onChange={(e) =>
                          updateSingleBlock(block.id, { note: e.target.value })
                        }
                        placeholder="Ej: (Continuado)"
                        className="winxp-input w-full text-xs py-1 bg-white"
                      />
                    </div>

                    {/* Texto Final de Horas (Editable libremente) */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="block text-[10px] font-bold text-blue-900 uppercase">
                        Texto Final Hora:
                      </label>
                      <input
                        type="text"
                        value={block.hoursText}
                        onChange={(e) =>
                          updateSingleBlock(block.id, { hoursText: e.target.value })
                        }
                        placeholder="10:30 a 19:30 hrs"
                        className="winxp-input w-full text-xs py-1 bg-blue-50/40 font-bold text-gray-900"
                      />
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-9 space-y-1">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase">
                      Texto mostrado cuando está cerrado (ej: Cerrado, Solo Retiro con Cita):
                    </label>
                    <input
                      type="text"
                      value={block.hoursText}
                      onChange={(e) =>
                        updateSingleBlock(block.id, { hoursText: e.target.value })
                      }
                      placeholder="Cerrado"
                      className="winxp-input w-full text-xs py-1 bg-gray-50 italic text-gray-600"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón para agregar otro tramo de días */}
      <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={handleAddBlock}
          className="winxp-button text-xs py-1.5 px-3 font-bold text-blue-950 bg-blue-50 hover:bg-blue-100 border-blue-400 flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 text-blue-700" />
          <span>Agregar Otro Tramo de Días / Horario</span>
        </button>
        <span className="text-[10px] text-gray-500">
          Puedes agregar tantos tramos como necesites (ej: Lun-Jue, Viernes, Sábado, Domingo).
        </span>
      </div>
    </div>
  );
};

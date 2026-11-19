import React from 'react';
import {
  Store,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit3,
  Eye,
  FileCheck2,
  Clock
} from 'lucide-react';
import { WindowFrame } from '../../layout/WindowFrame';
import { PixelIcon } from '../../common/PixelIcon';
import {
  getBranchScheduleBlocks,
  composeBranchPickupScheduleFromBlocks
} from '../../../context/BranchContext';
import { Branch, BranchScheduleBlock } from '../../../types';
import { BASE_3KG_RATES_FROM_V_REGION } from '../../../services/shippingQuotesEngine';
import { LiveBranchPreviewCard } from './LiveBranchPreviewCard';
import { FlexibleScheduleBuilder } from './FlexibleScheduleBuilder';
import {
  BranchEditFormState,
  QuickScheduleFormState,
  DetectedBranchChange,
  formatChileanRut
} from './branchManagementTypes';

export interface BranchModalsProps {
  showGlobalPreviewModal: boolean;
  setShowGlobalPreviewModal: (val: boolean) => void;
  physicalBranches: Branch[];
  handleOpenQuickScheduleModal: (branch: Branch) => void;
  scheduleEditingBranch: Branch | null;
  setScheduleEditingBranch: (branch: Branch | null) => void;
  handleSaveQuickSchedule: (e: React.FormEvent) => void;
  quickScheduleForm: QuickScheduleFormState;
  setQuickScheduleForm: React.Dispatch<React.SetStateAction<QuickScheduleFormState>>;
  activePreviewBlockId: string | null;
  setActivePreviewBlockId: (id: string | null) => void;
  handleInlinePreviewBlockChange: (blockId: string, patch: Partial<BranchScheduleBlock>) => void;
  editingBranch: Branch | null;
  setEditingBranch: (branch: Branch | null) => void;
  editForm: BranchEditFormState | null;
  setEditForm: React.Dispatch<React.SetStateAction<BranchEditFormState | null>>;
  handleReviewEditChanges: (e: React.FormEvent) => void;
  availableRegions: string[];
  citiesForEditRegion: string[];
  showConfirmModal: boolean;
  setShowConfirmModal: (val: boolean) => void;
  detectedChanges: DetectedBranchChange[];
  confirmInputText: string;
  setConfirmInputText: (val: string) => void;
  handleApplyConfirmedEdit: () => void;
  branchToDelete: Branch | null;
  setBranchToDelete: (branch: Branch | null) => void;
  handleConfirmDelete: () => void;
}

export const BranchModals: React.FC<BranchModalsProps> = ({
  showGlobalPreviewModal,
  setShowGlobalPreviewModal,
  physicalBranches,
  handleOpenQuickScheduleModal,
  scheduleEditingBranch,
  setScheduleEditingBranch,
  handleSaveQuickSchedule,
  quickScheduleForm,
  setQuickScheduleForm,
  activePreviewBlockId,
  setActivePreviewBlockId,
  handleInlinePreviewBlockChange,
  editingBranch,
  setEditingBranch,
  editForm,
  setEditForm,
  handleReviewEditChanges,
  availableRegions,
  citiesForEditRegion,
  showConfirmModal,
  setShowConfirmModal,
  detectedChanges,
  confirmInputText,
  setConfirmInputText,
  handleApplyConfirmedEdit,
  branchToDelete,
  setBranchToDelete,
  handleConfirmDelete
}) => {
  return (
    <>
      {/* ========================================================================= */}
      {/* MODAL DE VISTA PREVIA GENERAL: Horarios_Retiro_Sucursales.exe             */}
      {/* ========================================================================= */}
      {showGlobalPreviewModal && (
        <div
          className="branch-mgmt-modal-overlay fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-3 animate-in fade-in"
          onClick={() => setShowGlobalPreviewModal(false)}
        >
          <div
            className="branch-mgmt-modal-window w-full max-w-4xl bg-[#ece9d8] border-2 border-blue-900 shadow-2xl winxp-bevel-out max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra de Título Windows XP */}
            <div
              data-force-white="true"
              style={{
                background: 'linear-gradient(180deg, #0058ee 0%, #288eff 25%, #0055ea 75%, #003db3 100%)',
                color: '#ffffff'
              }}
              className="winxp-titlebar flex items-center justify-between px-2.5 py-1.5 select-none !text-white shrink-0"
            >
              <div
                data-force-white="true"
                style={{ color: '#ffffff' }}
                className="winxp-titlebar-title flex items-center gap-1.5 text-xs !text-white font-bold"
              >
                <Clock className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                <span data-force-white="true" style={{ color: '#ffffff' }} className="!text-white">
                  Horarios_Retiro_Sucursales.exe - [Sucursales Disponibles — Vista Previa Super Admin]
                </span>
              </div>
              <button
                type="button"
                data-force-white="true"
                style={{ color: '#ffffff' }}
                onClick={() => setShowGlobalPreviewModal(false)}
                className="winxp-btn-ctrl winxp-btn-close w-4 h-4 text-[10px] font-bold !text-white flex items-center justify-center cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="branch-mgmt-modal-body p-4 space-y-3.5 bg-white text-xs text-gray-800 overflow-y-auto">
              {/* Banner Exacto de Horarios_Retiro_Sucursales.exe */}
              <div className="p-3 bg-blue-50 border border-blue-300 rounded-xs flex flex-col sm:flex-row items-start justify-between gap-2.5 winxp-bevel-in">
                <div className="flex items-start gap-2.5">
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
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5 rounded-xs shrink-0">
                  Haz clic en "Editar esta Tarjeta" para modificar días y horas
                </span>
              </div>

              {/* Grilla 3 Columnas idéntica a la vista del cliente */}
              <div className="branch-mgmt-cards-grid grid grid-cols-1 md:grid-cols-3 gap-3">
                {physicalBranches.map((branch) => (
                  <div key={branch.id} className="flex flex-col space-y-1.5">
                    <LiveBranchPreviewCard
                      badge={branch.badge || 'Punto Oficial de Retiro'}
                      city={branch.city}
                      name={branch.name}
                      address={branch.address}
                      phone={branch.phone || '+56 9 8452 1190'}
                      managerName={branch.managerName}
                      returnInstructions={
                        branch.returnInstructions ||
                        'Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central.'
                      }
                      scheduleBlocks={getBranchScheduleBlocks(branch)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowGlobalPreviewModal(false);
                        handleOpenQuickScheduleModal(branch);
                      }}
                      className="winxp-button winxp-button-primary w-full py-1.5 px-2 text-xs font-bold text-blue-950 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                      <span>Editar esta Tarjeta y Horarios</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end border-t border-gray-300">
                <button
                  type="button"
                  onClick={() => setShowGlobalPreviewModal(false)}
                  className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-900 cursor-pointer shadow-sm"
                >
                  Cerrar Ventana
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL RÁPIDO: CONFIGURAR HORARIO FLEXIBLE + VISTA PREVIA INTERACTIVA      */}
      {/* ========================================================================= */}
      {scheduleEditingBranch && (
        <div className="branch-mgmt-modal-overlay fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-3 overflow-y-auto">
          <div className="branch-mgmt-modal-window max-w-5xl w-full my-auto">
            <WindowFrame
              title={`HORARIO_RETIRO.EXE - [Editor en Vista Previa: ${scheduleEditingBranch.name}]`}
              icon={<PixelIcon name="computer" size={16} />}
              statusBarText="EDICIÓN EN TIEMPO REAL DE TARJETA Y TRAMOS FLEXIBLES DE DÍAS/HORAS // SINCRONIZACIÓN GLOBAL"
            >
              <form
                onSubmit={handleSaveQuickSchedule}
                className="branch-mgmt-modal-body space-y-4 text-xs max-h-[85vh] overflow-y-auto pr-1"
              >
                <div className="flex flex-wrap justify-between items-center pb-2 border-b border-gray-300 gap-2">
                  <div>
                    <h4 className="font-black text-sm text-[#003c74] flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#0055ea]" />
                      <span>Editor Flexible de Horarios + Vista Previa en Vivo ({scheduleEditingBranch.city})</span>
                    </h4>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      {scheduleEditingBranch.name} · {scheduleEditingBranch.address}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setScheduleEditingBranch(null);
                        setShowGlobalPreviewModal(true);
                      }}
                      className="winxp-button text-xs px-2.5 py-1 text-blue-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-700" />
                      <span>Ver las 3 Sucursales Juntas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleEditingBranch(null)}
                      className="winxp-button text-xs px-2.5 py-1 text-gray-700 cursor-pointer"
                    >
                      ✕ Cerrar
                    </button>
                  </div>
                </div>

                {/* Layout en 2 Columnas: Izquierda Constructor Flexible / Derecha Tarjeta Vista Previa 1:1 */}
                <div className="branch-mgmt-builder-preview-grid grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* COLUMNA IZQUIERDA (7 cols): Constructor Flexible por Tramos de Días y Horas */}
                  <div className="lg:col-span-7 space-y-3">
                    <FlexibleScheduleBuilder
                      blocks={quickScheduleForm.scheduleBlocks}
                      onChange={(nextBlocks) =>
                        setQuickScheduleForm({ ...quickScheduleForm, scheduleBlocks: nextBlocks })
                      }
                      activeBlockId={activePreviewBlockId}
                      onSelectBlock={setActivePreviewBlockId}
                    />

                    {/* Datos adicionales que aparecen en la tarjeta de Horarios_Retiro_Sucursales.exe */}
                    <div className="bg-[#f8fafc] border border-[#9cb6d6] p-3 rounded-xs space-y-2.5">
                      <div className="font-black text-[11px] text-[#003c74] uppercase border-b border-gray-200 pb-1">
                        Textos e Información de la Tarjeta de Retiro:
                      </div>
                      <div className="branch-mgmt-grid-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                            Insignia Superior (Etiqueta Azul):
                          </label>
                          <input
                            type="text"
                            value={quickScheduleForm.badge}
                            onChange={(e) =>
                              setQuickScheduleForm({ ...quickScheduleForm, badge: e.target.value })
                            }
                            placeholder="Ej: TIENDA MATRIZ & DEVOLUCIÓN RÁPIDA"
                            className="winxp-input w-full text-xs py-1 bg-white uppercase font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                            WhatsApp de Contacto:
                          </label>
                          <input
                            type="text"
                            value={quickScheduleForm.phone}
                            onChange={(e) =>
                              setQuickScheduleForm({ ...quickScheduleForm, phone: e.target.value })
                            }
                            placeholder="+56 9 8452 1190"
                            className="winxp-input w-full text-xs py-1 bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                            Encargado de Tienda:
                          </label>
                          <input
                            type="text"
                            value={quickScheduleForm.managerName}
                            onChange={(e) =>
                              setQuickScheduleForm({ ...quickScheduleForm, managerName: e.target.value })
                            }
                            placeholder="Sebastián Valdés (Store Lead)"
                            className="winxp-input w-full text-xs py-1 bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                          Nota "Importante" al pie de la tarjeta (Protocolo de Retiro / Devolución):
                        </label>
                        <input
                          type="text"
                          value={quickScheduleForm.returnInstructions}
                          onChange={(e) =>
                            setQuickScheduleForm({
                              ...quickScheduleForm,
                              returnInstructions: e.target.value
                            })
                          }
                          placeholder="Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central."
                          className="winxp-input w-full text-xs py-1.5 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* COLUMNA DERECHA (5 cols): VISTA PREVIA EN TIEMPO REAL 1:1 */}
                  <div className="branch-mgmt-preview-sticky lg:col-span-5 lg:sticky lg:top-0 space-y-2.5">
                    <div className="bg-[#ece9d8] border-2 border-[#0055ea] p-3 rounded-xs shadow-md space-y-2.5">
                      <div
                        data-force-white="true"
                        style={{
                          background:
                            'linear-gradient(180deg, #0058ee 0%, #288eff 25%, #0055ea 75%, #003db3 100%)',
                          color: '#ffffff'
                        }}
                        className="px-2.5 py-1.5 !text-white flex items-center justify-between rounded-xs"
                      >
                        <div
                          data-force-white="true"
                          style={{ color: '#ffffff' }}
                          className="flex items-center gap-1.5 font-bold text-[11px] !text-white"
                        >
                          <Clock className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                          <span data-force-white="true" style={{ color: '#ffffff' }} className="!text-white">
                            Vista Previa Exacta: Horarios_Retiro_Sucursales.exe
                          </span>
                        </div>
                        <span
                          data-force-white="true"
                          style={{ color: '#ffffff' }}
                          className="text-[9px] bg-white/20 !text-white px-1.5 py-0.5 rounded-xs font-mono"
                        >
                          EN VIVO
                        </span>
                      </div>

                      <p className="text-[10px] text-gray-700 bg-yellow-50 border border-yellow-300 px-2 py-1 rounded-xs">
                        💡 <strong>Edición Directa:</strong> Puedes usar los botones de días/horas de la izquierda o hacer clic directamente sobre los textos de esta tarjeta para editarlos como vista previa.
                      </p>

                      <LiveBranchPreviewCard
                        badge={quickScheduleForm.badge}
                        city={scheduleEditingBranch.city}
                        name={scheduleEditingBranch.name}
                        address={scheduleEditingBranch.address}
                        phone={quickScheduleForm.phone}
                        managerName={quickScheduleForm.managerName}
                        returnInstructions={quickScheduleForm.returnInstructions}
                        scheduleBlocks={quickScheduleForm.scheduleBlocks}
                        activeBlockId={activePreviewBlockId}
                        onSelectBlock={setActivePreviewBlockId}
                        editableInline={true}
                        onChangeBadge={(val) =>
                          setQuickScheduleForm({ ...quickScheduleForm, badge: val })
                        }
                        onChangeReturnInstructions={(val) =>
                          setQuickScheduleForm({
                            ...quickScheduleForm,
                            returnInstructions: val
                          })
                        }
                        onChangeBlock={handleInlinePreviewBlockChange}
                      />

                      {/* Resumen compacto para Carro / Checkout */}
                      <div className="bg-white border border-gray-300 p-2 rounded-xs space-y-1 text-[10px]">
                        <span className="font-bold text-gray-700 block uppercase">
                          Resumen en 1 línea (Carro de Compras y Checkout):
                        </span>
                        <div className="flex items-center gap-1.5 text-blue-900 bg-blue-50 border border-blue-200 px-2 py-1 rounded-xs font-semibold">
                          <Clock className="w-3 h-3 text-blue-700 shrink-0" />
                          <span>
                            {composeBranchPickupScheduleFromBlocks(
                              quickScheduleForm.scheduleBlocks
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => setScheduleEditingBranch(null)}
                    className="winxp-button text-xs py-1.5 px-3 text-gray-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="winxp-button winxp-button-primary text-xs py-1.5 px-5 text-blue-950 font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Guardar y Sincronizar Horario en Todo el Sitio</span>
                  </button>
                </div>
              </form>
            </WindowFrame>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDITAR SUCURSAL COMPLETA + VISTA PREVIA                          */}
      {/* ========================================================================= */}
      {editingBranch && editForm && (
        <div className="branch-mgmt-modal-overlay fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-3 overflow-y-auto">
          <div className="branch-mgmt-modal-window max-w-5xl w-full my-auto">
            <WindowFrame
              title={`MODIFICAR_SUCURSAL.EXE - [${editingBranch.code}]`}
              icon={<PixelIcon name="computer" size={16} />}
              statusBarText="EDICIÓN DE SUCURSAL CON VISTA PREVIA EN TIEMPO REAL // REQUIERE CONFIRMACIÓN ESTRICTA"
            >
              <form
                onSubmit={handleReviewEditChanges}
                className="branch-mgmt-modal-body space-y-4 text-xs max-h-[85vh] overflow-y-auto pr-1"
              >
                <div className="flex justify-between items-center pb-2 border-b border-gray-300">
                  <h4 className="font-bold text-sm text-[#003c74] flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#0055ea]" />
                    <span>Modificar Datos y Horarios de la Sucursal ({editingBranch.code})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBranch(null);
                      setEditForm(null);
                    }}
                    className="winxp-button text-xs px-2 py-0.5 text-gray-600 cursor-pointer"
                  >
                    ✕ Cerrar
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Nombre y Teléfono */}
                  <div className="branch-mgmt-grid-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-800 mb-1">
                        Nombre Completo de la Sucursal
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="winxp-input w-full text-xs py-1.5 bg-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-800 mb-1">
                        WhatsApp de la Sucursal
                      </label>
                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="winxp-input w-full text-xs py-1.5 bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="branch-mgmt-grid-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Región */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Región</label>
                      <select
                        value={editForm.region}
                        onChange={(e) => {
                          const newReg = e.target.value;
                          const cities = Object.keys(BASE_3KG_RATES_FROM_V_REGION[newReg] || {});
                          setEditForm({
                            ...editForm,
                            region: newReg,
                            city: cities[0] || editForm.city
                          });
                        }}
                        className="winxp-input w-full text-xs py-1.5 font-medium bg-white"
                      >
                        {availableRegions.map((reg) => (
                          <option key={reg} value={reg}>
                            {reg}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Ciudad */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Ciudad / Comuna</label>
                      {citiesForEditRegion.length > 0 ? (
                        <select
                          value={editForm.city}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          className="winxp-input w-full text-xs py-1.5 font-medium bg-white"
                        >
                          {citiesForEditRegion.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          required
                          value={editForm.city}
                          onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                          className="winxp-input w-full text-xs py-1.5 bg-white"
                        />
                      )}
                    </div>

                    {/* Jefe de Sucursal */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-800 mb-1">
                        Jefe de la Sucursal asignado
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.managerName}
                        onChange={(e) => setEditForm({ ...editForm, managerName: e.target.value })}
                        className="winxp-input w-full text-xs py-1.5 bg-white"
                      />
                    </div>
                  </div>

                  {/* Dirección Física con advertencia */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-gray-800">
                      Dirección física exacta
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className="winxp-input w-full text-xs py-1.5 bg-white font-medium"
                    />
                    <p className="text-[10px] text-amber-800 bg-amber-50 p-1.5 border border-amber-200">
                      ⚠️ Recuerde que esta dirección se sincroniza con el catálogo de retiros en 15 minutos y las órdenes de compra.
                    </p>
                  </div>

                  {/* Horario Flexible + Vista Previa en Sucursales Físicas */}
                  {!editingBranch.isCorporate && editingBranch.id !== 'casa_matriz' && (
                    <div className="bg-blue-50/50 border border-blue-300 p-3 space-y-3 rounded-xs">
                      <div className="flex items-center justify-between border-b border-blue-200 pb-1.5">
                        <span className="font-black text-xs text-[#003c74] flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-[#0055ea]" />
                          <span>Horario Flexible de Retiro + Vista Previa de Tarjeta:</span>
                        </span>
                      </div>

                      <div className="branch-mgmt-builder-preview-grid grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                        <div className="lg:col-span-7 space-y-2.5">
                          <FlexibleScheduleBuilder
                            blocks={editForm.scheduleBlocks}
                            onChange={(nextBlocks) =>
                              setEditForm({ ...editForm, scheduleBlocks: nextBlocks })
                            }
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                Insignia Superior de la Tarjeta:
                              </label>
                              <input
                                type="text"
                                value={editForm.badge}
                                onChange={(e) => setEditForm({ ...editForm, badge: e.target.value })}
                                className="winxp-input w-full text-xs py-1 bg-white uppercase font-semibold"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                                Nota "Importante" al pie:
                              </label>
                              <input
                                type="text"
                                value={editForm.returnInstructions}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, returnInstructions: e.target.value })
                                }
                                className="winxp-input w-full text-xs py-1 bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-5 bg-[#ece9d8] border-2 border-[#0055ea] p-2.5 rounded-xs space-y-2">
                          <div
                            data-force-white="true"
                            style={{
                              background:
                                'linear-gradient(180deg, #0058ee 0%, #288eff 25%, #0055ea 75%, #003db3 100%)',
                              color: '#ffffff'
                            }}
                            className="px-2.5 py-1.5 !text-white flex items-center justify-between rounded-xs"
                          >
                            <div
                              data-force-white="true"
                              style={{ color: '#ffffff' }}
                              className="flex items-center gap-1.5 font-bold text-[11px] !text-white"
                            >
                              <Clock className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
                              <span data-force-white="true" style={{ color: '#ffffff' }} className="!text-white">
                                Vista Previa Exacta: Horarios_Retiro_Sucursales.exe
                              </span>
                            </div>
                            <span
                              data-force-white="true"
                              style={{ color: '#ffffff' }}
                              className="text-[9px] bg-white/20 !text-white px-1.5 py-0.5 rounded-xs font-mono"
                            >
                              EN VIVO
                            </span>
                          </div>
                          <LiveBranchPreviewCard
                            badge={editForm.badge}
                            city={editForm.city}
                            name={editForm.name}
                            address={editForm.address}
                            phone={editForm.phone}
                            managerName={editForm.managerName}
                            returnInstructions={editForm.returnInstructions}
                            scheduleBlocks={editForm.scheduleBlocks}
                            editableInline={true}
                            onChangeBadge={(val) => setEditForm({ ...editForm, badge: val })}
                            onChangeReturnInstructions={(val) =>
                              setEditForm({ ...editForm, returnInstructions: val })
                            }
                            onChangeBlock={(blkId, patch) =>
                              setEditForm({
                                ...editForm,
                                scheduleBlocks: editForm.scheduleBlocks.map((b) =>
                                  b.id === blkId ? { ...b, ...patch } : b
                                )
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Credenciales de Sucursal */}
                  <div className="bg-[#f2f6fa] border border-[#a2b5cc] p-3 space-y-2 rounded-xs">
                    <span className="font-bold text-[11px] text-[#003c74] block">
                      Credenciales de Acceso Administrador:
                    </span>
                    <div className="branch-mgmt-grid-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Correo</label>
                        <input
                          type="email"
                          required
                          value={editForm.adminEmail}
                          onChange={(e) => setEditForm({ ...editForm, adminEmail: e.target.value })}
                          className="winxp-input w-full text-xs py-1 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">RUT</label>
                        <input
                          type="text"
                          required
                          value={editForm.adminRut}
                          onChange={(e) =>
                            setEditForm({ ...editForm, adminRut: formatChileanRut(e.target.value) })
                          }
                          className="winxp-input w-full text-xs py-1 font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                          Nueva Contraseña (opcional)
                        </label>
                        <input
                          type="password"
                          placeholder="Dejar igual para mantener"
                          value={editForm.adminPassword}
                          onChange={(e) => setEditForm({ ...editForm, adminPassword: e.target.value })}
                          className="winxp-input w-full text-xs py-1 font-mono bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">
                          Confirmar Contraseña
                        </label>
                        <input
                          type="password"
                          placeholder="Repetir si se cambió"
                          value={editForm.adminPasswordConfirm}
                          onChange={(e) =>
                            setEditForm({ ...editForm, adminPasswordConfirm: e.target.value })
                          }
                          className="winxp-input w-full text-xs py-1 font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Estado Operativo */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="branchActiveCheck"
                      checked={editForm.isActive}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="cursor-pointer"
                    />
                    <label htmlFor="branchActiveCheck" className="text-xs font-semibold text-gray-800 cursor-pointer">
                      Sucursal Operativa y Abierta al Público
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBranch(null);
                      setEditForm(null);
                    }}
                    className="winxp-button text-xs py-1.5 px-3 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="winxp-button winxp-button-primary text-xs py-1.5 px-4 text-blue-900 font-bold cursor-pointer"
                  >
                    Revisar Modificaciones & Continuar →
                  </button>
                </div>
              </form>
            </WindowFrame>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRMACIÓN ESTRICTA CON DIFF Y PALABRA "CONFIRMAR"             */}
      {/* ========================================================================= */}
      {showConfirmModal && editingBranch && (
        <div className="branch-mgmt-modal-overlay fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-4">
          <div className="max-w-xl w-full">
            <WindowFrame
              title="SECURITY_CHALLENGE.SYS - [Confirmación Estricta de Modificación]"
              icon={<PixelIcon name="computer" size={16} />}
              statusBarText="VALIDACIÓN SUPER ADMINISTRADOR // TOKEN AUDITADO"
            >
              <div className="space-y-4 text-xs">
                {/* Alert Header */}
                <div className="bg-red-50 border-2 border-red-500 p-3 rounded-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-black text-red-900 text-xs uppercase tracking-wide">
                      ATENCIÓN: MODIFICACIÓN DE SUCURSAL CENTRAL
                    </h5>
                    <p className="text-[11px] text-red-800 mt-0.5">
                      Ha realizado cambios en la sucursal <strong>{editingBranch.name}</strong> ({editingBranch.code}).
                      Revise la lista detallada de modificaciones antes de autorizar su propagación en el sistema.
                    </p>
                  </div>
                </div>

                {/* TABLA DE CAMBIOS (DIFF) */}
                <div className="space-y-1.5">
                  <span className="font-bold text-gray-800 text-[11px] flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-blue-700" />
                    <span>Resumen de Cambios Realizados:</span>
                  </span>

                  <div className="branch-mgmt-diff-table-wrapper border border-gray-300 max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-[#ece9d8] border-b border-gray-300 sticky top-0">
                        <tr>
                          <th className="p-1.5 font-bold text-gray-700">Campo</th>
                          <th className="p-1.5 font-bold text-red-700">Valor Anterior</th>
                          <th className="p-1.5 font-bold text-green-700">Nuevo Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {detectedChanges.map((chg, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/50">
                            <td className="p-1.5 font-bold text-gray-800 whitespace-nowrap">{chg.field}</td>
                            <td className="p-1.5 text-red-700 font-mono line-through text-[10px] break-all">
                              {chg.oldVal}
                            </td>
                            <td className="p-1.5 text-green-700 font-mono font-bold text-[10px] break-all">
                              {chg.newVal}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* INGRESO DE LA PALABRA "CONFIRMAR" */}
                <div className="bg-[#fffbe6] border border-amber-300 p-3 space-y-2 rounded-xs">
                  <label className="block text-[11px] font-bold text-amber-950">
                    Para aplicar estas modificaciones de manera definitiva, escriba la palabra{' '}
                    <span className="font-black text-red-700 uppercase bg-amber-100 px-1 py-0.5 border border-amber-400">
                      CONFIRMAR
                    </span>{' '}
                    a continuación:
                  </label>
                  <input
                    type="text"
                    placeholder="Escriba CONFIRMAR aquí..."
                    value={confirmInputText}
                    onChange={(e) => setConfirmInputText(e.target.value)}
                    className="winxp-input w-full text-xs py-1.5 font-mono font-bold uppercase tracking-wider text-center"
                    autoFocus
                  />
                  <span className="text-[10px] text-gray-500 block text-center">
                    El botón permanecerá bloqueado hasta que escriba la palabra exacta en mayúsculas.
                  </span>
                </div>

                {/* Botones del Modal de Confirmación */}
                <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="winxp-button text-xs py-1 px-3 text-gray-700 cursor-pointer"
                  >
                    Volver y Modificar
                  </button>

                  <button
                    type="button"
                    disabled={confirmInputText.trim() !== 'CONFIRMAR'}
                    onClick={handleApplyConfirmedEdit}
                    className={`winxp-button text-xs py-1.5 px-5 font-black flex items-center gap-1.5 ${
                      confirmInputText.trim() === 'CONFIRMAR'
                        ? 'winxp-button-primary text-blue-950 cursor-pointer shadow-md'
                        : 'opacity-40 cursor-not-allowed text-gray-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>APLICAR Y GUARDAR MODIFICACIONES</span>
                  </button>
                </div>
              </div>
            </WindowFrame>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ELIMINAR SUCURSAL                                                */}
      {/* ========================================================================= */}
      {branchToDelete && (
        <div className="branch-mgmt-modal-overlay fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <WindowFrame
              title="DELETE_BRANCH.SYS - [Eliminar Sucursal Físicas]"
              icon={<PixelIcon name="computer" size={16} />}
              statusBarText="CONFIRMAR OPERACIÓN DESTRUCTIVA"
            >
              <div className="space-y-4 text-xs">
                <div className="bg-red-50 border border-red-300 p-3 rounded-xs flex items-start gap-2.5">
                  <Trash2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-red-900 text-xs">¿Está seguro de eliminar esta sucursal?</h5>
                    <p className="text-[11px] text-red-800 mt-1">
                      Se dará de baja la sucursal <strong>{branchToDelete.name}</strong> ({branchToDelete.code}).
                    </p>
                    <p className="text-[10px] text-gray-600 mt-1 font-mono">
                      Dirección: {branchToDelete.address}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 p-2.5 text-[11px] text-gray-700">
                  ⚠️ Esta acción inhabilitará el punto de retiro presencial para nuevas compras y desvinculará las
                  credenciales asignadas a su Jefe de Tienda.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-300">
                  <button
                    type="button"
                    onClick={() => setBranchToDelete(null)}
                    className="winxp-button text-xs py-1 px-3 text-gray-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="winxp-button text-xs py-1 px-4 text-red-700 font-bold border-red-400 bg-red-50 hover:bg-red-100 cursor-pointer"
                  >
                    Eliminar Sucursal Definitivamente
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

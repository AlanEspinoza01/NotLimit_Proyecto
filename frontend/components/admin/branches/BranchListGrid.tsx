import React from 'react';
import {
  Store,
  Users,
  Shield,
  MapPin,
  Trash2,
  Edit3,
  Search,
  Clock
} from 'lucide-react';
import { Branch } from '../../../types';
import { getBranchScheduleBlocks } from '../../../context/BranchContext';

export interface BranchListGridProps {
  filteredBranches: Branch[];
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedRegionFilter: string;
  setSelectedRegionFilter: (val: string) => void;
  availableRegions: string[];
  handleOpenQuickScheduleModal: (branch: Branch) => void;
  handleOpenEditModal: (branch: Branch) => void;
  setBranchToDelete: (branch: Branch | null) => void;
}

export const BranchListGrid: React.FC<BranchListGridProps> = ({
  filteredBranches,
  searchTerm,
  setSearchTerm,
  selectedRegionFilter,
  setSelectedRegionFilter,
  availableRegions,
  handleOpenQuickScheduleModal,
  handleOpenEditModal,
  setBranchToDelete
}) => {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-300 pb-2">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-[#003c74] shrink-0" />
          <h3 className="font-black text-sm text-[#003c74] uppercase">
            Sucursales Físicas Operativas ({filteredBranches.length})
          </h3>
        </div>

        {/* Barra de Búsqueda y Filtro de Región */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 flex-1 sm:w-64">
            <Search className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por ciudad, dirección o jefe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="winxp-input w-full text-xs py-1 bg-white"
            />
          </div>

          <select
            value={selectedRegionFilter}
            onChange={(e) => setSelectedRegionFilter(e.target.value)}
            className="winxp-input text-xs py-1 bg-white"
          >
            <option value="ALL">Todas las Regiones</option>
            {availableRegions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Cuadrícula de Sucursales */}
      {filteredBranches.length === 0 ? (
        <div className="bg-white border border-gray-300 p-8 text-center text-gray-500 text-xs">
          No se encontraron sucursales físicas que coincidan con los criterios de búsqueda.
        </div>
      ) : (
        <div className="nl-branch-cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredBranches.map((branch) => {
            const branchBlocks = getBranchScheduleBlocks(branch);
            return (
              <div
                key={branch.id}
                className="bg-white border-2 border-[#7f9db9] p-3.5 space-y-2.5 text-xs shadow-xs hover:border-[#0055ea] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Cabecera Tarjeta */}
                  <div className="flex justify-between items-start border-b border-gray-200 pb-2 gap-2">
                    <div>
                      <span className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
                        {branch.city}
                      </span>
                      <span className="text-[10px] text-gray-500 block font-medium">
                        {branch.region || 'Región de Valparaíso'}
                      </span>
                    </div>
                    <span className="font-mono text-gray-800 bg-blue-50 px-2 py-0.5 border border-blue-200 text-[11px] font-bold rounded-xs shrink-0">
                      {branch.code}
                    </span>
                  </div>

                  {/* Info de la Sucursal */}
                  <div className="pt-2 space-y-1.5">
                    {!branch.isCorporate && branch.id !== 'casa_matriz' && branch.badge && (
                      <span className="inline-block text-[9px] font-bold uppercase bg-blue-100 text-blue-900 px-1.5 py-0.5 border border-blue-300">
                        {branch.badge}
                      </span>
                    )}
                    <div className="text-gray-900 font-bold text-xs">{branch.name}</div>
                    <div className="text-gray-700 text-[11px] flex items-start gap-1">
                      <span className="font-semibold text-gray-800 shrink-0">Dirección:</span>
                      <span className="font-mono">{branch.address}</span>
                    </div>
                    <div className="text-blue-900 text-[11px] font-semibold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>Jefe de Tienda: {branch.managerName}</span>
                    </div>

                    {/* Horario de Retiro Sincronizado (Tramos Dinámicos) */}
                    {!branch.isCorporate && branch.id !== 'casa_matriz' && (
                      <div className="bg-blue-50/80 border border-blue-200 p-2 rounded-xs mt-2 space-y-1 text-[11px]">
                        <div className="text-blue-950 font-bold flex items-center justify-between gap-1 border-b border-blue-200/70 pb-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                            <span>Horario de Retiro:</span>
                          </span>
                          <span className="text-[9px] font-mono bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.5 rounded-xs">
                            SINCRONIZADO
                          </span>
                        </div>
                        <div className="text-gray-800 space-y-0.5 text-[10px] pt-0.5">
                          {branchBlocks.map((blk) => {
                            const isClosedRow = blk.isClosed || /cerrado/i.test(blk.hoursText);
                            return (
                              <div key={blk.id} className="flex justify-between gap-2">
                                <span className="text-gray-600 font-semibold">
                                  {blk.dayLabel.replace(/:$/, '')}:
                                </span>
                                <span
                                  className={`text-right ${
                                    isClosedRow
                                      ? 'italic text-gray-500'
                                      : 'font-bold text-gray-900'
                                  }`}
                                >
                                  {blk.hoursText}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Credenciales Asociadas */}
                    <div className="bg-gray-50 border border-gray-200 p-2 rounded-xs mt-2 space-y-1 text-[11px]">
                      <div className="text-gray-600 font-semibold flex items-center gap-1">
                        <Shield className="w-3 h-3 text-blue-700" />
                        <span>Acceso Admin Sucursal:</span>
                      </div>
                      <div className="text-gray-800 pl-4 font-mono text-[10px]">
                        <div>
                          <span className="text-gray-500">Email:</span> {branch.adminEmail || 'admin@nolimits.cl'}
                        </div>
                        <div>
                          <span className="text-gray-500">RUT:</span> {branch.adminRut || '12.345.678-K'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer y Botones de Acción */}
                <div className="pt-3 border-t border-gray-200 space-y-2">
                  <div className="flex justify-between items-center text-[10px]">
                    {branch.isCorporate || branch.id === 'casa_matriz' ? (
                      <span className="text-blue-800 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        CASA MATRIZ / CENTRAL (SIN PUNTO FÍSICO NI RETIRO)
                      </span>
                    ) : (
                      <span className="text-green-700 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                        RETIRO EN 15 MINUTOS ACTIVO
                      </span>
                    )}
                    {branch.createdAt && (
                      <span className="text-gray-400 font-mono">Alta: {branch.createdAt}</span>
                    )}
                  </div>

                  {/* Botón rápido para Configurar Horario de Retiro con Vista Previa */}
                  {!branch.isCorporate && branch.id !== 'casa_matriz' && (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenQuickScheduleModal(branch)}
                        className="winxp-button w-full text-xs py-1.5 px-2 font-bold text-blue-950 bg-blue-50 hover:bg-blue-100 border-blue-400 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span>Configurar Horario & Vista Previa</span>
                      </button>
                    </div>
                  )}

                  {/* Botones de Editar y Eliminar */}
                  <div className="flex gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(branch)}
                      className="winxp-button flex-1 text-xs py-1 px-2 font-bold text-blue-900 flex items-center justify-center gap-1 hover:bg-blue-50 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-700" />
                      <span>Editar sucursal</span>
                    </button>

                    {branch.isCorporate || branch.id === 'casa_matriz' ? (
                      <button
                        type="button"
                        disabled
                        className="winxp-button text-xs py-1 px-2 font-bold text-gray-400 flex items-center justify-center gap-1 bg-gray-100 border-gray-300 cursor-not-allowed opacity-60"
                        title="La Casa Matriz Central (Corporativo) es permanente y no puede eliminarse"
                      >
                        <Shield className="w-3.5 h-3.5 text-gray-400" />
                        <span>Permanente</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setBranchToDelete(branch)}
                        className="winxp-button text-xs py-1 px-2 font-bold text-red-700 flex items-center justify-center gap-1 hover:bg-red-50 border-red-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Eliminar</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

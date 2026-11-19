import React from 'react';
import {
  Truck,
  Save,
  RefreshCw,
  Percent,
  RotateCcw,
  History
} from 'lucide-react';
import { ShippingCourierId } from '../../../services/shippingQuotesEngine';
import {
  WeightTierKey,
  WEIGHT_TIERS,
  ShippingRatesMatrix,
  ShippingMatrixSnapshot,
  formatCLP
} from './pageEditorTypes';

interface ShippingRatesTabProps {
  allRegions: string[];
  selectedShippingRegion: string;
  setSelectedShippingRegion: (reg: string) => void;
  selectedCourier: ShippingCourierId;
  setSelectedCourier: (courier: ShippingCourierId) => void;
  inflationRate: number | '';
  setInflationRate: (rate: number | '') => void;
  inflationScope: 'all' | 'starken' | 'blue_express' | 'paket' | 'region';
  setInflationScope: (scope: 'all' | 'starken' | 'blue_express' | 'paket' | 'region') => void;
  shippingHistory: ShippingMatrixSnapshot[];
  currentRegionCities: string[];
  shippingRatesMatrix: ShippingRatesMatrix;
  defaultShippingRatesMatrix: ShippingRatesMatrix;
  handleUndoLastShippingChange: () => void;
  setIsShippingHistoryOpen: (open: boolean) => void;
  setIsResetFactoryConfirmOpen: (open: boolean) => void;
  handleSaveShippingRates: () => void;
  handleRequestApplyInflationRate: () => void;
  handleManualRateChange: (city: string, tier: WeightTierKey, newValue: number) => void;
  handleAutoCalculateCityTiers: (city: string) => void;
  handleRestoreSingleCity: (city: string) => void;
}

export const ShippingRatesTab: React.FC<ShippingRatesTabProps> = ({
  allRegions,
  selectedShippingRegion,
  setSelectedShippingRegion,
  selectedCourier,
  setSelectedCourier,
  inflationRate,
  setInflationRate,
  inflationScope,
  setInflationScope,
  shippingHistory,
  currentRegionCities,
  shippingRatesMatrix,
  defaultShippingRatesMatrix,
  handleUndoLastShippingChange,
  setIsShippingHistoryOpen,
  setIsResetFactoryConfirmOpen,
  handleSaveShippingRates,
  handleRequestApplyInflationRate,
  handleManualRateChange,
  handleAutoCalculateCityTiers,
  handleRestoreSingleCity
}) => {
  return (
    <div className="bg-white border-2 border-gray-400 p-4 space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <Truck
            className="w-4 h-4 fill-emerald-300 shrink-0"
            stroke="#000000"
            strokeWidth={1.5}
          />
          <span className="font-extrabold text-xs text-[#003c74] uppercase">
            Matriz de Tarifas por Región, Ciudad y Tramos de Peso (shippingQuotesEngine.ts)
          </span>
        </div>

        {/* Botones de Seguridad: Deshacer, Historial de Respaldos, Restablecer y Guardar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={shippingHistory.length === 0}
            onClick={handleUndoLastShippingChange}
            className={`winxp-button text-xs py-1 px-2.5 font-bold flex items-center gap-1.5 text-amber-950 ${
              shippingHistory.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-50'
            }`}
            title="Vuelve inmediatamente al estado anterior antes del último cambio"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>Deshacer Último Cambio</span>
          </button>

          <button
            type="button"
            onClick={() => setIsShippingHistoryOpen(true)}
            className="winxp-button text-xs py-1 px-2.5 font-bold flex items-center gap-1.5 text-blue-950"
            title="Ver historial de respaldos y restaurar versiones anteriores (hasta 100 respaldos)"
          >
            <History className="w-3.5 h-3.5 text-blue-700" />
            <span>Historial de Respaldos ({shippingHistory.length}/100)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsResetFactoryConfirmOpen(true)}
            className="winxp-button text-xs py-1 px-2.5 font-bold flex items-center gap-1.5 text-rose-900"
            title="Volver a las tarifas originales de fábrica del sistema"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rose-700" />
            <span>Restablecer Tarifas Base</span>
          </button>

          <button
            type="button"
            onClick={handleSaveShippingRates}
            className="winxp-button winxp-button-primary text-xs py-1 px-4 font-bold text-white bg-emerald-700 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar Matriz de Tarifas</span>
          </button>
        </div>
      </div>

      {/* SELECCIÓN DE AGENCIA DE ENVÍO + REGIÓN + AJUSTE PORCENTUAL CON ALCANCE Y CONFIRMACIÓN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 bg-[#f8fafc] border border-gray-300 p-3 text-xs">
        {/* 1. Agencia de Envío */}
        <div className="space-y-1 lg:col-span-3">
          <label className="font-bold text-gray-800 block">Agencia de Envío:</label>
          <select
            value={selectedCourier}
            onChange={(e) => setSelectedCourier(e.target.value as ShippingCourierId)}
            className="w-full winxp-select text-xs py-1.5 font-black text-blue-900 !border !border-black"
          >
            <option value="starken">Starken (Nacional)</option>
            <option value="blue_express">Blue Express (Prioritario)</option>
            <option value="paket">Paket Express (Urbano V &amp; RM)</option>
          </select>
        </div>

        {/* 2. Selector de Región */}
        <div className="space-y-1 lg:col-span-4">
          <label className="font-bold text-gray-800 block">Seleccionar Región:</label>
          <select
            value={selectedShippingRegion}
            onChange={(e) => setSelectedShippingRegion(e.target.value)}
            className="w-full winxp-select text-xs py-1.5 font-bold !border !border-black"
          >
            {allRegions.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Tasa de Inflación / Ajuste Automático Seguro con Alcance y Vista Previa */}
        <div className="space-y-1.5 bg-amber-50 border border-amber-300 p-2.5 sm:col-span-2 lg:col-span-5">
          <label className="font-black text-amber-950 flex items-center justify-between">
            <span>Tasa de Inflación / Reajuste Automático (%):</span>
            <Percent className="w-3.5 h-3.5 text-amber-700" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5">
            <div className="sm:col-span-4">
              <input
                type="number"
                step="0.5"
                placeholder="Ej: 5 o -5"
                value={inflationRate}
                onChange={(e) =>
                  setInflationRate(e.target.value === '' ? '' : Number(e.target.value))
                }
                className="w-full winxp-input text-xs py-1 font-black text-amber-950"
                title="Usa valores positivos (ej: 5) para subir o negativos (ej: -5) para bajar"
              />
            </div>
            <div className="sm:col-span-5">
              <select
                value={inflationScope}
                onChange={(e) =>
                  setInflationScope(
                    e.target.value as 'all' | 'starken' | 'blue_express' | 'paket' | 'region'
                  )
                }
                className="w-full winxp-select text-[11px] py-1 font-bold text-amber-950 !border !border-black"
                title="Elige dónde aplicar el porcentaje"
              >
                <option value="all">Aplicar a: Todo Chile</option>
                <option value="starken">Solo agencia: Starken</option>
                <option value="blue_express">Solo agencia: Blue Express</option>
                <option value="paket">Solo agencia: Paket</option>
                <option value="region">Solo región actual</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <button
                type="button"
                onClick={handleRequestApplyInflationRate}
                className="w-full winxp-button text-xs py-1 px-2 font-bold text-amber-950 bg-amber-200 hover:bg-amber-300"
              >
                Previsualizar
              </button>
            </div>
          </div>
          <span className="text-[10px] text-amber-900 block leading-tight">
            Muestra ventana de confirmación "Antes vs. Después" y guarda respaldo automático antes de aplicar.
          </span>
        </div>
      </div>

      {/* TABLA DE TRAMOS DE PESO CON COMPARADOR DE VALOR ORIGINAL Y ACCIONES POR CIUDAD */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-gray-800">
            Tarifas por Ciudad de <strong>{selectedShippingRegion}</strong> ({selectedCourier.toUpperCase()}):
          </span>
          <span className="text-[11px] text-gray-600 flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 inline-block bg-amber-100 border border-amber-500" />
              <span>Casilla modificada (muestra el valor original debajo)</span>
            </span>
          </span>
        </div>

        <div className="nl-page-editor-table-scroll border-2 border-gray-400 bg-white max-h-[480px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#e4ebf2] border-b border-gray-400 text-gray-800 font-extrabold uppercase text-[11px]">
                <th className="p-2.5 border-r border-gray-300 w-44">Ciudad / Comuna</th>
                <th className="p-2.5 border-r border-gray-300 text-center bg-blue-50/70">0 - 1 KG</th>
                <th className="p-2.5 border-r border-gray-300 text-center bg-blue-100/80">
                  1 - 3 KG (Base)
                </th>
                <th className="p-2.5 border-r border-gray-300 text-center bg-blue-50/70">3 - 6 KG</th>
                <th className="p-2.5 border-r border-gray-300 text-center bg-blue-50/70">6 - 12 KG</th>
                <th className="p-2.5 border-r border-gray-300 text-center bg-blue-50/70">12 - 20 KG</th>
                <th className="p-2.5 text-center bg-gray-100 w-44">Ayuda / Restaurar Fila</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentRegionCities.map((city) => {
                const cityRates =
                  shippingRatesMatrix[selectedCourier]?.[selectedShippingRegion]?.[city] || {
                    '0-1KG': 4500,
                    '1KG-3KG': 5500,
                    '3KG-6KG': 6800,
                    '6KG-12KG': 8900,
                    '12KG-20KG': 12500
                  };
                const origCityRates =
                  defaultShippingRatesMatrix[selectedCourier]?.[selectedShippingRegion]?.[city] ||
                  cityRates;
                const isCityModified = WEIGHT_TIERS.some(
                  (t) => cityRates[t] !== origCityRates[t]
                );

                return (
                  <tr key={city} className="hover:bg-blue-50/40 transition-colors">
                    <td className="p-2.5 border-r border-gray-200 font-bold text-gray-900 bg-gray-50/50">
                      <div className="flex items-center justify-between gap-1">
                        <span>{city}</span>
                        {isCityModified && (
                          <span
                            className="text-[9px] font-black px-1 py-0.2 bg-amber-100 text-amber-900 border border-amber-400 rounded-xs"
                            title="Esta ciudad tiene tarifas personalizadas distintas a las originales"
                          >
                            Editado
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Columnas para cada tramo de peso editable manualmente + indicador de valor original */}
                    {WEIGHT_TIERS.map((tier) => {
                      const currentVal = cityRates[tier];
                      const origVal = origCityRates[tier];
                      const isTierModified = currentVal !== origVal;
                      return (
                        <td
                          key={tier}
                          className={`p-1.5 border-r border-gray-200 text-center align-top ${
                            isTierModified ? 'bg-amber-50/50' : ''
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <div className="relative inline-flex items-center">
                              <span className="text-[10px] text-gray-400 mr-1">$</span>
                              <input
                                type="number"
                                min="0"
                                step="50"
                                value={currentVal}
                                onChange={(e) =>
                                  handleManualRateChange(
                                    city,
                                    tier,
                                    parseInt(e.target.value, 10) || 0
                                  )
                                }
                                className={`w-20 winxp-input text-xs py-1 text-right font-mono font-bold ${
                                  isTierModified
                                    ? 'text-amber-950 !border-amber-500 !bg-amber-50'
                                    : 'text-emerald-900'
                                }`}
                              />
                            </div>
                            {isTierModified && (
                              <span
                                className="text-[9px] font-mono text-gray-500 mt-0.5"
                                title={`Valor original de fábrica: ${formatCLP(origVal)}`}
                              >
                                Orig: {formatCLP(origVal)}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Acciones rápidas por fila para evitar errores humanos */}
                    <td className="p-1.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAutoCalculateCityTiers(city)}
                          className="winxp-button text-[10px] py-0.5 px-1.5 font-bold text-blue-900"
                          title="Calcula automáticamente los 5 tramos de esta ciudad usando su valor de 1-3 KG como base"
                        >
                          ⚡ Autocalcular
                        </button>
                        <button
                          type="button"
                          disabled={!isCityModified}
                          onClick={() => handleRestoreSingleCity(city)}
                          className={`winxp-button text-[10px] py-0.5 px-1.5 font-bold text-amber-950 ${
                            !isCityModified ? 'opacity-40 cursor-not-allowed' : ''
                          }`}
                          title="Restaurar esta ciudad a sus valores originales de fábrica"
                        >
                          ↺ Original
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

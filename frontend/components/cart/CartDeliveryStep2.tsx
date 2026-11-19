import React from 'react';
import {
  Store,
  Truck,
  MapPin,
  Info,
  X,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Branch } from '../../types';
import {
  CHILE_REGIONS,
  BASE_3KG_RATES_FROM_V_REGION,
  ShippingQuoteOption
} from '../../services/shippingQuotesEngine';

export interface CartDeliveryStep2Props {
  deliveryMethod: 'pickup' | 'shipping';
  setDeliveryMethod: (val: 'pickup' | 'shipping') => void;
  showPickupInfo: boolean;
  setShowPickupInfo: (val: boolean) => void;
  pickupBranches: Branch[];
  selectedBranchId: string;
  handleBranchChange: (branchId: string) => void;
  selectedBranch: Branch | undefined;
  selectedBranchHours: string;
  setIsPickupScheduleModalOpen: (val: boolean) => void;
  shippingRegion: string;
  handleRegionChange: (newRegion: string) => void;
  shippingComuna: string;
  setShippingComuna: (val: string) => void;
  shippingStreet: string;
  setShippingStreet: (val: string) => void;
  shippingNumber: string;
  setShippingNumber: (val: string) => void;
  shippingNoNumber: boolean;
  setShippingNoNumber: (val: boolean) => void;
  shippingApartment: string;
  setShippingApartment: (val: string) => void;
  shippingPostalCode: string;
  handlePostalCodeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  shippingNotes: string;
  setShippingNotes: (val: string) => void;
  exceedsMaxWeight: boolean;
  courierQuotes: ShippingQuoteOption[];
  shippingCourier: 'Starken' | 'bluexpress' | 'Paket' | 'Paket ';
  setShippingCourier: (val: 'Starken' | 'bluexpress' | 'Paket' | 'Paket ') => void;
  selectedQuote: ShippingQuoteOption | undefined;
  shippingPaymentMode: 'paid' | 'on_delivery';
  setShippingPaymentMode: (val: 'paid' | 'on_delivery') => void;
}

export const CartDeliveryStep2: React.FC<CartDeliveryStep2Props> = ({
  deliveryMethod,
  setDeliveryMethod,
  showPickupInfo,
  setShowPickupInfo,
  pickupBranches,
  selectedBranchId,
  handleBranchChange,
  selectedBranch,
  selectedBranchHours,
  setIsPickupScheduleModalOpen,
  shippingRegion,
  handleRegionChange,
  shippingComuna,
  setShippingComuna,
  shippingStreet,
  setShippingStreet,
  shippingNumber,
  setShippingNumber,
  shippingNoNumber,
  setShippingNoNumber,
  shippingApartment,
  setShippingApartment,
  shippingPostalCode,
  handlePostalCodeChange,
  shippingNotes,
  setShippingNotes,
  exceedsMaxWeight,
  courierQuotes,
  shippingCourier,
  setShippingCourier,
  selectedQuote,
  shippingPaymentMode,
  setShippingPaymentMode
}) => {
  return (
    <div className="border border-gray-400 bg-white p-3 space-y-2.5 winxp-bevel-out text-xs">
      <div className="flex items-center gap-1.5 pb-1 border-b border-gray-300">
        <Store className="w-3.5 h-3.5 text-blue-700" />
        <h3 className="font-bold text-xs text-blue-900">
          PASO 2: SELECCIONA EL NODO DE RETIRO O ENVÍO
        </h3>
      </div>

      {/* Selector de Modalidad (Retiro en Sucursal vs Envío a Domicilio) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <button
          type="button"
          onClick={() => setDeliveryMethod('pickup')}
          className={`p-2 text-left border flex items-start gap-2 transition-all cursor-pointer ${
            deliveryMethod === 'pickup'
              ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-500 font-semibold'
              : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
          }`}
        >
          <Store
            className={`w-4 h-4 mt-0.5 shrink-0 ${
              deliveryMethod === 'pickup' ? 'text-blue-700' : 'text-gray-500'
            }`}
          />
          <div>
            <div className="font-bold text-gray-900 flex items-center gap-1 flex-wrap">
              <span>Retiro en Sucursal</span>
              <span className="text-[9px] bg-green-100 text-green-800 px-1 py-0.2 rounded font-bold">
                ¡GRATIS!
              </span>
            </div>
            <div className="text-[10px] text-gray-600 mt-0.5">
              Viña del Mar, Valparaíso o Quilpué
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setDeliveryMethod('shipping')}
          className={`p-2 text-left border flex items-start gap-2 transition-all cursor-pointer ${
            deliveryMethod === 'shipping'
              ? 'bg-blue-50 border-blue-600 ring-1 ring-blue-500 font-semibold'
              : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
          }`}
        >
          <Truck
            className={`w-4 h-4 mt-0.5 shrink-0 ${
              deliveryMethod === 'shipping' ? 'text-blue-700' : 'text-gray-500'
            }`}
          />
          <div>
            <div className="font-bold text-gray-900 flex items-center gap-1">
              <span>Despacho a Domicilio</span>
            </div>
            <div className="text-[10px] text-gray-600 mt-0.5">
              Starken / bluexpress / Paket
            </div>
          </div>
        </button>
      </div>

      {/* Si eligió Retiro en Sucursal: Selector de Sucursales físicas */}
      {deliveryMethod === 'pickup' ? (
        <div className="bg-[#f2f7fc] border border-[#a0c5e8] p-2.5 rounded-sm space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-1">
            <span className="font-bold text-[11px] text-blue-950 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-blue-700" />
              Elige la sucursal física:
            </span>
            <button
              type="button"
              onClick={() => setShowPickupInfo(!showPickupInfo)}
              className="inline-flex items-center gap-1 text-[10px] text-blue-700 hover:text-blue-900 bg-white border border-blue-300 hover:border-blue-500 px-1.5 py-0.5 rounded shadow-2xs font-semibold cursor-pointer transition-colors"
              title="Información sobre retiro presencial"
              aria-label="Información sobre retiro presencial"
            >
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Info retiro</span>
            </button>
          </div>

          {/* Panel explicativo cuando se hace click en el icono de información */}
          {showPickupInfo && (
            <div className="bg-amber-50 border border-amber-300 text-amber-950 p-2 rounded text-[11px] relative flex items-start gap-2 shadow-xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="pr-5 leading-relaxed">
                <strong className="block text-amber-900 font-bold mb-0.5">
                  ¿Cómo funciona el Retiro en Sucursal?
                </strong>
                Estás eligiendo la sucursal física donde tú o la persona autorizada irá a recoger los productos de manera presencial al lugar seleccionado, sin costo adicional de envío.
              </div>
              <button
                type="button"
                onClick={() => setShowPickupInfo(false)}
                className="absolute top-1.5 right-1.5 text-amber-600 hover:text-amber-900 p-0.5 rounded hover:bg-amber-100 cursor-pointer"
                title="Cerrar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="nl-cart-branches-grid grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {pickupBranches.map((branch) => {
              const isSelected = selectedBranchId === branch.id;
              return (
                <div
                  key={branch.id}
                  onClick={() => handleBranchChange(branch.id)}
                  className={`p-2 border cursor-pointer text-xs transition-all ${
                    isSelected
                      ? 'bg-white border-blue-700 shadow-sm ring-2 ring-blue-400'
                      : 'bg-white/80 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between pb-0.5">
                    <span className="font-bold text-blue-900 text-[11px]">
                      {branch.city}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isSelected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {selectedBranch && (
            <div className="bg-white border border-gray-300 p-2 text-[11px] space-y-1.5 text-gray-700">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <span>
                  Retiro en: <strong>{selectedBranch.name}</strong>
                </span>
              </div>
              <div className="text-[10px] text-gray-600 pl-4.5">
                {selectedBranch.address}
              </div>
              <div
                onClick={() => setIsPickupScheduleModalOpen(true)}
                className="text-[10px] text-blue-900 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 hover:border-blue-400 px-2 py-1.5 rounded-xs space-y-1 cursor-pointer transition-colors"
                title="Haz clic para ver el cuadro de horarios de retiro en sucursales"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                    <span>Horario de Retiro Sincronizado:</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPickupScheduleModalOpen(true);
                    }}
                    className="winxp-button winxp-button-primary text-[10px] py-0.5 px-2 font-bold flex items-center gap-1 cursor-pointer text-blue-900 bg-white hover:bg-blue-50 border-blue-500 shadow-2xs shrink-0"
                  >
                    <Clock className="w-2.5 h-2.5 text-blue-700 shrink-0" />
                    <span>Ver Horarios de Retiro</span>
                  </button>
                </div>
                <div className="pl-4.5 font-medium text-blue-950">
                  {selectedBranchHours}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Si eligió Despacho a Domicilio: Formulario completo + Métodos de envío */
        <div className="bg-[#f8fafc] border border-gray-300 p-3 rounded-sm space-y-3 text-xs">
          {/* Encabezado del Formulario */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-1.5 flex-wrap gap-1">
            <div className="font-bold text-gray-900 text-[11px] flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-700" />
              <span>Formulario de Despacho a Domicilio</span>
            </div>
            <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-medium border border-blue-200">
              Envíos a todo Chile
            </span>
          </div>

          {/* Campos del Formulario */}
          <div className="space-y-2.5">
            {/* 1. Región y Comuna (Campos obligatorios dinámicos) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-0.5">
                  Región <span className="text-red-600">*</span>
                </label>
                <select
                  value={shippingRegion}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="winxp-input w-full text-xs py-1.5 px-2 bg-white"
                  required
                >
                  {CHILE_REGIONS.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-700 block mb-0.5">
                  Comuna <span className="text-red-600">*</span>
                </label>
                <select
                  value={shippingComuna}
                  onChange={(e) => setShippingComuna(e.target.value)}
                  className="winxp-input w-full text-xs py-1.5 px-2 bg-white"
                  required
                >
                  {Object.keys(BASE_3KG_RATES_FROM_V_REGION[shippingRegion] || {}).map((com) => (
                    <option key={com} value={com}>
                      {com}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Calle (obligatorio) y 3. Número (con opción 'Calle sin número') */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-7">
                <label className="text-[10px] font-bold text-gray-700 block mb-0.5">
                  Calle <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={shippingStreet}
                  onChange={(e) => setShippingStreet(e.target.value)}
                  className="winxp-input w-full text-xs py-1.5 px-2 bg-white"
                  placeholder="Ej: Av. Libertad, Los Alerces, San Martín"
                  required
                />
              </div>

              <div className="sm:col-span-5">
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] font-bold text-gray-700">
                    Número {!shippingNoNumber && <span className="text-red-600">*</span>}
                  </label>
                  <label className="text-[10px] text-blue-800 flex items-center gap-1 cursor-pointer select-none hover:text-blue-900 font-medium">
                    <input
                      type="checkbox"
                      checked={shippingNoNumber}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setShippingNoNumber(checked);
                        if (checked) {
                          setShippingNumber('');
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-0 cursor-pointer w-3 h-3"
                    />
                    <span>Calle sin número</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={shippingNoNumber ? 'S/N (Sin número)' : shippingNumber}
                  onChange={(e) => {
                    if (!shippingNoNumber) {
                      setShippingNumber(e.target.value);
                    }
                  }}
                  disabled={shippingNoNumber}
                  className={`winxp-input w-full text-xs py-1.5 px-2 ${
                    shippingNoNumber
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed italic font-medium'
                      : 'bg-white'
                  }`}
                  placeholder={shippingNoNumber ? 'Sin número' : 'Ej: 1400'}
                />
              </div>
            </div>

            {/* 4. Departamento/oficina/casa/etc (Campo opcional) */}
            <div>
              <label className="text-[10px] font-bold text-gray-700 block mb-0.5">
                Departamento / Oficina / Casa / etc.{' '}
                <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                value={shippingApartment}
                onChange={(e) => setShippingApartment(e.target.value)}
                className="winxp-input w-full text-xs py-1.5 px-2 bg-white"
                placeholder="Ej: Depto 502, Torre B, Casa 14, Oficina 301"
              />
            </div>

            {/* 5. Código postal (Campo opcional, pero solo permite números) */}
            <div>
              <label className="text-[10px] font-bold text-gray-700 block mb-0.5">
                Código postal{' '}
                <span className="text-gray-400 font-normal">(Opcional - solo números)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={shippingPostalCode}
                onChange={handlePostalCodeChange}
                className="winxp-input w-full text-xs py-1.5 px-2 bg-white font-mono"
                placeholder="Ej: 2520000"
                maxLength={7}
              />
            </div>

            {/* 6. Indicaciones (Campo opcional) */}
            <div>
              <label className="text-[10px] font-bold text-gray-700 block mb-0.5">
                Indicaciones{' '}
                <span className="text-gray-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                value={shippingNotes}
                onChange={(e) => setShippingNotes(e.target.value)}
                className="winxp-input w-full text-xs py-1.5 px-2 bg-white"
                placeholder="Ej: Dejar en conserjería, timbre blanco, portón negro, entre calles..."
              />
            </div>
          </div>

          {/* Abajo del formulario: Métodos de envío con las 3 opciones cotizadas */}
          <div className="pt-2.5 border-t border-gray-200">
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <span className="font-bold text-gray-900 text-[11px] flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-blue-700" />
                Métodos de envío disponibles:
              </span>
            </div>

            {exceedsMaxWeight && (
              <div className="mb-2 p-2 bg-red-50 border border-red-300 text-red-800 text-[11px] rounded flex items-start gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-red-900 font-bold mb-0.5">
                    Límite de peso excedido (Máx 20 KG)
                  </strong>
                  El carro supera el límite máximo permitido para despachos a domicilio. Por favor divide tu compra o selecciona <strong>Retiro en Sucursal</strong> (¡gratis y sin límite de peso!).
                </div>
              </div>
            )}

            <div className="nl-cart-couriers-grid grid grid-cols-1 sm:grid-cols-3 gap-2">
              {courierQuotes.map((quote) => {
                const courierStateValue: 'Starken' | 'bluexpress' | 'Paket' =
                  quote.courierId === 'starken'
                    ? 'Starken'
                    : quote.courierId === 'blue_express'
                    ? 'bluexpress'
                    : 'Paket';

                const isSelected =
                  (quote.courierId === 'starken' && shippingCourier === 'Starken') ||
                  (quote.courierId === 'blue_express' && shippingCourier === 'bluexpress') ||
                  (quote.courierId === 'paket' &&
                    (shippingCourier === 'Paket' || shippingCourier === 'Paket '));

                const isPaketDisabled = quote.courierId === 'paket' && !quote.available;

                return (
                  <div
                    key={quote.courierId}
                    onClick={() => {
                      if (quote.available) {
                        setShippingCourier(courierStateValue);
                      }
                    }}
                    className={`p-2 rounded border transition-all flex flex-col justify-between ${
                      isPaketDisabled
                        ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-300'
                        : !quote.available
                        ? 'bg-gray-100/90 border-gray-300 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-400 shadow-xs cursor-pointer'
                        : 'bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-bold ${
                            !quote.available
                              ? 'text-gray-500'
                              : isSelected
                              ? 'text-blue-900'
                              : 'text-gray-800'
                          }`}
                        >
                          {quote.courierName}
                        </span>
                        {isPaketDisabled ? (
                          <span className="text-[9px] bg-gray-200 text-gray-700 font-bold px-1 py-0.2 rounded border border-gray-300">
                            No disponible
                          </span>
                        ) : (
                          <input
                            type="radio"
                            name="shippingCourier"
                            checked={isSelected && quote.available}
                            disabled={!quote.available}
                            onChange={() => {
                              if (quote.available) {
                                setShippingCourier(courierStateValue);
                              }
                            }}
                            className="w-3.5 h-3.5 text-blue-600 focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                        )}
                      </div>

                      {/* Tiempo estimado de entrega */}
                      <div className="text-[10px] text-gray-600 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="line-clamp-1">{quote.estimatedDays}</span>
                      </div>
                    </div>

                    {/* Valor final de envío o motivo de no disponibilidad */}
                    <div className="mt-1.5 pt-1 border-t border-gray-200/80">
                      {quote.available ? (
                        <div>
                          <div className="flex items-baseline justify-between">
                            <span className="text-[9px] text-gray-500 font-medium">Tarifa:</span>
                            <span className="text-xs font-mono font-bold text-blue-900">
                              ${quote.priceClp.toLocaleString('es-CL')} CLP
                            </span>
                          </div>
                        </div>
                      ) : isPaketDisabled ? (
                        <div className="text-[9px] text-gray-600 italic leading-tight">
                          Sin cobertura en esta zona - Solo V Región y RM
                        </div>
                      ) : (
                        <div className="text-[9px] text-red-600 bg-red-50 border border-red-200 p-1 rounded font-medium leading-tight">
                          {quote.unavailableReason || 'No disponible para este destino'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selector de Modalidad de Pago de Envío para Starken y bluexpress */}
            {(shippingCourier === 'Starken' || shippingCourier === 'bluexpress') && selectedQuote && selectedQuote.available && (
              <div className="mt-2.5 bg-blue-50/80 border border-blue-200 p-2 rounded-xs space-y-1.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[11px] font-bold text-blue-950">
                    Modalidad de pago para {shippingCourier}:
                  </span>
                  <span className="text-[10px] text-gray-500">
                    (Selecciona cómo deseas abonar el despacho)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Opción 1: Envío Pagado */}
                  <label
                    onClick={() => setShippingPaymentMode('paid')}
                    className={`p-2 border rounded-xs cursor-pointer flex items-center justify-between transition-all ${
                      shippingPaymentMode === 'paid'
                        ? 'bg-white border-blue-700 shadow-2xs font-bold text-blue-900 ring-1 ring-blue-500'
                        : 'bg-white/70 border-gray-300 text-gray-700 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="shippingPaymentMode"
                        checked={shippingPaymentMode === 'paid'}
                        onChange={() => setShippingPaymentMode('paid')}
                        className="text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="text-[11px] font-bold">Envío Pagado</div>
                        <div className="text-[9px] text-gray-500 font-normal">
                          Se suma al total de la orden hoy
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-blue-900 font-bold">
                      +${selectedQuote.priceClp.toLocaleString('es-CL')}
                    </span>
                  </label>

                  {/* Opción 2: Envío Por Pagar */}
                  <label
                    onClick={() => setShippingPaymentMode('on_delivery')}
                    className={`p-2 border rounded-xs cursor-pointer flex items-center justify-between transition-all ${
                      shippingPaymentMode === 'on_delivery'
                        ? 'bg-white border-blue-700 shadow-2xs font-bold text-blue-900 ring-1 ring-blue-500'
                        : 'bg-white/70 border-gray-300 text-gray-700 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="shippingPaymentMode"
                        checked={shippingPaymentMode === 'on_delivery'}
                        onChange={() => setShippingPaymentMode('on_delivery')}
                        className="text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="text-[11px] font-bold">Envío Por Pagar</div>
                        <div className="text-[9px] text-gray-500 font-normal">
                          Pagas en destino al recibir
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

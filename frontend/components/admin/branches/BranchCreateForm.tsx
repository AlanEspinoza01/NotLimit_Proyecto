import React from 'react';
import {
  Store,
  Plus,
  AlertTriangle,
  Eye,
  EyeOff,
  KeyRound,
  Clock,
  RefreshCw
} from 'lucide-react';
import { BranchScheduleBlock } from '../../../types';
import { BASE_3KG_RATES_FROM_V_REGION } from '../../../services/shippingQuotesEngine';
import { FlexibleScheduleBuilder } from './FlexibleScheduleBuilder';
import { LiveBranchPreviewCard } from './LiveBranchPreviewCard';
import { formatChileanRut } from './branchManagementTypes';

export interface BranchCreateFormProps {
  handleCreateBranch: (e: React.FormEvent) => void;
  region: string;
  setRegion: (val: string) => void;
  availableRegions: string[];
  city: string;
  setCity: (val: string) => void;
  citiesForSelectedRegion: string[];
  customCity: string;
  setCustomCity: (val: string) => void;
  storeNameLabel: string;
  setStoreNameLabel: (val: string) => void;
  streetName: string;
  setStreetName: (val: string) => void;
  streetNumber: string;
  setStreetNumber: (val: string) => void;
  hasNoStreetNumber: boolean;
  setHasNoStreetNumber: (val: boolean) => void;
  apartmentOrUnit: string;
  setApartmentOrUnit: (val: string) => void;
  postalCode: string;
  setPostalCode: (val: string) => void;
  managerName: string;
  setManagerName: (val: string) => void;
  newBranchPhone: string;
  setNewBranchPhone: (val: string) => void;
  newBranchBadge: string;
  setNewBranchBadge: (val: string) => void;
  newBranchScheduleBlocks: BranchScheduleBlock[];
  setNewBranchScheduleBlocks: React.Dispatch<React.SetStateAction<BranchScheduleBlock[]>>;
  newBranchReturnInstructions: string;
  setNewBranchReturnInstructions: (val: string) => void;
  newBranchPreviewCity: string;
  newBranchPreviewName: string;
  newBranchPreviewAddress: string;
  adminEmail: string;
  setAdminEmail: (val: string) => void;
  adminRut: string;
  setAdminRut: (val: string) => void;
  adminPassword: string;
  setAdminPassword: (val: string) => void;
  adminPasswordConfirm: string;
  setAdminPasswordConfirm: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
}

export const BranchCreateForm: React.FC<BranchCreateFormProps> = ({
  handleCreateBranch,
  region,
  setRegion,
  availableRegions,
  city,
  setCity,
  citiesForSelectedRegion,
  customCity,
  setCustomCity,
  storeNameLabel,
  setStoreNameLabel,
  streetName,
  setStreetName,
  streetNumber,
  setStreetNumber,
  hasNoStreetNumber,
  setHasNoStreetNumber,
  apartmentOrUnit,
  setApartmentOrUnit,
  postalCode,
  setPostalCode,
  managerName,
  setManagerName,
  newBranchPhone,
  setNewBranchPhone,
  newBranchBadge,
  setNewBranchBadge,
  newBranchScheduleBlocks,
  setNewBranchScheduleBlocks,
  newBranchReturnInstructions,
  setNewBranchReturnInstructions,
  newBranchPreviewCity,
  newBranchPreviewName,
  newBranchPreviewAddress,
  adminEmail,
  setAdminEmail,
  adminRut,
  setAdminRut,
  adminPassword,
  setAdminPassword,
  adminPasswordConfirm,
  setAdminPasswordConfirm,
  showPassword,
  setShowPassword
}) => {
  return (
    <form
      onSubmit={handleCreateBranch}
      className="bg-[#f0f4f9] border-2 border-[#7f9db9] p-4 space-y-4 text-xs shadow-xs"
    >
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[#0055ea]/20 pb-2">
        <h3 className="font-black text-sm text-[#003c74] flex items-center gap-2">
          <Store className="w-4 h-4 text-[#0055ea] shrink-0" />
          <span>APERTURA DE NUEVA SUCURSAL FÍSICA</span>
        </h3>
        <span className="text-[11px] font-mono text-gray-500 bg-white px-2 py-0.5 border border-gray-300">
          FORMULARIO DE ALTA DE LOCAL
        </span>
      </div>

      {/* SECCIÓN 1: UBICACIÓN Y LOGÍSTICA */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. Región */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Región <span className="text-red-600">*</span>
            </label>
            <select
              value={region}
              onChange={(e) => {
                const newReg = e.target.value;
                setRegion(newReg);
                const cities = Object.keys(BASE_3KG_RATES_FROM_V_REGION[newReg] || {});
                if (cities.length > 0) setCity(cities[0]);
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

          {/* 2. Ciudad / Comuna */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Ciudad / Comuna <span className="text-red-600">*</span>
            </label>
            {citiesForSelectedRegion.length > 0 ? (
              <div className="space-y-1">
                <select
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setCustomCity('');
                  }}
                  className="winxp-input w-full text-xs py-1.5 font-medium bg-white"
                >
                  {citiesForSelectedRegion.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <input
                type="text"
                required
                placeholder="Ej: Viña del Mar"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                className="winxp-input w-full text-xs py-1.5 bg-white"
              />
            )}
          </div>

          {/* Nombre descriptivo del local */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Nombre o Subtítulo del Local
            </label>
            <input
              type="text"
              placeholder="Ej: Mall Marina Studio / Drop Hub Centro"
              value={storeNameLabel}
              onChange={(e) => setStoreNameLabel(e.target.value)}
              className="winxp-input w-full text-xs py-1.5 bg-white"
            />
          </div>
        </div>

        {/* 3. Dirección Física dividida en 4 campos con ADVERTENCIA EXPLÍCITA */}
        <div className="space-y-2 bg-white/70 border border-[#9cb6d6] p-3 rounded-xs">
          <div className="flex items-center justify-between border-b border-gray-200 pb-1.5">
            <span className="text-[11px] font-black text-[#003c74] uppercase">
              Dirección física <span className="text-red-600">*</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Campo 1: Calle * */}
            <div>
              <label className="block text-[11px] font-bold text-gray-800 mb-1">
                Calle <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Av. Libertad"
                value={streetName}
                onChange={(e) => setStreetName(e.target.value)}
                className="winxp-input w-full text-xs py-1.5 bg-white font-medium"
              />
            </div>

            {/* Campo 2: Número + opción "Calle sin número" */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-gray-800">
                  Número {!hasNoStreetNumber && <span className="text-red-600">*</span>}
                </label>
                <label className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-900 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasNoStreetNumber}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasNoStreetNumber(checked);
                      if (checked) {
                        setStreetNumber('');
                      }
                    }}
                    className="cursor-pointer"
                  />
                  <span>Calle sin número</span>
                </label>
              </div>
              <input
                type="text"
                required={!hasNoStreetNumber}
                disabled={hasNoStreetNumber}
                placeholder={hasNoStreetNumber ? 'S/N (Calle sin número)' : 'Ej: 1348'}
                value={hasNoStreetNumber ? '' : streetNumber}
                onChange={(e) => setStreetNumber(e.target.value)}
                className={`winxp-input w-full text-xs py-1.5 font-medium ${
                  hasNoStreetNumber ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'
                }`}
              />
            </div>

            {/* Campo 3: Departamento / Oficina / Casa / etc. (Opcional) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-800 mb-1">
                Departamento / Oficina / Casa / etc. <span className="text-gray-500 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej: Local 204, Nivel 2"
                value={apartmentOrUnit}
                onChange={(e) => setApartmentOrUnit(e.target.value)}
                className="winxp-input w-full text-xs py-1.5 bg-white font-medium"
              />
            </div>

            {/* Campo 4: Código postal (Opcional - solo números, máx 7 caracteres) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-800 mb-1">
                Código postal <span className="text-gray-500 font-normal">(Opcional)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={7}
                placeholder="Solo números (máx. 7)"
                value={postalCode}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, 7);
                  setPostalCode(digitsOnly);
                }}
                className="winxp-input w-full text-xs py-1.5 bg-white font-mono"
              />
            </div>
          </div>

          {/* ADVERTENCIA CRÍTICA OBLIGATORIA */}
          <div className="bg-[#fff9e6] border-l-4 border-amber-500 border-y border-r border-amber-300 p-2.5 rounded-xs flex items-start gap-2 shadow-xs mt-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] text-amber-950 leading-relaxed">
              <span className="font-black text-amber-900 uppercase">
                ⚠️ ADVERTENCIA CRÍTICA:
              </span>{' '}
              Debe ser extremadamente exacto con la dirección física que va a colocar (Calle, Número, Local/Piso).
              <strong className="text-amber-900"> No se puede equivocar</strong>, ya que esta dirección exacta
              será utilizada por los clientes para el retiro presencial de sus prendas en sucursal en 15 minutos,
              y por las agencias de transporte oficiales (Starken, Blue Express y Paket) para el abastecimiento y la
              logística de devolución.
            </div>
          </div>
        </div>

        {/* 4. Jefe de Sucursal + WhatsApp + Insignia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-gray-800 mb-1">
              Nombre Del Jefe de la Sucursal asignado <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Sebastián Valdés (Store Lead)"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="winxp-input w-full text-xs py-1.5 bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-800 mb-1">
              WhatsApp de la Sucursal
            </label>
            <input
              type="text"
              placeholder="Ej: +56 9 8452 1190"
              value={newBranchPhone}
              onChange={(e) => setNewBranchPhone(e.target.value)}
              className="winxp-input w-full text-xs py-1.5 bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-800 mb-1">
              Insignia / Etiqueta en Tarjeta de Retiro
            </label>
            <input
              type="text"
              placeholder="Ej: HUB URBANO PUERTO / HORARIO EXTENDIDO"
              value={newBranchBadge}
              onChange={(e) => setNewBranchBadge(e.target.value)}
              className="winxp-input w-full text-xs py-1.5 bg-white uppercase font-semibold"
            />
          </div>
        </div>

        {/* 5. Constructor Flexible de Horario de Retiro + Vista Previa en Tiempo Real */}
        <div className="bg-white border border-[#9cb6d6] p-3.5 space-y-3 rounded-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#0055ea] shrink-0" />
              <span className="font-black text-xs text-[#003c74] uppercase tracking-wide">
                Configuración Flexible de Días y Horas de Retiro + Vista Previa en Vivo
              </span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-xs flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>Sincronización automática con Horarios_Retiro_Sucursales.exe, Carro, Checkout y Perfil</span>
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            {/* Columna Izquierda: Constructor Flexible */}
            <div className="xl:col-span-7 space-y-3">
              <FlexibleScheduleBuilder
                blocks={newBranchScheduleBlocks}
                onChange={setNewBranchScheduleBlocks}
              />

              <div>
                <label className="block text-[11px] font-bold text-gray-800 mb-1">
                  Nota "Importante" de Retiro / Devolución al pie de la tarjeta:
                </label>
                <input
                  type="text"
                  value={newBranchReturnInstructions}
                  onChange={(e) => setNewBranchReturnInstructions(e.target.value)}
                  placeholder="Ej: Presentar prenda con etiqueta original y N° de Ticket DEV o Boleta en mesón central."
                  className="winxp-input w-full text-xs py-1.5 bg-white"
                />
              </div>
            </div>

            {/* Columna Derecha: Vista Previa Exacta de la Tarjeta */}
            <div className="xl:col-span-5 bg-[#ece9d8] border-2 border-[#0055ea] p-3 rounded-xs space-y-2 shadow-sm">
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
                  className="text-[9px] bg-white/20 !text-white px-1.5 py-0.5 rounded-xs font-mono shrink-0"
                >
                  1:1 REAL
                </span>
              </div>
              <LiveBranchPreviewCard
                badge={newBranchBadge}
                city={newBranchPreviewCity}
                name={newBranchPreviewName}
                address={newBranchPreviewAddress}
                phone={newBranchPhone}
                managerName={managerName || 'Nombre del Encargado'}
                returnInstructions={newBranchReturnInstructions}
                scheduleBlocks={newBranchScheduleBlocks}
                editableInline={true}
                onChangeBadge={setNewBranchBadge}
                onChangeReturnInstructions={setNewBranchReturnInstructions}
                onChangeBlock={(blkId, patch) => {
                  setNewBranchScheduleBlocks((prev) =>
                    prev.map((b) => (b.id === blkId ? { ...b, ...patch } : b))
                  );
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: CREDENCIALES PARA SER ADMIN DE LA SUCURSAL */}
      <div className="bg-white border border-[#9cb6d6] p-3 space-y-3 rounded-xs">
        <div className="flex items-center gap-1.5 border-b border-gray-200 pb-1.5 flex-wrap">
          <KeyRound className="w-4 h-4 text-[#0055ea] shrink-0" />
          <span className="font-black text-xs text-[#003c74] uppercase tracking-wide">
            Credenciales de Acceso (Administrador de la Sucursal)
          </span>
          <span className="text-[10px] text-gray-500 ml-auto font-mono">
            // Credenciales de login institucional
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Correo */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Correo <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="admin.sucursal@nolimits.cl"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="winxp-input w-full text-xs py-1.5"
            />
          </div>

          {/* Rut */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              RUT <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="12.345.678-9"
              value={adminRut}
              onChange={(e) => setAdminRut(formatChileanRut(e.target.value))}
              className="winxp-input w-full text-xs py-1.5 font-mono"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Contraseña <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Mínimo 6 caracteres"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="winxp-input w-full text-xs py-1.5 pr-8 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-800"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirmar la Contraseña */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              Confirmar la Contraseña <span className="text-red-600">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              placeholder="Repita contraseña"
              value={adminPasswordConfirm}
              onChange={(e) => setAdminPasswordConfirm(e.target.value)}
              className={`winxp-input w-full text-xs py-1.5 font-mono ${
                adminPasswordConfirm && adminPasswordConfirm !== adminPassword
                  ? 'border-red-500 bg-red-50'
                  : adminPasswordConfirm && adminPasswordConfirm === adminPassword
                  ? 'border-green-600 bg-green-50'
                  : ''
              }`}
            />
            {adminPasswordConfirm && (
              <span
                className={`text-[10px] font-semibold mt-0.5 block ${
                  adminPasswordConfirm === adminPassword ? 'text-green-700' : 'text-red-600'
                }`}
              >
                {adminPasswordConfirm === adminPassword ? '✓ Coinciden' : '✗ No coinciden'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* BOTÓN DE CREACIÓN / APERTURA */}
      <div className="flex justify-end pt-1">
        <button
          type="submit"
          className="winxp-button winxp-button-primary text-xs py-2 px-5 text-blue-950 font-black flex items-center gap-1.5 shadow-md hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-4 h-4 text-blue-800" />
          <span>APERTURAR NUEVA SUCURSAL FÍSICA</span>
        </button>
      </div>
    </form>
  );
};

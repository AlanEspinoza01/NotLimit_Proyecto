import React from 'react';
import { User, Building2, Truck } from 'lucide-react';
import { Branch } from '../../../types';
import { SHIPPING_COURIERS, formatCLP } from './registerSaleTypes';

interface RegisterSaleCustomerSectionProps {
  clientFirstName: string;
  onChangeClientFirstName: (val: string) => void;
  clientLastName: string;
  onChangeClientLastName: (val: string) => void;
  clientRut: string;
  onChangeClientRut: (val: string) => void;
  clientPhone: string;
  clientPhoneDigitsLength: number;
  onClientPhoneChange: (val: string) => void;
  clientEmail: string;
  onChangeClientEmail: (val: string) => void;
  isBranchAdmin: boolean;
  activeAdminBranchObj: Branch | null;
  currentUserName: string;
  currentUserEmail: string;
  saleOriginBranch: string;
  onChangeSaleOriginBranch: (val: string) => void;
  allBranches: Branch[];
  physicalBranches: Branch[];
  deliveryType: 'retiro' | 'envio';
  onChangeDeliveryType: (type: 'retiro' | 'envio') => void;
  selectedBranch: string;
  onChangeSelectedBranch: (branchId: string) => void;
  allRegions: string[];
  selectedRegion: string;
  onRegionChange: (reg: string) => void;
  currentRegionComunas: string[];
  selectedComuna: string;
  onChangeSelectedComuna: (comuna: string) => void;
  shippingStreet: string;
  onChangeShippingStreet: (val: string) => void;
  shippingNumber: string;
  onShippingNumberChange: (val: string) => void;
  shippingApartment: string;
  onChangeShippingApartment: (val: string) => void;
  shippingPostalCode: string;
  onPostalCodeChange: (val: string) => void;
  shippingInstructions: string;
  onChangeShippingInstructions: (val: string) => void;
  shippingCourier: 'Starken' | 'bluexpress' | 'Paket';
  onChangeShippingCourier: (courier: 'Starken' | 'bluexpress' | 'Paket') => void;
}

export const RegisterSaleCustomerSection: React.FC<RegisterSaleCustomerSectionProps> = ({
  clientFirstName,
  onChangeClientFirstName,
  clientLastName,
  onChangeClientLastName,
  clientRut,
  onChangeClientRut,
  clientPhone,
  clientPhoneDigitsLength,
  onClientPhoneChange,
  clientEmail,
  onChangeClientEmail,
  isBranchAdmin,
  activeAdminBranchObj,
  currentUserName,
  currentUserEmail,
  saleOriginBranch,
  onChangeSaleOriginBranch,
  allBranches,
  physicalBranches,
  deliveryType,
  onChangeDeliveryType,
  selectedBranch,
  onChangeSelectedBranch,
  allRegions,
  selectedRegion,
  onRegionChange,
  currentRegionComunas,
  selectedComuna,
  onChangeSelectedComuna,
  shippingStreet,
  onChangeShippingStreet,
  shippingNumber,
  onShippingNumberChange,
  shippingApartment,
  onChangeShippingApartment,
  shippingPostalCode,
  onPostalCodeChange,
  shippingInstructions,
  onChangeShippingInstructions,
  shippingCourier,
  onChangeShippingCourier
}) => {
  return (
    <div className="bg-white border-2 border-gray-400 p-4 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-blue-700" />
          <span className="font-extrabold text-xs text-[#003c74] uppercase">
            2. Información del Cliente y Modalidad de Entrega
          </span>
        </div>
        <span className="text-[11px] font-mono text-gray-500">
          Datos de Identificación y Destino
        </span>
      </div>

      {/* Datos Personales del Cliente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="space-y-1">
          <label className="font-bold text-gray-800 block">
            Nombres: <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ej: Ignacio Andrés"
            value={clientFirstName}
            onChange={(e) => onChangeClientFirstName(e.target.value)}
            className="w-full winxp-input text-xs py-1.5"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-gray-800 block">
            Apellidos: <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ej: Soto Morales"
            value={clientLastName}
            onChange={(e) => onChangeClientLastName(e.target.value)}
            className="w-full winxp-input text-xs py-1.5"
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-gray-800 block">
            RUT: <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ej: 18.492.381-4"
            value={clientRut}
            onChange={(e) => onChangeClientRut(e.target.value)}
            className="w-full winxp-input text-xs py-1.5 font-mono"
          />
        </div>

        {/* Teléfono / Número de contacto: comienza con '+56 9', autoseparado y numérico máx 8 dígitos */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="font-bold text-gray-800 block">
              Teléfono / Número: <span className="text-red-600">*</span>
            </label>
            <span className="text-[10px] text-gray-500 font-mono">
              {clientPhoneDigitsLength}/8 dígitos
            </span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            required
            maxLength={15}
            placeholder="+56 9 8451 9283"
            value={clientPhone}
            onChange={(e) => onClientPhoneChange(e.target.value)}
            className="w-full winxp-input text-xs py-1.5 font-mono font-bold tracking-wider"
          />
          <span className="text-[10px] text-gray-500 block">
            Prefijo fijo '+56 9' · Autoseparado (máx. 8 dígitos)
          </span>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-gray-800 block">
            Correo Electrónico: <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            required
            placeholder="Ej: ignacio.soto@gmail.com"
            value={clientEmail}
            onChange={(e) => onChangeClientEmail(e.target.value)}
            className="w-full winxp-input text-xs py-1.5"
          />
        </div>
      </div>

      {/* SUCURSAL / CENTRO DE DONDE SE REGISTRA LA VENTA (COLOR PÚRPURA DE AUDITORÍA) */}
      <div className="p-3 bg-purple-50/80 border border-purple-300 space-y-1.5 rounded-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-purple-700" />
            <span>Sucursal / Centro de Donde se Registra la VENTA:</span>
          </label>
          <span className="text-[10px] font-extrabold px-2 py-0.5 bg-purple-200/80 text-purple-950 border border-purple-400 rounded-xs">
            {isBranchAdmin
              ? `✓ ASIGNADO AUTOMÁTICAMENTE AL ADMIN EN SESIÓN: ${currentUserName}`
              : `Admin en sesión: ${currentUserName}`}
          </span>
        </div>

        {isBranchAdmin && activeAdminBranchObj ? (
          <div className="w-full px-3 py-2 font-bold text-xs text-purple-950 bg-white border-2 border-purple-500 rounded-xs flex flex-wrap items-center justify-between gap-2 shadow-inner">
            <span>
              🏪 {activeAdminBranchObj.city} - {activeAdminBranchObj.name} —{' '}
              <strong>Admin que registra la venta: {currentUserName}</strong> ({currentUserEmail})
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-400 px-1.5 py-0.5 rounded-xs font-black uppercase">
              Sucursal Asignada Fija
            </span>
          </div>
        ) : (
          <select
            value={saleOriginBranch}
            onChange={(e) => onChangeSaleOriginBranch(e.target.value)}
            className="w-full winxp-select text-xs py-1.5 font-bold text-purple-950 bg-white border border-purple-400"
          >
            <option value="casa_matriz">
              🏢 Casa Matriz / Central (Corporativo) - Venta Directa Dueño ({currentUserName})
            </option>
            {allBranches
              .filter((b) => b.id !== 'casa_matriz')
              .map((b) => (
                <option key={b.id} value={b.id}>
                  🏪 {b.city} - {b.name} — Admin Encargado: {b.managerName}
                </option>
              ))}
          </select>
        )}

        <p className="text-[10px] text-purple-900 leading-relaxed">
          {isBranchAdmin && activeAdminBranchObj
            ? `Este campo se asignó automáticamente a ${currentUserName} (${activeAdminBranchObj.city} - ${activeAdminBranchObj.name}) para registrar contablemente que la venta pertenece a tu sucursal.`
            : 'Este campo es de máxima importancia porque sirve como registro oficial de auditoría contable para saber exactamente de qué centro o sucursal y administrador provino el ingreso registrado.'}
        </p>
      </div>

      {/* PREFERENCIA DE ENTREGA: RETIRO O ENVÍO */}
      <div className="p-3 bg-[#f8fafc] border border-gray-300 space-y-3">
        <label className="text-xs font-bold text-gray-800 block">
          ¿El cliente prefiere RETIRO O ENVÍO?
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Opción Retiro */}
          <button
            type="button"
            onClick={() => onChangeDeliveryType('retiro')}
            className={`p-3 border-2 text-left flex items-center gap-3 transition-all ${
              deliveryType === 'retiro'
                ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-300 shadow-xs'
                : 'bg-white border-gray-300 hover:border-gray-400'
            }`}
          >
            <Building2 className={`w-5 h-5 shrink-0 ${deliveryType === 'retiro' ? 'text-blue-700' : 'text-gray-500'}`} />
            <div>
              <div className="font-extrabold uppercase text-gray-900">Retiro en Sucursal</div>
              <div className="text-[11px] text-gray-500">
                Sin costo de despacho. Retiro presencial directo en tienda física.
              </div>
            </div>
          </button>

          {/* Opción Envío */}
          <button
            type="button"
            onClick={() => onChangeDeliveryType('envio')}
            className={`p-3 border-2 text-left flex items-center gap-3 transition-all ${
              deliveryType === 'envio'
                ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-300 shadow-xs'
                : 'bg-white border-gray-300 hover:border-gray-400'
            }`}
          >
            <Truck className={`w-5 h-5 shrink-0 ${deliveryType === 'envio' ? 'text-indigo-700' : 'text-gray-500'}`} />
            <div>
              <div className="font-extrabold uppercase text-gray-900">Envío a Domicilio</div>
              <div className="text-[11px] text-gray-500">
                Despacho con Starken, bluexpress o Paket.
              </div>
            </div>
          </button>
        </div>

        {/* EN CASO DE RETIRO: Escoger sucursal física (SIN Casa Matriz) */}
        {deliveryType === 'retiro' && (
          <div className="p-3 bg-white border border-gray-300 space-y-2 animate-fadeIn text-xs">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <label className="font-bold text-blue-900 block">
                {isBranchAdmin ? 'Sucursal Física de Retiro Asignada:' : 'Escoger Sucursal Física de Retiro:'}
              </label>
              <span className="text-[10px] text-gray-500 italic">
                {isBranchAdmin
                  ? '* Asignado a tu sucursal operativa'
                  : '* Casa Matriz no es punto de retiro presencial'}
              </span>
            </div>
            <div className={`grid grid-cols-1 ${isBranchAdmin ? 'sm:grid-cols-1' : 'sm:grid-cols-3'} gap-2`}>
              {(isBranchAdmin && activeAdminBranchObj ? [activeAdminBranchObj] : physicalBranches).map((branch) => (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => {
                    if (!isBranchAdmin) onChangeSelectedBranch(branch.id);
                  }}
                  className={`p-2.5 border text-left rounded-xs transition-all ${
                    selectedBranch === branch.id
                      ? 'bg-blue-100/70 border-blue-600 font-bold text-blue-950'
                      : 'bg-white border-gray-300 hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  <div className="font-extrabold">
                    {branch.city} — {branch.name}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {branch.address}, {branch.city}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* EN CASO DE ENVÍO: Región, Comuna, Calle, Número, Depto, Código Postal, Indicaciones, Couriers */}
        {deliveryType === 'envio' && (
          <div className="p-3 bg-white border border-indigo-200 space-y-3 animate-fadeIn text-xs">
            <div className="font-bold text-indigo-950 border-b border-indigo-100 pb-1">
              Dirección de Despacho y Courier de Envío:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
              {/* Región: actualizada con shippingQuotesEngine.ts y delgado borde negro */}
              <div className="flex flex-col justify-end">
                <label className="font-bold text-gray-800 text-xs h-[28px] flex items-end pb-1 leading-tight">
                  <span>Región:</span>
                  <span className="text-red-600 ml-0.5">*</span>
                </label>
                <select
                  value={selectedRegion}
                  onChange={(e) => onRegionChange(e.target.value)}
                  style={{ border: '1px solid #000000', height: '32px' }}
                  className="w-full winxp-select text-xs h-[32px] font-semibold border border-black"
                >
                  {allRegions.map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              {/* Comuna: actualizada con shippingQuotesEngine.ts y delgado borde negro */}
              <div className="flex flex-col justify-end">
                <label className="font-bold text-gray-800 text-xs h-[28px] flex items-end pb-1 leading-tight">
                  <span>Comuna:</span>
                  <span className="text-red-600 ml-0.5">*</span>
                </label>
                <select
                  value={selectedComuna}
                  onChange={(e) => onChangeSelectedComuna(e.target.value)}
                  style={{ border: '1px solid #000000', height: '32px' }}
                  className="w-full winxp-select text-xs h-[32px] font-semibold border border-black"
                >
                  {currentRegionComunas.map((comuna) => (
                    <option key={comuna} value={comuna}>
                      {comuna}
                    </option>
                  ))}
                </select>
              </div>

              {/* Calle: perfectamente nivelada */}
              <div className="flex flex-col justify-end">
                <label className="font-bold text-gray-800 text-xs h-[28px] flex items-end pb-1 leading-tight">
                  <span>Calle:</span>
                  <span className="text-red-600 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Av. Libertad"
                  value={shippingStreet}
                  onChange={(e) => onChangeShippingStreet(e.target.value)}
                  style={{ height: '32px' }}
                  className="w-full winxp-input text-xs h-[32px] py-1 font-medium"
                />
              </div>

              {/* Campo número de dirección: perfectamente nivelado sin prefijo '+' */}
              <div className="flex flex-col justify-end">
                <label className="font-bold text-gray-800 text-xs h-[28px] flex items-end pb-1 leading-tight">
                  <span>Número:</span>
                  <span className="text-[10px] text-gray-500 font-normal ml-1">(Opcional)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Ej: 1420"
                  value={shippingNumber}
                  onChange={(e) => onShippingNumberChange(e.target.value)}
                  style={{ height: '32px' }}
                  className="w-full winxp-input text-xs h-[32px] py-1 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Departamento / Oficina / Casa */}
              <div className="space-y-1">
                <label className="font-bold text-gray-800 block">
                  Departamento / Oficina / Casa:{' '}
                  <span className="text-[10px] text-gray-500 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Depto 504 Torre B"
                  value={shippingApartment}
                  onChange={(e) => onChangeShippingApartment(e.target.value)}
                  className="w-full winxp-input text-xs py-1.5"
                />
              </div>

              {/* Código postal: numérico con límite estricto de 7 caracteres */}
              <div className="space-y-1">
                <label className="font-bold text-gray-800 block">
                  Código Postal:{' '}
                  <span className="text-[10px] text-gray-500 font-normal">(Máx 7 dígitos)</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={7}
                  placeholder="Ej: 2520000"
                  value={shippingPostalCode}
                  onChange={(e) => onPostalCodeChange(e.target.value)}
                  className="w-full winxp-input text-xs py-1.5 font-mono"
                />
              </div>

              {/* Indicaciones */}
              <div className="space-y-1">
                <label className="font-bold text-gray-800 block">
                  Indicaciones:{' '}
                  <span className="text-[10px] text-gray-500 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Portón negro, tocar timbre 2 veces"
                  value={shippingInstructions}
                  onChange={(e) => onChangeShippingInstructions(e.target.value)}
                  className="w-full winxp-input text-xs py-1.5"
                />
              </div>
            </div>

            {/* Selección de Couriers */}
            <div className="space-y-1.5 pt-1">
              <label className="font-bold text-indigo-950 block">
                Seleccionar Courier de Envío:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SHIPPING_COURIERS.map((courier) => (
                  <button
                    key={courier.id}
                    type="button"
                    onClick={() => onChangeShippingCourier(courier.id as 'Starken' | 'bluexpress' | 'Paket')}
                    className={`p-2.5 border text-left transition-all ${
                      shippingCourier === courier.id
                        ? 'bg-indigo-100/70 border-indigo-600 font-bold text-indigo-950 ring-1 ring-indigo-400'
                        : 'bg-[#fafafa] border-gray-300 hover:bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm">{courier.name}</span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-white border border-indigo-200 px-1 py-0.2">
                        {courier.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-600 mt-0.5">{courier.time}</div>
                    <div className="text-xs font-black text-gray-900 mt-1">{formatCLP(courier.cost)} CLP</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

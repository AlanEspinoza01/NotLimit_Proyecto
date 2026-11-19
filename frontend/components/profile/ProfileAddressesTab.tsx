import React from 'react';
import {
  MapPin,
  X,
  Pencil,
  Plus,
  CheckCircle2,
  Check,
  Trash2
} from 'lucide-react';
import { UserAddress } from './profileTypes';

export interface ProfileAddressesTabProps {
  addresses: UserAddress[];
  editingAddressId: string | null;
  isAddingAddress: boolean;
  addressSuccessMessage: string | null;
  newAddrAlias: string;
  setNewAddrAlias: (val: string) => void;
  newAddrStreet: string;
  setNewAddrStreet: (val: string) => void;
  newAddrNumber: string;
  setNewAddrNumber: (val: string) => void;
  newAddrIsWithoutNumber: boolean;
  setNewAddrIsWithoutNumber: (val: boolean) => void;
  newAddrApt: string;
  setNewAddrApt: (val: string) => void;
  newAddrPostalCode: string;
  setNewAddrPostalCode: (val: string) => void;
  newAddrComuna: string;
  setNewAddrComuna: (val: string) => void;
  newAddrNotes: string;
  setNewAddrNotes: (val: string) => void;
  newAddrIsDefault: boolean;
  setNewAddrIsDefault: (val: boolean) => void;
  setIsAddingAddress: (val: boolean) => void;
  handleToggleEditHeader: () => void;
  handleToggleAddHeader: () => void;
  handleSaveAddress: (e: React.FormEvent) => void;
  handleStartEdit: (addr: UserAddress) => void;
  handleCancelForm: () => void;
  handleSetDefaultAddress: (addressId: string) => void;
  handleDeleteAddress: (addressId: string) => void;
}

export const ProfileAddressesTab: React.FC<ProfileAddressesTabProps> = ({
  addresses,
  editingAddressId,
  isAddingAddress,
  addressSuccessMessage,
  newAddrAlias,
  setNewAddrAlias,
  newAddrStreet,
  setNewAddrStreet,
  newAddrNumber,
  setNewAddrNumber,
  newAddrIsWithoutNumber,
  setNewAddrIsWithoutNumber,
  newAddrApt,
  setNewAddrApt,
  newAddrPostalCode,
  setNewAddrPostalCode,
  newAddrComuna,
  setNewAddrComuna,
  newAddrNotes,
  setNewAddrNotes,
  newAddrIsDefault,
  setNewAddrIsDefault,
  setIsAddingAddress,
  handleToggleEditHeader,
  handleToggleAddHeader,
  handleSaveAddress,
  handleStartEdit,
  handleCancelForm,
  handleSetDefaultAddress,
  handleDeleteAddress
}) => {
  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-300 gap-2">
        <div>
          <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-700" />
            Gestión de Direcciones de Despacho
          </h4>
          <p className="text-[11px] text-gray-500">
            Administra múltiples domicilios y selecciona tu dirección predeterminada para el Checkout.
          </p>
        </div>
        <div className="nl-profile-actions-row flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Botón Editar Dirección a la izquierda */}
          <button
            type="button"
            onClick={handleToggleEditHeader}
            style={
              editingAddressId !== null
                ? {
                    background: 'linear-gradient(180deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
                    borderColor: '#ea580c',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.1)'
                  }
                : {
                    background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 49%, #075985 51%, #0c4a6e 100%)',
                    borderColor: '#082f49',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.3), 0 3px 8px rgba(3,105,161,0.35)',
                    color: '#ffffff'
                  }
            }
            className={`cursor-pointer transition-all duration-150 select-none flex items-center gap-2 rounded-[4px] border-2 active:scale-[0.98] hover:brightness-110 ${
              editingAddressId !== null
                ? 'text-amber-950 py-2 px-3.5 sm:px-4 text-xs sm:text-sm font-bold'
                : 'text-white py-2.5 px-4 sm:px-5 text-xs sm:text-sm font-bold tracking-wide'
            }`}
            title={editingAddressId !== null ? 'Cerrar edición de dirección' : 'Editar tu dirección registrada'}
          >
            {editingAddressId !== null ? (
              <>
                <div className="w-5.5 h-5.5 rounded-full bg-red-100 border border-red-400 flex items-center justify-center shrink-0">
                  <X className="w-3.5 h-3.5 text-red-700 stroke-[3]" />
                </div>
                <span className="font-bold text-amber-950">Cerrar Edición</span>
              </>
            ) : (
              <>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
                    border: '1px solid #cbd5e1',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), 0 1px 2px rgba(0,0,0,0.25)'
                  }}
                >
                  <Pencil className="w-3.5 h-3.5 text-black stroke-[2.5]" style={{ color: '#000000' }} />
                </div>
                <span
                  className="font-extrabold text-xs sm:text-sm tracking-wide"
                  style={{
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.75)'
                  }}
                >
                  Editar Dirección
                </span>
              </>
            )}
          </button>

          {/* Botón Agregar Nueva Dirección a la derecha */}
          <button
            type="button"
            onClick={handleToggleAddHeader}
            style={
              isAddingAddress
                ? {
                    background: 'linear-gradient(180deg, #fff7ed 0%, #ffedd5 50%, #fed7aa 100%)',
                    borderColor: '#ea580c',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.1)'
                  }
                : {
                    background: 'linear-gradient(180deg, #4292f7 0%, #1d6fee 49%, #1257d0 51%, #0b40a8 100%)',
                    borderColor: '#092f7e',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.3), 0 3px 8px rgba(11,64,168,0.35)',
                    color: '#ffffff'
                  }
            }
            className={`cursor-pointer transition-all duration-150 select-none flex items-center gap-2 rounded-[4px] border-2 active:scale-[0.98] hover:brightness-110 ${
              isAddingAddress
                ? 'text-amber-950 py-2 px-3.5 sm:px-4 text-xs sm:text-sm font-bold'
                : 'text-white py-2.5 px-4.5 sm:px-5.5 text-xs sm:text-sm font-bold tracking-wide'
            }`}
            title={isAddingAddress ? 'Cerrar formulario de registro' : 'Abrir formulario para registrar nueva dirección'}
          >
            {isAddingAddress ? (
              <>
                <div className="w-5.5 h-5.5 rounded-full bg-red-100 border border-red-400 flex items-center justify-center shrink-0">
                  <X className="w-3.5 h-3.5 text-red-700 stroke-[3]" />
                </div>
                <span className="font-bold text-amber-950">Cerrar Formulario</span>
              </>
            ) : (
              <>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
                    border: '1px solid #cbd5e1',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), 0 1px 2px rgba(0,0,0,0.25)'
                  }}
                >
                  <Plus className="w-3.5 h-3.5 text-black stroke-[3.5]" style={{ color: '#000000' }} />
                </div>
                <span
                  className="font-extrabold text-xs sm:text-sm tracking-wide"
                  style={{
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.75)'
                  }}
                >
                  Agregar Nueva Dirección
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notificación de éxito */}
      {addressSuccessMessage && (
        <div className="p-2.5 bg-green-100 border border-green-500 text-green-900 text-xs flex items-center gap-2 rounded-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
          <span className="font-bold">{addressSuccessMessage}</span>
        </div>
      )}

      {/* Banner Informativo de Auto-Rellenado en Checkout */}
      <div className="p-3 bg-blue-50 border border-blue-300 text-xs flex items-start gap-2.5 winxp-bevel-in">
        <div className="p-1 bg-blue-100 border border-blue-400 text-blue-800 rounded-xs shrink-0 mt-0.5">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-gray-800">
          <div className="font-bold text-blue-900 text-[11px]">
            Sincronización Directa con Pasarela de Compra
          </div>
          <div className="text-[11px] text-gray-600 leading-relaxed">
            La dirección marcada como <strong className="text-green-800 font-bold">"Predeterminada"</strong> se inyecta automáticamente en los campos de entrega del <strong>Checkout</strong> al seleccionar despacho a domicilio, agilizando tu compra sin tener que volver a escribirla.
          </div>
        </div>
      </div>

      {/* Formulario para Registrar o Editar Dirección */}
      {(isAddingAddress || editingAddressId !== null) && (
        <form
          onSubmit={handleSaveAddress}
          className="p-4 bg-[#f0f4f8] border-2 border-blue-500 space-y-3.5 winxp-bevel-out shadow-md"
        >
          <div className="font-bold text-xs text-blue-950 flex flex-wrap items-center justify-between border-b border-blue-300 pb-2 gap-2">
            <div className="flex items-center gap-1.5">
              {editingAddressId ? (
                <>
                  <Pencil className="w-4 h-4 text-blue-700 stroke-[2.5]" />
                  <span className="text-sm">Editar Dirección de Entrega</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-blue-700 stroke-[3]" />
                  <span className="text-sm">Registrar Nueva Dirección de Entrega</span>
                </>
              )}
            </div>

            {editingAddressId && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-600 font-normal">Editando:</span>
                {addresses.length > 1 ? (
                  <select
                    value={editingAddressId}
                    onChange={(e) => {
                      const found = addresses.find(a => a.id === e.target.value);
                      if (found) handleStartEdit(found);
                    }}
                    className="winxp-input py-0.5 px-1.5 bg-white font-semibold text-blue-950 text-xs"
                  >
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.alias || `${a.street} #${a.number}`} {a.isDefault ? '★' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 border border-blue-200 rounded-xs">
                    {addresses.find(a => a.id === editingAddressId)?.alias || `${addresses[0]?.street} #${addresses[0]?.number}`}
                  </span>
                )}
              </div>
            )}

            <span className="text-[10px] text-gray-500 font-normal">
              * Campos obligatorios
            </span>
          </div>

          <div className="nl-profile-form-grid grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* 1. Nombre o Alias de la Dirección (máx 30 caracteres) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-800">
                  Nombre o Alias de la Dirección: <span className="text-red-600">*</span>
                </label>
                <span className={`text-[10px] font-mono ${newAddrAlias.length >= 30 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                  {newAddrAlias.length} / 30 caracteres
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={30}
                value={newAddrAlias}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[\r\n]+/g, ' ').slice(0, 30);
                  setNewAddrAlias(clean);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                placeholder="Ej. Casa Principal, Depto Viña, Oficina"
                className="winxp-input w-full text-xs py-1.5 font-medium"
              />
              <span className="text-[10px] text-gray-500">Un nombre corto y reconocible para identificar este domicilio (máx. 30 caracteres).</span>
            </div>

            {/* 3. Calle / Avenida (máx 650 caracteres, sin saltos) y Número (numérico, máx 50 caracteres) con opción Calle sin número */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="sm:col-span-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-800">
                    Calle / Avenida: <span className="text-red-600">*</span>
                  </label>
                  <span className={`text-[10px] font-mono ${newAddrStreet.length >= 650 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                    {newAddrStreet.length} / 650 caracteres
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={650}
                  value={newAddrStreet}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[\r\n]+/g, ' ').slice(0, 650);
                    setNewAddrStreet(clean);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault();
                  }}
                  placeholder="Ej. Av. Libertad, Calle Prat, Los Carrera"
                  className="winxp-input w-full text-xs py-1.5"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-800">
                    Número: {!newAddrIsWithoutNumber && <span className="text-red-600">*</span>}
                  </label>
                  {!newAddrIsWithoutNumber && (
                    <span className={`text-[10px] font-mono ${newAddrNumber.length >= 50 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                      {newAddrNumber.length} / 50
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  required={!newAddrIsWithoutNumber}
                  disabled={newAddrIsWithoutNumber}
                  maxLength={50}
                  value={newAddrIsWithoutNumber ? 'S/N' : newAddrNumber}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 50);
                    setNewAddrNumber(clean);
                  }}
                  placeholder={newAddrIsWithoutNumber ? 'S/N' : 'Ej. 1250'}
                  className={`winxp-input w-full text-xs py-1.5 font-mono ${
                    newAddrIsWithoutNumber ? 'bg-gray-100 text-gray-700 font-bold cursor-not-allowed' : ''
                  }`}
                />
                <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer text-[11px] text-gray-700 select-none hover:text-blue-900">
                  <input
                    type="checkbox"
                    checked={newAddrIsWithoutNumber}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setNewAddrIsWithoutNumber(checked);
                      if (checked) {
                        setNewAddrNumber('S/N');
                      } else {
                        setNewAddrNumber('');
                      }
                    }}
                    className="winxp-checkbox"
                  />
                  <span className="font-semibold text-[11px]">Calle sin número (S/N)</span>
                </label>
              </div>
            </div>

            {/* 4. Departamento / Oficina / Casa / etc. (Opcional, máx 650 caracteres) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-800">
                  Departamento / Oficina / Casa / etc.: <span className="text-[11px] text-gray-500 font-normal">(Opcional)</span>
                </label>
                <span className={`text-[10px] font-mono ${newAddrApt.length >= 650 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                  {newAddrApt.length} / 650 caracteres
                </span>
              </div>
              <input
                type="text"
                maxLength={650}
                value={newAddrApt}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[\r\n]+/g, ' ').slice(0, 650);
                  setNewAddrApt(clean);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                placeholder="Ej. Depto 402, Torre B, Casa 14"
                className="winxp-input w-full text-xs py-1.5"
              />
            </div>

            {/* 5. Código postal (Opcional, numérico máx 7 caracteres) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-800">
                  Código postal: <span className="text-[11px] text-gray-500 font-normal">(Opcional)</span>
                </label>
                <span className={`text-[10px] font-mono ${newAddrPostalCode.length >= 7 ? 'text-blue-700 font-bold' : 'text-gray-500'}`}>
                  {newAddrPostalCode.length} / 7 dígitos
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={7}
                value={newAddrPostalCode}
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, '').slice(0, 7);
                  setNewAddrPostalCode(clean);
                }}
                placeholder="Ej. 2520000"
                className="winxp-input w-full text-xs py-1.5 font-mono"
              />
              <span className="text-[10px] text-gray-500">7 dígitos numéricos oficiales de CorreosChile.</span>
            </div>

            {/* 6. Comuna / Ciudad */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-gray-800 mb-1">
                Comuna / Ciudad: <span className="text-red-600">*</span>
              </label>
              <select
                value={newAddrComuna}
                onChange={(e) => setNewAddrComuna(e.target.value)}
                className="winxp-input w-full text-xs py-1.5 bg-white font-medium"
              >
                <option value="Viña del Mar">Viña del Mar (Región de Valparaíso)</option>
                <option value="Valparaíso">Valparaíso (Región de Valparaíso)</option>
                <option value="Quilpué">Quilpué (Región de Valparaíso)</option>
                <option value="Villa Alemana">Villa Alemana (Región de Valparaíso)</option>
                <option value="Concón">Concón (Región de Valparaíso)</option>
                <option value="Santiago">Santiago (Región Metropolitana)</option>
                <option value="Providencia">Providencia (Región Metropolitana)</option>
                <option value="Las Condes">Las Condes (Región Metropolitana)</option>
                <option value="Concepción">Concepción (Región del Biobío)</option>
                <option value="Otra Comuna">Otra Comuna (Chile)</option>
              </select>
            </div>

            {/* 7. Instrucciones para Despachador (Opcional, máx 650 caracteres) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-800">
                  Instrucciones para Despachador: <span className="text-[11px] text-gray-500 font-normal">(Opcional)</span>
                </label>
                <span className={`text-[10px] font-mono ${newAddrNotes.length >= 650 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                  {newAddrNotes.length} / 650 caracteres
                </span>
              </div>
              <input
                type="text"
                maxLength={650}
                value={newAddrNotes}
                onChange={(e) => {
                  const clean = e.target.value.replace(/[\r\n]+/g, ' ').slice(0, 650);
                  setNewAddrNotes(clean);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                placeholder="Ej. Timbre rojo, dejar con conserje en conserjería torre B"
                className="winxp-input w-full text-xs py-1.5"
              />
            </div>
          </div>

          <div className="pt-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-gray-300">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-blue-900 select-none">
              <input
                type="checkbox"
                checked={newAddrIsDefault}
                onChange={(e) => setNewAddrIsDefault(e.target.checked)}
                className="winxp-checkbox"
              />
              <span>Establecer como dirección predeterminada para el Checkout</span>
            </label>

            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCancelForm}
                className="winxp-button text-xs py-1.5 px-3.5 text-gray-700 cursor-pointer hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="winxp-button winxp-button-primary text-xs py-1.5 px-5 font-bold text-blue-900 cursor-pointer shadow-xs"
              >
                {editingAddressId ? 'Guardar Cambios' : 'Guardar Dirección'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Lista de Direcciones Guardadas */}
      <div className="space-y-3">
        <div className="text-[11px] font-bold text-gray-700 flex flex-wrap items-center justify-between gap-1">
          <span>Direcciones Guardadas ({addresses.length}):</span>
          <span className="text-[10px] text-gray-500 font-mono">
            Haz clic en "Establecer como Predeterminada" para elegir cuál enviar al Checkout
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {addresses.length === 0 ? (
            <div className="p-8 text-center bg-white border border-gray-300 winxp-bevel-out space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-700 shadow-inner">
                <MapPin className="w-6 h-6" />
              </div>
              <p className="text-xs text-gray-800 font-bold">No tienes direcciones guardadas actualmente.</p>
              <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                Agrega tu primera dirección para disponer de despacho expedito en tus compras.
              </p>
              <button
                type="button"
                onClick={() => setIsAddingAddress(true)}
                style={{
                  background: 'linear-gradient(180deg, #4292f7 0%, #1d6fee 49%, #1257d0 51%, #0b40a8 100%)',
                  borderColor: '#092f7e',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.3), 0 3px 8px rgba(11,64,168,0.35)',
                  color: '#ffffff'
                }}
                className="cursor-pointer transition-all duration-150 select-none inline-flex items-center gap-2.5 rounded-[4px] border-2 active:scale-[0.98] hover:brightness-110 py-2.5 px-6 text-xs sm:text-sm font-bold tracking-wide"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
                    border: '1px solid #cbd5e1',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,1), 0 1px 2px rgba(0,0,0,0.25)'
                  }}
                >
                  <Plus className="w-3.5 h-3.5 text-black stroke-[3.5]" style={{ color: '#000000' }} />
                </div>
                <span
                  className="font-extrabold text-xs sm:text-sm tracking-wide"
                  style={{
                    color: '#ffffff',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.75)'
                  }}
                >
                  Agregar Nueva Dirección
                </span>
              </button>
            </div>
          ) : (
            addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-3.5 border transition-all rounded-xs winxp-bevel-out ${
                  addr.isDefault
                    ? 'bg-[#f4fbf7] border-green-600 shadow-xs'
                    : 'bg-white border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-blue-900">
                      {addr.alias || `${addr.street} #${addr.number}`}
                    </span>
                    {addr.isDefault ? (
                      <span
                        style={{
                          background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)',
                          borderColor: '#14532d',
                          color: '#ffffff'
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 border rounded-xs shadow-xs"
                      >
                        <Check className="w-3 h-3" style={{ color: '#ffffff' }} />
                        <span style={{ color: '#ffffff' }}>★ PREDETERMINADA PARA CHECKOUT</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="winxp-button text-[11px] py-0.5 px-2 font-bold text-blue-900 hover:bg-blue-100 cursor-pointer"
                        title="Al marcarla, se auto-rellenará en tu próximo checkout"
                      >
                        Establecer como Predeterminada
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="winxp-button text-xs py-0.5 px-2 text-red-700 hover:text-red-900 cursor-pointer flex items-center gap-1"
                      title="Eliminar esta dirección"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>

                {/* Detalles de la Dirección */}
                <div className="pt-2 text-xs space-y-1 text-gray-700">
                  <div>
                    <strong className="text-gray-900">{addr.recipientName}</strong>
                    {addr.phone && (
                      <span className="text-gray-500 font-mono text-[11px] ml-2">({addr.phone})</span>
                    )}
                  </div>
                  <div className="text-gray-800 font-medium">
                    {addr.street} #{addr.number} {addr.apartment && `· ${addr.apartment}`}
                  </div>
                  <div className="text-gray-600">
                    {addr.comuna}, {addr.city} · {addr.region} {addr.postalCode && `(CP: ${addr.postalCode})`}
                  </div>
                  {addr.notes && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-xs inline-block mt-1">
                      Nota: {addr.notes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Settings,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  Image as ImageIcon,
  Upload,
  Sparkles,
  Save
} from 'lucide-react';
import {
  PRESET_AVATARS,
  formatRutWithDotsAndDash,
  formatChileanMobilePhone
} from './profileTypes';

interface ProfileSettingsTabProps {
  currentUser: {
    id: string;
    name: string;
    firstName?: string;
    lastName?: string;
    rut?: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
  profileFirstName: string;
  setProfileFirstName: (val: string) => void;
  profileLastName: string;
  setProfileLastName: (val: string) => void;
  profileRut: string;
  setProfileRut: (val: string) => void;
  profileEmail: string;
  setProfileEmail: (val: string) => void;
  profilePhone: string;
  setProfilePhone: (val: string) => void;
  profileAvatarUrl: string;
  setProfileAvatarUrl: (val: string) => void;
  profileSuccessMsg: string | null;
  profileErrorMsg: string | null;
  handleFirstNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLastNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRutChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAvatarFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSaveProfile: (e: React.FormEvent) => void;
}

export const ProfileSettingsTab: React.FC<ProfileSettingsTabProps> = ({
  currentUser,
  profileFirstName,
  setProfileFirstName,
  profileLastName,
  setProfileLastName,
  profileRut,
  setProfileRut,
  profileEmail,
  setProfileEmail,
  profilePhone,
  setProfilePhone,
  profileAvatarUrl,
  setProfileAvatarUrl,
  profileSuccessMsg,
  profileErrorMsg,
  handleFirstNameChange,
  handleLastNameChange,
  handleRutChange,
  handlePhoneChange,
  handleAvatarFileUpload,
  handleSaveProfile
}) => {
  return (
    <div className="space-y-4">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-gray-300 gap-2">
        <div>
          <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-blue-700" />
            Configuración del Perfil de Usuario
          </h4>
          <p className="text-[11px] text-gray-500">
            Actualiza tu información personal, documento oficial de despacho y foto de perfil.
          </p>
        </div>
        <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-900 px-2 py-0.5 border border-blue-400 self-start sm:self-auto">
          ID: {currentUser.id}
        </span>
      </div>

      {/* Mensaje de Éxito */}
      {profileSuccessMsg && (
        <div className="p-3 bg-green-100 border border-green-500 text-green-950 text-xs flex items-center gap-2 rounded-xs animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0" />
          <span className="font-bold">{profileSuccessMsg}</span>
        </div>
      )}

      {/* Mensaje de Error */}
      {profileErrorMsg && (
        <div className="p-3 bg-red-100 border border-red-500 text-red-950 text-xs flex items-center gap-2 rounded-xs animate-in fade-in shadow-xs">
          <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
          <span className="font-bold">{profileErrorMsg}</span>
        </div>
      )}

      {/* Banner de Sincronización Automática con Despacho y Checkout */}
      <div className="p-3 bg-blue-50 border border-blue-300 text-xs flex items-start gap-2.5 winxp-bevel-in">
        <div className="p-1 bg-blue-100 border border-blue-400 text-blue-800 rounded-xs shrink-0 mt-0.5">
          <UserIcon className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-gray-800">
          <div className="font-bold text-blue-950 text-[11px]">
            Sincronización Directa con Envíos y Boleta Electrónica
          </div>
          <div className="text-[11px] text-gray-600 leading-relaxed">
            El <strong className="text-blue-900">RUT es obligatorio</strong> por normativa del Servicio de Impuestos Internos (SII) y por los operadores logísticos <strong>(Starken y Blue Express)</strong> para la emisión de la boleta y la entrega o retiro presencial de tus prendas.
          </div>
        </div>
      </div>

      {/* Formulario de Perfil */}
      <form onSubmit={handleSaveProfile} className="space-y-4">
        {/* SECCIÓN 1: FOTO DE PERFIL */}
        <div className="p-3.5 bg-[#f8fafc] border border-gray-300 space-y-3 winxp-bevel-out">
          <div className="font-bold text-xs text-blue-900 flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
            <ImageIcon className="w-4 h-4 text-blue-700" />
            <span>Foto de Perfil del Usuario:</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Vista previa de la foto actual */}
            <div className="relative shrink-0 text-center">
              <div className="w-20 h-20 border-2 border-blue-900 bg-white shadow-md flex items-center justify-center overflow-hidden winxp-bevel-out mx-auto">
                {profileAvatarUrl ? (
                  <img
                    src={profileAvatarUrl}
                    alt="Foto de perfil actual"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl">🦆</span>
                )}
              </div>
              <span className="text-[9px] font-bold text-gray-500 mt-1 block uppercase tracking-wider">
                Foto Actual
              </span>
            </div>

            {/* Botones para cambiar la foto */}
            <div className="space-y-2.5 flex-1 text-xs w-full">
              <div className="flex flex-wrap items-center gap-2">
                <label className="winxp-button text-xs py-1.5 px-3 cursor-pointer flex items-center gap-1.5 font-bold text-blue-900 bg-white hover:bg-gray-50 shadow-xs">
                  <Upload className="w-3.5 h-3.5 text-blue-700" />
                  <span>Subir Foto desde tu Equipo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() =>
                    setProfileAvatarUrl(
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                    )
                  }
                  className="winxp-button text-xs py-1.5 px-2.5 text-gray-700 cursor-pointer"
                  title="Restablecer a avatar por defecto"
                >
                  Restablecer Avatar
                </button>
              </div>

              {/* Colección de Avatares Streetwear Y2K listos con 1 clic */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span>O escoge un avatar de la colección NoLimits Y2K / Streetwear:</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setProfileAvatarUrl(preset.url)}
                      className={`w-10 h-10 border-2 rounded-xs overflow-hidden cursor-pointer transition-all ${
                        profileAvatarUrl === preset.url
                          ? 'border-blue-600 ring-2 ring-blue-300 scale-105 shadow-sm'
                          : 'border-gray-300 hover:border-gray-500 opacity-80 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: INFORMACIÓN PERSONAL Y DE ENVÍO */}
        <div className="p-3.5 bg-white border border-gray-300 space-y-3 winxp-bevel-out">
          <div className="font-bold text-xs text-blue-900 flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
            <UserIcon className="w-4 h-4 text-blue-700" />
            <span>Datos Personales y Documento Oficial:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            {/* Nombre - Máximo 50 caracteres */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-800">
                  Nombre: <span className="text-red-600 font-bold">*</span>
                </label>
                <span className="text-[10px] text-gray-500 font-mono">
                  {profileFirstName.length}/50
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={50}
                value={profileFirstName}
                onChange={handleFirstNameChange}
                placeholder="Ej. Valeria"
                className="winxp-input w-full text-xs py-1.5 bg-white"
              />
            </div>

            {/* Apellido - Máximo 50 caracteres */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-800">
                  Apellido: <span className="text-red-600 font-bold">*</span>
                </label>
                <span className="text-[10px] text-gray-500 font-mono">
                  {profileLastName.length}/50
                </span>
              </div>
              <input
                type="text"
                required
                maxLength={50}
                value={profileLastName}
                onChange={handleLastNameChange}
                placeholder="Ej. Gallardo"
                className="winxp-input w-full text-xs py-1.5 bg-white"
              />
            </div>

            {/* RUT (Separación automática con "." y "-") */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-blue-950 flex items-center gap-1">
                  <span>RUT:</span>
                  <span className="text-red-600 font-bold">*</span>
                </label>
                <span className="text-[10px] text-gray-500 font-mono font-bold">
                  {profileRut.replace(/[^0-9kK]/g, '').length}/9 dígitos
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={12}
                value={profileRut}
                onChange={handleRutChange}
                placeholder="Ej. 19.876.543-2"
                className="winxp-input w-full text-xs py-1.5 bg-white font-mono font-bold tracking-wider"
              />
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[10px] text-gray-500">
                  Separación automática con &quot;.&quot; y &quot;-&quot; (ej: 19.876.543-2).
                </span>
                <span className="text-[9px] font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 border border-amber-400">
                  Obligatorio para envíos
                </span>
              </div>
            </div>

            {/* Correo */}
            <div>
              <label className="block font-bold text-gray-800 mb-1">
                Correo Electrónico: <span className="text-red-600 font-bold">*</span>
              </label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="valeria.cyber@gmail.com"
                className="winxp-input w-full text-xs py-1.5 bg-white"
              />
              <span className="text-[10px] text-gray-500 mt-0.5 block">
                Recibirás confirmaciones de compra y boletas del drop.
              </span>
            </div>

            {/* Teléfono Móvil - Separación automática (ejemplo: 9 5689 6328) */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-gray-800">
                  Teléfono Móvil: <span className="text-red-600 font-bold">*</span>
                </label>
                <span className="text-[10px] text-gray-500 font-mono font-bold">
                  {profilePhone.replace(/\D/g, '').length}/9 dígitos
                </span>
              </div>
              <div className="flex gap-2">
                <span className="winxp-input bg-gray-100 text-gray-700 px-2 py-1.5 font-mono text-xs select-none flex items-center shrink-0 border border-gray-300">
                  🇨🇱 +56
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  required
                  maxLength={11}
                  value={profilePhone}
                  onChange={handlePhoneChange}
                  placeholder="Ej. 9 5689 6328"
                  className="winxp-input flex-1 text-xs py-1.5 bg-white font-mono tracking-wider font-semibold"
                />
              </div>
              <span className="text-[10px] text-gray-500 mt-0.5 block">
                Separación automática de números (ejemplo: 9 5689 6328). Notificación de despacho o retiro.
              </span>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-gray-300">
          <button
            type="button"
            onClick={() => {
              if (currentUser) {
                const rawFirst = currentUser.firstName || (currentUser.name || '').split(' ')[0] || '';
                const rawLast = currentUser.lastName || (currentUser.name || '').split(' ').slice(1).join(' ') || '';
                setProfileFirstName(rawFirst.slice(0, 50));
                setProfileLastName(rawLast.slice(0, 50));
                setProfileRut(formatRutWithDotsAndDash(currentUser.rut || '198765432'));
                setProfileEmail(currentUser.email || '');
                setProfilePhone(formatChileanMobilePhone(currentUser.phone || '956896328'));
                setProfileAvatarUrl(currentUser.avatarUrl || '');
              }
            }}
            className="winxp-button text-xs py-1.5 px-3 text-gray-700 cursor-pointer w-full sm:w-auto"
          >
            Descartar Cambios
          </button>
          <button
            type="submit"
            className="winxp-button winxp-button-primary text-xs py-2 px-5 font-bold text-blue-900 flex items-center justify-center gap-2 cursor-pointer shadow-md w-full sm:w-auto"
          >
            <Save className="w-4 h-4 text-blue-700" />
            <span>Guardar Cambios de Perfil</span>
          </button>
        </div>
      </form>
    </div>
  );
};

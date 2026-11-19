import React from 'react';
import { User, AlertCircle } from 'lucide-react';

export interface CartCustomerStep1Props {
  customerFirstName: string;
  handleFirstNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customerLastName: string;
  handleLastNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customerRutRaw: string;
  formattedRut: string;
  handleRutChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customerPhoneDigits: string;
  formattedPhoneInput: string;
  handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customerEmail: string;
  setCustomerEmail: (val: string) => void;
  emailError: string;
  setEmailError: (val: string) => void;
  errorMessage: string;
  setErrorMessage: (val: string) => void;
}

export const CartCustomerStep1: React.FC<CartCustomerStep1Props> = ({
  customerFirstName,
  handleFirstNameChange,
  customerLastName,
  handleLastNameChange,
  customerRutRaw,
  formattedRut,
  handleRutChange,
  customerPhoneDigits,
  formattedPhoneInput,
  handlePhoneChange,
  customerEmail,
  setCustomerEmail,
  emailError,
  setEmailError,
  errorMessage,
  setErrorMessage
}) => {
  return (
    <div className="border border-gray-400 bg-white p-3 space-y-2.5 winxp-bevel-out text-xs">
      <div className="font-bold text-blue-900 pb-1 border-b border-gray-300 flex items-center gap-1.5">
        <User className="w-3.5 h-3.5 text-blue-700" />
        <span>PASO 1: DATOS DEL TITULAR DE LA COMPRA</span>
      </div>

      <div className="space-y-2.5">
        {/* 1. Nombres y Apellidos separados (sin caracteres especiales para evitar inyección SQL) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-gray-700 block mb-0.5">
              Nombres:
            </label>
            <input
              type="text"
              value={customerFirstName}
              onChange={handleFirstNameChange}
              placeholder="Ej. Valeria"
              className="winxp-input w-full text-xs py-1 px-2"
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-700 block mb-0.5">
              Apellidos:
            </label>
            <input
              type="text"
              value={customerLastName}
              onChange={handleLastNameChange}
              placeholder="Ej. Gallardo Contreras"
              className="winxp-input w-full text-xs py-1 px-2"
              required
            />
          </div>
        </div>
        <div className="text-[10px] text-gray-500 font-mono -mt-1.5">
          (Solo letras y espacios, sin caracteres especiales para evitar inyección SQL)
        </div>

        {/* 2. Campo RUT (permite 0-9 y letra 'k' o 'K' como dígito verificador al final) */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[11px] font-semibold text-gray-700">
              RUT:
            </label>
            <span className="text-[10px] text-gray-500 font-mono">
              {customerRutRaw.length}/9 caracteres
            </span>
          </div>
          <input
            type="text"
            value={formattedRut}
            onChange={handleRutChange}
            placeholder="Ej. 12.345.678-K"
            maxLength={12}
            className="winxp-input w-full text-xs py-1 px-2 font-mono tracking-wider focus:outline-none"
            required
          />
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
            (Formato automático con puntos y guion. Acepta números 0-9 y dígito verificador K al final)
          </div>
        </div>

        {/* 2. Teléfono chileno con "+56 9" en el texto, numérico y con autoseparación */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[11px] font-semibold text-gray-700">
              Teléfono:
            </label>
            <span className="text-[10px] text-gray-500 font-mono">
              {customerPhoneDigits.length}/8 dígitos
            </span>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            value={formattedPhoneInput}
            onChange={handlePhoneChange}
            placeholder="+56 9 1234 5678"
            maxLength={15}
            className="winxp-input w-full text-xs py-1 px-2 font-mono tracking-wider focus:outline-none"
            required
          />
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
            (Solo teléfonos chilenos +56 9 · Campo numérico con autoseparación)
          </div>
        </div>

        {/* 3. Correo electrónico (debe terminar con @gmail.com) */}
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[11px] font-semibold text-gray-700">
              Correo electrónico:
            </label>
          </div>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => {
              setCustomerEmail(e.target.value);
              if (emailError) {
                setEmailError('');
              }
              if (errorMessage.toLowerCase().includes('correo')) {
                setErrorMessage('');
              }
            }}
            placeholder="ejemplo@gmail.com"
            className={`winxp-input w-full text-xs py-1 px-2 ${
              emailError
                ? 'border-red-500 bg-red-50/50 text-red-950 focus:border-red-600'
                : ''
            }`}
            required
          />
          {emailError && (
            <div className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>{emailError} (debe terminar con @gmail.com)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

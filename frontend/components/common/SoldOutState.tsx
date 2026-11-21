import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, Lock, Send, UserCheck, Mail, User as UserIcon, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SoldOutDetailBannerProps {
  productTitle: string;
  sku: string;
}

/**
 * SoldOutDetailBanner: Componente de estado "Sin Stock" para la ficha de producto.
 * Muestra la etiqueta de prenda agotada en blanco sobre rojo y el botón
 * "Solicitud de Producto Agotado" que despliega el formulario al hacer clic.
 */
export const SoldOutDetailBanner: React.FC<SoldOutDetailBannerProps> = ({
  productTitle,
  sku,
}) => {
  const { currentUser, isAuthenticated } = useAuth();
  // El estado de sesión puede ser nulo durante carga o cierre de sesión.
  // No asumimos que isAuthenticated implica que currentUser ya exista.
  const authenticatedUser = isAuthenticated && currentUser && currentUser.role !== 'guest'
    ? currentUser
    : null;
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [requestText, setRequestText] = useState('');

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authenticatedUser || !requestText.trim()) return;

    try {
      const existingRaw = localStorage.getItem('nl_soldout_requests');
      const existing = existingRaw ? JSON.parse(existingRaw) : [];
      existing.unshift({
        id: `req_so_${Date.now()}`,
        sku,
        productTitle,
        userId: authenticatedUser.id,
        userName: authenticatedUser.name,
        userEmail: authenticatedUser.email,
        requestMessage: requestText.trim(),
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem('nl_soldout_requests', JSON.stringify(existing));
    } catch {
      // ignore storage errors
    }

    setSubmitted(true);
  };

  return (
    <div className="bg-red-50 border-2 border-red-500 winxp-bevel-out p-3.5 space-y-3 font-sans">
      {/* Mensaje de estado */}
      <div className="space-y-1.5 text-left">
        <div
          data-force-white="true"
          className="sold-out-temp-badge inline-flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-xs uppercase tracking-wider shadow-xs"
          style={{ color: '#ffffff' }}
        >
          <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#ffffff', stroke: '#ffffff' }} />
          <span style={{ color: '#ffffff' }}>Prenda Agotada Temporalmente</span>
        </div>
        <p className="text-xs text-gray-700 leading-tight">
          Todas las unidades de <strong>{productTitle}</strong> (SKU: {sku}) han sido reservadas o despachadas. La confección del siguiente lote se informará por Live Stream.
        </p>
      </div>

      {/* Botón para abrir el formulario de Solicitud de Producto Agotado */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setIsFormOpen((prev) => !prev)}
          className={`winxp-button text-xs py-2 px-4 w-full font-bold flex items-center justify-between gap-2 cursor-pointer shadow-sm transition-all ${
            isFormOpen ? 'winxp-button-primary bg-blue-50 text-blue-900' : 'text-blue-900 hover:bg-gray-100'
          }`}
        >
          <span className="flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-blue-700" />
            <span>Solicitud de Producto Agotado</span>
          </span>
          {isFormOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-700" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-700" />
          )}
        </button>

        {/* Formulario desplegable al dar clic en el botón */}
        {isFormOpen && (
          <div className="bg-white border border-gray-300 p-3 text-xs space-y-2.5 animate-in fade-in">
            <div className="font-bold text-gray-900 flex items-center justify-between border-b border-gray-200 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-700" />
                <span>Formulario: Solicitud de Producto Agotado</span>
              </div>
              <div className="flex items-center gap-2">
                {authenticatedUser && (
                  <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-300 px-1.5 py-0.5 rounded-xs flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    Cliente Verificado
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-gray-500 hover:text-gray-800 p-0.5 cursor-pointer"
                  title="Cerrar formulario"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {!authenticatedUser ? (
              <div className="bg-amber-50 border border-amber-300 p-2.5 rounded-xs space-y-2 text-gray-800">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    Para rellenar el formulario de <strong>Solicitud de Producto Agotado</strong> debes estar registrado e iniciar sesión en tu cuenta.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/auth')}
                  className="winxp-button winxp-button-primary text-xs py-1.5 px-3 font-bold text-blue-900 w-full sm:w-auto cursor-pointer"
                >
                  Iniciar Sesión / Registrarse
                </button>
              </div>
            ) : submitted ? (
              <div className="bg-green-50 border border-green-400 p-2.5 rounded-xs space-y-1.5">
                <div className="flex items-center gap-2 text-green-900 font-bold">
                  <Check className="w-4 h-4 text-green-700 shrink-0" />
                  <span>¡Solicitud de Producto Agotado enviada con éxito!</span>
                </div>
                <p className="text-[11px] text-green-800 leading-tight">
                  Hemos registrado tu solicitud a nombre de <strong>{authenticatedUser.name}</strong> (<strong>{authenticatedUser.email}</strong>). Te contactaremos prioritariamente apenas se habilite reposición de esta prenda.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setRequestText('');
                    setSubmitted(false);
                  }}
                  className="winxp-button text-[11px] py-0.5 px-2 font-semibold text-gray-700 cursor-pointer mt-1"
                >
                  Enviar otra solicitud
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-2">
                {/* Nombre y Correo rellenados automáticamente */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-700 flex items-center gap-1 mb-0.5">
                      <UserIcon className="w-3 h-3 text-gray-600" />
                      <span>Nombre del Cliente (Automático):</span>
                    </label>
                    <input
                      type="text"
                      value={authenticatedUser.name}
                      readOnly
                      className="winxp-input w-full py-1 px-2 text-xs bg-gray-100 text-gray-700 font-semibold cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-700 flex items-center gap-1 mb-0.5">
                      <Mail className="w-3 h-3 text-gray-600" />
                      <span>Correo Electrónico (Automático):</span>
                    </label>
                    <input
                      type="email"
                      value={authenticatedUser.email}
                      readOnly
                      className="winxp-input w-full py-1 px-2 text-xs bg-gray-100 text-gray-700 font-semibold cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Campo para escribir la solicitud */}
                <div>
                  <label className="text-[10px] font-bold text-gray-800 block mb-0.5">
                    Escribe tu solicitud:
                  </label>
                  <textarea
                    rows={2}
                    value={requestText}
                    onChange={(e) => setRequestText(e.target.value)}
                    placeholder="Indica la talla, cantidad o detalles que necesitas para la reposición de este producto..."
                    className="winxp-input w-full py-1.5 px-2 text-xs resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="winxp-button text-xs py-1.5 px-3 font-semibold text-gray-700 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="winxp-button winxp-button-primary text-xs py-1.5 px-4 font-bold text-blue-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Solicitud</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * SoldOutCardOverlay: Superposición para tarjetas de producto en el catálogo cuando stock <= 0.
 */
export const SoldOutCardOverlay: React.FC = () => {
  return (
    <div
      data-force-white="true"
      className="sold-out-card-overlay absolute inset-0 bg-black/45 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 z-10 text-center select-none"
    >
      <div
        data-force-white="true"
        style={{ color: '#ffffff' }}
        className="bg-red-600 text-white font-black text-xs px-2.5 py-1 uppercase tracking-widest border border-white shadow-lg transform -rotate-3"
      >
        [ AGOTADO ]
      </div>
      <div
        data-force-white="true"
        style={{ color: '#ffffff' }}
        className="bg-black/90 text-white font-mono text-[9px] px-2 py-0.5 mt-1 rounded border border-red-500 font-bold"
      >
        0 UNIDADES DISPONIBLES
      </div>
    </div>
  );
};

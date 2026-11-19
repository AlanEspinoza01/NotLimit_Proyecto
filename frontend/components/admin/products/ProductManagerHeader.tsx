import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ProductManagerHeaderProps {
  feedback: { type: 'success' | 'error'; message: string } | null;
}

export const ProductManagerHeader: React.FC<ProductManagerHeaderProps> = ({
  feedback
}) => {
  return (
    <>
      {/* Header Superior y Barra de Herramientas */}
      <div className="bg-[#f0f4f8] border border-gray-400 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#0055ea] to-[#003c74] border border-[#002244] flex items-center justify-center text-white shadow-xs shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                style={{ color: '#ffffff' }}
                className="bg-red-700 !text-white text-[9px] font-black px-1.5 py-0.2 rounded-xs uppercase tracking-wider"
              >
                SUPER ADMIN
              </span>
              <h1 className="font-extrabold text-sm text-[#003c74] uppercase tracking-wide">
                Administrador de Productos
              </h1>
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Alta y edición integral con precios CLP, descuentos porcentuales, peso en gramos/kg, tallas dinámicas, 10 imágenes máx. y vista previa en vivo.
            </p>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="flex items-center gap-2">
          <Link to="/admin/inventory">
            <button
              type="button"
              className="winxp-button text-xs py-1 px-2.5 flex items-center gap-1.5 font-bold"
            >
              <ArrowRight className="w-3.5 h-3.5 rotate-180 text-blue-700" />
              <span>Volver a Inventario</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Notificación de Feedback */}
      {feedback && (
        <div
          className={`p-3 text-xs font-bold flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
              : 'bg-rose-50 border-rose-500 text-rose-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </>
  );
};

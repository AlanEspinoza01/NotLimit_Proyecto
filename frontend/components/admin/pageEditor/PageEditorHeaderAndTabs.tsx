import React from 'react';
import { Link } from 'react-router-dom';
import {
  Edit3,
  Sliders,
  Star,
  Truck,
  Ticket,
  Layers,
  ArrowRight,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Film
} from 'lucide-react';
import { EditorTab } from './pageEditorTypes';

interface PageEditorHeaderAndTabsProps {
  activeTab: EditorTab;
  setActiveTab: (tab: EditorTab) => void;
  feedback: { type: 'success' | 'error'; message: string } | null;
  slidesCount: number;
  reviewsCount: number;
  couponsCount: number;
}

export const PageEditorHeaderAndTabs: React.FC<PageEditorHeaderAndTabsProps> = ({
  activeTab,
  setActiveTab,
  feedback,
  slidesCount,
  reviewsCount,
  couponsCount
}) => {
  return (
    <>
      {/* Cabecera Principal */}
      <div className="bg-[#f0f4f8] border border-gray-400 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#0055ea] to-[#003c74] border border-[#002244] flex items-center justify-center text-white shadow-xs shrink-0">
            <Edit3 className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                data-force-white="true"
                className="bg-red-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded-xs uppercase"
              >
                SUPER ADMIN
              </span>
              <h1 className="font-extrabold text-sm text-[#003c74] uppercase tracking-wide">
                Editor Maestro de la Página
              </h1>
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Control centralizado de contenidos informativos, Slider de inicio (máx 8), moderación de reseñas, cotizaciones de envíos multizona y cupones exclusivos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/inventory">
            <button type="button" className="winxp-button text-xs py-1 px-2.5 flex items-center gap-1.5 font-bold">
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
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* BARRA DE NAVEGACIÓN DE LOS MÓDULOS REQUERIDOS                   */}
      {/* ============================================================== */}
      <div className="nl-page-editor-tabs-bar border-b border-gray-300 pb-2">
        {/* 1. Editar Paginas Informativas */}
        <button
          type="button"
          onClick={() => setActiveTab('informativas')}
          className={`nl-page-editor-tab-btn winxp-button text-xs py-1.5 px-3 font-bold flex items-center gap-1.5 ${
            activeTab === 'informativas'
              ? 'bg-[#2b72c4] text-white border-blue-900 shadow-inner'
              : 'text-gray-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span>Editar Páginas Informativas</span>
        </button>

        {/* 1B. Editar video o gif del Home (A la derecha de Editar Páginas Informativas, con fino borde negro) */}
        <button
          type="button"
          onClick={() => setActiveTab('home_media')}
          className={`nl-page-editor-tab-btn winxp-button text-xs py-1.5 px-3 font-bold flex items-center gap-1.5 ${
            activeTab === 'home_media'
              ? 'bg-[#2b72c4] text-white border-blue-900 shadow-inner'
              : 'text-gray-800'
          }`}
        >
          <Film
            className="w-3.5 h-3.5 fill-cyan-300 shrink-0"
            stroke="#000000"
            strokeWidth={1.5}
          />
          <span>Editar video o gif del Home</span>
        </button>

        {/* 2. Editar Slider */}
        <button
          type="button"
          onClick={() => setActiveTab('slider')}
          className={`nl-page-editor-tab-btn winxp-button text-xs py-1.5 px-3 font-bold flex items-center gap-1.5 ${
            activeTab === 'slider'
              ? 'bg-[#2b72c4] text-white border-blue-900 shadow-inner'
              : 'text-gray-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 shrink-0" />
          <span>Editar Slider ({slidesCount}/8)</span>
        </button>

        {/* 3. Editar Reseñas (Estrellita con fino borde negro) */}
        <button
          type="button"
          onClick={() => setActiveTab('resenas')}
          className={`nl-page-editor-tab-btn winxp-button text-xs py-1.5 px-3 font-bold flex items-center gap-1.5 ${
            activeTab === 'resenas'
              ? 'bg-[#2b72c4] text-white border-blue-900 shadow-inner'
              : 'text-gray-800'
          }`}
        >
          <Star
            className="w-3.5 h-3.5 fill-amber-300 shrink-0"
            stroke="#000000"
            strokeWidth={1.5}
          />
          <span>Editar Reseñas ({reviewsCount})</span>
        </button>

        {/* 4. Editar Valores de Envios (Iconito con fino borde negro) */}
        <button
          type="button"
          onClick={() => setActiveTab('envios')}
          className={`nl-page-editor-tab-btn winxp-button text-xs py-1.5 px-3 font-bold flex items-center gap-1.5 ${
            activeTab === 'envios'
              ? 'bg-[#2b72c4] text-white border-blue-900 shadow-inner'
              : 'text-gray-800'
          }`}
        >
          <Truck
            className="w-3.5 h-3.5 fill-emerald-300 shrink-0"
            stroke="#000000"
            strokeWidth={1.5}
          />
          <span>Editar Valores de Envíos</span>
        </button>

        {/* 5. Editar Cupones (Iconito con fino borde negro) */}
        <button
          type="button"
          onClick={() => setActiveTab('cupones')}
          className={`nl-page-editor-tab-btn winxp-button text-xs py-1.5 px-3 font-bold flex items-center gap-1.5 ${
            activeTab === 'cupones'
              ? 'bg-[#2b72c4] text-white border-blue-900 shadow-inner'
              : 'text-gray-800'
          }`}
        >
          <Ticket
            className="w-3.5 h-3.5 fill-purple-300 shrink-0"
            stroke="#000000"
            strokeWidth={1.5}
          />
          <span>Editar Cupones ({couponsCount})</span>
        </button>

        {/* 6. Editar Categorías (A la derecha de Editar Cupones) */}
        <button
          type="button"
          onClick={() => setActiveTab('categorias')}
          className={`nl-page-editor-tab-btn winxp-button text-xs py-1.5 px-3 font-bold flex items-center gap-1.5 ${
            activeTab === 'categorias'
              ? 'bg-[#2b72c4] text-white border-blue-900 shadow-inner'
              : 'text-gray-800'
          }`}
        >
          <Layers
            className="w-3.5 h-3.5 fill-indigo-300 shrink-0"
            stroke="#000000"
            strokeWidth={1.5}
          />
          <span>Editar Categorías</span>
        </button>

        {/* 7. Editar Fondo (A la derecha de Editar Categorías) */}
        <button
          type="button"
          onClick={() => setActiveTab('fondo')}
          className={`nl-page-editor-tab-btn winxp-button text-xs py-1.5 px-3 font-bold flex items-center gap-1.5 ${
            activeTab === 'fondo'
              ? 'bg-[#2b72c4] text-white border-blue-900 shadow-inner'
              : 'text-gray-800'
          }`}
        >
          <ImageIcon
            className="w-3.5 h-3.5 fill-sky-300 shrink-0"
            stroke="#000000"
            strokeWidth={1.5}
          />
          <span>Editar Fondo</span>
        </button>
      </div>
    </>
  );
};

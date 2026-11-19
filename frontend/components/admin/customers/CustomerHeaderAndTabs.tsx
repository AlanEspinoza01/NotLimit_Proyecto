import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Filter,
  Star,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Tag
} from 'lucide-react';

export interface CustomerHeaderAndTabsProps {
  activeTab: 'todos' | 'preferencial' | 'negra' | 'mixtos';
  setActiveTab: (tab: 'todos' | 'preferencial' | 'negra' | 'mixtos') => void;
  handleTabChange: (tab: 'todos' | 'preferencial' | 'negra' | 'mixtos') => void;
  counts: {
    total: number;
    preferencial: number;
    negra: number;
    normal: number;
    mixtos: number;
  };
  feedback: { type: 'success' | 'error'; message: string } | null;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterTag: string;
  setFilterTag: (val: string) => void;
  filteredCount: number;
  totalCount: number;
}

export const CustomerHeaderAndTabs: React.FC<CustomerHeaderAndTabsProps> = ({
  activeTab,
  setActiveTab,
  handleTabChange,
  counts,
  feedback,
  searchTerm,
  setSearchTerm,
  filterTag,
  setFilterTag,
  filteredCount,
  totalCount
}) => {
  return (
    <div className="space-y-4">
      {/* Cabecera Principal de Control */}
      <div className="bg-[#f0f4f8] border border-gray-400 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#0055ea] to-[#003c74] border border-[#002244] flex items-center justify-center text-white shadow-xs shrink-0">
            <Users className="w-5 h-5 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Cuadro SUPER ADMIN con texto blanco forzado */}
              <span
                style={{ color: '#ffffff' }}
                className="bg-red-700 !text-white text-[9px] font-black px-1.5 py-0.2 rounded-xs uppercase select-none shadow-2xs"
              >
                SUPER ADMIN
              </span>
              <h1 className="font-extrabold text-sm text-[#003c74] uppercase tracking-wide">
                Administrador de Clientes
              </h1>
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Directorio maestro con <strong>sistema de etiquetas</strong> (Normal, Lista Preferencial y Lista Negra), edición de Puntos Club y registro acumulativo de reportes modificables.
            </p>
          </div>
        </div>

        {/* Acceso a Inventario (Botón '+ Registrar Nuevo Cliente' eliminado según requerimiento) */}
        <div className="flex items-center gap-2">
          <Link to="/admin/inventory">
            <button
              type="button"
              className="winxp-button text-xs py-1 px-3 flex items-center gap-1.5 font-bold shadow-xs hover:bg-blue-50"
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
          className={`p-3 text-xs font-bold flex items-center gap-2 border shadow-xs animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
              : 'bg-rose-50 border-rose-500 text-rose-950'
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
      {/* BOTONES PRINCIPALES DE NAVEGACIÓN SEGÚN EL ESQUEMA DE ETIQUETAS */}
      {/* ============================================================== */}
      <div className="nl-cust-tabs-grid grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        {/* 1. Directorio Completo */}
        <button
          type="button"
          onClick={() => handleTabChange('todos')}
          className={`p-3 text-left border-2 flex items-center justify-between transition-all ${
            activeTab === 'todos'
              ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-300 shadow-xs'
              : 'bg-white border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Users className={`w-5 h-5 shrink-0 ${activeTab === 'todos' ? 'text-blue-700' : 'text-gray-500'}`} />
            <div>
              <div className="font-extrabold text-xs uppercase text-gray-900">Directorio Completo</div>
              <div className="text-[10px] text-gray-500">Todos los clientes registrados</div>
            </div>
          </div>
          <span className="font-mono font-black text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-xs">
            {counts.total}
          </span>
        </button>

        {/* 2. Etiqueta "Lista Preferencial" */}
        <button
          type="button"
          onClick={() => handleTabChange('preferencial')}
          className={`p-3 text-left border-2 flex items-center justify-between transition-all ${
            activeTab === 'preferencial'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-300 shadow-xs'
              : 'bg-white border-gray-300 hover:bg-amber-50/50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Star
              className={`w-5 h-5 shrink-0 ${
                activeTab === 'preferencial' ? 'text-amber-500 fill-amber-400' : 'text-gray-400'
              }`}
            />
            <div>
              <div className="font-extrabold text-xs uppercase text-amber-950">Lista Preferencial</div>
              <div className="text-[10px] text-gray-500">Clientes VIP y buen comportamiento</div>
            </div>
          </div>
          <span className="font-mono font-black text-xs bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-xs">
            {counts.preferencial}
          </span>
        </button>

        {/* 3. Etiqueta "Lista Negra" */}
        <button
          type="button"
          onClick={() => handleTabChange('negra')}
          className={`p-3 text-left border-2 flex items-center justify-between transition-all ${
            activeTab === 'negra'
              ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-300 shadow-xs'
              : 'bg-white border-gray-300 hover:bg-rose-50/50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert className={`w-5 h-5 shrink-0 ${activeTab === 'negra' ? 'text-rose-700' : 'text-gray-400'}`} />
            <div>
              <div className="font-extrabold text-xs uppercase text-rose-950">Lista Negra</div>
              <div className="text-[10px] text-gray-500">Deudores e irregularidades</div>
            </div>
          </div>
          <span className="font-mono font-black text-xs bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded-xs">
            {counts.negra}
          </span>
        </button>

        {/* 4. Clientes Mixtos (Ambas Etiquetas: Ej. grosero pero siempre paga) */}
        <button
          type="button"
          onClick={() => handleTabChange('mixtos')}
          className={`p-3 text-left border-2 flex items-center justify-between transition-all ${
            activeTab === 'mixtos'
              ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-300 shadow-xs'
              : 'bg-white border-gray-300 hover:bg-purple-50/50'
          }`}
          title="Clientes que poseen ambas etiquetas simultáneamente"
        >
          <div className="flex items-center gap-2.5">
            <Tag className={`w-5 h-5 shrink-0 ${activeTab === 'mixtos' ? 'text-purple-700' : 'text-gray-400'}`} />
            <div>
              <div className="font-extrabold text-xs uppercase text-purple-950">Múltiples Etiquetas</div>
              <div className="text-[10px] text-gray-500">Preferencial + Lista Negra</div>
            </div>
          </div>
          <span className="font-mono font-black text-xs bg-purple-100 text-purple-900 border border-purple-300 px-2 py-0.5 rounded-xs">
            {counts.mixtos}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* BARRA DE BÚSQUEDA Y FILTRADO POR ETIQUETAS                     */}
      {/* ============================================================== */}
      <div className="nl-cust-search-bar bg-[#f0f4f8] border border-gray-300 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Barra de búsqueda */}
          <div className="relative min-w-[200px] sm:min-w-[240px] flex-1 max-w-md">
            <input
              type="text"
              placeholder="Buscar por Nombre, Apellido, RUT, Correo, Teléfono o Etiqueta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full winxp-input px-2.5 text-xs py-1 bg-white border border-[#7f9db9]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-700 font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Selector para filtrar por: "Normal", "Lista Preferencial", "Lista Negra" */}
          <div className="flex items-center gap-1.5 bg-white border border-gray-300 px-2.5 py-1 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span className="font-bold text-gray-700">Filtrar por Etiqueta:</span>
            <select
              value={filterTag}
              onChange={(e) => {
                const tag = e.target.value;
                setFilterTag(tag);
                if (tag === 'Lista Preferencial') setActiveTab('preferencial');
                else if (tag === 'Lista Negra') setActiveTab('negra');
                else if (tag === 'mixtos') setActiveTab('mixtos');
                else setActiveTab('todos');
              }}
              className="text-xs font-bold bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="todos">Todas las Etiquetas ({counts.total})</option>
              <option value="Normal">Etiqueta: Normal ({counts.normal})</option>
              <option value="Lista Preferencial">Etiqueta: Lista Preferencial ({counts.preferencial})</option>
              <option value="Lista Negra">Etiqueta: Lista Negra ({counts.negra})</option>
              <option value="mixtos">Múltiples Etiquetas (Preferencial + Negra) ({counts.mixtos})</option>
            </select>
          </div>

          {(filterTag !== 'todos' || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setFilterTag('todos');
                setSearchTerm('');
                setActiveTab('todos');
              }}
              className="winxp-button text-xs py-1 px-2.5 text-gray-700 flex items-center gap-1 font-semibold"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restablecer Filtros</span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-gray-600 font-mono">
          Mostrando <strong>{filteredCount}</strong> de {totalCount} clientes
        </div>
      </div>
    </div>
  );
};

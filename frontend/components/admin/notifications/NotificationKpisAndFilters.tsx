import React from 'react';
import { Link } from 'react-router-dom';
import {
  BellRing,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Filter,
  DollarSign,
  PackageX,
  MessageSquare,
  X,
  Sparkles
} from 'lucide-react';
import { AlertCategory, CategoryCountMap } from './interestNotificationTypes';

export interface NotificationKpisAndFiltersProps {
  handleRefresh: () => void;
  isRefreshing: boolean;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
  activeTab: AlertCategory;
  setActiveTab: (tab: AlertCategory) => void;
  countByCategory: CategoryCountMap;
  filteredCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  sortOrder: 'newest' | 'oldest';
  setSortOrder: (order: 'newest' | 'oldest') => void;
}

export const NotificationKpisAndFilters: React.FC<NotificationKpisAndFiltersProps> = ({
  handleRefresh,
  isRefreshing,
  toastMessage,
  setToastMessage,
  activeTab,
  setActiveTab,
  countByCategory,
  filteredCount,
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder
}) => {
  return (
    <>
      {/* Cabecera Principal */}
      <div className="interest-notif-header flex flex-wrap items-center justify-between gap-3 border-b border-gray-300 pb-3 bg-linear-to-r from-amber-50/70 via-blue-50/50 to-transparent p-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              style={{ color: '#ffffff' }}
              className="bg-red-700 !text-white text-[10px] font-black px-1.5 py-0.5 rounded-xs tracking-wider uppercase select-none shadow-2xs"
            >
              SUPER ADMIN
            </span>
            <span
              style={{ color: '#ffffff' }}
              className="bg-amber-700 !text-white text-[10px] font-black px-1.5 py-0.5 rounded-xs tracking-wider uppercase flex items-center gap-1 select-none shadow-2xs"
            >
              <BellRing className="w-3 h-3 text-white" style={{ color: '#ffffff', stroke: '#ffffff' }} />
              ALERTAS & COBRANZAS
            </span>
            <h1 className="text-sm font-extrabold text-[#003c74] uppercase tracking-wide">
              Centro de Notificaciones & Alertas de Interés
            </h1>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Monitoreo automático de cobranzas, soporte a clientes, solicitudes de reposición, devoluciones y pedidos personalizados.
          </p>
        </div>

        {/* Botones de Barra Superior */}
        <div className="interest-notif-header-actions flex flex-wrap items-center gap-2">
          <Link to="/admin/inventory">
            <button
              type="button"
              className="winxp-button text-xs py-1 px-3 text-gray-800 flex items-center gap-1.5 font-bold"
              title="Volver al panel general de Inventario"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-blue-700" />
              <span>Volver a Inventario</span>
            </button>
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            className="winxp-button text-xs py-1 px-3 text-gray-800 flex items-center gap-1.5 font-bold"
            title="Sincronizar alertas automatizadas"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Toast de confirmación flotante */}
      {toastMessage && (
        <div className="p-2.5 bg-emerald-50 border-2 border-emerald-600 text-emerald-950 font-bold text-xs flex items-center justify-between shadow-md rounded-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-emerald-800 hover:text-emerald-950 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tarjetas KPI de Resumen según el Esquema Oficial de 5 Categorías */}
      <div className="interest-notif-kpi-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {/* 1. Cobro Pendiente */}
        <div
          onClick={() => setActiveTab('cobro_pendiente')}
          className={`p-2.5 bg-white border cursor-pointer transition-all shadow-xs ${
            activeTab === 'cobro_pendiente'
              ? 'border-rose-600 ring-2 ring-rose-200'
              : 'border-[#7f9db9] hover:bg-rose-50/40'
          }`}
        >
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-bold text-[10px] uppercase tracking-wider text-rose-900">Cobro Pendiente</span>
            <DollarSign className="w-4 h-4 text-rose-700" />
          </div>
          <div className="text-lg font-black text-rose-700 mt-1">
            {countByCategory.cobro_pendiente.active}{' '}
            <span className="text-[11px] font-normal text-gray-600">activas</span>
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
            ${countByCategory.cobro_pendiente.amount.toLocaleString('es-CL')} por cobrar
          </div>
        </div>

        {/* 2. Atención al Cliente */}
        <div
          onClick={() => setActiveTab('atencion_cliente')}
          className={`p-2.5 bg-white border cursor-pointer transition-all shadow-xs ${
            activeTab === 'atencion_cliente'
              ? 'border-blue-600 ring-2 ring-blue-200'
              : 'border-[#7f9db9] hover:bg-blue-50/40'
          }`}
        >
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-bold text-[10px] uppercase tracking-wider text-blue-900">Atención Cliente</span>
            <MessageSquare className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-lg font-black text-blue-800 mt-1">
            {countByCategory.atencion_cliente.active}{' '}
            <span className="text-[11px] font-normal text-gray-600">consultas</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Soporte y despachos</div>
        </div>

        {/* 3. Solicitud de Producto Agotado */}
        <div
          onClick={() => setActiveTab('producto_agotado')}
          className={`p-2.5 bg-white border cursor-pointer transition-all shadow-xs ${
            activeTab === 'producto_agotado'
              ? 'border-purple-600 ring-2 ring-purple-200'
              : 'border-[#7f9db9] hover:bg-purple-50/40'
          }`}
        >
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-bold text-[10px] uppercase tracking-wider text-purple-900">Prod. Agotados</span>
            <PackageX className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-lg font-black text-purple-800 mt-1">
            {countByCategory.producto_agotado.active}{' '}
            <span className="text-[11px] font-normal text-gray-600">interesados</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Lista de espera Drops</div>
        </div>

        {/* 4. Solicitud de Devolución */}
        <div
          onClick={() => setActiveTab('devolucion')}
          className={`p-2.5 bg-white border cursor-pointer transition-all shadow-xs ${
            activeTab === 'devolucion'
              ? 'border-amber-600 ring-2 ring-amber-200'
              : 'border-[#7f9db9] hover:bg-amber-50/40'
          }`}
        >
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-bold text-[10px] uppercase tracking-wider text-amber-900">Devoluciones</span>
            <RefreshCw className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-lg font-black text-amber-700 mt-1">
            {countByCategory.devolucion.active}{' '}
            <span className="text-[11px] font-normal text-gray-600">casos</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Cambio de talla / Garantía</div>
        </div>

        {/* 5. Solicitud de Productos Personalizado */}
        <div
          onClick={() => setActiveTab('producto_personalizado')}
          className={`p-2.5 bg-white border cursor-pointer transition-all shadow-xs ${
            activeTab === 'producto_personalizado'
              ? 'border-emerald-600 ring-2 ring-emerald-200'
              : 'border-[#7f9db9] hover:bg-emerald-50/40'
          }`}
        >
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-900">Personalizados</span>
            <Sparkles className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-lg font-black text-emerald-800 mt-1">
            {countByCategory.producto_personalizado.active}{' '}
            <span className="text-[11px] font-normal text-gray-600">pedidos</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Confección exclusiva Y2K</div>
        </div>
      </div>

      {/* Navegación por Pestañas del Esquema Oficial (Sin botón Ver Todo) */}
      <div className="interest-notif-tabs-bar flex flex-wrap items-center gap-1 border-b-2 border-gray-300 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('cobro_pendiente')}
          className={`winxp-button text-xs py-1 px-2.5 font-bold flex items-center gap-1.5 ${
            activeTab === 'cobro_pendiente'
              ? 'winxp-button-primary text-rose-950 border-rose-800 bg-rose-100 shadow-xs'
              : 'text-gray-700'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5 text-rose-700" />
          <span>Cobro Pendiente ({countByCategory.cobro_pendiente.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('atencion_cliente')}
          className={`winxp-button text-xs py-1 px-2.5 font-bold flex items-center gap-1.5 ${
            activeTab === 'atencion_cliente'
              ? 'winxp-button-primary text-blue-950 border-blue-800 bg-blue-100 shadow-xs'
              : 'text-gray-700'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-blue-700" />
          <span>Atención al Cliente ({countByCategory.atencion_cliente.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('producto_agotado')}
          className={`winxp-button text-xs py-1 px-2.5 font-bold flex items-center gap-1.5 ${
            activeTab === 'producto_agotado'
              ? 'winxp-button-primary text-purple-950 border-purple-800 bg-purple-100 shadow-xs'
              : 'text-gray-700'
          }`}
        >
          <PackageX className="w-3.5 h-3.5 text-purple-700" />
          <span>Solicitud de Producto Agotado ({countByCategory.producto_agotado.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('devolucion')}
          className={`winxp-button text-xs py-1 px-2.5 font-bold flex items-center gap-1.5 ${
            activeTab === 'devolucion'
              ? 'winxp-button-primary text-amber-950 border-amber-800 bg-amber-100 shadow-xs'
              : 'text-gray-700'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
          <span>Solicitud de Devolución ({countByCategory.devolucion.total})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('producto_personalizado')}
          className={`winxp-button text-xs py-1 px-2.5 font-bold flex items-center gap-1.5 ${
            activeTab === 'producto_personalizado'
              ? 'winxp-button-primary text-emerald-950 border-emerald-800 bg-emerald-100 shadow-xs'
              : 'text-gray-700'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Solicitud de Productos Personalizado ({countByCategory.producto_personalizado.total})</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="interest-notif-filter-bar flex flex-wrap items-center justify-between gap-2 p-2 bg-[#ece9d8] border border-gray-400">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-800" />
          <span className="font-bold text-xs text-[#003c74] uppercase tracking-wide">
            Filtros de Alertas Automatizadas ({filteredCount} resultados)
          </span>
        </div>

        <div className="interest-notif-filter-controls flex flex-wrap items-center gap-2">
          {/* Búsqueda rápida */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar cliente, correo, orden o prenda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="interest-notif-search-input winxp-input text-xs py-0.5 px-2 pr-6 bg-white border border-[#7f9db9] w-64"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro de ordenamiento por antigüedad ("Notificaciones más nuevas" y "Notificaciones más antiguas") */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="winxp-input text-xs py-0.5 px-2 bg-white border border-[#7f9db9] font-bold"
          >
            <option value="newest">Notificaciones más nuevas</option>
            <option value="oldest">Notificaciones más antiguas</option>
          </select>
        </div>
      </div>
    </>
  );
};

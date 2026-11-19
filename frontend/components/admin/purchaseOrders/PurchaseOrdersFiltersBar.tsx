import React from 'react';
import {
  Filter,
  ArrowUpDown,
  Tag,
  Truck,
  CreditCard,
  Store,
  Lock,
  Search
} from 'lucide-react';
import { Branch } from '../../../types';
import { PurchaseOrderRecord } from './purchaseOrdersTypes';

interface PurchaseOrdersFiltersBarProps {
  branchScopedOrders: PurchaseOrderRecord[];
  filteredAndSortedOrders: PurchaseOrderRecord[];
  dateSortOrder: 'desc' | 'asc';
  setDateSortOrder: (val: 'desc' | 'asc') => void;
  selectedStatus: string;
  setSelectedStatus: (val: string) => void;
  selectedDeliveryType: string;
  setSelectedDeliveryType: (val: string) => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (val: string) => void;
  selectedBranch: string;
  setSelectedBranch: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isBranchAdmin: boolean;
  activeBranchObj: Branch | null;
  allBranches: Branch[];
  isAllQuickFilterActive: boolean;
}

export const PurchaseOrdersFiltersBar: React.FC<PurchaseOrdersFiltersBarProps> = ({
  branchScopedOrders,
  filteredAndSortedOrders,
  dateSortOrder,
  setDateSortOrder,
  selectedStatus,
  setSelectedStatus,
  selectedDeliveryType,
  setSelectedDeliveryType,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  selectedBranch,
  setSelectedBranch,
  searchQuery,
  setSearchQuery,
  isBranchAdmin,
  activeBranchObj,
  allBranches,
  isAllQuickFilterActive
}) => {
  return (
    <div className="p-3 bg-[#ece9d8] border border-gray-400 space-y-2.5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-300 pb-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#003c74]" />
          <span className="font-bold text-xs text-[#003c74] uppercase tracking-wide">
            Controles de Filtrado & Búsqueda de Órdenes
          </span>
        </div>
        <div className="text-[11px] text-gray-600">
          Mostrando <strong className="text-gray-900">{filteredAndSortedOrders.length}</strong> de{' '}
          {branchScopedOrders.length} órdenes registradas
        </div>
      </div>

      <div className="nl-orders-filters-grid">
        {/* 1. FILTRAR POR FECHA */}
        <div>
          <label className="block text-[11px] font-bold text-gray-800 mb-1 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-blue-700" />
            <span>Filtrar por Fecha:</span>
          </label>
          <select
            value={dateSortOrder}
            onChange={(e) => setDateSortOrder(e.target.value as 'desc' | 'asc')}
            className="w-full winxp-input text-xs py-1 px-2 font-bold bg-white border border-[#7f9db9] text-[#003c74]"
          >
            <option value="desc">Más Nueva a Antigua</option>
            <option value="asc">Más Antigua a Nueva</option>
          </select>
        </div>

        {/* 2. FILTRAR POR ESTADO */}
        <div>
          <label className="block text-[11px] font-bold text-gray-800 mb-1 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-indigo-700" />
            <span>Filtrar por Estado:</span>
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full winxp-input text-xs py-1 px-2 font-medium bg-white border border-[#7f9db9]"
          >
            <option value="all">Todos los Estados ({branchScopedOrders.length})</option>
            <optgroup label="--- Transferencias (Sistema POS / Khipu) ---">
              <option value="Pendiente de Pago">Pendiente de Pago</option>
              <option value="Pago Confirmando">Pago Confirmando</option>
              <option value="Pago Anulado">Pago Anulado</option>
            </optgroup>
            <optgroup label="--- Flujo de Envío a Domicilio y Retiro ---">
              <option value="Solicitud recibida">Solicitud recibida</option>
              <option value="En Preparación">En Preparación</option>
              <option value="En transito">En transito</option>
              <option value="Entregado">Entregado (Exclusivo Envío a Domicilio)</option>
              <option value="Listo para el retiro de sucursal">
                Listo para el retiro de sucursal (Exclusivo Retiro)
              </option>
              <option value="Retirado">Retirado (Exclusivo Retiro en Sucursal)</option>
            </optgroup>
            <optgroup label="--- Estados de Devolución ---">
              <option value="Solicitud de Devolución recibida">
                Solicitud de Devolución recibida
              </option>
              <option value="Revisión de equipo">Revisión de equipo</option>
              <option value="Aprobada por Admin">Aprobada por Admin</option>
              <option value="Rechazada por Admin">Rechazada por Admin</option>
              <option value="Envió a punto">Envió a punto (Exclusivo Devolución Domicilio)</option>
              <option value="Retiro Presencial">
                Retiro Presencial (Exclusivo Devolución Sucursal)
              </option>
            </optgroup>
          </select>
        </div>

        {/* 3. FILTRAR POR MODALIDAD DE ENTREGA */}
        <div>
          <label className="block text-[11px] font-bold text-gray-800 mb-1 flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-purple-700" />
            <span>Modalidad de Entrega:</span>
          </label>
          <select
            value={selectedDeliveryType}
            onChange={(e) => setSelectedDeliveryType(e.target.value)}
            className="w-full winxp-input text-xs py-1 px-2 font-medium bg-white border border-[#7f9db9]"
          >
            <option value="all">Todas las Modalidades</option>
            <option value="Despacho a Domicilio">Envío a Domicilio</option>
            <option value="Retiro en Sucursal">Retiro Presencial</option>
          </select>
        </div>

        {/* 4. FILTRAR POR MÉTODO DE PAGO */}
        <div>
          <label className="block text-[11px] font-bold text-gray-800 mb-1 flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-amber-700" />
            <span>Método de Pago:</span>
          </label>
          <select
            value={selectedPaymentMethod}
            onChange={(e) => setSelectedPaymentMethod(e.target.value)}
            className="w-full winxp-input text-xs py-1 px-2 font-medium bg-white border border-[#7f9db9]"
          >
            <option value="all">Todos los Métodos</option>
            <option value="Sistema POS">Sistema POS</option>
            <option value="Khipu">Khipu</option>
            <option value="Webpay">Webpay</option>
            <option value="Mercado Pago">Mercado Pago</option>
          </select>
        </div>

        {/* 5. FILTRAR POR SUCURSAL (Filtra por Sucursal de retiro o bloqueado para Admin Sucursal) */}
        <div>
          <label className="block text-[11px] font-bold text-gray-800 mb-1 flex items-center gap-1">
            <Store className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isBranchAdmin ? 'Sucursal Asignada:' : 'Filtrar por Sucursal:'}</span>
          </label>
          {isBranchAdmin && activeBranchObj ? (
            <div
              className="w-full text-xs py-1 px-2 font-bold bg-blue-50 border border-blue-400 text-[#003c74] flex items-center justify-between gap-1 truncate"
              title={`Órdenes de Sucursal ${activeBranchObj.city} (${activeBranchObj.name})`}
            >
              <span className="truncate">
                🏪 {activeBranchObj.city} ({activeBranchObj.name})
              </span>
              <Lock className="w-3 h-3 text-blue-700 shrink-0" />
            </div>
          ) : (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full winxp-input text-xs py-1 px-2 font-medium bg-white border border-[#7f9db9]"
              title="Filtrar órdenes por Sucursal de retiro"
            >
              <option value="all">Todas las Sucursales de Retiro</option>
              {allBranches
                .filter((b) => b.allowPickup !== false && !b.isCorporate)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    Retiro en: {b.city} ({b.name})
                  </option>
                ))}
            </select>
          )}
        </div>

        {/* 6. BUSCADOR POR TEXTO */}
        <div>
          <label className="block text-[11px] font-bold text-gray-800 mb-1 flex items-center gap-1">
            <Search className="w-3.5 h-3.5 text-gray-700" />
            <span>Buscar Orden / Cliente:</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej: NL-9420, Ignacio..."
              className="w-full winxp-input text-xs py-1 px-2 pr-6 bg-white border border-[#7f9db9]"
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
        </div>
      </div>

      {/* Chips Rápidos de Filtrado */}
      <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-300">
        <span className="text-[10px] font-bold text-gray-700 uppercase">Filtros Rápidos:</span>
        <button
          type="button"
          data-force-white={isAllQuickFilterActive ? 'true' : undefined}
          onClick={() => {
            setSelectedStatus('all');
            setSelectedDeliveryType('all');
            setSelectedBranch('all');
            setSelectedPaymentMethod('all');
            setSearchQuery('');
          }}
          className={`text-[11px] px-2 py-0.5 border font-semibold ${
            isAllQuickFilterActive
              ? 'bg-blue-700 text-white border-blue-900 shadow-xs'
              : 'bg-white text-gray-700 border-gray-400 hover:bg-gray-100'
          }`}
        >
          Todas ({branchScopedOrders.length})
        </button>
        <button
          type="button"
          data-force-white={selectedStatus === 'Pendiente de Pago' ? 'true' : undefined}
          onClick={() => setSelectedStatus('Pendiente de Pago')}
          className={`text-[11px] px-2 py-0.5 border font-semibold ${
            selectedStatus === 'Pendiente de Pago'
              ? 'bg-amber-600 text-white border-amber-800 shadow-xs'
              : 'bg-white text-amber-900 border-gray-400 hover:bg-amber-50'
          }`}
        >
          Pendiente de Pago (
          {branchScopedOrders.filter((o) => o.status === 'Pendiente de Pago').length})
        </button>
        <button
          type="button"
          data-force-white={selectedStatus === 'Solicitud recibida' ? 'true' : undefined}
          onClick={() => setSelectedStatus('Solicitud recibida')}
          className={`text-[11px] px-2 py-0.5 border font-semibold ${
            selectedStatus === 'Solicitud recibida'
              ? 'bg-cyan-700 text-white border-cyan-900 shadow-xs'
              : 'bg-white text-cyan-900 border-gray-400 hover:bg-cyan-50'
          }`}
        >
          Solicitud recibida (
          {branchScopedOrders.filter((o) => o.status === 'Solicitud recibida').length})
        </button>
        <button
          type="button"
          data-force-white={selectedStatus === 'En Preparación' ? 'true' : undefined}
          onClick={() => setSelectedStatus('En Preparación')}
          className={`text-[11px] px-2 py-0.5 border font-semibold ${
            selectedStatus === 'En Preparación'
              ? 'bg-indigo-700 text-white border-indigo-900 shadow-xs'
              : 'bg-white text-indigo-900 border-gray-400 hover:bg-indigo-50'
          }`}
        >
          En Preparación ({branchScopedOrders.filter((o) => o.status === 'En Preparación').length})
        </button>
        <button
          type="button"
          data-force-white={selectedStatus === 'En transito' ? 'true' : undefined}
          onClick={() => setSelectedStatus('En transito')}
          className={`text-[11px] px-2 py-0.5 border font-semibold ${
            selectedStatus === 'En transito'
              ? 'bg-purple-700 text-white border-purple-900 shadow-xs'
              : 'bg-white text-purple-900 border-gray-400 hover:bg-purple-50'
          }`}
        >
          En transito ({branchScopedOrders.filter((o) => o.status === 'En transito').length})
        </button>
        <button
          type="button"
          data-force-white={
            selectedStatus === 'Listo para el retiro de sucursal' ? 'true' : undefined
          }
          onClick={() => setSelectedStatus('Listo para el retiro de sucursal')}
          className={`text-[11px] px-2 py-0.5 border font-semibold ${
            selectedStatus === 'Listo para el retiro de sucursal'
              ? 'bg-teal-700 text-white border-teal-900 shadow-xs'
              : 'bg-white text-teal-900 border-gray-400 hover:bg-teal-50'
          }`}
        >
          Listo para retiro (
          {branchScopedOrders.filter((o) => o.status === 'Listo para el retiro de sucursal').length}
          )
        </button>
        <button
          type="button"
          data-force-white={selectedStatus === 'Entregado' ? 'true' : undefined}
          onClick={() => setSelectedStatus('Entregado')}
          className={`text-[11px] px-2 py-0.5 border font-semibold ${
            selectedStatus === 'Entregado'
              ? 'bg-emerald-700 text-white border-emerald-900 shadow-xs'
              : 'bg-white text-emerald-900 border-gray-400 hover:bg-emerald-50'
          }`}
        >
          Entregado ({branchScopedOrders.filter((o) => o.status === 'Entregado').length})
        </button>
        <button
          type="button"
          data-force-white={selectedStatus === 'Retirado' ? 'true' : undefined}
          onClick={() => setSelectedStatus('Retirado')}
          className={`text-[11px] px-2 py-0.5 border font-semibold ${
            selectedStatus === 'Retirado'
              ? 'bg-green-700 text-white border-green-900 shadow-xs'
              : 'bg-white text-green-900 border-gray-400 hover:bg-green-50'
          }`}
        >
          Retirado ({branchScopedOrders.filter((o) => o.status === 'Retirado').length})
        </button>
      </div>
    </div>
  );
};

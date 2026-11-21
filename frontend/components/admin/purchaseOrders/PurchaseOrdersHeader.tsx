import React from 'react';
import { Link } from 'react-router-dom';
import {
  Receipt,
  ArrowLeft,
  RefreshCw,
  FileText,
  Download,
  CheckCircle2,
  X,
  DollarSign,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Branch } from '../../../types';
import { PurchaseOrdersSummaryKPIs } from './purchaseOrdersTypes';

interface PurchaseOrdersHeaderProps {
  isBranchAdmin: boolean;
  activeBranchObj: Branch | null;
  isRefreshing: boolean;
  handleRefresh: () => void;
  handleExportPDF: () => void;
  handleExportExcel: () => void;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
  summaryKPIs: PurchaseOrdersSummaryKPIs;
}

export const PurchaseOrdersHeader: React.FC<PurchaseOrdersHeaderProps> = ({
  isBranchAdmin,
  activeBranchObj,
  isRefreshing,
  handleRefresh,
  handleExportPDF,
  handleExportExcel,
  toastMessage,
  setToastMessage,
  summaryKPIs
}) => {
  return (
    <>
      {/* Cabecera Principal */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-300 pb-3 bg-linear-to-r from-cyan-50/70 via-blue-50/50 to-transparent p-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              data-force-white="true"
              className={`${
                isBranchAdmin ? 'bg-blue-700' : 'bg-red-700'
              } text-white text-[10px] font-black px-1.5 py-0.5 rounded-xs tracking-wider uppercase`}
            >
              {isBranchAdmin ? `ADMIN SUCURSAL · ${activeBranchObj?.city || 'LOCAL'}` : 'SUPER ADMIN'}
            </span>
            <span
              data-force-white="true"
              className="bg-cyan-700 text-white text-[10px] font-black px-1.5 py-0.5 rounded-xs tracking-wider uppercase flex items-center gap-1"
            >
              <Receipt className="w-3 h-3 text-white" />
              <span>{isBranchAdmin ? 'ÓRDENES DE MI SUCURSAL' : 'CONTROL CENTRAL DE ÓRDENES'}</span>
            </span>
            <h1 className="text-sm font-extrabold text-[#003c74] uppercase tracking-wide">
              {isBranchAdmin && activeBranchObj
                ? `Órdenes de Compra — Sucursal ${activeBranchObj.city} (${activeBranchObj.name})`
                : 'Órdenes de Compra & Flujo de Estados'}
            </h1>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {isBranchAdmin && activeBranchObj
              ? `Gestión exclusiva de Retiros Presenciales y ventas Sistema POS en ${activeBranchObj.city} - ${activeBranchObj.name}. Los envíos a domicilio y devoluciones los supervisa el Super Admin.`
              : 'Sincronización de Métodos de Pago (Sistema POS, Khipu, Webpay, Mercado Pago), Estados de Entrega (Envío a Domicilio / Retiro Presencial) y Devoluciones.'}
          </p>
        </div>

        {/* Botones de Barra Superior */}
        <div className="flex flex-wrap items-center gap-2">
          {!isBranchAdmin && (
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
          )}

          <button
            type="button"
            onClick={handleRefresh}
            className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1.5"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="winxp-button text-xs py-1 px-2.5 text-red-900 font-bold flex items-center gap-1.5"
            title="Exportar listado de órdenes a PDF"
          >
            <FileText className="w-3.5 h-3.5 text-red-700" />
            <span>Exportar a PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="winxp-button text-xs py-1 px-2.5 text-emerald-900 font-bold flex items-center gap-1.5"
            title="Exportar listado de órdenes a Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-700" />
            <span>Exportar a Excel</span>
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

      {/* Tarjetas KPI de Resumen */}
      <div className="nl-orders-kpi-grid">
        <div className="p-2.5 bg-white border border-[#7f9db9] shadow-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-bold text-[10px] uppercase tracking-wider text-blue-900">
              Total Órdenes
            </span>
            <Receipt className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-xl font-black text-gray-900 mt-1">
            {summaryKPIs.totalOrders}{' '}
            <span className="text-xs font-normal text-gray-500">órdenes</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {isBranchAdmin && activeBranchObj
              ? `Exclusivo ${activeBranchObj.city}`
              : 'Todas las sucursales consolidadas'}
          </div>
        </div>

        <div className="p-2.5 bg-white border border-[#7f9db9] shadow-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-900">
              Total de pagos confirmados
            </span>
            <DollarSign className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-xl font-black text-emerald-800 mt-1">
            ${summaryKPIs.totalRevenue.toLocaleString('es-CL')}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Órdenes con pago confirmado en MongoDB</div>
        </div>

        <div className="p-2.5 bg-white border border-[#7f9db9] shadow-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-bold text-[10px] uppercase tracking-wider text-amber-900">
              Pendiente de Pago
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">
            {summaryKPIs.pendingPaymentCount}{' '}
            <span className="text-xs font-normal text-gray-500">en espera</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Todos los medios de pago</div>
        </div>

        <div className="p-2.5 bg-white border border-[#7f9db9] shadow-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-bold text-[10px] uppercase tracking-wider text-purple-900">
              En Devolución / Revisión
            </span>
            <AlertCircle className="w-4 h-4 text-purple-700" />
          </div>
          <div className="text-xl font-black text-purple-900 mt-1">
            {summaryKPIs.returnsCount}{' '}
            <span className="text-xs font-normal text-gray-500">en proceso</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Envío a punto o Retiro Presencial</div>
        </div>
      </div>
    </>
  );
};

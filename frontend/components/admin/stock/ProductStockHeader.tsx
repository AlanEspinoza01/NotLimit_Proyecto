import React from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  ArrowLeft,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X
} from 'lucide-react';
import { Branch } from '../../../types';
import { StockSummaryMetrics } from './productStockTypes';

interface ProductStockHeaderProps {
  isBranchAdmin: boolean;
  activeBranchObj: Branch | null;
  isRefreshing: boolean;
  handleRefresh: () => void;
  handleExportPDF: () => void;
  handleExportExcel: () => void;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
  summaryMetrics: StockSummaryMetrics;
  lowStockThreshold: number;
}

export const ProductStockHeader: React.FC<ProductStockHeaderProps> = ({
  isBranchAdmin,
  activeBranchObj,
  isRefreshing,
  handleRefresh,
  handleExportPDF,
  handleExportExcel,
  toastMessage,
  setToastMessage,
  summaryMetrics,
  lowStockThreshold
}) => {
  return (
    <>
      {/* Barra Superior de Identificación y Navegación */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-300 pb-3 bg-linear-to-r from-blue-50/60 to-transparent p-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              style={{ color: '#ffffff' }}
              className={`${
                isBranchAdmin ? 'bg-blue-700' : 'bg-red-700'
              } !text-white text-[10px] font-black px-1.5 py-0.5 rounded-xs tracking-wider uppercase`}
            >
              <span style={{ color: '#ffffff' }} className="!text-white font-black">
                {isBranchAdmin
                  ? `ADMIN SUCURSAL · ${activeBranchObj?.city || 'LOCAL'}`
                  : 'SUPER ADMIN'}
              </span>
            </span>
            <span
              style={{ color: '#ffffff' }}
              className="bg-emerald-700 !text-white text-[10px] font-black px-1.5 py-0.5 rounded-xs tracking-wider uppercase flex items-center gap-1"
            >
              <Boxes
                className="w-3 h-3 !text-white"
                stroke="#ffffff"
                style={{ color: '#ffffff', stroke: '#ffffff' }}
              />
              <span style={{ color: '#ffffff' }} className="!text-white font-black">
                {isBranchAdmin ? 'SOLO LECTURA DE STOCK' : 'CONTROL DE STOCK & TALLAS'}
              </span>
            </span>
            <h1 className="text-sm font-extrabold text-[#003c74] uppercase tracking-wide">
              {isBranchAdmin
                ? 'Resumen de Stock (Modo Solo Visualización)'
                : 'Resumen de Stock de Productos'}
            </h1>
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {isBranchAdmin
              ? 'Visualización de stock de productos y desglose por tallas. La actualización o modificación de stock está reservada exclusivamente para el Super Administrador.'
              : 'Visualización centralizada de stock, desglose de unidades por tallas individuales y actualización manual en tiempo real.'}
          </p>
        </div>

        {/* Botones de Acción Global */}
        <div className="flex flex-wrap items-center gap-2">
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
            className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1.5"
            title="Sincronizar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1.5 font-bold"
            title="Generar e imprimir reporte en PDF"
          >
            <FileText className="w-3.5 h-3.5 text-red-700" />
            <span>Exportar a PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="winxp-button text-xs py-1 px-2.5 text-gray-800 flex items-center gap-1.5 font-bold"
            title="Descargar reporte en formato Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
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

      {/* Tarjetas de Resumen KPI de Stock */}
      <div className="nl-stock-kpi-grid">
        <div className="p-2.5 bg-white border border-[#7f9db9] shadow-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-bold text-[10px] uppercase tracking-wider text-emerald-900">Con Stock</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700 mt-1">
            {summaryMetrics.inStockCount}{' '}
            <span className="text-xs font-normal text-gray-600">de {summaryMetrics.totalProducts}</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Productos con existencias activas</div>
        </div>

        <div className="p-2.5 bg-white border border-[#7f9db9] shadow-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-bold text-[10px] uppercase tracking-wider text-amber-900">
              Stock Bajo (≤ {lowStockThreshold})
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-700 mt-1">
            {summaryMetrics.lowStockCount} <span className="text-xs font-normal text-gray-600">prendas</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Requieren reposición a proveedor</div>
        </div>

        <div className="p-2.5 bg-white border border-[#7f9db9] shadow-xs">
          <div className="flex items-center justify-between text-gray-600">
            <span className="font-bold text-[10px] uppercase tracking-wider text-red-900">Agotados (0 un.)</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-xl font-black text-red-700 mt-1">
            {summaryMetrics.soldOutCount} <span className="text-xs font-normal text-gray-600">productos</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">Sin disponibilidad en catálogo</div>
        </div>
      </div>
    </>
  );
};

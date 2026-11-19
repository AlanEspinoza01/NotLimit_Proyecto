import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Branch } from '../../../types';

interface RegisterSaleHeaderProps {
  isBranchAdmin: boolean;
  activeAdminBranchObj: Branch | null;
  currentUserName: string;
  feedback: { type: 'success' | 'error'; message: string } | null;
}

export const RegisterSaleHeader: React.FC<RegisterSaleHeaderProps> = ({
  isBranchAdmin,
  activeAdminBranchObj,
  currentUserName,
  feedback
}) => {
  return (
    <>
      {/* Cabecera Principal */}
      <div className="bg-[#f0f4f8] border border-gray-400 p-3.5 rs-header-bar text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#0055ea] to-[#003c74] border border-[#002244] flex items-center justify-center text-white shadow-xs shrink-0">
            <ShoppingBag className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                style={{ color: '#ffffff' }}
                className={`${
                  isBranchAdmin ? 'bg-emerald-700' : 'bg-red-700'
                } !text-white text-[9px] font-black px-1.5 py-0.2 rounded-xs uppercase tracking-wider`}
              >
                {isBranchAdmin && activeAdminBranchObj
                  ? `PANEL ADMIN // ${activeAdminBranchObj.city.toUpperCase()}`
                  : 'SUPER ADMIN'}
              </span>
              <h1 className="font-extrabold text-sm text-[#003c74] uppercase tracking-wide">
                {isBranchAdmin && activeAdminBranchObj
                  ? `Registrar Venta — Sucursal ${activeAdminBranchObj.city} (${activeAdminBranchObj.name})`
                  : 'Registrar Venta de Inventario'}
              </h1>
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5">
              {isBranchAdmin && activeAdminBranchObj
                ? `Terminal de ventas exclusiva de ${activeAdminBranchObj.city}. La venta se asigna automáticamente al administrador en sesión (${currentUserName}).`
                : 'Flujo ordenado: (1) Información del Producto a Vender, (2) Información del Cliente y Modalidad de Entrega, (3) Estado de la Transacción: Seleccione el Tipo de Pago.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/inventory">
            <button type="button" className="winxp-button text-xs py-1 px-2.5 flex items-center gap-1.5 font-bold">
              <ArrowRight className="w-3.5 h-3.5 rotate-180 text-blue-700" />
              <span>Inventario</span>
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

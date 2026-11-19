import React from 'react';
import {
  Ticket,
  Plus,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  History,
  Award
} from 'lucide-react';
import { RedeemedUserCoupon } from '../../../services/couponsService';
import { CouponItem, formatCLP } from './pageEditorTypes';

interface CouponsEditorTabProps {
  coupons: CouponItem[];
  redeemedCouponsLog: RedeemedUserCoupon[];
  setSelectedCouponForHistory: (coup: CouponItem | 'ALL' | null) => void;
  handleOpenCreateCoupon: () => void;
  handleToggleCouponActive: (coup: CouponItem) => void;
  handleOpenEditCoupon: (coup: CouponItem) => void;
  setCouponToDelete: (coup: CouponItem | null) => void;
}

export const CouponsEditorTab: React.FC<CouponsEditorTabProps> = ({
  coupons,
  redeemedCouponsLog,
  setSelectedCouponForHistory,
  handleOpenCreateCoupon,
  handleToggleCouponActive,
  handleOpenEditCoupon,
  setCouponToDelete
}) => {
  return (
    <div className="bg-white border-2 border-gray-400 p-4 space-y-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Ticket
              className="w-4 h-4 fill-purple-300 shrink-0"
              stroke="#000000"
              strokeWidth={1.5}
            />
            <span className="font-extrabold text-xs text-[#003c74] uppercase">
              Administrador de Cupones Canjeables por Puntos &amp; Códigos de 1 Solo Uso
            </span>
          </div>
          <p className="text-[11px] text-gray-600">
            Los cupones creados aquí aparecen automáticamente en <strong>Mi Perfil &gt; Puntos Acumulados</strong>. Cada vez que un cliente canjea sus puntos, el sistema le genera un <strong>código único e irrepetible de 1 solo uso</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCouponForHistory('ALL')}
            className="winxp-button text-xs py-1 px-3 font-bold flex items-center gap-1.5 text-purple-950"
          >
            <History className="w-3.5 h-3.5 text-purple-700" />
            <span>Historial de Códigos Canjeados ({redeemedCouponsLog.length})</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreateCoupon}
            className="winxp-button winxp-button-primary text-xs py-1 px-3.5 font-bold flex items-center gap-1.5 text-white bg-purple-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Nuevo Cupón Canjeable</span>
          </button>
        </div>
      </div>

      {/* Resumen del Flujo de Puntos y Cupones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 bg-purple-50/60 border border-purple-200 p-2.5 text-[11px]">
        <div className="flex items-start gap-2 bg-white p-2 border border-purple-200">
          <span
            data-force-white="true"
            style={{ color: '#ffffff' }}
            className="bg-purple-700 text-white font-black px-1.5 py-0.5 text-[10px] rounded-xs shrink-0"
          >
            1
          </span>
          <div>
            <strong className="text-purple-950 block">Plantilla del Admin (Catálogo)</strong>
            <span className="text-gray-600">Defines el costo en puntos (Regla: 1 Pto = $10 CLP), descuento y prefijo.</span>
          </div>
        </div>
        <div className="flex items-start gap-2 bg-white p-2 border border-purple-200">
          <span
            data-force-white="true"
            style={{ color: '#ffffff' }}
            className="bg-blue-700 text-white font-black px-1.5 py-0.5 text-[10px] rounded-xs shrink-0"
          >
            2
          </span>
          <div>
            <strong className="text-blue-950 block">Canje con Código Único</strong>
            <span className="text-gray-600">
              Al canjear puntos en su perfil, el usuario recibe un código irrepetible (ej: <code className="font-mono font-bold">DROP3K-XP-8492</code>).
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2 bg-white p-2 border border-purple-200">
          <span
            data-force-white="true"
            style={{ color: '#ffffff' }}
            className="bg-emerald-700 text-white font-black px-1.5 py-0.5 text-[10px] rounded-xs shrink-0"
          >
            3
          </span>
          <div>
            <strong className="text-emerald-950 block">1 Solo Uso por Canje</strong>
            <span className="text-gray-600">
              Cuando el cliente paga su orden en el Checkout, ese código único pasa a <strong>Utilizado</strong> y se bloquea.
            </span>
          </div>
        </div>
      </div>

      {/* TABLA DE CUPONES REGISTRADOS */}
      <div className="nl-page-editor-table-scroll border-2 border-gray-400 bg-white">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#e4ebf2] border-b border-gray-400 text-gray-800 font-extrabold uppercase text-[11px]">
              <th className="p-2.5 border-r border-gray-300">Nombre del Cupón &amp; Etiqueta</th>
              <th className="p-2.5 border-r border-gray-300 text-center">Costo en Puntos</th>
              <th className="p-2.5 border-r border-gray-300">Prefijo (Generador Único)</th>
              <th className="p-2.5 border-r border-gray-300 text-center">Tipo &amp; Descuento</th>
              <th className="p-2.5 border-r border-gray-300 text-right">Mínimo de Compra</th>
              <th className="p-2.5 border-r border-gray-300">Vigencia tras Canje</th>
              <th className="p-2.5 border-r border-gray-300 text-center">Canjes / Stock</th>
              <th className="p-2.5 text-center w-64">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {coupons.map((coup) => {
              const generatedForThis = redeemedCouponsLog.filter(
                (r) => r.templateId === coup.id || r.code.startsWith(coup.code.split('-')[0])
              );
              return (
                <tr
                  key={coup.id}
                  className={`hover:bg-purple-50/40 transition-colors ${
                    !coup.isActive ? 'opacity-60 bg-gray-50' : ''
                  }`}
                >
                  <td className="p-2.5 border-r border-gray-200">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        data-force-white="true"
                        className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-sky-700 text-white border border-sky-900 rounded-xs"
                      >
                        {coup.badge || 'EXCLUSIVO'}
                      </span>
                      {!coup.isActive && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-gray-200 text-gray-700 border border-gray-400 rounded-xs">
                          PAUSADO
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-gray-950 mt-0.5">{coup.name}</div>
                  </td>

                  {/* Costo en Puntos */}
                  <td className="p-2.5 border-r border-gray-200 text-center bg-amber-50/40">
                    <div className="inline-flex items-center gap-1 font-mono font-black text-xs text-red-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-xs">
                      <Award className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>{coup.pointsCost} Pts</span>
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                      Equiv: {formatCLP(coup.pointsCost * 10)}
                    </div>
                  </td>

                  {/* Prefijo Generador de Código Único */}
                  <td className="p-2.5 border-r border-gray-200 bg-purple-50/40">
                    <div className="font-mono font-black text-purple-900 text-xs">
                      {coup.code}-XP-<span className="text-purple-500">XXXX</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Genera código distinto por cada canje
                    </div>
                  </td>

                  {/* Tipo & Descuento */}
                  <td className="p-2.5 border-r border-gray-200 text-center">
                    {coup.discountType === 'percentage' ? (
                      <span className="inline-block px-2 py-0.5 font-black text-xs bg-rose-100 text-rose-800 border border-rose-300 rounded-xs">
                        {coup.discountValue}% OFF
                      </span>
                    ) : coup.discountType === 'free_shipping' ? (
                      <span className="inline-block px-2 py-0.5 font-black text-xs bg-sky-100 text-sky-900 border border-sky-300 rounded-xs">
                        ENVÍO GRATIS
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 font-black text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xs">
                        {formatCLP(coup.discountValue)} CLP
                      </span>
                    )}
                  </td>

                  <td className="p-2.5 border-r border-gray-200 text-right font-bold text-gray-900">
                    {coup.minPurchase > 0 ? formatCLP(coup.minPurchase) : 'Sin mínimo'}
                  </td>

                  <td className="p-2.5 border-r border-gray-200 text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="font-semibold">{coup.expirationRule}</span>
                    </div>
                  </td>

                  <td className="p-2.5 border-r border-gray-200 text-center">
                    <div className="font-bold text-gray-900 font-mono">
                      {coup.totalRedemptions} / {coup.maxUses}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCouponForHistory(coup)}
                      className="text-[10px] text-purple-800 hover:underline font-bold cursor-pointer mt-0.5"
                    >
                      Ver códigos ({generatedForThis.length})
                    </button>
                  </td>

                  <td className="p-2.5 text-center">
                    <div className="flex items-center justify-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleToggleCouponActive(coup)}
                        className={`winxp-button text-[11px] py-0.5 px-2 font-bold flex items-center gap-1 ${
                          coup.isActive ? 'text-emerald-800' : 'text-gray-600'
                        }`}
                        title={
                          coup.isActive
                            ? 'Visible en el perfil de usuarios (Clic para pausar)'
                            : 'Pausado (Clic para activar en el perfil de usuarios)'
                        }
                      >
                        {coup.isActive ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        )}
                        <span>{coup.isActive ? 'Activo' : 'Pausado'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditCoupon(coup)}
                        className="winxp-button text-[11px] py-0.5 px-2 text-blue-900 font-bold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCouponToDelete(coup)}
                        className="winxp-button text-[11px] py-0.5 px-2 text-red-700 font-bold flex items-center gap-1"
                        title="Eliminar cupón"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

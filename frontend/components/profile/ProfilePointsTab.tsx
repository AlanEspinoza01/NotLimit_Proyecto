import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Award,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy
} from 'lucide-react';
import {
  RedeemedUserCoupon,
  getCouponDiscountDescription,
  getCouponMinPurchaseLabel
} from '../../services/couponsService';
import { CouponItem } from './profileTypes';

interface ProfilePointsTabProps {
  loyaltyPoints: number;
  pointsNotification: string | null;
  setPointsNotification: (msg: string | null) => void;
  adminCouponCatalog: CouponItem[];
  redeemedCoupons: RedeemedUserCoupon[];
  copiedCouponCode: string | null;
  handleRedeemCoupon: (coupon: CouponItem) => void;
  handleCopyCode: (code: string) => void;
}

export const ProfilePointsTab: React.FC<ProfilePointsTabProps> = ({
  loyaltyPoints,
  pointsNotification,
  setPointsNotification,
  adminCouponCatalog,
  redeemedCoupons,
  copiedCouponCode,
  handleRedeemCoupon,
  handleCopyCode
}) => {
  return (
    <div className="space-y-4">
      {/* Notificación de Puntos / Canje */}
      {pointsNotification && (
        <div className="p-2.5 bg-green-100 border-2 border-green-600 text-green-900 text-xs flex items-center justify-between rounded-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-700 shrink-0" />
            <span className="font-bold">{pointsNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setPointsNotification(null)}
            className="text-green-800 hover:text-black font-bold text-sm px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Banner de Saldo de Puntos (Rediseño Estilo Windows XP Luna / Rewards OS sin texto negro) */}
      <div
        style={{
          background: 'linear-gradient(180deg, #0058ee 0%, #288eff 25%, #0055ea 75%, #003db3 100%)',
          borderColor: '#002575',
          boxShadow: '0 4px 12px rgba(0, 35, 120, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
        }}
        className="p-4 border-2 rounded-xs winxp-bevel-out text-white space-y-3"
      >
        {/* Fila Principal: Saldo y Regla Oficial */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-xs"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.4)'
              }}
            >
              <Award className="w-3.5 h-3.5" style={{ color: '#fef08a' }} />
              <span style={{ color: '#ffffff' }}>Programa NoLimits Rewards OS</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className="text-2xl sm:text-3xl font-black tracking-tight"
                style={{
                  color: '#ffffff',
                  textShadow: '0 2px 5px rgba(0, 20, 80, 0.6)'
                }}
              >
                {loyaltyPoints} PUNTOS ACUMULADOS
              </h3>
            </div>

            <div
              className="text-xs font-medium flex flex-wrap items-center gap-1.5 pt-0.5"
              style={{ color: '#ffffff' }}
            >
              <span style={{ color: '#ffffff' }}>Equivalen a</span>
              <span
                className="font-black text-sm px-2 py-0.5 rounded-xs shadow-xs"
                style={{
                  backgroundColor: '#fef08a',
                  color: '#003db3',
                  border: '1px solid #fde047'
                }}
              >
                ${(loyaltyPoints * 10).toLocaleString('es-CL')} CLP
              </span>
              <span style={{ color: '#ffffff' }}>para canjear por cupones de compra oficiales.</span>
            </div>
          </div>

          {/* Tarjeta Regla Oficial de Canje (Sin texto negro, contraste óptimo) */}
          <div
            className="p-3.5 rounded-xs border text-center shrink-0 sm:min-w-[210px] shadow-sm"
            style={{
              background: 'linear-gradient(180deg, rgba(0, 30, 95, 0.75) 0%, rgba(0, 20, 70, 0.9) 100%)',
              borderColor: 'rgba(255, 255, 255, 0.35)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.25)'
            }}
          >
            <div
              className="text-[11px] uppercase font-bold tracking-wider"
              style={{ color: '#bae6fd' }}
            >
              Regla Oficial:
            </div>
            <div
              className="font-black text-lg my-1 tracking-tight"
              style={{
                color: '#fef08a',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.7)'
              }}
            >
              1 Punto = $10 CLP
            </div>
            <div
              className="text-[11px] font-semibold flex items-center justify-center gap-1"
              style={{ color: '#ffffff' }}
            >
              <Sparkles className="w-3 h-3" style={{ color: '#67e8f9' }} />
              <span style={{ color: '#ffffff' }}>Sin vencimiento de saldo</span>
            </div>
          </div>
        </div>

        {/* Barra Inferior con Puntos Destacados */}
        <div
          className="pt-2.5 border-t flex flex-wrap items-center gap-2 text-[11px]"
          style={{ borderColor: 'rgba(255, 255, 255, 0.25)' }}
        >
          <div
            className="px-2.5 py-1 rounded-xs flex items-center gap-1.5 font-medium shadow-xs"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <Camera className="w-3.5 h-3.5" style={{ color: '#fef08a' }} />
            <span style={{ color: '#ffffff' }}>
              <strong style={{ color: '#ffffff' }}>+100 Pts</strong> por reseña con fotos
            </span>
          </div>

          <div
            className="px-2.5 py-1 rounded-xs flex items-center gap-1.5 font-medium shadow-xs"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <Award className="w-3.5 h-3.5" style={{ color: '#67e8f9' }} />
            <span style={{ color: '#ffffff' }}>Canje directo por cupones</span>
          </div>

          <div
            className="px-2.5 py-1 rounded-xs flex items-center gap-1.5 font-medium shadow-xs"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <Check className="w-3.5 h-3.5" style={{ color: '#86efac' }} />
            <span style={{ color: '#ffffff' }}>Aplicable en tu próximo checkout</span>
          </div>
        </div>
      </div>

      {/* ¿Cómo Ganar Más Puntos? */}
      <div className="p-3 bg-amber-50 border border-amber-300 text-xs space-y-1.5 winxp-bevel-in">
        <div className="font-bold text-amber-900 flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-amber-700" />
          <span>¿Cómo ganar puntos en NoLimits?</span>
        </div>
        <ul className="text-gray-700 text-[11px] space-y-1 pl-4 list-disc">
          <li>
            <strong className="text-blue-900">+100 Puntos:</strong> Por dejar una reseña con fotos reales
            mostrando el calce de tus prendas compradas.
          </li>
          <li>
            <strong className="text-blue-900">+20 Puntos:</strong> Por reseñas breves sin fotos.
          </li>
          <li>
            <strong className="text-blue-900">Canje directo:</strong> Utiliza tus puntos en el catálogo de
            cupones inferior y aplícalos directamente en el checkout.
          </li>
        </ul>
      </div>

      {/* Catálogo de Cupones Canjeables (Sincronizado con Super Admin > Editar Cupones) */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-300 pb-1.5 gap-1">
          <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-600" />
            Catálogo de Cupones Disponibles para Canje
          </h4>
          <span className="text-[11px] text-gray-500">
            Genera un código único de 1 solo uso por canje
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {adminCouponCatalog
            .filter((c) => c.isActive)
            .map((coupon) => {
              const isOutOfStock = coupon.totalRedemptions >= coupon.maxUses;
              const canAfford = !isOutOfStock && (loyaltyPoints || 0) >= coupon.pointsCost;

              return (
                <div
                  key={coupon.id}
                  className="bg-white border-2 border-gray-300 p-3 space-y-2 winxp-bevel-out flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 border rounded-xs shadow-xs"
                        style={{
                          background: 'linear-gradient(180deg, #0284c7 0%, #0369a1 100%)',
                          borderColor: '#075985',
                          color: '#ffffff'
                        }}
                      >
                        <span style={{ color: '#ffffff' }}>{coupon.badge || 'EXCLUSIVO'}</span>
                      </span>
                      <span className="text-xs font-bold text-red-700 font-mono">
                        {coupon.pointsCost} Puntos
                      </span>
                    </div>
                    <h5 className="font-bold text-sm text-gray-900 mt-1">{coupon.name}</h5>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {getCouponDiscountDescription(coupon)}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-gray-500 mt-1 font-mono">
                      <span>Condición: {getCouponMinPurchaseLabel(coupon.minPurchase)}</span>
                      <span className="text-amber-800 font-semibold">
                        Vigencia: {coupon.expirationDays} días tras canje
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleRedeemCoupon(coupon)}
                      className={`w-full winxp-button text-xs py-1.5 px-3 font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                        canAfford
                          ? 'winxp-button-primary text-blue-900 hover:bg-blue-100'
                          : 'opacity-50 cursor-not-allowed text-gray-500 bg-gray-100'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>
                        {isOutOfStock
                          ? 'Stock de Canjes Agotado'
                          : canAfford
                          ? `Canjear por ${coupon.pointsCost} Puntos`
                          : `Faltan ${coupon.pointsCost - (loyaltyPoints || 0)} Puntos`}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Mis Cupones Canjeados (Códigos Únicos de 1 Solo Uso) */}
      <div className="space-y-2 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-300 pb-1.5 gap-1">
          <h4 className="font-bold text-sm text-blue-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            Mis Cupones Canjeados (Códigos Únicos de 1 Solo Uso)
          </h4>
          <Link
            to="/cart"
            className="text-[11px] font-bold text-blue-800 hover:underline flex items-center gap-1"
          >
            <span>Ir al Carrito a usarlos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {redeemedCoupons.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 border border-gray-300">
            Aún no has canjeado cupones. Selecciona uno del catálogo superior.
          </div>
        ) : (
          <div className="space-y-2">
            {redeemedCoupons.map((coupon, idx) => {
              const isUsed = coupon.status === 'usado';
              const isExpired = coupon.status === 'expirado';
              return (
                <div
                  key={coupon.id || idx}
                  className={`p-2.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                    isUsed
                      ? 'bg-gray-100 border-gray-300 opacity-75'
                      : isExpired
                      ? 'bg-rose-50/60 border-rose-300 opacity-75'
                      : 'bg-yellow-50/70 border-yellow-400'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900">{coupon.title}</span>
                      {isUsed ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-200 text-gray-700 border border-gray-400 rounded-xs">
                          ✓ Utilizado (1/1 uso){coupon.usedOrderNumber ? ` · Orden #${coupon.usedOrderNumber}` : ''}
                        </span>
                      ) : isExpired ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-xs">
                          Vencido
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-400 rounded-xs">
                          🟢 Disponible (1 solo uso)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-600">
                      Descuento: <span className="font-bold text-red-700">{coupon.discount}</span>
                      {coupon.minPurchase > 0 && (
                        <span> · {getCouponMinPurchaseLabel(coupon.minPurchase)}</span>
                      )}{' '}
                      · Canjeado el: {coupon.date}
                    </div>
                    <div className="text-[10px] font-mono text-gray-500">
                      Vigencia límite: <strong>{coupon.expiresAtLabel}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={`bg-white border-2 border-dashed font-mono font-bold text-xs px-2.5 py-1 select-all ${
                        isUsed || isExpired
                          ? 'border-gray-300 text-gray-400 line-through'
                          : 'border-gray-500 text-gray-900'
                      }`}
                    >
                      {coupon.code}
                    </div>
                    {!isUsed && !isExpired && (
                      <button
                        type="button"
                        onClick={() => handleCopyCode(coupon.code)}
                        className="winxp-button text-xs py-1 px-2.5 font-bold text-blue-900 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3 text-blue-700" />
                        <span>{copiedCouponCode === coupon.code ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

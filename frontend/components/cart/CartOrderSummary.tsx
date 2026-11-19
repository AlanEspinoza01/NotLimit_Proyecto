import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, AlertCircle, ArrowRight } from 'lucide-react';
import { RedeemedUserCoupon } from '../../services/couponsService';
import { ShippingQuoteOption } from '../../services/shippingQuotesEngine';

export interface CartOrderSummaryProps {
  appliedCoupon: RedeemedUserCoupon | null;
  removeCoupon: () => void;
  couponInput: string;
  setCouponInput: (val: string) => void;
  handleApplyCouponSubmit: (codeToApply?: string) => void;
  myAvailableCoupons: RedeemedUserCoupon[];
  couponFeedback: { type: 'success' | 'error'; text: string } | null;
  subtotal: number;
  discount: number;
  couponDiscount: number;
  deliveryMethod: 'pickup' | 'shipping';
  shippingCourier: string;
  shippingPaymentMode: 'paid' | 'on_delivery';
  selectedQuote: ShippingQuoteOption | undefined;
  hasFreeShippingCoupon: boolean;
  currentShippingCost: number;
  finalTotal: number;
  errorMessage: string;
  handleProceedToPayment: () => void;
}

export const CartOrderSummary: React.FC<CartOrderSummaryProps> = ({
  appliedCoupon,
  removeCoupon,
  couponInput,
  setCouponInput,
  handleApplyCouponSubmit,
  myAvailableCoupons,
  couponFeedback,
  subtotal,
  discount,
  couponDiscount,
  deliveryMethod,
  shippingCourier,
  shippingPaymentMode,
  selectedQuote,
  hasFreeShippingCoupon,
  currentShippingCost,
  finalTotal,
  errorMessage,
  handleProceedToPayment
}) => {
  return (
    <div className="bg-[#f8fafc] border border-gray-400 p-3 space-y-3 winxp-bevel-out">
      <h3 className="font-bold text-xs text-blue-900 pb-1.5 border-b border-gray-300">
        RESUMEN DE COMPRA
      </h3>

      {/* Módulo de Cupón de Descuento Canjeado (Código Único de 1 Solo Uso) */}
      <div className="bg-purple-50/70 border border-purple-300 p-2.5 space-y-2 text-xs">
        <div className="flex items-center justify-between flex-wrap gap-1">
          <span className="font-bold text-purple-950 flex items-center gap-1.5 text-[11px]">
            <Ticket className="w-3.5 h-3.5 text-purple-700" />
            <span>Cupón Canjeado por Puntos (1 solo uso):</span>
          </span>
          <Link
            to="/profile"
            className="text-[10px] font-bold text-blue-800 hover:underline"
          >
            Ver mis puntos
          </Link>
        </div>

        {appliedCoupon ? (
          <div className="bg-emerald-50 border border-emerald-400 p-2 flex items-center justify-between gap-2">
            <div>
              <div className="font-bold text-emerald-950 flex items-center gap-1.5 flex-wrap">
                <span>✓ {appliedCoupon.code}</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-xs font-mono">
                  {appliedCoupon.discount}
                </span>
              </div>
              <div className="text-[10px] text-emerald-800">
                {appliedCoupon.title} · Se marcará como utilizado al confirmar el pago.
              </div>
            </div>
            <button
              type="button"
              onClick={removeCoupon}
              className="winxp-button text-[10px] py-0.5 px-2 text-red-700 font-bold shrink-0 cursor-pointer"
            >
              Quitar
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Ej: DROP3K-XP-7721"
                className="winxp-input flex-1 text-xs py-1 px-2 font-mono uppercase bg-white min-w-0"
              />
              <button
                type="button"
                onClick={() => handleApplyCouponSubmit()}
                className="winxp-button text-xs py-1 px-3 font-bold text-purple-950 cursor-pointer shrink-0"
              >
                Aplicar
              </button>
            </div>

            {myAvailableCoupons.length > 0 && (
              <div className="space-y-1 pt-0.5">
                <span className="text-[10px] text-gray-600 block">
                  Tus códigos disponibles listos para usar (clic para aplicar):
                </span>
                <div className="flex flex-wrap gap-1">
                  {myAvailableCoupons.slice(0, 4).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleApplyCouponSubmit(c.code)}
                      className="text-[10px] font-mono font-bold bg-white hover:bg-purple-100 text-purple-900 border border-dashed border-purple-500 px-2 py-0.5 cursor-pointer transition-colors"
                      title={`${c.title} (${c.discount})`}
                    >
                      {c.code} ({c.discount})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {couponFeedback && (
          <div
            className={`p-1.5 text-[11px] font-semibold border ${
              couponFeedback.type === 'success'
                ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                : 'bg-rose-100 border-rose-400 text-rose-900'
            }`}
          >
            {couponFeedback.text}
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-xs text-gray-700 bg-white border border-gray-300 p-2.5">
        <div className="flex justify-between">
          <span>Subtotal prendas:</span>
          <span className="font-mono">${subtotal.toLocaleString('es-CL')}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-700 font-semibold">
            <span>
              Descuentos aplicados{appliedCoupon ? ` (Incluye ${appliedCoupon.code})` : ''}:
            </span>
            <span className="font-mono">-${discount.toLocaleString('es-CL')}</span>
          </div>
        )}
        {appliedCoupon && couponDiscount > 0 && (
          <div className="flex justify-between text-[11px] text-purple-800 font-mono">
            <span>↳ Ahorro Cupón ({appliedCoupon.code}):</span>
            <span>-${couponDiscount.toLocaleString('es-CL')} CLP</span>
          </div>
        )}
        <div className="flex justify-between gap-2">
          <span>Modalidad de entrega:</span>
          <span className="font-semibold text-blue-900 text-right">
            {deliveryMethod === 'pickup' ? 'Retiro en Sucursal' : `Envío Domicilio (${shippingCourier})`}
          </span>
        </div>

        {/* Desglose de costo de envío */}
        {deliveryMethod === 'pickup' ? (
          <div className="flex justify-between text-[11px] text-green-700 font-bold">
            <span>Costo de entrega:</span>
            <span>¡GRATIS! (Retiro Presencial)</span>
          </div>
        ) : (
          <div className="flex justify-between text-[11px]">
            <span className="text-gray-600">Costo de despacho:</span>
            <span className="font-mono font-bold">
              {shippingPaymentMode === 'on_delivery' ? (
                <span className="text-green-700 font-bold">
                  Por Pagar (${selectedQuote?.priceClp.toLocaleString('es-CL') || '0'} CLP)
                </span>
              ) : hasFreeShippingCoupon ? (
                <span className="text-green-700 font-bold">
                  ¡GRATIS! (Cupón {appliedCoupon?.code})
                </span>
              ) : (
                <span className="text-blue-900 font-bold">
                  ${currentShippingCost.toLocaleString('es-CL')} CLP
                </span>
              )}
            </span>
          </div>
        )}

        <div className="border-t border-gray-300 pt-1.5 flex justify-between font-bold text-sm text-gray-900">
          <span>Total a pagar:</span>
          <span className="text-red-700 font-mono text-base">
            ${finalTotal.toLocaleString('es-CL')} CLP
          </span>
        </div>
      </div>

      {/* Mensaje de validación si faltan datos */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-300 p-2 text-xs text-red-800 flex items-center gap-1.5 rounded-xs">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* BOTÓN REQUERIDO: "Proceder con el Pago" */}
      <div>
        <button
          type="button"
          onClick={handleProceedToPayment}
          className="winxp-button winxp-button-primary text-xs py-2.5 w-full font-bold text-blue-900 shadow-md flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-100 transition-colors"
        >
          <span className="tracking-wide">Proceder con el Pago</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="text-[10px] text-gray-500 text-center leading-tight">
        🔒 Al presionar este botón serás redirigido a la <strong>Pasarela Oficial de Pago Webpay</strong> (Paso 3).
      </div>
    </div>
  );
};

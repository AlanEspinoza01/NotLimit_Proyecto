import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { markRedeemedCouponAsUsed } from '../services/couponsService';
import api from '../api/axios';
import { WindowFrame } from '../components/layout/WindowFrame';
import { PurchaseReceipt } from '../components/common/PurchaseReceipt';
import type { PurchaseReceiptData } from '../services/receiptExport';

export const WebpayResultView: React.FC = () => {
  const { search } = useLocation();
  const query = new URLSearchParams(search);
  const order = query.get('order') || '';
  const { clearCart } = useCart();
  const [state, setState] = useState<'LOADING'|'CONFIRMED'|'REJECTED'|'PENDING'|'ERROR'>('LOADING');
  const [receipt, setReceipt] = useState<PurchaseReceiptData | null>(null);

  useEffect(() => {
    // La clave es temporal y pertenece a esta compra, no se expone en la URL.
    const raw = sessionStorage.getItem(`nolimits_webpay_order_${order}`);
    if (!raw) { setState('ERROR'); return; }
    let parsed: { resultKey: string; couponCode: string };
    try { parsed = JSON.parse(raw); } catch { setState('ERROR'); return; }
    let active = true;
    let checks = 0;
    const check = async () => {
      try {
        const response = await api.get('/payments/webpay/result', {
          params: { order, key: parsed.resultKey }
        });
        if (!active) return;
        const data = response.data.data;
        if (data.state === 'CONFIRMED' && data.paymentStatus === 'CONFIRMED') {
          // Nunca crear un comprobante desde valores del carrito; debe venir de la API.
          setReceipt(data.receipt?.verified ? data.receipt : null);
          if (sessionStorage.getItem(`nolimits_webpay_success_${order}`) !== '1') {
            if (parsed.couponCode) markRedeemedCouponAsUsed(parsed.couponCode, order);
            clearCart();
            sessionStorage.setItem(`nolimits_webpay_success_${order}`, '1');
          }
          setState('CONFIRMED');
        } else if (data.state === 'REJECTED') {
          setState('REJECTED');
        } else {
          setState('PENDING');
        }
      } catch {
        if (active) setState('ERROR');
      }
    };
    void check();
    const interval = window.setInterval(() => {
      if (checks++ < 15) void check(); else window.clearInterval(interval);
    }, 4000);
    return () => { active = false; window.clearInterval(interval); };
    // Mantener polling por orden para evitar reinicios al limpiar carrito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  return <div className="w-full max-w-[860px] mx-auto py-6 px-3 text-xs font-sans">
    <WindowFrame title="Resultado de la compra - NoLimits" statusBarText="ESTADO DE LA COMPRA">
      <div className="bg-white border border-gray-300 p-3 sm:p-5 space-y-4 text-gray-900">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-black text-blue-900">Resultado de tu compra</h1>
          <p>Orden: <strong className="font-mono">{order || 'No identificada'}</strong></p>
        </div>
        {state === 'CONFIRMED' && <>
          {receipt ? <PurchaseReceipt receipt={receipt}/> :
            <div className="bg-yellow-50 border border-yellow-500 p-3 text-yellow-900">Pago confirmado, pero el detalle del comprobante todavía no está disponible. Consulta la orden en tu historial o contacta a soporte; no repitas el pago.</div>}
        </>}
        {state === 'REJECTED' && <div className="bg-red-50 border border-red-500 p-3 text-red-900 text-center">Pago rechazado. La reserva de stock y el cupón se liberaron.</div>}
        {(state === 'PENDING' || state === 'LOADING') && <div className="bg-yellow-50 border border-yellow-500 p-3 text-yellow-900 text-center">Verificando el resultado con el servidor. No repitas el pago antes de confirmar su estado.</div>}
        {state === 'ERROR' && <div className="bg-orange-50 border border-orange-500 p-3 text-orange-900 text-center">No fue posible consultar el pago desde esta pestaña. Contacta a soporte con tu orden y no intentes cobrarla nuevamente.</div>}
        <div className="flex flex-wrap justify-center gap-2 border-t border-gray-200 pt-3">
          <Link className="winxp-button inline-block px-4 py-2 font-bold" to="/">Volver al inicio</Link>
          <Link className="winxp-button inline-block px-4 py-2" to="/catalog">Ver catálogo</Link>
          <Link className="winxp-button inline-block px-4 py-2" to="/profile">Mis compras</Link>
        </div>
      </div>
    </WindowFrame>
  </div>;
};

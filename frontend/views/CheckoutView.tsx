import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Store,
  Truck,
  Clock,
  CheckCircle2,
  FileText,
  User,
  ShoppingBag,
  Printer
} from 'lucide-react';
import { WindowFrame } from '../components/layout/WindowFrame';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useBranch, formatBranchPickupSummary } from '../context/BranchContext';
import { PixelIcon } from '../components/common/PixelIcon';
import { CheckoutCustomerData, Product, PaymentMethodType } from '../types';
import { calculateCourierQuotes, getWeightTierInfo } from '../services/shippingQuotesEngine';
import { markRedeemedCouponAsUsed } from '../services/couponsService';
import api from '../api/axios';

const isApparelCategory = (categoryName?: string) => {
  if (!categoryName) return false;
  const c = categoryName.toLowerCase();
  return (
    c.includes('poleron') ||
    c.includes('hoodie') ||
    c.includes('chaqueta') ||
    c.includes('pantalon') ||
    c.includes('pantalón') ||
    c.includes('cargo') ||
    c.includes('polera') ||
    c.includes('top') ||
    c.includes('zapatilla') ||
    c.includes('calzado')
  );
};

const hasApparelSize = (product: Product, size?: string) => {
  if (!product.sizes || product.sizes.length === 0) return false;
  if (!isApparelCategory(product.category)) return false;
  if (!size || size === 'all') return false;
  return true;
};

export const CheckoutView: React.FC = () => {
  const {
    items,
    subtotal,
    discount,
    clearCart,
    cartTotalWeightGrams,
    appliedCoupon,
    hasFreeShippingCoupon
  } = useCart();
  const { currentUser } = useAuth();
  const { branches } = useBranch();

  const [checkoutData] = useState<CheckoutCustomerData>(() => {
    let defaultAddr: any = null;
    const defaultAddrSaved = localStorage.getItem('nolimits_default_address');
    if (defaultAddrSaved) {
      try {
        defaultAddr = JSON.parse(defaultAddrSaved);
      } catch {
        // ignore
      }
    }

    const saved = localStorage.getItem('nolimits_checkout_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.customerRut) {
          parsed.customerRut = '19.876.543-2';
        }
        if (defaultAddr) {
          if (!parsed.shippingStreet) parsed.shippingStreet = defaultAddr.street;
          if (!parsed.shippingNumber) parsed.shippingNumber = defaultAddr.number;
          if (!parsed.shippingApartment) parsed.shippingApartment = defaultAddr.apartment || '';
          if (!parsed.shippingComuna) parsed.shippingComuna = defaultAddr.comuna;
          if (!parsed.shippingCity) parsed.shippingCity = defaultAddr.city;
          if (!parsed.shippingAddress) {
            parsed.shippingAddress = `${defaultAddr.street} ${defaultAddr.number}${defaultAddr.apartment ? ', ' + defaultAddr.apartment : ''}`;
          }
        }
        return parsed;
      } catch {
        // ignore
      }
    }
    return {
      customerName: defaultAddr?.recipientName || currentUser?.name || 'Valeria Gallardo',
      customerRut: '19.876.543-2',
      phonePrefix: '+56 9',
      customerPhone: defaultAddr?.phone || '+56 9 9123 4567',
      customerEmail: currentUser?.email || 'cliente@nolimits.cl',
      deliveryMethod: 'pickup',
      selectedBranchId: 'vina_del_mar',
      shippingRegion: 'Región de Valparaíso',
      shippingCountry: 'Chile',
      shippingComuna: defaultAddr?.comuna || 'Viña del Mar',
      shippingStreet: defaultAddr?.street || 'Av. Libertad',
      shippingNumber: defaultAddr?.number || '1400',
      shippingCourier: 'Starken',
      shippingPaymentMode: 'on_delivery',
      paymentMethod: 'webpay',
      shippingAddress: defaultAddr
        ? `${defaultAddr.street} ${defaultAddr.number}${defaultAddr.apartment ? ', ' + defaultAddr.apartment : ''}`
        : 'Av. Libertad 1400, Depto 402',
      shippingCity: defaultAddr?.city || 'Viña del Mar',
    };
  });

  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState<PaymentMethodType>(
    checkoutData.paymentMethod && checkoutData.paymentMethod !== 'voucher_transfer'
      ? checkoutData.paymentMethod
      : 'webpay'
  );

  const [confirmedOrderId, setConfirmedOrderId] = useState<string>('');
  const [confirmedDate, setConfirmedDate] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const physicalPickupBranches = useMemo(() => {
    return branches.filter(
      (b) => b.allowPickup !== false && b.id !== 'casa_matriz' && !b.isCorporate && b.isPhysicalStore !== false
    );
  }, [branches]);

  const selectedBranch =
    physicalPickupBranches.find((b) => b.id === checkoutData.selectedBranchId) ||
    physicalPickupBranches[0] ||
    branches[0];

  const courierQuotes = useMemo(() => {
    if (checkoutData.deliveryMethod !== 'shipping') return [];
    return calculateCourierQuotes({
      totalWeightGrams: cartTotalWeightGrams,
      destinationRegion: checkoutData.shippingRegion || 'Región de Valparaíso',
      destinationCommune: checkoutData.shippingComuna || 'Viña del Mar',
      originBranch: (checkoutData.selectedBranchId as any) || 'vina_del_mar',
      cartSubtotalClp: subtotal
    });
  }, [
    checkoutData.deliveryMethod,
    cartTotalWeightGrams,
    checkoutData.shippingRegion,
    checkoutData.shippingComuna,
    checkoutData.selectedBranchId,
    subtotal
  ]);

  const activeQuote = useMemo(() => {
    if (checkoutData.deliveryMethod !== 'shipping' || courierQuotes.length === 0) return null;
    const req = (checkoutData.shippingCourier || '').toLowerCase();
    return (
      courierQuotes.find((q) => {
        if (req.includes('paket') && q.courierId === 'paket') return true;
        if ((req.includes('blue') || req.includes('bluexpress')) && q.courierId === 'blue_express') return true;
        if (req.includes('starken') && q.courierId === 'starken') return true;
        return false;
      }) || courierQuotes[0]
    );
  }, [checkoutData.deliveryMethod, courierQuotes, checkoutData.shippingCourier]);

  const shippingFeeToPayOnline = useMemo(() => {
    if (checkoutData.deliveryMethod === 'pickup') return 0;
    if (hasFreeShippingCoupon) return 0;
    if (checkoutData.shippingPaymentMode === 'paid' && activeQuote && activeQuote.available) {
      return activeQuote.priceClp;
    }
    return 0;
  }, [checkoutData.deliveryMethod, checkoutData.shippingPaymentMode, activeQuote, hasFreeShippingCoupon]);

  const finalTotal = Math.max(0, subtotal - discount + shippingFeeToPayOnline);
  const weightTierInfo = getWeightTierInfo(cartTotalWeightGrams);

  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    setCheckoutError(null);

    const orderNumber = `NL-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const orderPayload = {
      orderNumber,
      date: nowStr,
      items: items.map((item) => ({
        productId: item.product.id || item.productId,
        sku: item.product.sku || 'NL-SKU',
        name: item.product.title,
        title: item.product.title,
        size: item.selectedSize,
        color: item.selectedColor.name,
        quantity: item.quantity,
        price: item.product.salePrice ?? item.product.price,
        image: item.product.images[0]
      })),
      total: finalTotal,
      subtotal,
      discount,
      couponUsed: appliedCoupon ? appliedCoupon.code : undefined,
      shippingFee: shippingFeeToPayOnline,
      shippingCost: shippingFeeToPayOnline,
      deliveryMethod: checkoutData.deliveryMethod,
      branchName: selectedBranch?.name || 'Viña del Mar',
      branchId: selectedBranch?.id || 'vina_del_mar',
      shippingAddress:
        checkoutData.deliveryMethod === 'shipping'
          ? `${checkoutData.shippingStreet || checkoutData.shippingAddress || 'Av. Libertad 1400'}, ${
              checkoutData.shippingComuna || checkoutData.shippingCity || 'Viña del Mar'
            }`
          : undefined,
      shippingStreet: checkoutData.shippingStreet || checkoutData.shippingAddress || '',
      shippingNumber: checkoutData.shippingNumber || '',
      shippingApartment: checkoutData.shippingApartment || '',
      shippingRegion: checkoutData.shippingRegion,
      shippingComuna: checkoutData.shippingComuna,
      courier:
        checkoutData.shippingCourier || (activeQuote ? activeQuote.courierName : 'Starken'),
      shippingPaymentMode: checkoutData.shippingPaymentMode,
      weightGrams: cartTotalWeightGrams,
      weightTier: weightTierInfo?.tierNumber || 5,
      paymentGateway: selectedPaymentGateway,
      customerName: checkoutData.customerName,
      customerRut: checkoutData.customerRut,
      customerPhone: checkoutData.customerPhone,
      customerEmail: checkoutData.customerEmail,
      status: 'Solicitud recibida'
    };

    try {
      const response = await api.post('/orders/checkout', orderPayload);
      const savedMongoOrder = response.data?.data;
      const finalOrderNumber = savedMongoOrder?.orderNumber || orderNumber;

      const localOrderRecord = {
        ...orderPayload,
        id: savedMongoOrder?._id?.toString() || `ord_${Date.now()}`,
        orderNumber: finalOrderNumber
      };

      try {
        const existing = JSON.parse(localStorage.getItem('nolimits_user_orders') || '[]');
        localStorage.setItem(
          'nolimits_user_orders',
          JSON.stringify([localOrderRecord, ...existing])
        );
      } catch {
        // ignore
      }

      if (appliedCoupon) {
        markRedeemedCouponAsUsed(appliedCoupon.code, finalOrderNumber);
      }

      setConfirmedOrderId(finalOrderNumber);
      setConfirmedDate(nowStr);
      clearCart();
    } catch (error: any) {
      console.error('Error procesando compra en MongoDB:', error);
      const msg =
        error.response?.data?.message ||
        'No se pudo procesar tu pedido en el servidor. Intenta nuevamente.';
      setCheckoutError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (confirmedOrderId) {
    return (
      <div className="max-w-3xl mx-auto py-6 font-sans">
        <WindowFrame
          title={`Orden_Confirmada_${confirmedOrderId}.exe - [Transacción Aprobada en MongoDB]`}
          icon={<PixelIcon name="windows-flag" size={16} />}
          statusBarText="PASARELA DE PAGO: AUTH 200_OK // STOCK DESCONTADO EN MONGODB // ORDEN REGISTRADA"
        >
          <div className="text-center py-6 px-4 space-y-4">
            <div className="inline-flex p-3 rounded-full bg-green-100 border-2 border-green-600 text-green-700 shadow-sm">
              <ShieldCheck className="w-12 h-12" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-green-800 bg-green-100 px-3 py-1 rounded border border-green-400">
                Transacción Aprobada y Sincronizada en MongoDB
              </span>
              <h2 className="text-2xl font-bold text-blue-900 mt-2 tracking-tight">
                ¡GRACIAS POR TU COMPRA EN NO LIMITS!
              </h2>
              <p className="text-xs text-gray-700 max-w-md mx-auto mt-1">
                Número de Orden Oficial:{' '}
                <span className="text-blue-800 font-mono font-bold text-base bg-blue-50 px-2 py-0.5 border border-blue-300 rounded">
                  {confirmedOrderId}
                </span>
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 font-mono">
                Fecha: {confirmedDate}
              </p>
            </div>

            <div className="bg-white border-2 border-[#7eaadb] winxp-bevel-in p-4 max-w-xl mx-auto text-left text-xs space-y-3">
              <div className="flex justify-between items-center border-b border-gray-300 pb-2">
                <div>
                  <div className="font-bold text-blue-900 text-sm">NO LIMITS APPAREL</div>
                  <div className="text-[10px] text-gray-500">Comprobante de Pedido & Despacho</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono text-gray-600">MEDIO UTILIZADO:</div>
                  <div className="font-bold text-xs uppercase text-blue-800">
                    {selectedPaymentGateway === 'webpay' && 'Webpay Plus Transbank'}
                    {selectedPaymentGateway === 'mercadopago' && 'Mercado Pago Checkout'}
                    {selectedPaymentGateway === 'khipu' && 'Khipu Transferencia'}
                    {selectedPaymentGateway === 'voucher_transfer' && 'Transferencia Bancaria'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 border border-gray-200">
                <div>
                  <span className="text-gray-500 text-[10px] block">CLIENTE TITULAR:</span>
                  <span className="font-bold text-gray-800">{checkoutData.customerName}</span>
                  <span className="text-gray-600 font-mono block text-[11px]">RUT: {checkoutData.customerRut}</span>
                </div>
                <div>
                  <span className="text-gray-500 text-[10px] block">CONTACTO:</span>
                  <span className="text-gray-700 block">{checkoutData.customerPhone}</span>
                  <span className="text-gray-600 truncate block text-[11px]">{checkoutData.customerEmail}</span>
                </div>
              </div>

              <div className="bg-blue-50/60 p-2.5 border border-blue-200">
                <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                  {checkoutData.deliveryMethod === 'pickup' ? (
                    <>
                      <Store className="w-3.5 h-3.5 text-blue-700" />
                      <span>RETIRO EN SUCURSAL FÍSICA SELECCIONADA</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-3.5 h-3.5 text-blue-700" />
                      <span>ENVÍO A DOMICILIO CON COURIER</span>
                    </>
                  )}
                </div>

                {checkoutData.deliveryMethod === 'pickup' ? (
                  <div className="space-y-0.5 text-gray-700">
                    <div><strong>Sucursal:</strong> {selectedBranch?.name}</div>
                    <div><strong>Dirección:</strong> {selectedBranch?.address}, {selectedBranch?.city}</div>
                    <div><strong>Horario de Retiro:</strong> {formatBranchPickupSummary(selectedBranch)}</div>
                    <div className="text-[10px] text-green-700 font-semibold mt-1">
                      ✓ Tu pedido estará listo para retiro en 15 minutos en el mesón de entrega.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0.5 text-gray-700">
                    <div><strong>Destino:</strong> {checkoutData.shippingAddress}, {checkoutData.shippingComuna}</div>
                    <div><strong>Región:</strong> {checkoutData.shippingRegion}</div>
                    <div>
                      <strong>Courier Asignado:</strong> {checkoutData.shippingCourier || (activeQuote ? activeQuote.courierName : 'Starken')}
                    </div>
                    <div className="text-[11px] text-gray-600 font-mono">
                      Peso estimado: {(cartTotalWeightGrams / 1000).toFixed(2)} KG ({weightTierInfo?.label || 'Más de 20 KG'})
                    </div>
                    <div className="text-[10px] text-blue-800 font-semibold mt-1">
                      {checkoutData.shippingPaymentMode === 'on_delivery'
                        ? 'Modalidad: Por pagar en destino al recibir.'
                        : 'Modalidad: Despacho pagado en esta transacción.'}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-300 pt-2 flex justify-between items-center">
                <span className="font-bold text-gray-800">TOTAL PAGADO AHORA:</span>
                <span className="font-mono font-bold text-base text-red-700">
                  ${finalTotal.toLocaleString('es-CL')} CLP
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="winxp-button text-xs py-2 px-4 font-bold text-gray-800 flex items-center gap-2"
              >
                <Printer className="w-4 h-4 text-gray-700" />
                <span>Imprimir Recibo</span>
              </button>

              <Link to="/catalog">
                <button
                  type="button"
                  className="winxp-button winxp-button-primary text-xs py-2 px-5 font-bold text-blue-900 flex items-center gap-2"
                >
                  <PixelIcon name="search" size={14} />
                  <span>Seguir Explorando el Catálogo</span>
                </button>
              </Link>
            </div>
          </div>
        </WindowFrame>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-8 font-sans">
        <WindowFrame
          title="Pasarela_de_Pago.exe - [No hay prendas en la orden]"
          icon={<PixelIcon name="cart" size={16} />}
          statusBarText="CHECKOUT // CARRITO SIN ELEMENTOS"
        >
          <div className="text-center py-8 space-y-3">
            <div className="flex justify-center">
              <PixelIcon name="cart" size={48} />
            </div>
            <h2 className="text-base font-bold text-gray-800">
              No hay prendas disponibles para procesar el pago
            </h2>
            <p className="text-xs text-gray-600 max-w-md mx-auto">
              Tu carro de compras no tiene prendas pendientes. Vuelve al carrito o explora el catálogo para seleccionar tus prendas.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link to="/cart">
                <button
                  type="button"
                  className="winxp-button text-xs py-1.5 px-4 font-semibold text-gray-800 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ir al Carrito de Compras</span>
                </button>
              </Link>
              <Link to="/catalog">
                <button
                  type="button"
                  className="winxp-button winxp-button-primary text-xs py-1.5 px-4 font-bold text-blue-900 flex items-center gap-1.5"
                >
                  <PixelIcon name="search" size={14} />
                  <span>Ir al Catálogo de Prendas</span>
                </button>
              </Link>
            </div>
          </div>
        </WindowFrame>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans max-w-5xl mx-auto">
      <div className="bg-white border border-gray-400 p-2 winxp-bevel-out flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            className="flex items-center gap-1 text-blue-700 hover:underline font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Carrito</span>
          </Link>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500">Paso 1: Datos</span>
          <span className="text-gray-300">→</span>
          <span className="text-gray-500">Paso 2: Despacho / Retiro</span>
          <span className="text-gray-300">→</span>
          <span className="font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded border border-blue-300">
            PASO 3: RESUMEN DE COMPRA & PAGO
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-green-700">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Pasarelas Certificadas Transbank · MP · Khipu</span>
        </div>
      </div>

      <WindowFrame
        title="Pasarela_de_Pago.exe - [PASO 3: RESUMEN DE COMPRA & PAGO]"
        icon={<PixelIcon name="windows-flag" size={16} />}
        statusBarText="PASO 3: RESUMEN DE COMPRA & PAGO // CONECTADO A MONGODB ATLAS // CIFRADO SSL 128-BITS"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-4">
            <div className="border border-gray-400 bg-white p-3 space-y-2.5 winxp-bevel-out">
              <div className="flex items-center justify-between pb-1.5 border-b border-gray-300 text-xs font-bold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-700" />
                  <span>PRENDAS INCLUIDAS EN LA ORDEN ({items.length})</span>
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}`}
                    className="p-2 bg-gray-50 border border-gray-300 flex items-center justify-between gap-3 text-xs"
                  >
                    <Link
                      to={`/product/${item.product.id}`}
                      className="shrink-0 block group cursor-pointer"
                      title={`Ver detalles de ${item.product.title}`}
                    >
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-12 h-12 object-cover border border-gray-400 bg-white group-hover:border-blue-600 transition-colors"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/product/${item.product.id}`}
                        className="font-bold text-gray-900 truncate block hover:text-blue-700 hover:underline cursor-pointer"
                        title={item.product.title}
                      >
                        {item.product.title}
                      </Link>
                      <div className="text-[11px] text-gray-600 flex items-center gap-2 mt-0.5">
                        {hasApparelSize(item.product, item.selectedSize) && (
                          <>
                            <span>
                              Talla: <strong className="text-gray-900">{item.selectedSize}</strong>
                            </span>
                            <span>·</span>
                          </>
                        )}
                        <span>
                          Color: <strong className="text-gray-900">{item.selectedColor.name}</strong>
                        </span>
                        <span>·</span>
                        <span>
                          Cant: <strong className="text-gray-900">{item.quantity}</strong>
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-700 font-mono mt-0.5">
                        ${(item.product.salePrice ?? item.product.price).toLocaleString('es-CL')} c/u
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-red-700 text-xs font-mono">
                        ${((item.product.salePrice ?? item.product.price) * item.quantity).toLocaleString('es-CL')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-400 bg-white p-3 space-y-2.5 winxp-bevel-out text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-gray-300">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>DATOS DEL COMPRADOR Y ENTREGA CONFIRMADOS</span>
                </span>
                <Link to="/cart" className="text-blue-700 hover:underline text-[11px]">
                  Editar en Carrito
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-gray-50 border border-gray-300 p-2 space-y-1">
                  <div className="font-bold text-gray-800 border-b border-gray-200 pb-0.5 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-700" />
                    <span>Titular de la Compra:</span>
                  </div>
                  <div>
                    <strong>Nombre:</strong> {checkoutData.customerName}
                  </div>
                  <div>
                    <strong>RUT:</strong>{' '}
                    <span className="font-mono font-bold text-gray-900">
                      {checkoutData.customerRut || '19.876.543-2'}
                    </span>
                  </div>
                  <div>
                    <strong>Teléfono:</strong> {checkoutData.customerPhone}
                  </div>
                  <div className="truncate">
                    <strong>Email:</strong> {checkoutData.customerEmail}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-300 p-2 space-y-1">
                  <div className="font-bold text-gray-800 border-b border-gray-200 pb-0.5 flex items-center gap-1">
                    {checkoutData.deliveryMethod === 'pickup' ? (
                      <>
                        <Store className="w-3.5 h-3.5 text-blue-700" />
                        <span>Retiro en Sucursal Física</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-3.5 h-3.5 text-blue-700" />
                        <span>Envío a Domicilio con Courier</span>
                      </>
                    )}
                  </div>
                  {checkoutData.deliveryMethod === 'pickup' ? (
                    <>
                      <div>
                        <strong>Sucursal:</strong> {selectedBranch?.name} ({selectedBranch?.city})
                      </div>
                      <div className="text-[11px] text-gray-600">
                        {selectedBranch?.address}
                      </div>
                      <div className="text-[10px] text-blue-900 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-xs font-medium flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-blue-700 shrink-0" />
                        <span>Horario Retiro: {formatBranchPickupSummary(selectedBranch)}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <strong>Destino:</strong> {checkoutData.shippingAddress}
                      </div>
                      <div>
                        <strong>Comuna / Región:</strong> {checkoutData.shippingComuna}, {checkoutData.shippingRegion}
                      </div>
                      <div className="text-[11px] text-blue-700 font-semibold">
                        Courier: {checkoutData.shippingCourier || (activeQuote ? activeQuote.courierName : 'Starken')}
                      </div>
                      <div className="text-[10px] text-gray-600 font-mono">
                        Modalidad:{' '}
                        {checkoutData.shippingPaymentMode === 'on_delivery'
                          ? 'Por Pagar en Destino al recibir'
                          : 'Pagado en línea'}
                      </div>
                      {checkoutData.shippingNotes && (
                        <div className="text-[10px] text-gray-600 italic">
                          Notas: {checkoutData.shippingNotes}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#f8fafc] border border-gray-400 p-3 space-y-3 h-fit winxp-bevel-out">
            <h3 className="font-bold text-xs text-blue-900 pb-1.5 border-b border-gray-300 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-700" />
              <span>PASO 3: RESUMEN DE COMPRA & PAGO</span>
            </h3>

            <div className="space-y-1.5 text-xs text-gray-700 bg-white border border-gray-300 p-2.5">
              <div className="flex justify-between">
                <span>Subtotal prendas:</span>
                <span className="font-mono">${subtotal.toLocaleString('es-CL')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-700 font-semibold">
                  <span>Descuentos aplicados:</span>
                  <span className="font-mono">-${discount.toLocaleString('es-CL')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Modalidad de entrega:</span>
                <span className="font-semibold text-blue-900">
                  {checkoutData.deliveryMethod === 'pickup'
                    ? 'Retiro en Sucursal'
                    : 'Envío a Domicilio'}
                </span>
              </div>
              {checkoutData.deliveryMethod === 'shipping' && (
                <div className="flex justify-between text-[11px] text-gray-600">
                  <span>Costo Despacho:</span>
                  <span className="font-mono font-semibold">
                    {checkoutData.shippingPaymentMode === 'on_delivery' ? (
                      <span className="text-blue-700">Por Pagar ($0 ahora)</span>
                    ) : shippingFeeToPayOnline === 0 ? (
                      <span className="text-green-700 font-bold">¡Envío Gratis!</span>
                    ) : (
                      `$${shippingFeeToPayOnline.toLocaleString('es-CL')}`
                    )}
                  </span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-1.5 flex justify-between font-bold text-sm text-gray-900">
                <span>Total a pagar ahora:</span>
                <span className="text-red-700 font-mono text-base">
                  ${finalTotal.toLocaleString('es-CL')} CLP
                </span>
              </div>
            </div>

            <div className="border border-[#7eaadb] bg-white p-2.5 space-y-2 winxp-bevel-in">
              <div className="pb-1 border-b border-gray-200">
                <div className="text-xs font-bold text-blue-900">
                  Selecciona la Pasarela de Pago:
                </div>
                <div className="text-[10px] text-gray-500">
                  Conexión directa encriptada SSL 128-bits
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentGateway('webpay')}
                  className={`p-2 border rounded-xs transition-all flex flex-col items-center cursor-pointer ${
                    selectedPaymentGateway === 'webpay'
                      ? 'bg-blue-100 border-blue-700 font-bold text-blue-900 shadow-xs ring-1 ring-blue-600'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-full h-14 bg-white border border-gray-200 rounded-xs flex items-center justify-center p-1 mb-1.5 overflow-hidden">
                    <img
                      src="/images/imagen Webpay.jpeg"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/aistudio/imagen_Webpay_bcf109d2.jpeg';
                      }}
                      alt="Webpay Transbank"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[11px] font-bold leading-tight">Webpay</div>
                  <div className="text-[9px] text-gray-500 leading-tight">Transbank</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentGateway('mercadopago')}
                  className={`p-2 border rounded-xs transition-all flex flex-col items-center cursor-pointer ${
                    selectedPaymentGateway === 'mercadopago'
                      ? 'bg-blue-100 border-blue-700 font-bold text-blue-900 shadow-xs ring-1 ring-blue-600'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-full h-14 bg-white border border-gray-200 rounded-xs flex items-center justify-center p-1 mb-1.5 overflow-hidden">
                    <img
                      src="/images/imagen MercadoPago.jpeg"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/aistudio/imagen_MercadoPago_51506740.jpeg';
                      }}
                      alt="MercadoPago"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[11px] font-bold leading-tight">MercadoPago</div>
                  <div className="text-[9px] text-gray-500 leading-tight">Checkout</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentGateway('khipu')}
                  className={`p-2 border rounded-xs transition-all flex flex-col items-center cursor-pointer ${
                    selectedPaymentGateway === 'khipu'
                      ? 'bg-blue-100 border-blue-700 font-bold text-blue-900 shadow-xs ring-1 ring-blue-600'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="w-full h-14 bg-white border border-gray-200 rounded-xs flex items-center justify-center p-1 mb-1.5 overflow-hidden">
                    <img
                      src="/images/imagen khipu.jpeg"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/aistudio/imagen_khipu_4ca3ef11.jpeg';
                      }}
                      alt="Khipu"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[11px] font-bold leading-tight">Khipu</div>
                  <div className="text-[9px] text-gray-500 leading-tight">Bancos</div>
                </button>
              </div>

              {selectedPaymentGateway === 'webpay' && (
                <div className="pt-1 text-xs">
                  <div className="p-2 bg-indigo-50/70 border border-indigo-300 text-indigo-900 text-[11px] rounded-xs space-y-1">
                    <div className="font-bold">Webpay Plus Transbank</div>
                    <div className="text-gray-600">
                      Paga de forma segura con tus tarjetas de débito, crédito o prepago en el portal de Transbank.
                    </div>
                  </div>
                </div>
              )}

              {selectedPaymentGateway === 'mercadopago' && (
                <div className="pt-1 text-xs">
                  <div className="p-2 bg-blue-50/70 border border-blue-300 text-blue-900 text-[11px] rounded-xs space-y-1">
                    <div className="font-bold">Mercado Pago Checkout Pro</div>
                    <div className="text-gray-600">
                      Paga de forma rápida con tu saldo en Mercado Pago o tarjetas asociadas.
                    </div>
                  </div>
                </div>
              )}

              {selectedPaymentGateway === 'khipu' && (
                <div className="pt-1 text-xs">
                  <div className="p-2 bg-purple-50/70 border border-purple-300 text-purple-900 text-[11px] rounded-xs space-y-1">
                    <div className="font-bold">Transferencia Instantánea Khipu</div>
                    <div className="text-gray-600">
                      Conexión bancaria directa, segura y validada en tiempo real.
                    </div>
                  </div>
                </div>
              )}

              {checkoutError && (
                <div className="p-2 bg-red-100 border border-red-500 text-red-900 text-xs font-bold rounded-xs">
                  ⚠ {checkoutError}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleSimulatePayment}
                  className="winxp-button winxp-button-primary text-xs py-2.5 w-full font-bold text-blue-900 shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <span>Procesando orden y descontando stock en MongoDB...</span>
                  ) : (
                    <>
                      <span>CONFIRMAR Y PAGAR</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/cart" className="block w-full">
                <button
                  type="button"
                  className="winxp-button text-xs py-2 px-3 w-full font-bold text-blue-900 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:bg-blue-50/80 transition-all rounded-xs hover:border-blue-700 active:scale-[0.99]"
                  title="Volver al Carrito de Compras para modificar prendas, cantidades o datos de entrega"
                >
                  <ArrowLeft className="w-4 h-4 text-blue-700 shrink-0" />
                  <span className="tracking-wide">Modificar prendas o datos en el Carrito</span>
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </WindowFrame>
    </div>
  );
};

export default CheckoutView;
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WindowFrame } from '../components/layout/WindowFrame';
import { PixelIcon } from '../components/common/PixelIcon';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  useBranch,
  formatBranchPickupSummary,
  getBranchScheduleBlocks
} from '../context/BranchContext';
import {
  calculateCourierQuotes,
  BASE_3KG_RATES_FROM_V_REGION,
  findRegionByCommune
} from '../services/shippingQuotesEngine';
import {
  loadRedeemedCoupons,
  RedeemedUserCoupon
} from '../services/couponsService';
import {
  BRANCH_PHYSICAL_SCHEDULES,
  BranchScheduleInfo
} from '../components/profile/profileTypes';
import {
  PHONE_PREFIX_OPTIONS,
  isApparelCategory,
  hasApparelSize,
  formatRutNumbers,
  isGmailValid
} from '../components/cart/cartTypes';
import { CartEmptyState } from '../components/cart/CartEmptyState';
import { CartItemsList } from '../components/cart/CartItemsList';
import { CartOrderSummary } from '../components/cart/CartOrderSummary';
import { CartCustomerStep1 } from '../components/cart/CartCustomerStep1';
import { CartDeliveryStep2 } from '../components/cart/CartDeliveryStep2';
import { CartPickupScheduleModal } from '../components/cart/CartPickupScheduleModal';
import api from '../api/axios';
import { getStockForSize, isRealSize, normalizeStockSize } from '../services/productStock';
import type { Product } from '../types';
import '../components/cart/CartView.css';

export {
  PHONE_PREFIX_OPTIONS,
  isApparelCategory,
  hasApparelSize,
  formatRutNumbers,
  isGmailValid
};

export const CartView: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    discount,
    cartTotalWeightGrams,
    appliedCoupon,
    couponDiscount,
    hasFreeShippingCoupon,
    applyCouponCode,
    removeCoupon
  } = useCart();
  const { currentUser } = useAuth();
  const { branches } = useBranch();

  // Estado de Cupones de Descuento
  const [couponInput, setCouponInput] = useState<string>('');
  const [couponFeedback, setCouponFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [myAvailableCoupons, setMyAvailableCoupons] = useState<RedeemedUserCoupon[]>(() =>
    loadRedeemedCoupons().filter((c) => c.status === 'disponible')
  );

  useEffect(() => {
    const syncCoupons = () => {
      setMyAvailableCoupons(
        loadRedeemedCoupons().filter((c) => c.status === 'disponible')
      );
    };
    window.addEventListener('nl_coupons_updated', syncCoupons);
    return () => window.removeEventListener('nl_coupons_updated', syncCoupons);
  }, []);

  const handleApplyCouponSubmit = (codeToApply?: string) => {
    const targetCode = (codeToApply !== undefined ? codeToApply : couponInput)
      .trim()
      .toUpperCase();
    if (!targetCode) {
      setCouponFeedback({
        type: 'error',
        text: 'Por favor ingresa un código de cupón.'
      });
      return;
    }
    const res = applyCouponCode(targetCode);
    if (res.success) {
      setCouponFeedback({ type: 'success', text: res.message });
      setCouponInput('');
    } else {
      setCouponFeedback({ type: 'error', text: res.message });
    }
  };

  // Carga inicial de datos guardados o del usuario autenticado
  const initialSavedCheckout = useMemo(() => {
    try {
      const raw = localStorage.getItem('nolimits_checkout_info');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  }, []);

  const initialDefaultAddr = useMemo(() => {
    try {
      const raw = localStorage.getItem('nolimits_default_address');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  }, []);

  // PASO 1: Datos del Titular
  const [customerFirstName, setCustomerFirstName] = useState<string>(() => {
    if (initialSavedCheckout?.customerFirstName) {
      return initialSavedCheckout.customerFirstName;
    }
    if (currentUser?.firstName) return currentUser?.firstName;
    if (currentUser?.name && currentUser?.role !== 'guest') {
      return currentUser?.name.split(' ')[0] || 'Valeria';
    }
    return 'Valeria';
  });

  const [customerLastName, setCustomerLastName] = useState<string>(() => {
    if (initialSavedCheckout?.customerLastName) {
      return initialSavedCheckout.customerLastName;
    }
    if (currentUser?.lastName) return currentUser?.lastName;
    if (currentUser?.name && currentUser?.role !== 'guest') {
      const parts = currentUser?.name.split(' ');
      return parts.length > 1 ? parts.slice(1).join(' ') : 'Gallardo';
    }
    return 'Gallardo';
  });

  const [customerRutRaw, setCustomerRutRaw] = useState<string>(() => {
    const source =
      initialSavedCheckout?.customerRut || currentUser?.rut || '198765432';
    return source.replace(/[^0-9kK]/g, '').slice(0, 9);
  });

  const [customerPhoneDigits, setCustomerPhoneDigits] = useState<string>(() => {
    const source =
      initialSavedCheckout?.customerPhone ||
      initialDefaultAddr?.phone ||
      currentUser?.phone ||
      '91234567';
    const digits = source.replace(/\D/g, '');
    if (digits.startsWith('569') && digits.length >= 11) {
      return digits.slice(3, 11);
    }
    return digits.slice(-8);
  });

  const [customerEmail, setCustomerEmail] = useState<string>(() => {
    const candidate =
      initialSavedCheckout?.customerEmail ||
      currentUser?.email ||
      'valeria.k@gmail.com';
    return candidate.endsWith('@gmail.com') ? candidate : 'valeria.k@gmail.com';
  });

  const [emailError, setEmailError] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isCheckingStock, setIsCheckingStock] = useState(false);

  // Sincronizar con usuario si cambia de cuenta
  useEffect(() => {
    if (currentUser && currentUser.role !== 'guest') {
      if (currentUser.firstName) setCustomerFirstName(currentUser.firstName);
      if (currentUser.lastName) setCustomerLastName(currentUser.lastName);
      if (currentUser.rut) {
        setCustomerRutRaw(currentUser.rut.replace(/[^0-9kK]/g, '').slice(0, 9));
      }
      if (currentUser.phone) {
        const digits = currentUser.phone.replace(/\D/g, '');
        const clean8 = digits.startsWith('569')
          ? digits.slice(3, 11)
          : digits.slice(-8);
        if (clean8) setCustomerPhoneDigits(clean8);
      }
      if (currentUser.email && currentUser.email.endsWith('@gmail.com')) {
        setCustomerEmail(currentUser.email);
      }
    }
  }, [currentUser]);

  const formattedRut = useMemo(
    () => formatRutNumbers(customerRutRaw),
    [customerRutRaw]
  );

  const formattedPhoneInput = useMemo(() => {
    if (!customerPhoneDigits) return '+56 9 ';
    const p1 = customerPhoneDigits.slice(0, 4);
    const p2 = customerPhoneDigits.slice(4, 8);
    return p2 ? `+56 9 ${p1} ${p2}` : `+56 9 ${p1}`;
  }, [customerPhoneDigits]);

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(
      /[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g,
      ''
    );
    setCustomerFirstName(sanitized);
    if (errorMessage) setErrorMessage('');
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(
      /[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g,
      ''
    );
    setCustomerLastName(sanitized);
    if (errorMessage) setErrorMessage('');
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9kK]/g, '').slice(0, 9);
    // Solo permitir K en la última posición cuando tenga al menos 2 caracteres
    const bodyOnlyDigits = raw.slice(0, -1).replace(/\D/g, '');
    const lastChar = raw.slice(-1).toUpperCase();
    const cleaned = raw.length <= 1 ? raw.replace(/\D/g, '') : `${bodyOnlyDigits}${lastChar}`;
    setCustomerRutRaw(cleaned);
    if (errorMessage) setErrorMessage('');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    let digits = val.replace(/\D/g, '');
    if (digits.startsWith('569')) {
      digits = digits.slice(3);
    } else if (digits.startsWith('56')) {
      digits = digits.slice(2);
    }
    setCustomerPhoneDigits(digits.slice(0, 8));
    if (errorMessage) setErrorMessage('');
  };

  // PASO 2: Modalidad de Entrega o Retiro
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'shipping'>(
    () => initialSavedCheckout?.deliveryMethod || 'pickup'
  );
  const [showPickupInfo, setShowPickupInfo] = useState<boolean>(false);
  const [isPickupScheduleModalOpen, setIsPickupScheduleModalOpen] =
    useState<boolean>(false);

  // Sucursales físicas habilitadas para retiro
  const pickupBranches = useMemo(() => {
    return branches.filter(
      (b) =>
        b.allowPickup !== false &&
        b.id !== 'casa_matriz' &&
        !b.isCorporate &&
        b.isPhysicalStore !== false
    );
  }, [branches]);

  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => {
    const savedId = initialSavedCheckout?.selectedBranchId;
    if (savedId && savedId !== 'casa_matriz') return savedId;
    return pickupBranches[0]?.id || 'vina_del_mar';
  });

  const selectedBranch = useMemo(() => {
    return (
      pickupBranches.find((b) => b.id === selectedBranchId) || pickupBranches[0]
    );
  }, [pickupBranches, selectedBranchId]);

  const selectedBranchHours = useMemo(() => {
    return formatBranchPickupSummary(selectedBranch);
  }, [selectedBranch]);

  const liveBranchSchedules: BranchScheduleInfo[] = useMemo(() => {
    return pickupBranches.map((b) => {
      const preset =
        BRANCH_PHYSICAL_SCHEDULES.find((p) => p.id === b.id) ||
        BRANCH_PHYSICAL_SCHEDULES[0];
      const blocks = getBranchScheduleBlocks(b);
      return {
        id: b.id,
        name: b.name,
        city: b.city,
        address: b.address,
        scheduleWeekdays: b.scheduleWeekdays || preset.scheduleWeekdays,
        scheduleSaturday: b.scheduleSaturday || preset.scheduleSaturday,
        scheduleSunday: b.scheduleSunday || preset.scheduleSunday,
        scheduleBlocks: blocks,
        pickupSummary: formatBranchPickupSummary(b),
        phone: b.phone || preset.phone,
        whatsapp: b.phone || preset.whatsapp,
        leadContact: b.managerName || preset.leadContact,
        returnInstructions: b.returnInstructions || preset.returnInstructions,
        badge: b.badge || preset.badge
      };
    });
  }, [pickupBranches]);

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    if (errorMessage) setErrorMessage('');
  };

  // Campos de Despacho a Domicilio
  const [shippingRegion, setShippingRegion] = useState<string>(() => {
    if (initialDefaultAddr?.region && BASE_3KG_RATES_FROM_V_REGION[initialDefaultAddr.region]) {
      return initialDefaultAddr.region;
    }
    if (initialDefaultAddr?.comuna) {
      return findRegionByCommune(initialDefaultAddr.comuna);
    }
    if (
      initialSavedCheckout?.shippingRegion &&
      BASE_3KG_RATES_FROM_V_REGION[initialSavedCheckout.shippingRegion]
    ) {
      return initialSavedCheckout.shippingRegion;
    }
    return 'Región de Valparaíso';
  });

  const [shippingComuna, setShippingComuna] = useState<string>(() => {
    const regMap = BASE_3KG_RATES_FROM_V_REGION[shippingRegion] || {};
    if (initialDefaultAddr?.comuna && regMap[initialDefaultAddr.comuna] !== undefined) {
      return initialDefaultAddr.comuna;
    }
    if (
      initialSavedCheckout?.shippingComuna &&
      regMap[initialSavedCheckout.shippingComuna] !== undefined
    ) {
      return initialSavedCheckout.shippingComuna;
    }
    return Object.keys(regMap)[0] || 'Viña del Mar';
  });

  const [shippingStreet, setShippingStreet] = useState<string>(
    () =>
      initialDefaultAddr?.street ||
      initialSavedCheckout?.shippingStreet ||
      'Av. Libertad'
  );

  const [shippingNoNumber, setShippingNoNumber] = useState<boolean>(() => {
    const num =
      initialDefaultAddr?.number || initialSavedCheckout?.shippingNumber || '1400';
    return num === 'S/N' || num === 'S/N (Sin número)';
  });

  const [shippingNumber, setShippingNumber] = useState<string>(() => {
    const num =
      initialDefaultAddr?.number || initialSavedCheckout?.shippingNumber || '1400';
    return num === 'S/N' || num === 'S/N (Sin número)' ? '' : num;
  });

  const [shippingApartment, setShippingApartment] = useState<string>(
    () =>
      initialDefaultAddr?.apartment ||
      initialSavedCheckout?.shippingApartment ||
      ''
  );

  const [shippingPostalCode, setShippingPostalCode] = useState<string>(
    () =>
      initialDefaultAddr?.postalCode ||
      initialSavedCheckout?.shippingPostalCode ||
      ''
  );

  const [shippingNotes, setShippingNotes] = useState<string>(
    () =>
      initialDefaultAddr?.notes || initialSavedCheckout?.shippingNotes || ''
  );

  const [shippingCourier, setShippingCourier] = useState<
    'Starken' | 'bluexpress' | 'Paket' | 'Paket '
  >(() => initialSavedCheckout?.shippingCourier || 'Starken');

  const [shippingPaymentMode, setShippingPaymentMode] = useState<
    'paid' | 'on_delivery'
  >(() => initialSavedCheckout?.shippingPaymentMode || 'paid');

  const handleRegionChange = (newRegion: string) => {
    setShippingRegion(newRegion);
    const comunas = Object.keys(BASE_3KG_RATES_FROM_V_REGION[newRegion] || {});
    if (comunas.length > 0) {
      setShippingComuna(comunas[0]);
    }
  };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyNums = e.target.value.replace(/\D/g, '').slice(0, 7);
    setShippingPostalCode(onlyNums);
  };

  // Cotizaciones dinámicas multicourier
  const exceedsMaxWeight = cartTotalWeightGrams > 20000;

  const courierQuotes = useMemo(() => {
    return calculateCourierQuotes({
      totalWeightGrams: cartTotalWeightGrams,
      destinationRegion: shippingRegion,
      destinationCommune: shippingComuna,
      originBranch: (selectedBranchId as any) || 'vina_del_mar',
      cartSubtotalClp: subtotal
    });
  }, [
    cartTotalWeightGrams,
    shippingRegion,
    shippingComuna,
    selectedBranchId,
    subtotal
  ]);

  // Si el usuario estaba en Paket y cambia a una región sin Paket disponible, cambiar automáticamente a Starken
  useEffect(() => {
    const paketQuote = courierQuotes.find((q) => q.courierId === 'paket');
    if (
      (shippingCourier === 'Paket' || shippingCourier === 'Paket ') &&
      paketQuote &&
      !paketQuote.available
    ) {
      setShippingCourier('Starken');
    }
  }, [courierQuotes, shippingCourier]);

  // Si selecciona Paket, la modalidad es siempre envío pagado
  useEffect(() => {
    if (shippingCourier === 'Paket' || shippingCourier === 'Paket ') {
      setShippingPaymentMode('paid');
    }
  }, [shippingCourier]);

  const selectedQuote = useMemo(() => {
    if (shippingCourier === 'Starken') {
      return courierQuotes.find((q) => q.courierId === 'starken');
    }
    if (shippingCourier === 'bluexpress') {
      return courierQuotes.find((q) => q.courierId === 'blue_express');
    }
    return courierQuotes.find((q) => q.courierId === 'paket');
  }, [courierQuotes, shippingCourier]);

  const currentShippingCost = useMemo(() => {
    if (deliveryMethod === 'pickup') return 0;
    if (hasFreeShippingCoupon) return 0;
    if (shippingPaymentMode === 'on_delivery') return 0;
    return selectedQuote && selectedQuote.available ? selectedQuote.priceClp : 0;
  }, [
    deliveryMethod,
    hasFreeShippingCoupon,
    shippingPaymentMode,
    selectedQuote
  ]);

  const finalTotal = Math.max(0, subtotal - discount + currentShippingCost);

  const handleProceedToPayment = async () => {
    if (isCheckingStock) return;
    setErrorMessage('');
    setEmailError('');

    if (!customerFirstName.trim() || !customerLastName.trim()) {
      setErrorMessage(
        'Por favor completa tus Nombres y Apellidos en el Paso 1.'
      );
      return;
    }

    if (customerRutRaw.length < 8) {
      setErrorMessage(
        'Por favor ingresa un RUT válido (mínimo 8 caracteres incluyendo dígito verificador).'
      );
      return;
    }

    if (customerPhoneDigits.length !== 8) {
      setErrorMessage(
        'Por favor ingresa los 8 dígitos de tu teléfono móvil chileno (+56 9 XXXX XXXX).'
      );
      return;
    }

    if (!isGmailValid(customerEmail)) {
      setEmailError('El correo electrónico no es válido');
      setErrorMessage(
        'El correo electrónico del titular debe ser una cuenta válida terminada en @gmail.com.'
      );
      return;
    }

    if (deliveryMethod === 'shipping') {
      if (exceedsMaxWeight) {
        setErrorMessage(
          'El pedido supera el límite máximo de 20 KG para despacho a domicilio. Selecciona Retiro en Sucursal.'
        );
        return;
      }
      if (!shippingRegion || !shippingComuna) {
        setErrorMessage(
          'Por favor selecciona la Región y Comuna de destino en el Paso 2.'
        );
        return;
      }
      if (!shippingStreet.trim()) {
        setErrorMessage(
          'Por favor ingresa el nombre de la Calle para el despacho a domicilio.'
        );
        return;
      }
      if (!shippingNoNumber && !shippingNumber.trim()) {
        setErrorMessage(
          'Por favor ingresa el Número de la dirección o marca la casilla "Calle sin número".'
        );
        return;
      }
      if (!selectedQuote || !selectedQuote.available) {
        setErrorMessage(
          'Por favor selecciona un método de envío disponible para tu comuna.'
        );
        return;
      }
    }

    // Última comprobación de tallas y cantidades desde MongoDB antes de avanzar.
    // El stock del carrito es solo una copia local y puede haber cambiado.
    setIsCheckingStock(true);
    try {
      const response = await api.get('/products');
      if (!response.data?.success || !Array.isArray(response.data.data)) {
        throw new Error('Inventario temporalmente no disponible');
      }
      const liveProducts = new Map<string, Product>(
        response.data.data.map((doc: Product & { _id?: string }): [string, Product] => [
          String(doc._id || doc.id), doc
        ])
      );
      const requestedUnits = new Map<string, number>();
      for (const item of items) {
        const product = liveProducts.get(String(item.productId));
        if (!product || product.isHidden) {
          setErrorMessage(`El producto "${item.product.title}" ya no está disponible. Retíralo del carrito.`);
          return;
        }
        const size = item.selectedSize;
        const hasRealSizes = Array.isArray(product.sizeBreakdown) &&
          product.sizeBreakdown.some((entry) => isRealSize(entry.size));
        if (hasRealSizes && !isRealSize(size)) {
          setErrorMessage(`Vuelve a seleccionar la talla del producto "${item.product.title}".`);
          return;
        }
        const key = `${item.productId}::${normalizeStockSize(size)}`;
        const totalRequested = (requestedUnits.get(key) || 0) + item.quantity;
        requestedUnits.set(key, totalRequested);
        const available = getStockForSize(product, size);
        if (available < totalRequested) {
          setErrorMessage(`Stock insuficiente de "${item.product.title}" — talla ${size}. Disponibles: ${available}; en tu carrito: ${totalRequested}. Ajusta la cantidad o cambia de talla.`);
          return;
        }
      }
    } catch (error) {
      console.error('No fue posible consultar el inventario antes de pagar:', error);
      setErrorMessage('No pudimos comprobar el stock actualizado. Inténtalo de nuevo antes de continuar al pago.');
      return;
    } finally {
      setIsCheckingStock(false);
    }

    const finalNumberStr = shippingNoNumber ? 'S/N' : shippingNumber.trim();
    const fullAddressStr = `${shippingStreet.trim()} ${finalNumberStr}${
      shippingApartment.trim() ? `, ${shippingApartment.trim()}` : ''
    }`;

    const checkoutPayload = {
      customerFirstName: customerFirstName.trim(),
      customerLastName: customerLastName.trim(),
      customerName: `${customerFirstName.trim()} ${customerLastName.trim()}`.trim(),
      customerRut: formattedRut,
      phonePrefix: '+56 9',
      customerPhone: formattedPhoneInput,
      customerEmail: customerEmail.trim().toLowerCase(),
      deliveryMethod,
      selectedBranchId: selectedBranch?.id || 'vina_del_mar',
      shippingRegion,
      shippingCountry: 'Chile',
      shippingComuna,
      shippingStreet: shippingStreet.trim(),
      shippingNumber: finalNumberStr,
      shippingApartment: shippingApartment.trim(),
      shippingPostalCode: shippingPostalCode.trim(),
      shippingNotes: shippingNotes.trim(),
      shippingCourier:
        shippingCourier === 'Paket ' ? 'Paket' : shippingCourier,
      shippingPaymentMode,
      shippingAddress: fullAddressStr,
      shippingCity: shippingComuna,
      paymentMethod: 'webpay'
    };

    try {
      localStorage.setItem(
        'nolimits_checkout_info',
        JSON.stringify(checkoutPayload)
      );
    } catch {
      // ignore
    }

    navigate('/checkout');
  };

  if (items.length === 0) {
    return <CartEmptyState />;
  }

  return (
    <div className="nl-cart-view-wrapper space-y-4 font-sans">
      <WindowFrame
        title={`Carro_de_Compras.exe - [${items.length} ${
          items.length === 1 ? 'prenda seleccionada' : 'prendas seleccionadas'
        }]`}
        icon={<PixelIcon name="cart" size={16} />}
        statusBarText={`PRENDAS: ${items.length} // SUBTOTAL: $${subtotal.toLocaleString(
          'es-CL'
        )} CLP // TOTAL: $${finalTotal.toLocaleString('es-CL')} CLP`}
      >
        <div className="nl-cart-main-grid grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Columna Izquierda: Prendas seleccionadas (Col 1-7) */}
          <CartItemsList
            items={items}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
          />

          {/* Columna Derecha: Resumen de Compra + Paso 1 + Paso 2 (Col 8-12) */}
          <div className="nl-cart-right-col lg:col-span-5 space-y-4">
            {/* 1. Resumen de Compra */}
            <CartOrderSummary
              items={items}
              appliedCoupon={appliedCoupon}
              removeCoupon={removeCoupon}
              couponInput={couponInput}
              setCouponInput={setCouponInput}
              handleApplyCouponSubmit={handleApplyCouponSubmit}
              myAvailableCoupons={myAvailableCoupons}
              couponFeedback={couponFeedback}
              subtotal={subtotal}
              discount={discount}
              couponDiscount={couponDiscount}
              deliveryMethod={deliveryMethod}
              shippingCourier={shippingCourier}
              shippingPaymentMode={shippingPaymentMode}
              selectedQuote={selectedQuote}
              hasFreeShippingCoupon={hasFreeShippingCoupon}
              currentShippingCost={currentShippingCost}
              finalTotal={finalTotal}
              errorMessage={errorMessage}
              handleProceedToPayment={handleProceedToPayment}
              isCheckingStock={isCheckingStock}
            />

            {/* 2. Paso 1: Datos del Titular de la Compra */}
            <CartCustomerStep1
              customerFirstName={customerFirstName}
              handleFirstNameChange={handleFirstNameChange}
              customerLastName={customerLastName}
              handleLastNameChange={handleLastNameChange}
              customerRutRaw={customerRutRaw}
              formattedRut={formattedRut}
              handleRutChange={handleRutChange}
              customerPhoneDigits={customerPhoneDigits}
              formattedPhoneInput={formattedPhoneInput}
              handlePhoneChange={handlePhoneChange}
              customerEmail={customerEmail}
              setCustomerEmail={setCustomerEmail}
              emailError={emailError}
              setEmailError={setEmailError}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
            />

            {/* 3. Paso 2: Selecciona el Nodo de Retiro o Envío */}
            <CartDeliveryStep2
              deliveryMethod={deliveryMethod}
              setDeliveryMethod={setDeliveryMethod}
              showPickupInfo={showPickupInfo}
              setShowPickupInfo={setShowPickupInfo}
              pickupBranches={pickupBranches}
              selectedBranchId={selectedBranchId}
              handleBranchChange={handleBranchChange}
              selectedBranch={selectedBranch}
              selectedBranchHours={selectedBranchHours}
              setIsPickupScheduleModalOpen={setIsPickupScheduleModalOpen}
              shippingRegion={shippingRegion}
              handleRegionChange={handleRegionChange}
              shippingComuna={shippingComuna}
              setShippingComuna={setShippingComuna}
              shippingStreet={shippingStreet}
              setShippingStreet={setShippingStreet}
              shippingNumber={shippingNumber}
              setShippingNumber={setShippingNumber}
              shippingNoNumber={shippingNoNumber}
              setShippingNoNumber={setShippingNoNumber}
              shippingApartment={shippingApartment}
              setShippingApartment={setShippingApartment}
              shippingPostalCode={shippingPostalCode}
              handlePostalCodeChange={handlePostalCodeChange}
              shippingNotes={shippingNotes}
              setShippingNotes={setShippingNotes}
              exceedsMaxWeight={exceedsMaxWeight}
              courierQuotes={courierQuotes}
              shippingCourier={shippingCourier}
              setShippingCourier={setShippingCourier}
              selectedQuote={selectedQuote}
              shippingPaymentMode={shippingPaymentMode}
              setShippingPaymentMode={setShippingPaymentMode}
            />
          </div>
        </div>
      </WindowFrame>

      {/* Ventana Modal de Horarios de Retiro en Sucursales */}
      <CartPickupScheduleModal
        isPickupScheduleModalOpen={isPickupScheduleModalOpen}
        setIsPickupScheduleModalOpen={setIsPickupScheduleModalOpen}
        liveBranchSchedules={liveBranchSchedules}
      />
    </div>
  );
};

export default CartView;

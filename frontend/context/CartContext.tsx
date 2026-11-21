import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { CartItem, Product, ProductColor } from '../types';
import { getProductWeightGrams, getWeightTierInfo } from '../services/shippingQuotesEngine';
import {
  RedeemedUserCoupon,
  validateRedeemedCouponForCart, clearCouponCache, refreshCouponsFromBackend
} from '../services/couponsService';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: string, color: ProductColor, branchId?: string, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  loyaltyPointsDiscount: number;
  applyLoyaltyPoints: (points: number) => void;
  pointsApplied: number;
  cartTotalWeightGrams: number;
  cartWeightTierLabel: string;
  appliedCoupon: RedeemedUserCoupon | null;
  couponDiscount: number;
  hasFreeShippingCoupon: boolean;
  applyCouponCode: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  const [couponRevision, setCouponRevision] = useState(0);
  useEffect(() => {
    if (isLoading) return;
    clearCouponCache(currentUser?.id || '');
    void refreshCouponsFromBackend(currentUser?.id || '').catch(e => console.error('No se pudo cargar billetera de cupones', e));
  }, [isLoading, isAuthenticated, currentUser?.id]);
  useEffect(() => {
    const sync = () => setCouponRevision(value=>value+1);
    window.addEventListener('nl_coupons_updated',sync);
    return () => window.removeEventListener('nl_coupons_updated',sync);
  }, []);
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('nolimits_cart');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [pointsApplied, setPointsApplied] = useState<number>(0);

  // Cupón seleccionado en memoria; su validez se comprueba con MongoDB.
  const [appliedCouponCode, setAppliedCouponCode] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('nolimits_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (
    product: Product,
    size: string,
    color: ProductColor,
    branchId?: string,
    quantity: number = 1
  ) => {
    setItems(prevItems => {
      const existingIndex = prevItems.findIndex(
        item =>
          item.productId === product.id &&
          item.selectedSize === size &&
          item.selectedColor.name === color.name &&
          item.pickupBranchId === branchId
      );

      const price = product.salePrice ?? product.price;
      const originalPrice = product.price;
      const discountUnit = originalPrice - price;

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        const newItem: CartItem = {
          id: `cart_${product.id}_${size}_${color.name}_${Date.now()}`,
          productId: product.id,
          product,
          quantity,
          selectedSize: size,
          selectedColor: color,
          pickupBranchId: branchId,
          unitPrice: price,
          discountApplicable: discountUnit
        };
        return [...prevItems, newItem];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      return;
    }
    setItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    setPointsApplied(0);
    setAppliedCouponCode('');

  };

  const applyLoyaltyPoints = (_points: number) => {
    // Los puntos solo se canjean por cupones autorizados por MongoDB.
    setPointsApplied(0);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const directDiscount = items.reduce(
    (sum, item) => sum + (item.discountApplicable > 0 ? item.discountApplicable * item.quantity : 0),
    0
  );

  const subtotalAfterDirectDiscount = Math.max(0, subtotal - directDiscount);

  // Validación reactiva del cupón activo frente al subtotal actual del carrito
  const couponValidation = useMemo(() => {
    if (!appliedCouponCode) {
      return { valid: false, coupon: undefined, calculatedDiscountClp: 0 };
    }
    return validateRedeemedCouponForCart(appliedCouponCode, subtotalAfterDirectDiscount);
  }, [appliedCouponCode, subtotalAfterDirectDiscount, couponRevision]);

  const appliedCoupon: RedeemedUserCoupon | null =
    couponValidation.valid && couponValidation.coupon ? couponValidation.coupon : null;

  const couponDiscount = couponValidation.valid ? couponValidation.calculatedDiscountClp : 0;

  const hasFreeShippingCoupon = Boolean(
    appliedCoupon && appliedCoupon.discountType === 'free_shipping'
  );

  const applyCouponCode = (code: string): { success: boolean; message: string } => {
    const result = validateRedeemedCouponForCart(code, subtotalAfterDirectDiscount);
    if (!result.valid || !result.coupon) {
      return {
        success: false,
        message: result.error || 'No se pudo aplicar el cupón.'
      };
    }
    setAppliedCouponCode(result.coupon.code);
    // No persistir el cupón ni el descuento en almacenamiento controlado por el cliente.
    return {
      success: true,
      message: `✓ Cupón "${result.coupon.title}" (${result.coupon.code}) aplicado correctamente.`
    };
  };

  const removeCoupon = () => {
    setAppliedCouponCode('');

  };

  // 1 point = $10 CLP discount
  const loyaltyPointsDiscount = 0; // No se permite pagar directamente con puntos.

  const discount = directDiscount + loyaltyPointsDiscount + couponDiscount;

  // Peso total del carrito en gramos según productos y cantidades
  const cartTotalWeightGrams = useMemo(() => {
    return items.reduce((acc, it) => acc + getProductWeightGrams(it.product) * it.quantity, 0);
  }, [items]);

  const cartWeightTierInfo = useMemo(() => {
    return getWeightTierInfo(cartTotalWeightGrams);
  }, [cartTotalWeightGrams]);

  const cartWeightTierLabel = cartWeightTierInfo ? cartWeightTierInfo.label : (cartTotalWeightGrams > 20000 ? 'Excede 20 KG' : '0 - 1 KG');

  // Costo base de envío referencial (sin envío gratis automático por monto)
  const shippingCost =
    items.length === 0
      ? 0
      : hasFreeShippingCoupon
      ? 0
      : 3990;

  const total = Math.max(0, subtotal - discount + shippingCost);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        discount,
        shippingCost,
        total,
        loyaltyPointsDiscount,
        applyLoyaltyPoints,
        pointsApplied,
        cartTotalWeightGrams,
        cartWeightTierLabel,
        appliedCoupon,
        couponDiscount,
        hasFreeShippingCoupon,
        applyCouponCode,
        removeCoupon
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

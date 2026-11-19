export interface AdminCouponTemplate {
  id: string;
  name: string;
  badge: string;
  pointsCost: number;
  code: string; // Prefijo base del cupón (ej: "DROP3K", "CYBER5K", "NL-VIP")
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number; // % o $ CLP (0 si es free_shipping)
  expirationRule: string; // ej: "2 semanas de vida tiene después del canjeo"
  expirationDays: number; // 7, 14, 21, 28
  minPurchase: number; // Monto mínimo en CLP
  totalRedemptions: number;
  maxUses: number;
  isActive: boolean;
  createdAt: string;
}

export interface RedeemedUserCoupon {
  id: string;
  code: string; // Código único e irrepetible de 1 solo uso (ej: DROP3K-XP-7721)
  templateId: string;
  title: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
  discount: string; // Descripción legible (ej: "$3.000 CLP" o "15% OFF")
  minPurchase: number;
  pointsSpent: number;
  userEmail: string;
  userName: string;
  date: string; // Fecha legible de canje
  redeemedAtIso: string;
  expiresAtIso: string;
  expiresAtLabel: string;
  status: 'disponible' | 'usado' | 'expirado';
  usedAtDate?: string;
  usedOrderNumber?: string;
}

export const STORAGE_COUPONS_KEY = 'nl_admin_coupons_catalog_v1';
export const STORAGE_REDEEMED_COUPONS_KEY = 'nolimits_redeemed_coupons';
export const STORAGE_ACTIVE_CART_COUPON_KEY = 'nolimits_active_cart_coupon_v1';

export const DEFAULT_ADMIN_COUPONS: AdminCouponTemplate[] = [
  {
    id: 'coup_3k',
    name: 'Cupón $3.000 CLP de Descuento',
    badge: 'POPULAR',
    pointsCost: 300,
    code: 'DROP3K',
    discountType: 'fixed',
    discountValue: 3000,
    expirationRule: '2 semanas de vida tiene después del canjeo',
    expirationDays: 14,
    minPurchase: 0,
    totalRedemptions: 48,
    maxUses: 100,
    isActive: true,
    createdAt: '2026-03-01'
  },
  {
    id: 'coup_5k',
    name: 'Cupón $5.000 CLP de Descuento',
    badge: 'MÁS CANJEADO',
    pointsCost: 500,
    code: 'CYBER5K',
    discountType: 'fixed',
    discountValue: 5000,
    expirationRule: '2 semanas de vida tiene después del canjeo',
    expirationDays: 14,
    minPurchase: 25000,
    totalRedemptions: 32,
    maxUses: 100,
    isActive: true,
    createdAt: '2026-03-10'
  },
  {
    id: 'coup_10k',
    name: 'Cupón $10.000 CLP VIP Drop',
    badge: 'PREMIO MAYOR',
    pointsCost: 1000,
    code: 'NOLIMITS10K',
    discountType: 'fixed',
    discountValue: 10000,
    expirationRule: '4 semanas de vida tiene después del canjeo',
    expirationDays: 28,
    minPurchase: 40000,
    totalRedemptions: 19,
    maxUses: 50,
    isActive: true,
    createdAt: '2026-03-15'
  },
  {
    id: 'coup_freeship',
    name: 'Cupón Despacho Gratis Nacional',
    badge: 'AHORRO ENVÍO',
    pointsCost: 350,
    code: 'FREESHIP',
    discountType: 'free_shipping',
    discountValue: 0,
    expirationRule: '3 semanas de vida tiene después del canjeo',
    expirationDays: 21,
    minPurchase: 20000,
    totalRedemptions: 24,
    maxUses: 80,
    isActive: true,
    createdAt: '2026-03-20'
  },
  {
    id: 'coup_cyber15',
    name: 'Bienvenida Cyber Club Y2K (15% OFF)',
    badge: 'CLUB Y2K',
    pointsCost: 450,
    code: 'NL-WELCOME',
    discountType: 'percentage',
    discountValue: 15,
    expirationRule: '2 semanas de vida tiene después del canjeo',
    expirationDays: 14,
    minPurchase: 25000,
    totalRedemptions: 12,
    maxUses: 100,
    isActive: true,
    createdAt: '2026-04-01'
  }
];

const INITIAL_REDEEMED_COUPONS: RedeemedUserCoupon[] = [
  {
    id: 'red_init_01',
    code: 'DROP3K-XP-7721',
    templateId: 'coup_3k',
    title: 'Cupón $3.000 CLP de Descuento',
    discountType: 'fixed',
    discountValue: 3000,
    discount: '$3.000 CLP',
    minPurchase: 0,
    pointsSpent: 300,
    userEmail: 'valeria.k@gmail.com',
    userName: 'Valeria Neo-Goth',
    date: '10 de Octubre 2026',
    redeemedAtIso: '2026-10-10T12:00:00.000Z',
    expiresAtIso: '2026-11-25T23:59:59.000Z',
    expiresAtLabel: '25 de Noviembre 2026 (2 semanas)',
    status: 'disponible'
  }
];

export const formatClpAmount = (val: number): string => {
  return '$' + Math.round(val).toLocaleString('es-CL');
};

export const getCouponDiscountDescription = (coup: Pick<AdminCouponTemplate, 'discountType' | 'discountValue' | 'minPurchase'>): string => {
  const minText =
    coup.minPurchase > 0
      ? `en compras sobre ${formatClpAmount(coup.minPurchase)} CLP`
      : 'aplicable al total de tu compra';

  if (coup.discountType === 'free_shipping') {
    return `Envío gratuito a domicilio en todo Chile (${minText})`;
  }
  if (coup.discountType === 'percentage') {
    return `${coup.discountValue}% de descuento ${minText}`;
  }
  return `${formatClpAmount(coup.discountValue)} CLP ${minText}`;
};

export const getCouponShortDiscountLabel = (coup: Pick<AdminCouponTemplate, 'discountType' | 'discountValue'>): string => {
  if (coup.discountType === 'free_shipping') return 'Envío Gratis';
  if (coup.discountType === 'percentage') return `${coup.discountValue}% OFF`;
  return `${formatClpAmount(coup.discountValue)} CLP`;
};

export const getCouponMinPurchaseLabel = (minPurchase: number): string => {
  if (!minPurchase || minPurchase <= 0) return 'Sin monto mínimo';
  return `Mínimo ${formatClpAmount(minPurchase)} CLP`;
};

export const normalizeAdminCoupon = (raw: any, index: number = 0): AdminCouponTemplate => {
  const discountType: 'percentage' | 'fixed' | 'free_shipping' =
    raw.discountType === 'percentage' || raw.discountType === 'fixed' || raw.discountType === 'free_shipping'
      ? raw.discountType
      : 'fixed';

  const discountValue = Number(raw.discountValue) || 0;

  // Si un cupón guardado anteriormente no tenía pointsCost, lo calculamos según la regla 1 Punto = $10 CLP
  let pointsCost = Number(raw.pointsCost);
  if (!pointsCost || isNaN(pointsCost) || pointsCost <= 0) {
    if (discountType === 'fixed' && discountValue > 0) {
      pointsCost = Math.max(50, Math.round(discountValue / 10));
    } else if (discountType === 'percentage') {
      pointsCost = Math.max(100, discountValue * 30);
    } else {
      pointsCost = 350;
    }
  }

  let expirationDays = Number(raw.expirationDays) || 14;
  const expirationRule =
    typeof raw.expirationRule === 'string' && raw.expirationRule.trim()
      ? raw.expirationRule
      : `${Math.round(expirationDays / 7)} semanas de vida tiene después del canjeo`;

  // Limpiar el prefijo si venía con formato antiguo (ej: NL-WELCOME-2026 -> NL-WELCOME)
  const rawCode = typeof raw.code === 'string' && raw.code.trim() ? raw.code.trim().toUpperCase() : `NL-CUPON-${index + 1}`;

  return {
    id: raw.id || `coup_${Date.now()}_${index}`,
    name: raw.name || raw.title || 'Cupón Exclusivo NoLimits',
    badge: raw.badge || (discountType === 'free_shipping' ? 'AHORRO ENVÍO' : discountValue >= 10000 ? 'PREMIO MAYOR' : 'EXCLUSIVO'),
    pointsCost,
    code: rawCode,
    discountType,
    discountValue,
    expirationRule,
    expirationDays,
    minPurchase: Number(raw.minPurchase) || 0,
    totalRedemptions: Number(raw.totalRedemptions) || 0,
    maxUses: Number(raw.maxUses) || 100,
    isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : true,
    createdAt: raw.createdAt || '2026-03-01'
  };
};

export const loadAdminCouponsCatalog = (): AdminCouponTemplate[] => {
  try {
    const saved = localStorage.getItem(STORAGE_COUPONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed.map((item, idx) => normalizeAdminCoupon(item, idx));
        // Si solo estaban los 3 cupones antiguos de prueba sin los del catálogo de puntos, aseguramos que estén integrados
        const hasDefault3k = normalized.some((c) => c.id === 'coup_3k' || c.code.includes('DROP3K'));
        if (!hasDefault3k && normalized.length <= 3) {
          const merged = [
            ...DEFAULT_ADMIN_COUPONS.slice(0, 4),
            ...normalized.filter((c) => !DEFAULT_ADMIN_COUPONS.some((d) => d.id === c.id))
          ];
          localStorage.setItem(STORAGE_COUPONS_KEY, JSON.stringify(merged));
          return merged;
        }
        return normalized;
      }
    }
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(STORAGE_COUPONS_KEY, JSON.stringify(DEFAULT_ADMIN_COUPONS));
  } catch {
    // ignore
  }
  return DEFAULT_ADMIN_COUPONS;
};

export const saveAdminCouponsCatalog = (coupons: AdminCouponTemplate[]): void => {
  try {
    localStorage.setItem(STORAGE_COUPONS_KEY, JSON.stringify(coupons));
    window.dispatchEvent(new Event('nl_coupons_updated'));
  } catch {
    // ignore
  }
};

export const normalizeRedeemedCoupon = (raw: any, index: number = 0): RedeemedUserCoupon => {
  const code = (raw.code || `DROP3K-XP-${7000 + index}`).toUpperCase().trim();
  const discountType: 'percentage' | 'fixed' | 'free_shipping' =
    raw.discountType === 'percentage' || raw.discountType === 'fixed' || raw.discountType === 'free_shipping'
      ? raw.discountType
      : typeof raw.discount === 'string' && raw.discount.includes('%')
      ? 'percentage'
      : typeof raw.discount === 'string' && raw.discount.toLowerCase().includes('envío')
      ? 'free_shipping'
      : 'fixed';

  let discountValue = Number(raw.discountValue);
  if (isNaN(discountValue) || discountValue <= 0) {
    if (typeof raw.discount === 'string') {
      const digits = parseInt(raw.discount.replace(/[^0-9]/g, ''), 10);
      discountValue = !isNaN(digits) ? digits : 3000;
    } else {
      discountValue = 3000;
    }
  }

  const now = Date.now();
  const redeemedAtIso = raw.redeemedAtIso || new Date(now - 86400000).toISOString();
  const expiresAtIso = raw.expiresAtIso || new Date(now + 14 * 86400000).toISOString();

  // Verificar si ya venció por fecha
  let status: 'disponible' | 'usado' | 'expirado' = raw.status || 'disponible';
  if (status === 'disponible' && new Date(expiresAtIso).getTime() < now) {
    status = 'expirado';
  }

  return {
    id: raw.id || `red_${Date.now()}_${index}`,
    code,
    templateId: raw.templateId || 'coup_3k',
    title: raw.title || 'Cupón de Descuento NoLimits',
    discountType,
    discountValue,
    discount: raw.discount || getCouponShortDiscountLabel({ discountType, discountValue }),
    minPurchase: Number(raw.minPurchase) || 0,
    pointsSpent: Number(raw.pointsSpent) || 300,
    userEmail: raw.userEmail || 'valeria.k@gmail.com',
    userName: raw.userName || 'Valeria Neo-Goth',
    date: raw.date || '10 de Octubre 2026',
    redeemedAtIso,
    expiresAtIso,
    expiresAtLabel:
      raw.expiresAtLabel ||
      new Date(expiresAtIso).toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
    status,
    usedAtDate: raw.usedAtDate,
    usedOrderNumber: raw.usedOrderNumber
  };
};

export const loadRedeemedCoupons = (): RedeemedUserCoupon[] => {
  try {
    const saved = localStorage.getItem(STORAGE_REDEEMED_COUPONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((c, idx) => normalizeRedeemedCoupon(c, idx));
      }
    }
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(STORAGE_REDEEMED_COUPONS_KEY, JSON.stringify(INITIAL_REDEEMED_COUPONS));
  } catch {
    // ignore
  }
  return INITIAL_REDEEMED_COUPONS;
};

export const saveRedeemedCoupons = (list: RedeemedUserCoupon[]): void => {
  try {
    localStorage.setItem(STORAGE_REDEEMED_COUPONS_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event('nl_coupons_updated'));
  } catch {
    // ignore
  }
};

/**
 * Genera un código único e irrepetible de 1 solo uso para un canje de usuario.
 * Ejemplo: si el prefijo del Admin es "CYBER5K", genera "CYBER5K-XP-4829"
 * verificando que jamás se haya generado antes en el historial de canjes.
 */
export const generateUniqueSingleUseCode = (basePrefix: string, existingRedeemed: RedeemedUserCoupon[]): string => {
  const cleanPrefix = (basePrefix || 'NL')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-XP-\d+$/, '')
    .slice(0, 12);

  const existingCodes = new Set(existingRedeemed.map((c) => c.code.toUpperCase()));
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let attempt = 0; attempt < 50; attempt++) {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const randTag =
      chars.charAt(Math.floor(Math.random() * chars.length)) +
      chars.charAt(Math.floor(Math.random() * chars.length));
    const candidate = attempt < 25 ? `${cleanPrefix}-XP-${randNum}` : `${cleanPrefix}-${randTag}-${randNum}`;
    if (!existingCodes.has(candidate)) {
      return candidate;
    }
  }

  return `${cleanPrefix}-XP-${Date.now().toString().slice(-5)}`;
};

/**
 * Ejecuta el canje de una plantilla de cupón por parte de un usuario:
 * 1. Genera un código único de 1 solo uso
 * 2. Calcula su fecha exacta de vencimiento según las semanas configuradas por el Admin
 * 3. Incrementa el contador de canjes (totalRedemptions) en la tabla del Admin
 * 4. Guarda el cupón en la billetera del usuario
 */
export const redeemCouponTemplateForUser = (params: {
  template: AdminCouponTemplate;
  userEmail: string;
  userName: string;
}): { redeemedCoupon: RedeemedUserCoupon; updatedCatalog: AdminCouponTemplate[]; updatedRedeemedList: RedeemedUserCoupon[] } => {
  const { template, userEmail, userName } = params;
  const currentCatalog = loadAdminCouponsCatalog();
  const currentRedeemed = loadRedeemedCoupons();

  const uniqueCode = generateUniqueSingleUseCode(template.code, currentRedeemed);
  const now = new Date();
  const daysToLive = template.expirationDays || 14;
  const expiresDate = new Date(now.getTime() + daysToLive * 24 * 60 * 60 * 1000);

  const dateFormatted = now.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const expiresFormatted = expiresDate.toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const newRedeemed: RedeemedUserCoupon = {
    id: `red_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    code: uniqueCode,
    templateId: template.id,
    title: template.name,
    discountType: template.discountType,
    discountValue: template.discountValue,
    discount: getCouponShortDiscountLabel(template),
    minPurchase: template.minPurchase,
    pointsSpent: template.pointsCost,
    userEmail: userEmail || 'cliente@gmail.com',
    userName: userName || 'Cliente NoLimits',
    date: dateFormatted,
    redeemedAtIso: now.toISOString(),
    expiresAtIso: expiresDate.toISOString(),
    expiresAtLabel: `${expiresFormatted} (${daysToLive} días)`,
    status: 'disponible'
  };

  const updatedRedeemedList = [newRedeemed, ...currentRedeemed];
  saveRedeemedCoupons(updatedRedeemedList);

  const updatedCatalog = currentCatalog.map((item) =>
    item.id === template.id
      ? { ...item, totalRedemptions: (item.totalRedemptions || 0) + 1 }
      : item
  );
  saveAdminCouponsCatalog(updatedCatalog);

  return {
    redeemedCoupon: newRedeemed,
    updatedCatalog,
    updatedRedeemedList
  };
};

/**
 * Valida si un código único ingresado en el Carrito / Checkout puede utilizarse
 */
export const validateRedeemedCouponForCart = (
  rawCode: string,
  cartSubtotalAfterDirectDiscount: number
): { valid: boolean; error?: string; coupon?: RedeemedUserCoupon; calculatedDiscountClp: number } => {
  const cleanCode = (rawCode || '').trim().toUpperCase();
  if (!cleanCode) {
    return { valid: false, error: 'Ingresa un código de cupón válido.', calculatedDiscountClp: 0 };
  }

  const allRedeemed = loadRedeemedCoupons();
  const found = allRedeemed.find((c) => c.code.toUpperCase() === cleanCode);

  if (!found) {
    // Verificar si el usuario escribió por error el prefijo de la plantilla en vez de su código único canjeado
    const catalog = loadAdminCouponsCatalog();
    const isTemplatePrefix = catalog.some((t) => t.code.toUpperCase() === cleanCode);
    if (isTemplatePrefix) {
      return {
        valid: false,
        error: `El código "${cleanCode}" es un prefijo de catálogo. Primero debes canjearlo con tus puntos en "Mi Perfil > Puntos Acumulados" para obtener tu código único personal.`,
        calculatedDiscountClp: 0
      };
    }
    return {
      valid: false,
      error: 'El código ingresado no existe. Canjea tus puntos en "Mi Perfil > Puntos Acumulados" para generar un código único.',
      calculatedDiscountClp: 0
    };
  }

  if (found.status === 'usado') {
    return {
      valid: false,
      error: `Este código único (${found.code}) ya fue utilizado${found.usedOrderNumber ? ` en la orden #${found.usedOrderNumber}` : ''}. Recuerda que cada código es de 1 solo uso.`,
      calculatedDiscountClp: 0
    };
  }

  if (found.status === 'expirado' || new Date(found.expiresAtIso).getTime() < Date.now()) {
    return {
      valid: false,
      error: `Este código único (${found.code}) venció el ${found.expiresAtLabel}.`,
      calculatedDiscountClp: 0
    };
  }

  if (found.minPurchase > 0 && cartSubtotalAfterDirectDiscount < found.minPurchase) {
    return {
      valid: false,
      error: `El cupón "${found.title}" requiere una compra mínima de ${formatClpAmount(found.minPurchase)} CLP (tu subtotal actual es ${formatClpAmount(cartSubtotalAfterDirectDiscount)} CLP).`,
      calculatedDiscountClp: 0
    };
  }

  let calculatedDiscountClp = 0;
  if (found.discountType === 'percentage') {
    calculatedDiscountClp = Math.round((cartSubtotalAfterDirectDiscount * found.discountValue) / 100);
  } else if (found.discountType === 'fixed') {
    calculatedDiscountClp = Math.min(cartSubtotalAfterDirectDiscount, found.discountValue);
  } else if (found.discountType === 'free_shipping') {
    calculatedDiscountClp = 0; // Se bonifica el costo de envío en el carrito/checkout
  }

  return {
    valid: true,
    coupon: found,
    calculatedDiscountClp
  };
};

/**
 * Marca un código único como 'usado' de forma permanente cuando el usuario confirma su compra en Checkout
 */
export const markRedeemedCouponAsUsed = (code: string, orderNumber: string): void => {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) return;

  const allRedeemed = loadRedeemedCoupons();
  const usedDateStr = new Date().toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const updated = allRedeemed.map((c) =>
    c.code.toUpperCase() === cleanCode
      ? {
          ...c,
          status: 'usado' as const,
          usedAtDate: usedDateStr,
          usedOrderNumber: orderNumber
        }
      : c
  );

  saveRedeemedCoupons(updated);
  try {
    localStorage.removeItem(STORAGE_ACTIVE_CART_COUPON_KEY);
  } catch {
    // ignore
  }
};

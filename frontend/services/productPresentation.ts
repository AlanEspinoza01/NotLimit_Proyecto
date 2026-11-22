/** Reglas de presentación del catálogo: coherentes con el cálculo del servidor Webpay. */
import type { Product } from '../types';

export type SpecialProductCategory = '' | 'Productos destacados' | 'Live Drop' | 'Producto Personalizado';

/** «Ninguna» es una opción de interfaz, no una categoría especial persistente. */
export function normalizeSpecialCategory(value: unknown): SpecialProductCategory {
  const candidate = String(value ?? '').trim();
  if (candidate === 'Productos destacados' || candidate === 'Live Drop' || candidate === 'Producto Personalizado') {
    return candidate;
  }
  return '';
}

/** No inferimos «destacado» a partir de etiquetas de producto ni de un indicador heredado. */
export function isFeaturedProduct(product: Pick<Product, 'specialCategory'>): boolean {
  return normalizeSpecialCategory(product.specialCategory) === 'Productos destacados';
}

/**
 * El backend Webpay calcula price * (1 - discountPercent / 100), redondeado en CLP.
 * No confiar en un salePrice antiguo que contradiga el porcentaje persistido.
 */
export function getProductPricing(product: Pick<Product, 'price' | 'discountPercent'>) {
  const basePrice = Number(product.price) || 0;
  const requestedRate = Number(product.discountPercent ?? 0);
  const discountPercent = Number.isFinite(requestedRate) && requestedRate >= 0 && requestedRate <= 100
    ? requestedRate : 0;
  const finalPrice = discountPercent > 0
    ? Math.max(0, Math.round(basePrice * (1 - discountPercent / 100)))
    : basePrice;
  const hasDiscount = discountPercent > 0 && finalPrice < basePrice;
  return { basePrice, finalPrice, discountPercent, hasDiscount };
}

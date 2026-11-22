import type { Product } from '../types';

/**
 * El stock disponible se obtiene del inventario por talla, no del stock total.
 * Nunca se interpreta una talla inexistente como stock disponible.
 */
type StockProduct = Pick<Product, 'sizes' | 'sizeBreakdown' | 'totalStock'> & {
  stockBySize?: Record<string, number>;
};

/** Descarta únicamente el contador final que usa la lista antigua `sizes`. */
export const normalizeStockSize = (value: string): string =>
  String(value || '').trim().replace(/\s+\(\d+\)\s*$/, '').trim().toLocaleLowerCase('es-CL');

/** Las tallas únicas son equivalentes a productos sin selector de talla. */
export const isRealSize = (value?: string): boolean => {
  const normalized = normalizeStockSize(value || '');
  return Boolean(normalized && ![
    'única', 'unica', 'talla única', 'talla unica',
    'sin talla', 'talla estándar', 'talla estandar', 'all'
  ].includes(normalized));
};

/** Fuente prioritaria: arreglo `sizeBreakdown` devuelto por MongoDB. */
export function getStockForSize(product: StockProduct, size: string): number {
  if (!isRealSize(size)) {
    // «Única» nunca habilita el stock total si el producto tiene tallas reales.
    const hasRealSizes = (product.sizeBreakdown || []).some((entry) => isRealSize(entry.size)) ||
      (product.sizes || []).some(isRealSize) ||
      Object.keys(product.stockBySize || {}).some(isRealSize);
    if (hasRealSizes) return 0;
    return Math.max(0, Number(product.totalStock) || 0);
  }
  const key = normalizeStockSize(size);
  if (Array.isArray(product.sizeBreakdown) && product.sizeBreakdown.length > 0) {
    const match = product.sizeBreakdown.find((s) => normalizeStockSize(s.size) === key);
    return match ? Math.max(0, Number(match.quantity) || 0) : 0;
  }
  if (product.stockBySize && Object.keys(product.stockBySize).length > 0) {
    const entry = Object.entries(product.stockBySize).find(([k]) => normalizeStockSize(k) === key);
    return entry ? Math.max(0, Number(entry[1]) || 0) : 0;
  }
  // Sin desglose confiable no asumimos que toda talla tiene el stock total.
  return 0;
}

/** Devuelve todas las tallas declaradas, incluidas las agotadas, para deshabilitarlas. */
export function getProductSizesWithStock(product: StockProduct) {
  const declaredSizes = Array.isArray(product.sizes) ? product.sizes.filter(isRealSize) : [];
  const list = declaredSizes.length > 0
    ? declaredSizes
    : (product.sizeBreakdown || []).map((entry) => entry.size).filter(isRealSize);
  return [...new Set(list.map((size) => String(size).trim().replace(/\s+\(\d+\)\s*$/, '')))]
    .map((size) => ({ size, stock: getStockForSize(product, size) }));
}

/** Reconoce un producto agotado cuando todas sus tallas están en cero. */
export function isProductOutOfStock(product: StockProduct): boolean {
  if ((Number(product.totalStock) || 0) <= 0) return true;
  const sizes = getProductSizesWithStock(product);
  return sizes.length > 0 && sizes.every((size) => size.stock <= 0);
}

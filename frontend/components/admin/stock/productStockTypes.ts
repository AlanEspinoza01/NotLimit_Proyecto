
import { INITIAL_PRODUCTS } from '../../../services/mockData';
import { Product } from '../../../types';
import { getProductPricing, normalizeSpecialCategory } from '../../../services/productPresentation';
import {
  PRODUCT_TAXONOMY,
  SIZES_ZAPATILLAS,
  SIZES_VESTUARIO_HOMBRE,
  SIZES_VESTUARIO_MUJER,
  SIZES_PANTALON_HOMBRE,
  SIZES_PANTALON_MUJER
} from '../../../views/admin/ProductManagerView';

export const STORAGE_KEY = 'nl_admin_product_stock_v1';
export const STORAGE_CATALOG_KEY = 'nl_admin_products_catalog_v1';

// Interfaz para el stock desglosado con soporte explícito de tallas
export interface ProductStockDetail extends Product {
  stockBySize: Record<string, number>; // Ej: { 'S': 4, 'M': 6, 'L': 4, 'XL': 2 }
  notes?: string;
  lastUpdated?: string;
}

export interface StockSummaryMetrics {
  totalUnits: number;
  totalProducts: number;
  withSizesCount: number;
  withoutSizesCount: number;
  inStockCount: number;
  lowStockCount: number;
  soldOutCount: number;
}

export interface TaxonomyCounts {
  bySection: Record<string, number>;
  byCategory: Record<string, number>;
  bySectionCategory: Record<string, number>;
  bySubCategory: Record<string, number>;
  bySpecial: Record<string, number>;
}

export function getOfficialSizeOptionsForTaxonomy(
  section: string,
  category: string,
  subCategory: string
): string[] {
  const cat = (category || '').trim();
  const sub = (subCategory || '').trim();
  const sec = (section || '').trim();

  if (cat === 'Calzado' || sub === 'Zapatillas') {
    return SIZES_ZAPATILLAS;
  }
  if (cat === 'Ropa Inferior' || sub === 'Pantalones' || sub === 'Shorts') {
    return sec === 'Mujer' ? SIZES_PANTALON_MUJER : SIZES_PANTALON_HOMBRE;
  }
  if (cat === 'Ropa Superior') {
    return sec === 'Mujer' ? SIZES_VESTUARIO_MUJER : SIZES_VESTUARIO_HOMBRE;
  }
  return [];
}

export function mapLegacySizeToOfficial(rawSize: string, targetOptions: string[]): string | null {
  const clean = (rawSize || '').trim();
  if (!clean) return null;
  const lower = clean.toLowerCase();
  if (
    lower === 'talla estándar' ||
    lower === 'talla estandar' ||
    lower === 'única' ||
    lower === 'unica' ||
    lower === 'única (ajustable)' ||
    lower === 'sin talla' ||
    lower === 'talla única'
  ) {
    return null;
  }

  if (targetOptions.includes(clean)) {
    return clean;
  }

  const rawPrefix = clean.split(' ')[0].toUpperCase();
  const normalizedPrefix = rawPrefix === 'XLL' ? 'XXL' : rawPrefix;

  const exactMatch = targetOptions.find(
    (opt) => opt.toUpperCase().startsWith(`${normalizedPrefix} `)
  );
  if (exactMatch) {
    return exactMatch;
  }

  return null;
}

export function normalizeProductSizesAndStock<T extends Product>(
  product: T,
  section: string,
  category: string,
  subCategory: string
): T {
  const targetOptions = getOfficialSizeOptionsForTaxonomy(section, category, subCategory);
  if (targetOptions.length === 0) {
    return {
      ...product,
      sizes: []
    };
  }

  const mappedSizes: string[] = [];
  (product.sizes || []).forEach((sz) => {
    const mapped = mapLegacySizeToOfficial(sz, targetOptions);
    if (mapped && !mappedSizes.includes(mapped)) {
      mappedSizes.push(mapped);
    }
  });

  const finalSizes =
    mappedSizes.length > 0
      ? mappedSizes
      : [
          targetOptions[1] || targetOptions[0],
          targetOptions[2] || targetOptions[0],
          targetOptions[3] || targetOptions[0],
          targetOptions[4] || targetOptions[0]
        ].filter((v, idx, arr) => Boolean(v) && arr.indexOf(v) === idx);

  let updatedBreakdown = product.sizeBreakdown;
  if (product.sizeBreakdown && product.sizeBreakdown.length > 0) {
    const breakdownMap = new Map<string, number>();
    product.sizeBreakdown.forEach((item) => {
      const mapped = mapLegacySizeToOfficial(item.size, targetOptions);
      if (mapped) {
        breakdownMap.set(mapped, (breakdownMap.get(mapped) || 0) + item.quantity);
      }
    });
    if (breakdownMap.size > 0) {
      updatedBreakdown = Array.from(breakdownMap.entries()).map(([size, quantity]) => ({
        size,
        quantity
      }));
    }
  }

  const maybeStockProduct = product as T & { stockBySize?: Record<string, number> };
  let updatedStockBySize = maybeStockProduct.stockBySize;
  if (updatedStockBySize && Object.keys(updatedStockBySize).length > 0) {
    const newStockMap: Record<string, number> = {};
    Object.entries(updatedStockBySize).forEach(([k, val]) => {
      const mapped = mapLegacySizeToOfficial(k, targetOptions);
      if (mapped) {
        newStockMap[mapped] = (newStockMap[mapped] || 0) + val;
      }
    });
    if (Object.keys(newStockMap).length > 0) {
      updatedStockBySize = newStockMap;
    } else {
      updatedStockBySize = undefined;
    }
  }

  return {
    ...product,
    sizes: finalSizes,
    ...(updatedBreakdown ? { sizeBreakdown: updatedBreakdown } : {}),
    ...(updatedStockBySize !== undefined ? { stockBySize: updatedStockBySize } : {})
  };
}

// Normalizador al esquema actual de taxonomía (Sección › Categoría › Subcategoría + Categoría Especial)
export function normalizeProductToCurrentTaxonomy<T extends Product>(product: T): T {
  let section = product.section || '';
  let category = product.category || '';
  let subCategory = product.subCategory || '';
  // Solo specialCategory define la sección especial, nunca una etiqueta ni un flag heredado.
  const specialCategory = normalizeSpecialCategory(product.specialCategory);
  const pricing = getProductPricing(product);
  const normalizedFlags = {
    specialCategory: specialCategory || 'Ninguna', // etiqueta legible del formulario
    isFeatured: specialCategory === 'Productos destacados',
    isExclusive: specialCategory === 'Live Drop',
    discountPercent: pricing.discountPercent,
    salePrice: pricing.hasDiscount ? pricing.finalPrice : undefined,
  };

  // Verificar si ya cumple exactamente con PRODUCT_TAXONOMY
  const existingSectionObj = PRODUCT_TAXONOMY.find(
    (s) => s.section.toLowerCase() === section.toLowerCase()
  );
  if (existingSectionObj) {
    const existingCatObj = existingSectionObj.categories.find(
      (c) => c.name.toLowerCase() === category.toLowerCase()
    );
    if (existingCatObj) {
      const existingSub = existingCatObj.subcategories.find(
        (sub) => sub.toLowerCase() === subCategory.toLowerCase()
      );
      const resolvedSec = existingSectionObj.section;
      const resolvedCat = existingCatObj.name;
      const resolvedSub = existingSub || existingCatObj.subcategories[0] || 'General';
      return normalizeProductSizesAndStock(
        {
          ...product,
          section: resolvedSec,
          category: resolvedCat,
          subCategory: resolvedSub,
          ...normalizedFlags
        },
        resolvedSec,
        resolvedCat,
        resolvedSub
      );
    }
  }

  // Mapear categorías heredadas o desactualizadas al esquema actual
  const rawCat = category.trim().toLowerCase();
  const rawSub = subCategory.trim().toLowerCase();
  const rawTitle = (product.title || '').toLowerCase();

  if (rawCat === 'hoddies' || rawCat === 'hoodies' || rawSub.includes('hoodie')) {
    section = section && PRODUCT_TAXONOMY.some((s) => s.section === section) ? section : 'Hombre';
    category = 'Ropa Superior';
    subCategory =
      rawTitle.includes('zip') || rawSub.includes('zip') ? 'Hoodies doble zip' : 'Hoodies';
  } else if (rawCat === 'poleras' || rawSub.includes('tee') || rawSub.includes('polera')) {
    section = section && PRODUCT_TAXONOMY.some((s) => s.section === section) ? section : 'Hombre';
    category = 'Ropa Superior';
    subCategory = 'Poleras';
  } else if (rawCat === 'camisas') {
    section = section && PRODUCT_TAXONOMY.some((s) => s.section === section) ? section : 'Hombre';
    category = 'Ropa Superior';
    subCategory = 'Camisas';
  } else if (rawCat === 'blusas') {
    section = 'Mujer';
    category = 'Ropa Superior';
    subCategory = 'Blusas';
  } else if (
    rawCat === 'chaquetas' ||
    rawSub === 'biker' ||
    rawSub === 'windbreaker' ||
    rawSub === 'vests'
  ) {
    section =
      section && PRODUCT_TAXONOMY.some((s) => s.section === section)
        ? section
        : rawSub === 'biker'
        ? 'Mujer'
        : 'Hombre';
    category = 'Ropa Superior';
    subCategory = 'Chaquetas';
  } else if (rawCat === 'pantalones' || rawSub === 'parachute' || rawSub === 'cargo') {
    section = section && PRODUCT_TAXONOMY.some((s) => s.section === section) ? section : 'Hombre';
    category = 'Ropa Inferior';
    subCategory = 'Pantalones';
  } else if (rawCat === 'shorts') {
    section = section && PRODUCT_TAXONOMY.some((s) => s.section === section) ? section : 'Hombre';
    category = 'Ropa Inferior';
    subCategory = 'Shorts';
  } else if (
    rawCat === 'bolsos' ||
    rawCat === 'carteras' ||
    rawSub === 'baguette' ||
    rawSub === 'crossbody'
  ) {
    section = 'Mujer';
    category = 'Carteras y Accesorios';
    subCategory = 'Carteras';
  } else if (
    rawCat === 'jockey' ||
    rawSub === 'trucker' ||
    rawSub === 'snapback' ||
    rawTitle.includes('gorra') ||
    rawTitle.includes('jockey')
  ) {
    section = section === 'Mujer' ? 'Mujer' : 'Hombre';
    category = section === 'Mujer' ? 'Carteras y Accesorios' : 'Accesorios';
    subCategory = 'Jockey';
  } else if (rawCat === 'billeteras' || rawSub === 'billeteras') {
    section = section === 'Mujer' ? 'Mujer' : 'Hombre';
    category = section === 'Mujer' ? 'Carteras y Accesorios' : 'Accesorios';
    subCategory = 'Billeteras';
  } else if (rawCat === 'accesorios' || rawSub === 'chokers' || rawTitle.includes('choker')) {
    const isFemaleAcc =
      section === 'Mujer' || rawSub === 'chokers' || rawTitle.includes('choker');
    section = isFemaleAcc ? 'Mujer' : 'Hombre';
    category = isFemaleAcc ? 'Carteras y Accesorios' : 'Accesorios';
    subCategory = 'Otros Accesorios';
  } else if (rawCat === 'calzado' || rawCat === 'zapatillas') {
    section = section === 'Mujer' ? 'Mujer' : 'Hombre';
    category = 'Calzado';
    subCategory = 'Zapatillas';
  } else if (rawCat.includes('mistery') || rawTitle.includes('mistery')) {
    section = 'Mistery box';
    category = 'Mistery box';
    subCategory = 'Mistery Box Especial';
  } else {
    // Buscar coincidencia parcial en PRODUCT_TAXONOMY
    let matched = false;
    for (const secObj of PRODUCT_TAXONOMY) {
      for (const catObj of secObj.categories) {
        if (
          catObj.name.toLowerCase() === rawCat ||
          catObj.subcategories.some((s) => s.toLowerCase() === rawCat || s.toLowerCase() === rawSub)
        ) {
          section = secObj.section;
          category = catObj.name;
          const foundSub = catObj.subcategories.find(
            (s) => s.toLowerCase() === rawSub || s.toLowerCase() === rawCat
          );
          subCategory = foundSub || catObj.subcategories[0] || 'General';
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    if (!matched) {
      section = 'Otros';
      category = 'Otros';
      subCategory = 'General';
    }
  }

  return normalizeProductSizesAndStock(
    {
      ...product,
      section,
      category,
      subCategory,
      ...normalizedFlags
    },
    section,
    category,
    subCategory
  );
}

// Función generadora de stock inicial por tallas si no viene predefinido
export function generateInitialStockBySize(product: Product): Record<string, number> {
  if (product.sizeBreakdown && product.sizeBreakdown.length > 0) {
    const fromBreakdown: Record<string, number> = {};
    product.sizeBreakdown.forEach((item) => {
      fromBreakdown[item.size] = item.quantity;
    });
    return fromBreakdown;
  }

  if (!product.sizes || product.sizes.length === 0) {
    return {};
  }

  const sizesCount = product.sizes.length;
  const total = product.totalStock;

  if (total === 0) {
    const result: Record<string, number> = {};
    product.sizes.forEach((s) => {
      result[s] = 0;
    });
    return result;
  }

  // Distribución proporcional y balanceada
  const basePerSize = Math.floor(total / sizesCount);
  let remainder = total % sizesCount;

  const result: Record<string, number> = {};
  product.sizes.forEach((s) => {
    let count = basePerSize;
    if (remainder > 0) {
      count += 1;
      remainder -= 1;
    }
    result[s] = count;
  });

  return result;
}

export function loadAndSyncProductsStock(): ProductStockDetail[] {
  let stockProducts: ProductStockDetail[] = [];
  let catalogProducts: Product[] = [];

  try {
    const savedStock = localStorage.getItem(STORAGE_KEY);
    if (savedStock) {
      stockProducts = JSON.parse(savedStock);
    }
  } catch (e) {
    console.error('Error cargando stock desde storage', e);
  }

  try {
    const savedCatalog = localStorage.getItem(STORAGE_CATALOG_KEY);
    if (savedCatalog) {
      catalogProducts = JSON.parse(savedCatalog);
    }
  } catch (e) {
    console.error('Error cargando catálogo desde storage', e);
  }

  const baseList =
    stockProducts.length > 0
      ? stockProducts
      : (catalogProducts.length > 0 ? catalogProducts : INITIAL_PRODUCTS).map((p) => ({
          ...p,
          stockBySize: generateInitialStockBySize(p),
          lastUpdated: new Date().toISOString()
        }));

  // Reconciliar categorías con catálogo si existe y normalizar todo al esquema actual
  const catalogMap = new Map<string, Product>();
  catalogProducts.forEach((cp) => catalogMap.set(cp.id, cp));

  const normalizedList = baseList.map((item) => {
    const catalogMatch = catalogMap.get(item.id);
    const merged: ProductStockDetail = catalogMatch
      ? {
          ...item,
          title: catalogMatch.title || item.title,
          description: catalogMatch.description || item.description,
          price: catalogMatch.price ?? item.price,
          salePrice: catalogMatch.salePrice,
          discountPercent: catalogMatch.discountPercent,
          images:
            catalogMatch.images && catalogMatch.images.length > 0
              ? catalogMatch.images
              : item.images,
          sizes: catalogMatch.sizes || item.sizes,
          sizeBreakdown: catalogMatch.sizeBreakdown || item.sizeBreakdown,
          colors:
            catalogMatch.colors && catalogMatch.colors.length > 0
              ? catalogMatch.colors
              : item.colors,
          weightGrams: catalogMatch.weightGrams ?? item.weightGrams,
          section: catalogMatch.section || item.section,
          category: catalogMatch.category || item.category,
          subCategory: catalogMatch.subCategory || item.subCategory,
          specialCategory: catalogMatch.specialCategory ?? item.specialCategory
        }
      : item;

    const normalized = normalizeProductToCurrentTaxonomy(merged);
    return {
      ...normalized,
      stockBySize:
        normalized.stockBySize && Object.keys(normalized.stockBySize).length > 0
          ? normalized.stockBySize
          : generateInitialStockBySize(normalized)
    };
  });

  // Agregar productos nuevos que estén en el catálogo o en INITIAL_PRODUCTS pero aún no en el resumen de stock
  const existingIds = new Set(normalizedList.map((p) => p.id));
  const combinedSource = [...catalogProducts, ...INITIAL_PRODUCTS];
  combinedSource.forEach((cp) => {
    if (!existingIds.has(cp.id)) {
      existingIds.add(cp.id);
      const normalizedNew = normalizeProductToCurrentTaxonomy(cp);
      normalizedList.push({
        ...normalizedNew,
        stockBySize: generateInitialStockBySize(normalizedNew),
        lastUpdated: new Date().toISOString()
      });
    }
  });

  return normalizedList;
}

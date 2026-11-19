export const STORAGE_CATALOG_KEY = 'nl_admin_products_catalog_v1';

// Esquema de tallas oficial No Limits
export const SIZES_ZAPATILLAS = [
  '33 (Chile/EUR) - 3 (USA)',
  '34 (Chile/EUR) - 4 (USA)',
  '35 (Chile/EUR) - 5 (USA)',
  '35 1/2 (Chile/EUR) - 5.5 (USA)',
  '36 (Chile/EUR) - 6 (USA)',
  '36 1/2 (Chile/EUR) - 6.5 (USA)',
  '37 (Chile/EUR) - 7 (USA)',
  '37 1/2 (Chile/EUR) - 7.5 (USA)',
  '38 (Chile/EUR) - 8 (USA)',
  '38 1/2 (Chile/EUR) - 8.5 (USA)',
  '39 (Chile/EUR) - 9 (USA)',
  '39 1/2 (Chile/EUR) - 9.5 (USA)',
  '40 (Chile/EUR) - 10 (USA)',
  '40 1/2 (Chile/EUR) - 10.5 (USA)',
  '41 (Chile/EUR) - 11 (USA)',
  '41 1/2 (Chile/EUR) - 11.5 (USA)',
  '42 (Chile/EUR) - 12 (USA)',
  '42 1/2 (Chile/EUR) - 12.5 (USA)',
  '43 (Chile/EUR) - 13 (USA)',
  '43 1/2 (Chile/EUR) - 13.5 (USA)',
  '44 (Chile/EUR) - 14 (USA)',
  '44 1/2 (Chile/EUR) - 14.5 (USA)',
  '45 (Chile/EUR) - 15 (USA)',
  '45 1/2 (Chile/EUR) - 15.5 (USA)',
  '46 (Chile/EUR) - 16 (USA)',
  '47 (Chile/EUR) - 17 (USA)'
];

export const SIZES_VESTUARIO_HOMBRE = [
  'XS (Chile/EUR) - 30-32 (USA)',
  'S (Chile/EUR) - 34-36 (USA)',
  'M (Chile/EUR) - 38-40 (USA)',
  'L (Chile/EUR) - 42-44 (USA)',
  'XL (Chile/EUR) - 46-48 (USA)',
  'XXL (Chile/EUR) - 50-52 (USA)',
  'XXXL (Chile/EUR) - 54-56 (USA)'
];

export const SIZES_VESTUARIO_MUJER = [
  'XS (Chile/EUR) - 2-4 (USA)',
  'S (Chile/EUR) - 4-6 (USA)',
  'M (Chile/EUR) - 8-10 (USA)',
  'L (Chile/EUR) - 12-14 (USA)',
  'XL (Chile/EUR) - 16-18 (USA)',
  'XXL (Chile/EUR) - 20-22 (USA)',
  'XXXL (Chile/EUR) - 24-26 (USA)'
];

export const SIZES_PANTALON_HOMBRE = [
  'XS (Chile/EUR) - equivale a talla 30-32 (USA)',
  'S (Chile/EUR) - equivale a talla 34-36 (USA)',
  'M (Chile/EUR) - equivale a talla 38-40 (USA)',
  'L (Chile/EUR) - equivale a talla 42-44 (USA)',
  'XL (Chile/EUR) - equivale a talla 46-48 (USA)',
  'XXL (Chile/EUR) - equivale a talla 50-52 (USA)',
  'XXXL (Chile/EUR) - equivale a talla 54-56 (USA)'
];

export const SIZES_PANTALON_MUJER = [
  'XS (Chile/EUR) - equivale a talla 2-4 (USA)',
  'S (Chile/EUR) - equivale a talla 4-6 (USA)',
  'M (Chile/EUR) - equivale a talla 8-10 (USA)',
  'L (Chile/EUR) - equivale a talla 12-14 (USA)',
  'XL (Chile/EUR) - equivale a talla 16-18 (USA)',
  'XXL (Chile/EUR) - equivale a talla 20-22 (USA)',
  'XXXL (Chile/EUR) - equivale a talla 24-26 (USA)'
];

// Esquema de Categorías y Subcategorías por Sección
export interface TaxonomyCategory {
  name: string;
  subcategories: string[];
}

export interface SectionTaxonomy {
  section: string;
  categories: TaxonomyCategory[];
}

export const PRODUCT_TAXONOMY: SectionTaxonomy[] = [
  {
    section: 'Hombre',
    categories: [
      {
        name: 'Ropa Superior',
        subcategories: ['Poleras', 'Camisas', 'Chaquetas', 'Hoodies', 'Hoodies doble zip']
      },
      {
        name: 'Ropa Inferior',
        subcategories: ['Pantalones', 'Shorts']
      },
      {
        name: 'Calzado',
        subcategories: ['Zapatillas']
      },
      {
        name: 'Accesorios',
        subcategories: ['Jockey', 'Billeteras', 'Otros Accesorios']
      },
      {
        name: 'Otros',
        subcategories: ['General', 'Coleccionables', 'Varios']
      }
    ]
  },
  {
    section: 'Mujer',
    categories: [
      {
        name: 'Ropa Superior',
        subcategories: ['Poleras', 'Blusas', 'Camisas', 'Chaquetas', 'Hoodies', 'Hoodies doble zip']
      },
      {
        name: 'Ropa Inferior',
        subcategories: ['Pantalones', 'Shorts']
      },
      {
        name: 'Calzado',
        subcategories: [
          'Zapatos con tacón',
          'Zapatos planos',
          'Botas y botines',
          'Pantuflas',
          'Zapatos de fiesta',
          'Sandalias y chalas',
          'Zapatillas'
        ]
      },
      {
        name: 'Carteras y Accesorios',
        subcategories: ['Carteras', 'Billeteras', 'Jockey', 'Otros Accesorios']
      },
      {
        name: 'Otros',
        subcategories: ['General', 'Coleccionables', 'Varios']
      }
    ]
  },
  {
    section: 'Mistery box',
    categories: [
      {
        name: 'Mistery box',
        subcategories: ['Mistery Box Hombre', 'Mistery Box Mujer', 'Mistery Box Especial', 'Edición Limitada']
      },
      {
        name: 'Otros',
        subcategories: ['General', 'Varios']
      }
    ]
  },
  {
    section: 'Otros',
    categories: [
      {
        name: 'Otros',
        subcategories: ['General', 'Artículos Varios', 'Coleccionables', 'Regalos']
      }
    ]
  }
];

export const STORAGE_CATEGORIES_VISIBILITY_KEY = 'nl_admin_categories_visibility_v1';

export interface CategoriesVisibilityConfig {
  disabledSections: string[];
  disabledCategories: string[];
  disabledSubcategories: string[];
}

export function loadCategoriesVisibility(): CategoriesVisibilityConfig {
  try {
    const saved = localStorage.getItem(STORAGE_CATEGORIES_VISIBILITY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        disabledSections: Array.isArray(parsed.disabledSections) ? parsed.disabledSections : [],
        disabledCategories: Array.isArray(parsed.disabledCategories) ? parsed.disabledCategories : [],
        disabledSubcategories: Array.isArray(parsed.disabledSubcategories)
          ? parsed.disabledSubcategories
          : []
      };
    }
  } catch (e) {
    console.warn('Error loading categories visibility:', e);
  }
  return {
    disabledSections: [],
    disabledCategories: [],
    disabledSubcategories: []
  };
}

export function saveCategoriesVisibility(config: CategoriesVisibilityConfig): void {
  try {
    localStorage.setItem(STORAGE_CATEGORIES_VISIBILITY_KEY, JSON.stringify(config));
    window.dispatchEvent(new Event('nl_categories_visibility_updated'));
  } catch (e) {
    console.error('Error saving categories visibility:', e);
  }
}

export function isSectionActive(section: string, config?: CategoriesVisibilityConfig): boolean {
  const cfg = config || loadCategoriesVisibility();
  return !cfg.disabledSections.some((s) => s.toLowerCase() === (section || '').toLowerCase());
}

export function isCategoryActive(
  section: string,
  category: string,
  config?: CategoriesVisibilityConfig
): boolean {
  const cfg = config || loadCategoriesVisibility();
  if (!isSectionActive(section, cfg)) return false;
  const key = `${section}::${category}`.toLowerCase();
  return !cfg.disabledCategories.some((c) => c.toLowerCase() === key);
}

export function isSubcategoryActive(
  section: string,
  category: string,
  subcategory: string,
  config?: CategoriesVisibilityConfig
): boolean {
  const cfg = config || loadCategoriesVisibility();
  if (!isCategoryActive(section, category, cfg)) return false;
  const key = `${section}::${category}::${subcategory}`.toLowerCase();
  return !cfg.disabledSubcategories.some((sc) => sc.toLowerCase() === key);
}

export function isProductTaxonomyActive(
  product: { section?: string; category?: string; subCategory?: string; subcategory?: string },
  config?: CategoriesVisibilityConfig
): boolean {
  const cfg = config || loadCategoriesVisibility();
  const sec = product.section || 'Otros';
  const cat = product.category || 'Otros';
  const sub = product.subCategory || product.subcategory || 'General';
  return isSubcategoryActive(sec, cat, sub, cfg);
}

export function getActiveProductTaxonomy(config?: CategoriesVisibilityConfig): SectionTaxonomy[] {
  const cfg = config || loadCategoriesVisibility();
  return PRODUCT_TAXONOMY.filter((secObj) => isSectionActive(secObj.section, cfg))
    .map((secObj) => ({
      section: secObj.section,
      categories: secObj.categories
        .filter((catObj) => isCategoryActive(secObj.section, catObj.name, cfg))
        .map((catObj) => ({
          name: catObj.name,
          subcategories: catObj.subcategories.filter((sub) =>
            isSubcategoryActive(secObj.section, catObj.name, sub, cfg)
          )
        }))
        .filter((catObj) => catObj.subcategories.length > 0)
    }))
    .filter((secObj) => secObj.categories.length > 0);
}

// Opciones de Categoría Especial según requerimiento
export const SPECIAL_CATEGORIES = [
  { value: 'Ninguna', label: 'Ninguna', color: 'bg-gray-100 text-gray-800 border-gray-300' },
  { value: 'Productos destacados', label: '⭐ Productos destacados', color: 'bg-amber-100 text-amber-900 border-amber-400' },
  { value: 'Live Drop', label: '⚡ Live Drop', color: 'bg-purple-100 text-purple-900 border-purple-400' },
  { value: 'Producto Personalizado', label: '🎨 Producto Personalizado', color: 'bg-cyan-100 text-cyan-900 border-cyan-400' }
];

export interface ShippingTierItem {
  id: number;
  label: string;
  factor: string;
  maxGrams: number;
  full: string;
}

// Tramos oficiales de flete (0 a 20 KG)
export const SHIPPING_TIERS: ShippingTierItem[] = [
  { id: 1, label: '0-1 KG', factor: '0.70x', maxGrams: 1000, full: '0 - 1 KG (Tramo 1)' },
  { id: 2, label: '1-3 KG', factor: '0.85/0.90x', maxGrams: 3000, full: '1 - 3 KG (Tramo 2)' },
  { id: 3, label: '3-6 KG', factor: '1.10x', maxGrams: 6000, full: '3 - 6 KG (Tramo 3)' },
  { id: 4, label: '6-12 KG', factor: '1.40x', maxGrams: 12000, full: '6 - 12 KG (Tramo 4)' },
  { id: 5, label: '12-20 KG', factor: '1.75x', maxGrams: 20000, full: '12 - 20 KG (Tramo 5)' }
];

// Formateador de moneda chilena (CLP)
export function formatCLP(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '$ 0';
  return '$ ' + Math.round(amount).toLocaleString('es-CL');
}

// Limpiar formato de texto a número entero
export function parseCLPInput(text: string): number {
  const clean = text.replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

export interface SizeItem {
  id: string;
  size: string;
  quantity: number;
}

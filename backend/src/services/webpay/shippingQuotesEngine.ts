/**
 * ============================================================================
 * ARCHIVO: shippingQuotesEngine.ts
 * PROYECTO: No Limits Apparel OS (Frontend & Backend Ready)
 * ============================================================================
 * Incluye:
 * 1. Matriz oficial de Categorías, Subcategorías y Pesos promedio en gramos,
 *    incluyendo prendas con tallas y categoría "Otros" (sin talla).
 * 2. Las 16 Regiones y +330 Comunas de Chile (tarifas base 3KG desde V Región).
 * 3. Tramos oficiales de 0 a 20 KG con multiplicadores de courier (Starken,
 *    Blue Express) y tarifario escalonado Paket ($2.990 a $6.990 CLP).
 * ============================================================================
 */

export type OriginBranchId = 'vina_del_mar' | 'valparaiso' | 'quilpue';
export type ShippingCourierId = 'blue_express' | 'starken' | 'paket';

export interface CategorySubcategoryWeight {
  name: string;
  defaultWeightGrams: number;
}

export interface CategoryConfig {
  name: string;
  defaultWeightGrams: number;
  sections: string[];
  subcategories: string[];
}

export interface TaxonomySectionCategory {
  name: string;
  defaultWeightGrams: number;
  subcategories: string[];
}

export interface OfficialSectionTaxonomy {
  section: 'Hombre' | 'Mujer' | 'Mistery box' | 'Otros';
  categories: TaxonomySectionCategory[];
}

/**
 * 1. ESQUEMA OFICIAL DE SECCIONES, CATEGORÍAS, SUBCATEGORÍAS Y CATEGORÍAS ESPECIALES
 * Sincronizado con el Administrador de Productos, Resumen de Stock y Catálogo.
 */
export const OFFICIAL_SECTIONS_TAXONOMY: OfficialSectionTaxonomy[] = [
  {
    section: 'Hombre',
    categories: [
      {
        name: 'Ropa Superior',
        defaultWeightGrams: 400,
        subcategories: ['Poleras', 'Camisas', 'Chaquetas', 'Hoodies', 'Hoodies doble zip']
      },
      {
        name: 'Ropa Inferior',
        defaultWeightGrams: 600,
        subcategories: ['Pantalones', 'Shorts']
      },
      {
        name: 'Calzado',
        defaultWeightGrams: 1200,
        subcategories: ['Zapatillas']
      },
      {
        name: 'Accesorios',
        defaultWeightGrams: 150,
        subcategories: ['Jockey', 'Billeteras', 'Otros Accesorios']
      },
      {
        name: 'Otros',
        defaultWeightGrams: 400,
        subcategories: ['General', 'Coleccionables', 'Varios']
      }
    ]
  },
  {
    section: 'Mujer',
    categories: [
      {
        name: 'Ropa Superior',
        defaultWeightGrams: 400,
        subcategories: ['Poleras', 'Blusas', 'Camisas', 'Chaquetas', 'Hoodies', 'Hoodies doble zip']
      },
      {
        name: 'Ropa Inferior',
        defaultWeightGrams: 600,
        subcategories: ['Pantalones', 'Shorts']
      },
      {
        name: 'Calzado',
        defaultWeightGrams: 1000,
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
        defaultWeightGrams: 450,
        subcategories: ['Carteras', 'Billeteras', 'Jockey', 'Otros Accesorios']
      },
      {
        name: 'Otros',
        defaultWeightGrams: 400,
        subcategories: ['General', 'Coleccionables', 'Varios']
      }
    ]
  },
  {
    section: 'Mistery box',
    categories: [
      {
        name: 'Mistery box',
        defaultWeightGrams: 1500,
        subcategories: [
          'Mistery Box Hombre',
          'Mistery Box Mujer',
          'Mistery Box Especial',
          'Edición Limitada'
        ]
      },
      {
        name: 'Otros',
        defaultWeightGrams: 400,
        subcategories: ['General', 'Varios']
      }
    ]
  },
  {
    section: 'Otros',
    categories: [
      {
        name: 'Otros',
        defaultWeightGrams: 400,
        subcategories: ['General', 'Artículos Varios', 'Coleccionables', 'Regalos']
      }
    ]
  }
];

export const OFFICIAL_SECTIONS = OFFICIAL_SECTIONS_TAXONOMY.map((s) => s.section);

export const OFFICIAL_SPECIAL_CATEGORIES = [
  'Ninguna',
  'Productos destacados',
  'Live Drop',
  'Producto Personalizado'
] as const;

/**
 * MATRIZ OFICIAL CONSOLIDADA DE CATEGORÍAS Y SUBCATEGORÍAS
 * Basada en el esquema oficial (Sección › Categoría › Subcategoría)
 */
export const OFFICIAL_CATEGORIES: CategoryConfig[] = [
  {
    name: 'Ropa Superior',
    defaultWeightGrams: 400,
    sections: ['Hombre', 'Mujer'],
    subcategories: [
      'Poleras',
      'Blusas',
      'Camisas',
      'Chaquetas',
      'Hoodies',
      'Hoodies doble zip'
    ]
  },
  {
    name: 'Ropa Inferior',
    defaultWeightGrams: 600,
    sections: ['Hombre', 'Mujer'],
    subcategories: ['Pantalones', 'Shorts']
  },
  {
    name: 'Calzado',
    defaultWeightGrams: 1200,
    sections: ['Hombre', 'Mujer'],
    subcategories: [
      'Zapatillas',
      'Zapatos con tacón',
      'Zapatos planos',
      'Botas y botines',
      'Pantuflas',
      'Zapatos de fiesta',
      'Sandalias y chalas'
    ]
  },
  {
    name: 'Accesorios',
    defaultWeightGrams: 150,
    sections: ['Hombre'],
    subcategories: ['Jockey', 'Billeteras', 'Otros Accesorios']
  },
  {
    name: 'Carteras y Accesorios',
    defaultWeightGrams: 450,
    sections: ['Mujer'],
    subcategories: ['Carteras', 'Billeteras', 'Jockey', 'Otros Accesorios']
  },
  {
    name: 'Mistery box',
    defaultWeightGrams: 1500,
    sections: ['Mistery box'],
    subcategories: [
      'Mistery Box Hombre',
      'Mistery Box Mujer',
      'Mistery Box Especial',
      'Edición Limitada'
    ]
  },
  {
    name: 'Otros',
    defaultWeightGrams: 400,
    sections: ['Hombre', 'Mujer', 'Mistery box', 'Otros'],
    subcategories: [
      'General',
      'Artículos Varios',
      'Coleccionables',
      'Regalos',
      'Varios'
    ]
  }
];

/**
 * PESOS OFICIALES EN GRAMOS POR SUBCATEGORÍA Y CATEGORÍA
 * Permite cálculo exacto del peso según la subcategoría específica (ej. Poleras = 250g, Hoodies = 800g, Chaquetas = 1150g)
 */
export const SUBCATEGORY_WEIGHTS_GRAMS: Record<string, number> = {
  // Ropa Superior
  'Poleras': 250,
  'Blusas': 220,
  'Camisas': 350,
  'Chaquetas': 1150,
  'Hoodies': 800,
  'Hoodies doble zip': 850,
  // Ropa Inferior
  'Pantalones': 650,
  'Shorts': 400,
  // Calzado
  'Zapatillas': 1200,
  'Zapatos con tacón': 950,
  'Zapatos planos': 750,
  'Botas y botines': 1350,
  'Pantuflas': 450,
  'Zapatos de fiesta': 850,
  'Sandalias y chalas': 550,
  // Accesorios y Carteras
  'Jockey': 150,
  'Billeteras': 200,
  'Carteras': 450,
  'Otros Accesorios': 150,
  // Mistery box
  'Mistery Box Hombre': 1500,
  'Mistery Box Mujer': 1500,
  'Mistery Box Especial': 1800,
  'Edición Limitada': 1600,
  // Otros
  'General': 400,
  'Coleccionables': 350,
  'Artículos Varios': 400,
  'Varios': 400,
  'Regalos': 450
};

export const CATEGORY_WEIGHTS_GRAMS: Record<string, number> = {
  ...OFFICIAL_CATEGORIES.reduce((acc, cat) => {
    acc[cat.name] = cat.defaultWeightGrams;
    return acc;
  }, {} as Record<string, number>),
  ...SUBCATEGORY_WEIGHTS_GRAMS,
  // Alias de compatibilidad con registros históricos
  'Hoddies': 800,
  'Hoddies doble zip': 850,
  'Bolsos': 450
};

export const OFFICIAL_CATEGORY_NAMES = OFFICIAL_CATEGORIES.map((c) => c.name);

/**
 * Obtiene las categorías oficiales disponibles según la sección seleccionada
 */
export function getCategoriesBySection(sectionName?: string): TaxonomySectionCategory[] {
  if (!sectionName || sectionName === 'all') {
    return OFFICIAL_CATEGORIES.map((c) => ({
      name: c.name,
      defaultWeightGrams: c.defaultWeightGrams,
      subcategories: c.subcategories
    }));
  }
  const foundSec = OFFICIAL_SECTIONS_TAXONOMY.find(
    (s) => s.section.toLowerCase() === sectionName.trim().toLowerCase()
  );
  return foundSec ? foundSec.categories : [];
}

/**
 * Obtiene las subcategorías correspondientes a una categoría dada (y opcionalmente sección)
 */
export function getSubcategoriesByCategory(categoryName: string, sectionName?: string): string[] {
  if (!categoryName) return [];
  const cleanCat = categoryName.trim().toLowerCase();

  // Si se indica sección específica, buscar primero en la sección del esquema oficial
  if (sectionName && sectionName !== 'all') {
    const secObj = OFFICIAL_SECTIONS_TAXONOMY.find(
      (s) => s.section.toLowerCase() === sectionName.trim().toLowerCase()
    );
    if (secObj) {
      const catInSec = secObj.categories.find((c) => c.name.toLowerCase() === cleanCat);
      if (catInSec) return catInSec.subcategories;
    }
  }

  // Búsqueda directa en categorías oficiales consolidadas
  const found = OFFICIAL_CATEGORIES.find((c) => c.name.toLowerCase() === cleanCat);
  if (found) return found.subcategories;

  // Compatibilidad si se consulta por el nombre de una subcategoría antigua o agrupador
  if (
    cleanCat.includes('ropa superior') ||
    cleanCat.includes('polera') ||
    cleanCat.includes('blusa') ||
    cleanCat.includes('camisa') ||
    cleanCat.includes('chaqueta') ||
    cleanCat.includes('hoodie') ||
    cleanCat.includes('hoddie')
  ) {
    return OFFICIAL_CATEGORIES.find((c) => c.name === 'Ropa Superior')?.subcategories || [];
  }
  if (
    cleanCat.includes('ropa inferior') ||
    cleanCat.includes('pantalon') ||
    cleanCat.includes('pantalón') ||
    cleanCat.includes('short')
  ) {
    return OFFICIAL_CATEGORIES.find((c) => c.name === 'Ropa Inferior')?.subcategories || [];
  }
  if (
    cleanCat.includes('calzado') ||
    cleanCat.includes('zapatilla') ||
    cleanCat.includes('zapato') ||
    cleanCat.includes('bota') ||
    cleanCat.includes('sandalia') ||
    cleanCat.includes('pantufla')
  ) {
    return OFFICIAL_CATEGORIES.find((c) => c.name === 'Calzado')?.subcategories || [];
  }
  if (cleanCat.includes('cartera') || cleanCat.includes('bolso')) {
    return OFFICIAL_CATEGORIES.find((c) => c.name === 'Carteras y Accesorios')?.subcategories || [];
  }
  if (
    cleanCat.includes('accesorio') ||
    cleanCat.includes('jockey') ||
    cleanCat.includes('billetera')
  ) {
    return OFFICIAL_CATEGORIES.find((c) => c.name === 'Accesorios')?.subcategories || [];
  }
  if (cleanCat.includes('mistery') || cleanCat.includes('mystery')) {
    return OFFICIAL_CATEGORIES.find((c) => c.name === 'Mistery box')?.subcategories || [];
  }
  if (cleanCat.includes('otro')) {
    return OFFICIAL_CATEGORIES.find((c) => c.name === 'Otros')?.subcategories || [];
  }
  return [];
}

/**
 * Devuelve el peso sugerido en gramos al seleccionar una categoría o subcategoría del esquema oficial
 */
export function getDefaultWeightByCategory(
  categoryOrSubcategoryName: string,
  subCategoryName?: string
): number {
  // Priorizar peso de la subcategoría específica si se proporciona
  if (subCategoryName && subCategoryName.trim() !== '') {
    const cleanSub = subCategoryName.trim();
    if (SUBCATEGORY_WEIGHTS_GRAMS[cleanSub]) {
      return SUBCATEGORY_WEIGHTS_GRAMS[cleanSub];
    }
    const matchedSubKey = Object.keys(SUBCATEGORY_WEIGHTS_GRAMS).find(
      (k) => k.toLowerCase() === cleanSub.toLowerCase()
    );
    if (matchedSubKey) {
      return SUBCATEGORY_WEIGHTS_GRAMS[matchedSubKey];
    }
  }

  if (!categoryOrSubcategoryName) return 400;
  const clean = categoryOrSubcategoryName.trim();
  if (CATEGORY_WEIGHTS_GRAMS[clean]) {
    return CATEGORY_WEIGHTS_GRAMS[clean];
  }
  const matchedKey = Object.keys(CATEGORY_WEIGHTS_GRAMS).find(
    (k) => k.toLowerCase() === clean.toLowerCase()
  );
  if (matchedKey) {
    return CATEGORY_WEIGHTS_GRAMS[matchedKey];
  }

  const lower = clean.toLowerCase();
  if (lower.includes('mistery') || lower.includes('mystery')) return 1500;
  if (lower.includes('bota') || lower.includes('botín') || lower.includes('botin')) return 1350;
  if (lower.includes('zapatilla') || lower.includes('calzado')) return 1200;
  if (lower.includes('tacón') || lower.includes('tacon')) return 950;
  if (lower.includes('fiesta')) return 850;
  if (lower.includes('zapato')) return 750;
  if (lower.includes('sandalia') || lower.includes('chala')) return 550;
  if (lower.includes('pantufla')) return 450;
  if (lower.includes('chaqueta') || lower.includes('abrigo') || lower.includes('bomber') || lower.includes('parka')) return 1150;
  if (lower.includes('doble zip') || lower.includes('two-way')) return 850;
  if (lower.includes('polerón') || lower.includes('poleron') || lower.includes('hoodie') || lower.includes('hoddie') || lower.includes('sweater')) return 800;
  if (lower.includes('pantal') || lower.includes('cargo') || lower.includes('jeans') || lower.includes('ropa inferior')) return 650;
  if (lower.includes('cartera') || lower.includes('bolso') || lower.includes('mochila') || lower.includes('banano')) return 450;
  if (lower.includes('short') || lower.includes('jort') || lower.includes('bermuda')) return 400;
  if (lower.includes('ropa superior')) return 400;
  if (lower.includes('camisa')) return 350;
  if (lower.includes('polera') || lower.includes('top') || lower.includes('corset') || lower.includes('camiseta')) return 250;
  if (lower.includes('blusa')) return 220;
  if (lower.includes('billetera') || lower.includes('tarjetero') || lower.includes('monedero')) return 200;
  if (lower.includes('jockey') || lower.includes('gorra') || lower.includes('gorro') || lower.includes('beanie')) return 150;
  if (lower.includes('accesorio') || lower.includes('guante') || lower.includes('lente') || lower.includes('collar') || lower.includes('cadena')) return 150;
  if (lower.includes('coleccionable')) return 350;
  if (lower.includes('regalo')) return 450;
  if (lower.includes('otro') || lower.includes('general') || lower.includes('vario')) return 400;
  return 400;
}

/**
 * Obtiene el peso de un producto (usa weightGrams si está definido, o el peso oficial de su subcategoría/categoría)
 */
export function getProductWeightGrams(product: {
  category?: string;
  subCategory?: string;
  subcategory?: string;
  weightGrams?: number;
}): number {
  if (typeof product.weightGrams === 'number' && product.weightGrams > 0) {
    return product.weightGrams;
  }
  const sub = product.subCategory || product.subcategory;
  return getDefaultWeightByCategory(product.category || '', sub);
}

/**
 * Normaliza una categoría al esquema oficial actual:
 * ('Ropa Superior', 'Ropa Inferior', 'Calzado', 'Accesorios', 'Carteras y Accesorios', 'Mistery box', 'Otros')
 */
export function normalizeCategoryName(rawCategory: string, rawSection?: string): string {
  if (!rawCategory) return 'Ropa Superior';
  const clean = rawCategory.trim();
  const exactOfficial = OFFICIAL_CATEGORIES.find(
    (c) => c.name.toLowerCase() === clean.toLowerCase()
  );
  if (exactOfficial) return exactOfficial.name;

  const lower = clean.toLowerCase();
  const isFemale = (rawSection || '').trim().toLowerCase() === 'mujer';

  if (lower.includes('mistery') || lower.includes('mystery')) return 'Mistery box';
  if (
    lower.includes('calzado') ||
    lower.includes('zapatilla') ||
    lower.includes('zapato') ||
    lower.includes('botin') ||
    lower.includes('bota') ||
    lower.includes('sandalia') ||
    lower.includes('pantufla')
  ) {
    return 'Calzado';
  }
  if (
    lower.includes('ropa superior') ||
    lower.includes('polera') ||
    lower.includes('blusa') ||
    lower.includes('camisa') ||
    lower.includes('chaqueta') ||
    lower.includes('parka') ||
    lower.includes('bomber') ||
    lower.includes('hoodie') ||
    lower.includes('hoddie') ||
    lower.includes('poleron') ||
    lower.includes('top') ||
    lower.includes('corset')
  ) {
    return 'Ropa Superior';
  }
  if (
    lower.includes('ropa inferior') ||
    lower.includes('pantalon') ||
    lower.includes('pantalón') ||
    lower.includes('cargo') ||
    lower.includes('jeans') ||
    lower.includes('short') ||
    lower.includes('jort') ||
    lower.includes('bermuda')
  ) {
    return 'Ropa Inferior';
  }
  if (lower.includes('cartera') || lower.includes('bolso') || lower.includes('mochila') || lower.includes('banano')) {
    return 'Carteras y Accesorios';
  }
  if (
    lower.includes('accesorio') ||
    lower.includes('jockey') ||
    lower.includes('gorra') ||
    lower.includes('gorro') ||
    lower.includes('beanie') ||
    lower.includes('billetera') ||
    lower.includes('tarjetero') ||
    lower.includes('monedero') ||
    lower.includes('collar') ||
    lower.includes('cadena')
  ) {
    return isFemale ? 'Carteras y Accesorios' : 'Accesorios';
  }
  if (lower.includes('otro') || lower.includes('coleccionable') || lower.includes('regalo') || lower.includes('general')) {
    return 'Otros';
  }

  return 'Ropa Superior';
}

/**
 * Normaliza una subcategoría para que coincida con las subcategorías oficiales de su categoría
 */
export function normalizeSubcategoryName(
  rawSubcategory: string,
  rawCategory?: string,
  rawSection?: string
): string {
  const officialCategory = normalizeCategoryName(rawCategory || rawSubcategory, rawSection);
  const validSubs = getSubcategoriesByCategory(officialCategory, rawSection);
  const cleanSub = (rawSubcategory || '').trim();
  const cleanCat = (rawCategory || '').trim();

  // 1. Verificar si rawSubcategory ya es una subcategoría oficial válida
  const directMatch = validSubs.find((s) => s.toLowerCase() === cleanSub.toLowerCase());
  if (directMatch) return directMatch;

  // 2. Verificar si rawCategory era en realidad el nombre de la subcategoría (ej. 'Poleras', 'Hoodies', 'Zapatillas')
  const catAsSubMatch = validSubs.find((s) => s.toLowerCase() === cleanCat.toLowerCase());
  if (catAsSubMatch) return catAsSubMatch;

  const combined = `${cleanCat} ${cleanSub}`.toLowerCase();

  if (officialCategory === 'Ropa Superior') {
    if (combined.includes('doble zip') || combined.includes('two-way')) return 'Hoodies doble zip';
    if (combined.includes('hoodie') || combined.includes('hoddie') || combined.includes('poleron')) return 'Hoodies';
    if (combined.includes('chaqueta') || combined.includes('bomber') || combined.includes('parka') || combined.includes('biker') || combined.includes('windbreaker')) return 'Chaquetas';
    if (combined.includes('camisa')) return 'Camisas';
    if (combined.includes('blusa') && validSubs.includes('Blusas')) return 'Blusas';
    return 'Poleras';
  }

  if (officialCategory === 'Ropa Inferior') {
    if (combined.includes('short') || combined.includes('jort') || combined.includes('bermuda')) return 'Shorts';
    return 'Pantalones';
  }

  if (officialCategory === 'Calzado') {
    if (combined.includes('tacón') || combined.includes('tacon')) return 'Zapatos con tacón';
    if (combined.includes('plano')) return 'Zapatos planos';
    if (combined.includes('bota') || combined.includes('botín') || combined.includes('botin')) return 'Botas y botines';
    if (combined.includes('pantufla')) return 'Pantuflas';
    if (combined.includes('fiesta')) return 'Zapatos de fiesta';
    if (combined.includes('sandalia') || combined.includes('chala')) return 'Sandalias y chalas';
    return 'Zapatillas';
  }

  if (officialCategory === 'Carteras y Accesorios') {
    if (combined.includes('billetera') || combined.includes('tarjetero') || combined.includes('monedero')) return 'Billeteras';
    if (combined.includes('jockey') || combined.includes('gorra') || combined.includes('beanie')) return 'Jockey';
    if (combined.includes('cartera') || combined.includes('bolso') || combined.includes('baguette') || combined.includes('crossbody')) return 'Carteras';
    return 'Otros Accesorios';
  }

  if (officialCategory === 'Accesorios') {
    if (combined.includes('jockey') || combined.includes('gorra') || combined.includes('beanie') || combined.includes('snapback') || combined.includes('trucker')) return 'Jockey';
    if (combined.includes('billetera') || combined.includes('tarjetero') || combined.includes('monedero')) return 'Billeteras';
    return 'Otros Accesorios';
  }

  if (officialCategory === 'Mistery box') {
    if (combined.includes('mujer')) return 'Mistery Box Mujer';
    if (combined.includes('hombre')) return 'Mistery Box Hombre';
    if (combined.includes('limitada')) return 'Edición Limitada';
    return 'Mistery Box Especial';
  }

  return validSubs[0] || 'General';
}

/**
 * 2. DICCIONARIO COMPLETO DE REGIONES Y COMUNAS DE CHILE
 * Valores base de referencia para 3 kg despachando desde la V Región (Viña del Mar / Quilpué / Valparaíso).
 */
export const BASE_3KG_RATES_FROM_V_REGION: Record<string, Record<string, number>> = {
  "Región de Arica y Parinacota": {
    "Arica": 8800, "Camarones": 9400, "Putre": 10000, "General Lagos": 10500
  },
  "Región de Tarapacá": {
    "Iquique": 8500, "Alto Hospicio": 8700, "Pozo Almonte": 9200, "Pica": 9400,
    "Huara": 9600, "Camiña": 10000, "Colchane": 10400
  },
  "Región de Antofagasta": {
    "Antofagasta": 8100, "Calama": 8500, "Tocopilla": 8800, "Mejillones": 9100,
    "Taltal": 9300, "María Elena": 9500, "Sierra Gorda": 9700, "San Pedro de Atacama": 9900, "Ollagüe": 10500
  },
  "Región de Atacama": {
    "Copiapó": 7500, "Caldera": 7700, "Tierra Amarilla": 7900, "Chañaral": 8100,
    "Diego de Almagro": 8300, "Vallenar": 8500, "Huasco": 8700, "Freirina": 8900, "Alto del Carmen": 9100
  },
  "Región de Coquimbo": {
    "La Serena": 7000, "Coquimbo": 7200, "Ovalle": 7400, "Illapel": 7600, "Los Vilos": 7800,
    "Salamanca": 8000, "Vicuña": 8200, "Andacollo": 8400, "La Higuera": 8600, "Paiguano": 8800,
    "Río Hurtado": 9000, "Punitaqui": 9200, "Monte Patria": 9400, "Combarbalá": 9600, "Canela": 9800
  },
  "Región de Valparaíso": {
    "Valparaíso": 4500, "Viña del Mar": 4500, "Quilpué": 4500, "Villa Alemana": 4500, "Concón": 4700,
    "Quillota": 4900, "La Calera": 5100, "Limache": 5300, "Olmué": 5500, "San Antonio": 5700,
    "Cartagena": 5900, "El Quisco": 6100, "El Tabo": 6300, "Algarrobo": 6500, "Santo Domingo": 6700,
    "Quintero": 6900, "Puchuncaví": 7100, "Zapallar": 7300, "Papudo": 7500, "Petorca": 7700,
    "La Ligua": 7900, "Hijuelas": 8100, "Nogales": 8300, "San Felipe": 8500, "Los Andes": 8700,
    "Llaillay": 8900, "Calle Larga": 9100, "Putaendo": 9300, "Santa María": 9500,
    "Isla de Pascua": 33000, "Archipiélago Juan Fernández": 27000, "Isla Robinson Crusoe": 26000,
    "Isla Alejandro Selkirk": 27000, "Isla Santa Clara": 27000
  },
  "Región Metropolitana de Santiago": {
    "Santiago": 5800, "Puente Alto": 6000, "Maipú": 5900, "La Florida": 6100, "Las Condes": 6300,
    "San Bernardo": 6200, "Peñalolén": 6300, "Pudahuel": 6400, "La Pintana": 6500, "Recoleta": 6600,
    "Quilicura": 6700, "Lo Prado": 6800, "Lo Barnechea": 6900, "La Granja": 7000, "El Bosque": 7100,
    "Independencia": 7200, "Providencia": 7300, "Ñuñoa": 7400, "Macul": 7500, "San Miguel": 7600,
    "Cerrillos": 7700, "Estación Central": 7800, "Pedro Aguirre Cerda": 7900, "San Joaquín": 8000,
    "La Cisterna": 8100, "San Ramón": 8200, "Lo Espejo": 8300, "Huechuraba": 8400, "Renca": 8500,
    "Conchalí": 8600, "Cerro Navia": 8700, "Quinta Normal": 8800, "Padre Hurtado": 9000,
    "Melipilla": 9100, "Buin": 9200, "Calera de Tango": 9300, "Colina": 9400, "Curacaví": 9500,
    "Lampa": 9600, "Paine": 9700, "Pirque": 9800, "San José de Maipo": 9900, "Talagante": 10000,
    "Tiltil": 10100, "Isla de Maipo": 10200, "El Monte": 10300
  },
  "Región de O'Higgins": {
    "Rancagua": 6900, "Machalí": 7000, "San Fernando": 7300, "Santa Cruz": 7500, "Rengo": 7400,
    "San Vicente de Tagua Tagua": 7600, "Pichilemu": 8100, "Navidad": 8300, "Litueche": 8400,
    "Paredones": 8600, "Marchigüe": 8500, "La Estrella": 8700, "Pichidegua": 7900, "Peumo": 8000,
    "Coltauco": 7800, "Doñihue": 7600, "Coinco": 7700, "Requínoa": 7400, "Olivar": 7300,
    "Quinta de Tilcoco": 7900, "Malloa": 8000, "Mostazal": 7100, "Graneros": 7200, "Las Cabras": 8100,
    "Chimbarongo": 8500, "Placilla": 8600, "Nancagua": 8800, "Palmilla": 8900, "Lolol": 9000,
    "Peralillo": 9100, "Chépica": 9200
  },
  "Región del Maule": {
    "Talca": 8300, "Curicó": 8500, "Linares": 8700, "Cauquenes": 8900, "Constitución": 8800,
    "Molina": 8600, "San Clemente": 8400, "San Javier": 8500, "Parral": 8700, "Longaví": 8900,
    "Villa Alegre": 8600, "Yerbas Buenas": 8800, "Retiro": 8900, "Colbún": 8700, "Teno": 8500,
    "Hualañé": 8600, "Licantén": 8800, "Rauco": 8700, "Romeral": 8600, "Sagrada Familia": 8700,
    "Vichuquén": 9000, "Curepto": 9100, "Pelarco": 8500, "Pencahue": 8400, "Empedrado": 9200,
    "Río Claro": 8300, "Maule": 8200, "San Rafael": 8300, "Chanco": 9300
  },
  "Región de Ñuble": {
    "Chillán": 9400, "Chillán Viejo": 9500, "San Carlos": 9700, "Coihueco": 9900, "Bulnes": 9600,
    "Quillón": 9500, "San Ignacio": 9800, "El Carmen": 9900, "Pinto": 10000, "Pemuco": 9700,
    "Yungay": 10000, "Quirihue": 10100, "Cobquecura": 10200, "Ninhue": 10300, "San Nicolás": 9700,
    "Portezuelo": 9800, "Ránquil": 9900, "Treguaco": 10000, "Ñiquén": 10100
  },
  "Región del Biobío": {
    "Concepción": 10100, "Talcahuano": 10200, "San Pedro de la Paz": 10300, "Chiguayante": 10400,
    "Hualpén": 10500, "Coronel": 10600, "Lota": 10700, "Tomé": 10800, "Penco": 10900, "Hualqui": 11000,
    "Santa Juana": 11100, "Tucapel": 11200, "Lebu": 11300, "Cañete": 11400, "Los Ángeles": 11500,
    "Mulchén": 11600, "Nacimiento": 11700, "Santa Bárbara": 11800, "Laja": 11900, "San Rosendo": 12000,
    "Yumbel": 12100, "Cabrero": 12200, "Los Álamos": 12300, "Tirúa": 12400, "Curanilahue": 12500,
    "Arauco": 12600, "Antuco": 12700, "Quilleco": 12800, "Quilaco": 12900, "Negrete": 13000,
    "Alto Biobío": 13100, "Isla Mocha": 13800
  },
  "Región de La Araucanía": {
    "Temuco": 10800, "Padre Las Casas": 10900, "Angol": 11000, "Collipulli": 11100, "Victoria": 11200,
    "Lonquimay": 11400, "Melipeuco": 11500, "Curacautín": 11600, "Vilcún": 11000, "Galvarino": 11100,
    "Nueva Imperial": 11000, "Carahue": 11100, "Saavedra": 11200, "Teodoro Schmidt": 11300, "Toltén": 11400,
    "Freire": 10900, "Pitrufquén": 11000, "Gorbea": 11100, "Loncoche": 11200, "Villarrica": 11400,
    "Pucón": 11500, "Cunco": 11600, "Curarrehue": 11800, "Ercilla": 11100, "Lumaco": 11200,
    "Los Sauces": 11300, "Purén": 11400, "Traiguén": 11500, "Renaico": 11000, "Cholchol": 11100, "Perquenco": 11000
  },
  "Región de Los Ríos": {
    "Valdivia": 12200, "Panguipulli": 12400, "La Unión": 12500, "Río Bueno": 12600, "Paillaco": 12500,
    "Lanco": 12400, "Futrono": 12700, "Máfil": 12400, "Corral": 12900, "Mariquina": 12300,
    "Los Lagos": 12500, "Lago Ranco": 12800
  },
  "Región de Los Lagos": {
    "Puerto Montt": 12900, "Puerto Varas": 13100, "Osorno": 13200, "Purranque": 13300, "Frutillar": 13400,
    "Llanquihue": 13500, "Calbuco": 13600, "Maullín": 13700, "Fresia": 13800, "Los Muermos": 13900,
    "Ancud": 14100, "Castro": 14500, "Quellón": 15000, "Chonchi": 14700, "Dalcahue": 14600,
    "Quemchi": 14400, "Quinchao": 14800, "Curaco de Vélez": 14900, "Puqueldón": 15000, "Queilen": 15200,
    "Hualaihué": 15400, "Chaitén": 15600, "Futaleufú": 16000, "Palena": 16200
  },
  "Región de Aysén del General Carlos Ibáñez del Campo": {
    "Coyhaique": 17500, "Puerto Aysén": 17700, "Cisnes": 17900, "Chile Chico": 18500, "Lago Verde": 18300,
    "Coihaique Alto": 18000, "Río Ibáñez": 18400, "Tortel": 19000, "Guaitecas": 19500, "O'Higgins": 20500
  },
  "Región de Magallanes y de la Antártica Chilena": {
    "Punta Arenas": 21000, "Puerto Natales": 21500, "Porvenir": 22000, "Cabo de Hornos": 23000,
    "Puerto Williams": 25000, "Laguna Blanca": 21200, "Río Verde": 21400, "Primavera": 21800,
    "Timaukel": 22500, "San Gregorio": 21700, "Antártica Chilena": 28000,
    "Isla Grande de Tierra del Fuego": 23000, "Isla Wellington": 24000, "Isla Navarino": 25000,
    "Isla Dawson": 24500, "Isla Hoste": 26000, "Isla Riesco": 25500, "Isla Madre de Dios": 27000, "Isla Guarello": 27500
  }
};

export function getRegionsList(): string[] {
  return Object.keys(BASE_3KG_RATES_FROM_V_REGION);
}

export function getCommunesByRegion(regionName: string): string[] {
  return Object.keys(BASE_3KG_RATES_FROM_V_REGION[regionName] || {});
}

/**
 * Encuentra automáticamente la región chilena a la que pertenece una comuna dada
 */
export function findRegionByCommune(communeName: string): string {
  if (!communeName) return 'Región de Valparaíso';
  const clean = communeName.trim().toLowerCase();
  for (const [region, communes] of Object.entries(BASE_3KG_RATES_FROM_V_REGION)) {
    for (const c of Object.keys(communes)) {
      if (c.toLowerCase() === clean) {
        return region;
      }
    }
  }
  return 'Región de Valparaíso';
}

export const CHILE_REGIONS = Object.keys(BASE_3KG_RATES_FROM_V_REGION);

// 3. COBERTURA Y TRAMOS DE PESO
const PAKET_URBAN_V_REGION = [
  'Viña del Mar',
  'Valparaíso',
  'Quilpué',
  'Villa Alemana',
  'Concón'
];

const PAKET_EXTENDED_V_REGION = [
  'Quillota',
  'La Calera',
  'Limache',
  'Olmué'
];

export interface WeightTierInfo {
  tierNumber: 1 | 2 | 3 | 4 | 5;
  label: string;
  minGrams: number;
  maxGrams: number;
  blueExpressFactor: number;
  starkenFactor: number;
  paketUrbanRate: number;
  paketExtendedRate: number;
  paketRmRate: number;
}

/**
 * Obtiene el tramo de peso oficial según gramos (Máximo 20 KG)
 */
export function getWeightTierInfo(totalGrams: number): WeightTierInfo | null {
  const g = Math.max(1, totalGrams);
  if (g > 20000) return null; // Excede 20 KG

  if (g <= 1000) {
    return {
      tierNumber: 1,
      label: '0 - 1 KG',
      minGrams: 0,
      maxGrams: 1000,
      blueExpressFactor: 0.70,
      starkenFactor: 0.70,
      paketUrbanRate: 2990,
      paketExtendedRate: 3490,
      paketRmRate: 3490
    };
  }
  if (g <= 3000) {
    return {
      tierNumber: 2,
      label: '1 - 3 KG',
      minGrams: 1001,
      maxGrams: 3000,
      blueExpressFactor: 0.85,
      starkenFactor: 0.90,
      paketUrbanRate: 3490,
      paketExtendedRate: 3990,
      paketRmRate: 3990
    };
  }
  if (g <= 6000) {
    return {
      tierNumber: 3,
      label: '3 - 6 KG',
      minGrams: 3001,
      maxGrams: 6000,
      blueExpressFactor: 1.10,
      starkenFactor: 1.10,
      paketUrbanRate: 4490,
      paketExtendedRate: 4990,
      paketRmRate: 4990
    };
  }
  if (g <= 12000) {
    return {
      tierNumber: 4,
      label: '6 - 12 KG',
      minGrams: 6001,
      maxGrams: 12000,
      blueExpressFactor: 1.40,
      starkenFactor: 1.40,
      paketUrbanRate: 5490,
      paketExtendedRate: 5990,
      paketRmRate: 5990
    };
  }
  // 12.001 a 20.000 g
  return {
    tierNumber: 5,
    label: '12 - 20 KG',
    minGrams: 12001,
    maxGrams: 20000,
    blueExpressFactor: 1.75,
    starkenFactor: 1.75,
    paketUrbanRate: 6490,
    paketExtendedRate: 6990,
    paketRmRate: 6990
  };
}

export interface ShippingQuoteOption {
  courierId: ShippingCourierId;
  courierName: string;
  serviceLabel: string;
  weightTierLabel: string;
  originBranch: OriginBranchId;
  destinationRegion: string;
  destinationCommune: string;
  totalWeightGrams: number;
  priceClp: number;
  isFreeShipping: boolean;
  estimatedDays: string;
  available: boolean;
  unavailableReason?: string;
}

/**
 * 4. MOTOR DE COTIZACIÓN MULTICOURIER
 * Calcula la tarifa de envío para Starken, Blue Express y Paket (sin envío gratis automático por monto)
 */
export function calculateCourierQuotes(params: {
  totalWeightGrams: number;
  destinationRegion: string;
  destinationCommune: string;
  originBranch?: OriginBranchId;
  cartSubtotalClp?: number;
}): ShippingQuoteOption[] {
  const {
    totalWeightGrams,
    destinationRegion,
    destinationCommune,
    originBranch = 'vina_del_mar'
  } = params;

  const tierInfo = getWeightTierInfo(totalWeightGrams);
  const exceeds20Kg = totalWeightGrams > 20000 || tierInfo === null;

  const regionMap =
    BASE_3KG_RATES_FROM_V_REGION[destinationRegion] ||
    BASE_3KG_RATES_FROM_V_REGION['Región de Valparaíso'];
  const raw3KgRef = regionMap[destinationCommune] ?? 6500;

  // Localidad origen para despacho directo
  const isSameOriginCity =
    (originBranch === 'vina_del_mar' && destinationCommune === 'Viña del Mar') ||
    (originBranch === 'valparaiso' && destinationCommune === 'Valparaíso') ||
    (originBranch === 'quilpue' && destinationCommune === 'Quilpué');

  const adjusted3KgRef = isSameOriginCity ? 3900 : raw3KgRef;
  const isInsular = adjusted3KgRef >= 20000;

  // Cobertura de Paket: únicamente comunas urbanas/extendidas de la V Región y la RM
  const isPaketUrbanV =
    destinationRegion === 'Región de Valparaíso' &&
    PAKET_URBAN_V_REGION.includes(destinationCommune);
  const isPaketExtendedV =
    destinationRegion === 'Región de Valparaíso' &&
    PAKET_EXTENDED_V_REGION.includes(destinationCommune);
  const isPaketRM = destinationRegion === 'Región Metropolitana de Santiago';
  const isPaketInZone = isPaketUrbanV || isPaketExtendedV || isPaketRM;

  const weightKgDisplay = (totalWeightGrams / 1000).toFixed(2);
  const tierLabel = tierInfo ? tierInfo.label : 'Excede 20 KG';

  // --- 1. BLUE EXPRESS ---
  let bluePrice = 0;
  let blueAvailable = !exceeds20Kg;
  let blueReason: string | undefined = undefined;

  if (exceeds20Kg) {
    blueReason = 'No disponible por exceder el límite máximo de 20 KG';
  } else if (tierInfo) {
    bluePrice = Math.round((adjusted3KgRef * tierInfo.blueExpressFactor) / 10) * 10;
  }

  // --- 2. STARKEN ---
  let starkenPrice = 0;
  let starkenAvailable = !exceeds20Kg && !isInsular;
  let starkenReason: string | undefined = undefined;

  if (exceeds20Kg) {
    starkenReason = 'No disponible por exceder el límite máximo de 20 KG';
  } else if (isInsular) {
    starkenReason = 'Zona insular sin cobertura terrestre Starken';
  } else if (tierInfo) {
    starkenPrice = Math.round((adjusted3KgRef * tierInfo.starkenFactor) / 10) * 10;
  }

  // --- 3. PAKET EXPRESS ---
  let paketPrice = 0;
  let paketAvailable = false;
  let paketReason: string | undefined = undefined;

  if (exceeds20Kg) {
    paketAvailable = false;
    paketReason = 'No disponible por exceder el límite máximo de 20 KG';
  } else if (!isPaketInZone) {
    paketAvailable = false;
    paketReason = 'No disponible en esta zona (Solo V Región y RM)';
  } else {
    paketAvailable = true;
    if (tierInfo) {
      if (isPaketUrbanV) {
        paketPrice = isSameOriginCity && tierInfo.tierNumber === 1 ? 2990 : tierInfo.paketUrbanRate;
      } else if (isPaketExtendedV) {
        paketPrice = tierInfo.paketExtendedRate;
      } else {
        paketPrice = tierInfo.paketRmRate;
      }
    }
  }

  return [
    {
      courierId: 'starken',
      courierName: 'Starken',
      serviceLabel: `Domicilio (${destinationCommune})`,
      weightTierLabel: `${tierLabel} • ${weightKgDisplay} kg`,
      originBranch,
      destinationRegion,
      destinationCommune,
      totalWeightGrams,
      priceClp: starkenPrice,
      isFreeShipping: false,
      estimatedDays:
        destinationRegion === 'Región de Valparaíso' ? '24 a 48 hrs hábiles' : '2 a 5 días hábiles',
      available: starkenAvailable,
      unavailableReason: starkenReason
    },
    {
      courierId: 'blue_express',
      courierName: 'Blue Express',
      serviceLabel: `Prioritario Domicilio (${destinationCommune})`,
      weightTierLabel: `${tierLabel} • ${weightKgDisplay} kg`,
      originBranch,
      destinationRegion,
      destinationCommune,
      totalWeightGrams,
      priceClp: bluePrice,
      isFreeShipping: false,
      estimatedDays:
        destinationRegion === 'Región de Valparaíso' ? '24 hrs hábiles' : '2 a 4 días hábiles',
      available: blueAvailable,
      unavailableReason: blueReason
    },
    {
      courierId: 'paket',
      courierName: 'Paket Express',
      serviceLabel: paketAvailable
        ? `Same-Day / Next-Day (${destinationCommune})`
        : `Sin cobertura última milla en ${destinationCommune}`,
      weightTierLabel: `${tierLabel} • ${weightKgDisplay} kg`,
      originBranch,
      destinationRegion,
      destinationCommune,
      totalWeightGrams,
      priceClp: paketPrice,
      isFreeShipping: false,
      estimatedDays: isPaketUrbanV ? 'Entrega en el día (Same-Day)' : '24 hrs hábiles',
      available: paketAvailable,
      unavailableReason: paketReason
    }
  ];
}

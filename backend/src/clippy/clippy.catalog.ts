/**
 * Buscador de productos públicos de Clippy.
 *
 * No usa la IA para decidir la existencia, tipo, color, precio ni stock.
 * Las coincidencias por prenda/color son filtros OBLIGATORIOS, no sugerencias.
 * Separa la lógica pura del acceso a MongoDB para poder probarla sin conexión.
 */

export interface ClippyProductRequest {
  type?: ClothingType;
  colors: ClothingColor[];
  section?: 'Hombre' | 'Mujer';
  label: string;
  exact: boolean;
}

export type ClothingType =
  | 'camisa' | 'polera' | 'pantalon' | 'short' | 'falda' | 'vestido'
  | 'chaqueta' | 'poleron' | 'jockey' | 'zapatilla' | 'zapato'
  | 'cartera' | 'mochila' | 'blusa' | 'billetera' | 'accesorio';

export type ClothingColor =
  | 'blanco' | 'negro' | 'azul' | 'celeste' | 'rosa' | 'rojo'
  | 'verde' | 'amarillo' | 'gris' | 'beige' | 'morado' | 'naranja' | 'cafe';

// Solo leemos los campos públicos que el backend selecciona mediante PUBLIC_FIELDS.
export interface CatalogDocument {
  _id?: unknown;
  title?: string;
  name?: string;
  section?: string;
  category?: string;
  subcategory?: string;
  subCategory?: string;
  tags?: string[];
  images?: string[];
  price?: number;
  salePrice?: number;
  stock?: number;
  totalStock?: number;
  sizeBreakdown?: Array<{ size?: string; quantity?: number; stock?: number }>;
  isHidden?: boolean;
}

export interface ClippyPublicProduct {
  id: string;
  title: string;
  category: string;
  section: string;
  imageUrl: string;
  price: number;
  sizes: string[];
  url: string;
}

export const normalizeCatalogText = (value: string): string => value
  .toLocaleLowerCase('es-CL')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\s+/g, ' ').trim();

// Las palabras tienen bordes definidos: "camisa" no coincide con "camiseta".
// El orden importa: primero shorts y camisetas, luego pantalones y camisas.
const TYPE_RULES: ReadonlyArray<{ type: ClothingType; pattern: RegExp }> = [
  { type: 'short', pattern: /\b(?:shorts?|bermudas?|pantalones? cortos?)\b/ },
  { type: 'polera', pattern: /\b(?:poleras?|camisetas?|remeras?|t\s?-\s?shirts?)\b/ },
  { type: 'camisa', pattern: /\bcamisas?\b/ },
  { type: 'pantalon', pattern: /\b(?:pantalon(?:es)?|jeans?|denim|joggers?)\b/ },
  { type: 'jockey', pattern: /\b(?:jockeys?|gorras?|gorros?|caps?)\b/ },
  { type: 'poleron', pattern: /\b(?:poleron(?:es)?|hoodies?|sudaderas?)\b/ },
  { type: 'chaqueta', pattern: /\b(?:chaquetas?|casacas?|blazers?)\b/ },
  { type: 'vestido', pattern: /\bvestidos?\b/ },
  { type: 'falda', pattern: /\bfaldas?\b/ },
  { type: 'blusa', pattern: /\bblusas?\b/ },
  { type: 'mochila', pattern: /\bmochilas?\b/ },
  { type: 'cartera', pattern: /\b(?:carteras?|bolsos?|crossbody|bananos?)\b/ },
  { type: 'zapatilla', pattern: /\bzapatillas?\b/ },
  { type: 'zapato', pattern: /\b(?:zapatos?|botines?|botas?)\b/ },
  { type: 'billetera', pattern: /\bbilleteras?\b/ },
  { type: 'accesorio', pattern: /\baccesorios?\b/ },
];

const COLORS: ReadonlyArray<{ color: ClothingColor; pattern: RegExp }> = [
  { color: 'blanco', pattern: /\b(?:blanc[oa]s?|white|marfil)\b/ },
  { color: 'negro', pattern: /\b(?:negr[oa]s?|black)\b/ },
  { color: 'celeste', pattern: /\bcelestes?\b/ },
  { color: 'azul', pattern: /\b(?:azules?|azul)\b/ },
  { color: 'rosa', pattern: /\b(?:rosas?|rosad[oa]s?|pink)\b/ },
  { color: 'rojo', pattern: /\b(?:roj[oa]s?|red)\b/ },
  { color: 'verde', pattern: /\b(?:verdes?|green)\b/ },
  { color: 'amarillo', pattern: /\b(?:amarill[oa]s?|yellow)\b/ },
  { color: 'gris', pattern: /\b(?:gris|grises|grey|gray)\b/ },
  { color: 'beige', pattern: /\b(?:beiges?|crema)\b/ },
  { color: 'morado', pattern: /\b(?:morad[oa]s?|lila|violeta)\b/ },
  { color: 'naranja', pattern: /\b(?:naranjas?|orange)\b/ },
  { color: 'cafe', pattern: /\b(?:cafes?|marrones?|brown)\b/ },
];

export const clothingTypeIn = (text: string): ClothingType | undefined => {
  const normalized = normalizeCatalogText(text);
  return TYPE_RULES.find((rule) => rule.pattern.test(normalized))?.type;
};

export const colorsIn = (text: string): ClothingColor[] => {
  const normalized = normalizeCatalogText(text);
  return COLORS.filter((rule) => rule.pattern.test(normalized)).map((rule) => rule.color);
};

const sectionIn = (text: string): ClippyProductRequest['section'] => {
  const normalized = normalizeCatalogText(text);
  if (/\b(?:hombre|hombres|masculin[oa]s?)\b/.test(normalized)) return 'Hombre';
  if (/\b(?:mujer|mujeres|femenin[oa]s?)\b/.test(normalized)) return 'Mujer';
  return undefined;
};

/** Detecta búsquedas concretas sin usar el historial como fuente de filtros. */
export const parseProductRequest = (
  question: string,
  lastUserQuestion?: string,
): ClippyProductRequest | null => {
  const current = normalizeCatalogText(question).replace(/^[¿?¡!\s]+|[¿?¡!\s]+$/g, '');
  let type = clothingTypeIn(current);
  const colors = colorsIn(current);
  const section = sectionIn(current);
  const buyingWords = /\b(?:tienes?|tienen|vendes?|venden|hay|busco|buscar|buscando|necesito|quiero|ofrecen|muestrame|muestra|mostrar|disponibles?|productos?|prendas?|catalogo|ropa de)\b/;
  // Consultar un tipo de prenda constituye una búsqueda, incluso sin "tienen".
  const direct = Boolean(type) || (colors.length > 0 && buyingWords.test(current));
  const shortFollowup = /^(?:y\s+)?(?:en|de|color|tono)?\s*(?:blanc[oa]s?|negr[oa]s?|azul(?:es)?|celestes?|rosad[oa]s?|rosas?|roj[oa]s?|verdes?|gris(?:es)?|beiges?|morad[oa]s?|lila|amarill[oa]s?|naranjas?|cafes?)\s*[?.!]*$/.test(current);
  const followup = !type && colors.length > 0 && (shortFollowup || /^(?:y\s+)?(?:en|de|color)\s+/.test(current));
  if (!direct && !followup) return null;
  // "¿Y en blanco?" conserva SOLO el tipo de la pregunta anterior inmediata.
  // No hereda una cita, emoción, outfit ni preferencias de otra conversación.
  if (followup && lastUserQuestion) type = clothingTypeIn(lastUserQuestion);
  if (!type && !direct) return null;
  // Si el usuario pide "pantalones cortos", el tipo solicitado es short.
  const normalizedType = type === 'pantalon' && /\b(?:cortos?|bermuda)\b/.test(current) ? 'short' : type;
  const humanType: Record<ClothingType, string> = {
    camisa: 'camisas', polera: 'poleras', pantalon: 'pantalones', short: 'shorts o bermudas',
    falda: 'faldas', vestido: 'vestidos', chaqueta: 'chaquetas', poleron: 'polerones',
    jockey: 'jockeys o gorras', zapatilla: 'zapatillas', zapato: 'zapatos',
    cartera: 'carteras', mochila: 'mochilas', blusa: 'blusas', billetera: 'billeteras',
    accesorio: 'accesorios',
  };
  const label = [normalizedType ? humanType[normalizedType] : 'prendas',
    colors.length ? `de color ${colors.join(' o ')}` : '', section ? `para ${section.toLowerCase()}` : '']
    .filter(Boolean).join(' ');
  return { type: normalizedType, colors, section, label, exact: true };
};

/** Clasifica el producto por el nombre real, antes que por subcategorías inconsistentes. */
const actualType = (product: CatalogDocument): ClothingType | undefined => {
  const ownTitle = String(product.title || product.name || '');
  return clothingTypeIn(ownTitle) ?? clothingTypeIn(`${product.subcategory || ''} ${product.subCategory || ''} ${product.category || ''}`);
};

/** Color dominante = texto antes del detalle "con ..." (ej. camiseta blanca con iPod rosa). */
const productColors = (product: CatalogDocument): ClothingColor[] => {
  const title = String(product.title || product.name || '');
  const primary = title.split(/\b(?:con|estampado|grafica|grafico|logo|print)\b/i)[0];
  const found = colorsIn(primary);
  // Si el título no identifica color, podemos usar etiquetas de color explícitas.
  if (found.length > 0) return found;
  const tags = Array.isArray(product.tags) ? product.tags : [];
  return colorsIn(tags.filter((tag) => /^\s*(?:color\s*[:=-]|tono\s*[:=-])/i.test(tag)).join(' '));
};

const availableSizes = (product: CatalogDocument): string[] => Array.isArray(product.sizeBreakdown)
  ? product.sizeBreakdown.filter((s) => Number(s.quantity ?? s.stock ?? 0) > 0)
    .map((s) => String(s.size || '').slice(0, 35)).filter(Boolean)
  : [];

export const isPublicAvailable = (product: CatalogDocument): boolean =>
  product.isHidden !== true && (
    Number(product.totalStock ?? 0) > 0 || Number(product.stock ?? 0) > 0 || availableSizes(product).length > 0
  );

const truncate = (value: unknown, max: number): string => String(value ?? '').trim().slice(0, max);
const publicProduct = (p: CatalogDocument): ClippyPublicProduct => {
  const id = String(p._id || '');
  return {
    id, title: truncate(p.title || p.name, 110), category: truncate(p.category, 65),
    section: truncate(p.section, 65), price: Number(p.salePrice) > 0 ? Number(p.salePrice) : Number(p.price) || 0,
    imageUrl: typeof p.images?.[0] === 'string' && /^https:\/\//i.test(p.images[0]) ? p.images[0] : '',
    sizes: availableSizes(p).slice(0, 8), url: `/#/product/${id}`,
  };
};

/** Filtro estricto AND por categoría, (OR entre colores indicados), sección y stock. */
export const matchCatalogProducts = (products: CatalogDocument[], request: ClippyProductRequest): ClippyPublicProduct[] => {
  return products.filter((p) => {
    if (!isPublicAvailable(p)) return false;
    if (request.type && actualType(p) !== request.type) {
      // "Pantalones" comprende bermudas tituladas "Pantalón Bermuda";
      // "shorts" solo corresponde a prendas cortas.
      if (!(request.type === 'pantalon' && actualType(p) === 'short'
        && /\bpantalon(?:es)?\b/.test(normalizeCatalogText(String(p.title || p.name || ''))))) return false;
    }
    if (request.section && normalizeCatalogText(String(p.section || '')) !== normalizeCatalogText(request.section)) return false;
    const knownColors = productColors(p);
    if (request.colors.length && !request.colors.some((color) => knownColors.includes(color))) return false;
    return true;
  }).slice(0, 4).map(publicProduct);
};

/** Respuestas basadas únicamente en el resultado verificado de la BD. */
export const buildCatalogReply = (request: ClippyProductRequest, matches: ClippyPublicProduct[]): string => {
  if (matches.length) {
    return `¡Sí, vamos a lo que buscas! 📎 Revisé ${request.label} y te dejo ${matches.length} opción(es) que coinciden con tu pedido. Puedes abrir cada ficha para ver tallas, precios y disponibilidad actual. ✨`;
  }
  return `¡Ya entendí lo que buscas! 📎 ${request.label.charAt(0).toUpperCase() + request.label.slice(1)}. No vi una coincidencia exacta entre las prendas disponibles que revisé; prefiero decírtelo antes que mostrarte algo de otro tipo o color. Podemos probar con otro tono o consultar a la tienda. 💛`;
};

/**
 * Una asesoría de outfit puede mostrar prendas de varias clases, pero respeta
 * la paleta que pidió el visitante. No se usa en búsquedas por prenda concreta.
 */
export const matchStyleProducts = (products: CatalogDocument[], searchContext: string): ClippyPublicProduct[] => {
  const context = normalizeCatalogText(searchContext);
  const requestedColors = colorsIn(context);
  const palette: ClothingColor[] = requestedColors.length ? requestedColors
    : /\b(?:oscur[oa]s?|negros?|grafito)\b/.test(context) ? ['negro', 'gris']
      : /\b(?:neutr[oa]s?|tierra)\b/.test(context) ? ['blanco', 'beige', 'gris', 'cafe']
        : /\b(?:pasteles?|suaves?)\b/.test(context) ? ['rosa', 'celeste', 'morado']
          : [];
  const desiredStyle = /\b(?:formal|elegante|entrevista|reunion)\b/.test(context) ? 'elegante'
    : /\b(?:urban[oa]|streetwear|y2k)\b/.test(context) ? 'urbano'
      : /\b(?:casual|comodo|relajado)\b/.test(context) ? 'casual'
        : 'otro';
  const suitableTypes: Record<string, ClothingType[]> = {
    elegante: ['camisa', 'pantalon', 'chaqueta', 'blusa', 'vestido'],
    urbano: ['polera', 'pantalon', 'poleron', 'jockey', 'chaqueta', 'short'],
    casual: ['polera', 'camisa', 'pantalon', 'short', 'jockey', 'poleron'],
    otro: ['polera', 'camisa', 'pantalon', 'short', 'jockey', 'chaqueta'],
  };
  // Elegimos tipos compatibles con la asesoría y priorizamos colores verificables.
  const candidates = products.filter(isPublicAvailable).filter((p) => {
    const type = actualType(p);
    if (!type || !suitableTypes[desiredStyle].includes(type)) return false;
    return palette.length === 0 || productColors(p).some((color) => palette.includes(color));
  });
  // Mostramos diversidad de tipos cuando es posible, sin mezclar tipos en búsquedas exactas.
  const seenTypes = new Set<ClothingType>();
  const firstPerType = candidates.filter((p) => {
    const type = actualType(p)!;
    if (seenTypes.has(type)) return false;
    seenTypes.add(type);
    return true;
  });
  const firstIds = new Set(firstPerType.map((p) => String(p._id)));
  const ordered = [...firstPerType, ...candidates.filter((p) => !firstIds.has(String(p._id)))];
  return ordered.slice(0, 4).map(publicProduct);
};

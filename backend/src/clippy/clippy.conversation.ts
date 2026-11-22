/**
 * Orientación conversacional para Clippy cuando Gemini está desactivado,
 * no existe consentimiento o el proveedor no responde.
 * Solo procesa texto efímero: NO almacena ni consulta información privada.
 */
export interface ClippyTurn { role: string; text: string }
export interface ClippyGuide {
  answer: string;
  suggestions: string[];
  searchContext: string;
  recommendProducts: boolean;
  styleConsultation: boolean;
}

// Quita tildes para interpretar variantes habituales del español chileno.
const normalize = (text: string): string => text
  .toLocaleLowerCase('es-CL')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

// Devuelve verdadero si la conversación trata de vestuario o de una ocasión.
const STYLE_INTENT = /\b(cita|outfit|look|vestir|vestirme|vestuario|ropa para|que me pongo|que ponerme|combinacion|combinar|estilo|colores|paleta|entrevista|boda|graduacion|cumpleanos|fiesta|evento|salida|concierto|reunion|casual|urbano|elegante|streetwear)\b/;

const styleFrom = (text: string): string | null => {
  if (/\b(urbano|streetwear|street|oversize|y2k)\b/.test(text)) return 'urbano';
  if (/\b(elegante|formal|sofisticado|clasico)\b/.test(text)) return 'elegante';
  if (/\b(casual|relajado|comodo|sencillo)\b/.test(text)) return 'casual';
  if (/\b(atrevido|alternativo|audaz|llamativo|gotico|punk)\b/.test(text)) return 'atrevido';
  return null;
};

const paletteFrom = (text: string): string | null => {
  if (/\b(negro|negra|oscuros?|gris|grises|grafito)\b/.test(text)) return 'oscura';
  if (/\b(blanco|blanca|beige|neutros?|crema|tierra)\b/.test(text)) return 'neutra';
  if (/\b(pastel|rosado|rosa|celeste|lila)\b/.test(text)) return 'pastel';
  if (/\b(colorido|vibrante|rojo|verde|azul|amarillo)\b/.test(text)) return 'colorida';
  return null;
};

const occasionFrom = (text: string): string | null => {
  if (/\b(cita|romantica|romantico)\b/.test(text)) return 'cita';
  if (/\b(entrevista|trabajo|oficina|reunion)\b/.test(text)) return 'entrevista';
  if (/\b(fiesta|cumpleanos|concierto|carrete)\b/.test(text)) return 'salida';
  if (/\b(boda|matrimonio|graduacion|ceremonia)\b/.test(text)) return 'evento';
  if (/\b(paseo|universidad|dia a dia|diario)\b/.test(text)) return 'día a día';
  return null;
};

const introFor = (occasion: string | null): string => {
  if (occasion === 'cita') return '¡Uuuh, una cita! 👀✨ Vamos a armar un look con mucha onda.';
  if (occasion === 'entrevista') return '¡Vamos con todo! 💼✨ La idea es que te sientas cómodo y seguro.';
  if (occasion === 'evento') return '¡Qué buena ocasión! ✨ Vamos a pensar un outfit especial.';
  if (occasion === 'salida') return '¡Suena entretenido! 🔥 Armemos un look que vaya contigo.';
  return '¡Me encanta! ✨ Vamos a encontrar un estilo que te represente.';
};

/**
 * Genera una conversación en varios turnos, sin prometer disponibilidad.
 * Ante consultas abiertas pregunta preferencias antes de buscar productos.
 */
export const createClippyGuide = (question: string, history: ClippyTurn[]): ClippyGuide => {
  // Solo tomamos mensajes previos del visitante, nunca instrucciones externas.
  const visitorHistory = history.filter((turn) => turn.role === 'user').map((turn) => turn.text.slice(0, 400));
  const searchContext = [...visitorHistory, question].join(' ').slice(-1800);
  const current = normalize(question);
  const combined = normalize(searchContext);
  // Las preguntas sobre compras/tallas deben interrumpir el asesor de moda sin quedar 'atrapadas'.
  const directInfoIntent = /\b(talla|tallas|medida|medidas|envio|envios|despacho|despachos|compra|comprar|carrito|checkout|devolucion|devoluciones|garantia|stock|disponibilidad|agotado)\b/.test(current);
  const lastAssistant = [...history].reverse().find((turn) => turn.role === 'assistant');
  const answeringStyleQuestion = visitorHistory.length > 0 && question.length < 110
    && Boolean(lastAssistant && /\b(estilo|paleta|colores)\b/.test(normalize(lastAssistant.text)));
  const styleConsultation = !directInfoIntent && (STYLE_INTENT.test(current) || answeringStyleQuestion);
  const occasion = occasionFrom(combined);
  // Dar prioridad al mensaje más reciente permite que el usuario cambie de opinión.
  const newestFirst = [question, ...[...visitorHistory].reverse()].map(normalize);
  const style = newestFirst.map(styleFrom).find(Boolean) ?? null;
  const palette = newestFirst.map(paletteFrom).find(Boolean) ?? null;

  if (!styleConsultation) {
    if (/^(hola|holi|buenas|hey|hello|que tal)[!.?\s]*$/.test(current)) {
      return { answer: '¡Holaaa! 👋📎 Soy Clippy. ¿Andas buscando un outfit para alguna ocasión o necesitas ayuda con la tienda?', suggestions: ['Tengo una cita', 'Quiero un outfit casual', '¿Cómo elijo mi talla?'], searchContext, recommendProducts: false, styleConsultation: false };
    }
    // Consultas informativas: orientar sin inventar políticas o cifras internas.
    if (/\b(talla|tallas|medida|medidas)\b/.test(current)) {
      return { answer: '¡Vamos a encontrar tu talla! 📏✨ Revisa las opciones disponibles en la ficha de la prenda. Si tienes una medida específica o dudas entre dos tallas, lo mejor es confirmarlo con la tienda antes de comprar. ¿Qué prenda te gustó?', suggestions: [], searchContext, recommendProducts: false, styleConsultation: false };
    }
    if (/\b(envio|envios|despacho|despachos)\b/.test(current)) {
      return { answer: '¡Te cuento! 📦 Las alternativas y los costos de envío se muestran según tu ubicación en el proceso de compra. Si necesitas confirmar una condición especial, lo mejor es consultarla con el equipo de NoLimits.', suggestions: [], searchContext, recommendProducts: false, styleConsultation: false };
    }
    if (/\b(compra|comprar|carrito|checkout)\b/.test(current)) {
      return { answer: '¡Vamos por ese look! 🛍️ Entra al catálogo, elige la talla disponible y agrega las prendas al carrito. En el checkout podrás revisar las alternativas para finalizar tu compra. ¿Quieres que pensemos una combinación antes?', suggestions: ['Quiero un outfit', 'Tengo una cita'], searchContext, recommendProducts: false, styleConsultation: false };
    }
    if (/\b(cambio|cambios|devolucion|devoluciones|garantia)\b/.test(current)) {
      return { answer: '¡Te ayudo! 📎 Para cambios o devoluciones, revisa los términos publicados en NoLimits y contacta a la tienda si tu caso necesita revisión. Prefiero no prometerte plazos o condiciones que no pueda confirmar.', suggestions: [], searchContext, recommendProducts: false, styleConsultation: false };
    }
    if (/\b(stock|disponible|disponibilidad|agotado)\b/.test(current)) {
      return { answer: '¡Veamos! 👀 El stock publicado aparece en cada ficha de producto y puede cambiar. Si buscas una prenda agotada o que no aparece, pregunta directamente a NoLimits si tienen alternativa o reposición.', suggestions: [], searchContext, recommendProducts: false, styleConsultation: false };
    }
    return { answer: '¡Buena pregunta! 📎 Puedo ayudarte con looks, colores, tallas y compras. Para detalles oficiales de una política o un pedido, revisa la información publicada por NoLimits o consulta a la tienda. ¿Qué te gustaría saber?', suggestions: ['Quiero un outfit', '¿Cómo elijo mi talla?'], searchContext, recommendProducts: false, styleConsultation: false };
  }

  // Primera etapa: el asistente pregunta por el estilo en vez de responder "sin stock".
  if (!style) {
    return {
      answer: `${introFor(occasion)} ¿Qué estilo te gusta más: urbano, elegante, casual o algo atrevido? 😎`,
      suggestions: ['Estilo urbano 🖤', 'Algo elegante ✨', 'Casual y cómodo 👟', 'Algo atrevido 🔥'],
      searchContext,
      recommendProducts: false,
      styleConsultation: true,
    };
  }

  // Segunda etapa: si no ha indicado colores, hacemos una única pregunta concreta.
  if (!palette) {
    return {
      answer: `¡${style === 'urbano' ? 'El estilo urbano tiene mucha onda' : style === 'elegante' ? 'Elegante, excelente elección' : style === 'casual' ? 'Cómodo y con estilo, me gusta' : 'Qué buena personalidad'}! 😎✨ Ya tenemos una dirección. ¿Qué paleta te gustaría usar: tonos oscuros, neutros, pastel o colores vivos?`,
      suggestions: ['Negro y tonos oscuros 🖤', 'Tonos neutros 🤍', 'Colores pastel 🌸', 'Colores vivos 🎨'],
      searchContext,
      recommendProducts: false,
      styleConsultation: true,
    };
  }

  const combination: Record<string, string> = {
    urbano: 'Una polera con personalidad, un pantalón cómodo y un accesorio protagonista pueden funcionar muy bien',
    elegante: 'Una camisa bien combinada con pantalón de corte limpio y accesorios discretos suele funcionar muy bien',
    casual: 'Una polera o camisa relajada, pantalón cómodo y un accesorio simple logran un conjunto equilibrado',
    atrevido: 'Una prenda protagonista con otra más neutra ayuda a crear contraste sin sobrecargar el conjunto',
  };
  const paletteTip: Record<string, string> = {
    oscura: 'Negro, gris y un detalle plateado dan un contraste genial',
    neutra: 'Blanco, beige y tonos tierra se combinan con facilidad',
    pastel: 'Rosa, celeste o lila funcionan bien con una base neutra',
    colorida: 'Elige un color protagonista y acompáñalo con otro más suave',
  };
  return {
    answer: `¡Ahora sí, tenemos una idea! 🖤✨ Para un look ${style} con paleta ${palette}: ${combination[style]}. ${paletteTip[palette]}. Voy a revisar qué prendas públicas de NoLimits podrían encajar contigo.`,
    suggestions: [],
    searchContext,
    recommendProducts: true,
    styleConsultation: true,
  };
};

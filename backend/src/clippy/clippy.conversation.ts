/**
 * Orientación conversacional para Clippy cuando Gemini está desactivado,
 * no está configurado o el proveedor no responde.
 * Solo procesa texto efímero: NO almacena ni consulta información privada.
 */
import { getClippySocialReply, type ClippySocialKind } from './clippy.empathy';
import { parseProductRequest, type ClippyProductRequest } from './clippy.catalog';

export interface ClippyTurn { role: string; text: string }
export interface ClippyGuide {
  answer: string;
  suggestions: string[];
  searchContext: string;
  recommendProducts: boolean;
  styleConsultation: boolean;
  // El servidor no enviará estados emocionales a Gemini ni ofrecerá productos.
  socialKind?: ClippySocialKind;
  // Solicitud con filtros estrictos: la BD decide las tarjetas, no Gemini.
  productRequest?: ClippyProductRequest;
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
  let searchContext = question;
  const current = normalize(question);
  // Primero reconocemos el malestar; nunca lo convertimos en un turno de moda.
  const social = getClippySocialReply(question, history);
  if (social) {
    return {
      answer: social.answer, suggestions: [], searchContext: '',
      recommendProducts: false, styleConsultation: false, socialKind: social.kind,
    };
  }
  // Responde con tacto ante reclamos sobre stock: no ignores la molestia
  // ni ofrezcas productos sin conocer qué alternativa desea el visitante.
  const stockComplaint = /\b(?:agotad[oa]+s?|sin stock|no hay stock|no queda[n]?|no (?:esta|estan) disponibles?)\b/.test(current)
    && /\b(?:pero|ese|esa|este|esta|producto|prenda|la ficha|me aparece|sale|figura|esta|estan)\b/.test(current)
    && !/\b(?:tienes?|tienen|hay|busco|buscando|muestrame|quiero|necesito|ofrecen)\b/.test(current);
  if (stockComplaint) {
    return {
      answer: '¡Uy, qué lata que la prenda aparezca agotada! 😕📎 Gracias por avisarme. Si la ficha dice «Agotado», prefiero no prometerte stock ni reposición. Podemos buscar otra prenda o color que sí esté disponible; dime cuál te interesa. 💛',
      suggestions: ['Buscar otra prenda', '¿Cómo consulto disponibilidad?'],
      searchContext: '', recommendProducts: false, styleConsultation: false,
    };
  }

  // Una solicitud de producto concreto siempre tiene prioridad sobre estilo,
  // ocasión y preguntas anteriores. «Camisa blanca» no puede convertirse en «cita».
  // Solo usamos la pregunta inmediatamente anterior para «¿Y en blanco?».
  // No reactivamos una prenda solicitada muchos mensajes atrás.
  const previousUserQuestion = visitorHistory[visitorHistory.length - 1];
  const productRequest = parseProductRequest(question, previousUserQuestion);
  if (productRequest) {
    return {
      answer: '', // La ruta construye la respuesta a partir del catálogo real.
      suggestions: [], searchContext: question, recommendProducts: true,
      styleConsultation: false, productRequest,
    };
  }

  // Explicar los tipos de looks es diferente de afirmar que hay stock.
  if (/\b(?:estilos|tendencias|que tipo de look|tipos de looks)\b/.test(current)
    && /\b(?:hay|tienen|ofrecen|disponibles|manejan|recomiendas|son|puedes|conoces)\b/.test(current)) {
    return {
      answer: '¡Buena pregunta! 😎📎 Podemos explorar looks urbanos o streetwear, casuales, elegantes y estilos más atrevidos. También puedo ayudarte a combinar colores para una ocasión. Eso es asesoría de estilo: si quieres ver prendas concretas, revisaré cuáles están realmente disponibles en el catálogo. ¿Qué onda te tinca más?',
      suggestions: ['Quiero un look urbano', 'Prefiero algo elegante', 'Algo casual y cómodo'],
      searchContext: '', recommendProducts: false, styleConsultation: false,
    };
  }

  if (/\b(?:colores|paletas|tonos)\b/.test(current)
    && /\b(?:tienen|disponibles|hay|manejan|ofrecen)\b/.test(current)) {
    return {
      answer: '¡Podemos buscar por color! 🎨📎 Dime qué tono te gusta —blanco, negro, rosa, azul u otro— y qué prenda buscas. Te mostraré solo las coincidencias que aparezcan realmente en el catálogo, sin mezclar colores.',
      suggestions: ['Poleras blancas', 'Camisas azules', 'Pantalones negros'],
      searchContext: '', recommendProducts: false, styleConsultation: false,
    };
  }

  // Las preguntas sobre compras/tallas deben interrumpir el asesor de moda sin quedar 'atrapadas'.
  const directInfoIntent = /\b(talla|tallas|medida|medidas|envio|envios|despacho|despachos|compra|comprar|carrito|checkout|devolucion|devoluciones|garantia|stock|disponibilidad|agotado)\b/.test(current);
  const lastAssistant = [...history].reverse().find((turn) => turn.role === 'assistant');
  const answeringStyleQuestion = visitorHistory.length > 0 && question.length < 110
    && Boolean(lastAssistant && /(?:que estilo te gusta mas|que paleta te gustaria usar)/.test(normalize(lastAssistant.text)));
  const styleConsultation = !directInfoIntent && (STYLE_INTENT.test(current) || answeringStyleQuestion);
  // Heredamos preferencias SOLO si respondemos a una pregunta concreta de estilo.
  // Una consulta nueva no arrastra colores de una búsqueda de producto anterior.
  if (answeringStyleQuestion) {
    const styleTurns = visitorHistory.slice(-4).filter((text) =>
      (STYLE_INTENT.test(normalize(text)) || styleFrom(normalize(text)) || paletteFrom(normalize(text)))
      && !parseProductRequest(text)
    );
    searchContext = [...styleTurns, question].join(' ').slice(-1200);
  }
  const occasion = occasionFrom(normalize(searchContext));
  // Dar prioridad al mensaje más reciente permite que el usuario cambie de opinión.
  const newestFirst = answeringStyleQuestion
    ? [question, ...visitorHistory.slice(-4).reverse()].map(normalize)
    : [current];
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
    return {
      answer: '¡Aquí estoy, pana! 📎💛 Quiero entender bien tu pregunta para ayudarte de verdad. Puedo conversar de estilos, colores, tallas y prendas de NoLimits. ¿Me la cuentas con un poquito más de detalle?',
      suggestions: ['Quiero un outfit', 'Buscar una prenda', '¿Cómo elijo mi talla?'],
      searchContext, recommendProducts: false, styleConsultation: false,
    };
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

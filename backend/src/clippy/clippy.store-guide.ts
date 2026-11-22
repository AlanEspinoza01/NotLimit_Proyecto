/**
 * Conocimiento PÚBLICO de la tienda para Clippy.
 * - Distingue funciones reales y servicios futuros sin consultar pagos, usuarios o inventario.
 * - Solo lee textos publicados expresamente para el footer.
 * - No resume documentos legales ni copia contenido no validado a Google Gemini.
 */
export type ClippyStoreIntent =
  | 'custom-product' | 'payments' | 'buying' | 'privacy' | 'terms'
  | 'shipping' | 'pickup' | 'returns' | 'contact' | 'about' | 'social-media';

export interface ClippyStoreTurn { role: string; text: string }
export interface ClippyStoreReply { answer: string; suggestions: string[] }

// Solo títulos y párrafos que el administrador publica deliberadamente en el footer.
export type PublicInfoTexts = Partial<Record<
  'quienesSomos' | 'quienesSomosBanner' | 'comoPagarTitle' |
  'metodosEnvioTitle' | 'metodosEnvio' | 'retiroSucursalTitle' |
  'retiroSucursal' | 'cambiosDevolucionesTitle' |
  'politicasPrivacidadTitle' | 'terminosCondicionesTitle', unknown>>;

const normalize = (text: string): string => text
  .toLocaleLowerCase('es-CL')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const recentTopic = (history: ClippyStoreTurn[]): ClippyStoreIntent | null => {
  // Solo un turno previo: evita que temas antiguos secuestren una consulta nueva.
  const last = [...history].reverse().find(turn => turn.role === 'user');
  return last ? detectClippyStoreIntent(last.text, []) : null;
};

/** Identifica preguntas reales, no por palabras vagas aisladas. */
export const detectClippyStoreIntent = (question: string, history: ClippyStoreTurn[] = []): ClippyStoreIntent | null => {
  const q = normalize(question.trim()).replace(/^[¿¡\s]+|[?!\.\s]+$/g, '');
  // Servicio de producto personalizado prevalece ante «polera personalizada».
  if (/\b(personalizad[oa]s?|personalizar|a medida|pedido especial|diseno propio|estampado propio)\b/.test(q)
    && /\b(producto|pedido|prenda|ropa|polera|camisa|camiseta|hacer|solicitar|pedir|comprar|encargar|quiero|ofrecen|venden|puedo|como|precio|cuesta|valor|cotizacion|fotos?|diseno)\b/.test(q)) return 'custom-product';
  if (/\b(mercado pago|mercadopago|khipu|webpay|transbank|tarjeta[s]?|debito|credito|prepago|metodo[s]? de pago|medios? de pago|formas? de pago|pagar|pagos?)\b/.test(q)
    || /\bcomo se paga\b/.test(q)) return 'payments';
  // Una foto de referencia es parte del pedido personalizado, no un despacho.
  if (recentTopic(history) === 'custom-product'
    && /^(?:y\s+)?(?:puedo enviar fotos|cuantas fotos|necesito (?:una )?cuenta|necesito registrarme|cuanto cuesta|precio|valor|como lo solicito|como se hace)[?!.\s]*$/.test(q)) return 'custom-product';
  if (/\b(privacidad|datos personales|proteccion de datos|politica de privacidad|uso de mis datos)\b/.test(q)) return 'privacy';
  if (/\b(terminos|condiciones|contrato de compra)\b/.test(q)) return 'terms';
  if (/\b(cambios?|devolucion(?:es)?|devolver|reembolso|garantia|retracto)\b/.test(q)) return 'returns';
  if (/\b(despacho[s]?|envio[s]?|enviar|courier|starken|bluexpress|paket|entrega a domicilio|tracking|seguimiento de envio)\b/.test(q)) return 'shipping';
  if (/\b(retir[oa]|recogida|sucursal|recoger|tienda fisica)\b/.test(q)
    && /\b(como|donde|puedo|hacer|compras?|pedido|sucursal|ubicacion|direccion|retir[oa]|recoger|entregar|funciona)\b/.test(q)) return 'pickup';
  if (/\b(instagram|tik ?tok|redes sociales|seguirlos|sigu[eé]nos)\b/.test(q)) return 'social-media';
  if (/\b(atencion al cliente|servicio al cliente|contactar|contacto|hablar con la tienda|whatsapp|mesa de ayuda|soporte)\b/.test(q)) return 'contact';
  if (/\b(quienes son|que es nolimits|sobre nolimits|historia de la tienda|acerca de la tienda)\b/.test(q)) return 'about';
  if (/\b(como (?:puedo )?comprar|pasos para comprar|proceso de compra|hacer una compra|carrito|checkout)\b/.test(q)) return 'buying';

  // Seguimientos breves y explícitos. Nunca heredamos una intención antigua.
  const previous = recentTopic(history);
  if (previous === 'custom-product' && /^(?:y\s+)?(?:cuanto cuesta|precio|valor|como lo solicito|como se hace|puedo enviar fotos|cuantas fotos|necesito (?:una )?cuenta|necesito registrarme)[?!.\s]*$/.test(q)) return previous;
  if (previous === 'payments' && /^(?:y\s+)?(?:con tarjeta|con credito|con debito|con mercado pago|con khipu|que tarjetas|como funciona)[?!.\s]*$/.test(q)) return previous;
  if ((previous === 'privacy' || previous === 'terms' || previous === 'shipping' || previous === 'pickup' || previous === 'returns')
    && /^(?:y\s+)?(?:donde lo veo|donde encuentro eso|donde se ve|como lo consulto)[?!.\s]*$/.test(q)) return previous;
  return null;
};

// Nunca enviamos documentos HTML, instrucciones de terceros o información de administración.
const publicText = (data: PublicInfoTexts | null | undefined, key: keyof PublicInfoTexts, max = 240): string => {
  const value = data?.[key];
  if (typeof value !== 'string') return '';
  const clean = value.replace(/<[^>]*>/g, ' ').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
};

/** Respuestas informativas antes de consultar productos o consumir cuota Gemini. */
export const buildClippyStoreReply = (intent: ClippyStoreIntent, info: PublicInfoTexts | null = null): ClippyStoreReply => {
  switch (intent) {
    case 'custom-product':
      return {
        answer: '¡Sí, pana! 🎨📎 En NoLimits puedes solicitar un producto personalizado. Inicia sesión o regístrate y pulsa «Pedir Producto Personalizado» en la barra inferior de la web. Describe qué prenda quieres, talla, colores y detalles; puedes adjuntar hasta 10 fotos de referencia (son opcionales). Envía el formulario y el equipo revisará tu solicitud para contactarte con una cotización. El precio no es automático ni está garantizado antes de esa revisión.',
        suggestions: ['¿Necesito una cuenta?', '¿Puedo enviar fotos?'],
      };
    case 'payments':
      return {
        answer: '¡Claro, compa! 💳 Actualmente el pago en línea de NoLimits funciona con Transbank Webpay Plus. Puedes pagar con tarjetas compatibles con Webpay, según las opciones que muestre la pasarela al momento de comprar. Mercado Pago y Khipu son integraciones previstas, pero todavía NO están habilitadas como pasarelas independientes. Si quieres revisar el detalle, baja al footer → «Nosotros» → «Medios de Pago».',
        suggestions: ['¿Cómo puedo comprar?', '¿Dónde veo los medios de pago?'],
      };
    case 'buying':
      return {
        answer: `¡Vamos paso a paso! 🛒 Explora el Catálogo, elige una prenda y talla disponibles, agrégala al carrito y sigue el checkout. Allí completas tus datos, eliges retiro o envío y continúas a la pasarela de pago Webpay Plus. El detalle publicado está abajo, en «Nosotros» → «Cómo Comprar».${publicText(info, 'comoPagarTitle') ? ` La guía se llama «${publicText(info, 'comoPagarTitle', 90)}».` : ''}`,
        suggestions: ['¿Puedo pagar con tarjeta?', '¿Cómo funciona el envío?'],
      };
    case 'privacy':
      return {
        answer: `¡Buena pregunta! 🔐 La información oficial sobre el uso de datos personales está en el documento de privacidad de NoLimits. Para leerlo completo, baja al footer → «Servicio al Cliente» → «Políticas de Privacidad»; se abre una ventana con el texto publicado.${publicText(info, 'politicasPrivacidadTitle') ? ` Su título actual es «${publicText(info, 'politicasPrivacidadTitle', 100)}».` : ''} Prefiero remitirte al documento completo antes que resumir obligaciones legales de forma incompleta.`,
        suggestions: [],
      };
    case 'terms':
      return {
        answer: '¡Te ayudo, pana! 📄 Los términos oficiales de compra y despacho están en el footer → «Servicio al Cliente» → «Términos y Condiciones». Presiona ese botón para abrir el documento completo y revisar las condiciones vigentes antes de comprar.',
        suggestions: [],
      };
    case 'shipping':
      return {
        answer: `¡Veamos el despacho! 📦 En el checkout puedes consultar las opciones y el costo de envío según tu pedido y destino. En el footer → «Servicio al Cliente» → «Métodos de Envío» se abre la información publicada.${publicText(info, 'metodosEnvio') ? ` La tienda informa: ${publicText(info, 'metodosEnvio', 200)}.` : ''} Los plazos exactos y tarifas deben confirmarse durante la compra.`,
        suggestions: ['¿Puedo retirar en sucursal?'],
      };
    case 'pickup':
      return {
        answer: `¡Sí! 🏬 Puedes revisar si hay retiro disponible al realizar tu compra. Para conocer las condiciones y los puntos informados por la tienda, abre footer → «Servicio al Cliente» → «Retiro en Sucursal».${publicText(info, 'retiroSucursal') ? ` Información publicada: ${publicText(info, 'retiroSucursal', 180)}.` : ''} Confirma la disponibilidad de retiro antes de desplazarte.`,
        suggestions: ['¿Cómo puedo comprar?'],
      };
    case 'returns':
      return {
        answer: `¡Te ayudo! 💛 Si necesitas cambiar o devolver una prenda, revisa el documento «Cambios y Devoluciones» en el footer → «Servicio al Cliente». Allí están las condiciones vigentes para tu caso; si necesitas atención particular, utiliza «Atención al Cliente».${publicText(info, 'cambiosDevolucionesTitle') ? ` El documento se titula «${publicText(info, 'cambiosDevolucionesTitle', 90)}».` : ''}`,
        suggestions: ['¿Cómo contacto a la tienda?'],
      };
    case 'contact':
      return {
        answer: '¡Aquí estoy para orientarte! 💬 Si necesitas una respuesta del equipo humano de NoLimits, baja al footer → «Nosotros» → «Atención al Cliente». Se abrirá el formulario de contacto oficial. No necesitas compartir tus datos personales conmigo.',
        suggestions: [],
      };
    case 'social-media':
      return { answer: '¡Buena, pana! 📱 En el footer de NoLimits encontrarás «Síguenos», con los botones oficiales de Instagram, TikTok y WhatsApp. Puedes abrirlos desde allí para revisar las cuentas y el contacto actualizado, sin arriesgarte a seguir perfiles falsos.', suggestions: [] };
    case 'about':
      return {
        answer: `¡Buena esa, pana! 📎 NoLimits es una tienda de moda y vestuario. Su presentación está en el footer → «Nosotros» → «Quiénes Somos».${publicText(info, 'quienesSomos') ? ` ${publicText(info, 'quienesSomos', 260)}` : ''}`,
        suggestions: ['¿Cómo puedo comprar?', '¿Puedo pedir ropa personalizada?'],
      };
  }
};

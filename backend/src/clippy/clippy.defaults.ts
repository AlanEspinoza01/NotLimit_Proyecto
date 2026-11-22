import { ClippyFAQ, ClippySettings, ClippySettingsModel } from './clippy.model';

// Respuestas iniciales deliberadamente generales: no prometen plazos, stock ni políticas inexistentes.
export const DEFAULT_FAQS: ClippyFAQ[] = [
  { id: 'compra', category: 'Compras', question: '¿Cómo puedo comprar?', answer: 'Explora el catálogo, elige talla y agrega prendas al carrito. En el checkout verás las opciones disponibles para finalizar la compra.' },
  { id: 'tallas', category: 'Productos', question: '¿Cómo elijo mi talla?', answer: 'En cada ficha revisa las tallas y existencias mostradas. Si tienes dudas con las medidas de una prenda concreta, consulta a la tienda antes de comprar.' },
  { id: 'stock', category: 'Productos', question: '¿Cómo sé si una prenda está disponible?', answer: 'La ficha del producto muestra las tallas y el stock publicado. La disponibilidad puede cambiar durante el proceso de compra.' },
  { id: 'envios', category: 'Envíos', question: '¿Cómo funciona el envío?', answer: 'Las alternativas y el importe se calculan según la dirección y las opciones disponibles durante la compra. Consulta el checkout para ver la cotización vigente.' },
  { id: 'cambios', category: 'Soporte', question: '¿Cómo consulto por cambios o devoluciones?', answer: 'Revisa la información de cambios y devoluciones publicada en la tienda. Si tu caso necesita revisión, contacta directamente al equipo de atención.' },
  { id: 'asesoria', category: 'Estilo', question: '¿Me ayudas a elegir ropa para una ocasión?', answer: '¡Obvio! 😎📎 Me encanta armar looks. Primero cuéntame: ¿es para una cita, una entrevista, una salida con amigos u otra ocasión?' },
  { id: 'sin-producto', category: 'Soporte', question: '¿Y si no tienen lo que busco?', answer: 'Si no aparece en el catálogo, consulta directamente con la tienda para preguntar por disponibilidad o solicitar orientación sobre prendas similares.' },
];

export const DEFAULT_SETTINGS: ClippySettings = {
  _id: 'singleton',
  enabled: true,
  aiEnabled: false, // El Super Admin activa Gemini solo después de configurar su clave en el backend.
  welcomeMessage: '¡Hola! Soy Clippy 📎, tu ayudante de NoLimits. ¿Buscamos un look?',
  personality: 'Amigo cool y atento, conversador, español chileno natural. Entusiasmo auténtico, humor ligero y uno o dos emojis. Pregunta gustos antes de recomendar. Nunca presiona para comprar.',
  whatsappNumber: '',
  maxPerMinute: 5,
  maxPerDay: 25,
  maxGlobalAiPerDay: 200,
  faqs: DEFAULT_FAQS,
};

export const getClippySettings = async (): Promise<ClippySettings> => {
  const saved = await ClippySettingsModel.findById('singleton').lean<ClippySettings | null>();
  return saved ? { ...DEFAULT_SETTINGS, ...saved, faqs: saved.faqs?.length ? saved.faqs : [] } : DEFAULT_SETTINGS;
};

// Este objeto es lo único que entregamos al cliente visitante. Sin prompts, llaves ni presupuesto.
export const getPublicSettings = (settings: ClippySettings) => ({
  enabled: settings.enabled,
  aiEnabled: settings.aiEnabled && Boolean(process.env.GEMINI_API_KEY),
  welcomeMessage: settings.welcomeMessage,
  faqs: settings.faqs,
  whatsappNumber: settings.whatsappNumber,
});

import { Router, Request, Response } from 'express';
import { ProductModel } from '../models/Product.model';
import { ClippySettingsModel, ClippyUsageModel, ClippyFAQ } from './clippy.model';
import { DEFAULT_SETTINGS, getClippySettings, getPublicSettings } from './clippy.defaults';
import { allowGlobalAiCall, enforceClippyLimits, isSensitiveQuestion } from './clippy.security';
import { askGemini } from './clippy.gemini';
import { createClippyGuide } from './clippy.conversation';
import { isClippySocialResponse, isPersonalDistress } from './clippy.empathy';

export const clippyPublicRouter = Router();
export const clippyAdminRouter = Router();

// Campos de catálogo estrictamente públicos: jamás consulta Customer, User, Order, Supplier o Expense.
const PUBLIC_FIELDS = 'title name description images price salePrice discountPercent totalStock stock sizeBreakdown section category subcategory tags isHidden';
const safe = (text: unknown, max: number): string => String(text ?? '').trim().slice(0, max);

const findOutfits = async (question: string) => {
  const stopwords = new Set(['para', 'como', 'quiero', 'tengo', 'algo', 'ropa', 'usar', 'esta', 'estoy', 'color', 'colores', 'dame', 'puedo', 'puedes', 'hola', 'gracias', 'prenda', 'prendas', 'look', 'outfit', 'una', 'uno', 'unos', 'unas', 'con', 'sin', 'los', 'las', 'del', 'por', 'que', 'este', 'esto', 'sera', 'tienen', 'busco', 'necesito', 'ayuda', 'recomienda', 'usar', 'quiero', 'ocasion']);
  const tokens = question.toLocaleLowerCase('es-CL')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/)
    .filter((term) => term.length >= 3 && !stopwords.has(term));
  const words = new Set(tokens);
  const formal = /boda|formal|entrevista|oficina|graduacion|elegante|ceremonia|reunion/i.test(question);
  const casual = /casual|universidad|diario|paseo|amigos|comodo|street|urbano/i.test(question);
  // Los looks genéricos (cita, estilo, paleta) necesitan categorías de moda, no la palabra exacta "cita".
  // Sin embargo, una búsqueda de prenda específica NO se rellena con productos arbitrarios.
  const specificItem = /\b(?:busco|tienen|venden|necesito|hay|comprar)\b/i.test(question)
    && /\b(?:vestido|chaqueta|falda|zapato|botin|zapatilla|polera|camisa|pantalon|gorra|jockey|cartera|mochila)\b/i.test(question);
  const styleLook = /cita|outfit|look|estilo|combinar|vestir|paleta|negro|neutro|pastel|atrevido/i.test(question);
  const prefer = specificItem ? [] : formal
    ? ['camisa', 'pantalon', 'blazer', 'chaqueta', 'vestir']
    : casual || styleLook ? ['polera', 'camisa', 'pantalon', 'jockey', 'hoodie'] : [];

  const docs: any[] = await ProductModel.find({ isHidden: false }).select(PUBLIC_FIELDS).sort({ createdAt: -1 }).limit(150).lean();
  const scored = docs.map((p: any) => {
    const sizes = Array.isArray(p.sizeBreakdown) ? p.sizeBreakdown.filter((s: any) => Number(s.quantity ?? s.stock ?? 0) > 0).map((s: any) => String(s.size).slice(0, 35)) : [];
    const stock = Number(p.totalStock ?? p.stock ?? 0);
    if (!(stock > 0 || sizes.length > 0)) return null;
    const haystack = [p.title, p.name, p.description?.slice(0, 360), p.section, p.category, p.subcategory, ...(Array.isArray(p.tags) ? p.tags : [])]
      .join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    let rank = 0;
    words.forEach((word) => { if (haystack.includes(word)) rank += 3; });
    for (const word of prefer) if (haystack.includes(word)) rank += 2;
    const price = Number(p.salePrice) > 0 ? Number(p.salePrice) : Number(p.price) || 0;
    return { rank, item: {
      id: String(p._id), title: safe(p.title || p.name, 110), category: safe(p.category, 65),
      section: safe(p.section, 65), price,
      imageUrl: typeof p.images?.[0] === 'string' && /^https:\/\//i.test(p.images[0]) ? p.images[0] : '',
      sizes: sizes.slice(0, 8),
      url: `/#/product/${String(p._id)}`,
    } };
  }).filter(Boolean) as Array<{ rank: number; item: any }>;
  scored.sort((a, b) => b.rank - a.rank);
  // Una búsqueda específica sin coincidencias no recomienda prendas arbitrarias.
  const meaningfulQuery = words.size > 0 || formal || casual;
  return scored.filter((p) => !meaningfulQuery || p.rank > 0).slice(0, 4).map((p) => p.item);
};

const contactLink = (phone: string): string => {
  const digits = phone.replace(/[^0-9]/g, '');
  return digits.length >= 9 && digits.length <= 15
    ? `https://wa.me/${digits}?text=${encodeURIComponent('Hola, quisiera consultar por una prenda o accesorio que no encuentro en el catálogo de NoLimits.')}`
    : '';
};

clippyPublicRouter.get('/config', async (_req: Request, res: Response) => {
  try {
    const settings = await getClippySettings();
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: getPublicSettings(settings) });
  } catch {
    res.status(503).json({ success: false, message: 'Asistente no disponible' });
  }
});

clippyPublicRouter.post('/ask', async (req: Request, res: Response) => {
  try {
    const settings = await getClippySettings();
    if (!settings.enabled) {
      res.status(503).json({ success: false, message: 'Clippy está desactivado temporalmente.' });
      return;
    }
    if (!await enforceClippyLimits(req, res, settings)) return;
    const questionId = typeof req.body?.questionId === 'string' ? safe(req.body.questionId, 70) : '';
    const questionRaw = req.body?.question;
    if (questionRaw !== undefined && (typeof questionRaw !== 'string' || questionRaw.length > 500)) {
      res.status(400).json({ success: false, message: 'La consulta debe contener un máximo de 500 caracteres.' });
      return;
    }
    const question = safe(questionRaw, 500);
    // Contexto efímero y acotado; no se guarda en MongoDB.
    // Tipado explícito: req.body proviene de Express y no aporta tipos inferibles.
    const history: Array<{ role: string; text: string }> = Array.isArray(req.body?.history) && req.body.history.length <= 8
      ? req.body.history.filter((item: any) => item && ['user', 'assistant'].includes(item.role)
          && typeof item.text === 'string' && item.text.length <= 400 && !isSensitiveQuestion(item.text))
          .map((item: any) => ({ role: item.role as string, text: safe(item.text, 400) }))
      : [];
    const faq: ClippyFAQ | undefined = questionId ? settings.faqs.find((entry) => entry.id === questionId) : undefined;
    if (questionId && !faq) { res.status(400).json({ success: false, message: 'Pregunta guiada desconocida.' }); return; }
    if (!faq && question.length < 4) { res.status(400).json({ success: false, message: 'Escribe una consulta más descriptiva.' }); return; }

    if (!faq && isSensitiveQuestion(question)) {
      res.json({ success: true, data: { answer: 'Solo puedo ayudar con información pública de la tienda y recomendaciones de vestuario. Para consultas sobre cuentas o datos privados, utiliza los canales oficiales.', products: [], mode: 'guide', contactUrl: contactLink(settings.whatsappNumber) } });
      return;
    }
    if (faq) {
      // Las preguntas FAQ son administradas por el Super Admin; mantenemos la respuesta exacta.
      res.json({ success: true, data: { answer: faq.answer, products: [], suggestions: [], mode: 'guide', contactUrl: contactLink(settings.whatsappNumber) } });
      return;
    }

    // La empatía cotidiana tiene prioridad sobre el comercio y las llamadas a IA.
    // No consultamos catálogo, no mostramos WhatsApp ni enviamos ese texto a Google.
    const guide = createClippyGuide(question, history);
    if (guide.socialKind) {
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        success: true,
        data: { answer: guide.answer, products: [], suggestions: [], mode: 'guide', contactUrl: '' },
      });
      return;
    }

    // El modo guiado pregunta gustos y paleta en lugar de cortar la conversación.
    const products = guide.recommendProducts ? await findOutfits(guide.searchContext) : [];
    let fallback = guide.answer;
    if (guide.recommendProducts && products.length) {
      fallback += ` ¡Mira estas ${products.length} opción(es) del catálogo! Revisa tallas y disponibilidad en cada ficha.`;
    } else if (guide.recommendProducts && !products.length) {
      fallback += ' No encontré prendas coincidentes disponibles ahora; si buscas algo específico, puedes consultarlo directamente con la tienda.';
    }

    let answer = fallback;
    let suggestions = guide.suggestions;
    let mode: 'guide' | 'gemini' = 'guide';
    if (req.body?.allowGemini === true && settings.aiEnabled && process.env.GEMINI_API_KEY
      && await allowGlobalAiCall(settings.maxGlobalAiPerDay)) {
      try {
        // No se reenvían a Gemini expresiones emocionales de turnos anteriores.
        const publicHistory = history.filter((turn: { role: string; text: string }) => !isPersonalDistress(turn.text) && !isClippySocialResponse(turn.text));
        const aiAnswer = await askGemini(question, products.map(({ title, section, category, price, sizes }) => ({ title, section, category, price, sizes })), settings, publicHistory);
        if (aiAnswer) { answer = aiAnswer; suggestions = []; mode = 'gemini'; }
      } catch {
        // Fallo del proveedor: preservamos el funcionamiento local y no revelamos detalles internos.
        console.warn('[CLIPPY] Respuesta de Gemini no disponible; usando asesoría guiada.');
      }
    }
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: { answer, products, suggestions, mode, contactUrl: contactLink(settings.whatsappNumber) } });
  } catch (error) {
    console.error('[CLIPPY] Error procesando solicitud:', error instanceof Error ? error.name : 'unknown');
    res.status(503).json({ success: false, message: 'Clippy no está disponible por ahora.' });
  }
});

// IMPORTANTE: este router se monta DESPUÉS del guard authenticateUser + authorizeRoles('super_admin').
clippyAdminRouter.get('/settings', async (_req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: { ...await getClippySettings(), geminiConfigured: Boolean(process.env.GEMINI_API_KEY) } });
  } catch { res.status(503).json({ success: false, message: 'No se pudo consultar Clippy' }); }
});

const bounded = (input: unknown, min: number, max: number): number | null => {
  const num = Number(input);
  return Number.isSafeInteger(num) && num >= min && num <= max ? num : null;
};

clippyAdminRouter.put('/settings', async (req: Request, res: Response) => {
  try {
    const b = req.body;
    if (!b || typeof b !== 'object' || typeof b.enabled !== 'boolean' || typeof b.aiEnabled !== 'boolean'
      || typeof b.welcomeMessage !== 'string' || b.welcomeMessage.length > 240 || !b.welcomeMessage.trim()
      || typeof b.personality !== 'string' || b.personality.length > 300
      || typeof b.whatsappNumber !== 'string' || !/^\+?[\d\s()-]{0,28}$/.test(b.whatsappNumber)
      || !Array.isArray(b.faqs) || b.faqs.length > 20) {
      res.status(400).json({ success: false, message: 'Configuración de Clippy inválida.' }); return;
    }
    const maxPerMinute = bounded(b.maxPerMinute, 1, 10);
    const maxPerDay = bounded(b.maxPerDay, 5, 100);
    const maxGlobalAiPerDay = bounded(b.maxGlobalAiPerDay, 10, 1000);
    if (maxPerMinute === null || maxPerDay === null || maxGlobalAiPerDay === null) {
      res.status(400).json({ success: false, message: 'Límites fuera de rango.' }); return;
    }
    const ids = new Set<string>();
    const faqs: ClippyFAQ[] = [];
    for (const row of b.faqs) {
      if (!row || typeof row.id !== 'string' || !/^[\w-]{2,70}$/.test(row.id) || ids.has(row.id)
        || typeof row.category !== 'string' || !row.category.trim() || row.category.length > 45
        || typeof row.question !== 'string' || !row.question.trim() || row.question.length > 140
        || typeof row.answer !== 'string' || !row.answer.trim() || row.answer.length > 700) {
        res.status(400).json({ success: false, message: 'Hay preguntas duplicadas o demasiado extensas.' }); return;
      }
      ids.add(row.id);
      faqs.push({ id: row.id, category: row.category.trim(), question: row.question.trim(), answer: row.answer.trim() });
    }
    const update = {
      enabled: b.enabled, aiEnabled: b.aiEnabled,
      welcomeMessage: b.welcomeMessage.trim(), personality: b.personality.trim(),
      whatsappNumber: b.whatsappNumber.replace(/[^\d]/g, ''),
      maxPerMinute, maxPerDay, maxGlobalAiPerDay, faqs,
    };
    const settings = await ClippySettingsModel.findByIdAndUpdate('singleton', { $set: update }, {
      upsert: true, runValidators: true, returnDocument: 'after', setDefaultsOnInsert: true,
    }).lean();
    res.json({ success: true, data: { ...settings, geminiConfigured: Boolean(process.env.GEMINI_API_KEY) } });
  } catch { res.status(503).json({ success: false, message: 'No se pudo guardar la configuración.' }); }
});

clippyAdminRouter.get('/usage', async (_req: Request, res: Response) => {
  try {
    const day = Math.floor(Date.now() / 86_400_000);
    const dailyAi = await ClippyUsageModel.findById(`gemini:${day}`).select('count').lean<{ count: number } | null>();
    res.json({ success: true, data: { todayAiRequests: dailyAi?.count ?? 0, note: 'No se guardan conversaciones ni mensajes de visitantes.' } });
  } catch { res.status(503).json({ success: false, message: 'Estadísticas no disponibles.' }); }
});

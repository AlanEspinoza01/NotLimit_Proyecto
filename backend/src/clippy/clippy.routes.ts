import { Router, Request, Response } from 'express';
import { ProductModel } from '../models/Product.model';
import { ClippySettingsModel, ClippyUsageModel, ClippyFAQ } from './clippy.model';
import { DEFAULT_SETTINGS, getClippySettings, getPublicSettings } from './clippy.defaults';
import { allowGlobalAiCall, enforceClippyLimits, isSensitiveQuestion } from './clippy.security';
import { askGemini } from './clippy.gemini';
import { createClippyGuide } from './clippy.conversation';
import {
  type CatalogDocument, type ClippyPublicProduct,
  matchCatalogProducts, matchStyleProducts, buildCatalogReply,
} from './clippy.catalog';
import { isClippySocialResponse, isClippySocialMessage } from './clippy.empathy';

export const clippyPublicRouter = Router();
export const clippyAdminRouter = Router();

// Campos públicos: no consultamos User, Order, Supplier ni Expense.
const PUBLIC_FIELDS = 'title name description images price salePrice totalStock stock sizeBreakdown section category subcategory subCategory tags isHidden';

// El catálogo puede crecer: revisamos las últimas 500 prendas públicas.
// No se dice "no existe" si la búsqueda no encuentra un resultado en este conjunto.
const loadPublicCatalog = async (): Promise<CatalogDocument[]> => {
  const docs = await ProductModel.find({ isHidden: false })
    .select(PUBLIC_FIELDS).sort({ updatedAt: -1 }).limit(500).lean();
  return docs as CatalogDocument[];
};

const safe = (text: unknown, max: number): string => String(text ?? '').trim().slice(0, max);

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

    // Solo consultamos productos cuando hay interés explícito en productos/looks.
    // Una consulta sobre una prenda concreta se filtra por clase + color + sección,
    // sin completar el resultado con artículos de otras categorías.
    let products: ClippyPublicProduct[] = [];
    if (guide.recommendProducts) {
      const docs = await loadPublicCatalog();
      products = guide.productRequest
        ? matchCatalogProducts(docs, guide.productRequest)
        : matchStyleProducts(docs, guide.searchContext);
    }

    let fallback = guide.productRequest
      ? buildCatalogReply(guide.productRequest, products)
      : guide.answer;
    if (!guide.productRequest && guide.recommendProducts && products.length) {
      fallback += ` Te dejo ${products.length} opción(es) disponibles que podrían combinar con la idea; revisa los detalles de cada una.`;
    } else if (!guide.productRequest && guide.recommendProducts && !products.length) {
      fallback += ' No encontré coincidencias disponibles para esa combinación entre las prendas revisadas; puedes consultar a la tienda por alternativas.';
    }

    let answer = fallback;
    let suggestions = guide.suggestions;
    let mode: 'guide' | 'gemini' = 'guide';
    // Las preguntas con filtros concretos se responden desde MongoDB, nunca
    // desde un texto de IA que pudiera inventar prendas, colores o disponibilidad.
    if (!guide.productRequest && req.body?.allowGemini === true && settings.aiEnabled && process.env.GEMINI_API_KEY
      && await allowGlobalAiCall(settings.maxGlobalAiPerDay)) {
      try {
        // No se reenvían a Gemini expresiones emocionales de turnos anteriores.
        const publicHistory = history.filter((turn: { role: string; text: string }) => !isClippySocialMessage(turn.text) && !isClippySocialResponse(turn.text));
        const aiAnswer = await askGemini(question, products.map(({ title, section, category, price, sizes }) => ({ title, section, category, price, sizes })), settings, publicHistory);
        if (aiAnswer) { answer = aiAnswer; suggestions = []; mode = 'gemini'; }
      } catch {
        // Fallo del proveedor: preservamos el funcionamiento local y no revelamos detalles internos.
        console.warn('[CLIPPY] Respuesta de Gemini no disponible; usando asesoría guiada.');
      }
    }
    res.setHeader('Cache-Control', 'no-store');
    // Mostramos WhatsApp solo cuando el usuario busca una prenda que no aparece
    // o cuando pidió un look y no hay coincidencias en el catálogo revisado.
    const contactUrl = guide.recommendProducts && !products.length
      ? contactLink(settings.whatsappNumber) : '';
    res.json({ success: true, data: { answer, products, suggestions, mode, contactUrl } });
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

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { Request, Response } from 'express';
import { ClippySettings, ClippyUsageModel } from './clippy.model';

// No se registra la IP real ni se guarda el texto de los usuarios en MongoDB.
const sign = (text: string) => createHmac('sha256', process.env.JWT_SECRET || 'insecure-dev-key')
  .update(`clippy:v1:${text}`).digest('hex');

// Cookie independiente: evita confiar en un identificador de sesión elegido por el navegador.
const visitorId = (req: Request, res: Response): string => {
  const cookie = String(req.cookies?.nl_clippy_visitor || '');
  const [id, signature] = cookie.split('.');
  if (id && /^[a-f0-9]{32}$/.test(id) && signature && /^[a-f0-9]{64}$/.test(signature)) {
    const expected = Buffer.from(sign(id), 'hex');
    const actual = Buffer.from(signature, 'hex');
    if (actual.length === expected.length && timingSafeEqual(actual, expected)) return id;
  }
  const fresh = randomBytes(16).toString('hex');
  res.cookie('nl_clippy_visitor', `${fresh}.${sign(fresh)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/clippy',
  });
  return fresh;
};

// Limite atómico por ventana en Atlas, consistente entre funciones serverless de Vercel.
const increase = async (key: string, expiresAt: Date): Promise<number> => {
  const result = await ClippyUsageModel.findOneAndUpdate(
    { _id: key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, returnDocument: 'after' }
  ).lean<{ count: number } | null>();
  return Number(result?.count || 0);
};

export const enforceClippyLimits = async (
  req: Request, res: Response, settings: ClippySettings,
): Promise<boolean> => {
  const now = Date.now();
  const minuteStart = Math.floor(now / 60_000);
  const dayStart = Math.floor(now / 86_400_000);
  const minuteExpiry = new Date((minuteStart + 2) * 60_000);
  const dayExpiry = new Date((dayStart + 2) * 86_400_000);
  const visitor = sign(visitorId(req, res));
  // Segundo límite por dirección de red. Úsalo junto a Vercel WAF/CAPTCHA para tráfico malicioso.
  // Vercel proporciona x-real-ip; en local se usa req.ip, sin confiar en XFF arbitrario.
  const address = process.env.VERCEL === '1' ? req.get('x-real-ip') || '' : String(req.ip || '');
  // No crear una cuota global accidental si la función solo recibe 127.0.0.1 del proxy.
  const reliableAddress = isIP(address) && !['127.0.0.1', '::1'].includes(address) ? address : '';
  const minuteCount = await increase(`m:${visitor}:${minuteStart}`, minuteExpiry);
  const dayCount = await increase(`d:${visitor}:${dayStart}`, dayExpiry);
  const networkCount = reliableAddress
    ? await increase(`ip:${sign(reliableAddress)}:${minuteStart}`, minuteExpiry)
    : 0;
  if (minuteCount > settings.maxPerMinute || dayCount > settings.maxPerDay || networkCount > Math.max(30, settings.maxPerMinute * 8)) {
    res.setHeader('Retry-After', '60');
    res.status(429).json({ success: false, message: 'Clippy recibió muchas consultas. Inténtalo nuevamente más tarde.' });
    return false;
  }
  return true;
};

// Presupuesto de solicitudes al proveedor; el administrador puede desactivar la IA al instante.
export const allowGlobalAiCall = async (dailyMaximum: number): Promise<boolean> => {
  const start = Math.floor(Date.now() / 86_400_000);
  const count = await increase(`gemini:${start}`, new Date((start + 2) * 86_400_000));
  return count <= dailyMaximum;
};

export const isSensitiveQuestion = (question: string): boolean =>
  /(?:contraseñas?|passwords?|credenciales?|secretos?\s*(?:api|jwt)|jwt_secret|api[_ -]?key|base de datos interna|mongo(?:db)?[_ -]?uri|datos personales de clientes|lista de usuarios|ventas internas|ingresos internos|costos internos|proveedores internos|token de acceso|claves de acceso)/i.test(question);

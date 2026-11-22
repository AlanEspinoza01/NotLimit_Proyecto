import { OAuth2Client } from 'google-auth-library';

// Este servicio se ejecuta únicamente en el backend. No expone el refresh token al navegador.
const GMAIL_SEND_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

// Escapar contenido proporcionado por los clientes antes de incorporarlo al HTML del correo.
const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// La API de Gmail recibe un mensaje MIME íntegro codificado en base64url.
const toBase64Url = (value: string): string =>
  Buffer.from(value, 'utf8').toString('base64url');

// No permitir inyección de cabeceras por correo o caracteres de control.
const isValidAddress = (value: string): boolean =>
  /^[^\s@\r\n<>]+@[^\s@\r\n<>]+\.[^\s@\r\n<>]+$/.test(value);

// Evitar que una configuración incompleta provoque el intento de usar Gmail.
const getMailConfiguration = () => {
  const clientId = (process.env.GMAIL_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GMAIL_CLIENT_SECRET || '').trim();
  const refreshToken = (process.env.GMAIL_REFRESH_TOKEN || '').trim();
  const from = (process.env.GMAIL_FROM_EMAIL || '').trim().toLowerCase();
  if (!clientId || !clientSecret || !refreshToken || !isValidAddress(from)) return null;
  return { clientId, clientSecret, refreshToken, from };
};

export const isGmailReady = (): boolean => getMailConfiguration() !== null;

// Generar un correo transaccional. No se envía publicidad ni contenido de marketing.
export const buildWelcomeMail = (firstName: string, to: string, from: string) => {
  const cleanName = escapeHtml(firstName.trim().slice(0, 90) || 'Cliente');
  // El botón de bienvenida siempre dirige a la tienda pública oficial de NoLimits.
  // URL fija, sin parámetros recibidos del cliente ni redirecciones a otros dominios.
  const safeUrl = 'https://notlimit-proyecto.vercel.app';
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body style="margin:0;padding:24px;background:#f1f5f9;font-family:Tahoma,Arial,sans-serif;color:#17335b">
  <div style="max-width:520px;margin:auto;background:#fff;border:2px solid #0055ea">
    <div style="background:#1768e6;color:white;padding:12px 16px;font-weight:bold">🌸 Bienvenido a NoLimits</div>
    <div style="padding:22px;line-height:1.65"><h2 style="margin-top:0">¡Hola, ${cleanName}!</h2>
      <p>Tu cuenta en <strong>NoLimits</strong> ya está registrada.</p>
      <p>Desde tu perfil podrás consultar tus compras, guardar prendas favoritas y revisar tus puntos NoLimits.</p>
      <p><a href="${escapeHtml(safeUrl)}" style="display:inline-block;background:#1768e6;color:#fff;text-decoration:none;padding:10px 16px;font-weight:bold">Entrar a NoLimits</a></p>
      <p style="font-size:12px;color:#475569">Si no creaste esta cuenta, ignora el mensaje y contacta al soporte oficial de la tienda. Nunca te pediremos tu contraseña por correo.</p>
    </div></div></body></html>`;
  const subject = '¡Bienvenido a NoLimits!';
  // Se codifica el cuerpo HTML completo en base64 MIME para preservar UTF-8.
  const encodedBody = Buffer.from(html, 'utf8').toString('base64').match(/.{1,76}/g)?.join('\r\n') || '';
  const mime = [
    `From: NoLimits <${from}>`,
    `To: <${to}>`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, 'utf8').toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodedBody,
  ].join('\r\n');
  return { html, raw: toBase64Url(mime) };
};

export const sendWelcomeEmail = async (recipient: { email: string; firstName: string }): Promise<boolean> => {
  const config = getMailConfiguration();
  if (!config) {
    // El registro funciona aunque Gmail no esté configurado todavía.
    console.info('[GMAIL] No configurado: se omitió el correo de bienvenida.');
    return false;
  }
  const to = recipient.email.trim().toLowerCase();
  if (!isValidAddress(to)) {
    console.warn('[GMAIL] Se omitió un destinatario inválido.');
    return false;
  }
  // El token de actualización pertenece a la cuenta EMISORA, nunca al cliente registrado.
  const client = new OAuth2Client(config.clientId, config.clientSecret);
  client.setCredentials({ refresh_token: config.refreshToken });
  const access = await client.getAccessToken();
  if (!access.token) throw new Error('Gmail no entregó un token de acceso');
  const { raw } = buildWelcomeMail(recipient.firstName, to, config.from);
  const response = await fetch(GMAIL_SEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${access.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    // No registrar el cuerpo del error: puede incluir detalles de autorización.
    throw new Error(`Gmail API rechazó el mensaje (HTTP ${response.status})`);
  }
  return true;
};

// Nunca permitir que un fallo del correo deshaga un alta ya confirmada en MongoDB.
export const notifyWelcomeWithoutFailingRegistration = async (
  recipient: { email: string; firstName: string }
): Promise<void> => {
  try {
    await sendWelcomeEmail(recipient);
  } catch {
    console.warn('[GMAIL] No se pudo enviar bienvenida. Registro conservado. Revisa OAuth y Gmail API.');
  }
};

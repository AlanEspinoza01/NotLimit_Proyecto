// =========================================================
// PROTECCIÓN DE ORIGEN PARA OPERACIONES CON COOKIES
// Reutilizable en los módulos administrativos de No Limits.
// =========================================================

import { Request, Response, NextFunction } from 'express';

// Reunimos los dominios del frontend habilitados en este entorno.
const configuredOrigins: Array<string | undefined> = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_PRODUCTION,
  process.env.CORS_ORIGIN !== '*' ? process.env.CORS_ORIGIN : undefined,
];

// Las direcciones locales solo se permiten expresamente en desarrollo.
if (process.env.NODE_ENV !== 'production') {
  configuredOrigins.push('http://localhost:3000', 'http://localhost:5173');
}

// Normalizamos los valores para comparar orígenes exactos.
const allowedOrigins = new Set<string>(
  configuredOrigins
    .filter((entry): entry is string => Boolean(entry))
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      try {
        return new URL(entry).origin;
      } catch {
        return null;
      }
    })
    .filter((origin): origin is string => Boolean(origin))
);

// Rechazamos modificaciones desde una página ajena a la aplicación.
export default function validateRequestOrigin(
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  // El navegador envía Origin en solicitudes de formularios/API.
  const origin = req.get('Origin');

  // Requerimos un origen presente y reconocido; no usamos comodines.
  if (!origin || !allowedOrigins.has(origin)) {
    return res.status(403).json({
      success: false,
      message: 'Origen de solicitud no autorizado',
    });
  }

  // Continuamos si la petición procede del frontend autorizado.
  return next();
}

export { validateRequestOrigin, allowedOrigins };

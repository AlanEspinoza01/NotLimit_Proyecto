// =========================================================
// CONSULTA DE POLÍTICA DE SESIÓN (SOLO LECTURA)
// =========================================================
// No devuelve tokens, cookies de sesión ni claves de firma.
// Las duraciones provienen de la misma configuración usada
// por tokenUtils.ts; la duración JWT se presenta tal cual
// fue configurada y la cookie en milisegundos.

import { Router, Request, Response, NextFunction } from 'express';
import authenticateUser from '../middleware/authenticateUser';
import authorizeRoles from '../middleware/authorizeRoles';
import { getAuthCookieOptions } from '../utils/tokenUtils';
import {
  MAX_LOGIN_ATTEMPTS,
  ACCOUNT_LOCK_TIME_MS,
  LOGIN_RATE_LIMIT_WINDOW_MS,
  LOGIN_RATE_LIMIT_MAX_REQUESTS,
} from '../config/loginSecurityPolicy';

const router = Router();

// Solo el superadministrador puede consultar la política.
router.use(authenticateUser, authorizeRoles('super_admin'));

// GET /api/system/session-policy
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Se usa el mismo valor de expiración que generateAuthToken.
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '2h';

    // La duración se obtiene de la configuración real de la cookie.
    const cookieOptions = getAuthCookieOptions();

    // Impedimos almacenar datos de configuración administrativa.
    res.set('Cache-Control', 'no-store');

    return res.status(200).json({
      success: true,
      policy: {
        jwtExpiresIn,
        cookieMaxAgeMs: cookieOptions.maxAge,
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        sessionVersioning: true,
        editable: false,
        loginSecurity: {
          maxLoginAttempts: MAX_LOGIN_ATTEMPTS,
          accountLockTimeMs: ACCOUNT_LOCK_TIME_MS,
          rateLimitWindowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
          rateLimitMaxRequests: LOGIN_RATE_LIMIT_MAX_REQUESTS,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;

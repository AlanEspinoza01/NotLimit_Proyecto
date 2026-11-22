import express from 'express';
import {
  loginUserService,
  registerUserService,
  googleAuthUserService,
  serializeUser,
  updateUserProfileService,
} from '../services/auth.service';
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  getAuthCookieClearOptions,
} from '../utils/tokenUtils';
import { ApiError } from '../utils/ApiError';
import { notifyWelcomeWithoutFailingRegistration } from '../services/googleMail.service';

/**
 * POST /api/auth/login
 * Inicia sesión validando correo, contraseña y política de bloqueo contra MongoDB (`users`).
 * Emite tanto la cookie HttpOnly segura como el token en el cuerpo JSON.
 */
export const loginController = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body || {};
    const result = await loginUserService(email, password);

    res.cookie(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());

    res.status(200).json({
      ok: true,
      success: true,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/register
 * Crea un nuevo usuario registrado en la colección `users` de MongoDB
 * validando las reglas de contraseña de `passwordUtils.ts`.
 */
export const registerController = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const { name, firstName, lastName, email, password, rut, phone } =
      req.body || {};
    const result = await registerUserService({
      name,
      firstName,
      lastName,
      email,
      password,
      rut,
      phone,
    });

    res.cookie(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());

    // El alta ya está persistida en MongoDB. Un fallo de Gmail no cancela la cuenta.
    await notifyWelcomeWithoutFailingRegistration({
      email: result.user.email, firstName: result.user.firstName || 'Cliente',
    });

    res.status(201).json({
      ok: true,
      success: true,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/google
 * Autentica o crea un usuario mediante Google Auth en la colección `users` de MongoDB.
 */
// El Client ID es público; se entrega desde el backend para no requerir un .env extra en frontend.
export const googleLoginConfigController = (_req: express.Request, res: express.Response): void => {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  res.set('Cache-Control', 'no-store');
  res.status(200).json({ enabled: Boolean(clientId), clientId });
};

/** Iniciar sesión con un ID token firmado y validado por Google en nuestro backend. */
export const googleAuthController = async (
  req: express.Request, res: express.Response, next: express.NextFunction
): Promise<void> => {
  try {
    const credential = req.body?.credential;
    const result = await googleAuthUserService(credential);
    // Mantener la política de sesión existente: cookie HttpOnly, sin token en localStorage.
    res.cookie(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());
    if (result.isNewAccount) {
      await notifyWelcomeWithoutFailingRegistration({
        email: result.user.email, firstName: result.user.firstName || 'Cliente',
      });
    }
    res.status(200).json({ ok: true, success: true, user: result.user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Devuelve el usuario autenticado actual verificado por el middleware `authenticateUser`.
 */
export const getMeController = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Debes iniciar sesión');
    }

    res.status(200).json({
      ok: true,
      success: true,
      user: serializeUser(req.user),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 * Elimina la cookie de sesión HttpOnly.
 */
export const logoutController = async (
  _req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieClearOptions());
    res.status(200).json({
      ok: true,
      success: true,
      message: 'Sesión cerrada correctamente',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/auth/profile/:id
 * Actualiza los datos del perfil del usuario en MongoDB (`users`).
 */
export const updateProfileController = async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<void> => {
  try {
    const userId = String(req.params.id);
    if (
      req.user &&
      String(req.user._id) !== userId &&
      req.user.role !== 'super_admin'
    ) {
      throw new ApiError(403, 'No tienes permisos para modificar otro perfil.');
    }

    const payload: any = { ...(req.body || {}) };
    if (req.file && (req.file as any).path) {
      payload.avatarUrl = (req.file as any).path;
    }

    const updatedUser = await updateUserProfileService(userId, payload);
    res.status(200).json({
      ok: true,
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Alias compatibles con tu versión local
export const loginUser = loginController;
export const registerUser = registerController;
export const getCurrentUser = getMeController;
export const logoutUser = logoutController;

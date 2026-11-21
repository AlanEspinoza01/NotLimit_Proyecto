import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  loginController,
  registerController,
  googleAuthController,
  getMeController,
  logoutController,
  updateProfileController,
} from '../controllers/auth.controller';
import authenticateUser from '../middleware/authenticateUser';
import validateRequestOrigin from '../middleware/validateRequestOrigin';
import {
  LOGIN_RATE_LIMIT_WINDOW_MS,
  LOGIN_RATE_LIMIT_MAX_REQUESTS,
} from '../config/loginSecurityPolicy';

const authRouter = Router();

// Limitador de intentos por dirección IP según la política centralizada (loginSecurityPolicy.ts)
const authLimiter = rateLimit({
  windowMs: LOGIN_RATE_LIMIT_WINDOW_MS,
  max: LOGIN_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    success: false,
    error: 'Demasiados intentos de autenticación desde esta IP. Intenta más tarde.',
    message: 'Demasiados intentos de autenticación desde esta IP. Intenta más tarde.',
  },
});

// POST /api/auth/login -> Iniciar sesión contra MongoDB (users)
authRouter.post('/login', authLimiter, loginController);

// POST /api/auth/register -> Registrar nuevo cliente en MongoDB (users)
authRouter.post('/register', authLimiter, registerController);

// POST /api/auth/google -> Iniciar sesión o registrar vía Google
authRouter.post('/google', authLimiter, googleAuthController);

// GET /api/auth/me -> Obtener sesión actual verificada por authenticateUser
authRouter.get('/me', authenticateUser, getMeController);

// POST /api/auth/logout -> Cerrar sesión y limpiar cookie HttpOnly
authRouter.post('/logout', logoutController);

// PUT /api/auth/profile/:id -> Actualizar datos del perfil del usuario en MongoDB
authRouter.put('/profile/:id', authenticateUser, validateRequestOrigin, updateProfileController);

export default authRouter;


import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';

import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { connectDB } from './config/db';
import { env } from './config/env';

/**
 * Configuración principal de Express para NoLimits.
 * No abre puertos, por lo que puede utilizarse en Vercel y en tests.
 */
const app = express();

// Mantiene la configuración CORS existente.
// Debe revisarse su restricción de orígenes antes de operar en producción.
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Permite leer las cookies de autenticación.
app.use(cookieParser());

// Permite recibir cuerpos JSON hasta el límite configurado.
app.use(express.json({ limit: '10mb' }));

// En Vercel no se ejecuta server.ts, por lo que debemos
// inicializar la conexión desde la aplicación Express.
if (process.env.VERCEL === '1') {
  app.use(async (_req, res, next) => {
    try {
      // Verifica que la clave JWT cumpla el mínimo requerido.
      if (env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
      }

      // Conecta MongoDB o reutiliza la conexión existente.
      await connectDB();

      // Permite continuar hacia la ruta solicitada.
      next();
    } catch (error) {
      // Registra el problema en los Runtime Logs.
      console.error('[VERCEL] Error inicializando NoLimits:', error);

      // Informa el problema sin revelar credenciales.
      res.status(503).json({
        success: false,
        message: 'La API no está disponible temporalmente',
      });
    }
  });
}

// Ruta informativa principal del backend.
app.get('/', (_req, res) => {
  // Comprueba si MongoDB está conectado.
  const databaseConnected = mongoose.connection.readyState === 1;

  // Devuelve el estado del servicio.
  res.status(databaseConnected ? 200 : 503).json({
    service: 'No Limits API Backend',
    status: databaseConnected ? 'online' : 'database_disconnected',
    mongodbConnected: databaseConnected,
    database: databaseConnected ? mongoose.connection.name : null,
    healthEndpoint: '/api/health',
  });
});

// Conserva todas las rutas existentes del backend.
app.use('/api', apiRouter);

// Conserva el middleware global de errores.
app.use(errorHandler);

// Permite que Vercel utilice Express directamente.
export default app;

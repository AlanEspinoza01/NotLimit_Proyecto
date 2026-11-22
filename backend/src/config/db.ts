
import mongoose from 'mongoose';
import { env } from './env';
import { ensureBaseUsersSeeded } from '../services/auth.service';

// Conserva la promesa de conexión para reutilizarla entre solicitudes.
let connectionPromise: Promise<void> | null = null;

/**
 * Establece y reutiliza la conexión con MongoDB Atlas.
 * Compatible con desarrollo local y funciones de Vercel.
 */
export const connectDB = async (): Promise<void> => {
  // Evita abrir otra conexión cuando MongoDB ya está conectado.
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // Si hay una conexión en proceso, reutiliza esa misma operación.
  if (connectionPromise) {
    return connectionPromise;
  }

  // Inicia una conexión nueva cuando todavía no existe.
  connectionPromise = (async () => {
    // Evita intentar conectar utilizando una URI inexistente.
    if (!env.MONGODB_URI || env.MONGODB_URI.includes('[URL_OCULTA]')) {
      throw new Error('MONGODB_URI no está configurada correctamente');
    }

    // Conecta con la base de datos utilizada por NoLimits.
    await mongoose.connect(env.MONGODB_URI, {
      dbName: 'nolimits_db',
      serverSelectionTimeoutMS: 10000,
    });

    // Confirma la conexión sin imprimir credenciales.
    console.log(`[DB] Conectado a MongoDB (${env.NODE_ENV})`);

    // Conserva el procedimiento existente de usuarios iniciales.
    // auth.service.ts restringe los usuarios demo en producción.
    await ensureBaseUsersSeeded();
  })();

  try {
    // Espera el resultado de la conexión.
    await connectionPromise;
  } catch (error) {
    // Libera la promesa para permitir nuevos intentos.
    connectionPromise = null;

    // Registra el problema para diagnosticarlo en Vercel.
    console.error('[DB] Error conectando a MongoDB:', error);

    // Propaga el error sin terminar el proceso Node.js.
    throw error;
  }
};

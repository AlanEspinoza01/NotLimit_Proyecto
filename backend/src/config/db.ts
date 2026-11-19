import mongoose from 'mongoose';
import { env } from './env';
import { ensureBaseUsersSeeded } from '../services/auth.service';

/**
 * Gestor de conexión a MongoDB mediante Mongoose.
 */
export const connectDB = async (): Promise<void> => {
  try {
    // Conectar a MongoDB Atlas utilizando la base de datos de NoLimits.
    await mongoose.connect(env.MONGODB_URI, {
      // Seleccionar explícitamente la base de datos del proyecto.
      dbName: 'nolimits_db'
    });
    console.log(`[DB] Conectado exitosamente a MongoDB (${env.NODE_ENV})`);
    await ensureBaseUsersSeeded();
  } catch (error) {
    console.error('[DB] Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

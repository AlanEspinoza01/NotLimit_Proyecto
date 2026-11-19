import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

/**
 * server.ts: Punto de entrada principal del servidor.
 * Conecta a MongoDB y levanta el servidor HTTP en el puerto configurado.
 */
const startServer = async (): Promise<void> => {
  // Evitar crear usuarios si aún no existe una clave JWT segura.
  if (env.JWT_SECRET.length < 32) {
    throw new Error('Configura JWT_SECRET de al menos 32 caracteres en src/middleware/.env');
  }
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`[BACKEND] No Limits API running on http://localhost:${env.PORT}/api`);
  });
};

startServer();

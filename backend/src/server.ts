import app from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

const startServer = async (): Promise<void> => {
  // Comprueba que exista una clave JWT suficientemente segura.
  if (env.JWT_SECRET.length < 32) {
    throw new Error('Configura JWT_SECRET de al menos 32 caracteres en src/middleware/.env');
  }

  // Conecta MongoDB antes de iniciar el servidor local.
  await connectDB();

  // Abre el puerto HTTP para trabajar localmente.
  app.listen(env.PORT, () => {
    console.log(`[BACKEND] No Limits API running on http://localhost:${env.PORT}/api`);
  });
};

// Inicia la aplicación en el entorno local.
startServer();
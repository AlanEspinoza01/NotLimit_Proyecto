import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// Importar mongoose al inicio de app.ts, junto con los demás imports.
import mongoose from 'mongoose';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';

/**
 * app.ts: Configura la aplicación Express (middlewares globales, CORS, cookies, JSON, rutas y errores)
 * sin abrir el puerto de red, lo que permite importarla directamente en tests/.
 */
const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Registrar una ruta GET para la dirección principal del backend.
app.get('/', (_req, res) => {

  // Comprobar si Mongoose mantiene una conexión activa con MongoDB.
  const databaseConnected = mongoose.connection.readyState === 1;

  // Devolver el estado del backend en formato JSON.
  res.status(databaseConnected ? 200 : 503).json({

    // Identificar el servicio que está respondiendo.
    service: 'No Limits API Backend',

    // Informar si el backend tiene conexión a la base de datos.
    status: databaseConnected ? 'online' : 'database_disconnected',

    // Informar si MongoDB está conectado.
    mongodbConnected: databaseConnected,

    // Mostrar el nombre real de la base de datos utilizada.
    database: databaseConnected ? mongoose.connection.name : null,

    // Indicar la ruta para consultar la salud de la API.
    healthEndpoint: '/api/health'

  });
});

// Rutas principales de la API
app.use('/api', apiRouter);

// Middleware global de manejo de errores
app.use(errorHandler);

export default app;

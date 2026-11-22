import axios from 'axios';
import { beginGlobalLoading } from '../components/spinner/loadingStore';

// Usamos /api del mismo origen: Vite lo envía al proxy local y Vercel al backend.
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Creamos la instancia centralizada
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ¡CRÍTICO! Permite enviar y recibir la cookie HttpOnly 'no_limits_session'
  headers: {
    'Accept': 'application/json'
  },
});

// Registro compartido: cada petición debe finalizar una sola vez, incluso si responde con error.
const loadingRequests = new WeakMap<object, () => void>();

const finishRequestLoading = (config: object | undefined): void => {
  if (!config) return;
  const finish = loadingRequests.get(config);
  if (!finish) return;
  loadingRequests.delete(config);
  finish();
};

// Las vistas usan este cliente para cargar información. No alteramos datos ni cabeceras.
api.interceptors.request.use((config) => {
  loadingRequests.set(config, beginGlobalLoading());
  return config;
});

// (Opcional) Interceptor de respuestas para manejar errores globales (como el 401 y 423)
api.interceptors.response.use(
  (response) => {
    finishRequestLoading(response.config);
    return response;
  },
  (error) => {
    // Cerrar también al recibir 401, 403, 500, abortos y fallas de red.
    if (axios.isAxiosError(error)) finishRequestLoading(error.config);
    // Si la sesión expira (401) o la cuenta se bloquea (423), puedes manejarlo aquí globalmente
    if (error.response?.status === 401) {
      console.warn('Sesión expirada o no autorizada');
      // Podrías despachar un evento o redirigir al login si es necesario
    }
    return Promise.reject(error);
  }
);

export default api;

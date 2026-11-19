import axios from 'axios';

// Usamos la variable de entorno de Vite o el puerto 5000 por defecto para desarrollo local
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Creamos la instancia centralizada
export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ¡CRÍTICO! Permite enviar y recibir la cookie HttpOnly 'no_limits_session'
  headers: {
    'Accept': 'application/json'
  },
});

// (Opcional) Interceptor de respuestas para manejar errores globales (como el 401 y 423)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si la sesión expira (401) o la cuenta se bloquea (423), puedes manejarlo aquí globalmente
    if (error.response?.status === 401) {
      console.warn('Sesión expirada o no autorizada');
      // Podrías despachar un evento o redirigir al login si es necesario
    }
    return Promise.reject(error);
  }
);

export default api;
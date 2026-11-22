/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BranchProvider } from './context/BranchContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AdminNotificationProvider } from './context/AdminNotificationContext';
import { TopNavBar } from './components/layout/TopNavBar';
import { OSDesktopTaskbar } from './components/layout/OSDesktopTaskbar';
import { AppRoutes } from './routes/AppRoutes';
import { ClippyWidget } from './clippy/ClippyWidget';
import { GlobalSpinnerController } from './components/spinner/GlobalSpinner';
// Instancia de Axios: /api funciona tanto con el proxy local como en Vercel.
import { api } from './api/axios';
import {
  loadCustomBackgroundConfig,
  STORAGE_BACKGROUND_KEY,
  type CustomBackgroundConfig
} from './views/admin/PageEditorView';

export default function App() {
  const [customBg, setCustomBg] = useState<CustomBackgroundConfig>(() =>
    loadCustomBackgroundConfig()
  );

  useEffect(() => {
    // Evita actualizar el componente si el usuario cambia de página al desmontarlo.
    let mounted = true;

    // Identificador para descartar respuestas antiguas cuando hay varias solicitudes.
    let latestRequest = 0;

    // Muestra inmediatamente el respaldo local mientras se consulta MongoDB.
    const syncLocalBackground = () => {
      if (mounted) setCustomBg(loadCustomBackgroundConfig());
    };

    // MongoDB es la fuente oficial del fondo visible para todos los visitantes.
    const loadOfficialBackground = async (): Promise<void> => {
      // Una respuesta anterior nunca debe sobrescribir una edición reciente.
      const requestId = ++latestRequest;

      try {
        // Consultar la ruta pública, sin permisos administrativos.
        // El parámetro cambia en cada consulta para evitar respuestas obsoletas.
        const response = await api.get('/store-settings', {
          params: { _ts: Date.now() }
        });

        // Ignorar solicitudes antiguas o efectos desmontados.
        if (!mounted || requestId !== latestRequest) return;

        // El backend devuelve { success: true, data: { backgroundConfig: ... } }.
        const raw = response.data?.data?.backgroundConfig;
        if (!raw || typeof raw !== 'object') return;

        // Normalizar los campos para impedir valores incompletos.
        const officialBg: CustomBackgroundConfig = {
          imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : '',
          fileName: typeof raw.fileName === 'string' ? raw.fileName : '',
          fitMode: raw.fitMode === 'contain' || raw.fitMode === 'repeat'
            ? raw.fitMode
            : 'cover',
          updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : ''
        };

        // Aplicar el fondo oficial sin necesidad de entrar al panel admin.
        setCustomBg(officialBg);

        try {
          // Guardar la versión oficial como respaldo para futuras visitas.
          localStorage.setItem(STORAGE_BACKGROUND_KEY, JSON.stringify(officialBg));
        } catch {
          // La visualización seguirá funcionando si localStorage está bloqueado.
          console.warn('[FONDO] localStorage no está disponible.');
        }
      } catch (error) {
        // Conservar el fondo local mientras la API no esté disponible.
        if (mounted && requestId === latestRequest) {
          console.warn('[FONDO] No se pudo cargar MongoDB:', error);
        }
      }
    };

    // Reflejar las ediciones del admin inmediatamente, incluso las vistas previas.
    // No volvemos a consultar MongoDB aquí porque el editor permite previsualizar
    // cambios de tamaño antes de guardarlos y una lectura podría sobrescribirlos.
    const handleBackgroundUpdated = () => {
      syncLocalBackground();
    };

    // El evento storage se emite en otras pestañas del mismo dominio.
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_BACKGROUND_KEY || event.key === null) {
        handleBackgroundUpdated();
      }
    };

    window.addEventListener('nl_background_updated', handleBackgroundUpdated);
    window.addEventListener('storage', handleStorage);

    // Al iniciar, siempre revisar el fondo vigente en Atlas.
    void loadOfficialBackground();

    return () => {
      mounted = false;
      latestRequest += 1;
      window.removeEventListener('nl_background_updated', handleBackgroundUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  
  return (
    <HashRouter {...({ useTransitions: false } as Record<string, unknown>)}>
      <AuthProvider>
        <BranchProvider>
          <CartProvider>
            <WishlistProvider>
              <AdminNotificationProvider>
                {/* Escritorio Windows XP con Tapiz Clásico "Bliss" o Fondo Personalizado del Dueño */}
                <div
                  className={`min-h-screen ${
                    !customBg.imageUrl ? 'winxp-bliss-background' : 'bg-[#0a1224]'
                  } text-gray-900 flex flex-col selection:bg-[#316ac5] selection:text-white pb-14 font-sans`}
                  style={
                    customBg.imageUrl
                      ? {
                          backgroundImage: `url("${customBg.imageUrl}")`,
                          backgroundSize:
                            customBg.fitMode === 'contain'
                              ? 'contain'
                              : customBg.fitMode === 'repeat'
                              ? 'auto'
                              : 'cover',
                          backgroundRepeat:
                            customBg.fitMode === 'repeat' ? 'repeat' : 'no-repeat',
                          backgroundPosition: 'center center',
                          backgroundAttachment: 'fixed'
                        }
                      : undefined
                  }
                >
                {/* Barra de Navegación Estilo Internet Explorer 6 / Windows Explorer */}
                <TopNavBar />

                {/* Área de Visualización Principal (Ventanas y Contenido Blanco Limpio) */}
                <main className="flex-1 w-full min-w-0 max-w-[96%] xl:max-w-[1580px] 2xl:max-w-[1680px] mx-auto px-2 sm:px-3 py-3 relative z-10">
                  <AppRoutes />
                </main>

                {/* Barra de Tareas Inferior Windows XP Luna Blue con Menú de Expansión Corporativo */}
                <OSDesktopTaskbar />
                {/* Clippy se monta de forma aislada y se oculta en el panel administrativo. */}
                <ClippyWidget />
                {/* Carga global de sesión, rutas y solicitudes de datos. */}
                <GlobalSpinnerController />
              </div>
            </AdminNotificationProvider>
          </WishlistProvider>
        </CartProvider>
      </BranchProvider>
    </AuthProvider>
  </HashRouter>
);
}

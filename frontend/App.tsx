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
import { GlobalSpinnerController } from './components/spinner/GlobalSpinner';
import {
  loadCustomBackgroundConfig,
  CustomBackgroundConfig
} from './views/admin/PageEditorView';

export default function App() {
  const [customBg, setCustomBg] = useState<CustomBackgroundConfig>(() =>
    loadCustomBackgroundConfig()
  );

  useEffect(() => {
    const syncBackground = () => {
      setCustomBg(loadCustomBackgroundConfig());
    };
    window.addEventListener('nl_background_updated', syncBackground);
    window.addEventListener('storage', syncBackground);
    return () => {
      window.removeEventListener('nl_background_updated', syncBackground);
      window.removeEventListener('storage', syncBackground);
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

import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getGlobalLoadingCount, subscribeGlobalLoading } from './loadingStore';
import './GlobalSpinner.css';

/** La carga se muestra por trabajo real, sin imponer la espera de 4,5 s del ejemplo. */
const NETWORK_SHOW_DELAY_MS = 130; // Evita destellos en solicitudes muy rápidas.
const MIN_VISIBLE_MS = 330; // Evita que la animación parpadee al finalizar.
const ROUTE_TRANSITION_MS = 230; // Breve transición entre vistas ya montadas.

interface GlobalSpinnerProps {
  active: boolean;
}

/** Reproduce solo el BOOT del ejemplo XP; no inserta el login ni el escritorio de CodePen. */
export const GlobalSpinner: React.FC<GlobalSpinnerProps> = ({ active }) => {
  // El primer render muestra la pantalla directamente cuando todavía se valida la sesión.
  const [visible, setVisible] = useState(active);
  const shownAt = useRef(active ? Date.now() : 0);

  useEffect(() => {
    if (active && visible) return;
    if (!active && !visible) return;

    // Al iniciar una petición, esperar brevemente para evitar parpadeos de red.
    // Al terminar, mantener una visibilidad mínima para que la salida sea legible.
    const wait = active
      ? NETWORK_SHOW_DELAY_MS
      : Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt.current));
    const timeout = window.setTimeout(() => {
      if (active) shownAt.current = Date.now();
      setVisible(active);
    }, wait);
    return () => window.clearTimeout(timeout);
  }, [active, visible]);

  if (!visible) return null;

  return (
    <div className="nl-spinner-overlay" role="status" aria-live="polite" aria-label="Cargando NoLimits">
      <div className="nl-spinner-content">
        <div className="nl-spinner-logo" aria-hidden="true">
          <span className="nl-spinner-pane nl-spinner-red" />
          <span className="nl-spinner-pane nl-spinner-green" />
          <span className="nl-spinner-pane nl-spinner-blue" />
          <span className="nl-spinner-pane nl-spinner-yellow" />
        </div>
        <a
          className="nl-spinner-brand"
          href="https://nolimitsbrand.cl/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Visitar nolimitsbrand.cl"
        >
          nolimits<span>brand.cl</span>
        </a>
        <div className="nl-spinner-track" aria-hidden="true">
          <div className="nl-spinner-progress" />
        </div>
        <span className="nl-spinner-description">Cargando...</span>
      </div>
    </div>
  );
};

/** Único observador para el arranque, cambios de ruta y solicitudes HTTP rastreadas. */
export const GlobalSpinnerController: React.FC = () => {
  const { isLoading: checkingSession } = useAuth();
  const { pathname, search } = useLocation();
  const pendingRequests = useSyncExternalStore(
    subscribeGlobalLoading,
    getGlobalLoadingCount,
    getGlobalLoadingCount
  );

  const route = `${pathname}${search}`;
  const previousRoute = useRef(route);
  const [changingPage, setChangingPage] = useState(false);

  useEffect(() => {
    // La carga inicial depende de AuthContext; esta transición solo aplica a páginas nuevas.
    if (previousRoute.current === route) return;
    previousRoute.current = route;
    setChangingPage(true);
    const timeout = window.setTimeout(() => setChangingPage(false), ROUTE_TRANSITION_MS);
    return () => window.clearTimeout(timeout);
  }, [route]);

  return <GlobalSpinner active={checkingSession || changingPage || pendingRequests > 0} />;
};

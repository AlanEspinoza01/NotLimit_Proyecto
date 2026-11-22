import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, PackageSearch, TriangleAlert } from 'lucide-react';
import { WindowFrame } from '../components/layout/WindowFrame';
import { DinoGame } from '../not-found/DinoGame';
import '../not-found/NotFound.css';

/**
 * Página 404 de NoLimits: conserva las barras y el fondo oficial de App.tsx.
 * Se presenta únicamente cuando React Router no reconoce la dirección.
 */
export const NotFoundView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="nl-404-shell">
      <WindowFrame
        title="PAGINA_NO_ENCONTRADA.EXE - [Error 404 · NoLimits]"
        icon={<TriangleAlert size={16} aria-hidden="true" />}
        showControls={false}
        className="nl-404-window"
        bodyClassName="nl-404-window-body"
        statusBarText="ERROR HTTP 404 // RUTA NO ENCONTRADA // DINO_RUN.EXE LISTO PARA JUGAR"
      >
        <div className="nl-404-inner">
          <div className="nl-404-intro">
            <div className="nl-404-error-code" aria-hidden="true">404</div>
            <div>
              <p className="nl-404-label">NO LIMITS · EXPLORADOR DE ARCHIVOS</p>
              <h1>¡Oops! Esta página no existe.</h1>
              <p>Al parecer llegaste a una dirección que no está disponible. Pero tranqui: nuestro dino encontró un minijuego mientras buscamos el camino de regreso. 🦖</p>
            </div>
          </div>

          <div className="nl-404-notice">
            <TriangleAlert size={18} aria-hidden="true" />
            <span><strong>404 — Archivo no encontrado.</strong> Comprueba el enlace o vuelve a una sección disponible.</span>
          </div>

          <DinoGame />

          <nav className="nl-404-links" aria-label="Opciones para volver a la tienda">
            <button type="button" className="winxp-button" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} aria-hidden="true" /> Volver atrás
            </button>
            <Link to="/" className="winxp-button nl-404-primary">
              <Home size={16} aria-hidden="true" /> Ir al inicio
            </Link>
            <Link to="/catalog" className="winxp-button">
              <PackageSearch size={16} aria-hidden="true" /> Explorar catálogo
            </Link>
          </nav>
        </div>
      </WindowFrame>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import api from '../../api/axios';

// Tipado mínimo de Google Identity Services, sin instalar librerías en el frontend.
interface GoogleCredentialResponse { credential?: string }
interface GoogleIdentityApi {
  accounts: { id: {
    initialize(options: {client_id: string; callback: (response: GoogleCredentialResponse) => void;
      auto_select?: boolean; cancel_on_tap_outside?: boolean}): void;
    renderButton(element: HTMLElement, options: {theme: string; size: string; text: string;
      shape: string; width: number; locale: string}): void;
  }};
}
declare global { interface Window { google?: GoogleIdentityApi } }

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';

// Google exige que el botón sea renderizado por su SDK oficial.
const loadGoogleScript = (): Promise<void> => new Promise((resolve, reject) => {
  if (window.google?.accounts?.id) { resolve(); return; }
  const existing = document.querySelector<HTMLScriptElement>('script[data-nolimits-google="true"]');
  const script = existing || document.createElement('script');
  const onLoad = () => { cleanup(); resolve(); };
  const onError = () => { cleanup(); reject(new Error('No se pudo cargar Google Identity Services.')); };
  const cleanup = () => { script.removeEventListener('load', onLoad); script.removeEventListener('error', onError); };
  script.addEventListener('load', onLoad, { once: true });
  script.addEventListener('error', onError, { once: true });
  if (!existing) {
    script.src = SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.dataset.nolimitsGoogle = 'true';
    document.head.appendChild(script);
  }
  // Si otro montaje cargó la librería antes de anexar listeners.
  if (window.google?.accounts?.id) { cleanup(); resolve(); }
});

interface Props {
  onCredential: (credential: string) => Promise<void>;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<Props> = ({ onCredential, disabled = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [status, setStatus] = useState<'loading'|'ready'|'off'|'error'>('loading');
  useEffect(() => { callbackRef.current = onCredential; }, [onCredential]);
  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        // El Client ID es un identificador público. Todo lo secreto permanece en el backend.
        const { data } = await api.get<{enabled: boolean; clientId: string}>('/auth/google/config');
        if (!active) return;
        if (!data.enabled || !data.clientId) { setStatus('off'); return; }
        await loadGoogleScript();
        if (!active || !containerRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: data.clientId,
          auto_select: false,
          callback: ({ credential }) => {
            if (!active || !credential) return;
            void callbackRef.current(credential).catch(() => {
              // El error de la API se muestra desde AuthView, no se descarta.
            });
          },
        });
        containerRef.current.replaceChildren();
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline', size: 'large', text: 'continue_with',
          shape: 'rectangular', width: 300, locale: 'es',
        });
        setStatus('ready');
      } catch {
        if (!active) return;
        setStatus('error');
      }
    };
    void initialize();
    return () => { active = false; };
  }, []);
  return (
    <div className="space-y-1.5">
      <div className={`flex justify-center min-h-[42px] ${disabled ? 'opacity-60 pointer-events-none' : ''}`}>
        <div ref={containerRef} aria-label="Acceso oficial con Google" />
      </div>
      {status === 'loading' && <p className="text-[11px] text-center text-gray-500">Cargando acceso seguro con Google...</p>}
      {status === 'off' && <p className="text-[11px] text-center text-amber-800">Google aún no está configurado por el administrador.</p>}
      {status === 'error' && <p className="text-[11px] text-center text-red-700">No se pudo cargar el botón de Google. Comprueba la conexión o el bloqueo de cookies.</p>}
    </div>
  );
};

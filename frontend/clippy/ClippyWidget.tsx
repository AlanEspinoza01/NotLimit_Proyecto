import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, Send, X, Minus, Eye, ShoppingBag } from 'lucide-react';
import { CLIPPY_DRAG, CLIPPY_IDLE, CLIPPY_IN, CLIPPY_OUT, CLIPPY_READY } from './clippy.animations';
import { getClippyPublicConfig, sendClippyQuestion } from './clippy.api';
import { ClippyFaq, ClippyProduct, ClippyPublicConfig } from './clippy.types';
import './ClippyWidget.css';

type ChatMessage = { id: number; from: 'clippy' | 'visitor'; text: string; products?: ClippyProduct[]; suggestions?: string[]; contactUrl?: string; mode?: string };
const STORAGE_HIDDEN = 'nolimits_clippy_hidden';
const STORAGE_POSITION = 'nolimits_clippy_position';

const defaultPosition = () => ({
  x: typeof window !== 'undefined' ? Math.max(8, window.innerWidth - 140) : 30,
  y: typeof window !== 'undefined' ? Math.max(8, window.innerHeight - 234) : 80,
});
const clampPosition = (x: number, y: number) => ({
  x: Math.max(8, Math.min(x, window.innerWidth - 110)),
  y: Math.max(8, Math.min(y, window.innerHeight - 172)),
});

export const ClippyWidget: React.FC = () => {
  const { pathname } = useLocation();
  const [config, setConfig] = useState<ClippyPublicConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem(STORAGE_HIDDEN) === '1'; } catch { return false; } });
  const [transitioning, setTransitioning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [gif, setGif] = useState(CLIPPY_READY);
  const [position, setPosition] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_POSITION);
      if (raw) { const parsed = JSON.parse(raw); if (Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) return clampPosition(parsed.x, parsed.y); }
    } catch { /* El almacenamiento podría estar bloqueado. */ }
    return defaultPosition();
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const gesture = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const moved = useRef(false);
  const positionRef = useRef(position);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1);

  useEffect(() => { positionRef.current = position; }, [position]);
  useEffect(() => {
    let mounted = true;
    void getClippyPublicConfig().then((result) => {
      if (!mounted) return;
      setConfig(result);
      setMessages([{ id: nextId.current++, from: 'clippy', text: result.welcomeMessage }]);
    }).catch(() => { if (mounted) setConfig(null); });
    const onFocus = () => { void getClippyPublicConfig().then((result) => { if (mounted) setConfig(result); }).catch(() => {}); };
    window.addEventListener('focus', onFocus);
    return () => { mounted = false; window.removeEventListener('focus', onFocus); };
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(media.matches);
    sync(); media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);
  useEffect(() => {
    const onResize = () => setPosition((previous) => clampPosition(previous.x, previous.y));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, open]);

  // Ciclo de animaciones sin setInterval superpuestos y con limpieza garantizada.
  useEffect(() => {
    if (hidden || dragging || transitioning || open || reduceMotion || !config?.enabled || pathname.startsWith('/admin')) return;
    let done = false;
    let timer: ReturnType<typeof setTimeout>;
    const play = () => {
      if (done) return;
      const selected = CLIPPY_IDLE[Math.floor(Math.random() * CLIPPY_IDLE.length)];
      setGif(selected.src);
      timer = setTimeout(() => { if (!done) { setGif(CLIPPY_READY); timer = setTimeout(play, 9000); } }, selected.duration);
    };
    timer = setTimeout(play, 10000);
    // No reiniciar el GIF al limpiar: podría interrumpir bikeIn/bikeOut o arrastre.
    return () => { done = true; clearTimeout(timer); };
  }, [hidden, dragging, transitioning, open, reduceMotion, config?.enabled, pathname]);
  useEffect(() => () => { if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);

  const rememberPosition = (point: { x: number; y: number }) => {
    try { localStorage.setItem(STORAGE_POSITION, JSON.stringify(point)); } catch { /* Opcional. */ }
  };
  const pointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || hidden || transitioning) return;
    gesture.current = { x: event.clientX, y: event.clientY, startX: positionRef.current.x, startY: positionRef.current.y };
    moved.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const pointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    const start = gesture.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) + Math.abs(dy) > 9) {
      moved.current = true;
      setDragging(true);
      setGif(CLIPPY_DRAG);
    }
    if (moved.current) setPosition(clampPosition(start.startX + dx, start.startY + dy));
  };
  const pointerUp = () => {
    if (!gesture.current) return;
    gesture.current = null;
    if (moved.current) { rememberPosition(positionRef.current); setDragging(false); setGif(CLIPPY_READY); }
  };

  const toggleHide = () => {
    if (transitioning) return;
    setOpen(false);
    setTransitioning(true);
    setGif(CLIPPY_OUT.src);
    transitionTimer.current = setTimeout(() => {
      setHidden(true); setTransitioning(false); setGif(CLIPPY_READY);
      try { localStorage.setItem(STORAGE_HIDDEN, '1'); } catch { /* Ignorar. */ }
    }, reduceMotion ? 0 : CLIPPY_OUT.duration);
  };
  const show = () => {
    if (transitioning) return;
    setHidden(false); setTransitioning(true); setGif(CLIPPY_IN.src);
    try { localStorage.removeItem(STORAGE_HIDDEN); } catch { /* Ignorar. */ }
    transitionTimer.current = setTimeout(() => { setTransitioning(false); setGif(CLIPPY_READY); }, reduceMotion ? 0 : CLIPPY_IN.duration);
  };

  const ask = useCallback(async (payload: { question?: string; questionId?: string }, questionText: string) => {
    if (busy) return;
    setBusy(true);
    setInput('');
    setMessages((current) => [...current, { id: nextId.current++, from: 'visitor', text: questionText }]);
    try {
      const history: Array<{ role: 'user' | 'assistant'; text: string }> = messages.slice(-4).map((m) => ({
        role: m.from === 'visitor' ? 'user' : 'assistant', text: m.text.slice(0, 400),
      }));
      const result = await sendClippyQuestion({
        ...payload,
        // Gemini se activa automáticamente solo si lo habilitó el Super Admin.
        // Las preguntas frecuentes mantienen su respuesta guiada.
        allowGemini: Boolean(config?.aiEnabled) && !payload.questionId,
        // Conservar únicamente el contexto reciente cuando Gemini está activo.
        history: config?.aiEnabled && !payload.questionId ? history : [],
      });
      setMessages((current) => [...current, {
        id: nextId.current++, from: 'clippy', text: result.answer,
        products: result.products, suggestions: result.suggestions, contactUrl: result.contactUrl, mode: result.mode,
      }]);
    } catch (error: any) {
      const message = typeof error?.response?.data?.message === 'string'
        ? error.response.data.message
        : 'Ahora no puedo responder. Puedes consultar el catálogo o contactar directamente a la tienda.';
      setMessages((current) => [...current, { id: nextId.current++, from: 'clippy', text: message }]);
    } finally { setBusy(false); }
  }, [busy, messages, config?.aiEnabled]);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = input.trim();
    if (query.length < 4 || query.length > 500 || busy) return;
    void ask({ question: query }, query);
  };
  const askFaq = (faq: ClippyFaq) => { void ask({ questionId: faq.id }, faq.question); };

  // Clippy no obstaculiza la interfaz administrativa ni se monta si el dueño lo desactiva.
  if (pathname.startsWith('/admin') || !config?.enabled) return null;
  const panelWidth = Math.min(365, Math.max(280, window.innerWidth - 16));
  const panelHeight = Math.min(440, Math.max(290, window.innerHeight - 110));
  const panelX = Math.max(8, Math.min(window.innerWidth - panelWidth - 8, position.x - panelWidth + 110));
  const panelY = Math.max(8, Math.min(window.innerHeight - panelHeight - 60, position.y - panelHeight - 12));

  return (
    <div className="nl-clippy-layer" aria-label="Asistente Clippy">
      {hidden && <button type="button" className="nl-clippy-restore" onClick={show} aria-label="Mostrar a Clippy">📎 Mostrar Clippy</button>}
      {!hidden && (
        <>
          <div className="nl-clippy-character" style={{ left: position.x, top: position.y }}>
            <button type="button" className="nl-clippy-character-button" aria-label="Abrir chat con Clippy. Arrastra para mover." aria-expanded={open}
              onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}
              onClick={() => { if (!moved.current && !transitioning) { setGif(CLIPPY_READY); setOpen((was) => !was); } }}>
              {reduceMotion ? <span className="nl-clippy-static" aria-hidden="true">📎</span>
                : <img src={gif} alt="Clippy, asistente animado de la tienda" draggable={false} referrerPolicy="no-referrer" onError={() => setGif(CLIPPY_READY)} />}
              {!open && !dragging && <span className="nl-clippy-tooltip">¿Necesitas un look? ¡Pregúntame! 💬</span>}
            </button>
            <button type="button" title="Ocultar Clippy" aria-label="Ocultar Clippy" className="nl-clippy-hide" onClick={toggleHide}><Minus size={13}/></button>
          </div>
          {open && (
            <section className="nl-clippy-panel" role="dialog" aria-label="Chat de Clippy" style={{ left: panelX, top: panelY, width: panelWidth, height: panelHeight }}>
              <header className="nl-clippy-titlebar">
                <strong><MessageCircle size={15}/> Clippy.exe — Asesor NoLimits</strong>
                <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar chat"><X size={15}/></button>
              </header>
              <div className="nl-clippy-chat" aria-live="polite" aria-relevant="additions text">
                {messages.map((message) => (
                  <article key={message.id} className={`nl-clippy-bubble ${message.from === 'visitor' ? 'nl-clippy-me' : 'nl-clippy-bot'}`}>
                    <span className="nl-clippy-who">{message.from === 'visitor' ? 'Tú' : `📎 Clippy${message.mode === 'gemini' ? ' · Gemini' : ''}`}</span>
                    <p>{message.text}</p>
                    {Boolean(message.products?.length) && <div className="nl-clippy-products">
                      {message.products!.map((p) => <a className="nl-clippy-product" key={p.id} href={`/#/product/${encodeURIComponent(p.id)}`}>
                        {p.imageUrl && <img src={p.imageUrl} loading="lazy" alt={p.title} />}
                        <span><b>{p.title}</b><small>${Math.round(p.price).toLocaleString('es-CL')} CLP</small><small>Ver producto y tallas</small></span>
                      </a>)}
                    </div>}
                    {message.from === 'clippy' && Boolean(message.suggestions?.length) && <div className="nl-clippy-suggestions" aria-label="Respuestas rápidas sugeridas">
                      {message.suggestions!.slice(0, 4).map((option) => <button key={option} type="button" disabled={busy} onClick={() => void ask({ question: option }, option)}>{option}</button>)}
                    </div>}
                    {message.contactUrl?.startsWith('https://wa.me/') && <a className="nl-clippy-contact" href={message.contactUrl} rel="noopener noreferrer" target="_blank">Consultar a la tienda por WhatsApp</a>}
                  </article>
                ))}
                {busy && <p className="nl-clippy-thinking">Clippy está pensando…</p>}
                <div ref={chatBottomRef}/>
              </div>
              <div className="nl-clippy-faqs" aria-label="Preguntas frecuentes">
                {config.faqs.slice(0, 10).map((faq) => <button type="button" key={faq.id} disabled={busy} onClick={() => askFaq(faq)} title={faq.answer}>{faq.category} · {faq.question}</button>)}
              </div>
              <form onSubmit={submit} className="nl-clippy-form">
                <input aria-label="Consulta a Clippy" placeholder="¿Qué me pongo para una cita?" value={input} maxLength={500} onChange={(e) => setInput(e.target.value)} disabled={busy}/>
                <button type="submit" disabled={busy || input.trim().length < 4} aria-label="Enviar pregunta"><Send size={17}/></button>
              </form>
              <footer className="nl-clippy-footer"><ShoppingBag size={12}/> Recomienda solo productos públicos · No compartas datos personales.</footer>
            </section>
          )}
        </>
      )}
    </div>
  );
};

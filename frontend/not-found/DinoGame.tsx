import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import {
  advanceDinoState,
  createDinoState,
  DINO_GROUND_Y,
  DINO_HEIGHT,
  DINO_SPRITE_HEIGHT,
  DINO_SPRITE_WIDTH,
  DINO_WIDTH,
  DINO_X,
  playerDinoAction,
  type DinoState,
  type DinoStatus,
} from './dino.logic';
import { createDinoSounds, type DinoSounds } from './dino.sounds';
import { soundForDinoFrame, soundForPlayerAction, type DinoSoundKind } from './dino.sound-events';

// Sprites incluidos en el proyecto: no necesitan CDN ni conexión adicional.
import trexUrl from './assets/trex.png';
import smallCactusUrl from './assets/cactus-small.png';
import largeCactusUrl from './assets/cactus-large.png';
import cloudUrl from './assets/cloud.png';
import horizonUrl from './assets/horizon.png';

type SpriteName = 'trex' | 'small' | 'large' | 'cloud' | 'horizon';
type Sprites = Partial<Record<SpriteName, HTMLImageElement>>;

/** Dibuja un dinosaurio provisional mientras terminan de cargar los sprites. */
const drawFallbackDino = (ctx: CanvasRenderingContext2D, y: number) => {
  ctx.fillStyle = '#535353';
  ctx.fillRect(DINO_X + 12, y + 18, 22, 22);
  ctx.fillRect(DINO_X + 21, y + 3, 20, 22);
  ctx.fillRect(DINO_X + 14, y + 35, 6, 12);
  ctx.fillRect(DINO_X + 29, y + 35, 6, 12);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(DINO_X + 32, y + 8, 4, 4);
};

/** Renderiza el escenario a resolución constante para mantener el efecto pixel-art. */
const drawDinoScene = (canvas: HTMLCanvasElement | null, state: DinoState, sprites: Sprites) => {
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, DINO_WIDTH, DINO_HEIGHT);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, DINO_WIDTH, DINO_HEIGHT);

  // Algunas nubes se desplazan visualmente, pero jamás activan el juego.
  if (sprites.cloud?.complete) {
    const offset = state.scrollX * 0.13;
    for (let index = 0; index < 3; index += 1) {
      const x = ((index * 255 + 100 - offset) % 765 + 765) % 765 - 70;
      ctx.drawImage(sprites.cloud, Math.round(x), 24 + (index % 2) * 23);
    }
  }

  // Suelo inspirado en el juego clásico, con textura continua.
  if (sprites.horizon?.complete) {
    const offset = Math.floor(state.scrollX % 1200);
    ctx.drawImage(sprites.horizon, -offset, DINO_GROUND_Y - 2);
    ctx.drawImage(sprites.horizon, 1200 - offset, DINO_GROUND_Y - 2);
  } else {
    ctx.fillStyle = '#6b6b6b';
    ctx.fillRect(0, DINO_GROUND_Y, DINO_WIDTH, 1);
  }

  // El salto modifica únicamente la posición vertical tras una pulsación explícita.
  const dinoY = Math.round(DINO_GROUND_Y - DINO_SPRITE_HEIGHT - state.jumpHeight);
  if (sprites.trex?.complete) {
    const runningFrame = Math.floor(state.elapsed * 9) % 2 === 0 ? 2 : 3;
    const frame = state.status === 'gameover' ? 4 : state.jumpHeight > 0 ? 0 : state.status === 'running' ? runningFrame : 0;
    ctx.drawImage(sprites.trex, frame * DINO_SPRITE_WIDTH, 0, DINO_SPRITE_WIDTH, DINO_SPRITE_HEIGHT,
      DINO_X, dinoY, DINO_SPRITE_WIDTH, DINO_SPRITE_HEIGHT);
  } else {
    drawFallbackDino(ctx, dinoY);
  }

  // Cada cactus se extrae de los sprites disponibles. No hay IA ni autoesquive.
  for (const obstacle of state.obstacles) {
    const image = sprites[obstacle.kind];
    const y = DINO_GROUND_Y - obstacle.height;
    if (image?.complete) {
      ctx.drawImage(image, 0, 0, obstacle.width, obstacle.height,
        Math.round(obstacle.x), y, obstacle.width, obstacle.height);
    } else {
      ctx.fillStyle = '#535353';
      ctx.fillRect(Math.round(obstacle.x) + 5, y, obstacle.width - 9, obstacle.height);
    }
  }

  // Marcador tipo Chrome Dino; no se envía a la API ni guarda datos personales.
  ctx.fillStyle = '#626262';
  ctx.font = '15px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`HI ${String(state.best).padStart(5, '0')}  ${String(Math.floor(state.score)).padStart(5, '0')}`, DINO_WIDTH - 18, 23);

  if (state.status === 'gameover') {
    ctx.textAlign = 'center';
    ctx.font = 'bold 17px monospace';
    ctx.fillText('GAME OVER', DINO_WIDTH / 2, 67);
    ctx.font = '13px monospace';
    ctx.fillText('ESPACIO O CLIC PARA REINICIAR', DINO_WIDTH / 2, 88);
  }
};

const spriteSources: Record<SpriteName, string> = {
  trex: trexUrl,
  small: smallCactusUrl,
  large: largeCactusUrl,
  cloud: cloudUrl,
  horizon: horizonUrl,
};

/** Componente independiente que solo se monta en la ruta 404. */
export const DinoGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<DinoState>(createDinoState());
  const spritesRef = useRef<Sprites>({});
  const frameRef = useRef<number | null>(null);
  const soundsRef = useRef<DinoSounds | null>(null);
  // Activo por defecto: el usuario puede silenciarlo sin cambiar otros sonidos de la tienda.
  const soundsEnabledRef = useRef(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [status, setStatus] = useState<DinoStatus>('idle');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  // Solo este helper reproduce audio; nunca modifica la física ni activa saltos.
  const playSound = useCallback((kind: DinoSoundKind) => {
    if (soundsEnabledRef.current) soundsRef.current?.play(kind);
  }, []);

  // «playerDinoAction» NO se ejecuta desde la animación ni desde temporizadores.
  const handlePlayerAction = useCallback(() => {
    // Es la única acción que inicia el juego o hace saltar al dinosaurio.
    const result = playerDinoAction(gameRef.current);
    const sound = soundForPlayerAction(result);
    if (sound) playSound(sound);
    if (result === 'started' || result === 'restarted') {
      setScore(0);
      setStatus('running');
    }
    drawDinoScene(canvasRef.current, gameRef.current, spritesRef.current);
  }, [playSound]);

  // Los sonidos se preparan al abrir la vista, pero NO se reproducen automáticamente.
  useEffect(() => {
    soundsRef.current = createDinoSounds();
    return () => { soundsRef.current?.stop(); soundsRef.current = null; };
  }, []);

  // El volumen afecta solo al Dino 404, sin silenciar el resto de NoLimits.
  const toggleSounds = () => {
    const next = !soundsEnabledRef.current;
    soundsEnabledRef.current = next;
    setSoundsEnabled(next);
    if (!next) soundsRef.current?.stop();
  };

  // Los sprites se cargan desde archivos locales del bundle, con limpieza al desmontar.
  useEffect(() => {
    let mounted = true;
    (Object.keys(spriteSources) as SpriteName[]).forEach((key) => {
      const image = new Image();
      image.onload = () => { if (mounted) drawDinoScene(canvasRef.current, gameRef.current, spritesRef.current); };
      image.src = spriteSources[key];
      spritesRef.current[key] = image;
    });
    drawDinoScene(canvasRef.current, gameRef.current, spritesRef.current);
    return () => { mounted = false; spritesRef.current = {}; };
  }, []);

  // Solo la barra espaciadora inicia o hace saltar al dinosaurio.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      // No interceptar escritura, botones de navegación, enlaces ni el chat de Clippy.
      if (target instanceof HTMLElement &&
        (target.isContentEditable || target.closest('input, textarea, select, button, a, [contenteditable="true"], .nl-clippy-layer, [role="dialog"]'))) return;
      event.preventDefault();
      handlePlayerAction();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlePlayerAction]);

  // El motor y requestAnimationFrame se activan exclusivamente al iniciar la partida.
  useEffect(() => {
    if (status !== 'running') {
      drawDinoScene(canvasRef.current, gameRef.current, spritesRef.current);
      return;
    }

    let previousTime: number | null = null;
    let displayedScore = -1;
    const frame = (now: number) => {
      if (previousTime !== null) {
        // La física avanza de forma independiente del audio.
        const previousScore = gameRef.current.score;
        const previousStatus = gameRef.current.status;
        advanceDinoState(gameRef.current, (now - previousTime) / 1000);
        const effect = soundForDinoFrame(
          previousScore, gameRef.current.score, previousStatus, gameRef.current.status,
        );
        if (effect) playSound(effect);
      }
      previousTime = now;
      drawDinoScene(canvasRef.current, gameRef.current, spritesRef.current);
      const currentScore = Math.floor(gameRef.current.score);
      if (currentScore !== displayedScore) {
        displayedScore = currentScore;
        setScore(currentScore);
      }
      if (gameRef.current.status === 'gameover') {
        setBest(gameRef.current.best);
        setStatus('gameover');
        return;
      }
      frameRef.current = window.requestAnimationFrame(frame);
    };
    frameRef.current = window.requestAnimationFrame(frame);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [status, playSound]);

  const statusText = status === 'idle'
    ? 'Presiona ESPACIO o haz clic en el dinosaurio para empezar.'
    : status === 'running'
      ? '¡Corre! Presiona ESPACIO o haz clic para saltar los cactus.'
      : '¡Ups! Chocaste. Presiona ESPACIO o haz clic para intentarlo otra vez.';

  return (
    <section className="nl-404-game" aria-label="Juego del dinosaurio">
      <div className="nl-404-game-head">
        <strong>DINO_RUN.EXE</strong>
        <span aria-live="polite">Puntos: {score} · Récord: {best}</span>
        <button
          type="button"
          className="winxp-button nl-404-sound-toggle"
          onClick={toggleSounds}
          aria-label={soundsEnabled ? 'Silenciar sonidos del dinosaurio' : 'Activar sonidos del dinosaurio'}
          aria-pressed={!soundsEnabled}
          title={soundsEnabled ? 'Silenciar juego' : 'Activar sonido'}
        >
          {soundsEnabled ? <Volume2 size={14} aria-hidden="true"/> : <VolumeX size={14} aria-hidden="true"/>}
          <span>{soundsEnabled ? 'Sonido' : 'Silenciado'}</span>
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={DINO_WIDTH}
        height={DINO_HEIGHT}
        className="nl-404-canvas"
        role="button"
        tabIndex={0}
        aria-label="Juego del dinosaurio. Pulsa espacio o haz clic para iniciar, saltar o reiniciar."
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.focus();
          handlePlayerAction();
        }}
      />
      <div className="nl-404-game-controls">
        <p role="status" aria-live="polite">{statusText}</p>
        <button type="button" className="winxp-button nl-404-action" onClick={handlePlayerAction}>
          {status === 'idle' ? '▶ Iniciar partida' : status === 'gameover' ? '↻ Reintentar' : '↑ Saltar'}
        </button>
      </div>
    </section>
  );
};

/**
 * Reproductor de sonidos del minijuego 404.
 * Los tres efectos provienen de los recursos Chromium aportados como referencia.
 * Se sirven desde Vite como recursos locales, sin CDN ni permisos de audio especiales.
 */
import pressUrl from './assets/dino-press.ogg';
import hitUrl from './assets/dino-hit.ogg';
import reachedUrl from './assets/dino-reached.ogg';
import type { DinoSoundKind } from './dino.sound-events';

export interface DinoSounds {
  play: (kind: DinoSoundKind) => void;
  stop: () => void;
}

const SOURCES: Record<DinoSoundKind, string> = {
  press: pressUrl,
  hit: hitUrl,
  reached: reachedUrl,
};

/** Crear los audios solo cuando se monta la página 404. */
export const createDinoSounds = (): DinoSounds => {
  const players = {} as Record<DinoSoundKind, HTMLAudioElement>;

  // Preparamos las pistas sin reproducirlas. El navegador decide cuándo cargarlas.
  (Object.keys(SOURCES) as DinoSoundKind[]).forEach((kind) => {
    const audio = new Audio(SOURCES[kind]);
    audio.preload = 'auto';
    audio.volume = kind === 'hit' ? 0.55 : 0.48;
    players[kind] = audio;
  });

  return {
    play: (kind) => {
      const audio = players[kind];
      try {
        // Repetir una pulsación auténtica permite escuchar saltos consecutivos.
        audio.pause();
        audio.currentTime = 0;
        // Algunos navegadores bloquean audio antes de la primera interacción.
        // El juego solo llama a esta función tras iniciar manualmente.
        void audio.play().catch(() => {});
      } catch {
        // Si el navegador no admite audio, el juego permanece funcional.
      }
    },
    stop: () => {
      // Silenciar o desmontar la vista detiene cualquier efecto en curso.
      (Object.keys(players) as DinoSoundKind[]).forEach((kind) => {
        players[kind].pause();
      });
    },
  };
};

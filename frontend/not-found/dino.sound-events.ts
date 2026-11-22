/**
 * Reglas puras para decidir cuándo suena el Dino 404.
 * No leen teclado, no mueven el personaje y nunca provocan saltos.
 */
import type { DinoStatus } from './dino.logic';

export type DinoSoundKind = 'press' | 'hit' | 'reached';
export type DinoPlayerAction = 'started' | 'restarted' | 'jumped' | 'ignored';

/** Inicio, reinicio y salto manual comparten el sonido clásico de pulsación. */
export const soundForPlayerAction = (result: DinoPlayerAction): DinoSoundKind | null =>
  result === 'ignored' ? null : 'press';

/** Sonido de choque o de un nuevo centenar de puntos. */
export const soundForDinoFrame = (
  previousScore: number,
  currentScore: number,
  previousStatus: DinoStatus,
  currentStatus: DinoStatus,
): DinoSoundKind | null => {
  // Si hubo choque, priorizar ese sonido sobre el de puntuación.
  if (previousStatus === 'running' && currentStatus === 'gameover') return 'hit';
  if (previousStatus !== 'running' || currentStatus !== 'running') return null;

  // El sonido de logro solo aparece al cruzar 100, 200, 300... puntos.
  if (Math.floor(currentScore / 100) > Math.floor(previousScore / 100)) return 'reached';
  return null;
};

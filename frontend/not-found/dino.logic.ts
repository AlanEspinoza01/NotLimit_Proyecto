/**
 * Motor aislado del minijuego 404. No usa DOM, React, red ni almacenamiento.
 * Toda la física avanza únicamente cuando el estado está en «running».
 * El salto SOLO puede iniciarse desde playerDinoAction(), invocada por un
 * evento real del visitante; nunca se llama desde el bucle de animación.
 */

export type DinoStatus = 'idle' | 'running' | 'gameover';

export interface DinoObstacle {
  x: number;                       // Posición horizontal dentro del lienzo.
  width: number;                   // Ancho del cactus para dibujar y detectar choque.
  height: number;                  // Altura del cactus.
  kind: 'small' | 'large';          // Sprite que representa el obstáculo.
}

export interface DinoState {
  status: DinoStatus;              // Solo «running» permite avanzar.
  jumpHeight: number;             // Distancia entre el dinosaurio y el suelo.
  velocityY: number;              // Velocidad positiva hacia arriba.
  elapsed: number;                // Tiempo efectivo de la partida.
  scrollX: number;                // Desplazamiento visual del suelo.
  score: number;                  // Puntos acumulados, sin red ni base de datos.
  best: number;                   // Mejor puntuación en esta visita.
  nextObstacleIn: number;         // Temporizador para generar cactus.
  obstacles: DinoObstacle[];      // Obstáculos visibles/activos.
}

export const DINO_WIDTH = 600;
export const DINO_HEIGHT = 185;
export const DINO_GROUND_Y = 149;
export const DINO_X = 57;
export const DINO_SPRITE_WIDTH = 44;
export const DINO_SPRITE_HEIGHT = 47;

const JUMP_FORCE = 590;           // Impulso manual al saltar (px/s).
const GRAVITY = 1790;             // Aceleración vertical (px/s²).
const MAX_STEP = 0.05;            // Limita saltos por pérdida de foco de la pestaña.

/** El estado inicial permanece quieto hasta una interacción del usuario. */
export const createDinoState = (): DinoState => ({
  status: 'idle',
  jumpHeight: 0,
  velocityY: 0,
  elapsed: 0,
  scrollX: 0,
  score: 0,
  best: 0,
  nextObstacleIn: 1.0,
  obstacles: [],
});

/**
 * Única puerta de entrada para comenzar, reiniciar o saltar.
 * El primer espacio/clic INICIA, sin generar un salto gratis.
 * Mientras está en el aire, otra pulsación NO provoca doble salto.
 */
export const playerDinoAction = (state: DinoState): 'started' | 'restarted' | 'jumped' | 'ignored' => {
  if (state.status !== 'running') {
    const wasGameOver = state.status === 'gameover';
    state.status = 'running';
    state.jumpHeight = 0;
    state.velocityY = 0;
    state.elapsed = 0;
    state.scrollX = 0;
    state.score = 0;
    state.nextObstacleIn = 1.0;
    state.obstacles = [];
    return wasGameOver ? 'restarted' : 'started';
  }

  if (state.jumpHeight > 0 || state.velocityY !== 0) return 'ignored';

  state.velocityY = JUMP_FORCE;
  return 'jumped';
};

/** Un choque se calcula con hitboxes algo más pequeñas que los sprites. */
const collided = (state: DinoState, cactus: DinoObstacle): boolean => {
  const dinoLeft = DINO_X + 10;
  const dinoRight = DINO_X + DINO_SPRITE_WIDTH - 9;
  const dinoTop = DINO_GROUND_Y - DINO_SPRITE_HEIGHT - state.jumpHeight + 8;
  const dinoBottom = DINO_GROUND_Y - state.jumpHeight - 4;
  const cactusLeft = cactus.x + 3;
  const cactusRight = cactus.x + cactus.width - 3;
  const cactusTop = DINO_GROUND_Y - cactus.height + 3;
  const cactusBottom = DINO_GROUND_Y;
  return dinoLeft < cactusRight && dinoRight > cactusLeft && dinoTop < cactusBottom && dinoBottom > cactusTop;
};

/** Física, movimiento y colisiones. Nunca llama a playerDinoAction(). */
export const advanceDinoState = (state: DinoState, seconds: number, random: () => number = Math.random): void => {
  // «idle» y «gameover» son completamente estáticos, incluso si alguien invoca la función.
  if (state.status !== 'running' || !Number.isFinite(seconds) || seconds <= 0) return;
  const dt = Math.min(seconds, MAX_STEP);
  const speed = Math.min(405, 250 + Math.floor(state.score / 55) * 8);

  state.elapsed += dt;
  state.score += dt * 13;
  state.scrollX += speed * dt;

  // La gravedad puede hacer caer al dinosaurio, pero nunca despegar por sí sola.
  if (state.jumpHeight > 0 || state.velocityY > 0) {
    state.jumpHeight += state.velocityY * dt;
    state.velocityY -= GRAVITY * dt;
    if (state.jumpHeight <= 0) {
      state.jumpHeight = 0;
      state.velocityY = 0;
    }
  }

  // Los obstáculos avanzan automáticamente; el dinosaurio NO salta ante ellos.
  for (const obstacle of state.obstacles) obstacle.x -= speed * dt;
  state.obstacles = state.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -8);

  // Generar cactus solamente cuando la partida ya está corriendo.
  state.nextObstacleIn -= dt;
  if (state.nextObstacleIn <= 0) {
    const last = state.obstacles[state.obstacles.length - 1];
    if (!last || last.x < DINO_WIDTH - 240) {
      const large = random() > 0.55;
      state.obstacles.push({
        x: DINO_WIDTH + 8,
        width: large ? 25 : 17,
        height: large ? 50 : 35,
        kind: large ? 'large' : 'small',
      });
      state.nextObstacleIn = 1.05 + Math.max(0, Math.min(1, random())) * 0.65;
    }
  }

  if (state.obstacles.some((obstacle) => collided(state, obstacle))) {
    state.status = 'gameover';
    state.velocityY = 0;
    state.best = Math.max(state.best, Math.floor(state.score));
  }
};

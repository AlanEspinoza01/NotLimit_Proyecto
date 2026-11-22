import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceDinoState,
  createDinoState,
  DINO_X,
  playerDinoAction,
} from '../dino.logic';

// Las pruebas usan el motor puro; no necesitan montar el navegador ni llamar a la API.
test('antes de la primera pulsación no se mueve, no puntúa ni aparecen cactus', () => {
  const game = createDinoState();
  const initial = structuredClone(game);
  advanceDinoState(game, 3, () => 0.9);
  assert.deepEqual(game, initial);
});

test('el primer espacio o clic inicia la partida sin hacer un salto automático', () => {
  const game = createDinoState();
  assert.equal(playerDinoAction(game), 'started');
  assert.equal(game.status, 'running');
  assert.equal(game.jumpHeight, 0);
  assert.equal(game.velocityY, 0);
});

test('solo otra acción explícita inicia el salto', () => {
  const game = createDinoState();
  playerDinoAction(game);
  advanceDinoState(game, 0.016, () => 0);
  assert.equal(game.jumpHeight, 0);
  assert.equal(playerDinoAction(game), 'jumped');
  advanceDinoState(game, 0.016, () => 0);
  assert.ok(game.jumpHeight > 0);
});

test('mientras está en el aire, una pulsación adicional no provoca doble salto', () => {
  const game = createDinoState();
  playerDinoAction(game);
  playerDinoAction(game);
  advanceDinoState(game, 0.016, () => 0);
  const previousVelocity = game.velocityY;
  assert.equal(playerDinoAction(game), 'ignored');
  assert.equal(game.velocityY, previousVelocity);
});

test('sin ninguna pulsación extra, el dino permanece en el suelo ante un obstáculo', () => {
  const game = createDinoState();
  playerDinoAction(game);
  game.obstacles = [{ x: DINO_X + 60, width: 17, height: 35, kind: 'small' }];
  game.nextObstacleIn = 9;
  advanceDinoState(game, 0.05, () => 0.9);
  assert.equal(game.jumpHeight, 0);
  assert.equal(game.velocityY, 0);
});

test('el choque detiene la partida y congela su puntuación', () => {
  const game = createDinoState();
  playerDinoAction(game);
  game.obstacles = [{ x: DINO_X + 15, width: 17, height: 35, kind: 'small' }];
  advanceDinoState(game, 0.016, () => 0.1);
  assert.equal(game.status, 'gameover');
  const afterCrash = structuredClone(game);
  advanceDinoState(game, 2, () => 0.9);
  assert.deepEqual(game, afterCrash);
});

test('puede superar un cactus si el usuario saltó a tiempo', () => {
  const game = createDinoState();
  playerDinoAction(game);
  game.jumpHeight = 90;
  game.velocityY = 0;
  game.obstacles = [{ x: DINO_X + 15, width: 17, height: 35, kind: 'small' }];
  game.nextObstacleIn = 9;
  advanceDinoState(game, 0.016, () => 0.2);
  assert.equal(game.status, 'running');
});

test('tras perder, el primer clic reinicia pero no hace un salto gratis', () => {
  const game = createDinoState();
  playerDinoAction(game);
  game.status = 'gameover';
  game.score = 125;
  game.best = 125;
  game.jumpHeight = 30;
  assert.equal(playerDinoAction(game), 'restarted');
  assert.equal(game.status, 'running');
  assert.equal(game.score, 0);
  assert.equal(game.best, 125);
  assert.equal(game.jumpHeight, 0);
  assert.equal(game.velocityY, 0);
});

test('ignora intervalos inválidos o negativos en lugar de mover objetos', () => {
  const game = createDinoState();
  playerDinoAction(game);
  const previous = structuredClone(game);
  advanceDinoState(game, Number.NaN);
  advanceDinoState(game, -1);
  assert.deepEqual(game, previous);
});

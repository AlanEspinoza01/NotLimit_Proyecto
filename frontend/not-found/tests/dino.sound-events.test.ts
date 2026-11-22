import test from 'node:test';
import assert from 'node:assert/strict';
import { soundForPlayerAction, soundForDinoFrame } from '../dino.sound-events';

// El audio solo reacciona a acciones del usuario y a eventos del motor.
test('el inicio manual reproduce el sonido de pulsación', () => {
  assert.equal(soundForPlayerAction('started'), 'press');
});

test('el reinicio manual reproduce el sonido de pulsación', () => {
  assert.equal(soundForPlayerAction('restarted'), 'press');
});

test('un salto manual reproduce sonido; un doble salto ignorado no', () => {
  assert.equal(soundForPlayerAction('jumped'), 'press');
  assert.equal(soundForPlayerAction('ignored'), null);
});

test('el avance normal no produce saltos ni sonidos automáticos', () => {
  assert.equal(soundForDinoFrame(21, 22, 'running', 'running'), null);
});

test('el sonido de logro aparece solo al cruzar un nuevo centenar', () => {
  assert.equal(soundForDinoFrame(99.9, 100.1, 'running', 'running'), 'reached');
  assert.equal(soundForDinoFrame(100.1, 100.8, 'running', 'running'), null);
  assert.equal(soundForDinoFrame(199.8, 200.2, 'running', 'running'), 'reached');
});

test('el choque reproduce el sonido de colisión una sola vez', () => {
  assert.equal(soundForDinoFrame(25, 26, 'running', 'gameover'), 'hit');
  assert.equal(soundForDinoFrame(26, 26, 'gameover', 'gameover'), null);
});

test('el choque tiene prioridad si coincide con un centenar', () => {
  assert.equal(soundForDinoFrame(99, 100, 'running', 'gameover'), 'hit');
});

test('el juego en reposo no genera sonidos al actualizarse', () => {
  assert.equal(soundForDinoFrame(0, 0, 'idle', 'idle'), null);
});

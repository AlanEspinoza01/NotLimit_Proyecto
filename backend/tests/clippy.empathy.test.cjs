'use strict';

// Ejecutar desde backend/ después de `npm run build`:
// node --test tests/clippy.empathy.test.cjs
// Este test no utiliza bases de datos, red ni la clave de Gemini.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createClippyGuide } = require('../dist/clippy/clippy.conversation.js');
const { isClippySocialResponse, isPersonalDistress } = require('../dist/clippy/clippy.empathy.js');

const guide = (text, history = []) => createClippyGuide(text, history);

test('Clippy da ánimo sin preguntar por problemas íntimos ni vender ropa', () => {
  for (const message of [
    'Estoy triste', 'No sé, me siento mal', 'Ando bajoneado',
    'Me siento sola', 'Tengo mucha pena', 'Tuve un día horrible',
  ]) {
    const result = guide(message);
    assert.equal(result.socialKind, 'encouragement', message);
    assert.equal(result.recommendProducts, false, message);
    assert.deepEqual(result.suggestions, [], message);
    assert.ok(!result.answer.includes('?'), message);
    assert.ok(result.answer.length > 50, message);
    assert.equal(isClippySocialResponse(result.answer), true, message);
  }
});

test('Clippy reconoce estrés y evita iniciar una charla clínica', () => {
  for (const message of ['Estoy frustrada', 'Estoy ansiosa', 'Estoy agotado', 'Tengo una cita y estoy nervioso']) {
    const result = guide(message);
    assert.equal(result.socialKind, 'encouragement', message);
    assert.equal(result.recommendProducts, false, message);
    assert.equal(result.suggestions.length, 0, message);
  }
});

test('Clippy es respetuoso con la inseguridad corporal', () => {
  for (const message of ['Me siento fea', 'Odio mi cuerpo']) {
    const result = guide(message);
    assert.equal(result.socialKind, 'encouragement', message);
    assert.equal(result.recommendProducts, false, message);
  }
});

test('Clippy da prioridad a ayuda humana ante señales graves', () => {
  for (const message of ['No quiero vivir más', 'Me quiero matar', 'Quiero hacerme daño']) {
    const result = guide(message);
    assert.equal(result.socialKind, 'urgent', message);
    assert.equal(result.recommendProducts, false, message);
    assert.match(result.answer, /emergencia/i);
  }
});

test('Clippy entiende una continuación vaga, pero no invade la asesoría de moda', () => {
  const first = guide('Estoy triste');
  const sadnessHistory = [
    { role: 'user', text: 'Estoy triste' },
    { role: 'assistant', text: first.answer },
  ];
  const followup = guide('No sé', sadnessHistory);
  assert.equal(followup.socialKind, 'encouragement');
  assert.notEqual(guide('Estoy triste', sadnessHistory).answer, first.answer);
  const fashionHistory = [
    { role: 'user', text: 'Tengo una cita' },
    { role: 'assistant', text: '¿Qué estilo te gusta más?' },
  ];
  assert.equal(guide('No sé', fashionHistory).socialKind, undefined);
});

test('Clippy conserva tallas, compras, disponibilidad y looks', () => {
  for (const message of [
    'Tengo una cita', 'Quiero un outfit urbano', '¿Cómo elijo mi talla?',
    '¿Puedo comprar una polera?', '¿Tienen stock?', 'Me muero de risa',
  ]) {
    assert.equal(guide(message).socialKind, undefined, message);
  }
  assert.equal(isPersonalDistress('El estilo oscuro me gusta'), false);
  assert.equal(isPersonalDistress('Estoy triste'), true);
});

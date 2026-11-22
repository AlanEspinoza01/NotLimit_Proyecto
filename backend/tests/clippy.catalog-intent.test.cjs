'use strict';
// Ejecutar después de npm run build, desde la carpeta backend:
// node --test tests/clippy.catalog-intent.test.cjs tests/clippy.empathy.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createClippyGuide } = require('../dist/clippy/clippy.conversation.js');
const { matchCatalogProducts, parseProductRequest, buildCatalogReply, matchStyleProducts } = require('../dist/clippy/clippy.catalog.js');

// Productos simulados que reflejan estructuras reales, sin acceder a Atlas.
const fixtures = [
  { _id: '1', title: 'Pantalones cortos rosas con cadena', category: 'Ropa Inferior', subcategory: 'Shorts', section: 'Mujer', price: 20000, salePrice: 18000, totalStock: 20, images: ['https://ejemplo.cl/pantalon.png'] },
  { _id: '2', title: 'Camisas azul cielo a rayas NoLimits', category: 'Ropa Superior', subcategory: 'Camisas', section: 'Hombre', price: 15000, totalStock: 15 },
  { _id: '3', title: 'Camiseta boxy blanca con iPod rosa', category: 'Ropa Superior', subcategory: 'Poleras', section: 'Mujer', price: 15000, totalStock: 10 },
  { _id: '4', title: 'Pantalon Bermuda', category: 'Ropa Superior', subcategory: 'Poleras', section: 'Hombre', price: 15000, totalStock: 0 },
  { _id: '5', title: 'Gorra rosa y blanca Nolimits', category: 'Accesorios', subcategory: 'Jockey', section: 'Hombre', price: 20000, totalStock: 20 },
  { _id: '6', title: 'Polera Test Edición', category: 'Ropa Superior', subcategory: 'Poleras', section: 'Hombre', price: 39990, totalStock: 5 },
  { _id: '7', title: 'Camisa blanca formal', category: 'Ropa Superior', subcategory: 'Camisas', section: 'Hombre', price: 30000, totalStock: 0 },
  { _id: '8', title: 'Camisa blanca no publicada', category: 'Ropa Superior', subcategory: 'Camisas', section: 'Hombre', price: 30000, totalStock: 10, isHidden: true },
];

function query(text, history = []) {
  const result = createClippyGuide(text, history);
  return { result, matches: result.productRequest ? matchCatalogProducts(fixtures, result.productRequest) : [] };
}

test('camisa blanca exige clase camisa + color blanco, no camiseta blanca', () => {
  const { result, matches } = query('¿Tienes una camisa blanca?');
  assert.equal(result.productRequest.type, 'camisa');
  assert.deepEqual(result.productRequest.colors, ['blanco']);
  assert.equal(matches.length, 0);
  assert.match(buildCatalogReply(result.productRequest, matches), /no vi una coincidencia exacta/i);
});

test('camisas azules sí coinciden con camisa de color azul', () => {
  const { matches } = query('¿Venden camisas azules?');
  assert.deepEqual(matches.map(p => p.id), ['2']);
});

test('pantalones solo muestra pantalones disponibles, no camisas ni poleras', () => {
  const { result, matches } = query('¿Tienen pantalones?');
  assert.equal(result.productRequest.type, 'pantalon');
  assert.deepEqual(matches.map(p => p.id), ['1']);
});

test('color blanco en camisetas: no recomienda camisa ni otros tonos', () => {
  const { matches } = query('Muéstrame una camiseta blanca');
  assert.deepEqual(matches.map(p => p.id), ['3']);
  assert.deepEqual(query('¿Tienes una camiseta rosa?').matches, []);
});

test('pantalones negros no se rellenan con poleras negras', () => {
  const { matches } = query('¿Hay pantalones negros?');
  assert.deepEqual(matches, []);
});

test('el nombre real prevalece sobre subcategoría contradictoria', () => {
  const available = fixtures.map(p => p._id === '4' ? { ...p, totalStock: 10 } : p);
  const results = matchCatalogProducts(available, parseProductRequest('¿Tienen pantalones?'));
  assert.deepEqual(results.map(x => x.id), ['1', '4']);
  const shirts = matchCatalogProducts(available, parseProductRequest('¿Tienen poleras?'));
  assert.ok(!shirts.some(p => p.id === '4'));
});

test('conversación anterior sobre una cita no secuestra preguntas nuevas', () => {
  const history = [
    { role: 'user', text: 'Tengo una cita' },
    { role: 'assistant', text: '¿Qué estilo te gusta más: urbano o elegante?' },
  ];
  const { result, matches } = query('¿Tienes una camisa blanca?', history);
  assert.equal(result.styleConsultation, false);
  assert.equal(result.productRequest.type, 'camisa');
  assert.deepEqual(matches, []);
});

test('¿Qué estilos hay disponibles? recibe información de estilo, no frase genérica', () => {
  const { result } = query('¿Qué estilos hay disponibles?');
  assert.equal(result.recommendProducts, false);
  assert.match(result.answer, /urbano|streetwear/i);
  assert.ok(result.suggestions.length >= 2);
});

test('me siento alegre obtiene felicitación sin productos ni ventas', () => {
  const history = [
    { role: 'user', text: '¿Tienen pantalones?' },
    { role: 'assistant', text: 'Encontré pantalones disponibles.' },
  ];
  const { result } = query('Me siento alegre', history);
  assert.equal(result.socialKind, 'celebration');
  assert.equal(result.recommendProducts, false);
  assert.equal(result.productRequest, undefined);
  assert.deepEqual(result.suggestions, []);
});

test('la búsqueda de productos con tallas agotadas o ocultos no muestra esos artículos', () => {
  assert.deepEqual(query('camisa blanca').matches, []);
  assert.equal(query('camisas').matches.length, 1); // solo la camisa azul disponible
});

test('continuación de color reutiliza solamente la prenda anterior', () => {
  const request = parseProductRequest('¿Y en blanco?', '¿Tienen camisas azules?');
  assert.equal(request.type, 'camisa');
  assert.deepEqual(request.colors, ['blanco']);
  assert.deepEqual(matchCatalogProducts(fixtures, request), []);
});

test('asesoría general no duplica tarjetas y respeta paleta', () => {
  const results = matchStyleProducts(fixtures, 'Quiero un look casual de color blanco');
  assert.equal(results.length, new Set(results.map(x => x.id)).size);
  assert.deepEqual(new Set(results.map(p => p.id)), new Set(['3', '5'])); // ambas prendas tienen blanco real
});


test('pantalón singular con tilde se reconoce como pantalón', () => {
  assert.equal(parseProductRequest('¿Tienes un pantalón?').type, 'pantalon');
  assert.equal(parseProductRequest('Quiero un polerón').type, 'poleron');
});

test('el hilo de estilo conserva preferencias solo durante esa asesoría', () => {
  const first = createClippyGuide('Tengo una cita', []);
  assert.equal(first.recommendProducts, false);
  const history1 = [
    { role: 'user', text: 'Tengo una cita' },
    { role: 'assistant', text: first.answer },
  ];
  const second = createClippyGuide('Algo urbano', history1);
  assert.match(second.answer, /paleta/i);
  const history2 = [...history1,
    { role: 'user', text: 'Algo urbano' },
    { role: 'assistant', text: second.answer },
  ];
  const third = createClippyGuide('Negro y tonos oscuros', history2);
  assert.equal(third.recommendProducts, true);
  assert.equal(third.styleConsultation, true);
  assert.match(third.answer, /urbano/i);
});

test('Clippy reconoce consulta informativa por colores sin enviar productos', () => {
  const response = createClippyGuide('¿Qué colores tienen?', []);
  assert.equal(response.recommendProducts, false);
  assert.match(response.answer, /por color/i);
});

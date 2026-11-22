'use strict';
// Pruebas puras: no acceden a MongoDB ni modifican el repositorio.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript'); // Instalado como dependencia de desarrollo del frontend.

// Transpilamos únicamente el mapper puro, sin ejecutar React ni la API real.
const mapperPath = path.join(__dirname, '../components/profile/profileOrdersApi.ts');
const source = fs.readFileSync(mapperPath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const sandbox = { exports: {}, module: { exports: {} } };
// TypeScript escribe en exports para la compilación CommonJS.
vm.runInNewContext(compiled, sandbox, { filename: mapperPath });
const { mapConfirmedProfileOrders, normalizeProfileOrderStatus } = sandbox.exports;

const catalog = [{ id: '507f1f77bcf86cd799439010', sku: 'NL-101',
  title: 'Polera actual', price: 99000, images: ['https://example.org/photo.png'],
  colors: [{ name: 'Azul' }] }];
const makeOrder = (patch = {}) => ({
  _id: '507f1f77bcf86cd799439011', orderNumber: 'NL-1827', paymentStatus: 'CONFIRMED',
  subtotal: 15000, total: 18000, shippingCost: 3000,
  paymentMethod: 'WEBPAY', deliveryType: 'envio', status: 'Entregado',
  createdAt: '2026-11-20T12:00:00.000Z',
  items: [{ productId: '507f1f77bcf86cd799439010', sku: 'NL-101', name: 'Polera comprada',
    size: 'M', quantity: 1, price: 15000, isReviewed: false }],
  ...patch
});

test('usuario sin compras recibe historial vacío', () => {
  assert.equal(mapConfirmedProfileOrders([], catalog).length, 0);
});
test('nunca muestra pagos pendientes, anulados ni reembolsados', () => {
  const rows = ['PENDING', 'REJECTED', 'REFUNDED'].map(paymentStatus => makeOrder({ paymentStatus }));
  assert.equal(mapConfirmedProfileOrders(rows, catalog).length, 0);
});
test('un pedido confirmado aparece una vez con su número real', () => {
  const result = mapConfirmedProfileOrders([makeOrder()], catalog);
  assert.equal(result.length, 1);
  assert.equal(result[0].orderNumber, 'NL-1827');
  assert.equal(result[0].currentStatus, 'Entregado');
});
test('mantiene precio pagado y no sustituye producto por datos actuales', () => {
  const order = mapConfirmedProfileOrders([makeOrder()], catalog)[0];
  assert.equal(order.total, 18000);
  assert.equal(order.items[0].price, 15000);
  assert.equal(order.items[0].title, 'Polera comprada');
  assert.equal(order.items[0].image, 'https://example.org/photo.png');
});
test('respeta marca de reseñado que viene de MongoDB por artículo', () => {
  const reviewed = makeOrder({ items: [{ productId: '507f1f77bcf86cd799439010', isReviewed: true }] });
  const order = mapConfirmedProfileOrders([reviewed], catalog)[0];
  assert.equal(order.items[0].isReviewed, true);
});
test('no inventa una imagen cuando el producto ya no existe en el catálogo', () => {
  const order = mapConfirmedProfileOrders([makeOrder({items: [{productId:'507f1f77bcf86cd799439099',price:5000}]})], catalog)[0];
  assert.equal(order.items[0].image, '');
});
test('reconoce estados de retiro y tránsito con tildes', () => {
  assert.equal(normalizeProfileOrderStatus('Retirado', 'CONFIRMED'), 'Retirado');
  assert.equal(normalizeProfileOrderStatus('En tránsito', 'CONFIRMED'), 'En transito');
});
test('Perfil no incorpora órdenes, reseñas ni imágenes de prueba', () => {
  const profile = fs.readFileSync(path.join(__dirname, '../views/ProfileView.tsx'), 'utf8');
  for (const sample of ['ord_demo_', 'rev_initial_', 'buildInitialPurchaseOrders',
    'nolimits_user_orders', 'nolimits_my_published_reviews', 'nolimits_user_reviewed_items']) {
    assert.equal(profile.includes(sample), false, `Todavía existe un dato falso: ${sample}`);
  }
});
test('historial y reseñas comparten el listado de órdenes', () => {
  const tab = fs.readFileSync(path.join(__dirname, '../components/profile/ProfileOrdersTab.tsx'), 'utf8');
  assert.ok(tab.includes('const historyOrders = filteredOrders'));
  assert.ok(!tab.includes("api.get('/orders/my-orders')"));
});

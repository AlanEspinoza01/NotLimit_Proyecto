'use strict';
// Ejecutar desde backend después de npm run build:
// node --test tests/clippy.informacion-tienda.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const {detectClippyStoreIntent,buildClippyStoreReply} = require('../dist/clippy/clippy.store-guide.js');
const cases = [
 ['¿Cómo puedo solicitar un producto personalizado?', 'custom-product'],
 ['¿Puedo pedir una polera personalizada?', 'custom-product'],
 ['Quiero ropa a medida, ¿cómo hago?', 'custom-product'],
 ['Clippy, ¿cuáles son los métodos de pago disponibles?', 'payments'],
 ['¿Cómo se paga?', 'payments'],
 ['¿Puedo pagar con tarjeta de débito?', 'payments'],
 ['¿Ya tienen Khipu?', 'payments'],
 ['¿Aceptan Mercado Pago?', 'payments'],
 ['¿Cómo puedo comprar?', 'buying'],
 ['¿Cuáles son las políticas de privacidad?', 'privacy'],
 ['¿Dónde están los términos y condiciones?', 'terms'],
 ['¿Qué métodos de envío tienen?', 'shipping'],
 ['¿Puedo retirar en sucursal?', 'pickup'],
 ['¿Cómo hago una devolución?', 'returns'],
 ['¿Cómo contacto a atención al cliente?', 'contact'],
 ['¿Quiénes son NoLimits?', 'about'],
 ['¿Dónde encuentro sus redes sociales?', 'social-media'],
];
for (const [query, intent] of cases) test(`Clasificar: ${query}`, () => {
  assert.equal(detectClippyStoreIntent(query),intent);
});

test('Consultas de moda, sentimientos y compra por prenda NO se confunden con información institucional',()=>{
  for (const q of ['Me siento triste', 'Busco camisa blanca', 'Te odio', 'Quiero un look para una cita', '¿Tienes pantalones negros?', '¿Eres mi amigo?', 'quiero pagarme un gusto']) {
    assert.equal(detectClippyStoreIntent(q),null,q);
  }
});

test('Producto personalizado: explica cuenta, barra inferior, 10 fotos y cotización; no vende stock',()=>{
  const r=buildClippyStoreReply('custom-product');
  assert.match(r.answer,/Pedir Producto Personalizado/);
  assert.match(r.answer,/inicia sesi[oó]n|registr/i);
  assert.match(r.answer,/10 fotos/i);
  assert.match(r.answer,/cotizaci[oó]n/i);
  assert.doesNotMatch(r.answer,/precio fijo|garantizad[oa] el stock/i);
});

test('Webpay es el pago habilitado, Mercado Pago y Khipu no se presentan como activos',()=>{
  const {answer} = buildClippyStoreReply('payments');
  assert.match(answer,/Webpay Plus/);
  assert.match(answer,/tarjetas/i);
  assert.match(answer,/Mercado Pago y Khipu/);
  assert.match(answer,/NO est[aá]n habilitadas/);
});

test('Consultas legales remiten al documento del footer, sin inventar requisitos',()=>{
  const privacy=buildClippyStoreReply('privacy',{politicasPrivacidadTitle:'Política vigente'}).answer;
  const terms=buildClippyStoreReply('terms').answer;
  assert.match(privacy,/Pol[ií]ticas de Privacidad/);
  assert.match(terms,/T[eé]rminos y Condiciones/);
  assert.doesNotMatch(privacy,/\b100\s*%\b/);
});

test('Lee título publicado desde MongoDB pero no inyecta HTML ni todo el documento',()=>{
  const r=buildClippyStoreReply('privacy',{politicasPrivacidadTitle:'<script>alert(1)</script>Política pública',politicasPrivacidad:'Esta sección no debe copiarse en respuestas.'});
  assert.doesNotMatch(r.answer,/<script>|<\/script>|Esta sección no debe/i);
  assert.match(r.answer,/Política pública/);
});

test('Cambios públicos en footer se reflejan en texto informativo elegido',()=>{
  const r=buildClippyStoreReply('shipping',{metodosEnvio:'Entregas según cobertura del courier publicado.'});
  assert.match(r.answer,/Entregas según cobertura/);
  assert.match(r.answer,/M[eé]todos de Env[ií]o/);
});

test('No usa el contexto de moda anterior para secuestrar una pregunta informativa nueva',()=>{
  const h=[{role:'user',text:'tengo una cita'},{role:'assistant',text:'qué estilo te gusta?'}];
  assert.equal(detectClippyStoreIntent('¿cómo pago con tarjeta?',h),'payments');
});

test('Permite seguimiento inmediato de consulta de productos personalizados',()=>{
  const h=[{role:'user',text:'Quiero un pedido personalizado'}];
  assert.equal(detectClippyStoreIntent('¿Cuánto cuesta?',h),'custom-product');
  assert.equal(detectClippyStoreIntent('¿Necesito una cuenta?',h),'custom-product');
  assert.equal(detectClippyStoreIntent('¿Puedo enviar fotos?',h),'custom-product');
});

test('No arrastra contexto institucional a preguntas nuevas ajenas al hilo',()=>{
  const h=[{role:'user',text:'cómo se paga'}];
  assert.equal(detectClippyStoreIntent('Quiero un outfit urbano',h),null);
});

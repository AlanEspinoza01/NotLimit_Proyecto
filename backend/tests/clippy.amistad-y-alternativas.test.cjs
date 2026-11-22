'use strict';
// Desde backend, ejecutar tras npm run build:
// node --test tests/clippy.amistad-y-alternativas.test.cjs
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createClippyGuide} = require('../dist/clippy/clippy.conversation.js');
const {
  matchCatalogProducts, matchUpperAlternatives,
  buildUpperAlternativeReply, parseProductRequest,
} = require('../dist/clippy/clippy.catalog.js');
const {isClippySocialMessage, isClippySocialResponse} = require('../dist/clippy/clippy.empathy.js');
const products = [
  {_id:'tee',title:'Camiseta boxy blanca con iPod rosa',category:'Ropa Superior',subcategory:'Poleras',section:'Mujer',totalStock:10},
  {_id:'blue',title:'Camisa azul formal',category:'Ropa Superior',subcategory:'Camisas',section:'Hombre',totalStock:3},
  {_id:'shirtwhite',title:'Camisa blanca',category:'Ropa Superior',subcategory:'Camisas',section:'Mujer',totalStock:0},
  {_id:'blousewhite',title:'Blusa blanca',category:'Ropa Superior',subcategory:'Blusas',section:'Mujer',totalStock:3},
  {_id:'pantswhite',title:'Pantalón blanco',category:'Ropa Inferior',subcategory:'Pantalones',section:'Mujer',totalStock:7},
  {_id:'tee-black',title:'Polera negra',category:'Ropa Superior',subcategory:'Poleras',section:'Hombre',totalStock:15},
  {_id:'hidden',title:'Polera blanca',category:'Ropa Superior',subcategory:'Poleras',section:'Mujer',totalStock:10,isHidden:true},
];

test('¿eres mi amigo? recibe respuesta cálida y no recomienda ropa',()=>{
  const response=createClippyGuide('¿Eres mi amigo Clippy?',[]);
  assert.equal(response.socialKind,'friendship');
  assert.equal(response.recommendProducts,false);
  assert.match(response.answer,/pana|compa|amigo/i);
  assert.deepEqual(response.suggestions,[]);
  assert.equal(isClippySocialResponse(response.answer),true);
});
test('te odio recibe una respuesta amable, no agresiva ni comercial',()=>{
  const response=createClippyGuide('te odio',[]);
  assert.equal(response.socialKind,'hostility');
  assert.equal(response.recommendProducts,false);
  assert.match(response.answer,/odio mata el alma y la envenena/i);
  assert.match(response.answer,/amigo|pana/i);
  assert.equal(isClippySocialMessage('te odio'),true);
});
test('consulta por camisa blanca sin stock ofrece camiseta o blusa blancas, NO pantalón',()=>{
  const r=parseProductRequest('¿Tienes una camisa blanca para mujer?');
  const exact=matchCatalogProducts(products,r);
  const alternative=matchUpperAlternatives(products,r);
  assert.equal(exact.length,0);
  assert.deepEqual(new Set(alternative.map(p=>p.id)),new Set(['tee','blousewhite']));
  assert.match(buildUpperAlternativeReply(r,alternative),/no exactamente|no encontr[eé]|alternativa/i);
});
test('si camisa exacta tiene stock, se usa antes de alternativas',()=>{
  const r=parseProductRequest('busco camisas azules');
  assert.equal(matchCatalogProducts(products,r).length,1);
});
test('la alternativa exige MISMO color y sección y stock público',()=>{
  const r=parseProductRequest('Quiero camisas negras para mujer');
  assert.deepEqual(matchUpperAlternatives(products,r),[]);
});
test('pantalones no recurren a poleras como alternativas',()=>{
  const r=parseProductRequest('quiero pantalones negros');
  assert.deepEqual(matchUpperAlternatives(products,r),[]);
});
test('reclamo agotado no dispara búsqueda ni respuesta genérica',()=>{
  for(const q of ['pero el producto esta agotado', 'pero el producto está agotadoooo']) {
    const response=createClippyGuide(q,[{role:'user',text:'me gusta esa polera'},{role:'assistant',text:'Mira esta prenda.'}]);
    assert.equal(response.recommendProducts,false,q);
    assert.match(response.answer,/qu[eé] lata/i,q);
    assert.match(response.answer,/agotad/i,q);
    assert.deepEqual(response.suggestions.length>0,true,q);
  }
});
test('riesgo personal sigue teniendo prioridad sobre el tono amistoso',()=>{
  const response=createClippyGuide('No quiero vivir más',[]);
  assert.equal(response.socialKind,'urgent');
  assert.equal(response.recommendProducts,false);
});
test('hola, gracias y que busco outfits conservan rutas apropiadas',()=>{
  assert.match(createClippyGuide('hola',[]).answer,/hola/i);
  assert.equal(createClippyGuide('Gracias Clippy',[]).socialKind,'gratitude');
  assert.equal(createClippyGuide('quiero un outfit para una cita',[]).styleConsultation,true);
});

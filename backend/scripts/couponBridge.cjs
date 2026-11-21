'use strict';

// NoLimits: migración SUPERVISADA de cupones previos al registro que usa Webpay.
// No modifica el canje, el saldo de puntos ni las órdenes.
// Ejecutar exclusivamente desde backend/ con el .env ya cargado por Node.

const fs = require('node:fs');
const path = require('node:path');

function fail(message) {
  throw new Error(message);
}

function argsFrom(argv) {
  const mode = argv[0];
  const flags = {};
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) fail(`Argumento desconocido: ${arg}`);
    const name = arg.slice(2);
    if (['file', 'codes'].includes(name)) {
      const value = argv[++i];
      if (!value || value.startsWith('--')) fail(`Falta valor para --${name}`);
      flags[name] = value;
    } else if (['apply', 'i-reviewed'].includes(name)) {
      flags[name] = true;
    } else {
      fail(`Opción desconocida: ${arg}`);
    }
  }
  if (!['catalog', 'legacy', 'status'].includes(mode)) fail('Modo requerido: catalog | legacy | status');
  if (mode !== 'status' && !flags.file) fail('Debes indicar --file RUTA_JSON');
  if (flags.apply && !flags['i-reviewed']) fail('Para aplicar necesitas --i-reviewed (confirmación de revisión administrativa)');
  if (mode === 'legacy' && !flags.codes) fail('En modo legacy indica --codes CODIGO1,CODIGO2 (no importaremos todos automáticamente)');
  return { mode, flags };
}

function readJson(file) {
  const filename = path.resolve(file);
  if (!fs.existsSync(filename)) fail(`Archivo inexistente: ${filename}`);
  if (fs.statSync(filename).size > 2_000_000) fail('El JSON es demasiado grande (máximo 2 MB)');
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'));
  } catch {
    fail(`JSON inválido en ${filename}`);
  }
}

function strictNumber(value, field, options = {}) {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num) || num < (options.min ?? 0) || num > (options.max ?? 1e12)) {
    fail(`Valor inválido en ${field}`);
  }
  if (options.integer && !Number.isSafeInteger(num)) fail(`Se requiere entero en ${field}`);
  return num;
}

function normalizeCatalog(raw) {
  const arr = Array.isArray(raw) ? raw : raw?.catalog;
  if (!Array.isArray(arr) || arr.length === 0) fail('El catálogo está vacío o no es un array JSON');
  if (arr.length > 250) fail('Catálogo demasiado grande para revisión manual');
  const ids = new Set();
  const result = arr.map((v, i) => {
    if (!v || typeof v !== 'object') fail(`Plantilla ${i}: formato inválido`);
    const id = String(v.id || '').trim();
    const name = String(v.name || '').trim();
    const code = String(v.code || '').trim().toUpperCase();
    if (!/^[a-zA-Z0-9_-]{2,90}$/.test(id) || ids.has(id)) fail(`Plantilla ${i}: ID inválido o duplicado`);
    if (!name || name.length > 180 || !/^[A-Z0-9_-]{2,32}$/.test(code)) fail(`Plantilla ${i}: nombre o prefijo inválidos`);
    ids.add(id);
    if (!['fixed','percentage','free_shipping'].includes(v.discountType)) fail(`Plantilla ${id}: tipo de descuento inválido`);
    const discountValue = strictNumber(v.discountValue, `${id}.discountValue`, {max: 1_000_000});
    if (v.discountType === 'percentage' && discountValue > 100) fail(`${id}: porcentaje superior a 100`);
    const maxUses = strictNumber(v.maxUses, `${id}.maxUses`, {min: 1, max: 10_000_000, integer: true});
    const totalRedemptions = strictNumber(v.totalRedemptions || 0, `${id}.totalRedemptions`, {max: 10_000_000, integer: true});
    return {
      ...v,
      id, name, code,
      discountType: v.discountType,
      discountValue,
      pointsCost: strictNumber(v.pointsCost, `${id}.pointsCost`, {min: 1, max: 1_000_000, integer: true}),
      minPurchase: strictNumber(v.minPurchase || 0, `${id}.minPurchase`, {max: 100_000_000}),
      expirationDays: strictNumber(v.expirationDays || 14, `${id}.expirationDays`, {min: 1, max: 365, integer: true}),
      totalRedemptions, maxUses,
      isActive: v.isActive !== false
    };
  });
  return result;
}

function normalizeLegacy(raw) {
  const arr = Array.isArray(raw) ? raw : raw?.redeemed;
  if (!Array.isArray(arr)) fail('La billetera anterior debe ser un array JSON');
  if (arr.length > 250) fail('Archivo demasiado grande para revisión manual');
  return arr;
}

function validateLegacyCoupon(entry, template, now) {
  const code = String(entry.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9_-]{5,80}$/.test(code)) fail(`Código inválido: ${code}`);
  // Este código es un fixture de demostración del repositorio original, NO una emisión verificable.
  if (code === 'DROP3K-XP-7721') fail(`${code}: cupón de demostración. No se puede migrar como dinero real.`);
  if (String(entry.status || '').toLowerCase() !== 'disponible') fail(`${code}: no está disponible según la billetera`);
  const userEmail = String(entry.userEmail || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) fail(`${code}: email de propietario inválido`);
  if (String(entry.templateId) !== template.id) fail(`${code}: no corresponde al ID de la plantilla`);
  if (String(entry.discountType) !== template.discountType) fail(`${code}: tipo de descuento distinto a la plantilla`);
  if (strictNumber(entry.discountValue, `${code}.discountValue`) !== template.discountValue) fail(`${code}: descuento distinto al catálogo`);
  if (strictNumber(entry.pointsSpent, `${code}.pointsSpent`) !== template.pointsCost) fail(`${code}: costo en puntos distinto al catálogo`);
  if (strictNumber(entry.minPurchase || 0, `${code}.minPurchase`) !== template.minPurchase) fail(`${code}: compra mínima distinta al catálogo`);
  const redeemedAt = new Date(entry.redeemedAtIso);
  const expiresAt = new Date(entry.expiresAtIso);
  if (!Number.isFinite(redeemedAt.getTime()) || !Number.isFinite(expiresAt.getTime())) fail(`${code}: fechas inválidas`);
  if (redeemedAt.getTime() > now.getTime() || expiresAt.getTime() <= now.getTime()) fail(`${code}: fechas futuras o cupón vencido`);
  // Se permite tolerancia breve, pero no expiraciones artificialmente largas.
  const maxExpiry = redeemedAt.getTime() + template.expirationDays * 86_400_000 + 120_000;
  if (expiresAt.getTime() > maxExpiry) fail(`${code}: vigencia superior a la política del cupón`);
  return {code, userEmail, redeemedAt, expiresAt};
}

async function main(argv) {
  const {mode, flags} = argsFrom(argv);
  if (mode !== 'status' && !flags.apply) console.log('[SIMULACIÓN] No se modificará MongoDB.');
  if (flags.apply && process.env.NODE_ENV === 'production') fail('Se bloqueó la aplicación automática en NODE_ENV=production. Usa un proceso de migración aprobado.');
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('[URL_OCULTA]')) fail('Falta MONGODB_URI (se carga en backend/src/middleware/.env)');
  // Require dentro de backend/scripts para resolver el mongoose del propio backend.
  const mongoose = require('mongoose');
  await mongoose.connect(process.env.MONGODB_URI, {dbName:'nolimits_db'});
  try {
    // MongoDB nativo: evita importar TypeScript o modificar modelos de la app.
    const settingsCol = mongoose.connection.db.collection('store_settings');
    const couponsCol = mongoose.connection.db.collection('payment_coupons');
    const usersCol = mongoose.connection.db.collection('users');
    const settings = await settingsCol.findOne({_id:'global_settings'});
    const dbCatalog = Array.isArray(settings?.coupons) ? settings.coupons : [];
    if (mode === 'status') {
      const records = await couponsCol.countDocuments({});
      console.log(`MongoDB: nolimits_db | store_settings.coupons: ${dbCatalog.length} | payment_coupons: ${records}`);
      return;
    }
    const input = readJson(flags.file);
    if (mode === 'catalog') {
      const items = normalizeCatalog(input);
      console.log('Catálogo revisado:', items.map(x => ({id:x.id,name:x.name,type:x.discountType,value:x.discountValue,points:x.pointsCost,used:x.totalRedemptions}))); 
      if (dbCatalog.length > 0) {
        fail('store_settings.coupons YA tiene datos. Para no sobrescribirlos, revisa la sincronización manualmente.');
      }
      if (flags.apply) {
        if (!settings) fail('No existe store_settings/global_settings; el script no creará el documento completo.');
        const applied = await settingsCol.updateOne({_id:'global_settings',coupons:{$size:0}},{$set:{coupons:items}});
        if (applied.modifiedCount !== 1) fail('El catálogo cambió en MongoDB; no se escribió nada.');
        console.log(`✓ ${items.length} plantillas cargadas sin tocar los otros campos de store_settings.`);
      } else {
        console.log('Para importar estas plantillas ya revisadas, repite con --apply --i-reviewed.');
      }
      return;
    }
    if (dbCatalog.length === 0) fail('Primero sincroniza store_settings.coupons (catálogo vacío).');
    const selected = String(flags.codes).split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);
    if (selected.length === 0 || selected.length > 15 || new Set(selected).size !== selected.length) fail('--codes debe contener de 1 a 15 códigos únicos');
    const wallet = normalizeLegacy(input);
    const now = new Date();
    const prepared = [];
    for (const code of selected) {
      const matches = wallet.filter(x=>String(x.code || '').trim().toUpperCase() === code);
      if (matches.length !== 1) fail(`${code}: debe aparecer exactamente una vez en el archivo de origen`);
      const entry = matches[0];
      const template = dbCatalog.find(x=>String(x.id)===String(entry.templateId));
      if (!template) fail(`${code}: plantilla no encontrada en store_settings.coupons`);
      const data = validateLegacyCoupon(entry, template, now);
      const user = await usersCol.findOne({email:data.userEmail},{projection:{_id:1,email:1}});
      if (!user) fail(`${code}: no existe el usuario autenticado ${data.userEmail} en MongoDB`);
      const exists = await couponsCol.findOne({code:data.code},{projection:{_id:1}});
      if (exists) fail(`${code}: ya está registrado en payment_coupons; no se permite duplicarlo`);
      prepared.push({entry,template,data,user});
    }
    for (const {template,data,user} of prepared) {
      console.log('REVISIÓN MANUAL OBLIGATORIA:',{
        code:data.code,owner:user.email,template:template.id,discount:`${template.discountValue} (${template.discountType})`,points:template.pointsCost,
        redeemedAt:data.redeemedAt.toISOString(),expiresAt:data.expiresAt.toISOString()
      });
    }
    console.log('ADVERTENCIA: un archivo localStorage no demuestra por sí solo que se descontaron los puntos.');
    if (!flags.apply) {
      console.log('Comprueba la identidad del dueño y el débito previo de puntos antes de aplicar.');
      console.log('Luego: --apply --i-reviewed (sin descontar puntos de nuevo ni incrementar totalRedemptions).');
      return;
    }
    for (const {template,data,user} of prepared) {
      // $setOnInsert no modifica códigos previamente existentes. Unique index evita duplicaciones.
      const result = await couponsCol.updateOne({code:data.code},{$setOnInsert:{
        code:data.code,userId:user._id,templateId:template.id,title:String(template.name),
        discountType:template.discountType,discountValue:template.discountValue,minPurchase:template.minPurchase,
        pointsSpent:template.pointsCost,redeemedAt:data.redeemedAt,expiresAt:data.expiresAt,
        status:'AVAILABLE',reservedOrderNumber:'',usedOrderNumber:'',createdAt:new Date(),updatedAt:new Date()
      }},{upsert:true});
      if (result.upsertedCount !== 1) fail(`${data.code}: no se importó; consulta si existe una carrera de importación.`);
      console.log(`✓ Migrado: ${data.code}`);
    }
    console.log('Finalizado. No se modificaron puntos, órdenes, stock ni cupones del navegador.');
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main(process.argv.slice(2)).catch(error=>{console.error('[COUPON BRIDGE]',error.message);process.exitCode=1;});
}
module.exports = {argsFrom, normalizeCatalog, validateLegacyCoupon};

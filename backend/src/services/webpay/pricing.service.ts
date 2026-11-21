import {ProductModel} from '../../models/Product.model';
import {calculateCourierQuotes,getProductWeightGrams} from './shippingQuotesEngine';
import type {ClientSession,Types} from 'mongoose';
export interface Line {productId:Types.ObjectId; sku:string; name:string; size:string; price:number;quantity:number;weightGrams:number}
const clean=(s:unknown)=>String(s||'').trim();
export async function quoteCheckout(data:any,session:ClientSession){
 const incoming=Array.isArray(data.items)?data.items:[];
 if(incoming.length===0||incoming.length>40)throw new Error('El carrito está vacío o contiene demasiados productos');
 const compact=new Map<string,{productId:string;size:string;quantity:number}>();
 for(const it of incoming){
  const id=clean(it.productId);const size=clean(it.size||'Única');const quantity=Number(it.quantity);
  if(!/^[a-f0-9]{24}$/i.test(id)||!Number.isSafeInteger(quantity)||quantity<1||quantity>50)throw new Error('Producto o cantidad no válidos');
  const key=`${id}:${size.toLowerCase()}`;const existing=compact.get(key);
  compact.set(key,{productId:id,size,quantity:quantity+(existing?.quantity||0)});
 }
 const lines:Line[]=[];
 let goods=0,weight=0;
 for(const item of compact.values()){
  const product=await ProductModel.findById(item.productId).session(session);
  if(!product||product.isHidden)throw new Error('Un producto ya no está disponible');
  const base=Number(product.price||product.normalPrice||0),rate=Number(product.discountPercent||0);
  if(!Number.isSafeInteger(base)||base<=0||rate<0||rate>100)throw new Error('El precio de un producto no es válido');
  const price=Math.round(base*(1-rate/100));
  if(price<1)throw new Error('Una compra totalmente descontada requiere un flujo especial sin Webpay');
  let size=item.size;
  if(product.sizeBreakdown?.length){
    const found=product.sizeBreakdown.find((s:any)=>clean(s.size).toLowerCase()===size.toLowerCase());
    if(!found){if(product.sizeBreakdown.length===1)size=product.sizeBreakdown[0].size;
      else throw new Error('La talla solicitada ya no está disponible');}
    const valid=product.sizeBreakdown.find((s:any)=>s.size===size);
    if(Number(valid?.quantity||0)<item.quantity)throw new Error('Stock insuficiente en la talla seleccionada');
  }else if(Number(product.stock||0)<item.quantity)throw new Error('Stock insuficiente');
  const grams=getProductWeightGrams(product)*item.quantity;
  lines.push({productId:product._id,sku:product.sku,name:product.title,size,price,quantity:item.quantity,weightGrams:grams});
  goods+=price*item.quantity;weight+=grams;
 }
 const pickup=data.deliveryMethod==='pickup'||data.deliveryType==='retiro';
 let shipping=0;
 if(!pickup&&data.shippingPaymentMode==='paid'){
  const region=clean(data.shippingRegion), commune=clean(data.shippingComuna);
  const courier=clean(data.courier||data.shippingCourier).toLowerCase();
  const desired=courier.includes('paket')?'paket':courier.includes('blue')?'blue_express':courier.includes('starken')?'starken':null;
  if(!desired||!region||!commune)throw new Error('Región, comuna o courier inválidos');
  const quotes=calculateCourierQuotes({totalWeightGrams:weight,destinationRegion:region,destinationCommune:commune,
    originBranch:['vina_del_mar','quilpue','valparaiso'].includes(clean(data.branchId))?data.branchId:'vina_del_mar',cartSubtotalClp:goods});
  const selected=quotes.find(q=>q.courierId===desired);
  if(!selected||!selected.available)throw new Error('El despacho seleccionado no está disponible');
  shipping=selected.priceClp;
 }
 return {lines,goods,shipping,pickup};
}

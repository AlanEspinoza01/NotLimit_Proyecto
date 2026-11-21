import {type Request,type Response} from 'express';
import mongoose from 'mongoose';
import {randomBytes,createHash} from 'node:crypto';
import {OrderModel} from '../models/Order.model';
import {UserModel} from '../models/User.model';
import {WebpayAttemptModel} from '../models/WebpayAttempt.model';
import {AUTH_COOKIE_NAME,verifyAuthToken} from '../utils/tokenUtils';
import {quoteCheckout} from '../services/webpay/pricing.service';
import {adjustStock} from '../services/webpay/stock.service';
import {couponOffer,lockCoupon,redeemServerCoupon} from '../services/webpay/coupon.service';
import {webpayCreate,webpayCommit,webpayStatus,webpayFrontendUrl} from '../services/webpay/webpay.client';
import {confirmPaid,releaseRejected} from '../services/webpay/paymentLifecycle.service';
import {getOrderReceipt} from '../services/webpay/receipt.service';
const hash=(text:string)=>createHash('sha256').update(text).digest('hex');
const errMessage=(e:unknown)=>e instanceof Error?e.message:'Error inesperado';
const terminalFailures=new Set(['FAILED','REVERSED','NULLIFIED']);
/** Only a cookie issued by the backend can identify the coupon's owner. */
async function maybeAuth(req:Request){
 try{
  const token=req.cookies?.[AUTH_COOKIE_NAME]; if(!token)return null;
  const claims=verifyAuthToken(token);
  if(!mongoose.isObjectIdOrHexString(claims.sub))return null;
  const user=await UserModel.findById(claims.sub).select('+tokenVersion');
  if(!user?.isActive || (user.tokenVersion||0)!==claims.tokenVersion)return null;
  return user;
 }catch{return null;}
}
export async function redeemPaymentCoupon(req:Request,res:Response){
 try{
  const user=await maybeAuth(req);
  if(!user){res.status(401).json({success:false,message:'Inicia sesión para canjear puntos por cupones'});return;}
  const templateId=String(req.body?.templateId||'');
  if(!/^[\w-]{2,90}$/.test(templateId)){res.status(400).json({success:false,message:'Cupón inválido'});return;}
  const requestId=String(req.body?.requestId||'');
  if(!/^[a-zA-Z0-9-]{12,85}$/.test(requestId)){res.status(400).json({success:false,message:'Identificador de canje inválido'});return;}
  const result=await redeemServerCoupon(String(user._id),templateId,requestId);
  res.json({success:true,data:result});
 }catch(e){res.status(409).json({success:false,message:errMessage(e)});}
}
export async function startWebpay(req:Request,res:Response){
 const data=req.body||{};
 const requestId=String(data.requestId||'');
 if(!/^[a-zA-Z0-9-]{12,85}$/.test(requestId)){res.status(400).json({success:false,message:'Identificador de solicitud inválido'});return;}
 // Idempotency: do not reserve stock twice after duplicate clicks/retries.
 const existing=await WebpayAttemptModel.findOne({requestId});
 if(existing){res.status(409).json({success:false,message:'Este intento ya existe; consulta su estado antes de reintentar',orderNumber:existing.orderNumber});return;}
 const user=await maybeAuth(req);
 const couponCode=String(data.couponUsed||'').trim().toUpperCase();
 if(couponCode&&!user){res.status(401).json({success:false,message:'Inicia sesión para utilizar tu cupón'});return;}
 if(couponCode&&user&&String(data.customerEmail||'').toLowerCase().trim()!==user.email.toLowerCase()){res.status(403).json({success:false,message:'El correo de compra debe coincidir con el usuario propietario del cupón'});return;}
 if(data.pointsApplied||data.loyaltyPointsDiscount){res.status(400).json({success:false,message:'Los puntos solo pueden utilizarse para canjear cupones'});return;}
 const orderNumber='NL'+randomBytes(9).toString('hex').toUpperCase();
 const sessionId=randomBytes(12).toString('hex');
 const resultKey=randomBytes(24).toString('hex');
 const expiresAt=new Date(Date.now()+20*60*1000);
 let reserved=false;
 try{
  const preview=await mongoose.connection.transaction(async session=>{
   const offer=await quoteCheckout(data,session);
   let couponDiscount=0;let shipping=offer.shipping;
   if(couponCode){
    const result=await couponOffer(couponCode,String(user!._id),offer.goods,shipping,session);
    couponDiscount=result.discount;shipping=result.shipping;
   }
   const total=offer.goods-couponDiscount+shipping;
   if(!Number.isSafeInteger(total)||total<50)throw new Error('Total no permitido para pago Webpay; revisa el cupón y productos');
   if(!Number.isFinite(Number(data.total))||Math.abs(Number(data.total)-total)>1){
    const e:any=new Error(`El total cambió. El servidor calculó $${total.toLocaleString('es-CL')} CLP. Actualiza tu carrito.`);
    e.code='TOTAL_MISMATCH';throw e;
   }
   const lines=offer.lines.map(l=>({productId:l.productId,size:l.size,quantity:l.quantity}));
   await adjustStock(lines,-1,session);
   if(couponCode)await lockCoupon(couponCode,String(user!._id),orderNumber,session);
   const contactEmail=String(data.customerEmail||'').toLowerCase().trim().slice(0,190);
   if(!/^\S+@\S+\.\S+$/.test(contactEmail))throw new Error('Ingresa un email válido');
   const shippingDetails=offer.pickup?null:{courier:String(data.courier||'Starken'),trackingNumber:'',address:{
     region:String(data.shippingRegion||''),comuna:String(data.shippingComuna||''),street:String(data.shippingStreet||''),number:String(data.shippingNumber||''),apartment:String(data.shippingApartment||'')}};
   await OrderModel.create([{orderNumber,userId:user?user._id:null,guestEmail:user?null:contactEmail,customerEmail:contactEmail,
      customerName:String(data.customerName||'Cliente NoLimits'),customerRut:String(data.customerRut||''),customerPhone:String(data.customerPhone||''),
      branchId:String(data.branchId||'vina_del_mar'),branchName:String(data.branchName||''),
      items:offer.lines.map(l=>({productId:l.productId,sku:l.sku,name:l.name,size:l.size,price:l.price,quantity:l.quantity})),
      itemsSummary:offer.lines.map(l=>`${l.quantity}x ${l.name}`).join(', '),
      subtotal:offer.goods,shippingCost:shipping,total,confirmedRevenue:0,paymentStatus:'PENDING',paymentMethod:'Webpay Plus',
      deliveryType:offer.pickup?'retiro':'envio',pickupBranchId:offer.pickup?String(data.branchId||'vina_del_mar'):null,
      shippingDetails,status:'Pendiente de pago',fulfillmentStatus:'Pendiente de pago',registeredByAdmin:'Tienda Web Pública',
      statusAuditLog:[{status:'Reserva de stock',timestamp:new Date().toISOString(),note:'Esperando autorización Webpay Plus'}]
   }],{session});
   await WebpayAttemptModel.create([{requestId,orderNumber,sessionId,paymentToken:'',gatewayUrl:'',resultKeyHash:hash(resultKey),
     state:'INITIATING',expiresAt,couponCode,items:lines}],{session});
   return {total};
  });
  reserved=true;
  // External call deliberately outside MongoDB transaction.
  const gateway=await webpayCreate(orderNumber,sessionId,preview.total);
  await WebpayAttemptModel.updateOne({orderNumber,state:'INITIATING'},{$set:{paymentToken:gateway.token,gatewayUrl:gateway.url,state:'READY'}});
  res.json({success:true,data:{orderNumber,url:gateway.url,token:gateway.token,resultKey}});
 }catch(e:any){
  console.error('[WEBPAY][START]',errMessage(e));
  if(reserved){
   // Cannot infer external state from timeout: preserve stock until reconciled.
   await WebpayAttemptModel.updateOne({orderNumber,state:'INITIATING'},{$set:{state:'REVIEW_REQUIRED',lastError:errMessage(e)}}).catch(()=>{});
  }
  res.status(e?.code==='TOTAL_MISMATCH'?409:400).json({success:false,message:errMessage(e),...(reserved?{orderNumber}: {})});
 }
}
function redirectResult(res:Response,orderNumber:string){
 // Return key is NOT put in the URL; the browser saved it in sessionStorage on creation.
 res.setHeader('Referrer-Policy','no-referrer');
 return res.redirect(303,webpayFrontendUrl()+'/#/payment-result?order='+encodeURIComponent(orderNumber));
}
export async function webpayReturn(req:Request,res:Response){
 const token=String(req.body?.token_ws||req.query?.token_ws||'');
 const abortedToken=String(req.body?.TBK_TOKEN||req.query?.TBK_TOKEN||'');
 const cancelledOrder=String(req.body?.TBK_ORDEN_COMPRA||req.query?.TBK_ORDEN_COMPRA||'');
 const incomingToken=token||abortedToken;
 const attempt=incomingToken?await WebpayAttemptModel.findOne({paymentToken:incomingToken}):
   (cancelledOrder?await WebpayAttemptModel.findOne({orderNumber:cancelledOrder}):null);
 if(!attempt){res.status(400).send('Transacción no identificada; contacta a soporte');return;}
 const order=attempt.orderNumber;
 if(['CONFIRMED','REJECTED'].includes(attempt.state)){redirectResult(res,order);return;}
 if(token){
  // Prevent two independent HTTP returns both calling PUT commit.
  const claimed=await WebpayAttemptModel.updateOne({_id:attempt._id,state:'READY'},{$set:{state:'VERIFYING'}});
  if(claimed.modifiedCount===1){
   try{
    const tx=await webpayCommit(token);
    if(tx.status==='AUTHORIZED'&&tx.response_code===0){await confirmPaid(order,tx);}
    else if(terminalFailures.has(tx.status)||tx.response_code!==0){await releaseRejected(order,'Webpay no autorizó el pago');}
    else{await WebpayAttemptModel.updateOne({_id:attempt._id},{$set:{state:'REVIEW_REQUIRED',lastError:'Estado no definitivo'}});}
   }catch(e){
    console.error('[WEBPAY][RETURN] Conciliar',order,errMessage(e));
    await WebpayAttemptModel.updateOne({_id:attempt._id,state:{$nin:['CONFIRMED','REJECTED']}},{$set:{state:'REVIEW_REQUIRED',lastError:errMessage(e)}});
   }
  }
 }else{
   // TBK_TOKEN or cancelled: never release from unverified browser/GET callback alone.
   await WebpayAttemptModel.updateOne({_id:attempt._id,state:'READY'},{$set:{state:'REVIEW_REQUIRED',lastError:'Aborto/timeout: verificar con Transbank'}});
 }
 redirectResult(res,order);
}
export async function queryWebpayResult(req:Request,res:Response){
 try{
  const order=String(req.query.order||'');const key=String(req.query.key||'');
  if(key.length<32){res.status(403).json({success:false,message:'Consulta no autorizada'});return;}
  const attempt=await WebpayAttemptModel.findOne({orderNumber:order,resultKeyHash:hash(key)});
  if(!attempt){res.status(404).json({success:false,message:'Compra no encontrada'});return;}
  const model=await OrderModel.findOne({orderNumber:order}).select('orderNumber paymentStatus total confirmedRevenue');
  res.setHeader('Cache-Control','private, no-store');
  // Solo la combinación de estados confirmados permite obtener comprobante de pago.
  const receipt=attempt.state==='CONFIRMED'&&model?.paymentStatus==='CONFIRMED'
   ?await getOrderReceipt(order):null;
  res.json({success:true,data:{orderNumber:order,state:attempt.state,paymentStatus:model?.paymentStatus,
   total:model?.total,confirmedRevenue:model?.confirmedRevenue,receipt:receipt?.verified?receipt:null}});
 }catch(error){
  console.error('[WEBPAY][RECEIPT]',errMessage(error));
  res.status(500).json({success:false,message:'No se pudo recuperar el comprobante. Intenta consultar la orden nuevamente.'});
 }
}

/** Protected cron/reconciliation: no state is inferred from local time alone. */
export async function reconcileWebpay(req:Request,res:Response){
 const supplied=req.get('X-NoLimits-Cron-Secret')||'';
 const secret=process.env.WEBPAY_CRON_SECRET||'';
 if(!secret||supplied!==secret){res.status(403).json({success:false});return;}
 const attempts=await WebpayAttemptModel.find({state:{$in:['READY','VERIFYING','REVIEW_REQUIRED']},expiresAt:{$lte:new Date()}})
  .sort({expiresAt:1}).limit(30);
 const results=[] as {order:string;status:string}[];
 for(const a of attempts){
  try{
   if(!a.paymentToken){results.push({order:a.orderNumber,status:'MANUAL_REVIEW_NO_TOKEN'});continue;}
   const tx=await webpayStatus(a.paymentToken);
   if(tx.status==='AUTHORIZED'&&tx.response_code===0){await confirmPaid(a.orderNumber,tx);results.push({order:a.orderNumber,status:'CONFIRMED'});}
   else if(terminalFailures.has(tx.status)){await releaseRejected(a.orderNumber,`Estado Transbank: ${tx.status}`);results.push({order:a.orderNumber,status:'REJECTED'});}
   else{await WebpayAttemptModel.updateOne({_id:a._id,state:{$nin:['CONFIRMED','REJECTED']}},{$set:{state:'REVIEW_REQUIRED',lastError:`Conciliar: ${tx.status}`}});
     results.push({order:a.orderNumber,status:'MANUAL_REVIEW'});}
  }catch(e){results.push({order:a.orderNumber,status:'ERROR_REVIEW'});console.error('[WEBPAY][RECONCILE]',a.orderNumber,errMessage(e));}
 }
 res.json({success:true,processed:results.length,results});
}

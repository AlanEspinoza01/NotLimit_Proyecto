import mongoose, {type ClientSession} from 'mongoose';
import {randomBytes} from 'node:crypto';
import {StoreSettingsModel} from '../../models/StoreSettings.model';
import {UserModel} from '../../models/User.model';
import {PaymentCouponModel} from '../../models/PaymentCoupon.model';

/** Representación para la UI; todos los campos provienen de un documento MongoDB. */
function serializeCoupon(doc:any,user:any){
 const now=new Date(doc.redeemedAt),expiresAt=new Date(doc.expiresAt);
 const value=Number(doc.discountValue);
 return {id:String(doc._id),code:doc.code,templateId:doc.templateId,title:doc.title,
   discountType:doc.discountType,discountValue:value,
   discount:doc.discountType==='percentage'?`${value}% OFF`:doc.discountType==='free_shipping'?'Envío Gratis':`${value.toLocaleString('es-CL')} CLP`,
   minPurchase:doc.minPurchase,pointsSpent:doc.pointsSpent,userEmail:user.email,userName:user.name||user.firstName,
   date:now.toLocaleDateString('es-CL'),redeemedAtIso:now.toISOString(),expiresAtIso:expiresAt.toISOString(),
   expiresAtLabel:expiresAt.toLocaleDateString('es-CL'),status:doc.status==='AVAILABLE'?'disponible':'usado'};
}


/** Redeem a catalogue template using the user's authenticated identity and atomic DB points debit. */
export async function redeemServerCoupon(userId:string, templateId:string, requestId:string) {
  // Si llegó la misma solicitud dos veces, devolver la misma emisión sin recobrar puntos.
  const existing=await PaymentCouponModel.findOne({userId,clientRequestId:requestId});
  if(existing){
    const owner=await UserModel.findById(userId);
    if(!owner||existing.templateId!==templateId)throw new Error('Solicitud de canje no corresponde al cupón original');
    return {redeemedCoupon:serializeCoupon(existing,owner),newPoints:owner.loyaltyPoints};
  }
  try { return await mongoose.connection.transaction(async (session) => {
    const settings=await StoreSettingsModel.findById('global_settings').session(session);
    const templates=Array.isArray(settings?.coupons) ? settings.coupons : [];
    const template=templates.find((x:any)=>String(x.id)===templateId && x.isActive!==false);
    if(!template) throw new Error('El cupón no está habilitado en el catálogo MongoDB. Sincroniza el editor de cupones.');
    const cost=Number(template.pointsCost);const max=Number(template.maxUses);
    const used=Number(template.totalRedemptions||0);
    if(!Number.isSafeInteger(cost)||cost<=0||!Number.isFinite(max)||used>=max)throw new Error('Cupón no disponible');
    if(!['fixed','percentage','free_shipping'].includes(template.discountType))throw new Error('Tipo de cupón inválido');
    const value=Number(template.discountValue||0);
    if(!Number.isFinite(value)||value<0||(template.discountType==='percentage'&&value>100))throw new Error('Descuento inválido');
    const user=await UserModel.findOneAndUpdate({_id:userId,loyaltyPoints:{$gte:cost}},
      {$inc:{loyaltyPoints:-cost},$set:{lastPointsReason:`Canje de cupón ${template.name} (-${cost} pts)`}},
      {session,returnDocument:'after'});
    if(!user)throw new Error('Puntos insuficientes para canjear el cupón');
    const updated=await StoreSettingsModel.updateOne({_id:'global_settings',coupons:{$elemMatch:{id:templateId,isActive:true,totalRedemptions:{$lt:max}}}},
      {$inc:{'coupons.$.totalRedemptions':1}},{session});
    if(updated.modifiedCount!==1)throw new Error('El cupón agotó su límite de canjes');
    const now=new Date();const duration=Math.min(365,Math.max(1,Number(template.expirationDays||14)));
    const expiresAt=new Date(now.getTime()+duration*86400000);
    const code=String(template.code||'NL').replace(/[^\w-]/g,'').slice(0,12).toUpperCase()+'-'+randomBytes(9).toString('hex').toUpperCase();
    const [doc]=await PaymentCouponModel.create([{code,userId:user._id,templateId,title:String(template.name||'Cupón NoLimits'),
      discountType:template.discountType,discountValue:value,minPurchase:Number(template.minPurchase||0),
      pointsSpent:cost,redeemedAt:now,expiresAt,status:'AVAILABLE',clientRequestId:requestId}],{session});
    const redeemedCoupon=serializeCoupon(doc,user);
    return {redeemedCoupon,newPoints:user.loyaltyPoints};
  });
  } catch(error:any){
    // Índice único: incluso dos solicitudes concurrentes tienen como máximo un débito.
    if(error?.code===11000){
      const previous=await PaymentCouponModel.findOne({userId,clientRequestId:requestId});
      const owner=await UserModel.findById(userId);
      if(previous && owner && previous.templateId===templateId){
        return {redeemedCoupon:serializeCoupon(previous,owner),newPoints:owner.loyaltyPoints};
      }
    }
    throw error;
  }
}

/** Validate issued coupons in DB and calculate discount from server-authoritative totals. */
export async function couponOffer(code:string,userId:string,goodsSubtotal:number,shipping:number,session:ClientSession){
  const coupon=await PaymentCouponModel.findOne({code,userId,status:'AVAILABLE',expiresAt:{$gt:new Date()}}).session(session);
  if(!coupon)throw new Error('Cupón no emitido, vencido, usado o reservado; los códigos locales anteriores requieren reemisión validada');
  if(goodsSubtotal<coupon.minPurchase)throw new Error('El carrito no alcanza el monto mínimo del cupón');
  let discount=0;
  if(coupon.discountType==='fixed')discount=Math.min(goodsSubtotal,coupon.discountValue);
  if(coupon.discountType==='percentage')discount=Math.round(goodsSubtotal*coupon.discountValue/100);
  const finalShipping=coupon.discountType==='free_shipping'?0:shipping;
  return {coupon,discount,shipping:finalShipping};
}
export async function lockCoupon(code:string,userId:string,orderNumber:string,session:ClientSession){
  const doc=await PaymentCouponModel.findOneAndUpdate({code,userId,status:'AVAILABLE',expiresAt:{$gt:new Date()}},
    {$set:{status:'RESERVED',reservedOrderNumber:orderNumber}},{session,returnDocument:'after'});
  if(!doc)throw new Error('El cupón fue reservado o utilizado en otra compra');
}
export async function unlockCoupon(code:string,orderNumber:string,session:ClientSession){
  if(!code)return;
  await PaymentCouponModel.updateOne({code,status:'RESERVED',reservedOrderNumber:orderNumber},
    {$set:{status:'AVAILABLE',reservedOrderNumber:''}},{session});
}
export async function consumeCoupon(code:string,orderNumber:string,session:ClientSession){
  if(!code)return;
  const result=await PaymentCouponModel.updateOne({code,status:'RESERVED',reservedOrderNumber:orderNumber},
    {$set:{status:'USED',reservedOrderNumber:'',usedOrderNumber:orderNumber}},{session});
  if(result.modifiedCount!==1)throw new Error('No se pudo confirmar el uso del cupón');
}

import mongoose from 'mongoose';
import {WebpayAttemptModel} from '../../models/WebpayAttempt.model';
import {OrderModel} from '../../models/Order.model';
import {ProductModel} from '../../models/Product.model';
import {UserModel} from '../../models/User.model';
import {adjustStock} from './stock.service';
import {consumeCoupon,unlockCoupon} from './coupon.service';
import type {WebpayTransaction} from './webpay.client';

function validatePayment(tx:WebpayTransaction,attempt:any,order:any){
 const approved=tx.response_code===0&&tx.status==='AUTHORIZED';
 if(!approved)return false;
 if(tx.buy_order!==attempt.orderNumber || tx.session_id!==attempt.sessionId || Number(tx.amount)!==Number(order.total)){
  throw new Error('Transbank confirmó datos que no coinciden con la orden; conciliación manual requerida');
 }
 return true;
}
export async function confirmPaid(orderNumber:string,tx:WebpayTransaction){
 return mongoose.connection.transaction(async session=>{
  const a=await WebpayAttemptModel.findOne({orderNumber}).session(session);
  const o=await OrderModel.findOne({orderNumber}).session(session);
  if(!a||!o)throw new Error('Orden no encontrada');
  if(a.state==='CONFIRMED')return 'CONFIRMED';
  if(['REJECTED'].includes(a.state))throw new Error('Orden liberada previamente: requiere conciliación y posible reversa');
  if(!validatePayment(tx,a,o))throw new Error('Pago todavía no autorizado');
  const claim=await WebpayAttemptModel.updateOne({_id:a._id,state:{$in:['READY','VERIFYING','REVIEW_REQUIRED']}},
    {$set:{state:'CONFIRMED',lastError:''}},{session});
  if(claim.modifiedCount!==1)throw new Error('La confirmación está siendo procesada');
  for(const item of a.items){
   await ProductModel.updateOne({_id:item.productId},{$inc:{soldUnits:item.quantity}},{session});
  }
  o.paymentStatus='CONFIRMED';o.confirmedRevenue=o.total;o.status='Solicitud recibida';o.fulfillmentStatus='Solicitud recibida';
  o.webpayAuthorizationCode=tx.authorization_code||'';o.webpayTransactionDate=tx.transaction_date||'';
  o.statusAuditLog=[...(o.statusAuditLog||[]),{status:'Pago confirmado',timestamp:new Date().toISOString(),note:'Autorizado por Transbank Webpay Plus'}];
  await o.save({session,validateBeforeSave:false});
  if(o.userId){const points=Math.max(10,Math.floor(o.total/1000));
   await UserModel.updateOne({_id:o.userId},{$inc:{loyaltyPoints:points,totalOrdersCount:1,totalSpentClp:o.total},
    $set:{lastPointsReason:`Compra Webpay ${orderNumber} (+${points} pts)`}},{session});}
  await consumeCoupon(a.couponCode,orderNumber,session);
  return 'CONFIRMED';
 });
}

/** Only call when status explicitly verifies terminal rejection, never on network timeout. */
export async function releaseRejected(orderNumber:string,reason:string){
 return mongoose.connection.transaction(async session=>{
  const attempt=await WebpayAttemptModel.findOne({orderNumber}).session(session);
  const order=await OrderModel.findOne({orderNumber}).session(session);
  if(!attempt||!order)throw new Error('Orden no encontrada');
  if(attempt.state==='REJECTED')return 'REJECTED';
  if(attempt.state==='CONFIRMED')return 'CONFIRMED';
  const claimed=await WebpayAttemptModel.updateOne({_id:attempt._id,state:{$in:['READY','VERIFYING','INITIATING','REVIEW_REQUIRED']}},
   {$set:{state:'REJECTED',lastError:reason}},{session});
  if(claimed.modifiedCount!==1)throw new Error('La orden cambió durante la conciliación');
  await adjustStock(attempt.items,1,session);
  await unlockCoupon(attempt.couponCode,orderNumber,session);
  order.paymentStatus='REJECTED';order.confirmedRevenue=0;order.status='Pago Anulado';order.fulfillmentStatus='Pago Anulado';
  order.statusAuditLog=[...(order.statusAuditLog||[]),{status:'Pago rechazado',timestamp:new Date().toISOString(),note:reason}];
  await order.save({session,validateBeforeSave:false});
  return 'REJECTED';
 });
}

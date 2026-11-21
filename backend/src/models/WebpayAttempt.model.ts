import mongoose, { Schema, type Document, type Types } from 'mongoose';
export type PaymentAttemptState='INITIATING'|'READY'|'VERIFYING'|'CONFIRMED'|'REJECTED'|'REVIEW_REQUIRED';
export interface IWebpayAttempt extends Document {
 requestId:string; orderNumber:string; sessionId:string; paymentToken:string; gatewayUrl:string;
 resultKeyHash:string; state:PaymentAttemptState; expiresAt:Date; couponCode:string;
 items:{productId:Types.ObjectId;size:string;quantity:number}[];
 lastError:string; createdAt:Date; updatedAt:Date;
}
const schema=new Schema<IWebpayAttempt>({
 requestId:{type:String,required:true,unique:true},
 orderNumber:{type:String,required:true,unique:true},
 sessionId:{type:String,required:true},
 paymentToken:{type:String,default:''}, gatewayUrl:{type:String,default:''},
 resultKeyHash:{type:String,required:true},
 state:{type:String,enum:['INITIATING','READY','VERIFYING','CONFIRMED','REJECTED','REVIEW_REQUIRED'],required:true},
 expiresAt:{type:Date,required:true},couponCode:{type:String,default:''},
 items:[{_id:false, productId:{type:Schema.Types.ObjectId,required:true},size:String,quantity:Number}],
 lastError:{type:String,default:''}
},{collection:'webpay_attempts',timestamps:true});
schema.index({state:1,expiresAt:1});
schema.index({paymentToken:1},{unique:true,partialFilterExpression:{paymentToken:{$type:'string',$gt:''}}});
export const WebpayAttemptModel=mongoose.models.WebpayAttempt||mongoose.model<IWebpayAttempt>('WebpayAttempt',schema);

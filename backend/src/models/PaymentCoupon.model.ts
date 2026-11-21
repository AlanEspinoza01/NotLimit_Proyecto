import mongoose, {Schema, type Document, type Types} from 'mongoose';
export type PaymentCouponStatus='AVAILABLE'|'RESERVED'|'USED';
export interface IPaymentCoupon extends Document{
 code:string;userId:Types.ObjectId;templateId:string;title:string;
 discountType:'fixed'|'percentage'|'free_shipping';discountValue:number;minPurchase:number;
 pointsSpent:number;redeemedAt:Date;expiresAt:Date;status:PaymentCouponStatus;
 reservedOrderNumber:string;usedOrderNumber:string;clientRequestId:string;
}
const schema=new Schema<IPaymentCoupon>({
 code:{type:String,unique:true,required:true},userId:{type:Schema.Types.ObjectId,required:true,ref:'User'},
 templateId:{type:String,required:true},title:{type:String,required:true},
 discountType:{type:String,required:true,enum:['fixed','percentage','free_shipping']},
 discountValue:{type:Number,required:true,min:0},minPurchase:{type:Number,default:0,min:0},
 pointsSpent:{type:Number,required:true,min:0}, redeemedAt:{type:Date,required:true},
 expiresAt:{type:Date,required:true},status:{type:String,enum:['AVAILABLE','RESERVED','USED'],default:'AVAILABLE'},
 reservedOrderNumber:{type:String,default:''},usedOrderNumber:{type:String,default:''},
 clientRequestId:{type:String,default:undefined}
},{collection:'payment_coupons',timestamps:true});
schema.index({userId:1,status:1,expiresAt:1});
schema.index({userId:1,clientRequestId:1},{unique:true,partialFilterExpression:{clientRequestId:{$type:'string'}}});
export const PaymentCouponModel=mongoose.models.PaymentCoupon||mongoose.model<IPaymentCoupon>('PaymentCoupon',schema);

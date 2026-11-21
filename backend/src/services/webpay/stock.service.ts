import type {ClientSession,Types} from 'mongoose';
import {ProductModel} from '../../models/Product.model';
export interface StockLine {productId:Types.ObjectId;size:string;quantity:number}
/** Stock physical is deducted ONCE on reservation, never twice on payment confirmation. */
export async function adjustStock(lines:StockLine[],direction:-1|1,session:ClientSession){
 for(const line of lines){
  const product=await ProductModel.findById(line.productId).session(session);
  if(!product)throw new Error('Producto no encontrado para reserva/liberación');
  const quantity=line.quantity;if(!Number.isSafeInteger(quantity)||quantity<=0)throw new Error('Cantidad inválida');
  let filter:any={_id:line.productId};
  let increase:any={stock:direction*quantity,totalStock:direction*quantity};
  if(product.sizeBreakdown?.length){
    const found=product.sizeBreakdown.find((x:any)=>x.size===line.size);
    if(!found)throw new Error('No existe la talla a modificar');
    filter['sizeBreakdown']={$elemMatch:{size:line.size,...(direction===-1?{quantity:{$gte:quantity}}:{})}};
    increase['sizeBreakdown.$.quantity']=direction*quantity;
    increase['sizeBreakdown.$.stock']=direction*quantity;
  } else if(direction===-1){filter.stock={$gte:quantity};}
  if(direction===-1){filter.totalStock={$gte:quantity};filter.stock={$gte:quantity};}
  const updated=await ProductModel.findOneAndUpdate(filter,{$inc:increase},{session,returnDocument:'after'});
  if(!updated)throw new Error(`Stock insuficiente o bloqueado: ${product.title} / ${line.size}`);
  if(updated.sizeBreakdown?.length){
   const sizes=updated.sizeBreakdown.map((x:any)=>`${x.size} (${x.quantity})`);
   await ProductModel.updateOne({_id:line.productId},{$set:{sizes}},{session});
  }
 }
}

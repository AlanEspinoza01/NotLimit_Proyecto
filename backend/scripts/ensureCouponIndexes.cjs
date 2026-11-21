// Ejecución manual previa a producción; no se ejecuta automáticamente al iniciar el servidor.
// node --env-file=src/middleware/.env scripts/ensureCouponIndexes.cjs
const mongoose=require('mongoose');
async function run(){
 if(!process.env.MONGODB_URI)throw new Error('Falta MONGODB_URI');
 await mongoose.connect(process.env.MONGODB_URI,{dbName:'nolimits_db'});
 try{
   const col=mongoose.connection.db.collection('payment_coupons');
   await col.createIndex({code:1},{unique:true});
   await col.createIndex({userId:1,clientRequestId:1},{
     unique:true,
     partialFilterExpression:{clientRequestId:{$type:'string'}}
   });
   console.log('Índices únicos de códigos e idempotencia verificados.');
 }finally{await mongoose.disconnect();}
}
run().catch(err=>{console.error('No se pudieron crear índices:',err.message);process.exitCode=1;});

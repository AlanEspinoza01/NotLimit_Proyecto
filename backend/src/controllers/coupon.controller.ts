import { randomBytes } from 'node:crypto';
import { type Request, type Response, type NextFunction } from 'express';
import { StoreSettingsModel } from '../models/StoreSettings.model';
import { PaymentCouponModel } from '../models/PaymentCoupon.model';
import { ApiError } from '../utils/ApiError';

/** Fuente única de la verdad: NO se aceptan cupones o descuentos enviados por localStorage. */
export const getPublicCouponCatalog = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await StoreSettingsModel.findById('global_settings').lean();
    const items = Array.isArray(settings?.coupons) ? settings.coupons : [];
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, data: items.filter((item: any) => item.isActive === true) });
  } catch (error) { next(error); }
};

/** Solo el usuario autenticado puede consultar los cupones emitidos a su cuenta. */
export const getMyPaymentCoupons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new ApiError(401, 'Debes iniciar sesión');
    const docs = await PaymentCouponModel.find({ userId: req.user._id }).sort({ redeemedAt: -1 }).limit(500).lean();
    const now = Date.now();
    const coupons = docs.map((item: any) => {
      const expired = new Date(item.expiresAt).getTime() <= now;
      const status = item.status === 'USED' || item.status === 'RESERVED' ? 'usado' : expired ? 'expirado' : 'disponible';
      const label = item.discountType === 'percentage' ? `${item.discountValue}% OFF`
        : item.discountType === 'free_shipping' ? 'Envío Gratis'
        : `${Number(item.discountValue).toLocaleString('es-CL')} CLP`;
      return {
        id: String(item._id), code: item.code, templateId: item.templateId, title: item.title,
        discountType: item.discountType, discountValue: item.discountValue, discount: label,
        minPurchase: item.minPurchase, pointsSpent: item.pointsSpent,
        userEmail: req.user!.email, userName: req.user!.name || req.user!.firstName,
        date: new Date(item.redeemedAt).toLocaleDateString('es-CL'),
        redeemedAtIso: new Date(item.redeemedAt).toISOString(),
        expiresAtIso: new Date(item.expiresAt).toISOString(),
        expiresAtLabel: new Date(item.expiresAt).toLocaleDateString('es-CL'),
        status, usedOrderNumber: item.usedOrderNumber || item.reservedOrderNumber || undefined
      };
    });
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ success: true, data: coupons });
  } catch (error) { next(error); }
};

/** Panel del superadmin: obtiene catálogo y canjes reales, no datos ficticios del navegador. */
export const getAdminCouponCatalog = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await StoreSettingsModel.findById('global_settings').lean();
    res.setHeader('Cache-Control', 'no-store');
    res.json({success: true, data: Array.isArray(settings?.coupons) ? settings.coupons : []});
  } catch (error) { next(error); }
};

export const getAdminCouponHistory = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupons = await PaymentCouponModel.find().sort({redeemedAt:-1}).limit(500).populate('userId','email firstName lastName').lean();
    res.setHeader('Cache-Control', 'no-store');
    res.json({success: true, data: coupons.map((c: any) => ({
      id: String(c._id), code: c.code, templateId: c.templateId, title: c.title,
      discountType: c.discountType, discountValue: c.discountValue, minPurchase: c.minPurchase,
      pointsSpent: c.pointsSpent, redeemedAtIso: new Date(c.redeemedAt).toISOString(),
      userEmail: c.userId?.email || '', userName: [c.userId?.firstName,c.userId?.lastName].filter(Boolean).join(' '),
      expiresAtIso: new Date(c.expiresAt).toISOString(), status: c.status === 'AVAILABLE' ? 'disponible' : c.status === 'USED' ? 'usado' : 'usado',
      usedOrderNumber: c.usedOrderNumber || c.reservedOrderNumber || ''
    }))});
  } catch (error) { next(error); }
};

/** Valida campos económicos en el servidor y nunca acepta totalRedemptions del cliente. */
function parseTemplate(data: any) {
  const name = String(data?.name || '').trim();
  const badge = String(data?.badge || 'EXCLUSIVO').trim();
  const code = String(data?.code || '').trim().toUpperCase();
  const discountType = String(data?.discountType || '');
  const cost = Number(data?.pointsCost);
  const discount = Number(data?.discountValue);
  const minPurchase = Number(data?.minPurchase);
  const expirationDays = Number(data?.expirationDays);
  const maxUses = Number(data?.maxUses);
  if (name.length < 3 || name.length > 110 || badge.length > 35 || !/^[A-Z0-9-]{3,24}$/.test(code)) throw new ApiError(400, 'Nombre o prefijo del cupón inválido');
  if (!['fixed','percentage','free_shipping'].includes(discountType)) throw new ApiError(400, 'Tipo de descuento inválido');
  if (!Number.isSafeInteger(cost) || cost < 1 || cost > 1000000) throw new ApiError(400, 'Costo de puntos inválido');
  if (!Number.isSafeInteger(discount) || (discountType === 'free_shipping' ? discount !== 0 : discount <= 0) || discount > (discountType === 'percentage' ? 100 : 5000000)) throw new ApiError(400, 'Descuento fuera de rango');
  if (!Number.isSafeInteger(minPurchase) || minPurchase < 0 || minPurchase > 50000000) throw new ApiError(400, 'Mínimo de compra inválido');
  if (!Number.isSafeInteger(expirationDays) || expirationDays < 1 || expirationDays > 365) throw new ApiError(400, 'Vigencia inválida');
  if (!Number.isSafeInteger(maxUses) || maxUses < 1 || maxUses > 1000000) throw new ApiError(400, 'Límite de canjes inválido');
  return {name, badge, code, discountType, pointsCost:cost, discountValue:discount, minPurchase, expirationDays, maxUses,
    expirationRule:`${expirationDays} días de vida después del canjeo`, isActive: data?.isActive === undefined ? true : data.isActive === true};
}

/** Agrega una plantilla sin sobrescribir las otras ni sus contadores. */
export const createAdminCoupon = async (req:Request,res:Response,next:NextFunction):Promise<void> => {
  try {
    const fields = parseTemplate(req.body);
    const id = `coup_${randomBytes(9).toString('hex')}`;
    const coupon = {...fields,id,totalRedemptions:0,createdAt:new Date().toISOString().slice(0,10)};
    await StoreSettingsModel.updateOne({_id:'global_settings'},{$setOnInsert:{coupons:[]}}, {upsert:true});
    const updated = await StoreSettingsModel.updateOne({_id:'global_settings','coupons.code':{$ne:fields.code}},{$push:{coupons:coupon}});
    if(updated.modifiedCount!==1)throw new ApiError(409,'Ya existe un cupón con ese prefijo');
    res.status(201).json({success:true,data:coupon});
  }catch(error){next(error);}
};

/** Posicional: modifica solo los atributos editables, sin tocar totalRedemptions. */
export const updateAdminCoupon = async (req:Request,res:Response,next:NextFunction):Promise<void> => {
  try {
    const id = String(req.params.id || '');
    if(!/^coup_[\w-]{1,90}$/.test(id))throw new ApiError(400,'Identificador de cupón inválido');
    const current = await StoreSettingsModel.findOne({_id:'global_settings','coupons.id':id}).lean();
    const old = (current?.coupons||[]).find((c:any)=>c.id===id);
    if(!old)throw new ApiError(404,'Cupón no encontrado');
    const nextFields = {...old,...req.body};
    const fields = parseTemplate(nextFields);
    if(fields.maxUses < Number(old.totalRedemptions||0))throw new ApiError(409,'El máximo no puede ser menor a los canjes reales');
    const conflict = (current?.coupons||[]).some((c:any)=>c.id!==id&&c.code===fields.code);
    if(conflict)throw new ApiError(409,'El prefijo ya está utilizado por otro cupón');
    const changes:Record<string,unknown>={};
    for(const [key,value] of Object.entries(fields))changes[`coupons.$.${key}`]=value;
    const result=await StoreSettingsModel.updateOne({_id:'global_settings','coupons.id':id},{$set:changes});
    if(result.matchedCount!==1)throw new ApiError(409,'El cupón cambió; vuelve a cargar el catálogo');
    res.json({success:true});
  }catch(error){next(error);}
};

/** El catálogo elimina plantillas, pero los cupones ya emitidos conservan su copia histórica. */
export const deleteAdminCoupon = async (req:Request,res:Response,next:NextFunction):Promise<void> => {
  try {
    const id=String(req.params.id||'');
    if(!/^coup_[\w-]{1,90}$/.test(id))throw new ApiError(400,'Identificador inválido');
    const result=await StoreSettingsModel.updateOne({_id:'global_settings'},{$pull:{coupons:{id}}});
    if(result.modifiedCount!==1)throw new ApiError(404,'Cupón no encontrado');
    res.json({success:true});
  }catch(error){next(error);}
};

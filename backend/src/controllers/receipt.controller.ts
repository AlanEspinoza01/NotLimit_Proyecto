import type { Request, Response, NextFunction } from 'express';
import { OrderModel } from '../models/Order.model';
import { getOrderReceipt } from '../services/webpay/receipt.service';
import mongoose from 'mongoose';

/** GET /api/admin/orders/:id/receipt - protegido por el router super_admin. */
export const getAdminOrderReceipt = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = String(req.params.id || '');
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ success: false, message: 'Identificador de orden inválido' });
      return;
    }
    const order = await OrderModel.findById(id).select('orderNumber').lean();
    if (!order) {
      res.status(404).json({ success: false, message: 'Orden no encontrada' });
      return;
    }
    const receipt = await getOrderReceipt(order.orderNumber);
    if (!receipt) {
      res.status(404).json({ success: false, message: 'No se pudo encontrar el detalle' });
      return;
    }
    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ success: true, data: receipt });
  } catch (error) {
    next(error);
  }
};

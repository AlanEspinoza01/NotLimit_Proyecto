import { Request, Response, NextFunction } from 'express';
import { ReturnModel } from '../models/Return.model';
import { OrderModel } from '../models/Order.model';

// 1. Cliente: Obtener sus propias solicitudes de devolución
export const getMyReturns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Debes iniciar sesión.' });
      return;
    }

    const userEmail = String(req.user.email || '').toLowerCase().trim();

    const returns = await ReturnModel.find({
      $or: [
        { userId: req.user._id },
        { customerEmail: { $regex: new RegExp(`^${userEmail}$`, 'i') } },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: returns });
  } catch (error) {
    next(error);
  }
};

// 2. Cliente: Crear nueva solicitud de devolución (Exige mínimo 1 foto + sincroniza OrderModel)
export const createReturnRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Debes iniciar sesión para solicitar una devolución.' });
      return;
    }

    const {
      orderNumber,
      reason,
      returnMethod,
      returnCourier,
      shippingCostClp,
      paidByStore,
      targetBranchId,
      targetBranchName,
      notes,
      customerName,
      customerRut,
      customerPhone,
      shippingAddress,
      products,
    } = req.body;

    if (!orderNumber) {
      res.status(400).json({ success: false, message: 'El número de orden es obligatorio.' });
      return;
    }

    // Validación obligatoria: mínimo 1 foto de respaldo
    const uploadedPhotos =
      req.files && Array.isArray(req.files)
        ? (req.files as any[]).map((file) => file.path).filter(Boolean)
        : [];

    if (uploadedPhotos.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Debes adjuntar al menos 1 fotografía de respaldo del producto para procesar la devolución.',
      });
      return;
    }

    let parsedProducts: any[] = [];
    try {
      parsedProducts =
        typeof products === 'string'
          ? JSON.parse(products)
          : Array.isArray(products)
          ? products
          : [];
    } catch {
      parsedProducts = [];
    }

    if (parsedProducts.length === 0) {
      res.status(400).json({ success: false, message: 'Debes seleccionar al menos una prenda para devolver.' });
      return;
    }

    let parsedAddress: any = null;
    try {
      parsedAddress =
        typeof shippingAddress === 'string' && shippingAddress.trim().startsWith('{')
          ? JSON.parse(shippingAddress)
          : shippingAddress || null;
    } catch {
      parsedAddress = null;
    }

    // Buscar la orden original en MongoDB para vincularla y actualizar su estado
    const orderDoc = await OrderModel.findOne({ orderNumber: String(orderNumber).trim() });

    const ticketNumber = `DEV-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmount = parsedProducts.reduce(
      (acc, p) => acc + (Number(p.price) || 0) * (Number(p.quantity) || 1),
      0
    );

    const isShipping = returnMethod === 'courier_shipping' || returnMethod === 'shipping';

    const newReturn = await ReturnModel.create({
      ticketNumber,
      orderId: orderDoc?._id || null,
      orderNumber: String(orderNumber).trim(),
      userId: req.user._id,
      customerName:
        customerName ||
        `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() ||
        req.user.email.split('@')[0],
      customerRut: customerRut || req.user.rut || '',
      customerPhone: customerPhone || req.user.phone || '',
      customerEmail: String(req.user.email || '').toLowerCase().trim(),
      reason: String(reason || 'Defecto de fabricación'),
      notes:
        notes?.trim() ||
        `Cliente solicita devolución por ${String(reason || 'defecto').toLowerCase()}.`,
      products: parsedProducts.map((p) => ({
        id: String(p.id || ''),
        name: String(p.name || 'Prenda NoLimits'),
        quantity: Number(p.quantity) || 1,
        size: String(p.size || 'Única'),
        price: Number(p.price) || 0,
        sku: String(p.sku || 'NL-SKU'),
        image: String(p.image || ''),
      })),
      totalAmount,
      evidencePhotos: uploadedPhotos,
      returnMethod: isShipping ? 'courier_shipping' : 'branch_dropoff',
      deliveryType: isShipping ? 'envio' : 'retiro',
      branchId: isShipping ? 'casa_matriz' : targetBranchId || 'vina_del_mar',
      targetBranchName: targetBranchName || (isShipping ? 'Envío por Courier' : 'Retiro Presencial'),
      returnCourier: isShipping ? 'paket' : '',
      shippingCostClp: 0,
      paidByStore: true,
      shippingAddress: parsedAddress,
      status: 'Solicitud recibida',
      returnReviewStatus: 'pending',
    });

    // Sincronizar automáticamente el estado de la orden en 'orders' (Órdenes de Compra)
    if (orderDoc) {
      const nextOrderStatus = 'Solicitud de Devolución recibida';
      orderDoc.status = nextOrderStatus;
      orderDoc.fulfillmentStatus = nextOrderStatus;
      orderDoc.statusAuditLog = [
        ...(orderDoc.statusAuditLog || []),
        {
          status: nextOrderStatus,
          timestamp: new Date().toLocaleString('es-CL'),
          note: `Ticket ${ticketNumber} creado por el cliente. Motivo: ${newReturn.reason}`,
        },
      ];
      await orderDoc.save();
    }

    res.status(201).json({
      success: true,
      message: `Solicitud ${ticketNumber} registrada en MongoDB y sincronizada con Órdenes de Compra.`,
      data: newReturn,
    });
  } catch (error) {
    console.error('Error creando solicitud de devolución:', error);
    next(error);
  }
};

// 3. Admin: Listar todas las devoluciones
export const getAllReturnsAdmin = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const returns = await ReturnModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: returns });
  } catch (error) {
    next(error);
  }
};

// 4. Admin: Aprobar / Rechazar devolución y sincronizar OrderModel
export const reviewReturnAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { decision, rejectionReason, trackingCode, replyNote } = req.body;

    const returnDoc = await ReturnModel.findById(id);
    if (!returnDoc) {
      res.status(404).json({ success: false, message: 'Solicitud de devolución no encontrada.' });
      return;
    }

    const isApproved = decision === 'approved';
    const isShipping = returnDoc.deliveryType === 'envio';
    const nowStr = new Date().toLocaleString('es-CL');

    returnDoc.returnReviewStatus = isApproved ? 'approved' : 'rejected';
    returnDoc.status = isApproved
      ? isShipping
        ? 'Envió a punto'
        : 'Retiro Presencial'
      : 'Rechazada';
    returnDoc.rejectionReason = isApproved ? '' : String(rejectionReason || '').trim();
    returnDoc.trackingCode = isApproved && isShipping ? String(trackingCode || '').trim() : '';
    returnDoc.replyNote = String(replyNote || '').trim();
    returnDoc.resolvedAt = nowStr;
    returnDoc.reviewedByAdmin = req.user?.email || 'Super Admin';

    await returnDoc.save();

    // Sincronizar el estado en OrderModel
    const orderDoc = returnDoc.orderId
      ? await OrderModel.findById(returnDoc.orderId)
      : await OrderModel.findOne({ orderNumber: returnDoc.orderNumber });

    if (orderDoc) {
      const nextOrderStatus = isApproved
        ? isShipping
          ? 'Envió a punto'
          : 'Retiro Presencial'
        : 'Rechazada por Admin';

      orderDoc.status = nextOrderStatus;
      orderDoc.fulfillmentStatus = nextOrderStatus;
      orderDoc.statusAuditLog = [
        ...(orderDoc.statusAuditLog || []),
        {
          status: nextOrderStatus,
          timestamp: nowStr,
          note:
            returnDoc.replyNote ||
            `Ticket ${returnDoc.ticketNumber}: ${isApproved ? 'Aprobada' : 'Rechazada'} por Admin.`,
        },
      ];
      await orderDoc.save();
    }

    res.status(200).json({ success: true, data: returnDoc });
  } catch (error) {
    next(error);
  }
};
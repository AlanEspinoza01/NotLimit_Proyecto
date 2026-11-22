import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { SystemAlertModel } from '../models/SystemAlert.model';
import { ProductModel } from '../models/Product.model';

// POST /api/stock-alerts -> Registra una solicitud de reposición de producto agotado en system_alerts
export const createOutOfStockRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      customerName,
      customerRut,
      customerEmail,
      customerPhone,
      productId,
      productName,
      productSku,
      productImage,
      sizeRequested,
      notes,
    } = req.body || {};

    if (!customerName?.trim() || !customerEmail?.trim()) {
      res.status(400).json({
        success: false,
        message: 'El nombre y el correo electrónico son obligatorios.',
      });
      return;
    }

    // Buscar el producto real en MongoDB si llegó un productId válido
    let productDoc: any = null;
    if (productId && mongoose.Types.ObjectId.isValid(String(productId))) {
      productDoc = await ProductModel.findById(productId).lean();
    }

    const resolvedName = String(
      productDoc?.title || productDoc?.name || productName || 'Producto Agotado NoLimits'
    ).trim();
    const resolvedSku = String(productDoc?.sku || productSku || 'NL-OUT').trim();
    const resolvedImage = String(productDoc?.images?.[0] || productImage || '').trim();
    const resolvedPrice = Number(productDoc?.salePrice || productDoc?.price || 0);
    const resolvedSize = String(sizeRequested || '').trim();
    const resolvedLink = productDoc?._id
      ? `/product/${String(productDoc._id)}`
      : productId
      ? `/product/${String(productId)}`
      : '';

    const descriptionText = notes?.trim()
      ? String(notes).trim()
      : `Cliente ${String(customerName).trim()} solicita aviso de reposición para "${resolvedName}".`;  

    const newAlert = await SystemAlertModel.create({
      category: 'producto_agotado',
      title: `Solicitud de Agotado: ${resolvedName}`,
      description: descriptionText,
      severity: 'warning',
      customerName: String(customerName).trim(),
      customerRut: customerRut ? String(customerRut).trim() : '',
      customerPhone: customerPhone ? String(customerPhone).trim() : '',
      customerEmail: String(customerEmail).trim().toLowerCase(),
      branchId: 'casa_matriz',
      amount: resolvedPrice,
      productName: resolvedName,
      productLink: resolvedLink,
      products: [
        {
          id: productDoc?._id ? String(productDoc._id) : String(productId || `out_${Date.now()}`),
          name: resolvedName,
          quantity: 1,
          size: resolvedSize,
          price: resolvedPrice,
          sku: resolvedSku,
          image: resolvedImage,
          images: resolvedImage ? [resolvedImage] : [],
          description: descriptionText,
          category: productDoc?.category || 'Producto Agotado',
        },
      ],
      status: 'active',
      isAutomated: false,
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud de aviso de reposición registrada con éxito.',
      data: newAlert,
    });
  } catch (error) {
    console.error('Error creando solicitud de producto agotado:', error);
    next(error);
  }
};
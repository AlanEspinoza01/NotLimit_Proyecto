import { Request, Response, NextFunction } from 'express';
import { SystemAlertModel } from '../models/SystemAlert.model';

// POST /api/custom-products -> Recibe solicitud pública de producto personalizado + hasta 10 fotos en Cloudinary
export const createCustomProductRequest = async (
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
      productName,
      description,
    } = req.body || {};

    if (!customerName?.trim() || !customerEmail?.trim() || !description?.trim()) {
      res.status(400).json({
        success: false,
        message: 'Nombre, correo electrónico y descripción del encargo son obligatorios.',
      });
      return;
    }

    const uploadedPhotos =
      req.files && Array.isArray(req.files)
        ? (req.files as any[]).map((file) => file.path).filter(Boolean).slice(0, 10)
        : [];

    const cleanProductName = String(productName || 'Prenda Personalizada NoLimits').trim();
    const cleanSku = `NL-CUST-${Math.floor(100 + Math.random() * 900)}`;

    const newAlert = await SystemAlertModel.create({
      category: 'producto_personalizado',
      title: `Encargo Personalizado: ${cleanProductName}`,
      description: String(description).trim(),
      severity: 'warning',
      customerName: String(customerName).trim(),
      customerRut: customerRut ? String(customerRut).trim() : '',
      customerPhone: customerPhone ? String(customerPhone).trim() : '',
      customerEmail: String(customerEmail).trim().toLowerCase(),
      branchId: 'casa_matriz',
      productName: cleanProductName,
      productLink: '',
      referencePhotos: uploadedPhotos,
      products: [
        {
          id: `cust_${Date.now()}`,
          name: cleanProductName,
          quantity: 1,
          size: 'A medida',
          price: 0,
          sku: cleanSku,
          image: uploadedPhotos[0] || '',
          images: uploadedPhotos,
          description: String(description).trim(),
          category: 'Producto Personalizado',
        },
      ],
      status: 'active',
      isAutomated: false,
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud de producto personalizado enviada con éxito.',
      data: newAlert,
    });
  } catch (error) {
    console.error('Error creando solicitud de producto personalizado:', error);
    next(error);
  }
};
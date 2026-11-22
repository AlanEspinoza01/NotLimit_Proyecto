import { Request, Response, NextFunction } from 'express';
import { SystemAlertModel } from '../models/SystemAlert.model';

// POST /api/support -> Registra una consulta de Atención al Cliente en system_alerts
export const createSupportInquiry = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      subject,
      message,
    } = req.body || {};

    if (!customerName?.trim() || !customerEmail?.trim() || !message?.trim()) {
      res.status(400).json({
        success: false,
        message: 'Nombre, correo electrónico y mensaje son obligatorios.',
      });
      return;
    }

    const cleanSubject = String(subject || 'Consulta General').trim();

    const newAlert = await SystemAlertModel.create({
      category: 'atencion_cliente',
      title: `Atención al Cliente: ${cleanSubject}`,
      description: String(message).replace(/[\r\n]+/g, ' ').trim(),
      severity: 'info',
      customerName: String(customerName).trim(),
      customerRut: '',
      customerPhone: customerPhone ? String(customerPhone).trim() : '',
      customerEmail: String(customerEmail).trim().toLowerCase(),
      branchId: 'casa_matriz',
      status: 'active',
      isAutomated: false,
    });

    res.status(201).json({
      success: true,
      message: 'Tu consulta fue enviada con éxito. Te responderemos a la brevedad.',
      data: newAlert,
    });
  } catch (error) {
    console.error('Error creando consulta de atención al cliente:', error);
    next(error);
  }
};
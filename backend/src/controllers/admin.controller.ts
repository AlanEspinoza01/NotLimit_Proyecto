import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { 
  ProductModel, 
  UserModel, 
  OrderModel, 
  BranchModel,
  StoreSettingsModel,
  SupplierModel,
  ExpenseModel,
  SystemAlertModel  
} from '../models';
import { cloudinary } from '../config/cloudinary';

// Función auxiliar para normalizar productos (sincroniza title/name y sizeBreakdown/sizes/sizeStock)
// - sizeBreakdown: arreglo de objetos [{ id, size, quantity, stock }]
// - sizes: arreglo de strings ["M (Chile/EUR) - 38-40 (USA)"] para evitar [object Object] en la tabla
const normalizeProductPayload = (rawData: any) => {  
  const data = { ...rawData };

  // 1. Sincronizar title y name
  const effectiveTitle = String(data.title || data.name || 'Prenda NoLimits').trim();
  data.title = effectiveTitle;
  data.name = effectiveTitle;

  // Sincronizar price y normalPrice
  const effectivePrice = Number(data.price ?? data.normalPrice ?? 0) || 0;
  const effectiveNormalPrice = Number(data.normalPrice ?? data.price ?? effectivePrice) || effectivePrice;
  data.price = effectivePrice;
  data.normalPrice = effectiveNormalPrice;

  // 2. Obtener desglose de tallas desde sizeBreakdown o sizeStock (o sizes si venía como objetos)
  const rawBreakdown =
    Array.isArray(data.sizeBreakdown) && data.sizeBreakdown.length > 0
      ? data.sizeBreakdown
      : Array.isArray(data.sizeStock) && data.sizeStock.length > 0
      ? data.sizeStock
      : Array.isArray(data.sizes) && data.sizes.length > 0 && typeof data.sizes[0] === 'object'
      ? data.sizes
      : [];

  if (rawBreakdown.length > 0) {
    const normalizedBreakdown = rawBreakdown.map((s: any, idx: number) => {
      const qty = Math.max(0, Number(s.quantity ?? s.stock ?? 0) || 0);
      return {
        id: s.id || `${idx + 1}`,
        size: String(s.size || 'Única').trim(),
        quantity: qty,
        stock: qty
      };
    });

    data.sizeBreakdown = normalizedBreakdown;
    // 'sizes' como arreglo de strings con el formato legible para la tabla:
    data.sizes = normalizedBreakdown.map((s: any) => `${s.size} (${s.quantity})`);
    data.totalStock = normalizedBreakdown.reduce((acc: number, s: any) => acc + s.quantity, 0);
    data.stock = data.totalStock;
  } else if (Array.isArray(data.sizes) && typeof data.sizes[0] === 'string') {
    data.sizes = data.sizes;
  } else {
    data.sizes = ['Única'];
  }

  return data;
};

export const getDashboardMetrics = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Contar productos (activos y agotados)
    const totalProducts = await ProductModel.countDocuments({ isHidden: false });
    const outOfStockProducts = await ProductModel.countDocuments({ 
      isHidden: false, 
      'sizeBreakdown.quantity': { $not: { $gt: 0 } } 
    });

    // 2. Contar usuarios por rol
    const totalClients = await UserModel.countDocuments({ role: 'registered' });
    const totalBranchAdmins = await UserModel.countDocuments({ role: 'branch_admin' });
    const totalSuperAdmins = await UserModel.countDocuments({ role: 'super_admin' });

    // 3. Obtener ventas globales (Solo órdenes confirmadas)
    const salesData = await OrderModel.aggregate([
      { $match: { paymentStatus: 'CONFIRMED' } },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$total' }, 
          totalOrders: { $sum: 1 } 
        } 
      }
    ]);

    const globalRevenue = salesData[0]?.totalRevenue || 0;
    const globalTransactions = salesData[0]?.totalOrders || 0;

    // 4. Ventas desglosadas por sucursal
    const salesByBranch = await OrderModel.aggregate([
      { $match: { paymentStatus: 'CONFIRMED' } },
      { 
        $group: { 
          _id: '$branchId', 
          revenue: { $sum: '$total' }, 
          orders: { $sum: 1 } 
        } 
      }
    ]);

    // 5. Gastos globales y por sucursal desde ExpenseModel
    const expensesData = await ExpenseModel.aggregate([
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' },
          totalExpenseRecords: { $sum: 1 }
        }
      }
    ]);

    const globalExpenses = expensesData[0]?.totalExpenses || 0;
    const globalExpenseCount = expensesData[0]?.totalExpenseRecords || 0;

    // Responder con el consolidado
    res.status(200).json({
      success: true,
      data: {
        products: {
          total: totalProducts,
          outOfStock: outOfStockProducts,
          categories: 8
        },
        users: {
          total: totalClients + totalBranchAdmins + totalSuperAdmins,
          clients: totalClients,
          branchAdmins: totalBranchAdmins,
          superAdmins: totalSuperAdmins
        },
        sales: {
          globalRevenue,
          globalTransactions,
          byBranch: salesByBranch
        },
        expenses: {
          globalExpenses,
          globalExpenseCount,
          netBalance: globalRevenue - globalExpenses
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const orders = await OrderModel.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// 1. Controlador para actualizar el estado o anular una orden en MongoDB
export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      status,
      fulfillmentStatus,
      paymentStatus,
      trackingNumber,
      shippingCourier,
      auditNote,
      cancellationReason,
      cancelledAt
    } = req.body;

    const effectiveStatus = status || fulfillmentStatus || 'Pago Confirmando';
    const isCancelled =
      effectiveStatus === 'Pago Anulado' ||
      effectiveStatus === 'Anulado' ||
      effectiveStatus === 'Cancelado' ||
      paymentStatus === 'REJECTED';

    const updateFields: Record<string, any> = {
      status: effectiveStatus,
      fulfillmentStatus: effectiveStatus
    };

    if (isCancelled) {
      updateFields.paymentStatus = 'REJECTED';
      updateFields.confirmedRevenue = 0;
      if (cancellationReason !== undefined) {
        updateFields.cancellationReason = cancellationReason;
      }
      updateFields.cancelledAt =
        cancelledAt || new Date().toISOString().replace('T', ' ').substring(0, 16);
    } else if (paymentStatus) {
      updateFields.paymentStatus = paymentStatus;
    }

    if (trackingNumber) {
      updateFields.trackingNumber = trackingNumber;
      updateFields['shippingDetails.trackingNumber'] = trackingNumber;
    }
    if (shippingCourier) {
      updateFields.shippingCourier = shippingCourier;
      updateFields['shippingDetails.courier'] = shippingCourier;
    }

    const updateQuery: Record<string, any> = { $set: updateFields };
    if (auditNote || cancellationReason) {
      updateQuery.$push = {
        statusAuditLog: {
          status: effectiveStatus,
          timestamp: new Date().toLocaleString('es-CL'),
          note: auditNote || cancellationReason
        }
      };
    }

    const updatedOrder = await OrderModel.findByIdAndUpdate(
      id,
      updateQuery,
      { returnDocument: 'after' }
    );

    if (!updatedOrder) {
      res.status(404).json({ success: false, message: 'Orden no encontrada en MongoDB' });
      return;
    }

    res.status(200).json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error('Error en updateOrderStatus:', error);
    next(error);
  }
};

// 2. Controlador para eliminar una orden
export const deleteOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedOrder = await OrderModel.findByIdAndDelete(id);
    
    if (!deletedOrder) {
      res.status(404).json({ success: false, message: 'Orden no encontrada' });
      return;
    }

    res.status(200).json({ success: true, message: 'Orden eliminada exitosamente' });
  } catch (error) {
    next(error);
  }
};

// Controlador para obtener todo el inventario de productos normalizado
export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await ProductModel.find().sort({ createdAt: -1 });

    const enrichedProducts = products.map((doc) => {
      const obj = doc.toObject();
      return normalizeProductPayload(obj);
    });

    res.status(200).json({
      success: true,
      data: enrichedProducts
    });
  } catch (error) {
    next(error);
  }
};

// Controlador para crear un nuevo producto
export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let productData = { ...req.body };

    if (typeof productData.tags === 'string') {
      productData.tags = JSON.parse(productData.tags);
    }
    if (typeof productData.sizeBreakdown === 'string') {
      productData.sizeBreakdown = JSON.parse(productData.sizeBreakdown);
    }
    if (typeof productData.sizes === 'string') {
      productData.sizes = JSON.parse(productData.sizes);
    }

    let existingImages: string[] = [];
    if (typeof productData.existingImages === 'string') {
      existingImages = JSON.parse(productData.existingImages);
    }

    const uploadedUrls =
      req.files && Array.isArray(req.files)
        ? req.files.map((file: any) => file.path)
        : [];

    productData.images = uploadedUrls.length > 0 ? uploadedUrls : existingImages;
    delete productData.existingImages;

    // Normalizar title/name y sizeBreakdown/sizes antes de guardar en MongoDB
    productData = normalizeProductPayload(productData);

    const newProduct = await ProductModel.create(productData);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: newProduct
    });
  } catch (error) {
    console.error('Error en createProduct:', error);
    next(error);
  }
};

// Función auxiliar para extraer el public_id desde la URL de Cloudinary
const extractCloudinaryPublicId = (imageUrl: string): string | null => {
  try {
    if (!imageUrl.includes('res.cloudinary.com')) return null;

    const parts = imageUrl.split('/upload/');
    if (parts.length < 2) return null;

    const pathWithoutVersion = parts[1].replace(/^v\d+\//, '');
    const publicId = pathWithoutVersion.replace(/\.[^/.]+$/, '');
    return publicId;
  } catch {
    return null;
  }
};

// Controlador para eliminar un producto (MongoDB + Cloudinary)
export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedProduct = await ProductModel.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }

    if (deletedProduct.images && Array.isArray(deletedProduct.images)) {
      const deletePromises = deletedProduct.images.map(async (imgUrl: string) => {
        const publicId = extractCloudinaryPublicId(imgUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      });

      await Promise.all(deletePromises);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Producto e imágenes de Cloudinary eliminados exitosamente' 
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);
    next(error);
  }
};

// Controlador para actualizar un producto existente (MongoDB + Limpieza en Cloudinary)
export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    const currentProduct = await ProductModel.findById(id);
    if (!currentProduct) {
      res.status(404).json({ success: false, message: 'Producto no encontrado' });
      return;
    }

    if (typeof updateData.tags === 'string') {
      updateData.tags = JSON.parse(updateData.tags);
    }
    if (typeof updateData.sizeBreakdown === 'string') {
      updateData.sizeBreakdown = JSON.parse(updateData.sizeBreakdown);
    }
    if (typeof updateData.sizes === 'string') {
      updateData.sizes = JSON.parse(updateData.sizes);
    }

    const uploadedUrls =
      req.files && Array.isArray(req.files)
        ? req.files.map((file: any) => file.path)
        : [];

    const previousImages: string[] = Array.isArray(currentProduct.images) ? currentProduct.images : [];

    // Si la petición envía existingImages o archivos nuevos, actualizamos imágenes y limpiamos Cloudinary
    if (updateData.existingImages !== undefined || uploadedUrls.length > 0) {
      let existingImages: string[] = [];
      if (typeof updateData.existingImages === 'string') {
        existingImages = JSON.parse(updateData.existingImages);
      } else if (Array.isArray(updateData.existingImages)) {
        existingImages = updateData.existingImages;
      }

      const removedImages = previousImages.filter((oldUrl) => !existingImages.includes(oldUrl));
      if (removedImages.length > 0) {
        const deletePromises = removedImages.map(async (imgUrl: string) => {
          const publicId = extractCloudinaryPublicId(imgUrl);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        });
        await Promise.all(deletePromises);
      }

      updateData.images = [...existingImages, ...uploadedUrls].slice(0, 10);
      delete updateData.existingImages;
    } else if (!Array.isArray(updateData.images)) {
      // Si es una actualización rápida de stock (ProductStockSummaryView), preservar imágenes actuales
      updateData.images = previousImages;
    }

    // Asegurar título y precio actuales si solo se envió actualización de stock
    if (!updateData.title && !updateData.name) {
      updateData.title = currentProduct.title || currentProduct.name;
      updateData.name = updateData.title;
    }
    if (updateData.price === undefined && updateData.normalPrice === undefined) {
      updateData.price = currentProduct.price;
      updateData.normalPrice = currentProduct.normalPrice || currentProduct.price;
    }

    // Normalizar title/name y sizeBreakdown/sizes antes de actualizar en MongoDB
    updateData = normalizeProductPayload(updateData);

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    next(error);
  }
};

// Controlador para obtener la configuración global de la tienda (PageEditorView)
export const getStoreSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await StoreSettingsModel.findById('global_settings');

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error obteniendo StoreSettings:', error);
    next(error);
  }
};

// Controlador para guardar/actualizar la configuración de la tienda (MongoDB + Cloudinary)
export const updateStoreSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawData = { ...req.body };

    const settingsPayload = typeof rawData.settings === 'string' 
      ? JSON.parse(rawData.settings) 
      : rawData;

    const currentSettings = await StoreSettingsModel.findById('global_settings');
    const files = Array.isArray(req.files) ? (req.files as any[]) : [];

    // 2. Imagen de Fondo Personalizado ('backgroundFile')
    const bgFile = files.find((f) => f.fieldname === 'backgroundFile');
    if (bgFile && settingsPayload.backgroundConfig) {
      const oldBgUrl = currentSettings?.backgroundConfig?.imageUrl;
      if (oldBgUrl) {
        const oldPublicId = extractCloudinaryPublicId(oldBgUrl);
        if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId);
      }
      settingsPayload.backgroundConfig.imageUrl = bgFile.path;
    } else if (
      settingsPayload.backgroundConfig &&
      settingsPayload.backgroundConfig.imageUrl === '' &&
      currentSettings?.backgroundConfig?.imageUrl
    ) {
      const oldPublicId = extractCloudinaryPublicId(currentSettings.backgroundConfig.imageUrl);
      if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId);
    }

    // 3. Video o GIF para el Home ('homeMediaFile')
    const mediaFile = files.find((f) => f.fieldname === 'homeMediaFile');
    if (mediaFile && settingsPayload.homeMediaConfig) {
      const oldMediaUrl = currentSettings?.homeMediaConfig?.src || currentSettings?.homeMediaConfig?.videoUrl;
      if (oldMediaUrl) {
        const oldPublicId = extractCloudinaryPublicId(oldMediaUrl);
        if (oldPublicId) await cloudinary.uploader.destroy(oldPublicId);
      }
      settingsPayload.homeMediaConfig.src = mediaFile.path;
      settingsPayload.homeMediaConfig.videoUrl = mediaFile.path;
    }

    // 4. Imagen para una diapositiva del Slider ('slideFile')
    const slideFile = files.find((f) => f.fieldname === 'slideFile');
    const targetSlideId = rawData.targetSlideId || settingsPayload.targetSlideId;
    if (slideFile && Array.isArray(settingsPayload.sliders)) {
      settingsPayload.sliders = settingsPayload.sliders.map((s: any) =>
        s.id === targetSlideId ? { ...s, imageUrl: slideFile.path } : s
      );
    }
    delete settingsPayload.targetSlideId;

    // Limpiar de Cloudinary los slides eliminados o reemplazados
    if (Array.isArray(settingsPayload.sliders) && Array.isArray(currentSettings?.sliders)) {
      const newUrls = settingsPayload.sliders.map((s: any) => s.imageUrl);
      const removedSlides = currentSettings.sliders.filter(
        (oldSlide: any) => oldSlide.imageUrl && !newUrls.includes(oldSlide.imageUrl)
      );
      for (const rem of removedSlides) {
        const pubId = extractCloudinaryPublicId(rem.imageUrl);
        if (pubId) await cloudinary.uploader.destroy(pubId);
      }
    }

    // 5. Actualizar documento 'global_settings' en MongoDB
    const updatedSettings = await StoreSettingsModel.findOneAndUpdate(
      { _id: 'global_settings' },
      { $set: settingsPayload },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Configuración de la tienda actualizada en MongoDB y Cloudinary',
      data: updatedSettings
    });
  } catch (error) {
    console.error('Error detallado en updateStoreSettings:', error);
    next(error);
  }
};

// ==========================================================================
// CONTROLADORES DE PROVEEDORES (Supplier.model.ts)
// ==========================================================================

export const getSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const suppliers = await SupplierModel.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: suppliers
    });
  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    next(error);
  }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    data.address = {
      region: data.region || '',
      comuna: data.city || '',
      city: data.city || '',
      street: data.street || '',
      number: data.number || 'S/N',
      reference: data.reference || '',
      postalCode: data.postalCode || ''
    };

    const newSupplier = await SupplierModel.create(data);

    res.status(201).json({
      success: true,
      message: 'Proveedor registrado exitosamente en MongoDB',
      data: newSupplier
    });
  } catch (error) {
    console.error('Error creando proveedor:', error);
    next(error);
  }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    updateData.address = {
      region: updateData.region || '',
      comuna: updateData.city || '',
      city: updateData.city || '',
      street: updateData.street || '',
      number: updateData.number || 'S/N',
      reference: updateData.reference || '',
      postalCode: updateData.postalCode || ''
    };

    const updatedSupplier = await SupplierModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedSupplier) {
      res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: updatedSupplier
    });
  } catch (error) {
    console.error('Error actualizando proveedor:', error);
    next(error);
  }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedSupplier = await SupplierModel.findByIdAndDelete(id);

    if (!deletedSupplier) {
      res.status(404).json({ success: false, message: 'Proveedor no encontrado' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando proveedor:', error);
    next(error);
  }
};

// ==========================================================================
// CONTROLADORES DE SUCURSALES (Branch.model.ts + User.model.ts branch_admin)
// ==========================================================================

export const getBranches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const branches = await BranchModel.find().sort({ createdAt: 1 });
    res.status(200).json({
      success: true,
      data: branches
    });
  } catch (error) {
    console.error('Error obteniendo sucursales:', error);
    next(error);
  }
};

export const createBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };

    if (!data._id) {
      const baseSlug = String(data.id || data.city || data.name || `branch_${Date.now()}`)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      const existing = await BranchModel.findById(baseSlug);
      data._id = existing ? `${baseSlug}_${Date.now().toString().slice(-4)}` : baseSlug;
    }

    const newBranch = await BranchModel.create(data);

    if (data.adminEmail && data.adminPassword) {
      const passwordHash = await bcrypt.hash(String(data.adminPassword), 10);
      await UserModel.findOneAndUpdate(
        { email: String(data.adminEmail).toLowerCase().trim() },
        {
          $set: {
            name: data.managerName || `Admin ${data.city}`,
            email: String(data.adminEmail).toLowerCase().trim(),
            rut: data.adminRut || '',
            phone: data.phone || '',
            passwordHash,
            role: 'branch_admin',
            branchId: newBranch._id
          }
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Sucursal y cuenta de Administrador creadas exitosamente en MongoDB',
      data: newBranch
    });
  } catch (error) {
    console.error('Error creando sucursal:', error);
    next(error);
  }
};

export const updateBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;

    const updatedBranch = await BranchModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    if (updateData.adminEmail) {
      const userUpdate: Record<string, any> = {
        name: updateData.managerName || `Admin ${updateData.city || id}`,
        email: String(updateData.adminEmail).toLowerCase().trim(),
        rut: updateData.adminRut || '',
        phone: updateData.phone || '',
        role: 'branch_admin',
        branchId: id
      };

      if (updateData.adminPassword && String(updateData.adminPassword).trim().length >= 6) {
        userUpdate.passwordHash = await bcrypt.hash(String(updateData.adminPassword), 10);
      }

      await UserModel.findOneAndUpdate(
        { $or: [{ branchId: id, role: 'branch_admin' }, { email: userUpdate.email }] },
        { $set: userUpdate },
        { upsert: Boolean(userUpdate.passwordHash), returnDocument: 'after' }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Sucursal actualizada exitosamente en MongoDB',
      data: updatedBranch
    });
  } catch (error) {
    console.error('Error actualizando sucursal:', error);
    next(error);
  }
};

export const deleteBranch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedBranch = await BranchModel.findByIdAndDelete(id);

    if (!deletedBranch) {
      res.status(404).json({ success: false, message: 'Sucursal no encontrada en MongoDB' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Sucursal eliminada exitosamente de MongoDB'
    });
  } catch (error) {
    console.error('Error eliminando sucursal:', error);
    next(error);
  }
};

// ==========================================================================
// CONTROLADORES DE GASTOS OPERATIVOS (Expense.model.ts)
// ==========================================================================

export const getExpenses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const expenses = await ExpenseModel.find().sort({ date: -1, createdAt: -1 });
    res.status(200).json({
      success: true,
      data: expenses
    });
  } catch (error) {
    console.error('Error obteniendo gastos:', error);
    next(error);
  }
};

export const createExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };

    const expensePayload = typeof data.expense === 'string'
      ? JSON.parse(data.expense)
      : data;

    const files = Array.isArray(req.files) ? (req.files as any[]) : [];
    if (files.length > 0) {
      const receiptUrl = files[0].path;
      expensePayload.receiptUrl = receiptUrl;
      expensePayload.attachmentUrl = receiptUrl;
    }

    if (!expensePayload.supplierId || expensePayload.supplierId === '' || expensePayload.supplierId === 'none') {
      expensePayload.supplierId = null;
    }

    const newExpense = await ExpenseModel.create(expensePayload);

    res.status(201).json({
      success: true,
      message: 'Gasto registrado exitosamente en MongoDB',
      data: newExpense
    });
  } catch (error) {
    console.error('Error creando gasto:', error);
    next(error);
  }
};

export const updateExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const rawData = { ...req.body };
    const updateData = typeof rawData.expense === 'string'
      ? JSON.parse(rawData.expense)
      : rawData;

    const currentExpense = await ExpenseModel.findById(id);
    if (!currentExpense) {
      res.status(404).json({ success: false, message: 'Gasto no encontrado' });
      return;
    }

    const files = Array.isArray(req.files) ? (req.files as any[]) : [];
    if (files.length > 0) {
      const oldUrl = (currentExpense as any).receiptUrl || (currentExpense as any).attachmentUrl;
      if (oldUrl) {
        const oldPubId = extractCloudinaryPublicId(oldUrl);
        if (oldPubId) await cloudinary.uploader.destroy(oldPubId);
      }
      updateData.receiptUrl = files[0].path;
      updateData.attachmentUrl = files[0].path;
    }

    if (!updateData.supplierId || updateData.supplierId === '' || updateData.supplierId === 'none') {
      updateData.supplierId = null;
    }

    const updatedExpense = await ExpenseModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Gasto actualizado exitosamente en MongoDB',
      data: updatedExpense
    });
  } catch (error) {
    console.error('Error actualizando gasto:', error);
    next(error);
  }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedExpense = await ExpenseModel.findByIdAndDelete(id);

    if (!deletedExpense) {
      res.status(404).json({ success: false, message: 'Gasto no encontrado' });
      return;
    }

    const receiptUrl = (deletedExpense as any).receiptUrl || (deletedExpense as any).attachmentUrl;
    if (receiptUrl) {
      const pubId = extractCloudinaryPublicId(receiptUrl);
      if (pubId) await cloudinary.uploader.destroy(pubId);
    }

    res.status(200).json({
      success: true,
      message: 'Gasto eliminado exitosamente de MongoDB'
    });
  } catch (error) {
    console.error('Error eliminando gasto:', error);
    next(error);
  }
};

// ==========================================================================
// CONTROLADORES DE CLIENTES (User.model.ts ↔ CustomerManagerView.tsx)
// ==========================================================================

export const getCustomers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [customers, orders] = await Promise.all([
      UserModel.find({ role: 'registered' }).sort({ createdAt: -1 }),
      OrderModel.find({
        status: { $nin: ['CANCELADO', 'CANCELLED', 'ANULADO'] }
      }).select('userId customerEmail email total totalAmount')
    ]);

    const orderStatsByEmail: Record<string, { count: number; spent: number }> = {};
    const orderStatsById: Record<string, { count: number; spent: number }> = {};

    orders.forEach((ord: any) => {
      const amt = Number(ord.total ?? ord.totalAmount ?? 0) || 0;
      const uid = ord.userId ? String(ord.userId) : '';
      const mail = String(ord.customerEmail || ord.email || '').toLowerCase().trim();

      if (uid) {
        if (!orderStatsById[uid]) orderStatsById[uid] = { count: 0, spent: 0 };
        orderStatsById[uid].count += 1;
        orderStatsById[uid].spent += amt;
      }
      if (mail) {
        if (!orderStatsByEmail[mail]) orderStatsByEmail[mail] = { count: 0, spent: 0 };
        orderStatsByEmail[mail].count += 1;
        orderStatsByEmail[mail].spent += amt;
      }
    });

    const enrichedCustomers = customers.map((c) => {
      const obj = c.toObject();
      const idStr = String(obj._id);
      const emailKey = String(obj.email || '').toLowerCase().trim();
      const stats = orderStatsById[idStr] || orderStatsByEmail[emailKey];

      if (stats) {
        obj.totalOrdersCount = Math.max(obj.totalOrdersCount || 0, stats.count);
        obj.totalSpentClp = Math.max(obj.totalSpentClp || 0, stats.spent);
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      data: enrichedCustomers
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    const emailClean = String(data.email || '').toLowerCase().trim();

    if (!emailClean) {
      res.status(400).json({ success: false, message: 'El email del cliente es obligatorio' });
      return;
    }

    const firstName = data.firstName || data.nombre || 'Cliente';
    const lastName = data.lastName || data.apellido || '';
    const fullName = `${firstName} ${lastName}`.trim();

    const existing = await UserModel.findOne({ email: emailClean });
    if (existing) {
      res.status(200).json({
        success: true,
        message: 'El cliente ya existía en MongoDB',
        data: existing
      });
      return;
    }

    const passwordHash = await bcrypt.hash(String(data.password || 'ClienteNoLimits2026!'), 10);

    const payload: Record<string, any> = {
      name: fullName,
      firstName,
      lastName,
      email: emailClean,
      phone: data.phone || '',
      passwordHash,
      role: 'registered',
      loyaltyPoints: Number(data.loyaltyPoints ?? data.puntosClub) || 0,
      lastPointsReason: data.lastPointsReason || '',
      tags: Array.isArray(data.tags)
        ? data.tags
        : Array.isArray(data.etiquetas)
        ? data.etiquetas
        : ['Normal'],
      totalOrdersCount: Number(data.totalOrdersCount ?? data.compras) || 0,
      totalSpentClp: Number(data.totalSpentClp ?? data.totalGastado) || 0,
      preferentialReports: Array.isArray(data.preferentialReports) ? data.preferentialReports : [],
      blacklistReports: Array.isArray(data.blacklistReports) ? data.blacklistReports : []
    };

    if (data.rut && String(data.rut).trim()) {
      payload.rut = String(data.rut).trim();
    }

    const newCustomer = await UserModel.create(payload);

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente en MongoDB',
      data: newCustomer
    });
  } catch (error) {
    console.error('Error creando cliente:', error);
    next(error);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    const updateFields: Record<string, any> = {};

    if (data.firstName !== undefined || data.nombre !== undefined) {
      updateFields.firstName = data.firstName ?? data.nombre;
    }
    if (data.lastName !== undefined || data.apellido !== undefined) {
      updateFields.lastName = data.lastName ?? data.apellido;
    }
    if (updateFields.firstName || updateFields.lastName) {
      updateFields.name = `${updateFields.firstName || ''} ${updateFields.lastName || ''}`.trim();
    }
    if (data.phone !== undefined) updateFields.phone = data.phone;
    if (data.rut !== undefined && String(data.rut).trim()) updateFields.rut = String(data.rut).trim();

    if (data.loyaltyPoints !== undefined || data.puntosClub !== undefined) {
      updateFields.loyaltyPoints = Math.max(0, Number(data.loyaltyPoints ?? data.puntosClub) || 0);
    }
    if (data.lastPointsReason !== undefined) {
      updateFields.lastPointsReason = data.lastPointsReason;
    }
    if (Array.isArray(data.tags) || Array.isArray(data.etiquetas)) {
      updateFields.tags = data.tags || data.etiquetas;
    }
    if (Array.isArray(data.preferentialReports)) {
      updateFields.preferentialReports = data.preferentialReports;
    }
    if (Array.isArray(data.blacklistReports)) {
      updateFields.blacklistReports = data.blacklistReports;
    }
    if (data.totalOrdersCount !== undefined || data.compras !== undefined) {
      updateFields.totalOrdersCount = Number(data.totalOrdersCount ?? data.compras) || 0;
    }
    if (data.totalSpentClp !== undefined || data.totalGastado !== undefined) {
      updateFields.totalSpentClp = Number(data.totalSpentClp ?? data.totalGastado) || 0;
    }

    const updatedCustomer = await UserModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedCustomer) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado en MongoDB' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cliente actualizado exitosamente en MongoDB',
      data: updatedCustomer
    });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    next(error);
  }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await UserModel.findOneAndDelete({ _id: id, role: 'registered' });

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado en MongoDB' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Cliente eliminado exitosamente de MongoDB'
    });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    next(error);
  }
};



// ==========================================================================
// CREAR NUEVA ORDEN / VENTA POS (Order.model.ts + Descuento de Stock + Puntos Cliente)
// ==========================================================================
export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };

    const orderNumber =
      data.orderNumber || `NL-${Math.floor(1000 + Math.random() * 9000)}`;
    const isConfirmed =
      data.paymentStatus === 'CONFIRMED' ||
      data.paymentStatus === 'confirmado' ||
      data.status === 'Pago Confirmando' ||
      data.status === 'Pago Confirmado';

    const subtotal = Number(data.subtotal ?? data.total ?? 0) || 0;
    const shippingCost = Number(data.shippingCost ?? 0) || 0;
    const total = Number(data.total ?? subtotal + shippingCost) || 0;

    // 1. Normalizar los ítems para OrderItemSchema
    const rawItems: any[] = Array.isArray(data.items) ? data.items : [];
    const normalizedItems: any[] = [];

    for (let i = 0; i < rawItems.length; i++) {
      const item = rawItems[i];
      const itemName = String(item.name || item.title || 'Prenda NoLimits').trim();
      const itemPrice = Number(item.price ?? item.unitPrice ?? 0) || 0;
      const itemQuantity = Math.max(1, Number(item.quantity ?? item.totalUnits ?? 1) || 1);
      const itemSize = String(item.size || item.sizes || 'Única').trim();

      // Intentar vincular con un producto existente en MongoDB por ID o por title/name
      let matchedProduct = null;
      if (item.productId && String(item.productId).match(/^[0-9a-fA-F]{24}$/)) {
        matchedProduct = await ProductModel.findById(item.productId);
      }
      if (!matchedProduct && itemName) {
        const escapedName = itemName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        matchedProduct = await ProductModel.findOne({
          $or: [
            { title: { $regex: new RegExp(`^${escapedName}$`, 'i') } },
            { name: { $regex: new RegExp(`^${escapedName}$`, 'i') } }
          ]
        });
      }

      normalizedItems.push({
        productId: matchedProduct ? matchedProduct._id : item.productId || null,
        sku: item.sku || (matchedProduct as any)?.sku || `NL-POS-${i + 1}`,
        name: itemName,
        size: itemSize,
        price: itemPrice,
        quantity: itemQuantity
      });

      // 2. Descontar stock en ProductModel si el producto existe en el catálogo de MongoDB
      if (matchedProduct) {
        const prodDoc: any = matchedProduct;

        const sizeBreakdown: Array<{ size: string; quantity: number }> = Array.isArray(item.sizeBreakdown)
          ? item.sizeBreakdown
          : [{ size: itemSize, quantity: itemQuantity }];

        // Descontar en sizeBreakdown y sizeStock (objetos con cantidad)
        ['sizeBreakdown', 'sizeStock'].forEach((arrayField) => {
          if (Array.isArray(prodDoc[arrayField]) && prodDoc[arrayField].length > 0) {
            sizeBreakdown.forEach((sb) => {
              const targetSize = String(sb.size || '').trim().toLowerCase();
              const qtyToDeduct = Math.max(0, Number(sb.quantity) || 0);
              const sizeEntry = prodDoc[arrayField].find(
                (s: any) =>
                  String(s.size || '').trim().toLowerCase() === targetSize ||
                  String(s.size || '').toLowerCase().startsWith(targetSize.split(' ')[0])
              );
              if (sizeEntry) {
                if (typeof sizeEntry.stock === 'number') {
                  sizeEntry.stock = Math.max(0, sizeEntry.stock - qtyToDeduct);
                }
                if (typeof sizeEntry.quantity === 'number') {
                  sizeEntry.quantity = Math.max(0, sizeEntry.quantity - qtyToDeduct);
                }
              }
            });
            prodDoc.markModified(arrayField);
          }
        });

        // Actualizar el arreglo de strings 'sizes' y el stock total tras el descuento
        if (Array.isArray(prodDoc.sizeBreakdown) && prodDoc.sizeBreakdown.length > 0) {
          prodDoc.sizes = prodDoc.sizeBreakdown.map(
            (s: any) => `${s.size} (${Number(s.quantity ?? s.stock ?? 0)})`
          );
          const newTotal = prodDoc.sizeBreakdown.reduce(
            (acc: number, s: any) => acc + (Number(s.quantity ?? s.stock ?? 0) || 0),
            0
          );
          prodDoc.totalStock = newTotal;
          prodDoc.stock = newTotal;
        } else {
          if (typeof prodDoc.totalStock === 'number') {
            prodDoc.totalStock = Math.max(0, prodDoc.totalStock - itemQuantity);
          }
          if (typeof prodDoc.stock === 'number') {
            prodDoc.stock = Math.max(0, prodDoc.stock - itemQuantity);
          }
        }

        if (typeof prodDoc.soldUnits === 'number') {
          prodDoc.soldUnits += itemQuantity;
        } else {
          prodDoc.soldUnits = itemQuantity;
        }

        // Asegurar normalPrice y name para evitar ValidationError en documentos antiguos
        if (!prodDoc.normalPrice) {
          prodDoc.normalPrice = prodDoc.price || itemPrice || 0;
        }
        if (!prodDoc.name) {
          prodDoc.name = prodDoc.title || itemName;
        }

        await prodDoc.save({ validateBeforeSave: false });
      }
    }

    const itemsSummary =
      data.itemsSummary ||
      normalizedItems
        .map((it) => `${it.quantity}x ${it.name}${it.size ? ` (${it.size})` : ''}`)
        .join(', ');

    // 3. Buscar si el cliente existe en UserModel por email
    const cleanEmail = String(data.customerEmail || data.email || data.guestEmail || '')
      .toLowerCase()
      .trim();
    let matchedUser = null;
    if (cleanEmail) {
      matchedUser = await UserModel.findOne({ email: cleanEmail });
    }

    const effectiveStatus = isConfirmed ? 'Pago Confirmando' : 'Pendiente de Pago';

    const newOrder = await OrderModel.create({
      orderNumber,
      userId: matchedUser ? matchedUser._id : null,
      guestEmail: cleanEmail || null,
      customerEmail: cleanEmail,
      customerName: data.customerName || 'Cliente NoLimits',
      customerRut: data.customerRut || data.rut || 'Sin RUT',
      customerPhone: data.customerPhone || data.phone || '+56 9 0000 0000',
      branchId: data.branchId || 'casa_matriz',
      branchName: data.branchName || 'Casa Matriz / Central (Corporativo)',
      items: normalizedItems,
      itemsSummary,
      subtotal,
      shippingCost,
      total,
      confirmedRevenue: isConfirmed ? total : 0,
      paymentStatus: isConfirmed ? 'CONFIRMED' : 'PENDING',
      paymentMethod:
        data.paymentMethod ||
        (isConfirmed ? 'Webpay Plus / Confirmado POS' : 'Pendiente de Pago (Reserva Live)'),
      deliveryType:
        data.deliveryType === 'envio' || data.deliveryType === 'Despacho a Domicilio'
          ? 'envio'
          : 'retiro',
      pickupBranchId: data.pickupBranchId || data.branchId || null,
      shippingDetails: data.shippingDetails || null,
      status: effectiveStatus,
      fulfillmentStatus: isConfirmed ? 'Solicitud recibida' : 'Pendiente de Pago',
      statusAuditLog: [
        {
          status: effectiveStatus,
          timestamp: new Date().toLocaleString('es-CL'),
          note: `Venta registrada en terminal POS por ${data.registeredByAdmin || 'Administrador'}`
        }
      ],
      registeredByAdmin: data.registeredByAdmin || 'Super Admin'
    });

    // 4. Si el pago está confirmado y el cliente existe en UserModel, sumar compra y Puntos Club
    if (isConfirmed && matchedUser) {
      const earnedPoints = Math.max(10, Math.floor(total / 1000));
      matchedUser.totalOrdersCount = (matchedUser.totalOrdersCount || 0) + 1;
      matchedUser.totalSpentClp = (matchedUser.totalSpentClp || 0) + total;
      matchedUser.loyaltyPoints = (matchedUser.loyaltyPoints || 0) + earnedPoints;
      matchedUser.lastPointsReason = `Compra POS Orden ${orderNumber} (+${earnedPoints} pts)`;
      await matchedUser.save({ validateBeforeSave: false });
    }

    // 5. Si la orden quedó "Pendiente de Pago", crear alerta automática en system_alerts
    if (!isConfirmed) {
      await SystemAlertModel.create({
        category: 'cobro_pendiente',
        title: `COBRO PENDIENTE: ${data.customerName || 'Cliente NoLimits'} ($${total.toLocaleString('es-CL')})`,
        description: `Cliente ${data.customerName || 'Cliente'} mantiene orden ${orderNumber} con pago pendiente tras reserva en vivo. Registrada por: ${data.registeredByAdmin || 'Administrador'}.`,
        severity: 'critical',
        customerName: data.customerName || 'Cliente NoLimits',
        customerRut: data.customerRut || data.rut || 'Sin RUT',
        customerPhone: data.customerPhone || data.phone || '+56 9 0000 0000',
        customerEmail: cleanEmail,
        branchId: data.branchId || 'casa_matriz',
        deliveryType:
          data.deliveryType === 'envio' || data.deliveryType === 'Despacho a Domicilio'
            ? 'envio'
            : 'retiro',
        deliveryMethodText:
          data.deliveryType === 'envio' || data.deliveryType === 'Despacho a Domicilio'
            ? `Envío a Domicilio (${data.shippingDetails?.courier || 'Starken'})`
            : `Retiro en Sucursal (${data.branchName || 'Tienda'})`,
        shippingAddress: data.shippingDetails?.address || null,
        orderNumber,
        amount: total,
        products: normalizedItems.map((it, idx) => ({
          id: it.productId ? String(it.productId) : `it_${idx + 1}`,
          name: it.name,
          quantity: it.quantity,
          size: it.size,
          price: it.price,
          sku: it.sku
        })),
        timeLimitText: `${data.deadlineHours || 4} horas`,
        dueHours: Number(data.deadlineHours) || 4,
        status: 'active',
        registeredByAdmin: data.registeredByAdmin || 'Super Admin',
        isAutomated: true
      });
    }

    res.status(201).json({
      success: true,
      message: 'Venta registrada exitosamente en MongoDB',
      data: newOrder
    });
  } catch (error) {
    console.error('Error creando orden desde RegisterSaleView:', error);
    next(error);
  }
};

// ==========================================================================
// CONTROLADORES DE NOTIFICACIONES Y ALERTAS (SystemAlert.model.ts)
// ==========================================================================

// 1. Obtener todas las alertas del sistema (y sincronizar órdenes con Pendiente de Pago)
export const getSystemAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Asegurar que toda orden en estado PENDING tenga su alerta en system_alerts
    const pendingOrders = await OrderModel.find({ paymentStatus: 'PENDING' });
    for (const ord of pendingOrders) {
      const exists = await SystemAlertModel.findOne({
        orderNumber: ord.orderNumber,
        category: 'cobro_pendiente'
      });
      if (!exists) {
        await SystemAlertModel.create({
          category: 'cobro_pendiente',
          title: `COBRO PENDIENTE: ${ord.customerName} ($${Number(ord.total || 0).toLocaleString('es-CL')})`,
          description: `Cliente ${ord.customerName} mantiene orden ${ord.orderNumber} con pago pendiente tras reserva (${ord.registeredByAdmin || 'POS'}).`,
          severity: 'critical',
          customerName: ord.customerName,
          customerRut: ord.customerRut || 'Sin RUT',
          customerPhone: ord.customerPhone || '+56 9 0000 0000',
          customerEmail: ord.customerEmail || ord.guestEmail || '',
          branchId: ord.branchId || 'casa_matriz',
          deliveryType: ord.deliveryType === 'envio' ? 'envio' : 'retiro',
          deliveryMethodText:
            ord.deliveryType === 'envio'
              ? `Envío a Domicilio (${ord.shippingDetails?.courier || 'Starken'})`
              : `Retiro en Sucursal (${ord.branchName || ord.branchId})`,
          shippingAddress: ord.shippingDetails?.address || null,
          orderNumber: ord.orderNumber,
          amount: ord.total || 0,
          products: (ord.items || []).map((it: any, idx: number) => ({
            id: it.productId ? String(it.productId) : `it_${idx + 1}`,
            name: it.name,
            quantity: it.quantity || 1,
            size: it.size || 'Única',
            price: it.price || 0,
            sku: it.sku || 'NL-SKU'
          })),
          timeLimitText: '4 horas',
          dueHours: 4,
          status: 'active',
          isAutomated: true
        });
      }
    }

    const alerts = await SystemAlertModel.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error obteniendo alertas del sistema:', error);
    next(error);
  }
};

// 2. Crear o sembrar una alerta en MongoDB
export const createSystemAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = { ...req.body };
    delete data._id;
    delete data.id;

    if (!data.branchId) {
      data.branchId = 'casa_matriz';
    }

    // Evitar duplicados al sembrar alertas iniciales por título y categoría
    if (data.title && data.category) {
      const existing = await SystemAlertModel.findOne({
        title: data.title,
        category: data.category
      });
      if (existing) {
        res.status(200).json({
          success: true,
          message: 'La alerta ya existía en MongoDB',
          data: existing
        });
        return;
      }
    }

    const newAlert = await SystemAlertModel.create(data);
    res.status(201).json({
      success: true,
      message: 'Alerta creada exitosamente en MongoDB',
      data: newAlert
    });
  } catch (error) {
    console.error('Error creando alerta en MongoDB:', error);
    next(error);
  }
};

// 3. Actualizar una alerta (y sincronizar OrderModel si es cobro_pendiente o devolucion)
export const updateSystemAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.id;

    const updatedAlert = await SystemAlertModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedAlert) {
      res.status(404).json({ success: false, message: 'Alerta no encontrada en MongoDB' });
      return;
    }

    // Si se resolvió un Cobro Pendiente (Confirmado o Anulado), sincronizar con OrderModel
    if (updatedAlert.orderNumber && updateData.paymentResolutionStatus) {
      const isConfirmed = updateData.paymentResolutionStatus === 'confirmed';
      const newOrderStatus = isConfirmed ? 'Solicitud recibida' : 'Pago Anulado';
      const targetOrder = await OrderModel.findOne({ orderNumber: updatedAlert.orderNumber });

      if (targetOrder) {
        targetOrder.status = newOrderStatus;
        targetOrder.fulfillmentStatus = newOrderStatus;
        targetOrder.paymentStatus = isConfirmed ? 'CONFIRMED' : 'REJECTED';
        targetOrder.confirmedRevenue = isConfirmed ? Number(targetOrder.total) || 0 : 0;
        if (!isConfirmed) {
          targetOrder.cancellationReason = 'Pago anulado desde Centro de Notificaciones (Cobro Pendiente)';
          targetOrder.cancelledAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
        }
        targetOrder.statusAuditLog = [
          ...(targetOrder.statusAuditLog || []),
          {
            status: newOrderStatus,
            timestamp: new Date().toLocaleString('es-CL'),
            note: isConfirmed
              ? 'Pago confirmado por Super Admin desde Notificaciones de Interés.'
              : 'Pago anulado por Super Admin desde Notificaciones de Interés.'
          }
        ];
        await targetOrder.save({ validateBeforeSave: false });
      }
    }

    // Si se revisó una Solicitud de Devolución (Aprobada o Rechazada), sincronizar con OrderModel
    if (updatedAlert.orderNumber && updateData.returnReviewStatus) {
      const isApproved = updateData.returnReviewStatus === 'approved';
      const nextReturnStatus = isApproved ? 'Aprobada por Admin' : 'Rechazada por Admin';
      const targetOrder = await OrderModel.findOne({ orderNumber: updatedAlert.orderNumber });

      if (targetOrder) {
        targetOrder.status = nextReturnStatus;
        targetOrder.fulfillmentStatus = nextReturnStatus;
        if (!isApproved) {
          targetOrder.paymentStatus = 'REJECTED';
          targetOrder.confirmedRevenue = 0;
          targetOrder.cancellationReason = updateData.rejectionReason || 'Devolución rechazada por Admin';
        }
        if (isApproved && updateData.trackingCode && targetOrder.shippingDetails) {
          targetOrder.shippingDetails.trackingNumber = updateData.trackingCode;
        }
        targetOrder.statusAuditLog = [
          ...(targetOrder.statusAuditLog || []),
          {
            status: nextReturnStatus,
            timestamp: new Date().toLocaleString('es-CL'),
            note: updateData.replyNote || `Devolución ${nextReturnStatus}`
          }
        ];
        await targetOrder.save({ validateBeforeSave: false });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Alerta actualizada exitosamente en MongoDB',
      data: updatedAlert
    });
  } catch (error) {
    console.error('Error actualizando alerta en MongoDB:', error);
    next(error);
  }
};

// 4. Eliminar una alerta permanentemente de MongoDB
export const deleteSystemAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await SystemAlertModel.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Alerta no encontrada en MongoDB' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Alerta eliminada permanentemente de MongoDB'
    });
  } catch (error) {
    console.error('Error eliminando alerta en MongoDB:', error);
    next(error);
  }
};



// ==========================================================================
// CONTROLADOR PÚBLICO DE CHECKOUT (TIENDA CLIENTES E INVITADOS)
// ==========================================================================
export const createPublicOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    const cleanEmail = String(data.customerEmail || data.guestEmail || '').trim().toLowerCase();
    const cleanRut = String(data.customerRut || '').trim().toLowerCase();

    // 1. Verificar preventivamente si el comprador está bloqueado en Lista Negra (UserModel)
    if (cleanEmail || cleanRut) {
      const blockedUser = await UserModel.findOne({
        $or: [
          ...(cleanEmail ? [{ email: cleanEmail }] : []),
          ...(cleanRut ? [{ rut: new RegExp(`^${cleanRut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }] : [])
        ],
        tags: 'Lista Negra'
      });

      if (blockedUser) {
        res.status(403).json({
          success: false,
          message: 'Tu cuenta o RUT mantiene una restricción activa en el sistema (Lista Negra). Por favor contacta a soporte.'
        });
        return;
      }
    }

    const orderNumber = data.orderNumber || `NL-${Math.floor(1000 + Math.random() * 9000)}`;
    const rawItems = Array.isArray(data.items) ? data.items : [];
    const normalizedItems = rawItems.map((it: any, idx: number) => ({
      productId: it.productId || it.id || null,
      sku: it.sku || `NL-WEB-${idx + 1}`,
      name: it.name || it.title || 'Prenda NoLimits',
      size: it.size || it.selectedSize || 'Única',
      price: Number(it.price ?? it.unitPrice ?? 0) || 0,
      quantity: Math.max(1, Number(it.quantity ?? 1) || 1)
    }));

    const subtotal =
      Number(data.subtotal) ||
      normalizedItems.reduce((acc: number, it: any) => acc + it.price * it.quantity, 0);
    const shippingCost = Number(data.shippingCost ?? data.shippingFee ?? 0) || 0;
    const discount = Number(data.discount ?? 0) || 0;
    const total = Number(data.total) || Math.max(0, subtotal - discount + shippingCost);

    const isPickup =
      data.deliveryMethod === 'pickup' ||
      data.deliveryType === 'retiro' ||
      data.deliveryType === 'Retiro en Sucursal';

    const branchId = isPickup ? data.branchId || 'vina_del_mar' : 'casa_matriz';

    // 2. Descontar stock real en la colección 'products' de MongoDB
    for (const item of normalizedItems) {
      let productDoc = null;
      if (item.productId && /^[0-9a-fA-F]{24}$/.test(String(item.productId))) {
        productDoc = await ProductModel.findById(item.productId);
      }
      if (!productDoc && item.sku) {
        productDoc = await ProductModel.findOne({ sku: item.sku });
      }
      if (!productDoc && item.name) {
        productDoc = await ProductModel.findOne({ title: item.name });
      }

      if (productDoc) {
        const currentSold = Number((productDoc as any).soldUnits || 0);
        (productDoc as any).soldUnits = currentSold + item.quantity;

        if (Array.isArray(productDoc.sizeBreakdown) && productDoc.sizeBreakdown.length > 0) {
          let sizeFound = false;
          productDoc.sizeBreakdown = productDoc.sizeBreakdown.map((sb: any) => {
            if (
              !sizeFound &&
              (sb.size === item.size ||
                String(sb.size).toLowerCase().includes(String(item.size).toLowerCase()) ||
                productDoc.sizeBreakdown.length === 1)
            ) {
              sizeFound = true;
              const currentQty = Number(sb.quantity ?? sb.stock ?? 0) || 0;
              const nextQty = Math.max(0, currentQty - item.quantity);
              return { ...sb, quantity: nextQty, stock: nextQty };
            }
            return sb;
          });
          productDoc.markModified('sizeBreakdown');
        }
        await productDoc.save({ validateBeforeSave: false });
      }
    }

    // 3. Actualizar o registrar estadísticas del cliente en la colección 'users'
    let matchedUserId = null;
    if (cleanEmail) {
      const existingUser = await UserModel.findOne({ email: cleanEmail });
      if (existingUser) {
        matchedUserId = existingUser._id;
        existingUser.totalOrdersCount = (Number(existingUser.totalOrdersCount) || 0) + 1;
        existingUser.totalSpentClp = (Number(existingUser.totalSpentClp) || 0) + total;
        existingUser.loyaltyPoints =
          (Number(existingUser.loyaltyPoints) || 0) + Math.max(10, Math.floor(total / 1000));
        await existingUser.save({ validateBeforeSave: false });
      }
    }

    const gatewayLabel =
      data.paymentGateway === 'mercadopago'
        ? 'Mercado Pago'
        : data.paymentGateway === 'khipu'
        ? 'Khipu'
        : 'WebPay';

    // 4. Crear la orden en la colección 'orders'
    const newOrder = await OrderModel.create({
      orderNumber,
      userId: matchedUserId,
      guestEmail: cleanEmail || null,
      customerEmail: cleanEmail,
      customerName: data.customerName || 'Cliente Web NoLimits',
      customerRut: data.customerRut || 'Sin RUT',
      customerPhone: data.customerPhone || '+56 9 0000 0000',
      branchId,
      branchName: data.branchName || (isPickup ? branchId : 'Casa Matriz'),
      items: normalizedItems,
      itemsSummary: normalizedItems.map((i: any) => `${i.quantity}x ${i.name}`).join(', '),
      subtotal,
      shippingCost,
      total,
      confirmedRevenue: total,
      paymentStatus: 'CONFIRMED',
      paymentMethod: gatewayLabel,
      deliveryType: isPickup ? 'retiro' : 'envio',
      pickupBranchId: isPickup ? branchId : null,
      shippingDetails: !isPickup
        ? {
            courier: data.courier || 'Starken',
            trackingNumber: '',
            address: {
              region: data.shippingRegion || 'Región de Valparaíso',
              comuna: data.shippingComuna || 'Viña del Mar',
              street: data.shippingStreet || data.shippingAddress || '',
              number: data.shippingNumber || '',
              apartment: data.shippingApartment || ''
            }
          }
        : null,
      status: 'Solicitud recibida',
      fulfillmentStatus: 'Solicitud recibida',
      registeredByAdmin: 'Tienda Web Pública',
      statusAuditLog: [
        {
          status: 'Solicitud recibida',
          timestamp: new Date().toLocaleString('es-CL'),
          note: `Compra realizada en Tienda Pública vía ${gatewayLabel}.`
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente en MongoDB',
      data: newOrder
    });
  } catch (error) {
    console.error('Error en createPublicOrder:', error);
    next(error);
  }
};

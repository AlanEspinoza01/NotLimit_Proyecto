import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ReviewModel, ProductModel, OrderModel, UserModel } from '../models';
import { cloudinary } from '../config/cloudinary';

const extractCloudinaryPublicId = (imageUrl: string): string | null => {
  try {
    if (!imageUrl.includes('res.cloudinary.com')) return null;
    const parts = imageUrl.split('/upload/');
    if (parts.length < 2) return null;
    const pathWithoutVersion = parts[1].replace(/^v\d+\//, '');
    return pathWithoutVersion.replace(/\.[^/.]+$/, '');
  } catch {
    return null;
  }
};

/**
 * Recalcula el promedio de estrellas (rating) y total de reseñas visibles (reviewCount)
 * en el documento del producto correspondiente en MongoDB.
 */
const recalculateProductRating = async (productId: string | mongoose.Types.ObjectId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(productId))) return;
    const objId = new mongoose.Types.ObjectId(String(productId));

    const stats = await ReviewModel.aggregate([
      { $match: { productId: objId, isHidden: false } },
      {
        $group: {
          _id: '$productId',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    const avgRating = stats.length > 0 ? Number(stats[0].avgRating.toFixed(1)) : 5.0;
    const count = stats.length > 0 ? stats[0].count : 0;

    await ProductModel.findByIdAndUpdate(objId, {
      $set: { rating: avgRating, reviewCount: count }
    });
  } catch (err) {
    console.error('Error recalculando rating del producto:', err);
  }
};

// 1. Público: Obtener reseñas visibles de un producto
export const getReviewsByProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(String(productId))) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    const reviews = await ReviewModel.find({
      productId: new mongoose.Types.ObjectId(String(productId)),
      isHidden: false
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

// 2. Autenticado: Obtener las reseñas escritas por el usuario actual (ProfileReviewsTab)
export const getMyReviews = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Debes iniciar sesión' });
      return;
    }

    const reviews = await ReviewModel.find({ userId: req.user._id })
      .populate('productId', 'title name images sku price')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

// 3. Autenticado: Crear nueva reseña SOLO con compra verificada (Entregado o Retirado)
export const createReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Debes iniciar sesión para publicar una reseña.' });
      return;
    }

    const { productId, orderId, title, rating, comment, productSize, branchPurchased } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(String(productId))) {
      res.status(400).json({ success: false, message: 'ID de producto inválido.' });
      return;
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      res.status(400).json({ success: false, message: 'La calificación debe estar entre 1 y 5 estrellas.' });
      return;
    }

    if (!title?.trim() || !comment?.trim()) {
      res.status(400).json({ success: false, message: 'El título y el comentario son obligatorios.' });
      return;
    }

    // 1. Verificar en MongoDB que el cliente compró este producto y la orden está Entregada o Retirada
    const userEmail = String(req.user.email || '').toLowerCase().trim();
    const orderQuery: Record<string, any> = {
      $and: [
        {
          $or: [
            { userId: req.user._id },
            ...(userEmail ? [{ customerEmail: userEmail }, { guestEmail: userEmail }] : [])
          ]
        },
        {
          $or: [
            { status: { $regex: /entregad|retirad/i } },
            { fulfillmentStatus: { $regex: /entregad|retirad/i } }
          ]
        },
        {
          'items.productId': {
            $in: [String(productId), new mongoose.Types.ObjectId(String(productId))]
          }
        }
      ]
    };

    if (orderId && mongoose.Types.ObjectId.isValid(String(orderId))) {
      orderQuery._id = new mongoose.Types.ObjectId(String(orderId));
    }

    const verifiedOrder = await OrderModel.findOne(orderQuery);
    if (!verifiedOrder) {
      res.status(403).json({
        success: false,
        message: 'Solo puedes reseñar prendas de compras que ya hayan sido Entregadas o Retiradas.'
      });
      return;
    }

    // 1B. Bloqueo anti-farmeo: verificar si este ítem en ESTA orden ya fue reseñado antes
    const targetOrderItem = verifiedOrder.items.find(
      (it: any) => String(it.productId) === String(productId)
    );
    if (targetOrderItem?.isReviewed) {
      res.status(409).json({
        success: false,
        message: 'Esta prenda de esta orden ya fue calificada anteriormente.'
      });
      return;
    }

    // 2. Evitar reseña duplicada para el mismo producto en la misma orden
    const existingReview = await ReviewModel.findOne({
      userId: req.user._id,
      productId: new mongoose.Types.ObjectId(String(productId)),
      orderId: verifiedOrder._id
    });

    if (existingReview) {
      res.status(409).json({
        success: false,
        message: 'Ya publicaste una reseña para esta prenda en esta orden.'
      });
      return;
    }

    const uploadedPhotos =
      req.files && Array.isArray(req.files)
        ? (req.files as any[]).map((file) => file.path)
        : [];

    const fullName =
      `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() ||
      req.user.name ||
      req.user.email.split('@')[0];

    const newReview = await ReviewModel.create({
      userId: req.user._id,
      productId: new mongoose.Types.ObjectId(String(productId)),
      orderId: verifiedOrder._id,
      userName: fullName,
      title: String(title).trim(),
      rating: numericRating,
      comment: String(comment).trim(),
      productSize: String(productSize || '').trim(),
      branchPurchased: String(branchPurchased || verifiedOrder.branchName || '').trim(),
      photos: uploadedPhotos,
      likes: 0,
      isHidden: false
    });

    // Marcar permanentemente el ítem en la orden para que no vuelva a dar puntos si un admin borra la reseña
    if (targetOrderItem) {
      targetOrderItem.isReviewed = true;
      verifiedOrder.markModified('items');
      await verifiedOrder.save({ validateBeforeSave: false });
    }

    // 3. Acreditar puntos Rewards (+100 pts con fotos reales, +20 pts solo texto)
    const earnedPoints = uploadedPhotos.length > 0 ? 100 : 20;
    await UserModel.findByIdAndUpdate(req.user._id, {
      $inc: { loyaltyPoints: earnedPoints },
      $set: {
        lastPointsReason:
          uploadedPhotos.length > 0
            ? 'Bono reseña con fotos reales (+100 pts)'
            : 'Bono reseña verificada (+20 pts)'
      }
    });

    await recalculateProductRating(productId);

    res.status(201).json({
      success: true,
      message: `Reseña publicada exitosamente (+${earnedPoints} pts acreditados)`,
      earnedPoints,
      data: newReview
    });
  } catch (error) {
    console.error('Error creando reseña:', error);
    next(error);
  }
};

// 4. Público: Dar "Me gusta" / útil a una reseña
export const likeReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await ReviewModel.findByIdAndUpdate(
      id,
      { $inc: { likes: 1 } },
      { returnDocument: 'after' }
    );

    if (!updated) {
      res.status(404).json({ success: false, message: 'Reseña no encontrada' });
      return;
    }

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// 5. Admin: Listar todas las reseñas (visibles y ocultas) para ReviewsEditorTab
export const getAllReviewsAdmin = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const reviews = await ReviewModel.find()
      .populate('productId', 'title name images sku price category')
      .populate('userId', 'email firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

// 6. Admin: Ocultar o mostrar una reseña
export const toggleReviewVisibility = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await ReviewModel.findById(id);

    if (!review) {
      res.status(404).json({ success: false, message: 'Reseña no encontrada' });
      return;
    }

    review.isHidden =
      typeof req.body.isHidden === 'boolean' ? req.body.isHidden : !review.isHidden;
    await review.save();

    await recalculateProductRating(review.productId);

    res.status(200).json({
      success: true,
      message: review.isHidden ? 'Reseña ocultada del catálogo' : 'Reseña visible nuevamente',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// 7. Admin: Eliminar reseña permanentemente (MongoDB + Cloudinary)
export const deleteReview = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await ReviewModel.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({ success: false, message: 'Reseña no encontrada' });
      return;
    }

    if (Array.isArray(deleted.photos) && deleted.photos.length > 0) {
      await Promise.all(
        deleted.photos.map(async (url: string) => {
          const pubId = extractCloudinaryPublicId(url);
          if (pubId) await cloudinary.uploader.destroy(pubId);
        })
      );
    }

    await recalculateProductRating(deleted.productId);

    res.status(200).json({
      success: true,
      message: 'Reseña eliminada permanentemente'
    });
  } catch (error) {
    next(error);
  }
};
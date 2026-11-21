import { Router } from 'express';
import {
  getReviewsByProduct,
  getMyReviews,
  createReview,
  likeReview
} from '../controllers/review.controller';
import authenticateUser from '../middleware/authenticateUser';
import validateRequestOrigin from '../middleware/validateRequestOrigin';
import { uploadMiddleware } from '../config/cloudinary';

const reviewRouter = Router();

// Rutas públicas
reviewRouter.get('/product/:productId', getReviewsByProduct);
reviewRouter.post('/:id/like', likeReview);

// Rutas autenticadas (clientes)
reviewRouter.get('/my-reviews', authenticateUser, getMyReviews);
reviewRouter.post('/', authenticateUser, validateRequestOrigin, uploadMiddleware.array('photos', 10), createReview);

export default reviewRouter;

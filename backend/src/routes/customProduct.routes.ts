import { Router } from 'express';
import { uploadMiddleware } from '../config/cloudinary';
import { createCustomProductRequest } from '../controllers/customProduct.controller';

const customProductRouter = Router();

// Ruta pública: cualquier cliente o visitante puede enviar su encargo con hasta 10 fotos de referencia
customProductRouter.post(
  '/',
  uploadMiddleware.array('photos', 10),
  createCustomProductRequest
);

export default customProductRouter;
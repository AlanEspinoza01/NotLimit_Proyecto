import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Conectar con las credenciales del .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configurar el motor de almacenamiento de Cloudinary con carpeta dinámica
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folderName = 'nolimits_products';
    if (req.originalUrl?.includes('store-settings')) {
      folderName = 'nolimits_settings';
    } else if (req.originalUrl?.includes('expenses')) {
      folderName = 'nolimits_expenses';
    } else if (req.originalUrl?.includes('reviews')) {
      folderName = 'nolimits_reviews';
    } else if (req.originalUrl?.includes('returns')) {
      folderName = 'nolimits_returns';
    } else if (req.originalUrl?.includes('profile')) {
      folderName = 'nolimits_avatars';
    } else if (req.originalUrl?.includes('custom-products')) {
      folderName = 'nolimits_custom_products';
    }

    return {
      folder: folderName,
      resource_type: 'auto', // Permite imágenes, GIFs, videos (.mp4, .webm) y documentos
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif', 'mp4', 'webm', 'pdf'],
    };
  },
});

// Exportamos el middleware con límite ampliado para textos/JSON en FormData (25 MB)
export const uploadMiddleware = multer({
  storage,
  limits: {
    fieldSize: 25 * 1024 * 1024, // 25 MB para campos de texto JSON
    fileSize: 20 * 1024 * 1024,  // 20 MB por archivo subido
  },
});

export { cloudinary };
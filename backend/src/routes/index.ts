import { Router } from 'express';
import { getHealthStatus } from '../controllers/health.controller';
import authRouter from './auth.routes';
import sessionPolicyRoutes from './sessionPolicyRoutes';
import reviewRouter from './review.routes';
import adminRouter from './admin.routes';
import authenticateUser from '../middleware/authenticateUser';
import {
 getProducts,
  getBranches,
  getStoreSettings,
  createPublicOrder,
  getMyOrders
} from '../controllers/admin.controller';

const apiRouter = Router();

apiRouter.get('/health', getHealthStatus);

// Rutas públicas para el Catálogo, Detalle de Producto, Configuración y Checkout de la tienda
apiRouter.get('/products', getProducts);
apiRouter.get('/branches', getBranches);
apiRouter.get('/store-settings', getStoreSettings);
apiRouter.post('/orders/checkout', createPublicOrder);
apiRouter.get('/orders/my-orders', authenticateUser, getMyOrders);

// Módulo de Autenticación y Usuarios (/api/auth/*)
apiRouter.use('/auth', authRouter);

// Consulta de política de sesión y seguridad (/api/system/session-policy)
apiRouter.use('/system/session-policy', sessionPolicyRoutes);

// Módulo de Administración (/api/admin/*)
apiRouter.use('/admin', adminRouter);

apiRouter.use('/reviews', reviewRouter);

export default apiRouter;
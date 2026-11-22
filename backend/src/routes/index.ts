import { Router } from 'express';
import { getHealthStatus } from '../controllers/health.controller';
import customProductRouter from './customProduct.routes';
import authRouter from './auth.routes';
import sessionPolicyRoutes from './sessionPolicyRoutes';
import reviewRouter from './review.routes';
import adminRouter from './admin.routes';
import stockAlertRouter from './stockAlert.routes';
import authenticateUser from '../middleware/authenticateUser';
import supportRouter from './support.routes';
import webpayRouter from './webpay.routes';
import returnRouter from './return.routes';
import { clippyPublicRouter } from '../clippy/clippy.routes';
import {
 getProducts,
  getBranches,
  getStoreSettings,
  getMyOrders
} from '../controllers/admin.controller';

const apiRouter = Router();

apiRouter.get('/health', getHealthStatus);

// Rutas públicas para el Catálogo, Detalle de Producto, Configuración y Checkout de la tienda
apiRouter.get('/products', getProducts);
apiRouter.get('/branches', getBranches);
apiRouter.get('/store-settings', getStoreSettings);
// Legacy checkout disabled: it confirmed unpaid transactions. Use Webpay routes.
apiRouter.get('/orders/my-orders', authenticateUser, getMyOrders);

// Clippy público solo ve preguntas guiadas y un catálogo filtrado de productos.
apiRouter.use('/clippy', clippyPublicRouter);

apiRouter.use('/payments', webpayRouter);

// Módulo de Autenticación y Usuarios (/api/auth/*)
apiRouter.use('/auth', authRouter);

// Consulta de política de sesión y seguridad (/api/system/session-policy)
apiRouter.use('/system/session-policy', sessionPolicyRoutes);

// Módulo de Administración (/api/admin/*)
apiRouter.use('/admin', adminRouter);

apiRouter.use('/reviews', reviewRouter);

apiRouter.use('/returns', returnRouter);

apiRouter.use('/custom-products', customProductRouter);

apiRouter.use('/stock-alerts', stockAlertRouter);

apiRouter.use('/support', supportRouter);

export default apiRouter;

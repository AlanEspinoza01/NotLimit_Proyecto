import { Router } from 'express';
import { 
    getDashboardMetrics,
    getOrders,
    createOrder, 
    updateOrderStatus,
    deleteOrder,
    getProducts,
    createProduct, 
    deleteProduct, 
    updateProduct,
    getStoreSettings,     
    updateStoreSettings,
    getSuppliers,     
    createSupplier,   
    updateSupplier,    
    deleteSupplier,
    getBranches,     
    createBranch,    
    updateBranch,    
    deleteBranch,
    getExpenses,     
    createExpense,   
    updateExpense,   
    deleteExpense,
    getCustomers,    
    createCustomer,  
    updateCustomer,  
    deleteCustomer,
    getSystemAlerts,
    createSystemAlert,
    updateSystemAlert,
    deleteSystemAlert
} from '../controllers/admin.controller';

import {
    getAllReviewsAdmin,
    toggleReviewVisibility,
    deleteReview
} from '../controllers/review.controller';

import authenticateUser from '../middleware/authenticateUser';
import validateRequestOrigin from '../middleware/validateRequestOrigin';
import {getAdminCouponCatalog,getAdminCouponHistory,createAdminCoupon,updateAdminCoupon,deleteAdminCoupon} from '../controllers/coupon.controller';
import authorizeRoles from '../middleware/authorizeRoles';
import { uploadMiddleware } from '../config/cloudinary';
import { getAdminOrderReceipt } from '../controllers/receipt.controller';

const adminRouter = Router();

// Middleware a nivel de router: Exige sesión iniciada y rol de super_admin
adminRouter.use(authenticateUser, authorizeRoles('super_admin'));
// Protege operaciones con cookie frente a llamadas desde orígenes ajenos.
adminRouter.use((req,res,next)=>['GET','HEAD','OPTIONS'].includes(req.method)?next():validateRequestOrigin(req,res,next));
adminRouter.get('/coupons',getAdminCouponCatalog);
adminRouter.get('/coupons/redemptions',getAdminCouponHistory);
adminRouter.post('/coupons',createAdminCoupon);
adminRouter.put('/coupons/:id',updateAdminCoupon);
adminRouter.patch('/coupons/:id',updateAdminCoupon);
adminRouter.delete('/coupons/:id',deleteAdminCoupon);

// GET /api/admin/dashboard
adminRouter.get('/dashboard', getDashboardMetrics);
adminRouter.get('/orders', getOrders);
adminRouter.get('/orders/:id/receipt', getAdminOrderReceipt);
adminRouter.post('/orders', createOrder); 
adminRouter.get('/store-settings', getStoreSettings);

// RUTAS DE PRODUCTOS (CON CLOUDINARY)
adminRouter.post('/products', uploadMiddleware.array('images', 10), createProduct);
adminRouter.put('/products/:id', uploadMiddleware.array('images', 10), updateProduct);
adminRouter.get('/products', getProducts);

// RUTAS DE ACTUALIZACIÓN DE ÓRDENES Y STORE SETTINGS
adminRouter.put('/orders/:id/status', updateOrderStatus);
adminRouter.put('/store-settings', uploadMiddleware.any(), updateStoreSettings);

adminRouter.delete('/orders/:id', deleteOrder);
adminRouter.delete('/products/:id', deleteProduct);

// RUTAS DE PROVEEDORES (SUPPLIERS)
adminRouter.get('/suppliers', getSuppliers);
adminRouter.post('/suppliers', createSupplier);
adminRouter.put('/suppliers/:id', updateSupplier);
adminRouter.delete('/suppliers/:id', deleteSupplier);

// RUTAS DE SUCURSALES (BRANCHES)
adminRouter.get('/branches', getBranches);
adminRouter.post('/branches', createBranch);
adminRouter.put('/branches/:id', updateBranch);
adminRouter.delete('/branches/:id', deleteBranch);


// RUTAS DE GASTOS OPERATIVOS (EXPENSES)
adminRouter.get('/expenses', getExpenses);
adminRouter.post('/expenses', uploadMiddleware.any(), createExpense);
adminRouter.put('/expenses/:id', uploadMiddleware.any(), updateExpense);
adminRouter.delete('/expenses/:id', deleteExpense);


// RUTAS DE DIRECTORIO DE CLIENTES (CUSTOMERS)
adminRouter.get('/customers', getCustomers);
adminRouter.post('/customers', createCustomer);
adminRouter.put('/customers/:id', updateCustomer);
adminRouter.delete('/customers/:id', authorizeRoles('super_admin'), deleteCustomer);


// RUTAS DE NOTIFICACIONES DE INTERÉS Y ALERTAS DEL SISTEMA (MONGODB)
adminRouter.get('/alerts', getSystemAlerts);
adminRouter.post('/alerts', createSystemAlert);
adminRouter.put('/alerts/:id', updateSystemAlert);
adminRouter.delete('/alerts/:id', authorizeRoles('super_admin'), deleteSystemAlert);


// RUTAS DE MODERACIÓN DE RESEÑAS (REVIEWS)
adminRouter.get('/reviews', getAllReviewsAdmin);
adminRouter.put('/reviews/:id/visibility', toggleReviewVisibility);
adminRouter.delete('/reviews/:id', deleteReview);

export default adminRouter;

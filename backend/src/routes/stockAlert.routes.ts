import { Router } from 'express';
import { createOutOfStockRequest } from '../controllers/stockAlert.controller';

const stockAlertRouter = Router();

// POST /api/stock-alerts -> Enviar solicitud de producto agotado
stockAlertRouter.post('/', createOutOfStockRequest);

export default stockAlertRouter;
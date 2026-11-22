import { Router } from 'express';
import { createSupportInquiry } from '../controllers/support.controller';

const supportRouter = Router();

// POST /api/support -> Enviar consulta de Atención al Cliente
supportRouter.post('/', createSupportInquiry);

export default supportRouter;
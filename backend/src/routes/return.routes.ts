import { Router } from 'express';
import authenticateUser from '../middleware/authenticateUser';
import { uploadMiddleware } from '../config/cloudinary';
import {
  getMyReturns,
  createReturnRequest,
  getAllReturnsAdmin,
  reviewReturnAdmin
} from '../controllers/return.controller';

const returnRouter = Router();

returnRouter.get('/my-returns', authenticateUser, getMyReturns);
returnRouter.post('/', authenticateUser, uploadMiddleware.array('photos', 10), createReturnRequest);
returnRouter.get('/admin', authenticateUser, getAllReturnsAdmin);
returnRouter.put('/admin/:id/review', authenticateUser, reviewReturnAdmin);


export default returnRouter;
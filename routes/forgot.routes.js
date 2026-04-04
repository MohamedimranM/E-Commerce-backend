import { Router } from 'express';
import { forgotPassword, resetPassword } from '../controllers/forgot.controllers.js';

const forgotRouter = Router();

forgotRouter.post('/forgot-password', forgotPassword);
forgotRouter.post('/reset-password/:token', resetPassword);

export default forgotRouter;

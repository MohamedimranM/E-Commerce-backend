// routes/payment.routes.js
import express from 'express';
import { createCheckoutSession, handleStripeWebhook, getStripeSession } from '../controllers/payment.controllers.js';

const router = express.Router();


router.get('/session/:id', getStripeSession);
router.post('/create-checkout-session', createCheckoutSession);
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;

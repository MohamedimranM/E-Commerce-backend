import express from 'express';
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} from '../controllers/order.controllers.js';
import authorize from '../middleware/authorize.js';
import restrictTo from '../middleware/restrictTo.js';

const router = express.Router();

// User routes (protected)
router.post('/', authorize, placeOrder);
router.get('/my', authorize, getMyOrders);
router.get('/:id', authorize, getOrderById);
router.put('/:id/cancel', authorize, cancelOrder);

// Admin routes
router.get('/', authorize, restrictTo('admin'), getAllOrders);
router.put('/:id/status', authorize, restrictTo('admin'), updateOrderStatus);

export default router;

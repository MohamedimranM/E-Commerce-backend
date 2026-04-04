
import express from 'express';
import { addToCart, removeFromCart, getCartByUser } from '../controllers/cart.controllers.js';
import authorize from '../middleware/authorize.js';
const router = express.Router();

// Add product to cart (protected route)
router

// Add product to cart (protected route)
router.post('/add', authorize, addToCart);

// Remove product from cart (protected route)
router.post('/remove', authorize, removeFromCart);

// Get cart products by user ID (protected route)
router.get('/my', authorize, getCartByUser);

export default router;

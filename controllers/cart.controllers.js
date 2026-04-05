
import { Cart } from '../models/cart.model.js';
// Add product to cart
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id; // Use id set by authorize middleware
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, products: [] });
    }

    const productIndex = cart.products.findIndex(p => p.product.toString() === productId);
    if (productIndex > -1) {
      // Product exists in cart, update quantity
      cart.products[productIndex].quantity += quantity || 1;
    } else {
      // Add new product to cart
      cart.products.push({ product: productId, quantity: quantity || 1 });
    }

    await cart.save();
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Remove product from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    // Debug: log product IDs in cart and the one to remove
    // console.log('Cart products:', cart.products.map(p => p.product.toString()));
    // console.log('Product to remove:', productId);

    const initialLength = cart.products.length;
    cart.products = cart.products.filter(p => {
      if (!p.product) {
        return true;
      }
      try {
        return p.product.toString().trim() !== productId.toString().trim();
      } catch (e) {
        return true;
      }
    });

    if (cart.products.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Product not found in cart' });
    }

    // If no products left, delete the cart itself
    if (cart.products.length === 0) {
      await Cart.deleteOne({ _id: cart._id });
      return res.status(200).json({ success: true, cart: { products: [] } });
    }

    await cart.save();
    await cart.populate('products.product');
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// Get cart products by user ID
export const getCartByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId }).populate('products.product');
    if (!cart) {
      return res.status(200).json({ success: true, cart: { products: [] } });
    }
    res.status(200).json({ success: true, cart });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

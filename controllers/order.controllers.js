import Order from '../models/order.model.js';
import { Cart } from '../models/cart.model.js';
import Product from '../models/product.model.js';
import { sendMail } from '../config/email.js';

// @desc    Place a new order from the user's cart
// @route   POST /api/v1/orders
// @access  Private
export const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod } = req.body;

    // 1. Get user's cart
    const cart = await Cart.findOne({ user: userId }).populate('products.product');
    if (!cart || cart.products.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }

    // 2. Validate stock & build order items
    const orderItems = [];
    for (const item of cart.products) {
      const product = item.product;
      if (!product) {
        return res.status(400).json({ success: false, message: 'Product not found in cart' });
      }
      if (product.countInStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.countInStock}`,
        });
      }
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0]?.url || '',
        price: product.price,
        quantity: item.quantity,
      });
    }

    // 3. Calculate prices
    const itemsPrice = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shippingPrice = itemsPrice > 500 ? 0 : 30; // Free shipping over 500 AED
    const totalPrice = itemsPrice + shippingPrice;

    // 4. Create order
    const order = await Order.create({
      user: userId,
      orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      itemsPrice,
      shippingPrice,
      totalPrice,
      isPaid: paymentMethod === 'COD' ? false : false,
    });

    // 5. Deduct stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: -item.quantity },
      });
    }

    // 6. Clear the cart
    await Cart.deleteOne({ _id: cart._id });

    // 7. Send order confirmation email
    try {
      console.log('--- EMAIL DEBUG ---');
      console.log('Sending order email to:', req.user.email);
      console.log('User name:', req.user.name);
      const orderId = order._id.toString().slice(-8).toUpperCase();
      const orderDate = new Date().toLocaleDateString('en-AE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const itemRowsHtml = orderItems
        .map(
          (i) => `
          <tr>
            <td style="padding:14px 12px;border-bottom:1px solid #f0f0f0">
              <div style="display:flex;align-items:center;gap:12px">
                ${i.image ? `<img src="${i.image}" alt="${i.name}" width="56" height="56" style="border-radius:8px;object-fit:cover;border:1px solid #f0f0f0" />` : ''}
                <div>
                  <p style="margin:0;font-weight:600;color:#1E272E;font-size:14px">${i.name}</p>
                  <p style="margin:4px 0 0;color:#888;font-size:12px">Qty: ${i.quantity}</p>
                </div>
              </div>
            </td>
            <td style="padding:14px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;color:#1E272E;font-size:14px;white-space:nowrap">
              AED ${(i.price * i.quantity).toLocaleString()}
            </td>
          </tr>`
        )
        .join('');

      const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0984E3,#00CEC9);border-radius:16px 16px 0 0;padding:32px 24px;text-align:center">
      <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:50%;width:56px;height:56px;line-height:56px;margin-bottom:12px">
        <span style="font-size:24px">✓</span>
      </div>
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">Order Confirmed!</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Thank you for your purchase, ${req.user.name}!</p>
    </div>

    <!-- Body Card -->
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:28px 24px;box-shadow:0 2px 12px rgba(0,0,0,0.06)">

      <!-- Order Meta -->
      <table style="width:100%;margin-bottom:24px" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0">
            <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Order ID</span><br/>
            <span style="color:#0984E3;font-weight:700;font-size:15px;font-family:monospace">#${orderId}</span>
          </td>
          <td style="padding:8px 0;text-align:right">
            <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Date</span><br/>
            <span style="color:#1E272E;font-weight:600;font-size:14px">${orderDate}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0">
            <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Payment</span><br/>
            <span style="color:#1E272E;font-weight:600;font-size:14px">${paymentMethod || 'COD'}</span>
          </td>
          <td style="padding:8px 0;text-align:right">
            <span style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.5px">Status</span><br/>
            <span style="display:inline-block;background:#FFF3E0;color:#E65100;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600">Pending</span>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 20px" />

      <!-- Items -->
      <p style="margin:0 0 12px;font-weight:700;font-size:14px;color:#1E272E;text-transform:uppercase;letter-spacing:0.5px">Order Items</p>
      <table style="width:100%;border-collapse:collapse" cellpadding="0" cellspacing="0">
        ${itemRowsHtml}
      </table>

      <!-- Totals -->
      <table style="width:100%;margin-top:20px;border-collapse:collapse" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;color:#666;font-size:14px">Subtotal</td>
          <td style="padding:6px 0;text-align:right;color:#1E272E;font-size:14px">AED ${itemsPrice.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#666;font-size:14px">Shipping</td>
          <td style="padding:6px 0;text-align:right;font-size:14px;${shippingPrice === 0 ? 'color:#00B894;font-weight:600' : 'color:#1E272E'}">
            ${shippingPrice === 0 ? 'FREE' : `AED ${shippingPrice}`}
          </td>
        </tr>
        <tr>
          <td colspan="2" style="padding:0"><hr style="border:none;border-top:2px solid #f0f0f0;margin:10px 0" /></td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-weight:700;font-size:18px;color:#1E272E">Total</td>
          <td style="padding:8px 0;text-align:right;font-weight:700;font-size:18px;color:#0984E3">AED ${totalPrice.toLocaleString()}</td>
        </tr>
      </table>

      <!-- Shipping Address -->
      <div style="margin-top:28px;background:#f8f9fb;border-radius:12px;padding:20px">
        <p style="margin:0 0 10px;font-weight:700;font-size:13px;color:#1E272E;text-transform:uppercase;letter-spacing:0.5px">📦 Shipping To</p>
        <p style="margin:0;font-weight:600;color:#1E272E;font-size:14px">${shippingAddress.fullName}</p>
        <p style="margin:4px 0 0;color:#666;font-size:13px;line-height:1.6">
          ${shippingAddress.address}<br/>
          ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}<br/>
          ${shippingAddress.country}
        </p>
        <p style="margin:8px 0 0;color:#666;font-size:13px">📞 ${shippingAddress.phone}</p>
      </div>

      <!-- What's Next -->
      <div style="margin-top:28px;background:#E8F8F5;border-radius:12px;padding:20px">
        <p style="margin:0 0 8px;font-weight:700;font-size:13px;color:#1E272E">What happens next?</p>
        <table cellpadding="0" cellspacing="0" style="width:100%">
          <tr>
            <td style="padding:4px 8px 4px 0;vertical-align:top;color:#00B894;font-size:14px">1.</td>
            <td style="padding:4px 0;color:#555;font-size:13px">We'll confirm your order and prepare it for shipping.</td>
          </tr>
          <tr>
            <td style="padding:4px 8px 4px 0;vertical-align:top;color:#00B894;font-size:14px">2.</td>
            <td style="padding:4px 0;color:#555;font-size:13px">You'll receive a notification when your order is shipped.</td>
          </tr>
          <tr>
            <td style="padding:4px 8px 4px 0;vertical-align:top;color:#00B894;font-size:14px">3.</td>
            <td style="padding:4px 0;color:#555;font-size:13px">${paymentMethod === 'COD' ? 'Pay the delivery partner when your order arrives.' : 'Your order will be delivered to your doorstep.'}</td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 16px">
      <p style="margin:0;font-size:16px;font-weight:800;color:#1E272E">
        <span style="color:#0984E3">Shop</span>Hub
      </p>
      <p style="margin:8px 0 0;color:#aaa;font-size:11px;line-height:1.5">
        You received this email because you placed an order on Shopping Hub.<br/>
        If you did not place this order, please contact us immediately.
      </p>
      <p style="margin:12px 0 0;color:#ccc;font-size:11px">
        © ${new Date().getFullYear()} Shopping Hub. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>`;

      const info = await sendMail({
        to: req.user.email,
        subject: `Shopping Hub — Order Confirmed #${orderId}`,
        html: emailHtml,
      });
      console.log('Email sent! Message ID:', info?.messageId);
      console.log('--- EMAIL DEBUG END ---');
    } catch (emailError) {
      console.error('Order email failed:', emailError.message);
      console.error('Full error:', emailError);
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged-in user's orders
// @route   GET /api/v1/orders/my
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/v1/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only the order owner or an admin can view
    if (order.user._id.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/v1/orders
// @access  Admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    const totalRevenue = orders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    res.status(200).json({ success: true, count: orders.length, totalRevenue, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/v1/orders/:id/status
// @access  Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // If cancelling, restore stock
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      for (const item of order.orderItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { countInStock: item.quantity },
        });
      }
    }

    order.status = status;

    if (status === 'Delivered') {
      order.isDelivered = true;
      order.deliveredAt = new Date();
      if (order.paymentMethod === 'COD') {
        order.isPaid = true;
        order.paidAt = new Date();
      }
    }

    await order.save();
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel an order (user can cancel only Pending orders)
// @route   PUT /api/v1/orders/:id/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Only pending orders can be cancelled' });
    }

    // Restore stock
    for (const item of order.orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { countInStock: item.quantity },
      });
    }

    order.status = 'Cancelled';
    await order.save();

    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Stripe session by ID and return orderId
export const getStripeSession = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    res.json({ orderId: session.metadata?.orderId || null });
  } catch (err) {
    res.status(404).json({ error: 'Session not found' });
  }
};
// controllers/payment.controllers.js
import stripe from '../config/stripe.js';
import Order from '../models/order.model.js';

export const createCheckoutSession = async (req, res) => {
  console.log('Stripe createCheckoutSession called', req.body);
  try {
    const { items, customerEmail, orderId } = req.body;
    // items: [{ name, amount, quantity }]
    const line_items = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: item.amount, // in cents
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_email: customerEmail,
      success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
      metadata: { orderId },
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe createCheckoutSession error:', err);
    res.status(500).json({ error: err.message });
  }
};

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Update order status in DB
    await Order.findByIdAndUpdate(session.metadata.orderId, { status: 'paid' });
  }
  res.json({ received: true });
};

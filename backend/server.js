require('dotenv').config(); // Load .env
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Payment = require('./models/Payment'); // Payment schema/model

const app = express();
app.use(cors());
app.use(express.static('public')); // To serve frontend
app.use(bodyParser.json());

// Initialize Stripe with your secret key from env securely
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected.'))
  .catch((err) => { console.error('DB connection error', err); });

// Helper: Validate amount is a positive integer & within business limits
function validateAmount(amount) {
  // Stripe expects the amount in the lowest currency unit (e.g., paise for INR)
  return typeof amount === 'number' && amount >= 100 && amount <= 1000000; // Minimum ₹1, Maximum ₹10,000
}

// --- Create Stripe Checkout session ---
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;

    // Prevent missing values
    if (amount == null || !paymentMethod) {
      return res.status(400).json({ error: 'Amount and payment method are required.' });
    }
    // Validate amount
    if (!validateAmount(amount)) {
      return res.status(400).json({ error: 'Invalid amount.' });
    }

    // Map UI payment method to Stripe
    let payment_method_types = [];
    if (paymentMethod === 'card') payment_method_types = ['card'];
    else if (paymentMethod === 'upi') payment_method_types = ['upi'];
    else return res.status(400).json({ error: 'Invalid payment method' });

    // Create a Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types,
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: paymentMethod === 'card' ? 'Card Payment' : 'UPI Payment',
            },
            unit_amount: amount, // client sends amount in paise
          },
          quantity: 1,
        }
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel.html`,
      metadata: {
        // You can add other information here for future reference
        userId: req.body.userId || '', // Optionally track user
      },
    });

    return res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Stripe session creation failed.' });
  }
});

// --- Stripe Webhook Endpoint ---
// Stripe will send events here (mark as raw body for Stripe signature)
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log('Webhook signature verification failed.', err.message);
    return res.sendStatus(400);
  }

  // Handle successful payments
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Query payment intent for details
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);

      // Store payment in DB
      await Payment.create({
        sessionId: session.id,
        paymentIntent: session.payment_intent,
        amount: session.amount_total,
        currency: session.currency,
        status: session.payment_status,
        email: session.customer_details.email,
        method: paymentIntent.payment_method_types[0],
        created: new Date(),
      });

      // You can trigger notifications here
    } catch (dbErr) {
      console.log('DB Save Error:', dbErr);
      return res.sendStatus(500);
    }
  }

  res.status(200).json({ received: true });
});

// --- Endpoint to get payment status (optional for frontend display) ---
app.get('/api/payment-status/:sessionId', async (req, res) => {
  try {
    const payment = await Payment.findOne({ sessionId: req.params.sessionId });
    if (!payment) return res.status(404).json({ error: 'Not found' });

    res.json({ status: payment.status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// --- Start server ---
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

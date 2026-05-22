require('dotenv').config(); // Load .env
const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Payment = require('./models/Payment'); // Payment schema/model

const app = express();
app.use(cors());
app.use(express.static('public')); // To serve frontend
app.use(bodyParser.json());

// --- Mount application routes ---
app.use('/api/chat', require('./routes/chat'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/transports', require('./routes/transports'));
app.use('/api/tripPlans', require('./routes/tripPlans'));

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected.'))
  .catch((err) => { console.error('DB connection error', err); });

// Helper: Validate amount is a positive integer & within business limits
function validateAmount(amount) {
  // Stripe expects the amount in the lowest currency unit (e.g., paise for INR)
  return typeof amount === 'number' && amount >= 100 && amount <= 1000000; // Minimum ₹1, Maximum ₹10,000
}

// --- Create Razorpay Order ---
app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    const { amount } = req.body; // amount in paise

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'Invalid amount.' });
    }

    const options = {
      amount: amount, 
      currency: 'INR',
      receipt: 'receipt_order_' + Date.now(),
    };

    const order = await razorpay.orders.create(options);
    return res.json(order);
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    return res.status(500).json({ error: 'Razorpay order creation failed.' });
  }
});

// --- Get Razorpay Key for Frontend ---
app.get('/api/get-razorpay-key', (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

// --- Verify Razorpay Payment ---
app.post('/api/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, email, method } = req.body;

  try {
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // Store payment in DB
      await Payment.create({
        sessionId: razorpay_order_id,
        paymentIntent: razorpay_payment_id,
        amount: amount, // amount in paise
        currency: 'INR',
        status: 'paid',
        email: email || 'user@example.com',
        method: method || 'razorpay',
        created: new Date(),
      });

      return res.json({ success: true });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (err) {
    console.log('Payment Verification Error:', err);
    return res.status(500).json({ success: false, error: 'Payment verification failed' });
  }
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

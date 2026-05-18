require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const destinationRoutes = require('./routes/destinations');
const bookingRoutes = require('./routes/bookings');
const chatRoutes = require('./routes/chat');
const tripPlanRoutes = require('./routes/tripPlans');
const transportRoutes = require('./routes/transports');
const reviewRoutes = require('./routes/reviews');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/tripplans', tripPlanRoutes);
app.use('/api/transports', transportRoutes);
app.use('/api/reviews', reviewRoutes);

mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

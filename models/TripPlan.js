const mongoose = require('mongoose');

const tripPlanSchema = new mongoose.Schema({
    type: { type: String, required: true },
    destination: { type: String, required: true },
    duration: { type: String, required: true },
    price: { type: Number, required: true }
});

module.exports = mongoose.model('TripPlan', tripPlanSchema);

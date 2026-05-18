const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    travelDate: { type: Date, required: true },
    numberOfPeople: { type: Number, required: true },
    fromCity: { type: String, default: 'Bangalore' },
    destination: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', required: true },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' },
    transport: { type: Object },
    stay: { type: Object },
    food: { type: Object },
    totalCost: { type: Number },
    payment: { type: Object },
    review: { type: Object }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);

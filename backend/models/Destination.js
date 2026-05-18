const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: { type: String, required: true },
    category: { type: String, required: true, enum: ['beach', 'mountain', 'historical'] },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    imageUrl: { type: String, required: true }
});

module.exports = mongoose.model('Destination', destinationSchema);

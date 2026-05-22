const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Booking = require('../models/Booking');

// Get my bookings (traveler)
router.get('/my', auth, async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id }).populate('destination').sort({ createdAt: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Get all bookings (admin)
router.get('/', auth, async (req, res) => {
    try {
        const bookings = await Booking.find().populate('destination');
        res.json(bookings);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

const jwt = require('jsonwebtoken');

// Create a booking (public/bot)
router.post('/', async (req, res) => {
    try {
        let payload = req.body;
        const token = req.header('Authorization')?.split(' ')[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                payload.user = decoded.user.id;
            } catch(e) {}
        }
        
        // INTERCEPT DYNAMIC AI GENERATED DESTINATIONS
        if (typeof payload.destination === 'string' && payload.destination.startsWith('dynamic_') && payload.destinationObj) {
            const Destination = require('../models/Destination');
            const newDest = new Destination({
                name: payload.destinationObj.name || payload.destinationObj.place_name,
                location: payload.destinationObj.location || "Global Location",
                category: ["beach", "mountain", "historical", "cultural", "adventure", "religious", "wildlife"].includes(payload.destinationObj.category?.toLowerCase()) ? payload.destinationObj.category.toLowerCase() : "historical",
                description: payload.destinationObj.description || "Dynamic AI Booking",
                price: payload.destinationObj.price || 5000,
                imageUrl: payload.destinationObj.image_url || "https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1000&auto=format&fit=crop"
            });
            const savedDest = await newDest.save();
            // Swap the fake dynamic ID for the real physical database ID
            payload.destination = savedDest._id;
        }

        const newBooking = new Booking(payload);
        const savedBooking = await newBooking.save();
        res.json(savedBooking);
    } catch (err) {
        console.error("Booking Creation Failed: ", err);
        res.status(500).send('Server Error');
    }
});

// Check booking status (public/bot)
router.get('/:id/status', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id).populate('destination');
        if (!booking) return res.status(404).json({ msg: 'Not found' });
        res.json({ status: booking.status, destination: booking.destination });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Complete booking with post-booking selections (public/bot)
router.put('/:id/complete', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        res.json(booking);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Update booking status (admin)
router.put('/:id/status', auth, async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        res.json(booking);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Delete a booking (admin)
router.delete('/:id', auth, async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Booking deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;

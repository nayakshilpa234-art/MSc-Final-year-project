const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const TripPlan = require('../models/TripPlan');

// Get all trip plans
router.get('/', async (req, res) => {
    try {
        const tripPlans = await TripPlan.find();
        res.json(tripPlans);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Add a trip plan
router.post('/', auth, async (req, res) => {
    try {
        const newTripPlan = new TripPlan(req.body);
        const savedTripPlan = await newTripPlan.save();
        res.json(savedTripPlan);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Update a trip plan
router.put('/:id', auth, async (req, res) => {
    try {
        const tripPlan = await TripPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(tripPlan);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Delete a trip plan
router.delete('/:id', auth, async (req, res) => {
    try {
        await TripPlan.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Trip Plan deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Destination = require('../models/Destination');

// Get all destinations
router.get('/', async (req, res) => {
    try {
        const destinations = await Destination.find();
        res.json(destinations);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Add a destination
router.post('/', auth, async (req, res) => {
    try {
        const newDest = new Destination(req.body);
        const savedDest = await newDest.save();
        res.json(savedDest);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Update a destination
router.put('/:id', auth, async (req, res) => {
    try {
        const dest = await Destination.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(dest);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Delete a destination
router.delete('/:id', auth, async (req, res) => {
    try {
        await Destination.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Destination deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;

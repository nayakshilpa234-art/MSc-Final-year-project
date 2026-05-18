const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register Traveler
router.post('/register', async (req, res) => {
    const { username, password, email, guestHistory } = req.body;
    try {
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        user = new User({ username, password, email, role: 'user', chatHistory: guestHistory || [] });
        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: 'user', username });
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.post('/login', async (req, res) => {
    const { username, password, guestHistory } = req.body;
    try {
        let user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        // Merge guest history if provided
        if (guestHistory && guestHistory.length > 0) {
            const existingTextSenders = new Set((user.chatHistory || []).map(m => `${m.sender}:${m.text}`));
            const uniqueGuestHistory = guestHistory.filter(m => !existingTextSenders.has(`${m.sender}:${m.text}`));
            user.chatHistory = [...(user.chatHistory || []), ...uniqueGuestHistory];
            await user.save();
        }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: user.role || 'user', username });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

const auth = require('../middleware/auth');
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;

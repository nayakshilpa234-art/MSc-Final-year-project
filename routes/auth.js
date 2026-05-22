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

// --- Social Login (Google / Apple) ---
router.post('/social', async (req, res) => {
    const { provider, token: socialToken, email, name, providerId } = req.body;

    try {
        // Verify the token with the provider
        if (provider === 'google') {
            // Verify Google token
            const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${socialToken}`);
            if (!googleRes.ok) {
                return res.status(401).json({ msg: 'Invalid Google token' });
            }
            const googleData = await googleRes.json();
            if (!googleData.email) {
                return res.status(401).json({ msg: 'Google token missing email' });
            }
        } else if (provider === 'apple') {
            // For Apple, the frontend already decoded the token
            // In production, you'd verify the Apple ID token server-side
            if (!email && !providerId) {
                return res.status(401).json({ msg: 'Apple sign-in data missing' });
            }
        } else {
            return res.status(400).json({ msg: 'Invalid auth provider' });
        }

        // Find existing user by provider ID or email
        let user = await User.findOne({ 
            $or: [
                { authProvider: provider, authProviderId: providerId },
                { email: email }
            ]
        });

        if (user) {
            // Update provider info if user was previously local
            if (user.authProvider === 'local') {
                user.authProvider = provider;
                user.authProviderId = providerId;
                await user.save();
            }
        } else {
            // Create new user
            const username = name || email.split('@')[0];
            // Ensure unique username
            let finalUsername = username;
            let counter = 1;
            while (await User.findOne({ username: finalUsername })) {
                finalUsername = `${username}_${counter}`;
                counter++;
            }

            user = new User({
                username: finalUsername,
                email: email,
                authProvider: provider,
                authProviderId: providerId,
                role: 'user',
                chatHistory: []
            });
            await user.save();
        }

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: user.role || 'user', username: user.username });
        });
    } catch (err) {
        console.error('Social login error:', err);
        res.status(500).json({ msg: 'Social login failed' });
    }
});

module.exports = router;

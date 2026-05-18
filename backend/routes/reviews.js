const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const jwt = require('jsonwebtoken');

// POST /api/reviews - Add a new review
router.post('/', async (req, res) => {
    const { destinationId, hotelId, transportId, rating, reviewText, username } = req.body;
    try {
        let userId = null;
        let submitterName = username || 'Anonymous Guest';

        // Check if user is authenticated via Bearer token
        const authHeader = req.header('Authorization');
        if (authHeader) {
            const token = authHeader.replace('Bearer ', '');
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded.user.id;
                const User = require('../models/User');
                const userObj = await User.findById(userId);
                if (userObj) {
                    submitterName = userObj.username;
                }
            } catch (jwtErr) {
                console.log("JWT Verify failed in review submission:", jwtErr.message);
            }
        }

        const newReview = new Review({
            user: userId,
            username: submitterName,
            destinationId: destinationId || null,
            hotelId: hotelId || null,
            transportId: transportId || null,
            rating: Number(rating),
            reviewText
        });

        await newReview.save();
        res.status(201).json(newReview);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// GET /api/reviews/:entityId - Get all reviews for a destination, hotel, or transport with stats and sorting
router.get('/:entityId', async (req, res) => {
    const { entityId } = req.params;
    const { sort } = req.query; // 'highest' or 'latest'
    
    try {
        const query = {
            $or: [
                { destinationId: entityId },
                { hotelId: entityId },
                { transportId: entityId }
            ]
        };

        let reviewsQuery = Review.find(query);

        // Sorting options
        if (sort === 'highest') {
            reviewsQuery = reviewsQuery.sort({ rating: -1, createdAt: -1 });
        } else {
            // Default to 'latest'
            reviewsQuery = reviewsQuery.sort({ createdAt: -1 });
        }

        const reviews = await reviewsQuery.exec();

        // Calculate statistics
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0 
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
            : 0;

        // Rating distribution
        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviews.forEach(r => {
            if (distribution[r.rating] !== undefined) {
                distribution[r.rating]++;
            }
        });

        res.json({
            reviews,
            stats: {
                totalReviews,
                averageRating: Number(averageRating),
                distribution
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

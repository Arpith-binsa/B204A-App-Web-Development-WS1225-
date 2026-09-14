const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiters');

const ALLOWED_FIELDS = ['items', 'total', 'paypalOrderId'];

// writeLimiter throttles order creation; the user is taken from the verified
// JWT (JSON Web Token), never from the request body, so it cannot be spoofed.
router.post('/', writeLimiter, authMiddleware, async (req, res) => {
    try {
        // Strict schema: ignore/reject anything beyond the three expected keys
        // (blocks a client trying to set "user", "status", etc. directly).
        const extra = Object.keys(req.body || {}).filter((k) => !ALLOWED_FIELDS.includes(k));
        if (extra.length) {
            return res.status(400).json({ message: `Unexpected field(s): ${extra.join(', ')}` });
        }

        const { items, total, paypalOrderId } = req.body;

        if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
            return res.status(400).json({ message: 'Invalid items' });
        }
        if (typeof total !== 'number' || total <= 0) {
            return res.status(400).json({ message: 'Invalid total' });
        }
        if (!paypalOrderId || typeof paypalOrderId !== 'string' || paypalOrderId.length > 100) {
            return res.status(400).json({ message: 'Invalid PayPal order ID' });
        }

        const cleanItems = items.map(item => ({
            id: typeof item.id === 'string' ? item.id.slice(0, 100) : '',
            name: typeof item.name === 'string' ? item.name.trim().slice(0, 100) : '',
            price: typeof item.price === 'number' && item.price > 0 ? item.price : 0,
            qty: typeof item.qty === 'number' && item.qty > 0 ? Math.floor(item.qty) : 1,
            image: typeof item.image === 'string' ? item.image.slice(0, 200) : ''
        }));

        const order = new Order({
            user: req.user.id,
            items: cleanItems,
            total,
            paypalOrderId,
            status: 'confirmed'
        });

        await order.save();
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/my-orders', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

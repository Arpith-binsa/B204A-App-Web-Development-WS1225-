const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const authMiddleware = require('../middleware/auth');

// SAVE ORDER after PayPal payment
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { items, total, paypalOrderId } = req.body;

        const order = new Order({
            user: req.user.id,
            items,
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

// GET USER'S ORDERS
router.get('/my-orders', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id })
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
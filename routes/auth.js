const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// REGISTER
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0 || name.trim().length > 50) {
            return res.status(400).json({ message: 'Invalid name' });
        }
        if (!email || typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 100) {
            return res.status(400).json({ message: 'Invalid email' });
        }
        if (!password || typeof password !== 'string' || password.length < 8 || password.length > 100) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({ name: name.trim(), email: email.toLowerCase(), password: hashedPassword });
        await user.save();

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 100) {
            return res.status(400).json({ message: 'Invalid email' });
        }
        if (!password || typeof password !== 'string' || password.length > 100) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });

    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// GET CURRENT USER
router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const VALID_SUBJECTS = ['booking', 'product', 'collaboration', 'other'];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MessageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', MessageSchema);

router.post('/', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
            return res.status(400).json({ message: 'Invalid name' });
        }
        if (!email || typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 100) {
            return res.status(400).json({ message: 'Invalid email' });
        }
        if (!subject || !VALID_SUBJECTS.includes(subject)) {
            return res.status(400).json({ message: 'Invalid subject' });
        }
        if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 2000) {
            return res.status(400).json({ message: 'Invalid message' });
        }

        const newMessage = new Message({
            name: name.trim(),
            email: email.toLowerCase(),
            subject,
            message: message.trim()
        });
        await newMessage.save();
        res.json({ message: 'Message sent successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

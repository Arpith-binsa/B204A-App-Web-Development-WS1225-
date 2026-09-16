// Application entry point. Security hardening follows OWASP best practices: secrets from env vars only, helmet headers, restricted CORS, NoSQL sanitization, and rate limiting.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const sanitize = require('./middleware/sanitize');
const { apiLimiter } = require('./middleware/rateLimiters');

// Fail fast if a required secret is missing, instead of running with an undefined JWT_SECRET.
const REQUIRED_ENV = ['MONGO_URI', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((name) => !process.env[name]);
if (missing.length) {
    console.error(
        `Missing required environment variable(s): ${missing.join(', ')}. ` +
        `Set them in your .env file (see .env.example) or in the host dashboard.`
    );
    process.exit(1);
}

const app = express();

// Trust exactly one proxy hop (Render.com) so req.ip reflects the real client for rate limiting.
app.set('trust proxy', 1);

// helmet's CSP is relaxed enough to allow the PayPal SDK and the SPA's inline scripts.
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", 'https://*.paypal.com', 'https://*.paypalobjects.com'],
                // Needed for the SPA's inline onclick handlers (product cards, service slider).
                scriptSrcAttr: ["'unsafe-inline'"],
                // Whole *.paypal.com family allowed — a narrower list breaks the PayPal SDK.
                frameSrc: ["'self'", 'https://*.paypal.com'],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", 'https://*.paypal.com', 'https://*.paypalobjects.com'],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://*.paypalobjects.com']
            }
        },
        // PayPal's popup/redirect flow needs to open cross-origin windows.
        crossOriginOpenerPolicy: false,
        crossOriginEmbedderPolicy: false
    })
);

// Comma-separated allow-list from CORS_ORIGINS; falls back to same-origin only if unset.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // No Origin header (same-origin, curl, server-to-server) is always allowed.
            if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        }
    })
);

// Cap the JSON body size so a client cannot exhaust memory with a huge payload.
app.use(express.json({ limit: '10kb' }));
// Strip MongoDB operator-injection keys ($gt, $where, dotted paths, ...) from every request.
app.use(sanitize);

// Static frontend assets.
app.use(express.static('public'));

// PayPal client-id is public by design; the PayPal SECRET must never be sent to the browser.
app.get('/api/config', (req, res) => {
    res.json({
        paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
        currency: process.env.PAYPAL_CURRENCY || 'EUR'
    });
});

// Broad limiter for the whole API; individual routers add stricter limiters on top.
app.use('/api', apiLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/contact', require('./routes/contact'));

// SPA fallback: any non-API GET returns index.html so client-side routing works on deep links.
app.get('/*splat', (req, res) => {
    // A path with a file extension is a missing asset, not a page — return a real 404.
    if (path.extname(req.path)) {
        return res.status(404).json({ message: 'Not found' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized error handler returns clean JSON instead of a stack trace.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err && err.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: 'Origin not allowed' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB error:', err.message));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

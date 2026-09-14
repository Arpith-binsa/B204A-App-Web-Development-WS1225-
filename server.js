// server.js — application entry point
//
// Security hardening in this file follows OWASP (Open Web Application Security
// Project) best practices:
//   - Secrets (Mongo URI, JWT secret, PayPal client-id) come ONLY from
//     environment variables. Nothing sensitive is hard-coded, and the app
//     refuses to start if a required secret is missing.
//   - helmet sets secure HTTP (HyperText Transfer Protocol) response headers.
//   - CORS (Cross-Origin Resource Sharing) is restricted to a configured
//     allow-list instead of every origin.
//   - A NoSQL (Not only SQL) sanitizer strips MongoDB operator-injection
//     payloads from all incoming data.
//   - Rate limiters throttle the whole API and, more strictly, the sensitive
//     auth and contact endpoints.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const sanitize = require('./middleware/sanitize');
const { apiLimiter } = require('./middleware/rateLimiters');

// --- FAIL FAST ON MISSING SECRETS -------------------------------------------
// Rather than starting with an undefined JWT_SECRET (which would silently make
// every token forgeable) we stop immediately and tell the operator what to fix.
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

// Render.com (and most hosts) sit behind a reverse proxy. Trusting the first
// proxy hop makes req.ip reflect the real client address, which the IP-based
// rate limiters depend on. "1" = trust exactly one proxy, which is safer than
// "true" (trust everything) for rate-limit accuracy.
app.set('trust proxy', 1);

// --- SECURITY HEADERS -------------------------------------------------------
// helmet sets a bundle of protective headers. We keep its Content Security
// Policy relaxed enough to allow the PayPal SDK (Software Development Kit) and
// inline scripts the existing single-page app relies on, while still blocking
// obviously unsafe sources. Tighten these further if inline scripts are removed.
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", 'https://*.paypal.com', 'https://*.paypalobjects.com'],
                // The SPA uses inline onclick="..." handlers (e.g. on product
                // cards and the service slider). Browsers govern those with the
                // separate script-src-attr directive, which helmet defaults to
                // 'none'. Allowing 'unsafe-inline' here re-enables those clicks.
                scriptSrcAttr: ["'unsafe-inline'"],
                // The PayPal JS SDK (Software Development Kit) loads scripts,
                // iframes, images and XHR (XMLHttpRequest) calls from several
                // PayPal subdomains (www., www.sandbox., c., ...). A narrower
                // list partially loads the SDK and then fails with "something
                // went wrong", so we allow the whole *.paypal.com family.
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

// --- CORS (restricted) ------------------------------------------------------
// Instead of allowing every origin, we read a comma-separated allow-list from
// the CORS_ORIGINS env var. If it is not set we fall back to same-origin only,
// which is correct for this app because the frontend is served by this server.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // Requests with no Origin header (same-origin fetches, curl, server
            // to server) are allowed. Browser cross-origin requests are only
            // allowed if the origin is on the list.
            if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error('Not allowed by CORS'));
        }
    })
);

// --- BODY PARSING + SANITIZATION --------------------------------------------
// Cap the JSON body size so a client cannot exhaust memory with a huge payload.
app.use(express.json({ limit: '10kb' }));
// Strip MongoDB operator-injection keys ($gt, $where, dotted paths, ...) from
// every request before any route or model sees the data.
app.use(sanitize);

// Static frontend assets.
app.use(express.static('public'));

// --- PUBLIC RUNTIME CONFIG --------------------------------------------------
// The PayPal client-id is a PUBLIC identifier (it is meant to appear in the
// browser), but hard-coding it in HTML means a key change requires editing many
// files. Instead we expose it here from an env var so the frontend can fetch it
// at runtime and there is a single source of truth. NOTE: only the client-id is
// public -- the PayPal SECRET must never be sent to the browser.
app.get('/api/config', (req, res) => {
    res.json({
        paypalClientId: process.env.PAYPAL_CLIENT_ID || '',
        currency: process.env.PAYPAL_CURRENCY || 'EUR'
    });
});

// --- RATE LIMITING (broad) --------------------------------------------------
// Apply the broad limiter to the whole API. Individual routers add their own
// stricter limiters (auth, contact, writes) on top of this.
app.use('/api', apiLimiter);

// --- ROUTES -----------------------------------------------------------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/contact', require('./routes/contact'));

// Single-page-app fallback: any non-API GET returns index.html so client-side
// routing (history.pushState) works on deep links and refreshes.
// NOTE: Express 5 changed wildcard syntax — a bare '*' now throws. The named
// wildcard '/*splat' is the Express 5 equivalent of the old catch-all.
app.get('/*splat', (req, res) => {
    // If the path looks like a file (has an extension, e.g. /foo/style.css or
    // /services/images/x.jpg) it is a missing asset, not a page. Return a real
    // 404 rather than HTML so a broken path is obvious instead of the browser
    // silently trying to parse index.html as CSS or an image.
    if (path.extname(req.path)) {
        return res.status(404).json({ message: 'Not found' });
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- ERROR HANDLER ----------------------------------------------------------
// Centralized handler so thrown errors (including the CORS rejection above)
// return clean JSON instead of a stack trace, which would leak internals.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err && err.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: 'Origin not allowed' });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error' });
});

// --- DATABASE + STARTUP -----------------------------------------------------
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB error:', err.message));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

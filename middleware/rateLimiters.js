// Rate limiting for all public endpoints, following OWASP brute-force/abuse-protection guidance.

const rateLimit = require('express-rate-limit');
// Normalizes IPv6 addresses so a single user can't dodge the limit by varying the low bits.
const { ipKeyGenerator } = require('express-rate-limit');

// Shared handler so every limit returns the same friendly 429 response.
function tooMany(res, message) {
    return res.status(429).json({
        message: message || 'Too many requests. Please try again later.'
    });
}

// Broad limiter for the entire API: 100 requests per 15 minutes per IP.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => tooMany(res)
});

// Strict limiter for authentication: 10 attempts per 15 minutes, keyed on IP + email.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const email =
            req.body && typeof req.body.email === 'string'
                ? req.body.email.toLowerCase()
                : '';
        return `${ipKeyGenerator(req)}:${email}`;
    },
    handler: (req, res) =>
        tooMany(res, 'Too many login attempts. Please wait 15 minutes and try again.')
});

// Strict limiter for the public contact form: 5 messages per hour per IP.
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
        tooMany(res, 'Too many messages sent. Please try again later.')
});

// Moderate limiter for state-changing endpoints (orders, product admin): 30 writes per 15 minutes per IP.
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => tooMany(res)
});

module.exports = { apiLimiter, authLimiter, contactLimiter, writeLimiter };

// middleware/rateLimiters.js
//
// Rate limiting for all public endpoints, following OWASP (Open Web
// Application Security Project) recommendations for brute-force and
// abuse protection.
//
// We define several limiters with different strictness:
//   - apiLimiter:     broad limit applied to the whole /api surface.
//   - authLimiter:    strict limit on login/register to slow password guessing.
//   - contactLimiter: strict limit on the public contact form to stop spam.
//   - writeLimiter:   moderate limit on create/update/delete (order + product).
//
// All limiters key on the caller's IP (Internet Protocol) address by default.
// The auth limiter additionally keys on the submitted email so one attacker
// cannot lock out every account from a shared IP, and so a single account
// cannot be hammered from rotating IPs. Every limiter returns a graceful JSON
// (JavaScript Object Notation) 429 ("Too Many Requests") response instead of
// crashing or hanging.

const rateLimit = require('express-rate-limit');
// ipKeyGenerator normalizes IPv6 addresses so a single user on IPv6 cannot
// slip past the limit by varying the low bits of their address. Required by
// express-rate-limit v8 whenever a custom keyGenerator uses the IP.
const { ipKeyGenerator } = require('express-rate-limit');

// Shared handler so every limit produces the same friendly, machine-readable
// 429 response. express-rate-limit sets the standard RateLimit-* headers for
// us (standardHeaders: true), telling well-behaved clients when to retry.
function tooMany(res, message) {
    return res.status(429).json({
        message: message || 'Too many requests. Please try again later.'
    });
}

// Broad limiter for the entire API: 100 requests per 15 minutes per IP.
// Generous enough for normal browsing, low enough to blunt scraping.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => tooMany(res)
});

// Strict limiter for authentication: 10 attempts per 15 minutes.
// Keyed on IP + submitted email (lower-cased) to resist distributed guessing.
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
        // ipKeyGenerator(req) returns the IPv6-normalized client IP. req.ip
        // reflects the proxy chain because server.js sets "trust proxy" for
        // the Render.com load balancer.
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

// Moderate limiter for state-changing endpoints (orders, product admin):
// 30 writes per 15 minutes per IP.
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => tooMany(res)
});

module.exports = { apiLimiter, authLimiter, contactLimiter, writeLimiter };

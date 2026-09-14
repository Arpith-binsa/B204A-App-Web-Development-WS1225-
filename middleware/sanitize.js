// middleware/sanitize.js
//
// NoSQL (Not only SQL) injection protection for MongoDB.
//
// WHY THIS EXISTS:
//   An attacker can send a JSON body like { "email": { "$gt": "" } } to turn a
//   normal query into an operator query and bypass checks (a classic MongoDB
//   injection). This middleware strips any object key that starts with "$" or
//   contains a "." so those operators can never reach Mongoose.
//
//   The popular "express-mongo-sanitize" package does the same job, but its
//   default middleware reassigns req.query, which throws on Express 5 because
//   req.query is now a read-only getter. This hand-rolled version mutates the
//   objects IN PLACE (it never reassigns req.query / req.body / req.params),
//   so it is safe on Express 5. Follows OWASP (Open Web Application Security
//   Project) input-validation guidance: treat all client input as hostile.

// Recursively remove dangerous keys from an object, editing it in place.
function scrub(value) {
    if (!value || typeof value !== 'object') return;

    // Arrays: just recurse into each element.
    if (Array.isArray(value)) {
        for (const item of value) scrub(item);
        return;
    }

    for (const key of Object.keys(value)) {
        // A key containing "$" (operator) or "." (dotted path) is not something
        // a legitimate client form ever sends, so we delete it entirely.
        if (key.includes('$') || key.includes('.')) {
            delete value[key];
            continue;
        }
        // Otherwise recurse in case the value is a nested object/array.
        scrub(value[key]);
    }
}

module.exports = function sanitize(req, res, next) {
    // req.body and req.params are plain writable objects, so scrubbing them
    // in place is safe on every Express version.
    scrub(req.body);
    scrub(req.params);

    // req.query is a read-only getter on Express 5. We must NOT reassign it,
    // but scrubbing the object it returns in place is allowed and effective.
    scrub(req.query);

    next();
};

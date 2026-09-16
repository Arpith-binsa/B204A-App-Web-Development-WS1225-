// NoSQL injection protection: strips any object key containing "$" or "." so MongoDB operators can't reach Mongoose. Mutates objects in place instead of reassigning req.query, which is a read-only getter on Express 5.

function scrub(value) {
    if (!value || typeof value !== 'object') return;

    if (Array.isArray(value)) {
        for (const item of value) scrub(item);
        return;
    }

    for (const key of Object.keys(value)) {
        if (key.includes('$') || key.includes('.')) {
            delete value[key];
            continue;
        }
        scrub(value[key]);
    }
}

module.exports = function sanitize(req, res, next) {
    scrub(req.body);
    scrub(req.params);
    scrub(req.query);
    next();
};

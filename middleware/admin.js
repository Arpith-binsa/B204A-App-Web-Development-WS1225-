// Admin-only authorization guard; place after the auth middleware so req.user is already populated.
module.exports = function adminMiddleware(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

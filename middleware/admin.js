// middleware/admin.js
//
// Admin-only authorization guard.
//
// WHY THIS EXISTS:
//   The product create/update/delete endpoints are meant to be admin-only
//   (the frontend hides the "Add Product" page from normal users). But hiding
//   a page in the browser is NOT security -- anyone can call the API directly
//   with a valid token. This middleware enforces the rule on the server, which
//   is the only place it can be trusted. This addresses OWASP (Open Web
//   Application Security Project) A01:2021 "Broken Access Control".
//
// USAGE: place AFTER the auth middleware so req.user is already populated from
//   the verified JWT (JSON Web Token):
//     router.post('/', authMiddleware, adminMiddleware, handler)

module.exports = function adminMiddleware(req, res, next) {
    // req.user is set by middleware/auth.js after verifying the token.
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

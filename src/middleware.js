// Simple RBAC middleware helpers for the Express server
// - requireAuth: ensures a session userId exists
// - allowRoles(...roles): allows only sessions with one of the roles
// - allowSelfOrAdmin: allows access when the session userId matches req.params.id or role is admin

function requireAuth(req, res, next) {
    if (req.session && req.session.userId) return next();
    // Keep JSON shape compatible with the existing /api/auth/me usage
    return res.status(401).json({ authenticated: false, message: 'Not authenticated' });
}

function allowRoles(...roles) {
    return function (req, res, next) {
        const role = (req.session && req.session.role) || null;
        if (!role) return res.status(401).json({ success: false, message: 'Not authenticated' });
        if (roles.includes(role)) return next();
        return res.status(403).json({ success: false, message: 'Forbidden: insufficient role' });
    };
}

function allowSelfOrAdmin(req, res, next) {
    const role = (req.session && req.session.role) || null;
    const userId = req.session && req.session.userId;
    const paramId = req.params && (req.params.id || req.params.userId);

    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });
    if (role === 'admin') return next();
    if (paramId && String(userId) === String(paramId)) return next();
    return res.status(403).json({ success: false, message: 'Forbidden' });
}

module.exports = {
    requireAuth,
    allowRoles,
    allowSelfOrAdmin
};

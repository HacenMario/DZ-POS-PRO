const { getTranslation } = require('../config/i18n');

const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: getTranslation('unauthorized', req.lang || 'ar')
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: '❌ غير مصرح لك بهذه العملية (صلاحيات غير كافية)'
            });
        }

        next();
    };
};

module.exports = roleMiddleware;

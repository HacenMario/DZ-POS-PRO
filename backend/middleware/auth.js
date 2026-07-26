const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getTranslation } = require('../config/i18n');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                message: getTranslation('unauthorized', req.lang || 'ar')
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: getTranslation('userNotFound', req.lang || 'ar')
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: '❌ الحساب معطل، يرجى التواصل مع الإدارة'
            });
        }

        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: getTranslation('invalidToken', req.lang || 'ar')
            });
        }
        res.status(401).json({
            success: false,
            message: getTranslation('unauthorized', req.lang || 'ar')
        });
    }
};

module.exports = authMiddleware;

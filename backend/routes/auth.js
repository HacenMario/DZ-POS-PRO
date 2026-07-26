const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

// مسارات عامة
router.post('/login', authController.login);
router.post('/register', authController.register); // يمكن حمايتها بـ Admin لاحقاً

// مسارات محمية
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
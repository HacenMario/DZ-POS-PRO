const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.get('/', authMiddleware, roleMiddleware('admin', 'manager'), couponController.getCoupons);
router.post('/validate', authMiddleware, couponController.validateCoupon);

router.post('/', authMiddleware, roleMiddleware('admin'), couponController.createCoupon);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), couponController.deleteCoupon);

module.exports = router;
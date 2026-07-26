const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.get('/', authMiddleware, saleController.getSales);
router.get('/:id', authMiddleware, saleController.getSaleById);

router.post('/', authMiddleware, roleMiddleware('admin', 'manager', 'cashier'), saleController.createSale);
router.put('/:id/status', authMiddleware, roleMiddleware('admin', 'manager'), saleController.updateSaleStatus);

module.exports = router;
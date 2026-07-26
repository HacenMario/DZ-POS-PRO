const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.get('/', authMiddleware, roleMiddleware('admin', 'manager'), inventoryController.getAllMovements);
router.get('/product/:productId', authMiddleware, roleMiddleware('admin', 'manager'), inventoryController.getMovementsByProduct);

router.post('/', authMiddleware, roleMiddleware('admin', 'manager'), inventoryController.createMovement);

module.exports = router;
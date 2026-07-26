const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.get('/', authMiddleware, customerController.getCustomers);
router.get('/:id', authMiddleware, customerController.getCustomerById);

router.post('/', authMiddleware, roleMiddleware('admin', 'manager'), customerController.createCustomer);
router.put('/:id', authMiddleware, roleMiddleware('admin', 'manager'), customerController.updateCustomer);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), customerController.deleteCustomer);

module.exports = router;
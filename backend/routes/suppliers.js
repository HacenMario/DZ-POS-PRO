const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.get('/', authMiddleware, supplierController.getSuppliers);
router.get('/:id', authMiddleware, supplierController.getSupplierById);

router.post('/', authMiddleware, roleMiddleware('admin', 'manager'), supplierController.createSupplier);
router.put('/:id', authMiddleware, roleMiddleware('admin', 'manager'), supplierController.updateSupplier);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), supplierController.deleteSupplier);

module.exports = router;
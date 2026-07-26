const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.get('/', authMiddleware, categoryController.getCategories);
router.get('/:id', authMiddleware, categoryController.getCategoryById);

router.post('/', authMiddleware, roleMiddleware('admin', 'manager'), categoryController.createCategory);
router.put('/:id', authMiddleware, roleMiddleware('admin', 'manager'), categoryController.updateCategory);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), categoryController.deleteCategory);

module.exports = router;
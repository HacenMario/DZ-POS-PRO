const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');
const upload = require('../middleware/upload');


router.get('/', authMiddleware, productController.getProducts);
router.get('/barcode/:barcode', authMiddleware, productController.getProductByBarcode);
router.get('/:id', authMiddleware, productController.getProductById);

router.post('/', authMiddleware, roleMiddleware('admin', 'manager'), productController.createProduct);
router.put('/:id', authMiddleware, roleMiddleware('admin', 'manager'), productController.updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), productController.deleteProduct);
router.put('/:id/stock', authMiddleware, roleMiddleware('admin', 'manager'), productController.updateStock);

router.post('/', authMiddleware, roleMiddleware('admin', 'manager'), upload.array('images', 5), productController.createProduct);
router.put('/:id', authMiddleware, roleMiddleware('admin', 'manager'), upload.array('images', 5), productController.updateProduct);

module.exports = router;
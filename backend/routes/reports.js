const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.get('/daily-sales', authMiddleware, roleMiddleware('admin', 'manager'), reportController.getDailySalesReport);
router.get('/top-products', authMiddleware, roleMiddleware('admin', 'manager'), reportController.getTopProductsReport);
router.get('/top-customers', authMiddleware, roleMiddleware('admin', 'manager'), reportController.getTopCustomersReport);
router.get('/low-stock', authMiddleware, roleMiddleware('admin', 'manager'), reportController.getLowStockReport);
router.get('/by-period', authMiddleware, roleMiddleware('admin', 'manager'), reportController.getSalesByPeriodReport);
router.get('/dashboard-stats', authMiddleware, roleMiddleware('admin', 'manager', 'cashier'), reportController.getDashboardStats);
router.get('/chart-data', authMiddleware, roleMiddleware('admin', 'manager', 'cashier'), reportController.getChartData);

module.exports = router;
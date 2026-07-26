// backend/controllers/reportController.js
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { getTranslation } = require('../config/i18n');

// ========================================
// 1. تقرير المبيعات اليومية
// ========================================
const getDailySalesReport = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const sales = await Sale.find({
            createdAt: { $gte: today, $lt: tomorrow },
            status: 'paid'
        });

        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
        const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

        res.json({
            success: true,
            report: {
                date: today.toISOString().split('T')[0],
                totalSales,
                totalRevenue,
                averageTicket,
                sales
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تقرير المبيعات اليومية:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// 2. تقرير المنتجات الأكثر مبيعاً
// ========================================
const getTopProductsReport = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const { limit = 10 } = req.query;

        const sales = await Sale.find({ status: 'paid' })
            .populate({
                path: 'items',
                populate: { path: 'product', select: 'name price' }
            });

        const productSales = {};

        for (const sale of sales) {
            for (const item of sale.items || []) {
                const productId = item.product?._id?.toString();
                if (productId) {
                    if (!productSales[productId]) {
                        productSales[productId] = {
                            product: item.product,
                            quantity: 0,
                            revenue: 0
                        };
                    }
                    productSales[productId].quantity += item.quantity;
                    productSales[productId].revenue += item.total || (item.quantity * item.price);
                }
            }
        }

        const sorted = Object.values(productSales)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, parseInt(limit));

        const formatted = sorted.map(item => ({
            ...item,
            productName: item.product?.displayName || item.product?.getName?.(lang) || item.product?.name || 'غير محدد'
        }));

        res.json({
            success: true,
            report: {
                topProducts: formatted
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تقرير المنتجات الأكثر مبيعاً:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// 3. تقرير العملاء الأكثر شراءً
// ========================================
const getTopCustomersReport = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const { limit = 10 } = req.query;

        const customers = await Customer.find({ isActive: true })
            .sort({ totalSpent: -1 })
            .limit(parseInt(limit));

        const formatted = customers.map(c => ({
            ...c._doc,
            name: c.displayName || c.getName?.(lang) || c.name || 'غير محدد'
        }));

        res.json({
            success: true,
            report: {
                topCustomers: formatted
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تقرير العملاء الأكثر شراءً:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// 4. تقرير المخزون المنخفض
// ========================================
const getLowStockReport = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const products = await Product.find({
            $expr: { $lte: ['$stock', '$minStock'] },
            isActive: true
        });

        const formatted = products.map(p => ({
            ...p._doc,
            name: p.displayName || p.getName?.(lang) || p.name || 'غير محدد'
        }));

        res.json({
            success: true,
            report: {
                lowStockProducts: formatted
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تقرير المخزون المنخفض:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// 5. تقرير الفواتير حسب الفترة الزمنية
// ========================================
const getSalesByPeriodReport = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: getTranslation('missingFields', lang)
            });
        }

        const sales = await Sale.find({
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            status: 'paid'
        });

        const totalSales = sales.length;
        const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);

        // تجميع حسب اليوم
        const dailyData = {};
        for (const sale of sales) {
            const date = sale.createdAt.toISOString().split('T')[0];
            if (!dailyData[date]) {
                dailyData[date] = { sales: 0, revenue: 0 };
            }
            dailyData[date].sales += 1;
            dailyData[date].revenue += sale.total;
        }

        res.json({
            success: true,
            report: {
                startDate,
                endDate,
                totalSales,
                totalRevenue,
                dailyData,
                sales
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تقرير الفواتير حسب الفترة:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// 6. إحصائيات لوحة التحكم (Dashboard Stats)
// ========================================
const getDashboardStats = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        
        const [totalProducts, totalCustomers, totalSalesToday, lowStockProducts] = await Promise.all([
            Product.countDocuments({ isActive: true }),
            Customer.countDocuments({ isActive: true }),
            Sale.countDocuments({
                createdAt: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                },
                status: 'paid'
            }),
            Product.find({
                $expr: { $lte: ['$stock', '$minStock'] },
                isActive: true
            }).limit(5)
        ]);

        const salesToday = await Sale.find({
            createdAt: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lt: new Date(new Date().setHours(23, 59, 59, 999))
            },
            status: 'paid'
        });
        const totalRevenueToday = salesToday.reduce((sum, s) => sum + s.total, 0);

        const formattedLowStock = lowStockProducts.map(p => ({
            id: p._id,
            name: p.displayName || p.getName?.(lang) || p.name || 'غير محدد',
            stock: p.stock,
            minStock: p.minStock,
            price: p.price
        }));

        res.json({
            success: true,
            data: {
                totalProducts,
                totalCustomers,
                totalSalesToday,
                totalRevenueToday,
                lowStockProducts: formattedLowStock,
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب إحصائيات لوحة التحكم:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// 7. 🔥 بيانات الرسم البياني (جديد - Chart Data)
// ========================================
const getChartData = async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        const lang = req.lang || 'ar';
        
        let startDate = new Date();
        if (period === 'week') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (period === 'month') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (period === 'year') {
            startDate.setFullYear(startDate.getFullYear() - 1);
        }

        const sales = await Sale.find({
            createdAt: { $gte: startDate },
            status: 'paid'
        });

        const dailyData = {};
        sales.forEach(sale => {
            const date = sale.createdAt.toISOString().split('T')[0];
            if (!dailyData[date]) {
                dailyData[date] = { count: 0, revenue: 0 };
            }
            dailyData[date].count += 1;
            dailyData[date].revenue += sale.total;
        });

        const labels = Object.keys(dailyData).sort();
        const counts = labels.map(d => dailyData[d].count);
        const revenues = labels.map(d => dailyData[d].revenue);

        res.json({
            success: true,
            data: {
                labels,
                datasets: [
                    { 
                        label: 'عدد المبيعات', 
                        data: counts, 
                        borderColor: '#f59e0b', 
                        backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                        fill: true,
                        tension: 0.3
                    },
                    { 
                        label: 'الإيرادات (دج)', 
                        data: revenues, 
                        borderColor: '#3b82f6', 
                        backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                        fill: true,
                        tension: 0.3
                    }
                ]
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب بيانات الرسم البياني:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// ✅ تصدير جميع الدوال (module.exports)
// ========================================
module.exports = {
    getDailySalesReport,
    getTopProductsReport,
    getTopCustomersReport,
    getLowStockReport,
    getSalesByPeriodReport,
    getDashboardStats,
    getChartData // <--- الدالة الجديدة موجودة هنا
};
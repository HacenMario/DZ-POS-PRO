const Return = require('../models/Return');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const SaleItem = require('../models/SaleItem');
const { getTranslation } = require('../config/i18n');

// ✅ إنشاء إرجاع جديد
const createReturn = async (req, res) => {
    try {
        const { saleId, items, reason } = req.body;
        const lang = req.lang || 'ar';

        if (!saleId || !items || !items.length) {
            return res.status(400).json({
                success: false,
                message: getTranslation('missingFields', lang)
            });
        }

        // ✅ التحقق من الفاتورة
        const sale = await Sale.findById(saleId);
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: getTranslation('saleNotFound', lang)
            });
        }

        if (sale.status === 'returned') {
            return res.status(400).json({
                success: false,
                message: '❌ هذه الفاتورة تم إرجاعها مسبقاً'
            });
        }

        // ✅ معالجة المنتجات المرتجعة
        let totalRefund = 0;
        const returnItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `${getTranslation('productNotFound', lang)}: ${item.productId}`
                });
            }

            const saleItem = await SaleItem.findOne({
                sale: saleId,
                product: product._id
            });

            if (!saleItem) {
                return res.status(400).json({
                    success: false,
                    message: `❌ المنتج ${product.getName(lang)} غير موجود في هذه الفاتورة`
                });
            }

            if (saleItem.quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `❌ الكمية المرتجعة أكبر من الكمية المشتراة`
                });
            }

            const refundAmount = item.quantity * item.price;
            totalRefund += refundAmount;

            returnItems.push({
                product: product._id,
                quantity: item.quantity,
                price: item.price
            });

            // ✅ إعادة المنتج إلى المخزون
            product.stock += item.quantity;
            await product.save();
        }

        // ✅ إنشاء الإرجاع
        const returnDoc = new Return({
            sale: saleId,
            items: returnItems,
            reason: {
                ar: reason?.ar || '',
                en: reason?.en || '',
                fr: reason?.fr || ''
            },
            totalRefund,
            createdBy: req.userId
        });

        await returnDoc.save();

        // ✅ تحديث حالة الفاتورة
        sale.status = 'returned';
        sale.updatedAt = new Date();
        await sale.save();

        // ✅ تحديث إجمالي مشتريات العميل
        if (sale.customer) {
            const Customer = require('../models/Customer');
            const customer = await Customer.findById(sale.customer);
            if (customer) {
                customer.totalSpent = Math.max(0, (customer.totalSpent || 0) - totalRefund);
                await customer.save();
            }
        }

        res.status(201).json({
            success: true,
            message: getTranslation('saleReturned', lang),
            return: returnDoc,
            totalRefund
        });
    } catch (error) {
        console.error('❌ خطأ في إنشاء الإرجاع:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ جلب جميع الإرجاعات
const getReturns = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const returns = await Return.find()
            .populate('sale', 'saleNumber total')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 });

        const formatted = returns.map(r => ({
            ...r._doc,
            reason: r.reason[lang] || r.reason.ar
        }));

        res.json({
            success: true,
            returns: formatted
        });
    } catch (error) {
        console.error('❌ خطأ في جلب الإرجاعات:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ جلب إرجاع واحد
const getReturnById = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const returnDoc = await Return.findById(req.params.id)
            .populate('sale', 'saleNumber total')
            .populate('items.product', 'name price')
            .populate('createdBy', 'name');

        if (!returnDoc) {
            return res.status(404).json({
                success: false,
                message: '❌ الإرجاع غير موجود'
            });
        }

        res.json({
            success: true,
            return: {
                ...returnDoc._doc,
                reason: returnDoc.reason[lang] || returnDoc.reason.ar
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب الإرجاع:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

module.exports = {
    createReturn,
    getReturns,
    getReturnById
};
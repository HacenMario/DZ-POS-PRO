const InventoryMovement = require('../models/InventoryMovement');
const Product = require('../models/Product');
const { getTranslation } = require('../config/i18n');

// ✅ تسجيل حركة مخزون يدوياً
const createMovement = async (req, res) => {
    try {
        const { productId, type, quantity, reason } = req.body;
        const lang = req.lang || 'ar';

        if (!productId || !type || !quantity) {
            return res.status(400).json({
                success: false,
                message: getTranslation('missingFields', lang)
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: getTranslation('productNotFound', lang)
            });
        }

        let newStock = product.stock;
        if (type === 'in') {
            newStock += quantity;
        } else if (type === 'out') {
            if (product.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: getTranslation('insufficientStock', lang)
                });
            }
            newStock -= quantity;
        } else {
            return res.status(400).json({
                success: false,
                message: '❌ نوع الحركة غير صحيح (in/out)'
            });
        }

        // ✅ تسجيل الحركة
        const movement = new InventoryMovement({
            product: product._id,
            type,
            quantity,
            previousStock: product.stock,
            newStock,
            reason: {
                ar: reason?.ar || '',
                en: reason?.en || '',
                fr: reason?.fr || ''
            },
            createdBy: req.userId
        });

        await movement.save();

        // ✅ تحديث مخزون المنتج
        product.stock = newStock;
        product.updatedAt = new Date();
        await product.save();

        res.status(201).json({
            success: true,
            message: getTranslation('movementLogged', lang),
            movement: {
                ...movement._doc,
                reason: movement.reason[lang] || movement.reason.ar
            },
            product
        });
    } catch (error) {
        console.error('❌ خطأ في تسجيل حركة المخزون:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ جلب جميع حركات المخزون لمنتج معين
const getMovementsByProduct = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const { productId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: getTranslation('productNotFound', lang)
            });
        }

        const movements = await InventoryMovement.find({ product: productId })
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await InventoryMovement.countDocuments({ product: productId });

        const formatted = movements.map(m => ({
            ...m._doc,
            reason: m.reason[lang] || m.reason.ar
        }));

        res.json({
            success: true,
            product: {
                ...product._doc,
                name: product.getName(lang),
                description: product.getDescription(lang)
            },
            movements: formatted,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب حركات المخزون:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ جلب جميع حركات المخزون (جميع المنتجات)
const getAllMovements = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const { page = 1, limit = 50 } = req.query;

        const movements = await InventoryMovement.find()
            .populate('product', 'name price')
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await InventoryMovement.countDocuments();

        const formatted = movements.map(m => ({
            ...m._doc,
            reason: m.reason[lang] || m.reason.ar,
            productName: m.product?.getName ? m.product.getName(lang) : m.product?.name
        }));

        res.json({
            success: true,
            movements: formatted,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب حركات المخزون:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

module.exports = {
    createMovement,
    getMovementsByProduct,
    getAllMovements
};
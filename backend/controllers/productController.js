// backend/controllers/productController.js
const Product = require('../models/Product');
const Category = require('../models/Category');
const { getTranslation } = require('../config/i18n');
const fs = require('fs');
const path = require('path');

// ========================================
// دوال مساعدة للصور
// ========================================
const deleteImageFile = (imagePath) => {
    if (!imagePath) return;
    const fullPath = path.join(__dirname, '../../', imagePath);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
    }
};

// ========================================
// دالة مساعدة للحصول على الاسم حسب اللغة
// ========================================
const getLocalizedName = (nameObj, lang) => {
    if (!nameObj) return 'غير محدد';
    return nameObj[lang] || nameObj.ar || 'غير محدد';
};

// ========================================
// دالة مساعدة للحصول على الوصف حسب اللغة
// ========================================
const getLocalizedDescription = (descObj, lang) => {
    if (!descObj) return '';
    return descObj[lang] || descObj.ar || '';
};

// ========================================
// إنشاء منتج جديد (مع دعم رفع الصور)
// ========================================
const createProduct = async (req, res) => {
    try {
        const {
            name, description, price, costPrice, category,
            barcode, sku, stock, minStock, unit, tax, isActive,
            timbre // ✅ إضافة timbre
        } = req.body;
        const lang = req.lang || 'ar';

        // معالجة الصور المرفوعة
        let imagePaths = [];
        if (req.files && req.files.length > 0) {
            imagePaths = req.files.map(file => `/uploads/${file.filename}`);
        } else if (req.body.images) {
            try {
                const parsed = JSON.parse(req.body.images);
                if (Array.isArray(parsed)) imagePaths = parsed;
            } catch (e) {}
        }

        // التحقق من الحقول المطلوبة
        if (!name?.ar || !name?.en || !name?.fr) {
            return res.status(400).json({
                success: false,
                message: getTranslation('missingFields', lang)
            });
        }

        if (price === undefined || price === null || isNaN(price)) {
            return res.status(400).json({
                success: false,
                message: getTranslation('missingFields', lang)
            });
        }

        // التحقق من الباركود
        if (barcode) {
            const existing = await Product.findOne({ barcode });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: getTranslation('barcodeExists', lang)
                });
            }
        }

        // التحقق من SKU
        if (sku) {
            const existing = await Product.findOne({ sku });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: getTranslation('skuExists', lang)
                });
            }
        }

        // التحقق من الفئة
        if (category) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: getTranslation('categoryNotFound', lang)
                });
            }
        }

        // ✅ إضافة timbre إلى كائن المنتج
        const product = new Product({
            name: {
                ar: name.ar,
                en: name.en,
                fr: name.fr
            },
            description: {
                ar: description?.ar || '',
                en: description?.en || '',
                fr: description?.fr || ''
            },
            price: parseFloat(price),
            costPrice: parseFloat(costPrice) || 0,
            category: category || null,
            barcode: barcode || undefined,
            sku: sku || undefined,
            stock: parseInt(stock) || 0,
            minStock: parseInt(minStock) || 5,
            unit: unit || 'قطعة',
            tax: parseFloat(tax) || 0,
            timbre: parseFloat(timbre) || 0, // ✅
            images: imagePaths,
            isActive: isActive !== undefined ? isActive === 'true' || isActive === true : true,
            createdBy: req.userId
        });

        await product.save();

        const obj = product.toObject();
        // ✅ استخدام الدوال المساعدة بدلاً من getName/getDescription
        obj.displayName = getLocalizedName(product.name, lang);
        obj.displayDescription = getLocalizedDescription(product.description, lang);

        res.status(201).json({
            success: true,
            message: getTranslation('productCreated', lang),
            product: obj
        });
    } catch (error) {
        console.error('❌ خطأ في إنشاء المنتج:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// جلب جميع المنتجات (مع التنسيق)
// ========================================
const getProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            category,
            minPrice,
            maxPrice,
            lowStock,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        const lang = req.lang || 'ar';

        const query = {};

        if (search) {
            query.$or = [
                { 'name.ar': { $regex: search, $options: 'i' } },
                { 'name.en': { $regex: search, $options: 'i' } },
                { 'name.fr': { $regex: search, $options: 'i' } },
                { 'description.ar': { $regex: search, $options: 'i' } },
                { 'description.en': { $regex: search, $options: 'i' } },
                { 'description.fr': { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } }
            ];
        }

        if (category) query.category = category;
        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) query.price.$gte = parseFloat(minPrice);
            if (maxPrice !== undefined) query.price.$lte = parseFloat(maxPrice);
        }
        if (lowStock === 'true') {
            query.$expr = { $lte: ['$stock', '$minStock'] };
        }

        const products = await Product.find(query)
            .populate('category', 'name')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Product.countDocuments(query);

        // ✅ تنسيق المنتجات بدون استدعاء دوال غير موجودة
        const formattedProducts = products.map(p => {
            const obj = p.toObject();
            obj.displayName = getLocalizedName(p.name, lang);
            obj.displayDescription = getLocalizedDescription(p.description, lang);
            if (obj.category && obj.category.name) {
                obj.category.displayName = getLocalizedName(obj.category.name, lang);
            }
            // تأكد من وجود timbre في الكائن
            if (obj.timbre === undefined) obj.timbre = 0;
            return obj;
        });

        res.json({
            success: true,
            products: formattedProducts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب المنتجات:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// جلب منتج واحد
// ========================================
const getProductById = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const product = await Product.findById(req.params.id)
            .populate('category', 'name');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: getTranslation('productNotFound', lang)
            });
        }

        const obj = product.toObject();
        obj.displayName = getLocalizedName(product.name, lang);
        obj.displayDescription = getLocalizedDescription(product.description, lang);
        if (obj.category && obj.category.name) {
            obj.category.displayName = getLocalizedName(obj.category.name, lang);
        }
        if (obj.timbre === undefined) obj.timbre = 0;

        res.json({
            success: true,
            product: obj
        });
    } catch (error) {
        console.error('❌ خطأ في جلب المنتج:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// جلب منتج بواسطة الباركود
// ========================================
const getProductByBarcode = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const product = await Product.findOne({ barcode: req.params.barcode })
            .populate('category', 'name');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: getTranslation('productNotFound', lang)
            });
        }

        const obj = product.toObject();
        obj.displayName = getLocalizedName(product.name, lang);
        obj.displayDescription = getLocalizedDescription(product.description, lang);
        if (obj.category && obj.category.name) {
            obj.category.displayName = getLocalizedName(obj.category.name, lang);
        }
        if (obj.timbre === undefined) obj.timbre = 0;

        res.json({
            success: true,
            product: obj
        });
    } catch (error) {
        console.error('❌ خطأ في جلب المنتج بالباركود:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// تحديث منتج (مع دعم الصور)
// ========================================
const updateProduct = async (req, res) => {
    try {
        const {
            name, description, price, costPrice, category,
            barcode, sku, stock, minStock, unit, tax, isActive,
            existingImages,
            timbre // ✅ إضافة timbre
        } = req.body;
        const lang = req.lang || 'ar';

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: getTranslation('productNotFound', lang)
            });
        }

        // معالجة الصور الجديدة
        let imagePaths = [];

        // 1. الصور الموجودة التي لم يتم حذفها
        if (existingImages) {
            try {
                const parsed = JSON.parse(existingImages);
                if (Array.isArray(parsed)) {
                    imagePaths = parsed.filter(img => img.startsWith('/uploads/'));
                }
            } catch (e) {}
        }

        // 2. إضافة الصور الجديدة المرفوعة
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/${file.filename}`);
            imagePaths = [...imagePaths, ...newImages];
        }

        // 3. إذا تم إرسال صور عبر JSON
        if (req.body.images && !req.body.existingImages) {
            try {
                const parsed = JSON.parse(req.body.images);
                if (Array.isArray(parsed)) {
                    imagePaths = parsed.filter(img => img.startsWith('/uploads/'));
                }
            } catch (e) {}
        }

        // حذف الصور التي لم تعد موجودة
        if (imagePaths.length < product.images.length) {
            const oldImages = product.images || [];
            const newSet = new Set(imagePaths);
            oldImages.forEach(img => {
                if (!newSet.has(img) && img.startsWith('/uploads/')) {
                    deleteImageFile(img);
                }
            });
        }

        // التحقق من الباركود
        if (barcode && barcode !== product.barcode) {
            const existing = await Product.findOne({ barcode });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: getTranslation('barcodeExists', lang)
                });
            }
        }

        // التحقق من SKU
        if (sku && sku !== product.sku) {
            const existing = await Product.findOne({ sku });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: getTranslation('skuExists', lang)
                });
            }
        }

        // التحقق من الفئة
        if (category && category !== product.category?.toString()) {
            const categoryExists = await Category.findById(category);
            if (!categoryExists) {
                return res.status(400).json({
                    success: false,
                    message: getTranslation('categoryNotFound', lang)
                });
            }
        }

        // تحديث الحقول
        if (name) {
            if (name.ar !== undefined) product.name.ar = name.ar;
            if (name.en !== undefined) product.name.en = name.en;
            if (name.fr !== undefined) product.name.fr = name.fr;
        }
        if (description) {
            if (description.ar !== undefined) product.description.ar = description.ar;
            if (description.en !== undefined) product.description.en = description.en;
            if (description.fr !== undefined) product.description.fr = description.fr;
        }
        if (price !== undefined) product.price = parseFloat(price);
        if (costPrice !== undefined) product.costPrice = parseFloat(costPrice);
        if (category !== undefined) product.category = category || null;
        if (barcode !== undefined) product.barcode = barcode || undefined;
        if (sku !== undefined) product.sku = sku || undefined;
        if (stock !== undefined) product.stock = parseInt(stock);
        if (minStock !== undefined) product.minStock = parseInt(minStock);
        if (unit !== undefined) product.unit = unit;
        if (tax !== undefined) product.tax = parseFloat(tax);
        if (timbre !== undefined) product.timbre = parseFloat(timbre); // ✅
        if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;
        if (imagePaths.length > 0 || req.body.images !== undefined) {
            product.images = imagePaths;
        }

        product.updatedAt = new Date();
        await product.save();

        const obj = product.toObject();
        obj.displayName = getLocalizedName(product.name, lang);
        obj.displayDescription = getLocalizedDescription(product.description, lang);
        if (obj.timbre === undefined) obj.timbre = 0;

        res.json({
            success: true,
            message: getTranslation('productUpdated', lang),
            product: obj
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث المنتج:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// حذف منتج
// ========================================
const deleteProduct = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: getTranslation('productNotFound', lang)
            });
        }

        // حذف الصور المرتبطة
        if (product.images && product.images.length) {
            product.images.forEach(img => {
                deleteImageFile(img);
            });
        }

        await product.deleteOne();

        res.json({
            success: true,
            message: getTranslation('productDeleted', lang)
        });
    } catch (error) {
        console.error('❌ خطأ في حذف المنتج:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// تحديث المخزون
// ========================================
const updateStock = async (req, res) => {
    try {
        const { quantity, type, reason } = req.body;
        const lang = req.lang || 'ar';

        if (!quantity || !type) {
            return res.status(400).json({
                success: false,
                message: getTranslation('missingFields', lang)
            });
        }

        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: getTranslation('productNotFound', lang)
            });
        }

        let newStock = product.stock;
        if (type === 'in') {
            newStock += parseInt(quantity);
        } else if (type === 'out') {
            if (product.stock < quantity) {
                return res.status(400).json({
                    success: false,
                    message: getTranslation('insufficientStock', lang)
                });
            }
            newStock -= parseInt(quantity);
        } else {
            return res.status(400).json({
                success: false,
                message: '❌ نوع الحركة غير صحيح (in/out)'
            });
        }

        product.stock = newStock;
        product.updatedAt = new Date();
        await product.save();

        const obj = product.toObject();
        obj.displayName = getLocalizedName(product.name, lang);
        obj.displayDescription = getLocalizedDescription(product.description, lang);
        if (obj.timbre === undefined) obj.timbre = 0;

        res.json({
            success: true,
            message: getTranslation('stockUpdated', lang),
            product: obj
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث المخزون:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// الحصول على المنتجات منخفضة المخزون
// ========================================
const getLowStockProducts = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const products = await Product.find({
            $expr: { $lte: ['$stock', '$minStock'] },
            isActive: true
        }).populate('category', 'name');

        const formatted = products.map(p => {
            const obj = p.toObject();
            obj.displayName = getLocalizedName(p.name, lang);
            obj.displayDescription = getLocalizedDescription(p.description, lang);
            if (obj.category && obj.category.name) {
                obj.category.displayName = getLocalizedName(obj.category.name, lang);
            }
            if (obj.timbre === undefined) obj.timbre = 0;
            return obj;
        });

        res.json({
            success: true,
            data: formatted
        });
    } catch (error) {
        console.error('❌ خطأ في جلب المنتجات المنخفضة:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// تصدير الدوال
// ========================================
module.exports = {
    createProduct,
    getProducts,
    getProductById,
    getProductByBarcode,
    updateProduct,
    deleteProduct,
    updateStock,
    getLowStockProducts
};

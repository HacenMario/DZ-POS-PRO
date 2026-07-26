const Category = require('../models/Category');
const { getTranslation } = require('../config/i18n');

// ✅ إنشاء فئة جديدة
const createCategory = async (req, res) => {
    try {
        const { name, description, parentId } = req.body;
        const lang = req.lang || 'ar';

        if (!name?.ar || !name?.en || !name?.fr) {
            return res.status(400).json({
                success: false,
                message: getTranslation('missingFields', lang)
            });
        }

        // التحقق من عدم وجود اسم مكرر
        const existing = await Category.findOne({
            'name.ar': name.ar
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: getTranslation('categoryNameExists', lang)
            });
        }

        if (parentId) {
            const parent = await Category.findById(parentId);
            if (!parent) {
                return res.status(400).json({
                    success: false,
                    message: getTranslation('categoryNotFound', lang)
                });
            }
        }

        const category = new Category({
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
            parentId: parentId || null,
            createdBy: req.userId
        });

        await category.save();

        const obj = category.toObject();
        obj.displayName = category.getName(lang);
        obj.displayDescription = category.getDescription(lang);

        res.status(201).json({
            success: true,
            message: getTranslation('categoryCreated', lang),
            category: obj
        });
    } catch (error) {
        console.error('❌ خطأ في إنشاء الفئة:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ جلب جميع الفئات (مع التنسيق)
const getCategories = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const lang = req.lang || 'ar';

        const query = {};
        if (search) {
            query.$or = [
                { 'name.ar': { $regex: search, $options: 'i' } },
                { 'name.en': { $regex: search, $options: 'i' } },
                { 'name.fr': { $regex: search, $options: 'i' } }
            ];
        }

        const categories = await Category.find(query)
            .populate('parentId', 'name')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Category.countDocuments(query);

        const formatted = categories.map(c => {
            const obj = c.toObject();
            obj.displayName = c.getName(lang);
            obj.displayDescription = c.getDescription(lang);
            if (obj.parentId && obj.parentId.name) {
                obj.parentId.displayName = obj.parentId.name[lang] || obj.parentId.name.ar;
            }
            return obj;
        });

        res.json({
            success: true,
            categories: formatted,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب الفئات:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ جلب فئة واحدة
const getCategoryById = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const category = await Category.findById(req.params.id)
            .populate('parentId', 'name');

        if (!category) {
            return res.status(404).json({
                success: false,
                message: getTranslation('categoryNotFound', lang)
            });
        }

        const obj = category.toObject();
        obj.displayName = category.getName(lang);
        obj.displayDescription = category.getDescription(lang);
        if (obj.parentId && obj.parentId.name) {
            obj.parentId.displayName = obj.parentId.name[lang] || obj.parentId.name.ar;
        }

        res.json({
            success: true,
            category: obj
        });
    } catch (error) {
        console.error('❌ خطأ في جلب الفئة:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ تحديث فئة
const updateCategory = async (req, res) => {
    try {
        const { name, description, parentId, isActive } = req.body;
        const lang = req.lang || 'ar';

        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: getTranslation('categoryNotFound', lang)
            });
        }

        if (name) {
            if (name.ar) category.name.ar = name.ar;
            if (name.en) category.name.en = name.en;
            if (name.fr) category.name.fr = name.fr;
        }
        if (description) {
            if (description.ar !== undefined) category.description.ar = description.ar;
            if (description.en !== undefined) category.description.en = description.en;
            if (description.fr !== undefined) category.description.fr = description.fr;
        }
        if (parentId !== undefined) category.parentId = parentId || null;
        if (isActive !== undefined) category.isActive = isActive;

        category.updatedAt = new Date();
        await category.save();

        const obj = category.toObject();
        obj.displayName = category.getName(lang);
        obj.displayDescription = category.getDescription(lang);
        if (obj.parentId && obj.parentId.name) {
            obj.parentId.displayName = obj.parentId.name[lang] || obj.parentId.name.ar;
        }

        res.json({
            success: true,
            message: getTranslation('categoryUpdated', lang),
            category: obj
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث الفئة:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ حذف فئة
const deleteCategory = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: getTranslation('categoryNotFound', lang)
            });
        }

        // التحقق من وجود منتجات تابعة
        const Product = require('../models/Product');
        const hasProducts = await Product.findOne({ category: category._id });
        if (hasProducts) {
            return res.status(400).json({
                success: false,
                message: '❌ لا يمكن حذف الفئة لأنها تحتوي على منتجات'
            });
        }

        await category.deleteOne();

        res.json({
            success: true,
            message: getTranslation('categoryDeleted', lang)
        });
    } catch (error) {
        console.error('❌ خطأ في حذف الفئة:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

module.exports = {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    deleteCategory
};
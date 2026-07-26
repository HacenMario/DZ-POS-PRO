const Supplier = require('../models/Supplier');
const { getTranslation } = require('../config/i18n');

// ✅ إنشاء مورد جديد
const createSupplier = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        const lang = req.lang || 'ar';

        if (!name?.ar || !name?.en || !name?.fr || !phone) {
            return res.status(400).json({
                success: false,
                message: getTranslation('missingFields', lang)
            });
        }

        const supplier = new Supplier({
            name: {
                ar: name.ar,
                en: name.en,
                fr: name.fr
            },
            phone,
            email: email || '',
            address: {
                ar: address?.ar || '',
                en: address?.en || '',
                fr: address?.fr || ''
            },
            createdBy: req.userId
        });

        await supplier.save();

        res.status(201).json({
            success: true,
            message: '✅ تم إنشاء المورد بنجاح',
            supplier: {
                ...supplier._doc,
                name: supplier.getName(lang),
                address: supplier.getAddress(lang)
            }
        });
    } catch (error) {
        console.error('❌ خطأ في إنشاء المورد:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ جلب جميع الموردين
const getSuppliers = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const suppliers = await Supplier.find({ isActive: true })
            .sort({ createdAt: -1 });

        const formatted = suppliers.map(s => ({
            ...s._doc,
            name: s.getName(lang),
            address: s.getAddress(lang)
        }));

        res.json({
            success: true,
            suppliers: formatted
        });
    } catch (error) {
        console.error('❌ خطأ في جلب الموردين:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ جلب مورد واحد
const getSupplierById = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: '❌ المورد غير موجود'
            });
        }

        res.json({
            success: true,
            supplier: {
                ...supplier._doc,
                name: supplier.getName(lang),
                address: supplier.getAddress(lang)
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب المورد:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ تحديث مورد
const updateSupplier = async (req, res) => {
    try {
        const { name, phone, email, address, isActive } = req.body;
        const lang = req.lang || 'ar';

        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: '❌ المورد غير موجود'
            });
        }

        if (name) {
            if (name.ar) supplier.name.ar = name.ar;
            if (name.en) supplier.name.en = name.en;
            if (name.fr) supplier.name.fr = name.fr;
        }
        if (phone) supplier.phone = phone;
        if (email !== undefined) supplier.email = email || '';
        if (address) {
            if (address.ar !== undefined) supplier.address.ar = address.ar;
            if (address.en !== undefined) supplier.address.en = address.en;
            if (address.fr !== undefined) supplier.address.fr = address.fr;
        }
        if (isActive !== undefined) supplier.isActive = isActive;

        supplier.updatedAt = new Date();
        await supplier.save();

        res.json({
            success: true,
            message: '✅ تم تحديث المورد بنجاح',
            supplier: {
                ...supplier._doc,
                name: supplier.getName(lang),
                address: supplier.getAddress(lang)
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث المورد:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ حذف مورد
const deleteSupplier = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: '❌ المورد غير موجود'
            });
        }

        await supplier.deleteOne();

        res.json({
            success: true,
            message: '✅ تم حذف المورد بنجاح'
        });
    } catch (error) {
        console.error('❌ خطأ في حذف المورد:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

module.exports = {
    createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier
};
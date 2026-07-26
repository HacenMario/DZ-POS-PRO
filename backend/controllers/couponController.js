const Coupon = require('../models/Coupon');
const { getTranslation } = require('../config/i18n');

// ✅ إنشاء كوبون جديد
const createCoupon = async (req, res) => {
    try {
        const {
            code, type, value, minOrder, maxDiscount,
            validFrom, validUntil, usageLimit, description
        } = req.body;
        const lang = req.lang || 'ar';

        if (!code || !type || !value || !validFrom || !validUntil) {
            return res.status(400).json({
                success: false,
                message: getTranslation('missingFields', lang)
            });
        }

        const existing = await Coupon.findOne({ code: code.toUpperCase() });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: '❌ هذا الكود مسجل مسبقاً'
            });
        }

        const coupon = new Coupon({
            code: code.toUpperCase(),
            type,
            value,
            minOrder: minOrder || 0,
            maxDiscount: maxDiscount || 0,
            validFrom: new Date(validFrom),
            validUntil: new Date(validUntil),
            usageLimit: usageLimit || 1,
            description: {
                ar: description?.ar || '',
                en: description?.en || '',
                fr: description?.fr || ''
            },
            createdBy: req.userId
        });

        await coupon.save();

        res.status(201).json({
            success: true,
            message: '✅ تم إنشاء الكوبون بنجاح',
            coupon
        });
    } catch (error) {
        console.error('❌ خطأ في إنشاء الكوبون:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ جلب جميع الكوبونات
const getCoupons = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const coupons = await Coupon.find().sort({ createdAt: -1 });

        const formatted = coupons.map(c => ({
            ...c._doc,
            description: c.description[lang] || c.description.ar
        }));

        res.json({
            success: true,
            coupons: formatted
        });
    } catch (error) {
        console.error('❌ خطأ في جلب الكوبونات:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ التحقق من صلاحية الكوبون
const validateCoupon = async (req, res) => {
    try {
        const { code, total } = req.body;
        const lang = req.lang || 'ar';

        if (!code) {
            return res.status(400).json({
                success: false,
                message: getTranslation('missingFields', lang)
            });
        }

        const coupon = await Coupon.findOne({
            code: code.toUpperCase(),
            isActive: true
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: '❌ كوبون غير صالح'
            });
        }

        const now = new Date();
        if (now < coupon.validFrom || now > coupon.validUntil) {
            return res.status(400).json({
                success: false,
                message: '❌ انتهت صلاحية الكوبون'
            });
        }

        if (coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                message: '❌ تم استخدام الكوبون بالكامل'
            });
        }

        if (total < coupon.minOrder) {
            return res.status(400).json({
                success: false,
                message: `❌ الحد الأدنى للطلب هو ${coupon.minOrder} دج`
            });
        }

        let discount = 0;
        if (coupon.type === 'percentage') {
            discount = (total * coupon.value) / 100;
            if (coupon.maxDiscount > 0) {
                discount = Math.min(discount, coupon.maxDiscount);
            }
        } else {
            discount = coupon.value;
        }

        res.json({
            success: true,
            coupon: {
                ...coupon._doc,
                description: coupon.description[lang] || coupon.description.ar
            },
            discount: Math.round(discount),
            newTotal: total - discount
        });
    } catch (error) {
        console.error('❌ خطأ في التحقق من الكوبون:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ حذف كوبون
const deleteCoupon = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: '❌ الكوبون غير موجود'
            });
        }

        await coupon.deleteOne();

        res.json({
            success: true,
            message: '✅ تم حذف الكوبون بنجاح'
        });
    } catch (error) {
        console.error('❌ خطأ في حذف الكوبون:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

module.exports = {
    createCoupon,
    getCoupons,
    validateCoupon,
    deleteCoupon
};
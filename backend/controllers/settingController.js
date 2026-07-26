const Setting = require('../models/Setting');
const { getTranslation } = require('../config/i18n');

// ✅ جلب الإعدادات (مستند واحد)
const getSettings = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        let setting = await Setting.findOne();
        if (!setting) {
            // إنشاء مستند افتراضي مع الحقول الجديدة
            setting = new Setting({
                storeName: 'SPEEDY',
                currency: 'دج',
                language: 'ar',
                theme: 'light',
                lowStockThreshold: 5,
                enableNotifications: true,
                invoicePrefix: 'INV-',
                raisonSociale: 'TERKMANI KHALED',
                adresse: '15 RN 11 LOC 03 RDC AIN BENIAN ALGER',
                rc: '16/00-4973523 A22',
                nif: '19216570015717061600',
                nis: '199216440015727',
                art: '16570211332',
            });
            await setting.save();
        }

        const settingObj = setting.toObject ? setting.toObject() : setting;
        res.json({
            success: true,
            data: settingObj
        });
    } catch (error) {
        console.error('❌ خطأ في جلب الإعدادات:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ تحديث الإعدادات (كائن واحد)
const updateSetting = async (req, res) => {
    try {
        const updates = req.body;
        const lang = req.lang || 'ar';

        // حذف الحقول المحمية
        delete updates._id;
        delete updates.__v;
        delete updates.createdAt;
        delete updates.updatedAt;

        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'لا توجد بيانات للتحديث'
            });
        }

        // تحديث أو إنشاء مستند الإعدادات
        const setting = await Setting.findOneAndUpdate(
            {},
            { $set: updates },
            {
                new: true,
                upsert: true,
                runValidators: false
            }
        );

        res.json({
            success: true,
            message: 'تم حفظ الإعدادات بنجاح',
            data: setting
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث الإعدادات:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'خطأ في الخادم'
        });
    }
};

module.exports = {
    getSettings,
    updateSetting
};
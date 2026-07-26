const User = require('../models/User');
const { getTranslation } = require('../config/i18n');

// ✅ جلب جميع المستخدمين (Admin فقط)
const getUsers = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('❌ خطأ في جلب المستخدمين:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ جلب مستخدم واحد
const getUserById = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: getTranslation('userNotFound', lang)
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error('❌ خطأ في جلب المستخدم:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ تحديث مستخدم (Admin فقط)
const updateUser = async (req, res) => {
    try {
        const { name, phone, role, isActive, settings } = req.body;
        const lang = req.lang || 'ar';

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: getTranslation('userNotFound', lang)
            });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (role) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;
        if (settings) user.settings = { ...user.settings, ...settings };

        user.updatedAt = new Date();
        await user.save();

        res.json({
            success: true,
            message: getTranslation('userUpdated', lang),
            user: {
                ...user._doc,
                password: undefined
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث المستخدم:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ حذف مستخدم (Admin فقط)
const deleteUser = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: getTranslation('userNotFound', lang)
            });
        }

        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: '❌ لا يمكن حذف حساب المدير الرئيسي'
            });
        }

        await user.deleteOne();

        res.json({
            success: true,
            message: getTranslation('userDeleted', lang)
        });
    } catch (error) {
        console.error('❌ خطأ في حذف المستخدم:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};
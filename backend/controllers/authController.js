const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { getTranslation } = require('../config/i18n');

// ✅ تسجيل الدخول
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const lang = req.lang || 'ar';

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: getTranslation('missingFields', lang)
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: getTranslation('loginFailed', lang)
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: getTranslation('loginFailed', lang)
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: getTranslation('accountDisabled', lang)
            });
        }

        user.lastLogin = new Date();
        await user.save();

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: getTranslation('loginSuccess', lang),
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                settings: user.settings,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تسجيل الدخول:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ تسجيل مستخدم جديد (Admin فقط)
const register = async (req, res) => {
    try {
        const { name, email, password, phone, role, settings } = req.body;
        const lang = req.lang || 'ar';

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: getTranslation('missingFields', lang)
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: getTranslation('emailExists', lang)
            });
        }

        const user = new User({
            name,
            email: email.toLowerCase(),
            password,
            phone: phone || '',
            role: role || 'cashier',
            settings: settings || { theme: 'light', lang: 'ar' }
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: getTranslation('userCreated', lang),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('❌ خطأ في التسجيل:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ جلب بيانات المستخدم الحالي
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        const lang = req.lang || 'ar';

        if (!user) {
            return res.status(404).json({
                success: false,
                message: getTranslation('userNotFound', lang)
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                settings: user.settings
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب بيانات المستخدم:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ تحديث بيانات المستخدم
const updateProfile = async (req, res) => {
    try {
        const { name, phone, settings } = req.body;
        const lang = req.lang || 'ar';

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: getTranslation('userNotFound', lang)
            });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (settings) user.settings = { ...user.settings, ...settings };
        user.updatedAt = new Date();

        await user.save();

        res.json({
            success: true,
            message: getTranslation('userUpdated', lang),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                settings: user.settings
            }
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث الملف الشخصي:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ تغيير كلمة المرور
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const lang = req.lang || 'ar';

        if (!oldPassword || !newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: getTranslation('passwordTooShort', lang)
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: getTranslation('userNotFound', lang)
            });
        }

        const isMatch = await user.comparePassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: getTranslation('passwordMismatch', lang)
            });
        }

        user.password = newPassword;
        user.updatedAt = new Date();
        await user.save();

        res.json({
            success: true,
            message: getTranslation('passwordChanged', lang)
        });
    } catch (error) {
        console.error('❌ خطأ في تغيير كلمة المرور:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

module.exports = {
    login,
    register,
    getMe,
    updateProfile,
    changePassword
};
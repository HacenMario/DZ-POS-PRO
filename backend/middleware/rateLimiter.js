const rateLimit = require('express-rate-limit');

// ✅ تحديد معدل الطلبات لتسجيل الدخول (5 محاولات فقط كل 15 دقيقة)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 5, // الحد الأقصى 5 محاولات
    message: {
        success: false,
        message: '❌ لقد تجاوزت الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة.'
    },
    standardHeaders: true, // إرجاع معلومات الـ RateLimit في الـ Headers
    legacyHeaders: false,
});

// ✅ تحديد معدل عام للطلبات (100 طلب لكل دقيقة للـ API العادي)
const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 دقيقة
    max: 100,
    message: {
        success: false,
        message: '❌ عدد الطلبات كبير جداً، يرجى التهدئة.'
    },
});

module.exports = {
    loginLimiter,
    generalLimiter
};
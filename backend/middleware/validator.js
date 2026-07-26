const { validationResult, body, param } = require('express-validator');

// ✅ دالة الوسيطة للتحقق من وجود أخطاء في الطلب
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: '❌ بيانات غير صالحة',
            errors: errors.array().map(err => err.msg)
        });
    }
    next();
};

// ✅ قواعد التحقق لتسجيل الدخول
const loginValidation = [
    body('email')
        .notEmpty().withMessage('البريد الإلكتروني مطلوب')
        .isEmail().withMessage('صيغة البريد الإلكتروني غير صحيحة'),
    body('password')
        .notEmpty().withMessage('كلمة المرور مطلوبة')
        .isLength({ min: 6 }).withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
    validate
];

// ✅ قواعد التحقق لإنشاء منتج جديد
const productValidation = [
    body('name.ar')
        .notEmpty().withMessage('الاسم بالعربية مطلوب'),
    body('name.en')
        .notEmpty().withMessage('الاسم بالإنجليزية مطلوب'),
    body('name.fr')
        .notEmpty().withMessage('الاسم بالفرنسية مطلوب'),
    body('price')
        .isNumeric().withMessage('السعر يجب أن يكون رقماً')
        .isFloat({ min: 0 }).withMessage('السعر لا يمكن أن يكون سالباً'),
    body('stock')
        .optional()
        .isInt({ min: 0 }).withMessage('المخزون يجب أن يكون عدداً صحيحاً غير سالب'),
    validate
];

// ✅ قواعد التحقق لمعرف (ID) في الـ URL
const idValidation = [
    param('id')
        .isMongoId().withMessage('المعرف (ID) غير صالح'),
    validate
];

module.exports = {
    validate,
    loginValidation,
    productValidation,
    idValidation,
    // يمكنك إضافة المزيد من القواعد هنا (مثل customerValidation, saleValidation...)
};

// backend/models/Session.js
const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    // ✅ ربط الجلسة بالمستخدم (الكاشير)
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, default: 'cashier' },

    // ✅ الرصيد الافتتاحي والختامي
    openingBalance: { type: Number, default: 0, min: 0 },
    closingBalance: { type: Number, default: 0, min: 0 },

    // ✅ الإحصائيات المحسوبة تلقائياً عند الإغلاق
    totalSales: { type: Number, default: 0 },           // إجمالي المبيعات (قيمة الفواتير)
    totalDiscount: { type: Number, default: 0 },        // إجمالي الخصومات
    totalTax: { type: Number, default: 0 },             // إجمالي الضرائب
    saleCount: { type: Number, default: 0 },            // عدد الفواتير

    // ✅ تفاصيل طرق الدفع
    cashSales: { type: Number, default: 0 },            // إجمالي المدفوعات النقدية
    cardSales: { type: Number, default: 0 },            // إجمالي المدفوعات بالبطاقة
    transferSales: { type: Number, default: 0 },        // إجمالي التحويلات

    // ✅ الفروق (الرصيد المتوقع مقابل الفعلي)
    expectedCash: { type: Number, default: 0 },         // المتوقع = openingBalance + cashSales
    actualCash: { type: Number, default: 0 },           // الفعلي (يدخل عند الإغلاق)
    difference: { type: Number, default: 0 },           // الفرق (actualCash - expectedCash)

    // ✅ الحالة والوقت
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date },

    // ✅ ملاحظات (اختياري)
    notes: { type: String, default: '' }
}, {
    timestamps: true
});

// ✅ فهرس للبحث السريع
SessionSchema.index({ user: 1, status: 1 });
SessionSchema.index({ openedAt: -1 });

module.exports = mongoose.model('Session', SessionSchema);
// backend/controllers/sessionController.js
const Session = require('../models/Session');
const Sale = require('../models/Sale');
const { getTranslation } = require('../config/i18n');

// ========================================
// 1. فتح جلسة جديدة
// ========================================
const openSession = async (req, res) => {
    try {
        const { openingBalance = 0, notes = '' } = req.body;
        const lang = req.lang || 'ar';

        // التحقق من وجود جلسة مفتوحة لنفس المستخدم
        const existing = await Session.findOne({ user: req.userId, status: 'open' });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: '❌ لديك جلسة مفتوحة بالفعل. يجب إغلاقها أولاً.'
            });
        }

        // جلب آخر جلسة مغلقة لعرض إحصائياتها (للتطوير المستقبلي)
        const lastSession = await Session.findOne({ user: req.userId, status: 'closed' })
            .sort({ closedAt: -1 });

        const session = new Session({
            user: req.userId,
            userName: req.user.name || 'كاشير',
            userRole: req.user.role || 'cashier',
            openingBalance: parseFloat(openingBalance) || 0,
            status: 'open',
            notes: notes || '',
            openedAt: new Date()
        });

        await session.save();

        res.status(201).json({
            success: true,
            message: getTranslation('sessionOpened', lang) || '✅ تم فتح الجلسة بنجاح',
            session: {
                ...session._doc,
                lastSession: lastSession ? {
                    closedAt: lastSession.closedAt,
                    totalSales: lastSession.totalSales,
                    closingBalance: lastSession.closingBalance,
                    saleCount: lastSession.saleCount
                } : null
            }
        });
    } catch (error) {
        console.error('❌ خطأ في فتح الجلسة:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// 2. جلب الجلسة الحالية (المفتوحة)
// ========================================
const getCurrentSession = async (req, res) => {
    try {
        const session = await Session.findOne({ user: req.userId, status: 'open' })
            .populate('user', 'name email');

        // جلب إحصائيات فورية للجلسة المفتوحة
        let stats = null;
        if (session) {
            const sales = await Sale.find({ session: session._id, status: 'paid' });
            const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
            const totalDiscount = sales.reduce((sum, s) => sum + (s.discount || 0), 0);
            const saleCount = sales.length;
            const cashSales = sales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
            const cardSales = sales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0);
            const transferSales = sales.filter(s => s.paymentMethod === 'transfer').reduce((sum, s) => sum + s.total, 0);

            stats = {
                totalSales,
                totalDiscount,
                saleCount,
                cashSales,
                cardSales,
                transferSales,
                expectedCash: (session.openingBalance || 0) + cashSales
            };
        }

        res.json({
            success: true,
            session: session || null,
            stats: stats || null
        });
    } catch (error) {
        console.error('❌ خطأ في جلب الجلسة:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// 3. إغلاق الجلسة (مع الحسابات التلقائية)
// ========================================
const closeSession = async (req, res) => {
    try {
        const { actualCash = 0, notes = '' } = req.body;
        const lang = req.lang || 'ar';

        const session = await Session.findOne({ user: req.userId, status: 'open' });
        if (!session) {
            return res.status(404).json({
                success: false,
                message: '❌ لا توجد جلسة مفتوحة لإغلاقها'
            });
        }

        // جلب جميع مبيعات هذه الجلسة
        const sales = await Sale.find({ session: session._id, status: 'paid' });

        // حساب الإحصائيات
        const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
        const totalDiscount = sales.reduce((sum, s) => sum + (s.discount || 0), 0);
        const totalTax = sales.reduce((sum, s) => sum + (s.tax || 0), 0);
        const saleCount = sales.length;

        // تفاصيل المدفوعات
        const cashSales = sales.filter(s => s.paymentMethod === 'cash').reduce((sum, s) => sum + s.total, 0);
        const cardSales = sales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0);
        const transferSales = sales.filter(s => s.paymentMethod === 'transfer').reduce((sum, s) => sum + s.total, 0);

        // الرصيد المتوقع = الرصيد الافتتاحي + المبيعات النقدية
        const expectedCash = (session.openingBalance || 0) + cashSales;
        const difference = parseFloat(actualCash) - expectedCash;

        // تحديث الجلسة
        session.closingBalance = totalSales;
        session.totalSales = totalSales;
        session.totalDiscount = totalDiscount;
        session.totalTax = totalTax;
        session.saleCount = saleCount;
        session.cashSales = cashSales;
        session.cardSales = cardSales;
        session.transferSales = transferSales;
        session.expectedCash = expectedCash;
        session.actualCash = parseFloat(actualCash) || 0;
        session.difference = difference;
        session.status = 'closed';
        session.closedAt = new Date();
        session.notes = notes || session.notes || '';

        await session.save();

        res.json({
            success: true,
            message: '✅ تم إغلاق الجلسة بنجاح',
            session: {
                ...session._doc,
                summary: {
                    totalSales,
                    totalDiscount,
                    saleCount,
                    cashSales,
                    cardSales,
                    transferSales,
                    expectedCash,
                    actualCash: parseFloat(actualCash) || 0,
                    difference
                }
            }
        });
    } catch (error) {
        console.error('❌ خطأ في إغلاق الجلسة:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// 4. تاريخ الجلسات (للمدير والمراقب)
// ========================================
const getSessionsHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20, userId } = req.query;
        const filter = {};
        if (userId) filter.user = userId;

        const sessions = await Session.find(filter)
            .populate('user', 'name email')
            .sort({ closedAt: -1, openedAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Session.countDocuments(filter);

        res.json({
            success: true,
            sessions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب تاريخ الجلسات:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// 5. ✅ تصدير الدوال
// ========================================
module.exports = {
    openSession,
    getCurrentSession,
    closeSession,
    getSessionsHistory
};
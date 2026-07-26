require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { getTranslation } = require('./config/i18n');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 5000;

// ✅ الاتصال بقاعدة البيانات
connectDB();

// ✅ Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization']
}));

// معالجة صريحة لطلبات OPTIONS لجميع المسارات
app.options('*', cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ خدمة الملفات الثابتة من مجلد frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ✅ جعل جميع الطلبات غير المطابقة للـ API تعيد index.html (للمسارات الافتراضية)
app.get('*', (req, res, next) => {
    // تجاهل طلبات الـ API
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ✅ استخراج اللغة
app.use((req, res, next) => {
    req.lang = req.headers['accept-language']?.split(',')[0]?.slice(0, 2) || 'ar';
    if (!['ar', 'en', 'fr'].includes(req.lang)) req.lang = 'ar';
    next();
});

// ✅ مسار الترحيب
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: getTranslation('welcome', req.lang || 'ar'),
        version: '1.0.0',
        status: 'online',
        time: new Date().toISOString()
    });
});

// ✅ مسارات API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/returns', require('./routes/returns'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/sessions', require('./routes/sessions'));

// ✅ مسار 404
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: getTranslation('notFound', req.lang || 'ar')
    });
});

// ✅ معالج الأخطاء
app.use((err, req, res, next) => {
    console.error('❌ خطأ في الخادم:', err.message);
    res.status(500).json({
        success: false,
        message: getTranslation('serverError', req.lang || 'ar'),
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// في server.js، بعد تعريف app وقبل تشغيل الخادم
const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// ✅ عند اتصال عميل جديد
io.on('connection', (socket) => {
    console.log('🟢 عميل متصل:', socket.id);

    // انضمام إلى غرفة المستخدم (لإشعاراته الخاصة)
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`📌 المستخدم ${userId} انضم إلى غرفته`);
    });

    socket.on('disconnect', () => {
        console.log('🔴 عميل غير متصل:', socket.id);
    });
});

// ✅ دالة لإرسال إشعار لمستخدم معين
global.sendNotification = (userId, notification) => {
    io.to(`user_${userId}`).emit('notification', notification);
};

// ✅ دالة لإرسال إشعار عام (لجميع المستخدمين)
global.broadcastNotification = (notification) => {
    io.emit('notification', notification);
};

// ✅ تشغيل الخادم

server.listen(PORT, () => {
    console.log(`🚀 DZ POS PRO يعمل على http://localhost:${PORT}`);
    console.log(`📡 الوضع: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔌 Socket.io يعمل على نفس المنفذ`);
    console.log(`🌐 اللغات المدعومة: العربية، الإنجليزية، الفرنسية`);
    console.log(`✅ جميع الوحدات متاحة: المنتجات، الفئات، العملاء، المبيعات، التقارير، المستخدمين، الإعدادات، الكوبونات، الموردين، الإرجاع، المخزون`);
});
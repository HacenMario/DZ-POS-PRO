const fs = require('fs');
const path = require('path');

// ✅ إنشاء مجلد logs إذا لم يكن موجوداً
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// ✅ دالة لكتابة السجلات في ملف
const writeLog = (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        data: data || undefined
    };

    // طباعة في الكونسول (للمطور)
    const consoleMsg = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (level === 'error') {
        console.error(consoleMsg, data || '');
    } else {
        console.log(consoleMsg, data || '');
    }

    // حفظ في ملف (حسب نوع الخطأ)
    const fileName = level === 'error' ? 'error.log' : 'combined.log';
    const logFilePath = path.join(logsDir, fileName);
    
    // إضافة السطر الجديد مع الاحتفاظ بالسجلات القديمة
    fs.appendFile(
        logFilePath,
        JSON.stringify(logEntry) + '\n',
        (err) => {
            if (err) console.error('❌ فشل كتابة السجل في الملف:', err);
        }
    );
};

// ✅ أدوات مساعدة للطباعة
const logger = {
    info: (message, data) => writeLog('info', message, data),
    warn: (message, data) => writeLog('warn', message, data),
    error: (message, data) => writeLog('error', message, data),
    debug: (message, data) => {
        if (process.env.NODE_ENV === 'development') {
            writeLog('debug', message, data);
        }
    }
};

module.exports = logger;

// frontend/js/socket.js

import API_BASE_URL from './config.js';

let socket = null;

function initSocket() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.id) return;

    // ✅ استخدم API_BASE_URL بدلاً من localhost:3001
    socket = io(API_BASE_URL, {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('🟢 متصل بـ Socket.io');
        // الانضمام إلى غرفة المستخدم
        socket.emit('join', user.id);
    });

    socket.on('notification', (notification) => {
        console.log('📨 إشعار:', notification);
        // عرض الإشعار كـ Toast
        if (notification.type === 'success') {
            Toast.success(notification.message, notification.title || '✅');
        } else if (notification.type === 'error') {
            Toast.error(notification.message, notification.title || '❌');
        } else if (notification.type === 'warning') {
            Toast.warning(notification.message, notification.title || '⚠️');
        } else {
            Toast.info(notification.message, notification.title || 'ℹ️');
        }
    });

    socket.on('disconnect', () => {
        console.log('🔴 غير متصل بـ Socket.io');
    });

    return socket;
}

// ✅ إرسال إشعار (في أي مكان)
function sendNotification(userId, notification) {
    if (socket) {
        socket.emit('send-notification', { userId, notification });
    }
}

// تصدير الدوال
window.socket = socket;
window.initSocket = initSocket;
window.sendNotification = sendNotification;

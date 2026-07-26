// frontend/js/socket.js

import API_BASE_URL from './config.js';

let socket = null;

export function initSocket() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.id) {
        console.warn('⚠️ لا يوجد توكن أو مستخدم، تأخر الاتصال بـ Socket.io');
        return null;
    }

    try {
        socket = io(API_BASE_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socket.on('connect', () => {
            console.log('🟢 متصل بـ Socket.io على:', API_BASE_URL);
            socket.emit('join', user.id);
        });

        socket.on('notification', (notification) => {
            console.log('📨 إشعار:', notification);
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

        socket.on('connect_error', (error) => {
            console.error('❌ خطأ في الاتصال بـ Socket.io:', error);
        });

        socket.on('disconnect', () => {
            console.log('🔴 غير متصل بـ Socket.io');
        });

        return socket;
    } catch (error) {
        console.error('❌ فشل إنشاء اتصال Socket.io:', error);
        return null;
    }
}

export function getSocket() {
    return socket;
}

export function sendNotification(userId, notification) {
    if (socket && socket.connected) {
        socket.emit('send-notification', { userId, notification });
    } else {
        console.warn('⚠️ Socket غير متصل، لا يمكن إرسال الإشعار');
    }
}

// تصدير دالة initSocket للنطاق العام (للوصول من console)
window.initSocket = initSocket;
window.sendNotification = sendNotification;

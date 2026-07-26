// frontend/js/socket.js

import API_BASE_URL from './config.js';

let socket = null;

export function initSocket() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user.id) return;

    socket = io(API_BASE_URL, {
        auth: { token }
    });

    socket.on('connect', () => {
        console.log('🟢 متصل بـ Socket.io');
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

    socket.on('disconnect', () => {
        console.log('🔴 غير متصل بـ Socket.io');
    });

    return socket;
}

export function sendNotification(userId, notification) {
    if (socket) {
        socket.emit('send-notification', { userId, notification });
    }
}

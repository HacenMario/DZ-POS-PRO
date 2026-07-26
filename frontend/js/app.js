// frontend/js/app.js

import API_BASE_URL from './config.js';

// ========================================
// مراقبة حالة الاتصال (عبر الإنترنت/غير متصل)
// ========================================
window.addEventListener('online', () => {
    const banner = document.getElementById('offlineBanner');
    if (banner) banner.classList.remove('show');
    // محاولة مزامنة البيانات المعلقة
    if (window.syncPendingSales) window.syncPendingSales();
});
window.addEventListener('offline', () => {
    const banner = document.getElementById('offlineBanner');
    if (banner) banner.classList.add('show');
});

// ========================================
// دالة تبديل الثيم (الوضع الليلي والنهاري)
// ========================================
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) {
        btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

// ========================================
// تهيئة الصفحة بعد تحميل الـ DOM
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    // ---------- 1. استعادة الثيم المخزن ----------
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    // ---------- 2. استعادة اللغة المخزنة ----------
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = localStorage.getItem('lang') || 'ar';
        langSelect.addEventListener('change', function () {
            // setLanguage معرفة في ملف i18n.js
            if (typeof setLanguage === 'function') {
                setLanguage(this.value);
            }
        });
    }

    // ---------- 3. زر تبديل الثيم ----------
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', function () {
            const current = document.documentElement.getAttribute('data-theme');
            const nextTheme = current === 'dark' ? 'light' : 'dark';
            setTheme(nextTheme);
        });
    }

    // ---------- 4. نموذج تسجيل الدخول (المستمع الوحيد) ----------
    const loginForm = document.getElementById('loginForm');
    const statusMsg = document.getElementById('statusMessage');

    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault(); // منع إعادة تحميل الصفحة

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value.trim();

            if (statusMsg) {
                statusMsg.textContent = '⏳ جاري التحقق...';
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));

                    if (statusMsg) {
                        statusMsg.textContent = '✅ تم تسجيل الدخول! جاري التوجيه...';
                    }

                    window.location.href = 'dashboard.html';
                } else {
                    if (statusMsg) {
                        statusMsg.textContent = '❌ ' + (data.message || 'فشل تسجيل الدخول');
                    }
                }
            } catch (error) {
                console.error('❌ خطأ في الاتصال:', error);
                if (statusMsg) {
                    statusMsg.textContent = '❌ لا يمكن الاتصال بالخادم. تأكد من تشغيل الخادم (npm run dev)';
                }
            }
        });
    }
});

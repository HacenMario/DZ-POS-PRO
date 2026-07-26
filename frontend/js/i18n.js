const translations = {};
let currentLang = localStorage.getItem('lang') || 'ar';

async function loadLanguage(lang) {
    try {
        const res = await fetch(`/lang/${lang}.json`);
        const data = await res.json();
        translations[lang] = data;
        return data;
    } catch { console.error('فشل تحميل اللغة'); return {}; }
}

function applyLanguage(lang) {
    const data = translations[lang];
    if (!data) return;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (data[key] !== undefined) el.textContent = data[key];
    });
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('lang', lang);
}

async function initI18n() {
    await loadLanguage(currentLang);
    applyLanguage(currentLang);
}
initI18n();

// ✅ دالة تغيير اللغة (تطبق التغيير دون إعادة تحميل الصفحة)
function setLanguage(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    loadLanguage(lang).then(() => {
        applyLanguage(lang);
        // تحديث واجهة المستخدم إذا كانت الصفحة الحالية تتطلب ذلك
        if (window.currentPage) {
            // إذا كانت هناك دالة لتحديث المحتوى حسب اللغة، استدعها هنا
            // على سبيل المثال: reloadCurrentPage();
        }
    });
}

// دالة للحصول على ترجمة مفتاح معين
function t(key) {
    const lang = localStorage.getItem('lang') || 'ar';
    return translations[lang]?.[key] || key;
}
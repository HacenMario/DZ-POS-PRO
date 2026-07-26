// modules/settings.js
const token = localStorage.getItem('token');

export async function renderSettingsPage() {
    const content = document.getElementById('pageContent');
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};

    let settings = {};
    try {
        const res = await fetch('/api/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
            settings = data.data;
        }
    } catch (e) {
        console.error('❌ فشل جلب الإعدادات:', e);
    }

    content.innerHTML = `
        <div class="settings-container">
            <h3>${trans.settings || 'الإعدادات'}</h3>
            <form id="settingsForm">
                <div class="form-group">
                    <label>${trans.storeName || 'اسم المتجر'}</label>
                    <input type="text" id="storeName" value="${settings.storeName || ''}" />
                </div>
                <div class="form-group">
                    <label>${trans.currency || 'العملة'}</label>
                    <input type="text" id="currency" value="${settings.currency || ''}" />
                </div>
                <div class="form-group">
                    <label>${trans.taxRate || 'نسبة الضريبة (%)'}</label>
                    <input type="number" id="taxRate" value="${settings.taxRate || 0}" step="0.1" />
                </div>
                <button type="submit" class="btn-primary">💾 ${trans.save || 'حفظ'}</button>
            </form>
            <div id="settingsStatus" style="margin-top: 10px;"></div>
        </div>
    `;

    document.getElementById('settingsForm').onsubmit = async (e) => {
        e.preventDefault();
        const status = document.getElementById('settingsStatus');

        const data = {
            storeName: document.getElementById('storeName').value.trim(),
            currency: document.getElementById('currency').value.trim(),
            taxRate: parseFloat(document.getElementById('taxRate').value) || 0
        };

        try {
            status.textContent = '⏳ جاري الحفظ...';
            status.style.color = 'blue';

            const res = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (result.success && result.data) {
                status.textContent = '✅ ' + (trans.settingsSaved || 'تم حفظ الإعدادات بنجاح');
                status.style.color = 'green';

                // 🔥 تحديث الحقول بالقيم الجديدة من الخادم
                document.getElementById('storeName').value = result.data.storeName || '';
                document.getElementById('currency').value = result.data.currency || '';
                document.getElementById('taxRate').value = result.data.taxRate || 0;
            } else {
                status.textContent = '❌ ' + (result.message || 'فشل الحفظ');
                status.style.color = 'red';
            }
        } catch (error) {
            console.error('❌ خطأ في الحفظ:', error);
            status.textContent = '❌ خطأ في الاتصال بالخادم';
            status.style.color = 'red';
        }
    };
}
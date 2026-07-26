// modules/dashboard.js
const token = localStorage.getItem('token');

export async function fetchDashboardStats() {
    try {
        const res = await fetch('https://dz-pos-pro.onrender.com/api/reports/dashboard-stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const content = document.getElementById('pageContent');
        const lang = localStorage.getItem('lang') || 'ar';
        const trans = translations[lang] || {};

        if (data.success) {
            const stats = data.data;
            content.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-icon">📦</div><div><h3>${stats.totalProducts}</h3><p>${trans.totalProducts || 'إجمالي المنتجات'}</p></div></div>
                    <div class="stat-card"><div class="stat-icon">👥</div><div><h3>${stats.totalCustomers}</h3><p>${trans.totalCustomers || 'إجمالي العملاء'}</p></div></div>
                    <div class="stat-card"><div class="stat-icon">🧾</div><div><h3>${stats.totalSalesToday}</h3><p>${trans.salesToday || 'مبيعات اليوم'}</p></div></div>
                    <div class="stat-card"><div class="stat-icon">💰</div><div><h3>${stats.totalRevenueToday} دج</h3><p>${trans.revenueToday || 'إيرادات اليوم'}</p></div></div>
                </div>
                <div class="low-stock-section">
                    <h3>⚠️ ${trans.lowStockAlert || 'تنبيه المخزون المنخفض'}</h3>
                    <ul class="stock-list">
                        ${stats.lowStockProducts.length === 0 
                            ? `<li>✅ ${trans.allStockOk || 'جميع المنتجات متوفرة'}</li>`
                            : stats.lowStockProducts.map(p => `<li><span>${p.name}</span> <span class="danger">${trans.remaining || 'المتبقي'}: ${p.stock}</span></li>`).join('')}
                    </ul>
                </div>
            `;
        } else {
            content.innerHTML = `<p style="color:red;">❌ فشل التحميل: ${data.message}</p>`;
        }
    } catch (error) {
        document.getElementById('pageContent').innerHTML = `<p style="color:red;">❌ لا يمكن الاتصال بالخادم</p>`;
    }
}

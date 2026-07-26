// modules/reports.js - صفحة التقارير مع الرسوم البيانية
// ✅ استخدام token من النطاق العام أو localStorage
const token = window.token || localStorage.getItem('token');
let chartInstance = null;

export async function renderReportsPage() {
    const content = document.getElementById('pageContent');
    if (!content) return;

    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};

    content.innerHTML = `
        <div class="reports-container">
            <div class="reports-header">
                <h3>📊 ${trans.reports || 'التقارير'}</h3>
                <div class="period-selector">
                    <button class="period-btn active" data-period="week">${trans.week || 'أسبوع'}</button>
                    <button class="period-btn" data-period="month">${trans.month || 'شهر'}</button>
                    <button class="period-btn" data-period="year">${trans.year || 'سنة'}</button>
                </div>
            </div>
            <div class="chart-container">
                <canvas id="salesChart"></canvas>
            </div>
            <div class="reports-grid" id="reportsStats">
                <div class="report-card">
                    <h3>📊 ${trans.dailySales || 'مبيعات اليوم'}</h3>
                    <p id="dailyCount">0</p>
                    <p id="dailyRevenue">0 دج</p>
                </div>
                <div class="report-card">
                    <h3>🏆 ${trans.topProducts || 'الأكثر مبيعاً'}</h3>
                    <ul id="topProductsList"><li>جاري التحميل...</li></ul>
                </div>
                <div class="report-card">
                    <h3>👑 ${trans.topCustomers || 'أفضل العملاء'}</h3>
                    <ul id="topCustomersList"><li>جاري التحميل...</li></ul>
                </div>
                <div class="report-card">
                    <h3>⚠️ ${trans.lowStock || 'مخزون منخفض'}</h3>
                    <ul id="lowStockList"><li>جاري التحميل...</li></ul>
                </div>
            </div>
        </div>
    `;

    // تحميل البيانات بعد التأكد من وجود العناصر
    setTimeout(() => {
        loadReports('week');
    }, 150);

    // أحداث اختيار الفترة
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadReports(this.dataset.period);
        });
    });
}

// ========================================
// تحميل جميع التقارير
// ========================================
async function loadReports(period) {
    try {
        // 1. جلب بيانات الرسم البياني
        const chartRes = await fetch(`https://dz-pos-pro.onrender.com/api/reports/chart-data?period=${period}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const chartData = await chartRes.json();

        if (chartData.success) {
            renderChart(chartData.data);
        }

        // 2. جلب التقارير الأخرى
        const [daily, topP, topC, low] = await Promise.all([
            fetch('https://dz-pos-pro.onrender.com/api/reports/daily-sales', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch('https://dz-pos-pro.onrender.com/api/reports/top-products?limit=5', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch('https://dz-pos-pro.onrender.com/api/reports/top-customers?limit=5', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()),
            fetch('https://dz-pos-pro.onrender.com/api/reports/low-stock', { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json())
        ]);

        // عرض الإحصائيات
        const dailyCount = document.getElementById('dailyCount');
        const dailyRevenue = document.getElementById('dailyRevenue');
        if (dailyCount && dailyRevenue && daily.success) {
            dailyCount.textContent = daily.report.totalSales || 0;
            dailyRevenue.textContent = (daily.report.totalRevenue || 0) + ' دج';
        }

        // أفضل المنتجات
        const topList = document.getElementById('topProductsList');
        if (topList) {
            if (topP.success && topP.report.topProducts.length) {
                topList.innerHTML = topP.report.topProducts.map(p =>
                    `<li>${p.productName} (${p.quantity})</li>`
                ).join('');
            } else {
                topList.innerHTML = '<li>لا توجد بيانات</li>';
            }
        }

        // أفضل العملاء
        const custList = document.getElementById('topCustomersList');
        if (custList) {
            if (topC.success && topC.report.topCustomers.length) {
                custList.innerHTML = topC.report.topCustomers.map(c =>
                    `<li>${c.name} (${c.totalSpent || 0} دج)</li>`
                ).join('');
            } else {
                custList.innerHTML = '<li>لا توجد بيانات</li>';
            }
        }

        // المخزون المنخفض
        const lowList = document.getElementById('lowStockList');
        if (lowList) {
            if (low.success && low.report.lowStockProducts.length) {
                lowList.innerHTML = low.report.lowStockProducts.map(p =>
                    `<li>${p.name} (${p.stock})</li>`
                ).join('');
            } else {
                lowList.innerHTML = '<li>✅ كل شيء متوفر</li>';
            }
        }

    } catch (e) {
        console.error('خطأ في تحميل التقارير:', e);
    }
}

// ========================================
// رسم الرسم البياني
// ========================================
function renderChart(data) {
    const canvas = document.getElementById('salesChart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#333'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#666'
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary') || '#666'
                    }
                }
            }
        }
    });
}

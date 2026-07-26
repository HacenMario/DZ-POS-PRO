// dashboard.js - الموجه الرئيسي
const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

let currentPage = 'dashboard';

document.addEventListener('DOMContentLoaded', function() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.settings) {
        setTheme(user.settings.theme || 'light');
        if (user.settings.lang) {
            document.getElementById('langSelect').value = user.settings.lang;
            setLanguage(user.settings.lang);
        }
    }
    document.getElementById('userNameDisplay').textContent = user.name || 'ADMIN';

    // الأحداث العامة
    document.getElementById('themeToggle').addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        setTheme(current === 'dark' ? 'light' : 'dark');
    });
    document.getElementById('langSelect').addEventListener('change', (e) => {
        setLanguage(e.target.value);
        loadPage(currentPage);
    });
    document.getElementById('openSidebar').addEventListener('click', () => document.getElementById('sidebar').classList.add('open'));
    document.getElementById('closeSidebar').addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));
    document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.clear(); window.location.href = 'index.html'; });

    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page) {
                document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                loadPage(page);
            }
            document.getElementById('sidebar').classList.remove('open');
        });
    });

    loadPage('dashboard');
});

async function loadPage(page) {
    currentPage = page;
    const content = document.getElementById('pageContent');
    const title = document.getElementById('pageTitle');
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};

    const pageNames = { dashboard: 'dashboard', products: 'products', categories: 'categories', customers: 'customers', sales: 'sales', reports: 'reports', settings: 'settings' };
    const key = pageNames[page] || page;
    title.setAttribute('data-i18n', key);
    title.textContent = trans[key] || key;

    content.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><p>${trans.loading || 'جاري التحميل...'}</p></div>`;

    try {
        switch (page) {
            case 'dashboard':
                const { fetchDashboardStats } = await import('./modules/dashboard.js');
                await fetchDashboardStats();
                break;
            case 'products':
                const { renderProductsPage } = await import('./modules/products.js');
                await renderProductsPage();
                break;
            case 'categories':
                const { renderCategoriesPage } = await import('./modules/categories.js');
                await renderCategoriesPage();
                break;
            case 'customers':
                const { renderCustomersPage } = await import('./modules/customers.js');
                await renderCustomersPage();
                break;
            case 'sales':
                const { renderSalesPage } = await import('./modules/sales.js');
                await renderSalesPage();
                break;
case 'invoices':
    const { renderInvoicesPage } = await import('./modules/invoices.js');
    await renderInvoicesPage();
    break;
            case 'reports':
                const { renderReportsPage } = await import('./modules/reports.js');
                await renderReportsPage();
                break;
            case 'settings':
                const { renderSettingsPage } = await import('./modules/settings.js');
                await renderSettingsPage();
                break;
            default: content.innerHTML = '<h2>404</h2>';
        }
    } catch (e) {
        console.error('فشل تحميل الوحدة:', e);
        content.innerHTML = `<p style="color:red;">❌ فشل تحميل الصفحة: ${e.message}</p>`;
    }
}
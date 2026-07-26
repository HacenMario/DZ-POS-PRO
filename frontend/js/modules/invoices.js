// modules/invoices.js

import API_BASE_URL from '../config.js';
import { downloadInvoiceById } from './sales.js';

const token = localStorage.getItem('token');
let invoicesData = [];
let currentPage = 1;
const perPage = 10;

export async function renderInvoicesPage() {
    const content = document.getElementById('pageContent');
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};

    await fetchInvoices();

    content.innerHTML = `
        <div class="invoices-header">
            <div class="invoices-toolbar" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
                <h3 style="margin:0;">🧾 ${trans.invoices || 'الفواتير'}</h3>
                <span style="font-size:0.8rem; color:var(--text-muted); background:var(--bg-input); padding:0.2rem 0.8rem; border-radius:20px;">
                    ${invoicesData.length} ${trans.invoices || 'فاتورة'}
                </span>
            </div>
            <div id="invoicesTableContainer">${renderTable()}</div>
        </div>
    `;

    attachEvents();
}

async function fetchInvoices() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/sales?limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            invoicesData = data.sales || [];
            console.log(`🧾 تم جلب ${invoicesData.length} فاتورة`);
        } else {
            console.error('❌ فشل جلب الفواتير:', data.message);
            invoicesData = [];
        }
    } catch (e) {
        console.error('❌ خطأ في جلب الفواتير:', e);
        invoicesData = [];
    }
}

function renderTable(data = null) {
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};
    const displayData = data || invoicesData;

    if (!displayData.length) {
        return `<div class="empty-state"><p>📭 لا توجد فواتير</p></div>`;
    }

    const totalPages = Math.ceil(displayData.length / perPage);
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageData = displayData.slice(start, end);

    let html = `
        <table class="invoices-table" style="width:100%; border-collapse:collapse; background:var(--bg-card); border-radius:var(--radius); overflow:hidden; border:1px solid var(--border-color);">
            <thead>
                <tr style="background:var(--bg-body);">
                    <th style="padding:0.8rem 1rem; text-align:right; font-weight:700; border-bottom:2px solid var(--border-color);">#</th>
                    <th style="padding:0.8rem 1rem; text-align:right; font-weight:700; border-bottom:2px solid var(--border-color);">${trans.invoiceNumber || 'رقم الفاتورة'}</th>
                    <th style="padding:0.8rem 1rem; text-align:right; font-weight:700; border-bottom:2px solid var(--border-color);">${trans.date || 'التاريخ'}</th>
                    <th style="padding:0.8rem 1rem; text-align:right; font-weight:700; border-bottom:2px solid var(--border-color);">${trans.customer || 'العميل'}</th>
                    <th style="padding:0.8rem 1rem; text-align:right; font-weight:700; border-bottom:2px solid var(--border-color);">${trans.total || 'الإجمالي'}</th>
                    <th style="padding:0.8rem 1rem; text-align:right; font-weight:700; border-bottom:2px solid var(--border-color);">${trans.actions || 'إجراءات'}</th>
                </tr>
            </thead>
            <tbody>
    `;

    pageData.forEach((inv, i) => {
        const index = start + i + 1;
        const customerName = inv.customer?.displayName || inv.customer?.name?.ar || 'بدون عميل';
        const totalFormatted = inv.total ? inv.total.toFixed(2) : '0.00';
        html += `
            <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:0.7rem 1rem;">${index}</td>
                <td style="padding:0.7rem 1rem; font-weight:500;">${inv.saleNumber || '-'}</td>
                <td style="padding:0.7rem 1rem;">${new Date(inv.saleDate || inv.createdAt).toLocaleDateString('ar-DZ')}</td>
                <td style="padding:0.7rem 1rem;">${customerName}</td>
                <td style="padding:0.7rem 1rem;">${totalFormatted} دج</td>
                <td style="padding:0.7rem 1rem;">
                    <button class="btn-download-invoice" data-id="${inv._id}" style="background:none;border:none;cursor:pointer;font-size:1.2rem;padding:0.2rem 0.5rem;border-radius:6px;transition:0.2s;" title="${trans.download || 'تحميل'}">📄</button>
                    <button class="btn-print-invoice" data-id="${inv._id}" style="background:none;border:none;cursor:pointer;font-size:1.2rem;padding:0.2rem 0.5rem;border-radius:6px;transition:0.2s;" title="${trans.print || 'طباعة'}">🖨️</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;

    if (totalPages > 1) {
        html += `
            <div class="pagination" style="display:flex; gap:0.5rem; justify-content:center; align-items:center; margin-top:1.5rem; flex-wrap:wrap;">
                <button class="page-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>«</button>
                <span style="font-size:0.9rem;">${currentPage} / ${totalPages}</span>
                <button class="page-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>»</button>
            </div>
        `;
    }

    return html;
}

function attachEvents() {
    // أزرار تحميل PDF
    document.querySelectorAll('.btn-download-invoice').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            try {
                await downloadInvoiceById(id);
            } catch (e) {
                console.error('❌ فشل تحميل PDF:', e);
                alert('❌ فشل تحميل الفاتورة');
            }
        });
    });

    // أزرار الطباعة (نفس وظيفة التحميل مع تنبيه)
    document.querySelectorAll('.btn-print-invoice').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            try {
                await downloadInvoiceById(id);
                alert('✅ تم تحميل الفاتورة، يمكنك طباعتها من ملف PDF');
            } catch (e) {
                console.error('❌ فشل الطباعة:', e);
                alert('❌ فشل طباعة الفاتورة');
            }
        });
    });

    // أزرار الترقيم
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = parseInt(this.dataset.page);
            if (page > 0) {
                currentPage = page;
                const container = document.getElementById('invoicesTableContainer');
                if (container) {
                    container.innerHTML = renderTable();
                    attachEvents();
                }
            }
        });
    });
}

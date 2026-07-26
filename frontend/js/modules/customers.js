// modules/customers.js
const token = localStorage.getItem('token');

let customersData = [];
let currentPage = 1;
const perPage = 10; // عدد العملاء لكل صفحة (للترقيم الداخلي في الواجهة)

export async function renderCustomersPage() {
    const content = document.getElementById('pageContent');
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};

    // عرض مؤشر تحميل
    content.innerHTML = `<div class="loading-spinner"><div class="spinner"></div><p>${trans.loading || 'جاري التحميل...'}</p></div>`;

    await fetchAllCustomers();

    content.innerHTML = `
        <div class="customers-header">
            <div class="customers-toolbar" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-bottom:1.5rem;">
                <div style="display:flex; gap:0.5rem; align-items:center;">
                    <h3 style="margin:0;">👥 ${trans.customers || 'العملاء'}</h3>
                    <span style="font-size:0.8rem; color:var(--text-muted); background:var(--bg-input); padding:0.2rem 0.8rem; border-radius:20px;">
                        ${customersData.length} ${trans.customers || 'عميل'}
                    </span>
                </div>
                <div style="display:flex; gap:0.5rem;">
                    <button id="refreshCustomersBtn" class="btn-secondary" style="padding:0.4rem 1rem;">🔄 ${trans.refresh || 'تحديث'}</button>
                    <button id="addCustomerBtn" class="btn-primary" style="padding:0.4rem 1rem;">➕ ${trans.addCustomer || 'إضافة عميل'}</button>
                </div>
            </div>
            <div id="customersTableContainer">${renderCustomersTable()}</div>
        </div>
    `;

    // ربط الأحداث
    document.getElementById('refreshCustomersBtn')?.addEventListener('click', async () => {
        await fetchAllCustomers();
        const container = document.getElementById('customersTableContainer');
        if (container) container.innerHTML = renderCustomersTable();
        attachTableEvents();
    });

    document.getElementById('addCustomerBtn')?.addEventListener('click', () => {
        openCustomerModal();
    });

    attachTableEvents();
}

// ========================================
// جلب جميع العملاء (بدون حد)
// ========================================
async function fetchAllCustomers() {
    try {
        const res = await fetch('/api/customers?limit=1000', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            customersData = data.customers || [];
            console.log(`👥 تم جلب ${customersData.length} عميل`);
        } else {
            console.error('❌ فشل جلب العملاء:', data.message);
            customersData = [];
        }
    } catch (e) {
        console.error('❌ خطأ في جلب العملاء:', e);
        customersData = [];
    }
}

// ========================================
// عرض جدول العملاء (مع ترقيم داخلي)
// ========================================
function renderCustomersTable() {
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};

    if (!customersData.length) {
        return `<div class="empty-state"><p>📭 ${trans.noCustomers || 'لا يوجد عملاء'}</p></div>`;
    }

    // حساب الصفحات
    const totalPages = Math.ceil(customersData.length / perPage);
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageData = customersData.slice(start, end);

    let html = `
        <div style="overflow-x:auto;">
            <table class="customers-table" style="width:100%; border-collapse:collapse; background:var(--bg-card); border-radius:var(--radius); overflow:hidden; border:1px solid var(--border-color);">
                <thead>
                    <tr style="background:var(--bg-body);">
                        <th style="padding:0.8rem 1rem; text-align:right; font-weight:700; border-bottom:2px solid var(--border-color);">#</th>
                        <th style="padding:0.8rem 1rem; text-align:right; font-weight:700; border-bottom:2px solid var(--border-color);">${trans.name || 'الاسم'}</th>
                        <th style="padding:0.8rem 1rem; text-align:right; font-weight:700; border-bottom:2px solid var(--border-color);">${trans.phone || 'الهاتف'}</th>
                        <th style="padding:0.8rem 1rem; text-align:right; font-weight:700; border-bottom:2px solid var(--border-color);">${trans.email || 'البريد الإلكتروني'}</th>
                        <th style="padding:0.8rem 1rem; text-align:right; font-weight:700; border-bottom:2px solid var(--border-color);">${trans.address || 'العنوان'}</th>
                        <th style="padding:0.8rem 1rem; text-align:right; font-weight:700; border-bottom:2px solid var(--border-color);">${trans.actions || 'إجراءات'}</th>
                    </tr>
                </thead>
                <tbody>
    `;

    pageData.forEach((c, i) => {
        const index = start + i + 1;
        const name = c.displayName || c.name?.ar || c.name?.en || 'غير محدد';
        html += `
            <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:0.7rem 1rem;">${index}</td>
                <td style="padding:0.7rem 1rem; font-weight:500;">${name}</td>
                <td style="padding:0.7rem 1rem;">${c.phone || '-'}</td>
                <td style="padding:0.7rem 1rem;">${c.email || '-'}</td>
                <td style="padding:0.7rem 1rem;">${c.address || '-'}</td>
                <td style="padding:0.7rem 1rem;">
                    <button class="btn-edit-customer" data-id="${c._id}" style="background:none;border:none;cursor:pointer;font-size:1.2rem;padding:0.2rem 0.5rem;border-radius:6px;transition:0.2s;">✏️</button>
                    <button class="btn-delete-customer" data-id="${c._id}" style="background:none;border:none;cursor:pointer;font-size:1.2rem;padding:0.2rem 0.5rem;border-radius:6px;transition:0.2s;">🗑️</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;

    // إضافة أزرار الترقيم إذا كان هناك أكثر من صفحة
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

// ========================================
// ربط أحداث الجدول والترقيم
// ========================================
function attachTableEvents() {
    // أزرار التعديل
    document.querySelectorAll('.btn-edit-customer').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const customer = customersData.find(c => c._id === id);
            if (customer) openCustomerModal(customer);
        });
    });

    // أزرار الحذف
    document.querySelectorAll('.btn-delete-customer').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const customer = customersData.find(c => c._id === id);
            if (customer) deleteCustomer(customer);
        });
    });

    // أزرار الترقيم
    document.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const page = parseInt(this.dataset.page);
            if (page > 0) {
                currentPage = page;
                const container = document.getElementById('customersTableContainer');
                if (container) container.innerHTML = renderCustomersTable();
                attachTableEvents();
            }
        });
    });
}

// ========================================
// فتح مودال إضافة/تعديل عميل
// ========================================
async function openCustomerModal(customer = null) {
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};
    const isEdit = !!customer;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'customerModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:500px;">
            <div class="modal-header">
                <h3>${isEdit ? (trans.editCustomer || 'تعديل العميل') : (trans.addCustomer || 'إضافة عميل جديد')}</h3>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
            </div>
            <form id="customerForm">
                <input type="hidden" id="customerId" value="${customer?._id || ''}" />
                <div class="form-group">
                    <label>${trans.name || 'الاسم'} *</label>
                    <input type="text" id="customerName" required value="${customer?.name?.ar || customer?.displayName || ''}" />
                </div>
                <div class="form-group">
                    <label>${trans.phone || 'الهاتف'} *</label>
                    <input type="text" id="customerPhone" required value="${customer?.phone || ''}" />
                </div>
                <div class="form-group">
                    <label>${trans.email || 'البريد الإلكتروني'}</label>
                    <input type="email" id="customerEmail" value="${customer?.email || ''}" />
                </div>
                <div class="form-group">
                    <label>${trans.address || 'العنوان'}</label>
                    <input type="text" id="customerAddress" value="${customer?.address || ''}" />
                </div>
                <div style="display:flex; gap:0.5rem; margin-top:1rem;">
                    <button type="submit" class="btn-primary" style="flex:1;">${isEdit ? (trans.update || 'تحديث') : (trans.save || 'حفظ')}</button>
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">${trans.cancel || 'إلغاء'}</button>
                </div>
                <div id="customerFormStatus" style="margin-top:0.5rem; font-weight:600;"></div>
            </form>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('customerForm').onsubmit = async (e) => {
        e.preventDefault();
        const status = document.getElementById('customerFormStatus');
        const id = document.getElementById('customerId').value;
        const name = document.getElementById('customerName').value.trim();
        const phone = document.getElementById('customerPhone').value.trim();
        const email = document.getElementById('customerEmail').value.trim();
        const address = document.getElementById('customerAddress').value.trim();

        if (!name || !phone) {
            status.textContent = '❌ الاسم والهاتف مطلوبان';
            status.style.color = 'var(--danger-color)';
            return;
        }

        const data = {
            name: { ar: name, en: name, fr: name },
            phone,
            email: email || undefined,
            address: address || undefined,
            isActive: true
        };

        try {
            const url = id ? `/api/customers/${id}` : '/api/customers';
            const method = id ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                status.textContent = '✅ ' + (id ? (trans.customerUpdated || 'تم التحديث') : (trans.customerCreated || 'تم الإنشاء'));
                status.style.color = 'var(--success-color)';
                modal.remove();
                await fetchAllCustomers();
                const container = document.getElementById('customersTableContainer');
                if (container) container.innerHTML = renderCustomersTable();
                attachTableEvents();
            } else {
                status.textContent = '❌ ' + (result.message || 'فشل');
                status.style.color = 'var(--danger-color)';
            }
        } catch (err) {
            status.textContent = '❌ خطأ في الاتصال';
            status.style.color = 'var(--danger-color)';
        }
    };

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ========================================
// حذف عميل
// ========================================
async function deleteCustomer(customer) {
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};
    const name = customer.displayName || customer.name?.ar || 'غير محدد';
    if (!confirm(`${trans.confirmDelete || 'حذف'} "${name}"؟`)) return;

    try {
        const res = await fetch(`/api/customers/${customer._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            alert(trans.customerDeleted || '✅ تم الحذف');
            await fetchAllCustomers();
            const container = document.getElementById('customersTableContainer');
            if (container) container.innerHTML = renderCustomersTable();
            attachTableEvents();
        } else {
            alert('❌ ' + (data.message || 'فشل'));
        }
    } catch (e) {
        alert('❌ خطأ في الاتصال');
    }
}
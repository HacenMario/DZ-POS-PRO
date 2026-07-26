// modules/products.js
const token = localStorage.getItem('token');
let productsData = [];
let currentPage = 1;
const perPage = 10;

export async function renderProductsPage() {
    const content = document.getElementById('pageContent');
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};

    await fetchCategoriesForSelect();
    await fetchAllProducts();

    content.innerHTML = `
        <div class="products-header">
            <div class="products-toolbar">
                <div class="search-box">
                    <input type="text" id="productSearch" placeholder="${trans.searchProducts || '🔍 بحث...'}" />
                    <button id="searchBtn" class="btn-secondary">${trans.search || 'بحث'}</button>
                </div>
                <button id="addProductBtn" class="btn-primary">➕ ${trans.addProduct || 'إضافة منتج'}</button>
            </div>
        </div>
        <div id="productsTableContainer">${renderTable()}</div>
    `;

    document.getElementById('addProductBtn').addEventListener('click', () => openModal());
    document.getElementById('searchBtn').addEventListener('click', () => {
        const q = document.getElementById('productSearch').value.trim();
        searchProducts(q);
    });
    document.getElementById('productSearch').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') document.getElementById('searchBtn').click();
    });
    attachEvents();
}

// ✅ جلب جميع المنتجات دفعة واحدة
async function fetchAllProducts() {
    try {
        const res = await fetch('/api/products?limit=10000', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
            productsData = data.products || [];
            console.log(`📦 تم جلب ${productsData.length} منتج`);
        } else {
            console.error('❌ فشل جلب المنتجات:', data.message);
            productsData = [];
        }
    } catch (e) {
        console.error('❌ خطأ في جلب المنتجات:', e);
        productsData = [];
    }
}

// ✅ دالة البحث (تصفية محلية)
function searchProducts(query) {
    const filtered = productsData.filter(p => {
        const name = (p.displayName || p.name?.ar || '').toLowerCase();
        const barcode = (p.barcode || '').toLowerCase();
        const q = query.toLowerCase().trim();
        return name.includes(q) || barcode.includes(q);
    });
    currentPage = 1;
    const container = document.getElementById('productsTableContainer');
    if (container) {
        container.innerHTML = renderTable(filtered);
        attachEvents();
    }
}

// ✅ عرض الجدول مع تنسيق الأرقام (رقمين بعد الفاصلة)
function renderTable(data = null) {
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};
    const displayData = data || productsData;

    if (!displayData.length) {
        return `<div class="empty-state"><p>📭 ${trans.noProducts || 'لا توجد منتجات'}</p></div>`;
    }

    const totalPages = Math.ceil(displayData.length / perPage);
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageData = displayData.slice(start, end);

    let html = `<table class="products-table"><thead><tr><th>#</th><th>${trans.name}</th><th>${trans.price}</th><th>${trans.stock}</th><th>${trans.category}</th><th>${trans.timbre || 'الدمغة'}</th><th>${trans.actions}</th></tr></thead><tbody>`;
    pageData.forEach((p, i) => {
        const index = start + i + 1;
        const name = p.displayName || p.name?.ar || 'غير محدد';
        const cat = p.category?.displayName || p.category?.name?.ar || '-';
        // ✅ تنسيق السعر إلى رقمين عشريين
        const formattedPrice = p.price ? p.price.toFixed(2) : '0.00';
        // ✅ تنسيق timbre إلى رقمين عشريين (اختياري)
        const formattedTimbre = p.timbre ? p.timbre.toFixed(2) : '0.00';
        html += `<tr><td>${index}</td><td><strong>${name}</strong></td><td>${formattedPrice} دج</td><td class="${p.stock <= p.minStock ? 'danger' : ''}">${p.stock}</td><td>${cat}</td><td>${formattedTimbre}</td><td><button class="btn-edit" data-id="${p._id}">✏️</button> <button class="btn-delete" data-id="${p._id}">🗑️</button></td></tr>`;
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
    document.querySelectorAll('.btn-edit').forEach(b => b.addEventListener('click', function() {
        const p = productsData.find(x => x._id === this.dataset.id);
        if (p) openModal(p);
    }));

    document.querySelectorAll('.btn-delete').forEach(b => b.addEventListener('click', function() {
        const p = productsData.find(x => x._id === this.dataset.id);
        if (p) deleteProduct(p._id, p.displayName || p.name?.ar || 'غير محدد');
    }));

    document.querySelectorAll('.page-btn').forEach(b => b.addEventListener('click', function() {
        const page = parseInt(this.dataset.page);
        if (page > 0) {
            currentPage = page;
            const container = document.getElementById('productsTableContainer');
            if (container) {
                container.innerHTML = renderTable();
                attachEvents();
            }
        }
    }));
}

async function fetchCategoriesForSelect() {
    try {
        const res = await fetch('/api/categories?limit=1000', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) window.categoriesData = data.categories || [];
    } catch (e) { console.error(e); }
}

async function openModal(product = null) {
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};
    const isEdit = !!product;
    const cats = window.categoriesData || [];

    let catOpts = `<option value="">${trans.selectCategory || 'اختر فئة'}</option>`;
    cats.forEach(c => {
        const name = c.displayName || c.name?.ar || 'غير محدد';
        const sel = product && product.category?._id === c._id ? 'selected' : '';
        catOpts += `<option value="${c._id}" ${sel}>${name}</option>`;
    });

    const html = `
        <div class="modal-overlay" id="productModal">
            <div class="modal-content">
                <div class="modal-header"><h3>${isEdit ? (trans.editProduct||'تعديل') : (trans.addProduct||'إضافة')}</h3><button class="modal-close" id="closeModal">✕</button></div>
                <form id="productForm">
                    <input type="hidden" id="productId" value="${product?._id||''}" />
                    <div class="form-row"><div class="form-group"><label>${trans.nameArabic||'اسم (عربي)'} *</label><input type="text" id="nameAr" value="${product?.name?.ar||''}" required /></div><div class="form-group"><label>${trans.nameEnglish||'اسم (إنجليزي)'} *</label><input type="text" id="nameEn" value="${product?.name?.en||''}" required /></div><div class="form-group"><label>${trans.nameFrench||'اسم (فرنسي)'} *</label><input type="text" id="nameFr" value="${product?.name?.fr||''}" required /></div></div>
                    <div class="form-row"><div class="form-group"><label>${trans.price||'السعر'} *</label><input type="number" id="price" value="${product?.price || ''}" step="0.01" required /></div><div class="form-group"><label>${trans.costPrice||'سعر التكلفة'}</label><input type="number" id="costPrice" value="${product?.costPrice||0}" step="0.01" /></div><div class="form-group"><label>${trans.stock||'المخزون'}</label><input type="number" id="stock" value="${product?.stock||0}" /></div></div>
                    <div class="form-row"><div class="form-group"><label>${trans.minStock||'الحد الأدنى'}</label><input type="number" id="minStock" value="${product?.minStock||5}" /></div><div class="form-group"><label>${trans.barcode||'الباركود'}</label><input type="text" id="barcode" value="${product?.barcode||''}" /></div><div class="form-group"><label>${trans.unit||'الوحدة'}</label><input type="text" id="unit" value="${product?.unit||'قطعة'}" /></div></div>
                    <div class="form-row"><div class="form-group"><label>${trans.timbre || 'الدمغة (Timbre)'}</label><input type="number" id="timbre" value="${product?.timbre||0}" step="0.01" min="0" /></div><div class="form-group"><label>${trans.category||'الفئة'}</label><select id="category">${catOpts}</select></div><div class="form-group"><label>${trans.status||'الحالة'}</label><select id="isActive"><option value="true" ${product?.isActive!==false?'selected':''}>${trans.active||'نشط'}</option><option value="false" ${product?.isActive===false?'selected':''}>${trans.inactive||'غير نشط'}</option></select></div></div>
                    <div class="form-row" style="justify-content:flex-end; gap:10px;"><button type="submit" class="btn-primary">${isEdit ? (trans.update||'تحديث') : (trans.save||'حفظ')}</button></div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('pageContent').insertAdjacentHTML('afterend', html);
    document.getElementById('closeModal').onclick = () => document.getElementById('productModal').remove();
    document.getElementById('productModal').onclick = (e) => { if(e.target === e.currentTarget) document.getElementById('productModal').remove(); };
    document.getElementById('productForm').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('productId').value;
        const data = {
            name: { ar: document.getElementById('nameAr').value.trim(), en: document.getElementById('nameEn').value.trim(), fr: document.getElementById('nameFr').value.trim() },
            description: { ar: '', en: '', fr: '' },
            price: parseFloat(document.getElementById('price').value) || 0,
            costPrice: parseFloat(document.getElementById('costPrice').value) || 0,
            stock: parseInt(document.getElementById('stock').value) || 0,
            minStock: parseInt(document.getElementById('minStock').value) || 5,
            barcode: document.getElementById('barcode').value.trim() || undefined,
            unit: document.getElementById('unit').value.trim() || 'قطعة',
                    timbre: parseFloat(document.getElementById('timbre').value) || 0,
            category: document.getElementById('category').value || null,
            isActive: document.getElementById('isActive').value === 'true'
        };
        try {
            const url = id ? `/api/products/${id}` : '/api/products';
            const res = await fetch(url, {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                alert(id ? (trans.productUpdated||'✅ تم التحديث') : (trans.productCreated||'✅ تم الإنشاء'));
                document.getElementById('productModal').remove();
                await fetchAllProducts();
                const container = document.getElementById('productsTableContainer');
                if (container) {
                    container.innerHTML = renderTable();
                    attachEvents();
                }
            } else alert('❌ ' + (result.message || 'فشل'));
        } catch (err) { alert('❌ خطأ في الاتصال'); }
    };
}

async function deleteProduct(id, name) {
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};
    if (!confirm(`${trans.confirmDelete||'حذف'} "${name}"؟`)) return;
    try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
            alert(trans.productDeleted || '✅ تم الحذف');
            await fetchAllProducts();
            const container = document.getElementById('productsTableContainer');
            if (container) {
                container.innerHTML = renderTable();
                attachEvents();
            }
        } else alert('❌ ' + (data.message || 'فشل'));
    } catch (e) { alert('❌ خطأ في الاتصال'); }
}
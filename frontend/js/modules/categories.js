// modules/categories.js

import API_BASE_URL from '../config.js';

const token = localStorage.getItem('token');
let categoriesData = [];
let currentPage = 1;
const perPage = 10;

export async function renderCategoriesPage() {
    const content = document.getElementById('pageContent');
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};

    await fetchCategories();

    content.innerHTML = `
        <div class="products-header">
            <div class="products-toolbar">
                <div class="search-box">
                    <input type="text" id="categorySearch" placeholder="${trans.searchCategories || '🔍 بحث...'}" />
                    <button id="searchBtn" class="btn-secondary">${trans.search || 'بحث'}</button>
                </div>
                <button id="addCategoryBtn" class="btn-primary">➕ ${trans.addCategory || 'إضافة فئة'}</button>
            </div>
        </div>
        <div id="categoriesTableContainer">${renderTable()}</div>
    `;

    document.getElementById('addCategoryBtn').addEventListener('click', () => openModal());
    document.getElementById('searchBtn').addEventListener('click', () => {
        const q = document.getElementById('categorySearch').value.trim();
        fetchCategories(q);
    });
    document.getElementById('categorySearch').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') document.getElementById('searchBtn').click();
    });
    attachEvents();
}

async function fetchCategories(search = '') {
    try {
        // ✅ استخدم API_BASE_URL
        let url = `${API_BASE_URL}/api/categories?page=${currentPage}&limit=${perPage}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
            categoriesData = data.categories || [];
            const container = document.getElementById('categoriesTableContainer');
            if (container) {
                container.innerHTML = renderTable(data.pagination);
                attachEvents();
            }
        }
    } catch (e) { console.error(e); }
}

function renderTable(pagination = null) {
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};
    if (!categoriesData.length) return `<div class="empty-state"><p>📭 ${trans.noCategories || 'لا توجد فئات'}</p></div>`;
    let html = `<table class="products-table"><thead><tr><th>#</th><th>${trans.name}</th><th>${trans.description}</th><th>${trans.parentCategory||'الأم'}</th><th>${trans.actions}</th></tr></thead><tbody>`;
    categoriesData.forEach((c, i) => {
        const name = c.displayName || c.name?.ar || 'غير محدد';
        const desc = c.displayDescription || c.description?.ar || '-';
        const parent = c.parentId?.displayName || c.parentId?.name?.ar || '-';
        html += `<tr><td>${(currentPage-1)*perPage + i + 1}</td><td><strong>${name}</strong></td><td>${desc}</td><td>${parent}</td><td><button class="btn-edit-cat" data-id="${c._id}">✏️</button> <button class="btn-delete-cat" data-id="${c._id}">🗑️</button></td></tr>`;
    });
    html += `</tbody></table>`;
    if (pagination?.pages > 1) {
        html += `<div class="pagination"><button class="page-btn" data-page="${pagination.page-1}" ${pagination.page<=1?'disabled':''}>«</button><span>${pagination.page}/${pagination.pages}</span><button class="page-btn" data-page="${pagination.page+1}" ${pagination.page>=pagination.pages?'disabled':''}>»</button></div>`;
    }
    return html;
}

function attachEvents() {
    document.querySelectorAll('.btn-edit-cat').forEach(b => b.addEventListener('click', function() {
        const c = categoriesData.find(x => x._id === this.dataset.id);
        if (c) openModal(c);
    }));
    document.querySelectorAll('.btn-delete-cat').forEach(b => b.addEventListener('click', function() {
        const c = categoriesData.find(x => x._id === this.dataset.id);
        if (c) deleteCategory(c._id, c.displayName || c.name?.ar || 'غير محدد');
    }));
    document.querySelectorAll('.page-btn').forEach(b => b.addEventListener('click', function() {
        const page = parseInt(this.dataset.page);
        if (page > 0) { currentPage = page; const s = document.getElementById('categorySearch')?.value||''; fetchCategories(s); }
    }));
}

async function openModal(category = null) {
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};
    const isEdit = !!category;
    let allCats = [];
    try {
        // ✅ استخدم API_BASE_URL
        const res = await fetch(`${API_BASE_URL}/api/categories?limit=1000`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) allCats = data.categories || [];
    } catch(e) {}

    let parentOpts = `<option value="">${trans.noParent || 'بدون أم'}</option>`;
    allCats.forEach(c => {
        if (isEdit && c._id === category._id) return;
        const name = c.displayName || c.name?.ar || 'غير محدد';
        const sel = category && category.parentId?._id === c._id ? 'selected' : '';
        parentOpts += `<option value="${c._id}" ${sel}>${name}</option>`;
    });

    const html = `
        <div class="modal-overlay" id="categoryModal">
            <div class="modal-content">
                <div class="modal-header"><h3>${isEdit ? (trans.editCategory||'تعديل') : (trans.addCategory||'إضافة')}</h3><button class="modal-close" id="closeModal">✕</button></div>
                <form id="categoryForm">
                    <input type="hidden" id="categoryId" value="${category?._id||''}" />
                    <div class="form-row"><div class="form-group"><label>${trans.nameArabic||'اسم (عربي)'} *</label><input type="text" id="catNameAr" value="${category?.name?.ar||''}" required /></div><div class="form-group"><label>${trans.nameEnglish||'اسم (إنجليزي)'} *</label><input type="text" id="catNameEn" value="${category?.name?.en||''}" required /></div><div class="form-group"><label>${trans.nameFrench||'اسم (فرنسي)'} *</label><input type="text" id="catNameFr" value="${category?.name?.fr||''}" required /></div></div>
                    <div class="form-row"><div class="form-group"><label>${trans.descriptionArabic||'وصف (عربي)'}</label><input type="text" id="catDescAr" value="${category?.description?.ar||''}" /></div><div class="form-group"><label>${trans.descriptionEnglish||'وصف (إنجليزي)'}</label><input type="text" id="catDescEn" value="${category?.description?.en||''}" /></div><div class="form-group"><label>${trans.descriptionFrench||'وصف (فرنسي)'}</label><input type="text" id="catDescFr" value="${category?.description?.fr||''}" /></div></div>
                    <div class="form-row"><div class="form-group"><label>${trans.parentCategory||'الفئة الأم'}</label><select id="catParent">${parentOpts}</select></div><div class="form-group"><label>${trans.status||'الحالة'}</label><select id="catIsActive"><option value="true" ${category?.isActive!==false?'selected':''}>${trans.active||'نشط'}</option><option value="false" ${category?.isActive===false?'selected':''}>${trans.inactive||'غير نشط'}</option></select></div><div class="form-group" style="display:flex; align-items:flex-end; justify-content:flex-end;"><button type="submit" class="btn-primary">${isEdit ? (trans.update||'تحديث') : (trans.save||'حفظ')}</button></div></div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('pageContent').insertAdjacentHTML('afterend', html);
    document.getElementById('closeModal').onclick = () => document.getElementById('categoryModal').remove();
    document.getElementById('categoryModal').onclick = (e) => { if(e.target === e.currentTarget) document.getElementById('categoryModal').remove(); };
    document.getElementById('categoryForm').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('categoryId').value;
        const data = {
            name: { ar: document.getElementById('catNameAr').value.trim(), en: document.getElementById('catNameEn').value.trim(), fr: document.getElementById('catNameFr').value.trim() },
            description: { ar: document.getElementById('catDescAr').value.trim(), en: document.getElementById('catDescEn').value.trim(), fr: document.getElementById('catDescFr').value.trim() },
            parentId: document.getElementById('catParent').value || null,
            isActive: document.getElementById('catIsActive').value === 'true'
        };
        try {
            // ✅ استخدم API_BASE_URL
            const url = id ? `${API_BASE_URL}/api/categories/${id}` : `${API_BASE_URL}/api/categories`;
            const res = await fetch(url, {
                method: id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                alert(id ? (trans.categoryUpdated||'✅ تم التحديث') : (trans.categoryCreated||'✅ تم الإنشاء'));
                document.getElementById('categoryModal').remove();
                const s = document.getElementById('categorySearch')?.value || '';
                await fetchCategories(s);
                const c = document.getElementById('categoriesTableContainer');
                if (c) { c.innerHTML = renderTable(); attachEvents(); }
            } else alert('❌ ' + (result.message || 'فشل'));
        } catch (err) { alert('❌ خطأ في الاتصال'); }
    };
}

async function deleteCategory(id, name) {
    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};
    if (!confirm(`${trans.confirmDelete||'حذف'} "${name}"؟`)) return;
    try {
        // ✅ استخدم API_BASE_URL
        const res = await fetch(`${API_BASE_URL}/api/categories/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) {
            alert(trans.categoryDeleted || '✅ تم الحذف');
            const s = document.getElementById('categorySearch')?.value || '';
            await fetchCategories(s);
            const c = document.getElementById('categoriesTableContainer');
            if (c) { c.innerHTML = renderTable(); attachEvents(); }
        } else alert('❌ ' + (data.message || 'فشل'));
    } catch (e) { alert('❌ خطأ في الاتصال'); }
}

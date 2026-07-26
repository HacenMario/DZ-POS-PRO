// modules/sales.js

import API_BASE_URL from '../config.js';

const token = localStorage.getItem('token');
let cart = [];
let selectedCustomerId = null;
let selectedCustomerName = '';
let currentProductPage = 1;
let productsList = [];
let categoriesList = [];
let selectedCategory = 'all';
let searchQuery = '';
let storeSettings = {};
let customersList = [];

// ========================================
// دالة عرض صفحة البيع
// ========================================
export async function renderSalesPage() {
    const content = document.getElementById('pageContent');
    if (!content) return;

    const lang = localStorage.getItem('lang') || 'ar';
    const trans = translations[lang] || {};

    await fetchProducts();
    await fetchCategories();
    await fetchStoreSettings();
    await fetchCustomers();

    content.innerHTML = `
        <style>
            /* أنماط خاصة للنافذة المنبثقة لضمان ظهورها في المنتصف */
            #customerModal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                z-index: 9999;
                align-items: center;
                justify-content: center;
            }
            #customerModal.active {
                display: flex;
            }
            #customerModal .modal-content {
                background: #fff;
                border-radius: 12px;
                padding: 20px;
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                position: relative;
                margin: auto;
            }
            /* دعم الوضع الداكن */
            [data-theme="dark"] #customerModal .modal-content {
                background: #1e293b;
                color: #e2e8f0;
            }
            [data-theme="dark"] #customerModal .modal-content input {
                background: #334155;
                color: #e2e8f0;
                border-color: #475569;
            }
            #customerModal .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 10px;
            }
            [data-theme="dark"] #customerModal .modal-header {
                border-color: #475569;
            }
            #customerModal .modal-close {
                background: none;
                border: none;
                font-size: 28px;
                cursor: pointer;
                color: #6b7280;
                line-height: 1;
            }
            [data-theme="dark"] #customerModal .modal-close {
                color: #94a3b8;
            }
            #customerModal .modal-close:hover {
                color: #ef4444;
            }
            #customerModal #customerSearchInput {
                width: 100%;
                padding: 10px;
                border: 1.5px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
                outline: none;
                transition: border-color 0.2s;
            }
            #customerModal #customerSearchInput:focus {
                border-color: #f59e0b;
                box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
            }
            #customerModal #customerListContainer {
                max-height: 350px;
                overflow-y: auto;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                background: #f9fafb;
            }
            [data-theme="dark"] #customerModal #customerListContainer {
                border-color: #475569;
                background: #1e293b;
            }
            #customerModal .customer-item {
                padding: 10px 12px;
                border-bottom: 1px solid #e5e7eb;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: background 0.2s;
            }
            [data-theme="dark"] #customerModal .customer-item {
                border-color: #475569;
            }
            #customerModal .customer-item:hover {
                background: #f3f4f6;
            }
            [data-theme="dark"] #customerModal .customer-item:hover {
                background: #334155;
            }
            #customerModal .customer-item .customer-name {
                font-weight: 500;
            }
            #customerModal .customer-item .customer-details {
                color: #6b7280;
                font-size: 0.85rem;
            }
            [data-theme="dark"] #customerModal .customer-item .customer-details {
                color: #94a3b8;
            }
            #customerModal .btn-secondary {
                padding: 8px 24px;
                background: #e5e7eb;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.2s;
            }
            [data-theme="dark"] #customerModal .btn-secondary {
                background: #475569;
                color: #e2e8f0;
            }
            #customerModal .btn-secondary:hover {
                background: #d1d5db;
            }
            [data-theme="dark"] #customerModal .btn-secondary:hover {
                background: #334155;
            }
        </style>

        <div class="pos-container">
            <!-- الشريط العلوي -->
            <div class="pos-top-bar">
                <div class="pos-search-area">
                    <input type="text" id="posSearch" placeholder="${trans.searchProduct || '🔍 ابحث عن منتج...'}" />
                    <select id="posCategoryFilter">
                        <option value="all">${trans.allCategories || 'جميع الفئات'}</option>
                        ${categoriesList.map(c => `<option value="${c._id}">${c.displayName || c.name?.ar || c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="pos-customer-area">
                    <button id="openCustomerBtn" class="btn-secondary" style="padding:4px 12px;">👤 ${trans.selectCustomer || 'اختيار عميل'}</button>
                    <span id="posCustomerDisplay" class="customer-badge">${selectedCustomerName || trans.noCustomer || 'بدون عميل'}</span>
                    <button id="posClearCustomer" class="btn-icon" title="${trans.clear || 'إلغاء'}">✕</button>
                </div>
                <div class="session-controls">
                    <span id="sessionStatus">🔴 الجلسة مغلقة</span>
                    <div id="sessionInfo" style="font-size:0.8rem; color:var(--text-secondary);"></div>
                    <button id="openSessionBtn" class="btn-success">🚀 فتح جلسة</button>
                    <button id="closeSessionBtn" class="btn-danger" style="display:none;">🔒 إغلاق الجلسة</button>
                </div>
            </div>

            <!-- المحتوى الرئيسي -->
            <div class="pos-main">
                <!-- الجانب الأيسر: المنتجات -->
                <div class="pos-left">
                    <div class="pos-products-grid" id="posProductsGrid"></div>
                    <div class="pos-pagination" id="posPagination"></div>
                </div>

                <!-- الجانب الأيمن: السلة -->
                <div class="pos-right">
                    <div class="pos-cart-header">
                        <h3>${trans.cart || '🛒 السلة'}</h3>
                        <span id="posCartCount" class="cart-count">0</span>
                    </div>

                    <!-- حقول رقم وتاريخ الفاتورة -->
                    <div class="invoice-custom-fields" style="display:flex; gap:10px; margin:10px 0; padding:8px; background:#f9fafb; border-radius:6px; flex-wrap:wrap;">
                        <div style="flex:1; min-width:120px;">
                            <label style="font-size:11px; color:#6b7280;">${trans.invoiceNumber || 'رقم الفاتورة'}</label>
                            <input type="text" id="invoiceNumberInput" placeholder="مثل: INV-000001" style="width:100%; padding:4px; border:1px solid #d1d5db; border-radius:4px; font-size:12px;" />
                        </div>
                        <div style="flex:1; min-width:120px;">
                            <label style="font-size:11px; color:#6b7280;">${trans.date || 'التاريخ'}</label>
                            <input type="date" id="invoiceDateInput" style="width:100%; padding:4px; border:1px solid #d1d5db; border-radius:4px; font-size:12px;" />
                        </div>
                    </div>

                    <div class="pos-cart-items" id="posCartItems">
                        <div class="empty-cart">${trans.noCartItems || 'السلة فارغة'}</div>
                    </div>
                    <div class="pos-cart-summary">
                        <div class="summary-row">
                            <span>${trans.subtotal || 'المجموع الفرعي'}</span>
                            <span id="posSubtotal">0.00 دج</span>
                        </div>
                        <div class="summary-row">
                            <span>${trans.discount || 'الخصم'}</span>
                            <input type="number" id="posDiscountInput" value="0" step="0.01" min="0" />
                        </div>
                        <div class="summary-row total-row">
                            <span>${trans.total || 'الإجمالي'}</span>
                            <span id="posTotal" class="total-amount">0.00 دج</span>
                        </div>
                    </div>
                    <div class="pos-payment-area">
                        <div class="payment-methods">
                            <button class="payment-btn active" data-method="cash">💰 ${trans.cash || 'نقدي'}</button>
                            <button class="payment-btn" data-method="card">💳 ${trans.card || 'بطاقة'}</button>
                            <button class="payment-btn" data-method="transfer">🏦 ${trans.transfer || 'تحويل'}</button>
                        </div>
                        <div class="pos-actions">
                            <button id="posCompleteBtn" class="btn-primary">✅ ${trans.completeSale || 'إتمام البيع'}</button>
                            <button id="posPrintBtn" class="btn-secondary">🖨️ ${trans.printInvoice || 'طباعة'}</button>
                            <button id="posClearCartBtn" class="btn-danger">🗑️ ${trans.clear || 'إفراغ'}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- نافذة اختيار العميل (Modal) -->
        <div id="customerModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 style="margin:0;">${trans.selectCustomer || 'اختيار عميل'}</h3>
                    <button class="modal-close" id="closeCustomerModal">&times;</button>
                </div>
                <div style="margin-bottom:12px;">
                    <input type="text" id="customerSearchInput" placeholder="${trans.searchCustomers || '🔍 بحث عن عميل...'}" />
                </div>
                <div id="customerListContainer">
                    <div id="customerList">
                        ${customersList.map(c => `
                            <div class="customer-item" data-id="${c._id}" data-name="${c.displayName || c.name?.ar || 'غير محدد'}">
                                <span class="customer-name">${c.displayName || c.name?.ar || 'غير محدد'}</span>
                                <span class="customer-details">${c.phone || ''} ${c.email ? '| ' + c.email : ''}</span>
                            </div>
                        `).join('')}
                        ${customersList.length === 0 ? `<div style="padding:15px; text-align:center; color:var(--text-secondary);">${trans.noCustomers || 'لا يوجد عملاء'}</div>` : ''}
                    </div>
                </div>
                <div style="margin-top:15px; text-align:center;">
                    <button id="closeCustomerModalBtn" class="btn-secondary">${trans.close || 'إغلاق'}</button>
                </div>
            </div>
        </div>
    `;

    setTimeout(() => {
        renderProductsGrid();
        bindEvents();
        checkSession();
        initCustomerModal();
    }, 150);
}

// ========================================
// جلب البيانات
// ========================================
async function fetchProducts() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/products?limit=1000`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) productsList = data.products || [];
    } catch (e) { console.error('خطأ في جلب المنتجات:', e); }
}

async function fetchCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/categories?limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) categoriesList = data.categories || [];
    } catch (e) { console.error('خطأ في جلب الفئات:', e); }
}

async function fetchStoreSettings() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/settings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.data) storeSettings = data.data;
    } catch (e) { console.error('خطأ في جلب الإعدادات:', e); }
}

async function fetchCustomers() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/customers?limit=500`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) customersList = data.customers || [];
    } catch (e) { console.error('خطأ في جلب العملاء:', e); }
}

// ========================================
// عرض شبكة المنتجات
// ========================================
function renderProductsGrid() {
    const grid = document.getElementById('posProductsGrid');
    if (!grid) return;

    const lang = localStorage.getItem('lang') || 'ar';
    let filtered = productsList;
    if (selectedCategory !== 'all') {
        filtered = filtered.filter(p => p.category?._id === selectedCategory || p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(p => {
            const name = (p.displayName || p.name?.ar || '').toLowerCase();
            const barcode = (p.barcode || '').toLowerCase();
            return name.includes(q) || barcode.includes(q);
        });
    }

    if (!filtered.length) {
        grid.innerHTML = `<div class="no-products">📭 ${translations[lang]?.noProducts || 'لا توجد منتجات'}</div>`;
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const name = p.displayName || p.name?.ar || 'غير محدد';
        const isOutOfStock = p.stock <= 0;
        return `
            <div class="pos-product-card ${isOutOfStock ? 'out-of-stock' : ''}" data-id="${p._id}">
                <div class="product-image">
                    ${p.images && p.images.length > 0
                        ? `<img src="${p.images[0]}" alt="${name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 font-size=%2230%22 text-anchor=%22middle%22 fill=%22%239ca3af%22%3E📦%3C/text%3E%3C/svg%3E'" />`
                        : `<div class="no-image">📦</div>`}
                </div>
                <div class="product-info">
                    <div class="product-name">${name}</div>
                    <div class="product-price">${p.price} دج</div>
                    <div class="product-stock ${p.stock <= p.minStock ? 'low-stock' : ''}">
                        ${isOutOfStock ? '⚠️ نفذ' : `🟢 ${p.stock}`}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========================================
// إدارة السلة
// ========================================
function addToCart(product) {
    if (product.stock <= 0) {
        Toast.error('❌ هذا المنتج غير متوفر في المخزون');
        return;
    }

    const existing = cart.find(item => item.productId === product._id);
    if (existing) {
        existing.quantity = 1;
    } else {
        cart.push({
            productId: product._id,
            name: product.displayName || product.name?.ar || 'غير محدد',
            price: product.price,
            quantity: 1,
            maxStock: product.stock,
            discount: 0,
            timbre: product.timbre || 0
        });
    }

    renderCart();
    updateCartTotals();
    const countEl = document.getElementById('posCartCount');
    if (countEl) countEl.textContent = cart.length;
}

function renderCart() {
    const container = document.getElementById('posCartItems');
    if (!container) return;

    if (!cart.length) {
        container.innerHTML = `<div class="empty-cart">🛒 السلة فارغة</div>`;
        return;
    }

    container.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${item.price} دج × ${item.quantity}</div>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn" data-index="${index}" data-action="decrease">−</button>
                <span class="qty-display">${item.quantity}</span>
                <button class="qty-btn" data-index="${index}" data-action="increase">+</button>
                <button class="remove-btn" data-index="${index}">✕</button>
            </div>
            <div class="cart-item-total">${(item.price * item.quantity - item.discount).toFixed(2)} دج</div>
        </div>
    `).join('');

    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            const action = this.dataset.action;
            const item = cart[index];
            if (!item) return;
            if (action === 'increase') {
                if (item.quantity < item.maxStock) {
                    item.quantity += 1;
                } else {
                    Toast.error('❌ الكمية المطلوبة تتجاوز المخزون المتوفر');
                }
            } else if (action === 'decrease') {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                } else {
                    cart.splice(index, 1);
                }
            }
            renderCart();
            updateCartTotals();
            const countEl = document.getElementById('posCartCount');
            if (countEl) countEl.textContent = cart.length;
        });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            cart.splice(index, 1);
            renderCart();
            updateCartTotals();
            const countEl = document.getElementById('posCartCount');
            if (countEl) countEl.textContent = cart.length;
        });
    });
}

function updateCartTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountInput = document.getElementById('posDiscountInput');
    const discount = discountInput ? (parseFloat(discountInput.value) || 0) : 0;
    const total = Math.max(0, subtotal - discount);

    const subtotalEl = document.getElementById('posSubtotal');
    const totalEl = document.getElementById('posTotal');
    if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2) + ' دج';
    if (totalEl) totalEl.textContent = total.toFixed(2) + ' دج';
}

// ========================================
// نافذة اختيار العميل
// ========================================
function initCustomerModal() {
    const modal = document.getElementById('customerModal');
    const openBtn = document.getElementById('openCustomerBtn');
    const closeBtns = document.querySelectorAll('#closeCustomerModal, #closeCustomerModalBtn');
    const searchInput = document.getElementById('customerSearchInput');

    if (!modal || !openBtn) return;

    // فتح النافذة
    openBtn.addEventListener('click', () => {
        modal.classList.add('active');
        modal.style.display = 'flex'; // للتأكد
        document.body.style.overflow = 'hidden';
        renderCustomerList(customersList);
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
    });

    // إغلاق النافذة
    closeBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                modal.classList.remove('active');
                modal.style.display = 'none';
                document.body.style.overflow = '';
            });
        }
    });

    // إغلاق عند النقر على الخلفية (الـ overlay)
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    // البحث
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filtered = customersList.filter(c => {
                const name = (c.displayName || c.name?.ar || '').toLowerCase();
                const phone = (c.phone || '').toLowerCase();
                const email = (c.email || '').toLowerCase();
                return name.includes(query) || phone.includes(query) || email.includes(query);
            });
            renderCustomerList(filtered);
        });
    }
}

function renderCustomerList(customers) {
    const container = document.getElementById('customerList');
    if (!container) return;

    if (!customers || customers.length === 0) {
        container.innerHTML = `<div style="padding:15px; text-align:center; color:var(--text-secondary);">لا يوجد عملاء</div>`;
        return;
    }

    container.innerHTML = customers.map(c => `
        <div class="customer-item" data-id="${c._id}" data-name="${c.displayName || c.name?.ar || 'غير محدد'}">
            <span class="customer-name">${c.displayName || c.name?.ar || 'غير محدد'}</span>
            <span class="customer-details">${c.phone || ''} ${c.email ? '| ' + c.email : ''}</span>
        </div>
    `).join('');

    // ربط حدث النقر على عناصر العملاء
    container.querySelectorAll('.customer-item').forEach(el => {
        el.addEventListener('click', function() {
            const id = this.dataset.id;
            const name = this.dataset.name;
            selectCustomer(id, name);
        });
    });
}

function selectCustomer(id, name) {
    selectedCustomerId = id;
    selectedCustomerName = name;
    const display = document.getElementById('posCustomerDisplay');
    if (display) display.textContent = `👤 ${name}`;
    // إغلاق النافذة
    const modal = document.getElementById('customerModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
    Toast.success(`✅ تم اختيار العميل: ${name}`);
}

// ========================================
// إتمام البيع
// ========================================
async function completeSale() {
    if (!cart.length) {
        Toast.error('❌ السلة فارغة! أضف منتجات أولاً.');
        return;
    }

    const paymentMethod = document.querySelector('.payment-btn.active')?.dataset.method || 'cash';

    const items = cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        discount: item.discount || 0
    }));

    const discountInput = document.getElementById('posDiscountInput');
    const discount = discountInput ? (parseFloat(discountInput.value) || 0) : 0;

    const invoiceNumberInput = document.getElementById('invoiceNumberInput');
    const invoiceDateInput = document.getElementById('invoiceDateInput');
    const invoiceNumber = invoiceNumberInput ? invoiceNumberInput.value.trim() : '';
    const invoiceDate = invoiceDateInput ? invoiceDateInput.value : '';

    const saleData = {
        customerId: selectedCustomerId,
        items,
        discount,
        tax: 0,
        paymentMethod,
        notes: { ar: 'بيع', en: 'Sale', fr: 'Vente' },
        invoiceNumber: invoiceNumber || null,
        invoiceDate: invoiceDate || null
    };

    try {
        const res = await fetch(`${API_BASE_URL}/api/sales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(saleData)
        });
        const data = await res.json();

        if (data.success) {
            Toast.success(`✅ تم إتمام البيع بنجاح!\nرقم الفاتورة: ${data.sale.saleNumber}`);
            await generateInvoicePDF(data.sale);
            clearCart();
            await fetchProducts();
            renderProductsGrid();
        } else {
            Toast.error('❌ ' + (data.message || 'فشل إتمام البيع'));
        }
    } catch (e) {
        console.error(e);
        Toast.error('❌ خطأ في الاتصال بالخادم');
    }
}

function clearCart() {
    cart = [];
    selectedCustomerId = null;
    selectedCustomerName = '';
    const display = document.getElementById('posCustomerDisplay');
    if (display) display.textContent = 'بدون عميل';
    const discountInput = document.getElementById('posDiscountInput');
    if (discountInput) discountInput.value = '0';
    renderCart();
    updateCartTotals();
    const countEl = document.getElementById('posCartCount');
    if (countEl) countEl.textContent = '0';
}

// ========================================
// توليد فاتورة PDF
// ========================================
async function generateInvoicePDF(saleData) {
    try {
        await fetchStoreSettings();
        const lang = localStorage.getItem('lang') || 'ar';
        const trans = translations[lang] || {};

        const store = storeSettings;
        const currency = store.currency || 'دج';
        const taxRate = store.taxRate || 0;

        const contactInfo = {
            phone: store.phone || '+213 770 19 14 09',
            whatsapp: store.whatsapp || '+213 551 67 60 46',
            email: store.email || 'terkmanikhaled92@gmail.com'
        };

        let invoiceNumber = saleData.saleNumber || `INV-${Date.now().toString().slice(-8)}`;
        let invoiceDate = saleData.saleDate || new Date().toLocaleDateString(
            lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-US'
        );

        if (saleData.saleDate) {
            const dateObj = new Date(saleData.saleDate);
            if (!isNaN(dateObj.getTime())) {
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                invoiceDate = `${year}/${month}/${day}`;
            }
        }

        const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
        const uniqueTimbreMap = new Map();
        cart.forEach(item => {
            if (item.timbre > 0 && !uniqueTimbreMap.has(item.productId)) {
                uniqueTimbreMap.set(item.productId, item.timbre);
            }
        });
        const totalTimbre = Array.from(uniqueTimbreMap.values()).reduce((sum, val) => sum + val, 0);

        const discount = parseFloat(document.getElementById('posDiscountInput')?.value) || 0;
        const taxAmount = (subtotal - discount) * (taxRate / 100);
        const total = subtotal - discount + taxAmount + totalTimbre;

        const labels = {
            invoice: trans.invoice || 'Facture',
            invoiceNumber: trans.invoiceNumber || 'N° de Facture',
            date: trans.date || 'Date',
            customer: trans.customer || 'Client',
            noCustomer: trans.noCustomer || 'Sans client',
            paymentMethod: trans.paymentMethod || 'Mode de paiement',
            cash: trans.cash || 'Espèces',
            card: trans.card || 'Carte',
            transfer: trans.transfer || 'Virement',
            product: trans.product || 'Produit',
            unit: trans.unit || 'Unité',
            quantity: trans.quantity || 'Qté',
            price: trans.price || 'P Unitaire H.T',
            totalHT: 'Montant H.T',
            totalTTC: 'TOTAL T.T.C',
            subtotal: trans.subtotal || 'Total H.T',
            discount: trans.discount || 'Remise',
            tax: trans.tax || 'TVA',
            timbre: trans.timbre || 'Timbre',
            address: trans.address || 'Adresse',
            phone: 'Téléphone',
            whatsapp: 'Whatsapp',
            email: 'Email'
        };

        const paymentMethod = document.querySelector('.payment-btn.active')?.dataset.method || 'cash';
        const paymentLabel = { cash: labels.cash, card: labels.card, transfer: labels.transfer } [paymentMethod] || labels.cash;

        const customerName = selectedCustomerName || 'بدون عميل';

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let y = margin;

        // اسم المحل
        doc.setFontSize(26);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(245, 158, 11);
        doc.text(store.storeName || 'HMEEDY', margin, y);
        y += 10;

        // معلومات الاتصال
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const contactLines = [
            `${labels.phone} : ${contactInfo.phone}`,
            `${labels.whatsapp} : ${contactInfo.whatsapp}`,
            `${labels.email} : ${contactInfo.email}`
        ];
        contactLines.forEach(line => {
            doc.text(line, margin, y);
            y += 5;
        });

        y += 4;

        // RAISON SOCIALE
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`RAISON SOCIALE : ${store.raisonSociale || store.storeName || 'DZ POS PRO'}`, margin, y);
        y += 5;

        const companyLines = [
            store.adresse ? `ADRESSE : ${store.adresse}` : '',
            store.rc ? `N° R.C : ${store.rc}` : '',
            store.nif ? `NIF : ${store.nif}` : '',
            store.nis ? `NIS : ${store.nis}` : '',
            store.art ? `N° ART : ${store.art}` : '',
        ].filter(line => line !== '');

        companyLines.forEach(line => {
            doc.text(line, margin, y);
            y += 5;
        });

        // رقم الفاتورة والتاريخ
        const rightX = pageWidth - margin;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${labels.invoice}`, rightX, margin, { align: 'right' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${labels.invoiceNumber} : ${invoiceNumber}`, rightX, margin + 8, { align: 'right' });
        doc.text(`${labels.date} : ${invoiceDate}`, rightX, margin + 14, { align: 'right' });

        y = Math.max(y, margin + 22);

        // معلومات العميل
        y += 8;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${labels.customer} :`, margin, y);
        doc.text(customerName, margin + 35, y);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${labels.paymentMethod} : ${paymentLabel}`, rightX, y, { align: 'right' });

        y += 10;

        // جدول المنتجات
        const tableHeaders = ['#', labels.product, labels.unit, labels.quantity, labels.price, labels.totalHT];
        const tableRows = cart.map((item, idx) => [
            idx + 1,
            item.name,
            labels.unit || 'UN',
            item.quantity,
            item.price.toFixed(2),
            (item.price * item.quantity).toFixed(2)
        ]);

        doc.autoTable({
            startY: y,
            head: [tableHeaders],
            body: tableRows,
            theme: 'grid',
            headStyles: {
                fillColor: [245, 158, 11],
                textColor: [255, 255, 255],
                fontSize: 10,
                halign: 'center',
            },
            bodyStyles: {
                fontSize: 9,
                halign: 'center',
            },
            columnStyles: {
                0: { cellWidth: 12, halign: 'center' },
                1: { cellWidth: 70, halign: lang === 'ar' ? 'right' : 'left' },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 30, halign: 'center' },
                5: { cellWidth: 30, halign: lang === 'ar' ? 'left' : 'right' },
            },
            margin: { left: margin, right: margin },
            tableWidth: 'auto',
        });

        y = doc.lastAutoTable.finalY + 8;

        // تفاصيل المبالغ
        const summaryX = pageWidth - margin - 70;
        let summaryY = y;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        doc.text(`${labels.subtotal} :`, summaryX, summaryY);
        doc.text(`${subtotal.toFixed(2)} ${currency}`, summaryX + 55, summaryY, { align: 'right' });
        summaryY += 6;

        if (totalTimbre > 0) {
            doc.text(`${labels.timbre} :`, summaryX, summaryY);
            doc.text(`${totalTimbre.toFixed(2)} ${currency}`, summaryX + 55, summaryY, { align: 'right' });
            summaryY += 6;
        }

        if (discount > 0) {
            doc.text(`${labels.discount} :`, summaryX, summaryY);
            doc.text(`-${discount.toFixed(2)} ${currency}`, summaryX + 55, summaryY, { align: 'right' });
            summaryY += 6;
        }

        if (taxRate > 0) {
            doc.text(`${labels.tax} (${taxRate}%) :`, summaryX, summaryY);
            doc.text(`${taxAmount.toFixed(2)} ${currency}`, summaryX + 55, summaryY, { align: 'right' });
            summaryY += 6;
        }

        summaryY += 4;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(245, 158, 11);

        const totalLabel = `${labels.totalTTC} :`;
        const totalValue = `${total.toFixed(2)} ${currency}`;

        doc.text(totalLabel, summaryX - 25, summaryY);
        doc.text(totalValue, summaryX + 55, summaryY, { align: 'right' });

        // تذييل
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const footerText = `${store.phone ? '📞 ' + store.phone : ''} ${store.email ? '| ✉️ ' + store.email : ''} ${store.website ? '| 🌐 ' + store.website : ''}`;
        if (footerText.trim()) {
            doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        doc.save(`invoice-${invoiceNumber}.pdf`);
        Toast.success(`✅ تم إنشاء الفاتورة ${invoiceNumber}`);
    } catch (error) {
        console.error('❌ فشل إنشاء الفاتورة:', error);
        Toast.error('❌ فشل إنشاء الفاتورة: ' + error.message);
    }
}

// ========================================
// دالة الطباعة
// ========================================
function printInvoice() {
    if (!cart.length) {
        Toast.error('السلة فارغة! أضف منتجات أولاً.');
        return;
    }
    const saleData = { saleNumber: `INV-${Date.now().toString().slice(-8)}` };
    generateInvoicePDF(saleData);
}

// ========================================
// التحقق من الجلسة
// ========================================
async function checkSession() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/sessions/current`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const statusEl = document.getElementById('sessionStatus');
        const openBtn = document.getElementById('openSessionBtn');
        const closeBtn = document.getElementById('closeSessionBtn');
        const sessionInfo = document.getElementById('sessionInfo');

        if (!statusEl || !openBtn || !closeBtn) return;

        if (data.success && data.session) {
            const s = data.session;
            const stats = data.stats || {};
            statusEl.textContent = `🟢 الجلسة مفتوحة (${s.userName})`;
            openBtn.style.display = 'none';
            closeBtn.style.display = 'inline-block';
            if (sessionInfo) {
                sessionInfo.innerHTML = `
                    <div style="display:flex; gap:1rem; flex-wrap:wrap; font-size:0.8rem; background:var(--bg-body); padding:0.5rem; border-radius:8px;">
                        <span>💰 المبيعات: ${(stats.totalSales || 0).toFixed(2)} دج</span>
                        <span>🧾 الفواتير: ${stats.saleCount || 0}</span>
                        <span>💵 نقدي: ${(stats.cashSales || 0).toFixed(2)} دج</span>
                        <span>📊 المتوقع: ${(stats.expectedCash || 0).toFixed(2)} دج</span>
                    </div>
                `;
            }
        } else {
            statusEl.textContent = '🔴 الجلسة مغلقة';
            openBtn.style.display = 'inline-block';
            closeBtn.style.display = 'none';
            if (sessionInfo) sessionInfo.innerHTML = '';
        }
    } catch (e) { console.error('خطأ في التحقق من الجلسة:', e); }
}

// ========================================
// تحميل الفاتورة بصيغة PDF
// ========================================
export async function downloadInvoiceById(invoiceId) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/sales/${invoiceId}/pdf`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('فشل تحميل الفاتورة');
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        Toast.success('✅ تم تحميل الفاتورة بنجاح');
    } catch (error) {
        console.error('❌ فشل تحميل الفاتورة:', error);
        Toast.error('❌ فشل تحميل الفاتورة: ' + error.message);
    }
}

// ========================================
// ربط الأحداث
// ========================================
function bindEvents() {
    const posSearch = document.getElementById('posSearch');
    const posCategoryFilter = document.getElementById('posCategoryFilter');
    const posClearCustomer = document.getElementById('posClearCustomer');
    const posDiscountInput = document.getElementById('posDiscountInput');
    const posCompleteBtn = document.getElementById('posCompleteBtn');
    const posPrintBtn = document.getElementById('posPrintBtn');
    const posClearCartBtn = document.getElementById('posClearCartBtn');
    const openSessionBtn = document.getElementById('openSessionBtn');
    const closeSessionBtn = document.getElementById('closeSessionBtn');

    if (posSearch) {
        posSearch.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProductsGrid();
        });
    }

    if (posCategoryFilter) {
        posCategoryFilter.addEventListener('change', (e) => {
            selectedCategory = e.target.value;
            renderProductsGrid();
        });
    }

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.pos-product-card');
        if (card) {
            const id = card.dataset.id;
            const product = productsList.find(p => p._id === id);
            if (product) addToCart(product);
        }
    });

    if (posClearCustomer) {
        posClearCustomer.addEventListener('click', () => {
            selectedCustomerId = null;
            selectedCustomerName = '';
            const display = document.getElementById('posCustomerDisplay');
            if (display) display.textContent = 'بدون عميل';
        });
    }

    if (posDiscountInput) {
        posDiscountInput.addEventListener('input', updateCartTotals);
    }

    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    if (posCompleteBtn) {
        posCompleteBtn.addEventListener('click', completeSale);
    }

    if (posPrintBtn) {
        posPrintBtn.addEventListener('click', printInvoice);
    }

    if (posClearCartBtn) {
        posClearCartBtn.addEventListener('click', () => {
            if (cart.length && confirm('هل أنت متأكد من إفراغ السلة؟')) {
                clearCart();
            }
        });
    }

    if (openSessionBtn) {
        openSessionBtn.addEventListener('click', async () => {
            const balance = prompt('الرصيد الافتتاحي (دج):', '0');
            if (balance === null) return;
            try {
                const res = await fetch(`${API_BASE_URL}/api/sessions/open`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ openingBalance: parseFloat(balance) || 0 })
                });
                const data = await res.json();
                if (data.success) {
                    Toast.success('✅ تم فتح الجلسة بنجاح');
                    if (data.session.lastSession) {
                        const last = data.session.lastSession;
                        Toast.success(`📊 معلومات الجلسة السابقة:\nالتاريخ: ${new Date(last.closedAt).toLocaleString()}\nالمبيعات: ${last.totalSales} دج\nالرصيد: ${last.closingBalance} دج`);
                    }
                    checkSession();
                } else Toast.error('❌ ' + data.message);
            } catch (e) { Toast.error('❌ خطأ في الاتصال'); }
        });
    }

    if (closeSessionBtn) {
        closeSessionBtn.addEventListener('click', async () => {
            if (!confirm('هل أنت متأكد من إغلاق الجلسة؟')) return;
            try {
                const actualCash = prompt('الرصيد الفعلي في الصندوق (دج):', '0');
                if (actualCash === null) return;

                const closeRes = await fetch(`${API_BASE_URL}/api/sessions/close`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ actualCash: parseFloat(actualCash) || 0 })
                });
                const data = await closeRes.json();
                if (data.success) {
                    const summary = data.session.summary;
                    let diffMsg = '';
                    if (summary.difference > 0) {
                        diffMsg = `🟢 الفرق: +${summary.difference.toFixed(2)} دج (زيادة)`;
                    } else if (summary.difference < 0) {
                        diffMsg = `🔴 الفرق: ${summary.difference.toFixed(2)} دج (نقص)`;
                    } else {
                        diffMsg = `✅ الفرق: 0 دج (مطابق)`;
                    }
                    Toast.success(`✅ تم إغلاق الجلسة بنجاح!\n\n📊 ملخص الجلسة:\nالمبيعات: ${summary.totalSales.toFixed(2)} دج\nالفواتير: ${summary.saleCount}\nنقدي: ${summary.cashSales.toFixed(2)} دج\nبطاقة: ${summary.cardSales.toFixed(2)} دج\nتحويل: ${summary.transferSales.toFixed(2)} دج\nالمتوقع: ${summary.expectedCash.toFixed(2)} دج\nالفعلي: ${summary.actualCash.toFixed(2)} دج\n${diffMsg}`);
                    checkSession();
                } else Toast.error('❌ ' + data.message);
            } catch (e) { Toast.error('❌ خطأ في الاتصال'); }
        });
    }
}

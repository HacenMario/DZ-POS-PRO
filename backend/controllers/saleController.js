const Sale = require('../models/Sale');
const SaleItem = require('../models/SaleItem');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Session = require('../models/Session');
const Setting = require('../models/Setting');
const User = require('../models/User');
const { getTranslation } = require('../config/i18n');

// ========================================
// 1. إنشاء فاتورة جديدة (بيع)
// ========================================
const createSale = async (req, res) => {
    try {
        const {
            customerId,
            items,
            discount = 0,
            tax = 0,
            paymentMethod = 'cash',
            notes,
            invoiceNumber: customInvoiceNumber,
            invoiceDate: customInvoiceDate
        } = req.body;
        const lang = req.lang || 'ar';

        // ----- 1. التحقق من الجلسة -----
        const session = await Session.findOne({ user: req.userId, status: 'open' });
        if (!session) {
            return res.status(403).json({
                success: false,
                message: '❌ لا يمكن إجراء عملية بيع بدون جلسة مفتوحة.'
            });
        }

        if (!items || !items.length) {
            return res.status(400).json({
                success: false,
                message: getTranslation('missingFields', lang)
            });
        }

        // ----- 2. جلب إعدادات المحل (لنسبة الضريبة) -----
        let settings = await Setting.findOne();
        if (!settings) {
            settings = new Setting();
            await settings.save();
        }
        const taxRate = settings.taxRate || 0; // مثلاً 19

        // ----- 3. تجهيز رقم الفاتورة -----
        let saleNumber = null;
        if (customInvoiceNumber && customInvoiceNumber.trim() !== '') {
            saleNumber = customInvoiceNumber.trim();
            const existing = await Sale.findOne({ saleNumber });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'رقم الفاتورة مكرر، يرجى اختيار رقم آخر.'
                });
            }
        } else {
            let targetDate = new Date();
            if (customInvoiceDate && customInvoiceDate.trim() !== '') {
                const parsed = new Date(customInvoiceDate);
                if (!isNaN(parsed.getTime())) targetDate = parsed;
            }
            const year = targetDate.getFullYear();
            const month = targetDate.getMonth() + 1;

            if (settings.currentInvoiceYear !== year || settings.currentInvoiceMonth !== month) {
                settings.currentInvoiceYear = year;
                settings.currentInvoiceMonth = month;
                settings.currentInvoiceCounter = 0;
                await settings.save();
            }
            settings.currentInvoiceCounter += 1;
            await settings.save();

            const prefix = settings.invoicePrefix || 'FACT-';
            const yearStr = String(year);
            const monthStr = String(month).padStart(2, '0');
            const counterStr = String(settings.currentInvoiceCounter).padStart(5, '0');
            saleNumber = `${prefix}${yearStr}/${monthStr}/${counterStr}`;
        }

        // ----- 4. تجهيز تاريخ الفاتورة -----
        let saleDate = null;
        if (customInvoiceDate && customInvoiceDate.trim() !== '') {
            const parsedDate = new Date(customInvoiceDate);
            if (!isNaN(parsedDate.getTime())) saleDate = parsedDate;
        }
        if (!saleDate) saleDate = new Date();

        // ----- 5. حساب المجاميع (باستخدام سعر الوحدة) -----
        let subtotal = 0;
        let totalTimbre = 0;
        const saleItems = [];
        const productIds = new Set();

        for (const item of items) {
            // التأكد من وجود البيانات الأساسية
            if (!item.productId || !item.quantity || item.price === undefined || item.price === null) {
                return res.status(400).json({
                    success: false,
                    message: 'بيانات العنصر غير مكتملة (productId, quantity, price مطلوبة)'
                });
            }

            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `${getTranslation('productNotFound', lang)}: ${item.productId}`
                });
            }

            // التحقق من المخزون
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `${product.displayName || product.name?.ar || 'المنتج'}: ${getTranslation('insufficientStock', lang)}`
                });
            }

            // حساب المجموع للعنصر (السعر × الكمية) - السعر هو سعر الوحدة
            const total = item.quantity * item.price;
            subtotal += total;

            // حساب timbre (مرة واحدة لكل منتج فريد)
            const productTimbre = product.timbre || 0;
            if (productTimbre > 0 && !productIds.has(product._id.toString())) {
                totalTimbre += productTimbre;
                productIds.add(product._id.toString());
            }

            // إنشاء بند الفاتورة
            const saleItem = new SaleItem({
                product: product._id,
                quantity: item.quantity,
                price: item.price, // سعر الوحدة
                discount: item.discount || 0,
                total: total,
                timbre: productTimbre,
                productName: product.displayName || product.name?.ar || 'غير محدد',
                productBarcode: product.barcode || ''
            });
            await saleItem.save();
            saleItems.push(saleItem._id);

            // تحديث المخزون
            product.stock -= item.quantity;
            await product.save();
        }

        // ----- 6. حساب الضريبة والإجمالي النهائي -----
        const taxAmount = (subtotal - discount) * (taxRate / 100);
        const total = subtotal - discount + taxAmount + totalTimbre;

        // ----- 7. جلب معلومات العميل (اختياري) -----
        let customerInfo = null;
        if (customerId) {
            const customer = await Customer.findById(customerId);
            if (customer) {
                customerInfo = {
                    name: customer.displayName || customer.name?.ar || 'عميل',
                    rc: customer.rc || '',
                    nif: customer.nif || '',
                    nis: customer.nis || '',
                    art: customer.art || '',
                    address: customer.address || '',
                    phone: customer.phone || '',
                    email: customer.email || '',
                };
                customer.totalSpent = (customer.totalSpent || 0) + total;
                customer.loyaltyPoints = (customer.loyaltyPoints || 0) + Math.floor(total / 100);
                await customer.save();
            }
        }

        // ----- 8. إنشاء الفاتورة في قاعدة البيانات -----
        const sale = new Sale({
            saleNumber,
            saleDate,
            customer: customerId || null,
            session: session._id,
            items: saleItems,
            subtotal,
            discount,
            tax: taxAmount,
            total: Math.max(0, total),
            paymentMethod,
            notes: {
                ar: notes?.ar || '',
                en: notes?.en || '',
                fr: notes?.fr || ''
            },
            createdBy: req.userId
        });

        await sale.save();

        // ----- 9. معلومات المحل للرد -----
        const storeInfo = {
            storeName: settings.storeName || 'HMEEDY',
            raisonSociale: settings.raisonSociale || settings.storeName || 'DZ POS PRO',
            adresse: settings.adresse || settings.address || '',
            rc: settings.rc || '',
            nif: settings.nif || '',
            nis: settings.nis || '',
            art: settings.art || '',
            phone: settings.phone || '',
            email: settings.email || '',
            website: settings.website || '',
            currency: settings.currency || 'دج',
            taxRate: settings.taxRate || 0,
        };

        res.status(201).json({
            success: true,
            message: getTranslation('saleCreated', lang),
            sale: {
                ...sale._doc,
                notes: sale.notes[lang] || sale.notes.ar,
                storeInfo,
                customerInfo,
                totalTimbre,
            }
        });
    } catch (error) {
        console.error('❌ خطأ في إنشاء الفاتورة:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// 2. جلب جميع الفواتير
// ========================================
const getSales = async (req, res) => {
    try {
        const { page = 1, limit = 20, startDate, endDate, status } = req.query;
        const lang = req.lang || 'ar';

        const query = {};
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        if (status) query.status = status;

        const sales = await Sale.find(query)
            .populate('customer', 'name phone')
            .populate('items')
            .populate('session', 'userName openingBalance')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Sale.countDocuments(query);

        const formatted = sales.map(s => ({
            ...s._doc,
            notes: s.notes[lang] || s.notes.ar
        }));

        res.json({
            success: true,
            sales: formatted,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب الفواتير:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// 3. جلب فاتورة واحدة
// ========================================
const getSaleById = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const sale = await Sale.findById(req.params.id)
            .populate('customer', 'name phone')
            .populate({
                path: 'items',
                populate: { path: 'product', select: 'name price barcode timbre' }
            })
            .populate('session', 'userName openingBalance');

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: getTranslation('saleNotFound', lang)
            });
        }

        const settings = await Setting.findOne();
        const storeInfo = settings ? {
            storeName: settings.storeName || 'HMEEDY',
            raisonSociale: settings.raisonSociale || settings.storeName || 'DZ POS PRO',
            adresse: settings.adresse || settings.address || '',
            rc: settings.rc || '',
            nif: settings.nif || '',
            nis: settings.nis || '',
            art: settings.art || '',
            phone: settings.phone || '',
            email: settings.email || '',
            website: settings.website || '',
            currency: settings.currency || 'دج',
            taxRate: settings.taxRate || 0,
        } : {};

        res.json({
            success: true,
            sale: {
                ...sale._doc,
                notes: sale.notes[lang] || sale.notes.ar,
                storeInfo
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب الفاتورة:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ========================================
// 4. تحديث حالة الفاتورة
// ========================================
const updateSaleStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const lang = req.lang || 'ar';

        const sale = await Sale.findById(req.params.id);
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: getTranslation('saleNotFound', lang)
            });
        }

        sale.status = status;
        sale.updatedAt = new Date();
        await sale.save();

        res.json({
            success: true,
            message: getTranslation('updated', lang),
            sale
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث حالة الفاتورة:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

module.exports = {
    createSale,
    getSales,
    getSaleById,
    updateSaleStatus
};
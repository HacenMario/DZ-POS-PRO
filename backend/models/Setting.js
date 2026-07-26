const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    // معلومات المتجر الأساسية
    storeName: { type: String, default: 'SPEEDY' },
    currency: { type: String, default: 'دج' },
    taxRate: { type: Number, default: 0 },
    language: { type: String, default: 'ar' },
    theme: { type: String, default: 'light' },
    lowStockThreshold: { type: Number, default: 5 },
    enableNotifications: { type: Boolean, default: true },
    invoicePrefix: { type: String, default: 'FACT-' },
    invoiceFooter: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    
    // معلومات الشركة
    raisonSociale: { type: String, default: 'TERKMANI KHALED' },
    adresse: { type: String, default: '15 RN 11 LOC 03 RDC AIN BENIAN ALGER' },
    rc: { type: String, default: '16/00-4973523 A22' },
    nif: { type: String, default: '19216570015717061600' },
    nis: { type: String, default: '199216440015727' },
    art: { type: String, default: '16570211332' },
    
    // ✅ حقول الترقيم الشهري والسنوي
    currentInvoiceYear: { type: Number, default: 0 },      // السنة الحالية للترقيم
    currentInvoiceMonth: { type: Number, default: 0 },     // الشهر الحالي للترقيم
    currentInvoiceCounter: { type: Number, default: 0 },   // العداد الحالي (يزيد لكل فاتورة)
    
    // قد نترك الحقل القديم للتوافق أو نلغيه
    lastInvoiceNumber: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
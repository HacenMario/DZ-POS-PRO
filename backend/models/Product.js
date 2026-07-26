const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    // اسم المنتج (متعدد اللغات)
    name: {
        ar: { type: String, required: true },
        en: { type: String },
        fr: { type: String }
    },
    displayName: { type: String }, // اسم العرض
    description: {
        ar: { type: String },
        en: { type: String },
        fr: { type: String }
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    barcode: { type: String, unique: true, sparse: true },
    sku: { type: String, unique: true, sparse: true },
    
    // الأسعار والمخزون
    price: { type: Number, required: true, min: 0 }, // سعر الوحدة
    costPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 5, min: 0 },
    unit: { type: String, default: 'pcs' },
    
    // ✅ حقل timbre (الدمغة) - قيمة ثابتة لكل منتج
    timbre: { type: Number, default: 0, min: 0 },
    
    // الصور والحالة
    images: [{ type: String }],
    store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    
    // البيانات الإدارية
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// فهارس للبحث السريع
productSchema.index({ barcode: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ 'name.ar': 1 });
productSchema.index({ 'name.en': 1 });
productSchema.index({ 'name.fr': 1 });
productSchema.index({ displayName: 1 });
productSchema.index({ price: 1 });
productSchema.index({ stock: 1 });

module.exports = mongoose.model('Product', productSchema);
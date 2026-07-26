const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    
    // ✅ حقل timbre الجديد
    timbre: { type: Number, default: 0, min: 0 },
    
    // بيانات إضافية
    productName: { type: String }, // اسم المنتج وقت البيع (للحفظ التاريخي)
    productBarcode: { type: String },
    notes: { type: String },
}, { timestamps: true });

// فهارس
saleItemSchema.index({ product: 1 });
saleItemSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SaleItem', saleItemSchema);
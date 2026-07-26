const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
    saleNumber: { type: String, required: true, unique: true },
    saleDate: { type: Date, default: Date.now }, // تاريخ الفاتورة
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SaleItem' }],
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { 
        type: String, 
        enum: ['cash', 'card', 'transfer', 'split'],
        default: 'cash'
    },
    status: {
        type: String,
        enum: ['completed', 'pending', 'cancelled'],
        default: 'completed'
    },
    notes: {
        ar: String,
        en: String,
        fr: String
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
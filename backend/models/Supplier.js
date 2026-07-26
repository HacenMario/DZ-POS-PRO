const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
    name: {
        ar: { type: String, required: true },
        en: { type: String, required: true },
        fr: { type: String, required: true }
    },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    address: {
        ar: { type: String, default: '' },
        en: { type: String, default: '' },
        fr: { type: String, default: '' }
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

SupplierSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

SupplierSchema.methods.getName = function(lang = 'ar') {
    return this.name[lang] || this.name.ar;
};

SupplierSchema.methods.getAddress = function(lang = 'ar') {
    return this.address[lang] || this.address.ar;
};

module.exports = mongoose.model('Supplier', SupplierSchema);
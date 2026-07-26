const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    name: {
        ar: { type: String, required: true },
        en: { type: String, required: true },
        fr: { type: String, required: true }
    },
    phone: { type: String, required: true, unique: true },
    email: { type: String, default: '' },
    address: {
        ar: { type: String, default: '' },
        en: { type: String, default: '' },
        fr: { type: String, default: '' }
    },
    loyaltyPoints: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

CustomerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

CustomerSchema.methods.getName = function(lang = 'ar') {
    return this.name[lang] || this.name.ar;
};

CustomerSchema.methods.getAddress = function(lang = 'ar') {
    return this.address[lang] || this.address.ar;
};

module.exports = mongoose.model('Customer', CustomerSchema);
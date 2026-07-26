const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    role: {
        type: String,
        enum: ['admin', 'manager', 'cashier'],
        default: 'cashier'
    },
    isActive: { type: Boolean, default: true },
    settings: {
        theme: { type: String, enum: ['light', 'dark'], default: 'light' },
        lang: { type: String, enum: ['ar', 'en', 'fr'], default: 'ar' },
        notifications: { type: Boolean, default: true }
    },
    lastLogin: { type: Date },
    refreshToken: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// تشفير كلمة المرور قبل الحفظ
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now();
    next();
});

// مقارنة كلمة المرور
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
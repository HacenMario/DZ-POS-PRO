const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        ar: { type: String, required: true },
        en: { type: String, required: true },
        fr: { type: String, required: true }
    },
    description: {
        ar: { type: String, default: '' },
        en: { type: String, default: '' },
        fr: { type: String, default: '' }
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

CategorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// ✅ دالة مساعدة لجلب الاسم حسب اللغة
CategorySchema.methods.getName = function(lang = 'ar') {
    return this.name[lang] || this.name.ar;
};

CategorySchema.methods.getDescription = function(lang = 'ar') {
    return this.description[lang] || this.description.ar;
};

module.exports = mongoose.model('Category', CategorySchema);

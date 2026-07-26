const Customer = require('../models/Customer');
const { getTranslation } = require('../config/i18n');

// ✅ إنشاء عميل جديد
const createCustomer = async (req, res) => {
    try {
        const { name, phone, email, address } = req.body;
        const lang = req.lang || 'ar';

        if (!name?.ar || !name?.en || !name?.fr || !phone) {
            return res.status(400).json({
                success: false,
                message: getTranslation('missingFields', lang)
            });
        }

        const existing = await Customer.findOne({ phone });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: getTranslation('customerPhoneExists', lang)
            });
        }

        const customer = new Customer({
            name: {
                ar: name.ar,
                en: name.en,
                fr: name.fr
            },
            phone,
            email: email || '',
            address: {
                ar: address?.ar || '',
                en: address?.en || '',
                fr: address?.fr || ''
            },
            createdBy: req.userId
        });

        await customer.save();

        const obj = customer.toObject();
        obj.displayName = customer.getName(lang);
        obj.displayAddress = customer.getAddress(lang);

        res.status(201).json({
            success: true,
            message: getTranslation('customerCreated', lang),
            customer: obj
        });
    } catch (error) {
        console.error('❌ خطأ في إنشاء العميل:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ جلب جميع العملاء (مع التنسيق)
const getCustomers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const lang = req.lang || 'ar';

        const query = {};
        if (search) {
            query.$or = [
                { 'name.ar': { $regex: search, $options: 'i' } },
                { 'name.en': { $regex: search, $options: 'i' } },
                { 'name.fr': { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const customers = await Customer.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await Customer.countDocuments(query);

        const formatted = customers.map(c => {
            const obj = c.toObject();
            obj.displayName = c.getName(lang);
            obj.displayAddress = c.getAddress(lang);
            return obj;
        });

        res.json({
            success: true,
            customers: formatted,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('❌ خطأ في جلب العملاء:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ جلب عميل واحد
const getCustomerById = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: getTranslation('customerNotFound', lang)
            });
        }

        const obj = customer.toObject();
        obj.displayName = customer.getName(lang);
        obj.displayAddress = customer.getAddress(lang);

        res.json({
            success: true,
            customer: obj
        });
    } catch (error) {
        console.error('❌ خطأ في جلب العميل:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ تحديث عميل
const updateCustomer = async (req, res) => {
    try {
        const { name, phone, email, address, isActive } = req.body;
        const lang = req.lang || 'ar';

        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: getTranslation('customerNotFound', lang)
            });
        }

        if (phone && phone !== customer.phone) {
            const existing = await Customer.findOne({ phone });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: getTranslation('customerPhoneExists', lang)
                });
            }
            customer.phone = phone;
        }

        if (name) {
            if (name.ar) customer.name.ar = name.ar;
            if (name.en) customer.name.en = name.en;
            if (name.fr) customer.name.fr = name.fr;
        }
        if (email !== undefined) customer.email = email || '';
        if (address) {
            if (address.ar !== undefined) customer.address.ar = address.ar;
            if (address.en !== undefined) customer.address.en = address.en;
            if (address.fr !== undefined) customer.address.fr = address.fr;
        }
        if (isActive !== undefined) customer.isActive = isActive;

        customer.updatedAt = new Date();
        await customer.save();

        const obj = customer.toObject();
        obj.displayName = customer.getName(lang);
        obj.displayAddress = customer.getAddress(lang);

        res.json({
            success: true,
            message: getTranslation('customerUpdated', lang),
            customer: obj
        });
    } catch (error) {
        console.error('❌ خطأ في تحديث العميل:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

// ✅ حذف عميل
const deleteCustomer = async (req, res) => {
    try {
        const lang = req.lang || 'ar';
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: getTranslation('customerNotFound', lang)
            });
        }

        await customer.deleteOne();

        res.json({
            success: true,
            message: getTranslation('customerDeleted', lang)
        });
    } catch (error) {
        console.error('❌ خطأ في حذف العميل:', error);
        res.status(500).json({
            success: false,
            message: getTranslation('serverError', req.lang || 'ar')
        });
    }
};

module.exports = {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer
};
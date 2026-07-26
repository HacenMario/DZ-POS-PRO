// backend/config/i18n.js
const translations = {
    ar: {
        // رسائل عامة
        welcome: '🚀 DZ POS PRO API يعمل بنجاح',
        serverError: '❌ خطأ في الخادم',
        notFound: '❌ المسار غير موجود',
        unauthorized: '❌ غير مصرح',
        invalidToken: '❌ توكن غير صالح',
        missingFields: '❌ جميع الحقول المطلوبة غير مكتملة',
        success: '✅ تمت العملية بنجاح',
        created: '✅ تم الإنشاء بنجاح',
        updated: '✅ تم التحديث بنجاح',
        deleted: '✅ تم الحذف بنجاح',

        // المصادقة
        loginSuccess: '✅ تم تسجيل الدخول بنجاح',
        loginFailed: '❌ بيانات الدخول غير صحيحة',
        userNotFound: '❌ المستخدم غير موجود',
        emailExists: '❌ البريد الإلكتروني مسجل مسبقاً',
        accountDisabled: '❌ الحساب معطل، يرجى التواصل مع الإدارة',
        passwordChanged: '✅ تم تغيير كلمة المرور بنجاح',
        passwordMismatch: '❌ كلمة المرور الحالية غير صحيحة',
        passwordTooShort: '❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل',

        // المنتجات
        productCreated: '✅ تم إنشاء المنتج بنجاح',
        productUpdated: '✅ تم تحديث المنتج بنجاح',
        productDeleted: '✅ تم حذف المنتج بنجاح',
        productNotFound: '❌ المنتج غير موجود',
        barcodeExists: '❌ هذا الباركود مسجل مسبقاً',
        skuExists: '❌ هذا SKU مسجل مسبقاً',
        stockUpdated: '✅ تم تحديث المخزون بنجاح',
        insufficientStock: '❌ الكمية غير متوفرة',

        // الفئات
        categoryCreated: '✅ تم إنشاء الفئة بنجاح',
        categoryUpdated: '✅ تم تحديث الفئة بنجاح',
        categoryDeleted: '✅ تم حذف الفئة بنجاح',
        categoryNotFound: '❌ الفئة غير موجودة',
        categoryNameExists: '❌ اسم الفئة مسجل مسبقاً',

        // العملاء
        customerCreated: '✅ تم إنشاء العميل بنجاح',
        customerUpdated: '✅ تم تحديث العميل بنجاح',
        customerDeleted: '✅ تم حذف العميل بنجاح',
        customerNotFound: '❌ العميل غير موجود',
        customerPhoneExists: '❌ رقم الهاتف مسجل مسبقاً',

        // المبيعات
        saleCreated: '✅ تم إنشاء الفاتورة بنجاح',
        saleNotFound: '❌ الفاتورة غير موجودة',
        saleReturned: '✅ تم إرجاع المنتجات بنجاح',

        // المخزون
        movementLogged: '✅ تم تسجيل حركة المخزون بنجاح',

        // المستخدمين
        userCreated: '✅ تم إنشاء المستخدم بنجاح',
        userUpdated: '✅ تم تحديث المستخدم بنجاح',
        userDeleted: '✅ تم حذف المستخدم بنجاح',

        // الإعدادات
        settingsSaved: '✅ تم حفظ الإعدادات بنجاح',
        settingsRetrieved: '✅ تم جلب الإعدادات بنجاح'
    },
    en: {
        // General messages
        welcome: '🚀 DZ POS PRO API is running successfully',
        serverError: '❌ Server error',
        notFound: '❌ Route not found',
        unauthorized: '❌ Unauthorized',
        invalidToken: '❌ Invalid token',
        missingFields: '❌ Required fields are missing',
        success: '✅ Operation successful',
        created: '✅ Created successfully',
        updated: '✅ Updated successfully',
        deleted: '✅ Deleted successfully',

        // Authentication
        loginSuccess: '✅ Login successful',
        loginFailed: '❌ Invalid credentials',
        userNotFound: '❌ User not found',
        emailExists: '❌ Email already registered',
        accountDisabled: '❌ Account is disabled, please contact administration',
        passwordChanged: '✅ Password changed successfully',
        passwordMismatch: '❌ Current password is incorrect',
        passwordTooShort: '❌ Password must be at least 6 characters',

        // Products
        productCreated: '✅ Product created successfully',
        productUpdated: '✅ Product updated successfully',
        productDeleted: '✅ Product deleted successfully',
        productNotFound: '❌ Product not found',
        barcodeExists: '❌ This barcode is already registered',
        skuExists: '❌ This SKU is already registered',
        stockUpdated: '✅ Stock updated successfully',
        insufficientStock: '❌ Insufficient stock',

        // Categories
        categoryCreated: '✅ Category created successfully',
        categoryUpdated: '✅ Category updated successfully',
        categoryDeleted: '✅ Category deleted successfully',
        categoryNotFound: '❌ Category not found',
        categoryNameExists: '❌ Category name already exists',

        // Customers
        customerCreated: '✅ Customer created successfully',
        customerUpdated: '✅ Customer updated successfully',
        customerDeleted: '✅ Customer deleted successfully',
        customerNotFound: '❌ Customer not found',
        customerPhoneExists: '❌ Phone number already registered',

        // Sales
        saleCreated: '✅ Invoice created successfully',
        saleNotFound: '❌ Invoice not found',
        saleReturned: '✅ Products returned successfully',

        // Inventory
        movementLogged: '✅ Inventory movement logged successfully',

        // Users
        userCreated: '✅ User created successfully',
        userUpdated: '✅ User updated successfully',
        userDeleted: '✅ User deleted successfully',

        // Settings
        settingsSaved: '✅ Settings saved successfully',
        settingsRetrieved: '✅ Settings retrieved successfully'
    },
    fr: {
        // Messages généraux
        welcome: '🚀 L\'API DZ POS PRO fonctionne avec succès',
        serverError: '❌ Erreur du serveur',
        notFound: '❌ Route introuvable',
        unauthorized: '❌ Non autorisé',
        invalidToken: '❌ Jeton invalide',
        missingFields: '❌ Champs obligatoires manquants',
        success: '✅ Opération réussie',
        created: '✅ Créé avec succès',
        updated: '✅ Mis à jour avec succès',
        deleted: '✅ Supprimé avec succès',

        // Authentification
        loginSuccess: '✅ Connexion réussie',
        loginFailed: '❌ Identifiants incorrects',
        userNotFound: '❌ Utilisateur introuvable',
        emailExists: '❌ Email déjà enregistré',
        accountDisabled: '❌ Compte désactivé, veuillez contacter l\'administration',
        passwordChanged: '✅ Mot de passe modifié avec succès',
        passwordMismatch: '❌ Mot de passe actuel incorrect',
        passwordTooShort: '❌ Le mot de passe doit comporter au moins 6 caractères',

        // Produits
        productCreated: '✅ Produit créé avec succès',
        productUpdated: '✅ Produit mis à jour avec succès',
        productDeleted: '✅ Produit supprimé avec succès',
        productNotFound: '❌ Produit introuvable',
        barcodeExists: '❌ Ce code-barres est déjà enregistré',
        skuExists: '❌ Ce SKU est déjà enregistré',
        stockUpdated: '✅ Stock mis à jour avec succès',
        insufficientStock: '❌ Stock insuffisant',

        // Catégories
        categoryCreated: '✅ Catégorie créée avec succès',
        categoryUpdated: '✅ Catégorie mise à jour avec succès',
        categoryDeleted: '✅ Catégorie supprimée avec succès',
        categoryNotFound: '❌ Catégorie introuvable',
        categoryNameExists: '❌ Le nom de la catégorie existe déjà',

        // Clients
        customerCreated: '✅ Client créé avec succès',
        customerUpdated: '✅ Client mis à jour avec succès',
        customerDeleted: '✅ Client supprimé avec succès',
        customerNotFound: '❌ Client introuvable',
        customerPhoneExists: '❌ Le numéro de téléphone est déjà enregistré',

        // Ventes
        saleCreated: '✅ Facture créée avec succès',
        saleNotFound: '❌ Facture introuvable',
        saleReturned: '✅ Produits retournés avec succès',

        // Inventaire
        movementLogged: '✅ Mouvement de stock enregistré avec succès',

        // Utilisateurs
        userCreated: '✅ Utilisateur créé avec succès',
        userUpdated: '✅ Utilisateur mis à jour avec succès',
        userDeleted: '✅ Utilisateur supprimé avec succès',

        // Paramètres
        settingsSaved: '✅ Paramètres enregistrés avec succès',
        settingsRetrieved: '✅ Paramètres récupérés avec succès'
    }
};

function getTranslation(key, lang = 'ar') {
    return translations[lang]?.[key] || translations['ar'][key] || key;
}

module.exports = { getTranslation };
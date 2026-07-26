// frontend/js/toast.js
// ✅ واجهة موحدة للتنبيهات باستخدام SweetAlert2

const Toast = {
    // ✅ تنبيه نجاح
    success: (message, title = '✅ نجاح') => {
        Swal.fire({
            icon: 'success',
            title: title,
            text: message,
            timer: 3000,
            timerProgressBar: true,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            showCloseButton: true
        });
    },

    // ✅ تنبيه خطأ
    error: (message, title = '❌ خطأ') => {
        Swal.fire({
            icon: 'error',
            title: title,
            text: message,
            timer: 4000,
            timerProgressBar: true,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            showCloseButton: true
        });
    },

    // ✅ تنبيه تحذير
    warning: (message, title = '⚠️ تنبيه') => {
        Swal.fire({
            icon: 'warning',
            title: title,
            text: message,
            timer: 3000,
            timerProgressBar: true,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            showCloseButton: true
        });
    },

    // ✅ تنبيه معلومات
    info: (message, title = 'ℹ️ معلومات') => {
        Swal.fire({
            icon: 'info',
            title: title,
            text: message,
            timer: 3000,
            timerProgressBar: true,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            showCloseButton: true
        });
    },

    // ✅ تأكيد (نعم/لا) - يعيد Promise
    confirm: (message, title = '❓ تأكيد', confirmText = 'نعم', cancelText = 'إلغاء') => {
        return Swal.fire({
            icon: 'question',
            title: title,
            text: message,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#6b7280'
        });
    },

    // ✅ نموذج إدخال (مثل طلب الرصيد)
    prompt: (message, title = '✏️ إدخال', inputType = 'text', placeholder = '') => {
        return Swal.fire({
            icon: 'info',
            title: title,
            text: message,
            input: inputType,
            inputPlaceholder: placeholder,
            showCancelButton: true,
            confirmButtonText: 'موافق',
            cancelButtonText: 'إلغاء'
        });
    },

    // ✅ تحميل (يظهر أثناء العمليات الطويلة)
    loading: (message = 'جاري التحميل...') => {
        Swal.fire({
            title: message,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    },

    // ✅ إغلاق التحميل
    closeLoading: () => {
        Swal.close();
    }
};

// جعلها متاحة عالمياً
window.Toast = Toast;
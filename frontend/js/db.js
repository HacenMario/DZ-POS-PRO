// frontend/js/db.js
class OfflineDB {
    constructor() {
        this.dbName = 'DZPOSPRO_DB';
        this.dbVersion = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('pendingSales')) {
                    const store = db.createObjectStore('pendingSales', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
                if (!db.objectStoreNames.contains('pendingProducts')) {
                    const store = db.createObjectStore('pendingProducts', { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains('syncLog')) {
                    const store = db.createObjectStore('syncLog', { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async addPendingSale(data) {
        const transaction = this.db.transaction(['pendingSales'], 'readwrite');
        const store = transaction.objectStore('pendingSales');
        const item = { ...data, timestamp: Date.now(), synced: false };
        return new Promise((resolve, reject) => {
            const request = store.add(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getPendingSales() {
        const transaction = this.db.transaction(['pendingSales'], 'readonly');
        const store = transaction.objectStore('pendingSales');
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async removePendingSale(id) {
        const transaction = this.db.transaction(['pendingSales'], 'readwrite');
        const store = transaction.objectStore('pendingSales');
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearAllPending() {
        const transaction = this.db.transaction(['pendingSales'], 'readwrite');
        const store = transaction.objectStore('pendingSales');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// إنشاء نسخة واحدة عالمية
const offlineDB = new OfflineDB();
await offlineDB.init();

// التحقق من حالة الاتصال
function isOnline() {
    return navigator.onLine;
}

// مزامنة المبيعات المعلقة عند استعادة الاتصال
window.addEventListener('online', async function syncPendingSales() {
    console.log('🔄 الاتصال恢复了، بدء المزامنة...');
    const pending = await offlineDB.getPendingSales();
    const token = localStorage.getItem('token');
    if (!token) return;

    for (const item of pending) {
        try {
            const res = await fetch('http://localhost:3001/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(item.data)
            });
            if (res.ok) {
                await offlineDB.removePendingSale(item.id);
                console.log(`✅ تمت مزامنة الفاتورة ${item.id}`);
            }
        } catch (e) {
            console.error(`❌ فشلت مزامنة الفاتورة ${item.id}:`, e);
        }
    }
});

export { offlineDB, isOnline };
/* ============================
   File Attachments Module
   ============================ */

const Attachments = (() => {
    const DB_NAME = 'home_attachments';
    const DB_VERSION = 1;
    const STORE_NAME = 'files';
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    let db = null;

    function init() {
        openDB();
    }

    function openDB() {
        return new Promise((resolve, reject) => {
            if (db) { resolve(db); return; }
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = (e) => {
                const database = e.target.result;
                if (!database.objectStoreNames.contains(STORE_NAME)) {
                    database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            request.onsuccess = (e) => { db = e.target.result; resolve(db); };
            request.onerror = () => reject('Failed to open DB');
        });
    }

    async function saveAttachment(file, parentId, parentType) {
        if (file.size > MAX_SIZE) {
            App.showToast('File too large (max 5MB)', 'error');
            return null;
        }

        const compressed = file.type.startsWith('image/') ? await compressImage(file) : await readFileAsDataURL(file);
        const id = App.generateId();
        const entry = {
            id,
            parentId,
            parentType,
            name: file.name,
            type: file.type,
            size: file.size,
            data: compressed,
            timestamp: Date.now()
        };

        await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put(entry);
            tx.oncomplete = () => { resolve(id); };
            tx.onerror = () => { reject('Failed to save'); };
        });
    }

    function compressImage(file, maxWidth = 1200, quality = 0.8) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height;
                    if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
                    canvas.width = w; canvas.height = h;
                    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
    }

    async function getAttachment(id) {
        await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
    }

    async function getAttachmentsByParent(parentId) {
        await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).getAll();
            req.onsuccess = () => {
                resolve((req.result || []).filter(a => a.parentId === parentId));
            };
            req.onerror = () => resolve([]);
        });
    }

    async function deleteAttachment(id) {
        await openDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(id);
            tx.oncomplete = () => resolve();
        });
    }

    async function deleteByParent(parentId) {
        const attachments = await getAttachmentsByParent(parentId);
        for (const a of attachments) { await deleteAttachment(a.id); }
    }

    function renderThumbnails(attachments) {
        if (!attachments || attachments.length === 0) return '';
        return `<div class="attachment-thumbs">${attachments.map(a => {
            if (a.type && a.type.startsWith('image/')) {
                return `<div class="attachment-thumb" onclick="Attachments.viewImage('${a.id}')">
                    <img src="${a.data}" alt="${escapeHtml(a.name)}">
                </div>`;
            }
            return `<div class="attachment-thumb file-thumb">
                <span class="material-icons-round">description</span>
                <span class="attachment-name">${escapeHtml(a.name)}</span>
            </div>`;
        }).join('')}</div>`;
    }

    async function viewImage(id) {
        const attachment = await getAttachment(id);
        if (!attachment) return;
        const lightbox = App.$('#imageLightbox');
        const img = App.$('#lightboxImage');
        if (lightbox && img) {
            img.src = attachment.data;
            lightbox.classList.add('open');
        }
    }

    function closeLightbox() {
        const lightbox = App.$('#imageLightbox');
        if (lightbox) lightbox.classList.remove('open');
    }

    function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }

    document.addEventListener('DOMContentLoaded', () => {
        init();
        const closeBtn = App.$('#closeLightbox');
        if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
        const lightbox = App.$('#imageLightbox');
        if (lightbox) lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    });

    return { saveAttachment, getAttachment, getAttachmentsByParent, deleteAttachment, deleteByParent, renderThumbnails, viewImage, closeLightbox };
})();

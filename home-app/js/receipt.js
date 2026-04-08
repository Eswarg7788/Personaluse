/* ============================
   Receipt Scanner — Camera Capture for Expenses
   ============================ */
const Receipt = (() => {
    let currentReceiptData = null;

    function init() {
        const captureBtn = document.getElementById('btnCaptureReceipt');
        const fileInput = document.getElementById('receiptFileInput');
        const preview = document.getElementById('receiptPreview');

        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                if (fileInput) fileInput.click();
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) processImage(file);
            });
        }
    }

    function processImage(file) {
        if (file.size > 5 * 1024 * 1024) {
            App.showToast('Image too large (max 5MB)', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            // Compress image
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxW = 600;
                const scale = Math.min(maxW / img.width, 1);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                currentReceiptData = canvas.toDataURL('image/jpeg', 0.6);
                showPreview(currentReceiptData);

                // Try to extract amount from image (basic OCR simulation)
                // Since true OCR requires external libs, we'll prompt user
                App.showToast('Receipt captured! Fill in the details.', 'success');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function showPreview(dataUrl) {
        const preview = document.getElementById('receiptPreview');
        if (!preview) return;
        preview.style.display = 'block';
        preview.innerHTML = `
            <div class="receipt-preview-card">
                <img src="${dataUrl}" alt="Receipt" class="receipt-preview-img"
                     onclick="Receipt.viewFull(this.src)">
                <button class="receipt-remove-btn" onclick="Receipt.clearReceipt()">
                    <span class="material-icons-round">close</span>
                </button>
            </div>`;
    }

    function clearReceipt() {
        currentReceiptData = null;
        const preview = document.getElementById('receiptPreview');
        if (preview) {
            preview.style.display = 'none';
            preview.innerHTML = '';
        }
        const fileInput = document.getElementById('receiptFileInput');
        if (fileInput) fileInput.value = '';
    }

    function getCurrentData() {
        return currentReceiptData;
    }

    function setCurrentData(data) {
        currentReceiptData = data;
        if (data) showPreview(data);
    }

    function viewFull(src) {
        const lightbox = document.getElementById('imageLightbox');
        const img = document.getElementById('lightboxImage');
        if (lightbox && img) {
            img.src = src;
            lightbox.classList.add('open');
        }
    }

    // Render a receipt thumbnail for expense cards
    function renderReceiptThumb(receiptData) {
        if (!receiptData) return '';
        return `
        <div class="receipt-thumb" onclick="event.stopPropagation(); Receipt.viewFull('${receiptData}')">
            <img src="${receiptData}" alt="Receipt">
            <span class="material-icons-round">receipt_long</span>
        </div>`;
    }

    document.addEventListener('DOMContentLoaded', init);

    return { getCurrentData, setCurrentData, clearReceipt, viewFull, renderReceiptThumb };
})();

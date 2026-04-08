/* ============================
   Swipe Gestures — Swipe to Delete / Complete
   ============================ */
const SwipeGesture = (() => {
    const THRESHOLD = 80; // px to trigger action
    const MAX_SWIPE = 120;

    function init() {
        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let isSwiping = false;
    let swipeEl = null;
    let swipeContent = null;
    let direction = null;

    function handleTouchStart(e) {
        const target = e.target.closest('.swipe-item-wrapper');
        if (!target) return;

        swipeEl = target;
        swipeContent = target.querySelector('.swipe-content');
        if (!swipeContent) { swipeEl = null; return; }

        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        currentX = 0;
        isSwiping = false;
        direction = null;
    }

    function handleTouchMove(e) {
        if (!swipeEl) return;

        const touch = e.touches[0];
        const diffX = touch.clientX - startX;
        const diffY = touch.clientY - startY;

        // If mostly vertical scroll, abandon swipe
        if (!isSwiping && Math.abs(diffY) > Math.abs(diffX)) {
            swipeEl = null;
            return;
        }

        if (Math.abs(diffX) > 10) {
            isSwiping = true;
            e.preventDefault();
        }

        if (!isSwiping) return;

        currentX = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diffX));
        direction = currentX > 0 ? 'right' : 'left';

        swipeContent.classList.add('swiping');
        swipeContent.style.transform = `translateX(${currentX}px)`;

        // Show appropriate background
        const leftBg = swipeEl.querySelector('.swipe-left');
        const rightBg = swipeEl.querySelector('.swipe-right');

        if (leftBg) leftBg.classList.toggle('visible', currentX < -30);
        if (rightBg) rightBg.classList.toggle('visible', currentX > 30);
    }

    function handleTouchEnd() {
        if (!swipeEl || !isSwiping) {
            swipeEl = null;
            return;
        }

        const absX = Math.abs(currentX);
        swipeContent.classList.remove('swiping');

        if (absX >= THRESHOLD) {
            // Trigger action
            const action = direction === 'left' ? 'delete' : 'complete';
            const itemId = swipeEl.dataset.itemId;
            const itemType = swipeEl.dataset.itemType;

            // Slide out animation
            swipeContent.style.transform = `translateX(${direction === 'left' ? '-100%' : '100%'})`;
            swipeEl.style.opacity = '0';
            swipeEl.style.maxHeight = swipeEl.offsetHeight + 'px';

            setTimeout(() => {
                swipeEl.style.maxHeight = '0';
                swipeEl.style.marginBottom = '0';
                swipeEl.style.padding = '0';
                swipeEl.style.overflow = 'hidden';
            }, 200);

            setTimeout(() => {
                performAction(action, itemType, itemId);
            }, 400);
        } else {
            // Snap back
            swipeContent.style.transform = 'translateX(0)';
            const leftBg = swipeEl.querySelector('.swipe-left');
            const rightBg = swipeEl.querySelector('.swipe-right');
            if (leftBg) leftBg.classList.remove('visible');
            if (rightBg) rightBg.classList.remove('visible');
        }

        swipeEl = null;
        swipeContent = null;
        isSwiping = false;
    }

    function performAction(action, type, id) {
        if (!type || !id) return;

        if (action === 'delete') {
            const items = App.getData(type);
            const idx = items.findIndex(item => item.id === id);
            if (idx >= 0) {
                items.splice(idx, 1);
                App.setData(type, items);
                App.showToast('Item deleted', 'info');
            }
        } else if (action === 'complete') {
            if (type === 'tasks') {
                const items = App.getData(type);
                const item = items.find(t => t.id === id);
                if (item) {
                    item.status = item.status === 'completed' ? 'pending' : 'completed';
                    App.setData(type, items);
                    App.showToast(item.status === 'completed' ? 'Task completed! ✅' : 'Task reopened', 'success');
                }
            } else if (type === 'reminders') {
                const items = App.getData(type);
                const item = items.find(r => r.id === id);
                if (item) {
                    item.status = item.status === 'completed' ? 'pending' : 'completed';
                    App.setData(type, items);
                    App.showToast(item.status === 'completed' ? 'Reminder done! ✅' : 'Reminder reopened', 'success');
                }
            } else {
                // For expenses etc., just delete
                const items = App.getData(type);
                const idx = items.findIndex(item => item.id === id);
                if (idx >= 0) {
                    items.splice(idx, 1);
                    App.setData(type, items);
                    App.showToast('Item removed', 'info');
                }
            }
        }

        // Refresh current page
        refreshCurrentPage();
    }

    function refreshCurrentPage() {
        if (typeof Dashboard !== 'undefined') Dashboard.refresh();
        if (typeof WeeklySummary !== 'undefined') WeeklySummary.refresh();
        // Refresh specific pages
        const activePage = document.querySelector('.page.active');
        if (!activePage) return;
        const id = activePage.id;
        if (id === 'pageTasks' && typeof Tasks !== 'undefined') Tasks.refresh();
        if (id === 'pageExpenses' && typeof Expenses !== 'undefined') Expenses.refresh();
        if (id === 'pageReminders' && typeof Reminders !== 'undefined') Reminders.refresh();
        if (id === 'pageMessages' && typeof Messages !== 'undefined') Messages.refresh();
    }

    /**
     * Wraps an HTML string for a list item with swipe gesture support.
     * @param {string} innerHtml - The inner HTML of the item
     * @param {string} itemId - The data item ID
     * @param {string} itemType - The data type key (e.g., 'tasks', 'expenses')
     * @param {object} options - { completeLabel, deleteLabel }
     * @returns {string} Wrapped HTML
     */
    function wrap(innerHtml, itemId, itemType, options = {}) {
        const completeLabel = options.completeLabel || 'Done';
        const completeIcon = options.completeIcon || 'check_circle';
        const deleteLabel = options.deleteLabel || 'Delete';

        return `
            <div class="swipe-item-wrapper" data-item-id="${itemId}" data-item-type="${itemType}">
                <div class="swipe-item-bg swipe-right">
                    <span class="material-icons-round">${completeIcon}</span> ${completeLabel}
                </div>
                <div class="swipe-item-bg swipe-left">
                    <span class="material-icons-round">delete</span> ${deleteLabel}
                </div>
                <div class="swipe-content">
                    ${innerHtml}
                </div>
            </div>
        `;
    }

    document.addEventListener('DOMContentLoaded', init);

    return { wrap };
})();

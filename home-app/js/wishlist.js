/* ============================
   Wishlist / Bucket List Module
   ============================ */
const Wishlist = (() => {
    const categories = ['🛒 Shopping', '✈️ Travel', '📱 Tech', '📚 Books', '🎮 Gaming', '🏠 Home', '🎯 Experience', '📦 Other'];

    function refresh() {
        const list = App.$('#wishlistList');
        const filter = App.$('#wishFilterStatus')?.value || 'all';
        let items = App.getData('wishlist');
        if (filter !== 'all') items = items.filter(w => w.status === filter);
        items.sort((a, b) => b.timestamp - a.timestamp);

        // Summary bar
        const all = App.getData('wishlist');
        const totalEst = all.filter(w => w.status === 'want').reduce((s, w) => s + (Number(w.cost) || 0), 0);
        const totalSpent = all.filter(w => w.status === 'bought').reduce((s, w) => s + (Number(w.cost) || 0), 0);
        const estEl = App.$('#wishEstTotal');
        const spentEl = App.$('#wishSpentTotal');
        if (estEl) estEl.textContent = `₹${totalEst.toLocaleString('en-IN')}`;
        if (spentEl) spentEl.textContent = `₹${totalSpent.toLocaleString('en-IN')}`;

        if (items.length === 0) {
            list.innerHTML = `<div class="empty-state"><span class="material-icons-round">bookmark_border</span><p>Your wishlist is empty. Add your dreams!</p></div>`;
            return;
        }

        list.innerHTML = items.map(w => {
            const statusIcon = w.status === 'bought' ? 'shopping_bag' : w.status === 'done' ? 'check_circle' : 'bookmark';
            const statusClass = w.status === 'bought' ? 'status-bought' : w.status === 'done' ? 'status-completed' : '';
            return `
            <div class="item-card ${statusClass}" data-id="${w.id}">
                <div class="item-card-header">
                    <div class="item-card-left">
                        <span class="material-icons-round item-type-icon">${statusIcon}</span>
                        <div>
                            <h4 class="item-title">${escHtml(w.name)}</h4>
                            <span class="item-meta">${w.category || ''} ${w.cost ? '• ₹' + Number(w.cost).toLocaleString('en-IN') : ''}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="item-action-btn" onclick="Wishlist.edit('${w.id}')"><span class="material-icons-round">edit</span></button>
                        <button class="item-action-btn" onclick="Wishlist.remove('${w.id}')"><span class="material-icons-round">delete</span></button>
                    </div>
                </div>
                ${w.notes ? `<p class="item-body">${escHtml(w.notes)}</p>` : ''}
                <div class="wish-priority priority-${w.priority || 'medium'}">
                    <span class="material-icons-round">priority_high</span> ${(w.priority || 'medium').charAt(0).toUpperCase() + (w.priority || 'medium').slice(1)} Priority
                </div>
            </div>`;
        }).join('');
    }

    function openAdd() {
        App.$('#wishModalTitle').textContent = 'Add to Wishlist';
        App.$('#wishName').value = '';
        App.$('#wishCost').value = '';
        App.$('#wishCategory').value = '🛒 Shopping';
        App.$('#wishPriority').value = 'medium';
        App.$('#wishStatus').value = 'want';
        App.$('#wishNotes').value = '';
        App.$('#wishEditId').value = '';
        App.openModal('wishModal');
    }

    function edit(id) {
        const items = App.getData('wishlist');
        const w = items.find(x => x.id === id);
        if (!w) return;
        App.$('#wishModalTitle').textContent = 'Edit Wish';
        App.$('#wishName').value = w.name;
        App.$('#wishCost').value = w.cost || '';
        App.$('#wishCategory').value = w.category || '🛒 Shopping';
        App.$('#wishPriority').value = w.priority || 'medium';
        App.$('#wishStatus').value = w.status || 'want';
        App.$('#wishNotes').value = w.notes || '';
        App.$('#wishEditId').value = w.id;
        App.openModal('wishModal');
    }

    function save() {
        const name = App.$('#wishName').value.trim();
        const cost = App.$('#wishCost').value;
        const category = App.$('#wishCategory').value;
        const priority = App.$('#wishPriority').value;
        const status = App.$('#wishStatus').value;
        const notes = App.$('#wishNotes').value.trim();
        const editId = App.$('#wishEditId').value;

        if (!name) { App.showToast('Please enter item name', 'warning'); return; }

        let items = App.getData('wishlist');
        if (editId) {
            items = items.map(w => w.id === editId ? { ...w, name, cost, category, priority, status, notes } : w);
            App.showToast('Wish updated!', 'success');
        } else {
            items.push({ id: App.generateId(), name, cost, category, priority, status, notes, timestamp: Date.now() });
            App.showToast('Added to wishlist!', 'success');
        }
        App.setData('wishlist', items);
        App.closeModal('wishModal');
        refresh();
    }

    function remove(id) {
        App.confirmDelete('Remove from wishlist?', () => {
            let items = App.getData('wishlist');
            items = items.filter(w => w.id !== id);
            App.setData('wishlist', items);
            App.showToast('Removed!', 'success');
            refresh();
        });
    }

    function escHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

    function init() {
        App.$('#fabAddWish')?.addEventListener('click', openAdd);
        App.$('#btnSaveWish')?.addEventListener('click', save);
        App.$('#wishFilterStatus')?.addEventListener('change', refresh);
    }

    document.addEventListener('DOMContentLoaded', init);
    return { refresh, edit, remove };
})();

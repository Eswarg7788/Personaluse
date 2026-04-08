/* ============================
   Recurring Items Module
   ============================ */

const Recurring = (() => {
    function init() {
        App.$('#fabAddRecurring').addEventListener('click', () => openModal());
        App.$('#btnSaveRecurring').addEventListener('click', save);
    }

    function openModal(item = null) {
        App.$('#recurringModalTitle').textContent = item ? 'Edit Recurring' : 'New Recurring Item';
        App.$('#recurringType').value = item ? item.type : 'task';
        App.$('#recurringTitle').value = item ? item.title : '';
        App.$('#recurringFrequency').value = item ? item.frequency : 'daily';
        App.$('#recurringCategory').value = item ? (item.category || 'Food') : 'Food';
        App.$('#recurringAmount').value = item ? (item.amount || '') : '';
        App.$('#recurringStartDate').value = item ? item.startDate : App.today();
        App.$('#recurringEditId').value = item ? item.id : '';
        toggleExpenseFields();
        App.openModal('recurringModal');
    }

    function toggleExpenseFields() {
        const isExpense = App.$('#recurringType').value === 'expense';
        App.$('#recurringExpenseFields').style.display = isExpense ? 'block' : 'none';
    }

    function save() {
        const title = App.$('#recurringTitle').value.trim();
        if (!title) { App.showToast('Please enter a title', 'warning'); return; }

        const items = App.getData('recurring');
        const editId = App.$('#recurringEditId').value;
        const entry = {
            type: App.$('#recurringType').value,
            title,
            frequency: App.$('#recurringFrequency').value,
            category: App.$('#recurringCategory').value,
            amount: parseFloat(App.$('#recurringAmount').value) || 0,
            startDate: App.$('#recurringStartDate').value || App.today(),
            lastGenerated: null,
            active: true
        };

        if (editId) {
            const idx = items.findIndex(i => i.id === editId);
            if (idx !== -1) items[idx] = { ...items[idx], ...entry };
            App.showToast('Updated!', 'success');
        } else {
            entry.id = App.generateId();
            items.push(entry);
            App.showToast('Recurring item created!', 'success');
        }

        App.setData('recurring', items);
        App.closeModal('recurringModal');
        refresh();
    }

    function deleteItem(id) {
        App.confirmDelete('Delete this recurring item?', () => {
            let items = App.getData('recurring');
            items = items.filter(i => i.id !== id);
            App.setData('recurring', items);
            App.showToast('Deleted', 'info');
            refresh();
        });
    }

    function toggleActive(id) {
        const items = App.getData('recurring');
        const item = items.find(i => i.id === id);
        if (item) {
            item.active = !item.active;
            App.setData('recurring', items);
            refresh();
        }
    }

    function processAll() {
        const items = App.getData('recurring').filter(i => i.active);
        const todayStr = App.today();
        let generated = 0;

        items.forEach(item => {
            if (shouldGenerate(item, todayStr)) {
                generateEntry(item, todayStr);
                item.lastGenerated = todayStr;
                generated++;
            }
        });

        if (generated > 0) {
            App.setData('recurring', App.getData('recurring').map(i => {
                const updated = items.find(u => u.id === i.id);
                return updated || i;
            }));
            App.showToast(`${generated} recurring item${generated > 1 ? 's' : ''} generated`, 'success');
        }
    }

    function shouldGenerate(item, todayStr) {
        if (!item.startDate || item.startDate > todayStr) return false;
        if (!item.lastGenerated) return true;

        const last = new Date(item.lastGenerated + 'T00:00:00');
        const today = new Date(todayStr + 'T00:00:00');
        const diffDays = Math.floor((today - last) / 86400000);

        switch (item.frequency) {
            case 'daily': return diffDays >= 1;
            case 'weekly': return diffDays >= 7;
            case 'monthly': return today.getMonth() !== last.getMonth() || today.getFullYear() !== last.getFullYear();
            default: return false;
        }
    }

    function generateEntry(item, dateStr) {
        if (item.type === 'task') {
            const tasks = App.getData('tasks');
            const exists = tasks.some(t => t.recurringId === item.id && t.date === dateStr);
            if (!exists) {
                tasks.push({
                    id: App.generateId(), title: item.title, description: `[Auto] Recurring ${item.frequency}`,
                    status: 'pending', date: dateStr, timestamp: Date.now(), recurringId: item.id
                });
                App.setData('tasks', tasks);
            }
        } else if (item.type === 'expense') {
            const expenses = App.getData('expenses');
            const exists = expenses.some(e => e.recurringId === item.id && e.date === dateStr);
            if (!exists) {
                expenses.push({
                    id: App.generateId(), amount: item.amount, category: item.category,
                    notes: `[Auto] ${item.title}`, date: dateStr, timestamp: Date.now(), recurringId: item.id
                });
                App.setData('expenses', expenses);
            }
        }
    }

    function refresh() {
        const items = App.getData('recurring');
        const container = App.$('#recurringList');

        if (items.length === 0) {
            container.innerHTML = `<div class="empty-state"><span class="material-icons-round">repeat</span><p>No recurring items. Tap + to automate your tasks & expenses!</p></div>`;
            return;
        }

        const freqLabels = { daily: '🔄 Daily', weekly: '📅 Weekly', monthly: '🗓️ Monthly' };
        const typeIcons = { task: 'task_alt', expense: 'receipt_long' };
        const typeColors = { task: '#06b6d4', expense: '#10b981' };

        container.innerHTML = items.map(i => `
            <div class="item-card ${i.active ? '' : 'recurring-inactive'}">
                <div class="item-icon" style="background:${hexToRgba(typeColors[i.type], 0.15)}">
                    <span class="material-icons-round" style="color:${typeColors[i.type]}">${typeIcons[i.type]}</span>
                </div>
                <div class="item-body">
                    <div class="item-title">${escapeHtml(i.title)}</div>
                    <div class="item-meta">
                        <span class="item-tag" style="background:rgba(99,102,241,0.15);color:#6366f1">${freqLabels[i.frequency]}</span>
                        <span class="item-tag tag-${i.type === 'task' ? 'pending' : 'completed'}">${i.type}</span>
                        ${i.amount ? `<span class="item-date">₹${i.amount.toLocaleString('en-IN')}</span>` : ''}
                    </div>
                </div>
                <div class="item-actions">
                    <button class="item-action-btn" onclick="Recurring.toggle('${i.id}')" title="${i.active ? 'Pause' : 'Resume'}">
                        <span class="material-icons-round">${i.active ? 'pause_circle' : 'play_circle'}</span>
                    </button>
                    <button class="item-action-btn" onclick="Recurring.edit('${i.id}')" title="Edit">
                        <span class="material-icons-round">edit</span>
                    </button>
                    <button class="item-action-btn btn-delete" onclick="Recurring.delete('${i.id}')" title="Delete">
                        <span class="material-icons-round">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function edit(id) {
        const item = App.getData('recurring').find(i => i.id === id);
        if (item) openModal(item);
    }

    function hexToRgba(hex, a) { const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; }
    function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }

    document.addEventListener('DOMContentLoaded', () => {
        init();
        App.$('#recurringType').addEventListener('change', toggleExpenseFields);
    });

    return { refresh, edit, delete: deleteItem, toggle: toggleActive, processAll };
})();

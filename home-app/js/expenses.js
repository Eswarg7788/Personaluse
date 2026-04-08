/* ============================
   Expenses Module
   ============================ */

const Expenses = (() => {
    const categoryEmojis = {
        Food: '🍔', Travel: '🚗', Shopping: '🛍️', Bills: '📄',
        Health: '💊', Entertainment: '🎮', Other: '📦'
    };

    const categoryColors = {
        Food: '#f97316', Travel: '#06b6d4', Shopping: '#ec4899', Bills: '#f59e0b',
        Health: '#10b981', Entertainment: '#a855f7', Other: '#64748b'
    };

    function init() {
        App.$('#fabAddExp').addEventListener('click', () => openExpModal());
        App.$('#btnSaveExp').addEventListener('click', saveExp);
        App.$('#expFilterCat').addEventListener('change', refresh);
    }

    function openExpModal(expense = null) {
        App.$('#expModalTitle').textContent = expense ? 'Edit Expense' : 'Add Expense';
        App.$('#expAmount').value = expense ? expense.amount : '';
        App.$('#expCategory').value = expense ? expense.category : 'Food';
        App.$('#expDate').value = expense ? expense.date : App.today();
        App.$('#expNotes').value = expense ? (expense.notes || '') : '';
        App.$('#expEditId').value = expense ? expense.id : '';
        App.openModal('expModal');
    }

    function saveExp() {
        const amount = parseFloat(App.$('#expAmount').value);
        if (!amount || amount <= 0) {
            App.showToast('Please enter a valid amount', 'warning');
            return;
        }

        const expenses = App.getData('expenses');
        const editId = App.$('#expEditId').value;

        const entry = {
            amount,
            category: App.$('#expCategory').value,
            date: App.$('#expDate').value || App.today(),
            notes: App.$('#expNotes').value.trim(),
            timestamp: Date.now()
        };

        if (editId) {
            const idx = expenses.findIndex(e => e.id === editId);
            if (idx !== -1) {
                expenses[idx] = { ...expenses[idx], ...entry };
            }
            App.showToast('Expense updated!', 'success');
        } else {
            entry.id = App.generateId();
            expenses.push(entry);
            App.showToast('Expense added!', 'success');
        }

        App.setData('expenses', expenses);
        App.closeModal('expModal');
        refresh();
    }

    function deleteExp(id) {
        App.confirmDelete('Delete this expense?', () => {
            let expenses = App.getData('expenses');
            expenses = expenses.filter(e => e.id !== id);
            App.setData('expenses', expenses);
            App.showToast('Expense deleted', 'info');
            refresh();
        });
    }

    function refresh() {
        const dateStr = App.$('#expFilterDate').value || App.today();
        const catFilter = App.$('#expFilterCat').value;
        const expenses = App.getData('expenses');

        // Update totals
        const dayExpenses = expenses.filter(e => e.date === dateStr);
        const dayTotal = dayExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

        const now = new Date();
        const monthStr = now.toISOString().slice(0, 7);
        const monthTotal = expenses
            .filter(e => e.date.startsWith(monthStr))
            .reduce((s, e) => s + (Number(e.amount) || 0), 0);

        App.$('#expDayTotal').textContent = `₹${dayTotal.toLocaleString('en-IN')}`;
        App.$('#expMonthTotal').textContent = `₹${monthTotal.toLocaleString('en-IN')}`;

        // Filter
        let filtered = dayExpenses;
        if (catFilter !== 'all') {
            filtered = filtered.filter(e => e.category === catFilter);
        }
        filtered.sort((a, b) => b.timestamp - a.timestamp);

        const container = App.$('#expensesList');

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons-round">receipt_long</span>
                    <p>No expenses for ${App.formatDate(dateStr)}.</p>
                </div>`;
            return;
        }

        container.innerHTML = filtered.map(e => {
            const color = categoryColors[e.category] || '#64748b';
            const emoji = categoryEmojis[e.category] || '📦';
            return `
                <div class="item-card cat-${e.category}">
                    <div class="item-icon" style="background:${hexToRgba(color, 0.15)}">
                        <span style="font-size:20px">${emoji}</span>
                    </div>
                    <div class="item-body">
                        <div class="item-title">${escapeHtml(e.notes || e.category)}</div>
                        <div class="item-meta">
                            <span class="item-tag" style="background:${hexToRgba(color, 0.15)};color:${color}">${e.category}</span>
                            <span class="item-date">${App.timeAgo(e.timestamp)}</span>
                        </div>
                    </div>
                    <span class="item-amount">₹${Number(e.amount).toLocaleString('en-IN')}</span>
                    <div class="item-actions">
                        <button class="item-action-btn" onclick="Expenses.edit('${e.id}')" title="Edit">
                            <span class="material-icons-round">edit</span>
                        </button>
                        <button class="item-action-btn btn-delete" onclick="Expenses.delete('${e.id}')" title="Delete">
                            <span class="material-icons-round">delete</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function edit(id) {
        const expenses = App.getData('expenses');
        const exp = expenses.find(e => e.id === id);
        if (exp) openExpModal(exp);
    }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    document.addEventListener('DOMContentLoaded', init);

    return { refresh, edit, delete: deleteExp };
})();

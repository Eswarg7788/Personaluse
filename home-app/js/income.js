/* ============================
   Income Tracker Module
   ============================ */
const Income = (() => {
    function refresh() {
        const list = App.$('#incomeList');
        const filter = App.$('#incomeFilterMonth')?.value || '';
        let items = App.getData('income');

        if (filter) {
            items = items.filter(i => i.date && i.date.startsWith(filter));
        }
        items.sort((a, b) => b.timestamp - a.timestamp);

        updateSummary();

        if (items.length === 0) {
            list.innerHTML = `<div class="empty-state"><span class="material-icons-round">account_balance</span><p>No income logged. Tap + to track earnings!</p></div>`;
            return;
        }

        list.innerHTML = items.map(i => `
            <div class="item-card" data-id="${i.id}">
                <div class="item-card-header">
                    <div class="item-card-left">
                        <span class="material-icons-round item-type-icon income-icon">trending_up</span>
                        <div>
                            <h4 class="item-title">${escHtml(i.source)}</h4>
                            <span class="item-meta">${App.formatDate(i.date)} • ${i.category || 'General'}</span>
                        </div>
                    </div>
                    <div class="item-right-col">
                        <span class="income-amount">+₹${Number(i.amount).toLocaleString('en-IN')}</span>
                        <div class="item-actions">
                            <button class="item-action-btn" onclick="Income.edit('${i.id}')"><span class="material-icons-round">edit</span></button>
                            <button class="item-action-btn" onclick="Income.remove('${i.id}')"><span class="material-icons-round">delete</span></button>
                        </div>
                    </div>
                </div>
                ${i.notes ? `<p class="item-body">${escHtml(i.notes)}</p>` : ''}
            </div>
        `).join('');
    }

    function updateSummary() {
        const now = new Date();
        const monthStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

        const allIncome = App.getData('income');
        const allExpenses = App.getData('expenses');

        const monthIncome = allIncome.filter(i => i.date && i.date.startsWith(monthStr)).reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const monthExpenses = allExpenses.filter(e => e.date && e.date.startsWith(monthStr)).reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const savings = monthIncome - monthExpenses;

        const incEl = App.$('#incomeMonthTotal');
        const expEl = App.$('#incomeMonthExpenses');
        const savEl = App.$('#incomeMonthSavings');

        if (incEl) incEl.textContent = `₹${monthIncome.toLocaleString('en-IN')}`;
        if (expEl) expEl.textContent = `₹${monthExpenses.toLocaleString('en-IN')}`;
        if (savEl) {
            savEl.textContent = `${savings >= 0 ? '+' : ''}₹${savings.toLocaleString('en-IN')}`;
            savEl.className = 'summary-value ' + (savings >= 0 ? 'positive' : 'negative');
        }
    }

    function openAdd() {
        App.$('#incomeModalTitle').textContent = 'Add Income';
        App.$('#incomeSource').value = '';
        App.$('#incomeAmount').value = '';
        App.$('#incomeCategory').value = 'Salary';
        App.$('#incomeDate').value = App.today();
        App.$('#incomeNotes').value = '';
        App.$('#incomeEditId').value = '';
        App.openModal('incomeModal');
    }

    function edit(id) {
        const items = App.getData('income');
        const i = items.find(x => x.id === id);
        if (!i) return;
        App.$('#incomeModalTitle').textContent = 'Edit Income';
        App.$('#incomeSource').value = i.source;
        App.$('#incomeAmount').value = i.amount;
        App.$('#incomeCategory').value = i.category || 'Salary';
        App.$('#incomeDate').value = i.date;
        App.$('#incomeNotes').value = i.notes || '';
        App.$('#incomeEditId').value = i.id;
        App.openModal('incomeModal');
    }

    function save() {
        const source = App.$('#incomeSource').value.trim();
        const amount = App.$('#incomeAmount').value;
        const category = App.$('#incomeCategory').value;
        const date = App.$('#incomeDate').value;
        const notes = App.$('#incomeNotes').value.trim();
        const editId = App.$('#incomeEditId').value;

        if (!source || !amount) { App.showToast('Please fill source and amount', 'warning'); return; }

        let items = App.getData('income');
        if (editId) {
            items = items.map(i => i.id === editId ? { ...i, source, amount, category, date, notes } : i);
            App.showToast('Income updated!', 'success');
        } else {
            items.push({ id: App.generateId(), source, amount, category, date, notes, timestamp: Date.now() });
            App.showToast('Income added!', 'success');
        }
        App.setData('income', items);
        App.closeModal('incomeModal');
        refresh();
    }

    function remove(id) {
        App.confirmDelete('Delete this income entry?', () => {
            let items = App.getData('income');
            items = items.filter(i => i.id !== id);
            App.setData('income', items);
            App.showToast('Deleted!', 'success');
            refresh();
        });
    }

    function escHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

    function init() {
        App.$('#fabAddIncome')?.addEventListener('click', openAdd);
        App.$('#btnSaveIncome')?.addEventListener('click', save);
        App.$('#incomeFilterMonth')?.addEventListener('change', refresh);
    }

    document.addEventListener('DOMContentLoaded', init);
    return { refresh, edit, remove };
})();

/* ============================
   Expense Splitter — Home App v5
   ============================ */
const Splitter = (() => {
    function getGroups() { return App.getData('splitterGroups'); }
    function saveGroups(g) { App.setData('splitterGroups', g); }

    function refresh() {
        const groups = getGroups();
        const container = document.getElementById('splitterList');
        if (!container) return;

        if (groups.length === 0) {
            container.innerHTML = `<div class="empty-state"><span class="material-icons-round">group</span><p>No split expenses yet. Tap + to split a bill!</p></div>`;
            return;
        }

        container.innerHTML = groups.map(g => {
            const total = g.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
            const perPerson = g.members.length > 0 ? (total / g.members.length) : 0;
            const settled = g.settled || [];
            return `
            <div class="item-card splitter-group-card">
                <div class="item-header">
                    <div class="item-title-row">
                        <span class="material-icons-round" style="color:#f59e0b;margin-right:8px">group</span>
                        <strong>${esc(g.name)}</strong>
                    </div>
                    <div class="item-actions">
                        <button class="item-action-btn" onclick="Splitter.openAddExpense('${g.id}')" title="Add expense"><span class="material-icons-round">add_circle</span></button>
                        <button class="item-action-btn" onclick="Splitter.remove('${g.id}')" title="Delete"><span class="material-icons-round">delete</span></button>
                    </div>
                </div>
                <div class="splitter-meta">
                    <span>👥 ${g.members.join(', ')}</span>
                    <span>💰 Total: ₹${total.toLocaleString('en-IN')}</span>
                    <span>📊 Per person: ₹${Math.round(perPerson).toLocaleString('en-IN')}</span>
                </div>
                ${g.expenses.length > 0 ? `
                <div class="splitter-expenses-list">
                    ${g.expenses.map(e => `
                        <div class="splitter-expense-row">
                            <span>${esc(e.desc)}</span>
                            <span>₹${Number(e.amount).toLocaleString('en-IN')}</span>
                            <span class="text-muted">Paid by ${esc(e.paidBy)}</span>
                        </div>
                    `).join('')}
                </div>` : ''}
                <div class="splitter-balances">
                    <strong style="font-size:12px;color:var(--text-muted)">Balances:</strong>
                    ${computeBalances(g).map(b => `
                        <div class="splitter-balance-row ${b.amount >= 0 ? 'positive' : 'negative'}">
                            <span>${esc(b.name)}</span>
                            <span>${b.amount >= 0 ? '+' : ''}₹${Math.abs(Math.round(b.amount)).toLocaleString('en-IN')}</span>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }).join('');
    }

    function computeBalances(group) {
        const total = group.expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const share = group.members.length > 0 ? total / group.members.length : 0;
        const paid = {};
        group.members.forEach(m => paid[m] = 0);
        group.expenses.forEach(e => {
            if (paid[e.paidBy] !== undefined) paid[e.paidBy] += Number(e.amount) || 0;
        });
        return group.members.map(m => ({
            name: m,
            amount: (paid[m] || 0) - share
        }));
    }

    function openAdd() {
        document.getElementById('splitterGroupName').value = '';
        document.getElementById('splitterMembers').value = '';
        document.getElementById('splitterEditId').value = '';
        App.openModal('splitterGroupModal');
    }

    function saveGroup() {
        const name = document.getElementById('splitterGroupName').value.trim();
        const membersStr = document.getElementById('splitterMembers').value.trim();
        if (!name || !membersStr) return App.showToast('Fill all fields', 'warning');
        const members = membersStr.split(',').map(m => m.trim()).filter(Boolean);
        if (members.length < 2) return App.showToast('Need at least 2 members', 'warning');

        const groups = getGroups();
        groups.push({ id: App.generateId(), name, members, expenses: [], settled: [] });
        saveGroups(groups);
        App.closeModal('splitterGroupModal');
        App.showToast('Group created!', 'success');
        refresh();
    }

    function openAddExpense(groupId) {
        const groups = getGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return;

        const select = document.getElementById('splitterPaidBy');
        select.innerHTML = group.members.map(m => `<option>${esc(m)}</option>`).join('');
        document.getElementById('splitterExpDesc').value = '';
        document.getElementById('splitterExpAmount').value = '';
        document.getElementById('splitterExpGroupId').value = groupId;
        App.openModal('splitterExpenseModal');
    }

    function saveExpense() {
        const groupId = document.getElementById('splitterExpGroupId').value;
        const desc = document.getElementById('splitterExpDesc').value.trim();
        const amount = document.getElementById('splitterExpAmount').value;
        const paidBy = document.getElementById('splitterPaidBy').value;
        if (!desc || !amount) return App.showToast('Fill all fields', 'warning');

        const groups = getGroups();
        const group = groups.find(g => g.id === groupId);
        if (!group) return;
        group.expenses.push({ id: App.generateId(), desc, amount: Number(amount), paidBy });
        saveGroups(groups);
        App.closeModal('splitterExpenseModal');
        App.showToast('Expense added!', 'success');
        refresh();
    }

    function remove(id) {
        App.confirmDelete('Delete this split group?', () => {
            const groups = getGroups().filter(g => g.id !== id);
            saveGroups(groups);
            App.showToast('Group deleted', 'success');
            refresh();
        });
    }

    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    return { refresh, openAdd, saveGroup, openAddExpense, saveExpense, remove };
})();

/* ============================
   Budget Planner Module
   ============================ */

const Budget = (() => {
    const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];
    const categoryEmojis = { Food: '🍔', Travel: '🚗', Shopping: '🛍️', Bills: '📄', Health: '💊', Entertainment: '🎮', Other: '📦' };
    const categoryColors = { Food: '#f97316', Travel: '#06b6d4', Shopping: '#ec4899', Bills: '#f59e0b', Health: '#10b981', Entertainment: '#a855f7', Other: '#64748b' };

    function init() {
        App.$('#fabSetBudget').addEventListener('click', () => openBudgetModal());
        App.$('#btnSaveBudget').addEventListener('click', saveBudget);
        const monthInput = App.$('#budgetMonthFilter');
        if (monthInput) {
            monthInput.value = new Date().toISOString().slice(0, 7);
            monthInput.addEventListener('change', refresh);
        }
    }

    function getCurrentMonth() {
        const input = App.$('#budgetMonthFilter');
        return input ? input.value : new Date().toISOString().slice(0, 7);
    }

    function getBudgets(month) {
        const all = App.getData('budgets');
        return all.filter(b => b.month === month);
    }

    function getActualSpending(month) {
        const expenses = App.getData('expenses');
        const spending = {};
        expenses.filter(e => e.date && e.date.startsWith(month)).forEach(e => {
            spending[e.category] = (spending[e.category] || 0) + (Number(e.amount) || 0);
        });
        return spending;
    }

    function openBudgetModal() {
        const month = getCurrentMonth();
        const budgets = getBudgets(month);
        let html = '';
        categories.forEach(cat => {
            const existing = budgets.find(b => b.category === cat);
            html += `
                <div class="form-group budget-cat-row">
                    <label>${categoryEmojis[cat]} ${cat}</label>
                    <input type="number" id="budgetAmt_${cat}" placeholder="₹ Limit" min="0" value="${existing ? existing.limit : ''}">
                </div>`;
        });
        App.$('#budgetCategoryInputs').innerHTML = html;
        App.$('#budgetMonthLabel').textContent = new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        App.openModal('budgetModal');
    }

    function saveBudget() {
        const month = getCurrentMonth();
        let all = App.getData('budgets').filter(b => b.month !== month);
        categories.forEach(cat => {
            const val = parseFloat(App.$(`#budgetAmt_${cat}`).value);
            if (val && val > 0) {
                all.push({ id: App.generateId(), month, category: cat, limit: val });
            }
        });
        App.setData('budgets', all);
        App.closeModal('budgetModal');
        App.showToast('Budget saved!', 'success');
        refresh();
    }

    function refresh() {
        const month = getCurrentMonth();
        const budgets = getBudgets(month);
        const spending = getActualSpending(month);
        const container = App.$('#budgetList');
        const totalBudget = budgets.reduce((s, b) => s + b.limit, 0);
        const totalSpent = Object.values(spending).reduce((s, v) => s + v, 0);

        App.$('#budgetTotalLimit').textContent = `₹${totalBudget.toLocaleString('en-IN')}`;
        App.$('#budgetTotalSpent').textContent = `₹${totalSpent.toLocaleString('en-IN')}`;
        const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
        App.$('#budgetOverallBar').style.width = overallPct + '%';
        App.$('#budgetOverallBar').style.background = overallPct > 90 ? 'var(--danger)' : overallPct > 70 ? 'var(--warning)' : 'var(--success)';

        if (budgets.length === 0) {
            container.innerHTML = `<div class="empty-state"><span class="material-icons-round">account_balance_wallet</span><p>No budget set for this month. Tap + to plan your spending!</p></div>`;
            return;
        }

        container.innerHTML = budgets.map(b => {
            const spent = spending[b.category] || 0;
            const pct = Math.min((spent / b.limit) * 100, 100);
            const over = spent > b.limit;
            const color = categoryColors[b.category] || '#64748b';
            const emoji = categoryEmojis[b.category] || '📦';
            return `
                <div class="item-card budget-card ${over ? 'budget-over' : ''}">
                    <div class="item-icon" style="background:${hexToRgba(color, 0.15)}">
                        <span style="font-size:20px">${emoji}</span>
                    </div>
                    <div class="item-body" style="flex:1">
                        <div class="budget-card-header">
                            <span class="item-title">${b.category}</span>
                            <span class="budget-amounts">₹${spent.toLocaleString('en-IN')} / ₹${b.limit.toLocaleString('en-IN')}</span>
                        </div>
                        <div class="budget-bar-track">
                            <div class="budget-bar-fill" style="width:${pct}%;background:${over ? 'var(--danger)' : color}"></div>
                        </div>
                        ${over ? `<span class="budget-over-label">⚠️ Over by ₹${(spent - b.limit).toLocaleString('en-IN')}</span>` : `<span class="budget-remaining-label">₹${(b.limit - spent).toLocaleString('en-IN')} remaining</span>`}
                    </div>
                </div>`;
        }).join('');
    }

    function getOverBudgetCategories() {
        const month = new Date().toISOString().slice(0, 7);
        const budgets = getBudgets(month);
        const spending = getActualSpending(month);
        return budgets.filter(b => (spending[b.category] || 0) > b.limit).map(b => b.category);
    }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    document.addEventListener('DOMContentLoaded', init);
    return { refresh, getOverBudgetCategories };
})();

/* ============================
   Savings Goals — Visual Savings Jars
   ============================ */
const Savings = (() => {

    function refresh() {
        const container = document.getElementById('savingsList');
        if (!container) return;
        const goals = App.getData('savingsGoals');

        // Summary
        const totalTarget = goals.reduce((s,g) => s + (Number(g.target)||0), 0);
        const totalSaved = goals.reduce((s,g) => s + (g.deposits||[]).reduce((ds,d) => ds + (Number(d.amount)||0), 0), 0);
        const overallPct = totalTarget > 0 ? Math.min(Math.round((totalSaved/totalTarget)*100), 100) : 0;

        let html = `
        <div class="savings-summary">
            <div class="savings-summary-item">
                <span class="savings-summary-label">Total Target</span>
                <span class="savings-summary-value">₹${totalTarget.toLocaleString('en-IN')}</span>
            </div>
            <div class="savings-summary-item">
                <span class="savings-summary-label">Saved</span>
                <span class="savings-summary-value positive">₹${totalSaved.toLocaleString('en-IN')}</span>
            </div>
            <div class="savings-summary-item">
                <span class="savings-summary-label">Progress</span>
                <span class="savings-summary-value">${overallPct}%</span>
            </div>
        </div>
        <div class="savings-overall-bar"><div class="savings-overall-fill" style="width:${overallPct}%"></div></div>`;

        if (goals.length === 0) {
            html += `<div class="empty-state"><span class="material-icons-round">savings</span><p>No savings goals yet. Tap + to start saving!</p></div>`;
        } else {
            html += '<div class="savings-grid">';
            goals.forEach(g => {
                const saved = (g.deposits||[]).reduce((s,d) => s + (Number(d.amount)||0), 0);
                const pct = g.target > 0 ? Math.min(Math.round((saved/g.target)*100), 100) : 0;
                const remaining = Math.max(g.target - saved, 0);
                const jarColors = ['#3b82f6','#22c55e','#f59e0b','#a855f7','#ec4899','#ef4444','#06b6d4'];
                const jarColor = g.color || jarColors[0];

                html += `
                <div class="savings-jar-card">
                    <div class="savings-jar-visual">
                        <div class="savings-jar">
                            <div class="savings-jar-fill" style="height:${pct}%; background:${jarColor}"></div>
                            <div class="savings-jar-pct">${pct}%</div>
                        </div>
                    </div>
                    <div class="savings-jar-info">
                        <h4>${escHtml(g.name)}</h4>
                        <div class="savings-jar-amounts">
                            <span>₹${saved.toLocaleString('en-IN')} / ₹${Number(g.target).toLocaleString('en-IN')}</span>
                        </div>
                        <div class="savings-jar-remaining">₹${remaining.toLocaleString('en-IN')} to go</div>
                        <div class="savings-jar-actions">
                            <button class="savings-action-btn savings-deposit-btn" onclick="Savings.addDeposit('${g.id}')">
                                <span class="material-icons-round">add</span> Deposit
                            </button>
                            <button class="savings-action-btn" onclick="Savings.editGoal('${g.id}')">
                                <span class="material-icons-round">edit</span>
                            </button>
                            <button class="savings-action-btn savings-del-btn" onclick="Savings.deleteGoal('${g.id}')">
                                <span class="material-icons-round">delete</span>
                            </button>
                        </div>
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        container.innerHTML = html;
    }

    function escHtml(str) { const d = document.createElement('div'); d.textContent = str||''; return d.innerHTML; }

    function openAdd() {
        const name = prompt('Savings goal name:');
        if (!name || !name.trim()) return;
        const target = prompt('Target amount (₹):');
        if (!target || isNaN(target)) return;

        const colors = ['#3b82f6','#22c55e','#f59e0b','#a855f7','#ec4899','#ef4444','#06b6d4'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const goals = App.getData('savingsGoals');
        goals.push({
            id: App.generateId(), name: name.trim(),
            target: parseInt(target), color, deposits: [], createdAt: Date.now()
        });
        App.setData('savingsGoals', goals);
        App.showToast('Savings goal created!', 'success');
        refresh();
    }

    function addDeposit(goalId) {
        const amount = prompt('Deposit amount (₹):');
        if (!amount || isNaN(amount) || parseInt(amount) <= 0) return;
        const goals = App.getData('savingsGoals');
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        if (!goal.deposits) goal.deposits = [];
        goal.deposits.push({ amount: parseInt(amount), date: App.today(), id: App.generateId() });
        App.setData('savingsGoals', goals);

        const saved = goal.deposits.reduce((s,d) => s + (Number(d.amount)||0), 0);
        if (saved >= goal.target) {
            App.showToast(`🎉 Goal "${goal.name}" reached!`, 'success');
        } else {
            App.showToast(`₹${parseInt(amount).toLocaleString('en-IN')} deposited!`, 'success');
        }
        refresh();
    }

    function editGoal(id) {
        const goals = App.getData('savingsGoals');
        const goal = goals.find(g => g.id === id);
        if (!goal) return;
        const name = prompt('Edit goal name:', goal.name);
        if (name === null) return;
        const target = prompt('Edit target amount:', goal.target);
        if (target === null) return;
        if (name.trim()) goal.name = name.trim();
        if (!isNaN(target) && parseInt(target) > 0) goal.target = parseInt(target);
        App.setData('savingsGoals', goals);
        App.showToast('Goal updated!', 'success');
        refresh();
    }

    function deleteGoal(id) {
        App.confirmDelete('Delete this savings goal?', () => {
            let goals = App.getData('savingsGoals');
            goals = goals.filter(g => g.id !== id);
            App.setData('savingsGoals', goals);
            App.showToast('Goal deleted', 'info');
            refresh();
        });
    }

    return { refresh, openAdd, addDeposit, editGoal, deleteGoal };
})();

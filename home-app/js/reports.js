/* ============================
   Reports Module
   ============================ */

const Reports = (() => {
    function init() {
        App.$('#reportPeriod').addEventListener('change', refresh);
    }

    function refresh() {
        const period = App.$('#reportPeriod').value;
        const container = App.$('#reportsContent');
        const { startDate, endDate, label } = getDateRange(period);

        App.$('#reportRangeLabel').textContent = label;

        const tasks = App.getData('tasks').filter(t => t.date >= startDate && t.date <= endDate);
        const expenses = App.getData('expenses').filter(e => e.date >= startDate && e.date <= endDate);
        const income = App.getData('income').filter(i => i.date >= startDate && i.date <= endDate);
        const notes = App.getData('notes').filter(n => n.date >= startDate && n.date <= endDate);
        const habits = App.getData('habits');

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const totalIncome = income.reduce((s, i) => s + (Number(i.amount) || 0), 0);
        const savings = totalIncome - totalExpenses;

        // Expense by category
        const expByCat = {};
        expenses.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + (Number(e.amount) || 0); });
        const topCategory = Object.entries(expByCat).sort((a, b) => b[1] - a[1])[0];

        // Habit streaks
        let habitStats = '';
        if (habits.length > 0) {
            const habitData = habits.map(h => {
                let checked = 0;
                const log = h.log || {};
                let d = new Date(startDate + 'T00:00:00');
                const end = new Date(endDate + 'T00:00:00');
                let totalDays = 0;
                while (d <= end) {
                    totalDays++;
                    if (log[d.toISOString().split('T')[0]]) checked++;
                    d.setDate(d.getDate() + 1);
                }
                return { name: h.name, pct: totalDays > 0 ? Math.round((checked / totalDays) * 100) : 0 };
            });
            habitStats = habitData.map(h => `
                <div class="report-habit-row">
                    <span>${escapeHtml(h.name)}</span>
                    <div class="report-habit-bar-track"><div class="report-habit-bar-fill" style="width:${h.pct}%"></div></div>
                    <span class="report-habit-pct">${h.pct}%</span>
                </div>
            `).join('');
        }

        // Mood distribution
        const moodCounts = {};
        notes.forEach(n => { if (n.mood) moodCounts[n.mood] = (moodCounts[n.mood] || 0) + 1; });
        const moodHtml = Object.entries(moodCounts).map(([mood, count]) => 
            `<span class="report-mood-chip">${mood} × ${count}</span>`
        ).join('') || '<span class="text-muted">No entries</span>';

        container.innerHTML = `
            <div class="report-stats-grid">
                <div class="report-stat-card stat-blue">
                    <span class="material-icons-round">task_alt</span>
                    <div class="report-stat-value">${completedTasks}/${totalTasks}</div>
                    <div class="report-stat-label">Tasks Completed</div>
                    <div class="report-stat-bar"><div style="width:${totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0}%"></div></div>
                </div>
                <div class="report-stat-card stat-green">
                    <span class="material-icons-round">account_balance_wallet</span>
                    <div class="report-stat-value">₹${totalExpenses.toLocaleString('en-IN')}</div>
                    <div class="report-stat-label">Total Spent</div>
                </div>
                <div class="report-stat-card stat-emerald">
                    <span class="material-icons-round">trending_up</span>
                    <div class="report-stat-value">₹${totalIncome.toLocaleString('en-IN')}</div>
                    <div class="report-stat-label">Total Income</div>
                </div>
                <div class="report-stat-card ${savings >= 0 ? 'stat-teal' : 'stat-red'}">
                    <span class="material-icons-round">${savings >= 0 ? 'savings' : 'money_off'}</span>
                    <div class="report-stat-value">₹${Math.abs(savings).toLocaleString('en-IN')}</div>
                    <div class="report-stat-label">${savings >= 0 ? 'Saved' : 'Overspent'}</div>
                </div>
            </div>

            ${topCategory ? `
            <div class="report-section">
                <h3>💰 Top Spending: ${topCategory[0]}</h3>
                <p class="text-muted">₹${topCategory[1].toLocaleString('en-IN')} spent on ${topCategory[0]}</p>
                <div class="report-cat-bars">
                    ${Object.entries(expByCat).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                        const pct = (amt / totalExpenses * 100).toFixed(0);
                        return `<div class="report-cat-row">
                            <span>${cat}</span>
                            <div class="report-cat-bar-track"><div class="report-cat-bar-fill" style="width:${pct}%"></div></div>
                            <span>₹${amt.toLocaleString('en-IN')}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>` : ''}

            ${habitStats ? `
            <div class="report-section">
                <h3>💪 Habit Consistency</h3>
                ${habitStats}
            </div>` : ''}

            <div class="report-section">
                <h3>😊 Mood Tracker</h3>
                <div class="report-mood-grid">${moodHtml}</div>
            </div>
        `;
    }

    function getDateRange(period) {
        const now = new Date();
        const todayStr = App.today();
        if (period === 'week') {
            const start = new Date(now);
            start.setDate(now.getDate() - now.getDay());
            return { startDate: start.toISOString().split('T')[0], endDate: todayStr, label: 'This Week' };
        } else if (period === 'month') {
            const start = new Date(now.getFullYear(), now.getMonth(), 1);
            return { startDate: start.toISOString().split('T')[0], endDate: todayStr, label: now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) };
        } else {
            const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const end = new Date(now.getFullYear(), now.getMonth(), 0);
            return { startDate: start.toISOString().split('T')[0], endDate: end.toISOString().split('T')[0], label: 'Last Month' };
        }
    }

    function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }

    document.addEventListener('DOMContentLoaded', init);
    return { refresh };
})();

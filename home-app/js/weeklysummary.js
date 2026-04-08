/* ============================
   Weekly Summary — Auto-generated stats card
   ============================ */
const WeeklySummary = (() => {

    function refresh() {
        const container = document.getElementById('weeklySummaryCard');
        if (!container) return;

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // Sunday
        const weekStartStr = weekStart.toISOString().split('T')[0];

        const tasks = App.getData('tasks');
        const expenses = App.getData('expenses');

        // Tasks completed this week
        const weekTasks = tasks.filter(t => t.date >= weekStartStr && t.status === 'completed').length;
        const totalWeekTasks = tasks.filter(t => t.date >= weekStartStr).length;

        // Expenses this week
        const weekExpenses = expenses
            .filter(e => e.date >= weekStartStr)
            .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        // Habits done this week
        let habitsDone = 0;
        let habitsTotal = 0;
        if (typeof Habits !== 'undefined') {
            const habits = Habits.getHabits();
            const checkins = Habits.getCheckins();
            for (let d = 0; d <= now.getDay(); d++) {
                const dayDate = new Date(weekStart);
                dayDate.setDate(weekStart.getDate() + d);
                const dayStr = dayDate.toISOString().split('T')[0];
                habits.forEach(h => {
                    habitsTotal++;
                    if (checkins[`${h.id}_${dayStr}`]) habitsDone++;
                });
            }
        }
        const habitPct = habitsTotal > 0 ? Math.round((habitsDone / habitsTotal) * 100) : 0;

        // Streak
        const streak = typeof Greeting !== 'undefined' ? (document.getElementById('streakCount')?.textContent || '1') : '1';

        container.innerHTML = `
            <div class="weekly-summary-inner">
                <div class="weekly-summary-title">
                    <span class="material-icons-round">date_range</span>
                    This Week's Progress
                </div>
                <div class="weekly-summary-stats">
                    <div class="ws-stat">
                        <span class="ws-stat-value c-tasks">${weekTasks}/${totalWeekTasks}</span>
                        <span class="ws-stat-label">Tasks</span>
                    </div>
                    <div class="ws-stat">
                        <span class="ws-stat-value c-expenses">₹${formatNum(weekExpenses)}</span>
                        <span class="ws-stat-label">Spent</span>
                    </div>
                    <div class="ws-stat">
                        <span class="ws-stat-value c-habits">${habitPct}%</span>
                        <span class="ws-stat-label">Habits</span>
                    </div>
                    <div class="ws-stat">
                        <span class="ws-stat-value c-streak">${streak}🔥</span>
                        <span class="ws-stat-label">Streak</span>
                    </div>
                </div>
            </div>
        `;
    }

    function formatNum(n) {
        if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
        if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
        return n.toLocaleString('en-IN');
    }

    return { refresh };
})();

/* ============================
   Dashboard Module
   ============================ */

const Dashboard = (() => {
    function refresh() {
        updateSummaryCards();
        updateHabitsQuick();
        updateActivityList();
        updateQuickChart();
        if (typeof WeeklySummary !== 'undefined') WeeklySummary.refresh();
        if (typeof Greeting !== 'undefined') Greeting.refresh();
        if (typeof ExpensePresets !== 'undefined') ExpensePresets.refresh();
    }

    function updateSummaryCards() {
        const todayStr = App.today();
        const tasks = App.getData('tasks');
        const messages = App.getData('messages');
        const expenses = App.getData('expenses');

        const todayTasks = tasks.filter(t => t.date === todayStr);
        const completed = todayTasks.filter(t => t.status === 'completed').length;
        const pending = todayTasks.filter(t => t.status !== 'completed').length;
        const msgCount = messages.filter(m => m.date === todayStr).reduce((sum, m) => sum + (Number(m.count) || 0), 0);
        const expTotal = expenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        animateCounter('dashTasksDone', completed);
        animateCounter('dashTasksPending', pending);
        animateCounter('dashMessages', msgCount);
        App.$('#dashExpenses').textContent = `₹${expTotal.toLocaleString('en-IN')}`;
    }

    function animateCounter(id, target) {
        const el = App.$(`#${id}`);
        const start = parseInt(el.textContent) || 0;
        if (start === target) return;

        const duration = 500;
        const startTime = performance.now();

        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(start + (target - start) * eased);
            if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
    }

    function updateHabitsQuick() {
        const container = App.$('#dashHabitsQuick');
        if (!container) return;

        if (typeof Habits === 'undefined') {
            container.innerHTML = '';
            return;
        }

        const habits = Habits.getHabits();
        const checkins = Habits.getCheckins();
        const todayStr = App.today();

        if (habits.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">No habits tracked yet.</p>';
            return;
        }

        let html = '<div class="dash-habits-row">';
        habits.forEach(h => {
            const isChecked = !!checkins[`${h.id}_${todayStr}`];
            html += `
                <div class="dash-habit-chip ${isChecked ? 'checked' : ''}" style="--chip-color: ${h.color}">
                    <span class="material-icons-round" style="font-size: 16px;">${h.icon}</span>
                    <span class="dash-habit-name">${escapeHtml(h.name)}</span>
                    ${isChecked ? '<span class="material-icons-round check-mark">check</span>' : ''}
                </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
    }

    function updateActivityList() {
        const container = App.$('#activityList');
        const allItems = [];

        // Gather recent items
        App.getData('tasks').forEach(t => {
            allItems.push({
                type: 'task',
                icon: 'task_alt',
                title: t.title,
                meta: t.status,
                timestamp: t.timestamp || 0
            });
        });

        App.getData('messages').forEach(m => {
            allItems.push({
                type: 'message',
                icon: 'chat',
                title: `${m.count} msg${m.count > 1 ? 's' : ''} to ${m.recipient}`,
                meta: m.purpose,
                timestamp: m.timestamp || 0
            });
        });

        App.getData('expenses').forEach(e => {
            allItems.push({
                type: 'expense',
                icon: 'receipt_long',
                title: `₹${Number(e.amount).toLocaleString('en-IN')} — ${e.category}`,
                meta: e.notes || e.category,
                timestamp: e.timestamp || 0
            });
        });

        App.getData('reminders').forEach(r => {
            allItems.push({
                type: 'reminder',
                icon: 'event_note',
                title: r.title,
                meta: `Due: ${App.formatDateShort(r.deadline)}`,
                timestamp: r.timestamp || 0
            });
        });

        // Sort by timestamp, newest first, take 8
        allItems.sort((a, b) => b.timestamp - a.timestamp);
        const recent = allItems.slice(0, 8);

        if (recent.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons-round">history</span>
                    <p>No activity yet. Start adding tasks, messages, or expenses!</p>
                </div>`;
            return;
        }

        container.innerHTML = recent.map(item => `
            <div class="activity-item">
                <div class="activity-icon type-${item.type}">
                    <span class="material-icons-round">${item.icon}</span>
                </div>
                <div class="activity-info">
                    <div class="activity-title">${escapeHtml(item.title)}</div>
                    <div class="activity-meta">${escapeHtml(item.meta)}</div>
                </div>
                <span class="activity-time">${App.timeAgo(item.timestamp)}</span>
            </div>
        `).join('');
    }

    function updateQuickChart() {
        const canvas = App.$('#dashExpenseChart');
        if (!canvas) return;

        // Last 7 days expenses
        const labels = [];
        const data = [];
        const expenses = App.getData('expenses');

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));
            const dayTotal = expenses.filter(e => e.date === dateStr).reduce((s, e) => s + (Number(e.amount) || 0), 0);
            data.push(dayTotal);
        }

        if (window._dashChart) window._dashChart.destroy();

        window._dashChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Expenses (₹)',
                    data,
                    backgroundColor: 'rgba(6, 182, 212, 0.4)',
                    borderColor: '#06b6d4',
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                },
                scales: {
                    x: {
                        ticks: { color: '#64748b', font: { size: 11 } },
                        grid: { display: false },
                        border: { display: false }
                    },
                    y: {
                        ticks: { color: '#64748b', font: { size: 11 }, callback: v => '₹' + v },
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        border: { display: false },
                        beginAtZero: true,
                    }
                }
            }
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    return { refresh };
})();

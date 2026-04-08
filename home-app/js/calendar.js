/* ============================
   Calendar View Module
   ============================ */

const Calendar = (() => {
    let currentYear, currentMonth;

    function init() {
        const now = new Date();
        currentYear = now.getFullYear();
        currentMonth = now.getMonth();

        const prevBtn = App.$('#calPrev');
        const nextBtn = App.$('#calNext');
        if (prevBtn) prevBtn.addEventListener('click', () => { navigateMonth(-1); });
        if (nextBtn) nextBtn.addEventListener('click', () => { navigateMonth(1); });
    }

    function navigateMonth(delta) {
        currentMonth += delta;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        refresh();
    }

    function refresh() {
        if (currentYear === undefined) {
            const now = new Date();
            currentYear = now.getFullYear();
            currentMonth = now.getMonth();
        }

        renderCalendar();
        showDayDetail(App.today());
    }

    function renderCalendar() {
        const grid = App.$('#calendarGrid');
        const title = App.$('#calMonthTitle');
        if (!grid || !title) return;

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        title.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const todayStr = App.today();

        // Gather all data for the month
        const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const tasks = App.getData('tasks').filter(t => t.date && t.date.startsWith(monthKey));
        const expenses = App.getData('expenses').filter(e => e.date && e.date.startsWith(monthKey));
        const reminders = App.getData('reminders').filter(r => r.deadline && r.deadline.startsWith(monthKey));
        const habitCheckins = typeof Habits !== 'undefined' ? Habits.getCheckins() : {};
        const habits = typeof Habits !== 'undefined' ? Habits.getHabits() : [];

        // Build data map per day
        const dayData = {};
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            dayData[d] = {
                tasks: tasks.filter(t => t.date === dateStr).length,
                expenses: expenses.filter(e => e.date === dateStr).length,
                reminders: reminders.filter(r => r.deadline === dateStr).length,
                habits: habits.filter(h => habitCheckins[`${h.id}_${dateStr}`]).length
            };
        }

        // Day labels
        let html = '<div class="cal-day-labels">';
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(d => {
            html += `<span class="cal-day-label">${d}</span>`;
        });
        html += '</div><div class="cal-days">';

        // Empty cells before first day
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="cal-cell empty"></div>';
        }

        // Day cells
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = dateStr === todayStr;
            const dd = dayData[d];
            const hasDots = dd.tasks > 0 || dd.expenses > 0 || dd.reminders > 0 || dd.habits > 0;

            html += `<div class="cal-cell ${isToday ? 'today' : ''} ${hasDots ? 'has-data' : ''}" data-date="${dateStr}">
                <span class="cal-date-num">${d}</span>
                <div class="cal-dots">
                    ${dd.tasks > 0 ? '<span class="cal-dot dot-task"></span>' : ''}
                    ${dd.expenses > 0 ? '<span class="cal-dot dot-expense"></span>' : ''}
                    ${dd.reminders > 0 ? '<span class="cal-dot dot-reminder"></span>' : ''}
                    ${dd.habits > 0 ? '<span class="cal-dot dot-habit"></span>' : ''}
                </div>
            </div>`;
        }

        html += '</div>';
        grid.innerHTML = html;

        // Bind day click
        grid.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
            cell.addEventListener('click', () => {
                grid.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');
                showDayDetail(cell.dataset.date);
            });
        });
    }

    function showDayDetail(dateStr) {
        const panel = App.$('#calDayDetail');
        if (!panel) return;

        const tasks = App.getData('tasks').filter(t => t.date === dateStr);
        const expenses = App.getData('expenses').filter(e => e.date === dateStr);
        const reminders = App.getData('reminders').filter(r => r.deadline === dateStr);
        const messages = App.getData('messages').filter(m => m.date === dateStr);

        const d = new Date(dateStr + 'T00:00:00');
        const dateLabel = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

        let html = `<h3 class="cal-detail-title">${dateLabel}</h3>`;

        const totalItems = tasks.length + expenses.length + reminders.length + messages.length;

        if (totalItems === 0) {
            html += '<p class="cal-detail-empty">No events on this day</p>';
        } else {
            if (tasks.length > 0) {
                html += '<div class="cal-detail-section">';
                html += '<span class="cal-detail-label"><span class="cal-dot dot-task"></span> Tasks</span>';
                tasks.forEach(t => {
                    html += `<div class="cal-detail-item">
                        <span class="material-icons-round" style="color: var(--accent); font-size: 16px;">task_alt</span>
                        <span>${escapeHtml(t.title)}</span>
                        <span class="item-tag tag-${t.status}">${t.status}</span>
                    </div>`;
                });
                html += '</div>';
            }

            if (expenses.length > 0) {
                const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
                html += '<div class="cal-detail-section">';
                html += `<span class="cal-detail-label"><span class="cal-dot dot-expense"></span> Expenses — ₹${total.toLocaleString('en-IN')}</span>`;
                expenses.forEach(e => {
                    html += `<div class="cal-detail-item">
                        <span class="material-icons-round" style="color: var(--success); font-size: 16px;">receipt_long</span>
                        <span>₹${Number(e.amount).toLocaleString('en-IN')} — ${e.category}</span>
                    </div>`;
                });
                html += '</div>';
            }

            if (reminders.length > 0) {
                html += '<div class="cal-detail-section">';
                html += '<span class="cal-detail-label"><span class="cal-dot dot-reminder"></span> Reminders</span>';
                reminders.forEach(r => {
                    html += `<div class="cal-detail-item">
                        <span class="material-icons-round" style="color: var(--warning); font-size: 16px;">event_note</span>
                        <span>${escapeHtml(r.title)}</span>
                    </div>`;
                });
                html += '</div>';
            }

            if (messages.length > 0) {
                html += '<div class="cal-detail-section">';
                html += '<span class="cal-detail-label"><span class="cal-dot dot-task" style="background: var(--purple)"></span> Messages</span>';
                messages.forEach(m => {
                    html += `<div class="cal-detail-item">
                        <span class="material-icons-round" style="color: var(--purple); font-size: 16px;">chat</span>
                        <span>${m.count} msg to ${escapeHtml(m.recipient)}</span>
                    </div>`;
                });
                html += '</div>';
            }
        }

        panel.innerHTML = html;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    document.addEventListener('DOMContentLoaded', init);

    return { refresh };
})();

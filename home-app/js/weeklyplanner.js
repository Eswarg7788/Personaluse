/* ============================
   Weekly Planner — Hour-by-Hour View
   ============================ */
const WeeklyPlanner = (() => {
    let weekOffset = 0;
    const HOURS = [];
    for (let h = 6; h <= 23; h++) HOURS.push(h);

    function getWeekDays(offset) {
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + (offset * 7));
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            days.push(d);
        }
        return days;
    }

    function refresh() {
        const container = document.getElementById('weeklyPlannerContent');
        if (!container) return;
        const blocks = App.getData('timeblocks');
        const days = getWeekDays(weekOffset);
        const todayStr = App.today();

        const weekLabel = `${days[0].toLocaleDateString('en-IN',{day:'numeric',month:'short'})} — ${days[6].toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}`;

        let html = `
        <div class="wp-nav">
            <button class="wp-nav-btn" id="wpPrev"><span class="material-icons-round">chevron_left</span></button>
            <span class="wp-week-label">${weekLabel}</span>
            <button class="wp-nav-btn" id="wpNext"><span class="material-icons-round">chevron_right</span></button>
            <button class="wp-nav-btn wp-today-btn" id="wpToday">Today</button>
        </div>
        <div class="wp-grid-wrapper">
            <div class="wp-grid">
                <div class="wp-time-col">
                    <div class="wp-header-cell"></div>
                    ${HOURS.map(h => `<div class="wp-time-cell">${formatHour(h)}</div>`).join('')}
                </div>
                ${days.map(d => {
                    const ds = d.toISOString().split('T')[0];
                    const isToday = ds === todayStr;
                    const dayBlocks = blocks.filter(b => b.date === ds);
                    return `
                    <div class="wp-day-col ${isToday ? 'wp-today' : ''}">
                        <div class="wp-header-cell">
                            <span class="wp-day-name">${d.toLocaleDateString('en-IN',{weekday:'short'})}</span>
                            <span class="wp-day-num${isToday ? ' wp-today-num' : ''}">${d.getDate()}</span>
                        </div>
                        ${HOURS.map(h => {
                            const block = dayBlocks.find(b => b.hour === h);
                            if (block) {
                                return `
                                <div class="wp-slot wp-slot-filled" style="--block-color:${block.color||'var(--accent)'}"
                                     onclick="WeeklyPlanner.editBlock('${block.id}')" title="${escHtml(block.title)}">
                                    <span class="wp-slot-title">${escHtml(block.title)}</span>
                                    <button class="wp-slot-del" onclick="event.stopPropagation(); WeeklyPlanner.deleteBlock('${block.id}')">×</button>
                                </div>`;
                            }
                            return `<div class="wp-slot" onclick="WeeklyPlanner.addBlock('${ds}', ${h})"></div>`;
                        }).join('')}
                    </div>`;
                }).join('')}
            </div>
        </div>`;

        container.innerHTML = html;

        document.getElementById('wpPrev').addEventListener('click', () => { weekOffset--; refresh(); });
        document.getElementById('wpNext').addEventListener('click', () => { weekOffset++; refresh(); });
        document.getElementById('wpToday').addEventListener('click', () => { weekOffset = 0; refresh(); });
    }

    function formatHour(h) {
        if (h === 0) return '12 AM';
        if (h < 12) return h + ' AM';
        if (h === 12) return '12 PM';
        return (h - 12) + ' PM';
    }

    function escHtml(str) { const d = document.createElement('div'); d.textContent = str||''; return d.innerHTML; }

    function addBlock(date, hour) {
        const title = prompt(`Add time block for ${formatHour(hour)}:`);
        if (!title || !title.trim()) return;

        const colors = ['#3b82f6','#ef4444','#22c55e','#f59e0b','#a855f7','#ec4899','#06b6d4'];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const blocks = App.getData('timeblocks');
        blocks.push({
            id: App.generateId(), date, hour, title: title.trim(), color, createdAt: Date.now()
        });
        App.setData('timeblocks', blocks);
        App.showToast('Time block added!', 'success');
        refresh();
    }

    function editBlock(id) {
        const blocks = App.getData('timeblocks');
        const block = blocks.find(b => b.id === id);
        if (!block) return;
        const newTitle = prompt('Edit time block:', block.title);
        if (newTitle === null) return;
        if (!newTitle.trim()) {
            deleteBlock(id);
            return;
        }
        block.title = newTitle.trim();
        App.setData('timeblocks', blocks);
        App.showToast('Updated!', 'success');
        refresh();
    }

    function deleteBlock(id) {
        let blocks = App.getData('timeblocks');
        blocks = blocks.filter(b => b.id !== id);
        App.setData('timeblocks', blocks);
        App.showToast('Removed', 'info');
        refresh();
    }

    return { refresh, addBlock, editBlock, deleteBlock };
})();

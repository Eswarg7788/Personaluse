/* ============================
   Goals Tracker Module
   ============================ */
const Goals = (() => {
    function refresh() {
        const list = App.$('#goalsList');
        const filter = App.$('#goalFilterStatus')?.value || 'all';
        let goals = App.getData('goals');
        if (filter !== 'all') goals = goals.filter(g => g.status === filter);
        goals.sort((a, b) => b.timestamp - a.timestamp);

        if (goals.length === 0) {
            list.innerHTML = `<div class="empty-state"><span class="material-icons-round">flag</span><p>No goals set. Tap + to dream big!</p></div>`;
            return;
        }

        list.innerHTML = goals.map(g => {
            const milestones = g.milestones || [];
            const done = milestones.filter(m => m.done).length;
            const total = milestones.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const statusClass = g.status === 'completed' ? 'status-completed' : g.status === 'paused' ? 'status-paused' : 'status-active';

            return `
            <div class="item-card goal-card" data-id="${g.id}">
                <div class="item-card-header">
                    <div class="item-card-left">
                        <span class="goal-status-dot ${statusClass}"></span>
                        <div>
                            <h4 class="item-title">${escHtml(g.title)}</h4>
                            <span class="item-meta">${g.targetDate ? 'Target: ' + App.formatDateShort(g.targetDate) : 'No deadline'}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="item-action-btn" onclick="Goals.edit('${g.id}')"><span class="material-icons-round">edit</span></button>
                        <button class="item-action-btn" onclick="Goals.remove('${g.id}')"><span class="material-icons-round">delete</span></button>
                    </div>
                </div>
                ${g.description ? `<p class="item-body">${escHtml(g.description)}</p>` : ''}
                <div class="goal-progress">
                    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                    <span class="progress-text">${pct}% (${done}/${total})</span>
                </div>
                <div class="milestone-list">
                    ${milestones.map((m, i) => `
                        <label class="milestone-item ${m.done ? 'done' : ''}" onclick="Goals.toggleMilestone('${g.id}', ${i})">
                            <span class="material-icons-round">${m.done ? 'check_circle' : 'radio_button_unchecked'}</span>
                            <span>${escHtml(m.text)}</span>
                        </label>
                    `).join('')}
                </div>
            </div>`;
        }).join('');
    }

    function openAdd() {
        App.$('#goalModalTitle').textContent = 'New Goal';
        App.$('#goalTitle').value = '';
        App.$('#goalDesc').value = '';
        App.$('#goalTargetDate').value = '';
        App.$('#goalStatus').value = 'active';
        App.$('#goalMilestones').value = '';
        App.$('#goalEditId').value = '';
        App.openModal('goalModal');
    }

    function edit(id) {
        const goals = App.getData('goals');
        const g = goals.find(x => x.id === id);
        if (!g) return;
        App.$('#goalModalTitle').textContent = 'Edit Goal';
        App.$('#goalTitle').value = g.title;
        App.$('#goalDesc').value = g.description || '';
        App.$('#goalTargetDate').value = g.targetDate || '';
        App.$('#goalStatus').value = g.status;
        App.$('#goalMilestones').value = (g.milestones || []).map(m => m.text).join('\n');
        App.$('#goalEditId').value = g.id;
        App.openModal('goalModal');
    }

    function save() {
        const title = App.$('#goalTitle').value.trim();
        const description = App.$('#goalDesc').value.trim();
        const targetDate = App.$('#goalTargetDate').value;
        const status = App.$('#goalStatus').value;
        const milestonesText = App.$('#goalMilestones').value.trim();
        const editId = App.$('#goalEditId').value;

        if (!title) { App.showToast('Please enter a goal title', 'warning'); return; }

        const newMilestones = milestonesText ? milestonesText.split('\n').filter(t => t.trim()).map(t => ({ text: t.trim(), done: false })) : [];

        let goals = App.getData('goals');
        if (editId) {
            goals = goals.map(g => {
                if (g.id !== editId) return g;
                // Preserve done state of existing milestones
                const oldMilestones = g.milestones || [];
                const merged = newMilestones.map(nm => {
                    const existing = oldMilestones.find(om => om.text === nm.text);
                    return existing ? existing : nm;
                });
                return { ...g, title, description, targetDate, status, milestones: merged };
            });
            App.showToast('Goal updated!', 'success');
        } else {
            goals.push({ id: App.generateId(), title, description, targetDate, status, milestones: newMilestones, timestamp: Date.now() });
            App.showToast('Goal created!', 'success');
        }
        App.setData('goals', goals);
        App.closeModal('goalModal');
        refresh();
    }

    function toggleMilestone(goalId, index) {
        let goals = App.getData('goals');
        goals = goals.map(g => {
            if (g.id !== goalId) return g;
            const milestones = [...(g.milestones || [])];
            if (milestones[index]) milestones[index].done = !milestones[index].done;
            return { ...g, milestones };
        });
        App.setData('goals', goals);
        refresh();
    }

    function remove(id) {
        App.confirmDelete('Delete this goal?', () => {
            let goals = App.getData('goals');
            goals = goals.filter(g => g.id !== id);
            App.setData('goals', goals);
            App.showToast('Goal deleted', 'success');
            refresh();
        });
    }

    function escHtml(str) {
        const d = document.createElement('div'); d.textContent = str; return d.innerHTML;
    }

    function init() {
        App.$('#fabAddGoal')?.addEventListener('click', openAdd);
        App.$('#btnSaveGoal')?.addEventListener('click', save);
        App.$('#goalFilterStatus')?.addEventListener('change', refresh);
    }

    document.addEventListener('DOMContentLoaded', init);
    return { refresh, edit, remove, toggleMilestone };
})();

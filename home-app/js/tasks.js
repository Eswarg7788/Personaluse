/* ============================
   Tasks Module
   ============================ */

const Tasks = (() => {
    function init() {
        App.$('#fabAddTask').addEventListener('click', () => openTaskModal());
        App.$('#btnSaveTask').addEventListener('click', saveTask);

        App.$('#taskFilterStatus').addEventListener('change', refresh);
        App.$('#btnSaveNotes').addEventListener('click', saveNotes);

        // Load notes for today
        loadNotes();
    }

    function openTaskModal(task = null) {
        App.$('#taskModalTitle').textContent = task ? 'Edit Task' : 'Add Task';
        App.$('#taskTitle').value = task ? task.title : '';
        App.$('#taskDesc').value = task ? task.description : '';
        App.$('#taskStatus').value = task ? task.status : 'pending';
        App.$('#taskDate').value = task ? task.date : App.today();
        App.$('#taskEditId').value = task ? task.id : '';
        App.openModal('taskModal');
    }

    function saveTask() {
        const title = App.$('#taskTitle').value.trim();
        if (!title) {
            App.showToast('Please enter a task title', 'warning');
            return;
        }

        const tasks = App.getData('tasks');
        const editId = App.$('#taskEditId').value;

        if (editId) {
            const idx = tasks.findIndex(t => t.id === editId);
            if (idx !== -1) {
                tasks[idx].title = title;
                tasks[idx].description = App.$('#taskDesc').value.trim();
                tasks[idx].status = App.$('#taskStatus').value;
                tasks[idx].date = App.$('#taskDate').value || App.today();
                tasks[idx].timestamp = Date.now();
            }
            App.showToast('Task updated!', 'success');
        } else {
            tasks.push({
                id: App.generateId(),
                title,
                description: App.$('#taskDesc').value.trim(),
                status: App.$('#taskStatus').value,
                date: App.$('#taskDate').value || App.today(),
                timestamp: Date.now()
            });
            App.showToast('Task added!', 'success');
        }

        App.setData('tasks', tasks);
        App.closeModal('taskModal');
        refresh();
    }

    function deleteTask(id) {
        App.confirmDelete('Are you sure you want to delete this task?', () => {
            let tasks = App.getData('tasks');
            tasks = tasks.filter(t => t.id !== id);
            App.setData('tasks', tasks);
            App.showToast('Task deleted', 'info');
            refresh();
        });
    }

    function toggleStatus(id) {
        const tasks = App.getData('tasks');
        const task = tasks.find(t => t.id === id);
        if (task) {
            const order = ['pending', 'in-progress', 'completed'];
            const curIdx = order.indexOf(task.status);
            task.status = order[(curIdx + 1) % order.length];
            task.timestamp = Date.now();
            App.setData('tasks', tasks);
            refresh();
        }
    }

    function saveNotes() {
        const dateStr = App.$('#taskFilterDate').value || App.today();
        const notes = App.$('#dailyNotes').value;
        App.setSetting(`notes_${dateStr}`, notes);
        App.showToast('Notes saved!', 'success');
    }

    function loadNotes() {
        const dateStr = App.$('#taskFilterDate').value || App.today();
        const notes = App.getSetting(`notes_${dateStr}`) || '';
        App.$('#dailyNotes').value = notes;
    }

    function refresh() {
        const dateStr = App.$('#taskFilterDate').value || App.today();
        const statusFilter = App.$('#taskFilterStatus').value;
        const tasks = App.getData('tasks');

        loadNotes();

        let filtered = tasks.filter(t => t.date === dateStr);
        if (statusFilter !== 'all') {
            filtered = filtered.filter(t => t.status === statusFilter);
        }

        filtered.sort((a, b) => b.timestamp - a.timestamp);

        const container = App.$('#tasksList');

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons-round">checklist</span>
                    <p>No tasks for ${App.formatDate(dateStr)}. Tap + to add one!</p>
                </div>`;
            return;
        }

        const statusIcons = {
            completed: 'check_circle',
            pending: 'radio_button_unchecked',
            'in-progress': 'timelapse'
        };

        const statusColors = {
            completed: 'rgba(16,185,129,0.15)',
            pending: 'rgba(245,158,11,0.15)',
            'in-progress': 'rgba(6,182,212,0.15)'
        };

        const statusIconColors = {
            completed: '#10b981',
            pending: '#f59e0b',
            'in-progress': '#06b6d4'
        };

        container.innerHTML = filtered.map(t => {
            const cardHtml = `
            <div class="item-card status-${t.status}">
                <div class="item-icon" style="background:${statusColors[t.status]}" onclick="Tasks.toggleStatus('${t.id}')" title="Click to change status">
                    <span class="material-icons-round" style="color:${statusIconColors[t.status]}">${statusIcons[t.status]}</span>
                </div>
                <div class="item-body">
                    <div class="item-title">${escapeHtml(t.title)}</div>
                    ${t.description ? `<div class="item-desc">${escapeHtml(t.description)}</div>` : ''}
                    <div class="item-meta">
                        <span class="item-tag tag-${t.status}">${t.status.replace('-', ' ')}</span>
                        <span class="item-date">${App.formatDateShort(t.date)}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="item-action-btn" onclick="Tasks.edit('${t.id}')" title="Edit">
                        <span class="material-icons-round">edit</span>
                    </button>
                    <button class="item-action-btn btn-delete" onclick="Tasks.delete('${t.id}')" title="Delete">
                        <span class="material-icons-round">delete</span>
                    </button>
                </div>
            </div>`;
            return typeof SwipeGesture !== 'undefined'
                ? SwipeGesture.wrap(cardHtml, t.id, 'tasks', { completeLabel: 'Complete', completeIcon: 'check_circle' })
                : cardHtml;
        }).join('');
    }

    function edit(id) {
        const tasks = App.getData('tasks');
        const task = tasks.find(t => t.id === id);
        if (task) openTaskModal(task);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    document.addEventListener('DOMContentLoaded', init);

    return { refresh, edit, delete: deleteTask, toggleStatus };
})();

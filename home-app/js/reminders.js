/* ============================
   Reminders Module
   ============================ */

const Reminders = (() => {
    function init() {
        App.$('#fabAddReminder').addEventListener('click', () => openReminderModal());
        App.$('#btnSaveReminder').addEventListener('click', saveReminder);
        App.$('#remFilterStatus').addEventListener('change', refresh);
    }

    function openReminderModal(reminder = null) {
        App.$('#reminderModalTitle').textContent = reminder ? 'Edit Reminder' : 'Add Reminder';
        App.$('#reminderTitle').value = reminder ? reminder.title : '';
        App.$('#reminderDesc').value = reminder ? (reminder.description || '') : '';
        App.$('#reminderDeadline').value = reminder ? reminder.deadline : '';
        App.$('#reminderPriority').value = reminder ? (reminder.priority || 'medium') : 'medium';
        App.$('#reminderEditId').value = reminder ? reminder.id : '';
        App.openModal('reminderModal');
    }

    function saveReminder() {
        const title = App.$('#reminderTitle').value.trim();
        if (!title) {
            App.showToast('Please enter a reminder title', 'warning');
            return;
        }

        const deadline = App.$('#reminderDeadline').value;
        if (!deadline) {
            App.showToast('Please set a deadline', 'warning');
            return;
        }

        const reminders = App.getData('reminders');
        const editId = App.$('#reminderEditId').value;

        const entry = {
            title,
            description: App.$('#reminderDesc').value.trim(),
            deadline,
            priority: App.$('#reminderPriority').value,
            timestamp: Date.now()
        };

        if (editId) {
            const idx = reminders.findIndex(r => r.id === editId);
            if (idx !== -1) {
                reminders[idx] = { ...reminders[idx], ...entry };
            }
            App.showToast('Reminder updated!', 'success');
        } else {
            entry.id = App.generateId();
            entry.status = 'pending';
            reminders.push(entry);
            App.showToast('Reminder added!', 'success');
        }

        App.setData('reminders', reminders);
        App.closeModal('reminderModal');
        refresh();
    }

    function deleteReminder(id) {
        App.confirmDelete('Delete this reminder?', () => {
            let reminders = App.getData('reminders');
            reminders = reminders.filter(r => r.id !== id);
            App.setData('reminders', reminders);
            App.showToast('Reminder deleted', 'info');
            refresh();
        });
    }

    function toggleComplete(id) {
        const reminders = App.getData('reminders');
        const reminder = reminders.find(r => r.id === id);
        if (reminder) {
            reminder.status = reminder.status === 'completed' ? 'pending' : 'completed';
            reminder.timestamp = Date.now();
            App.setData('reminders', reminders);
            refresh();
        }
    }

    function refresh() {
        const statusFilter = App.$('#remFilterStatus').value;
        const reminders = App.getData('reminders');
        const todayStr = App.today();

        // Mark overdue
        let list = reminders.map(r => ({
            ...r,
            isOverdue: r.deadline < todayStr && r.status !== 'completed'
        }));

        // Filter
        if (statusFilter === 'pending') {
            list = list.filter(r => r.status !== 'completed' && !r.isOverdue);
        } else if (statusFilter === 'completed') {
            list = list.filter(r => r.status === 'completed');
        } else if (statusFilter === 'overdue') {
            list = list.filter(r => r.isOverdue);
        }

        // Sort: overdue first, then by deadline
        list.sort((a, b) => {
            if (a.isOverdue && !b.isOverdue) return -1;
            if (!a.isOverdue && b.isOverdue) return 1;
            if (a.status === 'completed' && b.status !== 'completed') return 1;
            if (a.status !== 'completed' && b.status === 'completed') return -1;
            return new Date(a.deadline) - new Date(b.deadline);
        });

        const container = App.$('#remindersList');

        if (list.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons-round">event_note</span>
                    <p>No reminders found. Tap + to plan ahead!</p>
                </div>`;
            return;
        }

        const priorityIcons = { high: 'priority_high', medium: 'flag', low: 'low_priority' };
        const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };
        const priorityBg = { high: 'rgba(239,68,68,0.15)', medium: 'rgba(245,158,11,0.15)', low: 'rgba(16,185,129,0.15)' };

        container.innerHTML = list.map(r => {
            const daysLeft = Math.ceil((new Date(r.deadline + 'T00:00:00') - new Date(todayStr + 'T00:00:00')) / 86400000);
            let deadlineText = '';
            if (r.status === 'completed') {
                deadlineText = '✓ Completed';
            } else if (daysLeft < 0) {
                deadlineText = `${Math.abs(daysLeft)} day${Math.abs(daysLeft) > 1 ? 's' : ''} overdue`;
            } else if (daysLeft === 0) {
                deadlineText = 'Due today!';
            } else if (daysLeft === 1) {
                deadlineText = 'Due tomorrow';
            } else {
                deadlineText = `${daysLeft} days left`;
            }

            const statusClass = r.status === 'completed' ? 'status-completed' : (r.isOverdue ? 'status-overdue' : `priority-${r.priority}`);
            const iconName = r.status === 'completed' ? 'check_circle' : (r.isOverdue ? 'warning' : priorityIcons[r.priority]);
            const iconColor = r.status === 'completed' ? '#10b981' : (r.isOverdue ? '#ef4444' : priorityColors[r.priority]);
            const iconBg = r.status === 'completed' ? 'rgba(16,185,129,0.15)' : (r.isOverdue ? 'rgba(239,68,68,0.15)' : priorityBg[r.priority]);

            return `
                <div class="item-card ${statusClass}" style="${r.status === 'completed' ? 'opacity:0.6' : ''}">
                    <div class="item-icon" style="background:${iconBg}" onclick="Reminders.toggleComplete('${r.id}')" title="Toggle complete">
                        <span class="material-icons-round" style="color:${iconColor}">${iconName}</span>
                    </div>
                    <div class="item-body">
                        <div class="item-title" style="${r.status === 'completed' ? 'text-decoration:line-through' : ''}">${escapeHtml(r.title)}</div>
                        ${r.description ? `<div class="item-desc">${escapeHtml(r.description)}</div>` : ''}
                        <div class="item-meta">
                            <span class="item-tag tag-${r.isOverdue && r.status !== 'completed' ? 'overdue' : (r.status === 'completed' ? 'completed' : r.priority)}">${deadlineText}</span>
                            <span class="item-date">${App.formatDateShort(r.deadline)}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="item-action-btn" onclick="Reminders.edit('${r.id}')" title="Edit">
                            <span class="material-icons-round">edit</span>
                        </button>
                        <button class="item-action-btn btn-delete" onclick="Reminders.delete('${r.id}')" title="Delete">
                            <span class="material-icons-round">delete</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    function edit(id) {
        const reminders = App.getData('reminders');
        const reminder = reminders.find(r => r.id === id);
        if (reminder) openReminderModal(reminder);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    document.addEventListener('DOMContentLoaded', init);

    return { refresh, edit, delete: deleteReminder, toggleComplete };
})();

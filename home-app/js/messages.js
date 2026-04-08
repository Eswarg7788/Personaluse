/* ============================
   Messages Module
   ============================ */

const Messages = (() => {
    function init() {
        App.$('#fabAddMsg').addEventListener('click', () => openMsgModal());
        App.$('#btnSaveMsg').addEventListener('click', saveMsg);
    }

    function openMsgModal(msg = null) {
        App.$('#msgModalTitle').textContent = msg ? 'Edit Message' : 'Log Message';
        App.$('#msgRecipient').value = msg ? msg.recipient : '';
        App.$('#msgPurpose').value = msg ? msg.purpose : '';
        App.$('#msgCount').value = msg ? msg.count : 1;
        App.$('#msgDate').value = msg ? msg.date : App.today();
        App.$('#msgEditId').value = msg ? msg.id : '';
        App.openModal('msgModal');
    }

    function saveMsg() {
        const recipient = App.$('#msgRecipient').value.trim();
        if (!recipient) {
            App.showToast('Please enter a recipient', 'warning');
            return;
        }

        const messages = App.getData('messages');
        const editId = App.$('#msgEditId').value;

        const entry = {
            recipient,
            purpose: App.$('#msgPurpose').value.trim(),
            count: parseInt(App.$('#msgCount').value) || 1,
            date: App.$('#msgDate').value || App.today(),
            timestamp: Date.now()
        };

        if (editId) {
            const idx = messages.findIndex(m => m.id === editId);
            if (idx !== -1) {
                messages[idx] = { ...messages[idx], ...entry };
            }
            App.showToast('Message updated!', 'success');
        } else {
            entry.id = App.generateId();
            messages.push(entry);
            App.showToast('Message logged!', 'success');
        }

        App.setData('messages', messages);
        App.closeModal('msgModal');
        refresh();
    }

    function deleteMsg(id) {
        App.confirmDelete('Delete this message entry?', () => {
            let messages = App.getData('messages');
            messages = messages.filter(m => m.id !== id);
            App.setData('messages', messages);
            App.showToast('Message deleted', 'info');
            refresh();
        });
    }

    function refresh() {
        const dateStr = App.$('#msgFilterDate').value || App.today();
        const messages = App.getData('messages');

        const filtered = messages.filter(m => m.date === dateStr);
        filtered.sort((a, b) => b.timestamp - a.timestamp);

        // Update summary
        const totalCount = filtered.reduce((sum, m) => sum + (Number(m.count) || 0), 0);
        App.$('#msgDayCount').textContent = `${totalCount} message${totalCount !== 1 ? 's' : ''} sent on ${App.formatDateShort(dateStr)}`;

        const container = App.$('#messagesList');

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons-round">message</span>
                    <p>No messages logged for ${App.formatDate(dateStr)}.</p>
                </div>`;
            return;
        }

        container.innerHTML = filtered.map(m => `
            <div class="item-card">
                <div class="item-icon" style="background:rgba(168,85,247,0.15)">
                    <span class="material-icons-round" style="color:#a855f7">chat</span>
                </div>
                <div class="item-body">
                    <div class="item-title">${escapeHtml(m.recipient)}</div>
                    <div class="item-desc">${escapeHtml(m.purpose)}</div>
                    <div class="item-meta">
                        <span class="item-tag" style="background:rgba(99,102,241,0.15);color:#6366f1">${m.count} MSG${m.count > 1 ? 'S' : ''}</span>
                        <span class="item-date">${App.timeAgo(m.timestamp)}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="item-action-btn" onclick="Messages.edit('${m.id}')" title="Edit">
                        <span class="material-icons-round">edit</span>
                    </button>
                    <button class="item-action-btn btn-delete" onclick="Messages.delete('${m.id}')" title="Delete">
                        <span class="material-icons-round">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    }

    function edit(id) {
        const messages = App.getData('messages');
        const msg = messages.find(m => m.id === id);
        if (msg) openMsgModal(msg);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    document.addEventListener('DOMContentLoaded', init);

    return { refresh, edit, delete: deleteMsg };
})();

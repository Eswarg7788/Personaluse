/* ============================
   Contacts / People CRM Module
   ============================ */
const Contacts = (() => {
    const relationships = ['Family', 'Friend', 'Colleague', 'Client', 'Mentor', 'Other'];

    function refresh() {
        const list = App.$('#contactsList');
        const filter = App.$('#contactFilterType')?.value || 'all';
        let items = App.getData('contacts');
        if (filter !== 'all') items = items.filter(c => c.relationship === filter);
        items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        if (items.length === 0) {
            list.innerHTML = `<div class="empty-state"><span class="material-icons-round">people</span><p>No contacts yet. Add your important people!</p></div>`;
            return;
        }

        list.innerHTML = items.map(c => {
            const initials = (c.name || '').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
            const color = colors[Math.abs(hashCode(c.name)) % colors.length];
            return `
            <div class="item-card contact-card" data-id="${c.id}">
                <div class="item-card-header">
                    <div class="item-card-left">
                        <div class="contact-avatar" style="background:${color}">${initials}</div>
                        <div>
                            <h4 class="item-title">${escHtml(c.name)}</h4>
                            <span class="item-meta">${c.relationship || ''} ${c.phone ? '• ' + c.phone : ''}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        ${c.phone ? `<a class="item-action-btn" href="tel:${c.phone}"><span class="material-icons-round">call</span></a>` : ''}
                        <button class="item-action-btn" onclick="Contacts.edit('${c.id}')"><span class="material-icons-round">edit</span></button>
                        <button class="item-action-btn" onclick="Contacts.remove('${c.id}')"><span class="material-icons-round">delete</span></button>
                    </div>
                </div>
                <div class="contact-details">
                    ${c.email ? `<span class="contact-detail"><span class="material-icons-round">email</span> ${escHtml(c.email)}</span>` : ''}
                    ${c.lastContacted ? `<span class="contact-detail"><span class="material-icons-round">schedule</span> Last: ${App.formatDateShort(c.lastContacted)}</span>` : ''}
                </div>
                ${c.notes ? `<p class="item-body">${escHtml(c.notes)}</p>` : ''}
            </div>`;
        }).join('');
    }

    function hashCode(str) {
        let hash = 0;
        for (let i = 0; i < (str || '').length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    }

    function openAdd() {
        App.$('#contactModalTitle').textContent = 'Add Contact';
        App.$('#contactName').value = '';
        App.$('#contactPhone').value = '';
        App.$('#contactEmail').value = '';
        App.$('#contactRelationship').value = 'Friend';
        App.$('#contactLastContacted').value = App.today();
        App.$('#contactNotes').value = '';
        App.$('#contactEditId').value = '';
        App.openModal('contactModal');
    }

    function edit(id) {
        const items = App.getData('contacts');
        const c = items.find(x => x.id === id);
        if (!c) return;
        App.$('#contactModalTitle').textContent = 'Edit Contact';
        App.$('#contactName').value = c.name;
        App.$('#contactPhone').value = c.phone || '';
        App.$('#contactEmail').value = c.email || '';
        App.$('#contactRelationship').value = c.relationship || 'Friend';
        App.$('#contactLastContacted').value = c.lastContacted || '';
        App.$('#contactNotes').value = c.notes || '';
        App.$('#contactEditId').value = c.id;
        App.openModal('contactModal');
    }

    function save() {
        const name = App.$('#contactName').value.trim();
        const phone = App.$('#contactPhone').value.trim();
        const email = App.$('#contactEmail').value.trim();
        const relationship = App.$('#contactRelationship').value;
        const lastContacted = App.$('#contactLastContacted').value;
        const notes = App.$('#contactNotes').value.trim();
        const editId = App.$('#contactEditId').value;

        if (!name) { App.showToast('Please enter a name', 'warning'); return; }

        let items = App.getData('contacts');
        if (editId) {
            items = items.map(c => c.id === editId ? { ...c, name, phone, email, relationship, lastContacted, notes } : c);
            App.showToast('Contact updated!', 'success');
        } else {
            items.push({ id: App.generateId(), name, phone, email, relationship, lastContacted, notes, timestamp: Date.now() });
            App.showToast('Contact added!', 'success');
        }
        App.setData('contacts', items);
        App.closeModal('contactModal');
        refresh();
    }

    function remove(id) {
        App.confirmDelete('Delete this contact?', () => {
            let items = App.getData('contacts');
            items = items.filter(c => c.id !== id);
            App.setData('contacts', items);
            App.showToast('Contact deleted', 'success');
            refresh();
        });
    }

    function escHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

    function init() {
        App.$('#fabAddContact')?.addEventListener('click', openAdd);
        App.$('#btnSaveContact')?.addEventListener('click', save);
        App.$('#contactFilterType')?.addEventListener('change', refresh);
    }

    document.addEventListener('DOMContentLoaded', init);
    return { refresh, edit, remove };
})();

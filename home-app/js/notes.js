/* ============================
   Notes / Journal Module
   ============================ */
const Notes = (() => {
    const moods = ['😊', '😐', '😢', '😤', '🤩', '😴', '🤔', '💪'];

    function refresh() {
        const list = App.$('#notesList');
        const filter = App.$('#noteFilterDate')?.value || '';
        let notes = App.getData('notes');
        if (filter) notes = notes.filter(n => n.date === filter);
        notes.sort((a, b) => b.timestamp - a.timestamp);

        if (notes.length === 0) {
            list.innerHTML = `<div class="empty-state"><span class="material-icons-round">edit_note</span><p>No journal entries yet. Tap + to write!</p></div>`;
            return;
        }

        list.innerHTML = notes.map(n => `
            <div class="item-card" data-id="${n.id}">
                <div class="item-card-header">
                    <div class="item-card-left">
                        <span class="item-mood">${n.mood || '📝'}</span>
                        <div>
                            <h4 class="item-title">${escHtml(n.title)}</h4>
                            <span class="item-meta">${App.formatDate(n.date)}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="item-action-btn" onclick="Notes.edit('${n.id}')"><span class="material-icons-round">edit</span></button>
                        <button class="item-action-btn" onclick="Notes.remove('${n.id}')"><span class="material-icons-round">delete</span></button>
                    </div>
                </div>
                <p class="item-body">${escHtml(n.content).substring(0, 200)}${n.content.length > 200 ? '...' : ''}</p>
            </div>
        `).join('');
    }

    function openAdd() {
        App.$('#noteModalTitle').textContent = 'New Journal Entry';
        App.$('#noteTitle').value = '';
        App.$('#noteContent').value = '';
        App.$('#noteDate').value = App.today();
        App.$('#noteEditId').value = '';
        App.$('#noteMood').value = '😊';
        App.openModal('noteModal');
    }

    function edit(id) {
        const notes = App.getData('notes');
        const n = notes.find(x => x.id === id);
        if (!n) return;
        App.$('#noteModalTitle').textContent = 'Edit Entry';
        App.$('#noteTitle').value = n.title;
        App.$('#noteContent').value = n.content;
        App.$('#noteDate').value = n.date;
        App.$('#noteEditId').value = n.id;
        App.$('#noteMood').value = n.mood || '😊';
        App.openModal('noteModal');
    }

    function save() {
        const title = App.$('#noteTitle').value.trim();
        const content = App.$('#noteContent').value.trim();
        const date = App.$('#noteDate').value;
        const mood = App.$('#noteMood').value;
        const editId = App.$('#noteEditId').value;

        if (!title) { App.showToast('Please enter a title', 'warning'); return; }

        let notes = App.getData('notes');
        if (editId) {
            notes = notes.map(n => n.id === editId ? { ...n, title, content, date, mood } : n);
            App.showToast('Entry updated!', 'success');
        } else {
            notes.push({ id: App.generateId(), title, content, date, mood, timestamp: Date.now() });
            App.showToast('Entry saved!', 'success');
        }
        App.setData('notes', notes);
        App.closeModal('noteModal');
        refresh();
    }

    function remove(id) {
        App.confirmDelete('Delete this journal entry?', () => {
            let notes = App.getData('notes');
            notes = notes.filter(n => n.id !== id);
            App.setData('notes', notes);
            App.showToast('Entry deleted', 'success');
            refresh();
        });
    }

    function escHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function init() {
        App.$('#fabAddNote')?.addEventListener('click', openAdd);
        App.$('#btnSaveNote')?.addEventListener('click', save);
        App.$('#noteFilterDate')?.addEventListener('change', refresh);
    }

    document.addEventListener('DOMContentLoaded', init);

    return { refresh, edit, remove };
})();

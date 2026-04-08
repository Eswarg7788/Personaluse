/* ============================
   Learning Tracker Module
   ============================ */
const Learning = (() => {
    const types = ['📚 Book', '🎓 Course', '💻 Skill', '🎧 Podcast', '📹 Video Series'];

    function refresh() {
        const list = App.$('#learningList');
        const filter = App.$('#learningFilterStatus')?.value || 'all';
        let items = App.getData('learning');
        if (filter !== 'all') items = items.filter(l => l.status === filter);
        items.sort((a, b) => b.timestamp - a.timestamp);

        if (items.length === 0) {
            list.innerHTML = `<div class="empty-state"><span class="material-icons-round">school</span><p>Nothing being tracked. Start learning something new!</p></div>`;
            return;
        }

        list.innerHTML = items.map(l => {
            const pct = Number(l.progress) || 0;
            const statusColors = { 'in-progress': 'var(--accent)', 'completed': 'var(--success)', 'planned': 'var(--warning)', 'dropped': 'var(--danger)' };
            const color = statusColors[l.status] || 'var(--accent)';
            return `
            <div class="item-card" data-id="${l.id}">
                <div class="item-card-header">
                    <div class="item-card-left">
                        <span class="item-mood">${l.type ? l.type.split(' ')[0] : '📚'}</span>
                        <div>
                            <h4 class="item-title">${escHtml(l.title)}</h4>
                            <span class="item-meta">${l.type || ''} • ${(l.status || 'planned').replace('-', ' ')}</span>
                        </div>
                    </div>
                    <div class="item-actions">
                        <button class="item-action-btn" onclick="Learning.edit('${l.id}')"><span class="material-icons-round">edit</span></button>
                        <button class="item-action-btn" onclick="Learning.remove('${l.id}')"><span class="material-icons-round">delete</span></button>
                    </div>
                </div>
                ${l.notes ? `<p class="item-body">${escHtml(l.notes)}</p>` : ''}
                <div class="goal-progress">
                    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%; background:${color}"></div></div>
                    <span class="progress-text">${pct}%</span>
                </div>
            </div>`;
        }).join('');
    }

    function openAdd() {
        App.$('#learningModalTitle').textContent = 'Add Learning';
        App.$('#learningTitle').value = '';
        App.$('#learningType').value = '📚 Book';
        App.$('#learningStatus').value = 'planned';
        App.$('#learningProgress').value = '0';
        App.$('#learningNotes').value = '';
        App.$('#learningEditId').value = '';
        App.openModal('learningModal');
    }

    function edit(id) {
        const items = App.getData('learning');
        const l = items.find(x => x.id === id);
        if (!l) return;
        App.$('#learningModalTitle').textContent = 'Edit Learning';
        App.$('#learningTitle').value = l.title;
        App.$('#learningType').value = l.type || '📚 Book';
        App.$('#learningStatus').value = l.status || 'planned';
        App.$('#learningProgress').value = l.progress || 0;
        App.$('#learningNotes').value = l.notes || '';
        App.$('#learningEditId').value = l.id;
        App.openModal('learningModal');
    }

    function save() {
        const title = App.$('#learningTitle').value.trim();
        const type = App.$('#learningType').value;
        const status = App.$('#learningStatus').value;
        const progress = App.$('#learningProgress').value;
        const notes = App.$('#learningNotes').value.trim();
        const editId = App.$('#learningEditId').value;

        if (!title) { App.showToast('Please enter a title', 'warning'); return; }

        let items = App.getData('learning');
        if (editId) {
            items = items.map(l => l.id === editId ? { ...l, title, type, status, progress, notes } : l);
            App.showToast('Updated!', 'success');
        } else {
            items.push({ id: App.generateId(), title, type, status, progress, notes, timestamp: Date.now() });
            App.showToast('Learning added!', 'success');
        }
        App.setData('learning', items);
        App.closeModal('learningModal');
        refresh();
    }

    function remove(id) {
        App.confirmDelete('Delete this learning item?', () => {
            let items = App.getData('learning');
            items = items.filter(l => l.id !== id);
            App.setData('learning', items);
            App.showToast('Deleted!', 'success');
            refresh();
        });
    }

    function escHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

    function init() {
        App.$('#fabAddLearning')?.addEventListener('click', openAdd);
        App.$('#btnSaveLearning')?.addEventListener('click', save);
        App.$('#learningFilterStatus')?.addEventListener('change', refresh);
    }

    document.addEventListener('DOMContentLoaded', init);
    return { refresh, edit, remove };
})();

/* ============================
   Global Search Module
   ============================ */
const Search = (() => {
    function open() {
        const overlay = App.$('#searchOverlay');
        if (overlay) { overlay.classList.add('open'); App.$('#searchInput')?.focus(); }
    }
    function close() {
        const overlay = App.$('#searchOverlay');
        if (overlay) { overlay.classList.remove('open'); App.$('#searchInput').value = ''; App.$('#searchResults').innerHTML = ''; }
    }
    function perform() {
        const q = (App.$('#searchInput')?.value || '').trim().toLowerCase();
        const results = App.$('#searchResults');
        if (!q || q.length < 2) { results.innerHTML = '<p class="search-hint">Type at least 2 characters...</p>'; return; }
        const found = [];
        // Tasks
        App.getData('tasks').forEach(t => { if (match(t.title, q) || match(t.description, q)) found.push({ type: 'Task', icon: 'task_alt', title: t.title, sub: t.date, page: 'pageTasks' }); });
        // Expenses
        App.getData('expenses').forEach(e => { if (match(e.notes, q) || match(e.category, q)) found.push({ type: 'Expense', icon: 'wallet', title: `₹${e.amount} - ${e.category}`, sub: e.date, page: 'pageExpenses' }); });
        // Messages
        App.getData('messages').forEach(m => { if (match(m.recipient, q) || match(m.purpose, q)) found.push({ type: 'Message', icon: 'chat', title: m.recipient, sub: m.purpose, page: 'pageMessages' }); });
        // Reminders
        App.getData('reminders').forEach(r => { if (match(r.title, q) || match(r.description, q)) found.push({ type: 'Reminder', icon: 'notifications', title: r.title, sub: r.deadline, page: 'pageReminders' }); });
        // Notes
        App.getData('notes').forEach(n => { if (match(n.title, q) || match(n.content, q)) found.push({ type: 'Note', icon: 'edit_note', title: n.title, sub: n.date, page: 'pageNotes' }); });
        // Goals
        App.getData('goals').forEach(g => { if (match(g.title, q) || match(g.description, q)) found.push({ type: 'Goal', icon: 'flag', title: g.title, sub: g.status, page: 'pageGoals' }); });
        // Wishlist
        App.getData('wishlist').forEach(w => { if (match(w.name, q) || match(w.notes, q)) found.push({ type: 'Wish', icon: 'bookmark', title: w.name, sub: w.category, page: 'pageWishlist' }); });
        // Contacts
        App.getData('contacts').forEach(c => { if (match(c.name, q) || match(c.email, q) || match(c.phone, q)) found.push({ type: 'Contact', icon: 'person', title: c.name, sub: c.relationship, page: 'pageContacts' }); });
        // Income
        App.getData('income').forEach(i => { if (match(i.source, q) || match(i.notes, q)) found.push({ type: 'Income', icon: 'trending_up', title: i.source, sub: `₹${i.amount}`, page: 'pageIncome' }); });
        // Learning
        App.getData('learning').forEach(l => { if (match(l.title, q) || match(l.notes, q)) found.push({ type: 'Learning', icon: 'school', title: l.title, sub: l.type, page: 'pageLearning' }); });

        if (found.length === 0) { results.innerHTML = '<p class="search-hint">No results found</p>'; return; }
        results.innerHTML = found.slice(0, 20).map(r => `
            <button class="search-result-item" onclick="Search.goTo('${r.page}')">
                <span class="material-icons-round search-result-icon">${r.icon}</span>
                <div class="search-result-info"><span class="search-result-title">${esc(r.title)}</span><span class="search-result-sub">${r.type} ${r.sub ? '• ' + esc(r.sub) : ''}</span></div>
                <span class="material-icons-round">chevron_right</span>
            </button>
        `).join('');
    }
    function goTo(page) { close(); App.navigateTo(page); }
    function match(str, q) { return (str || '').toLowerCase().includes(q); }
    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    function init() {
        App.$('#btnSearch')?.addEventListener('click', open);
        App.$('#searchClose')?.addEventListener('click', close);
        App.$('#searchInput')?.addEventListener('input', perform);
        App.$('#searchOverlay')?.addEventListener('click', e => { if (e.target.id === 'searchOverlay') close(); });
    }
    document.addEventListener('DOMContentLoaded', init);
    return { open, close, goTo };
})();

/* ============================
   Module Linking — Cross-module Intelligence
   ============================ */
const Linking = (() => {
    // Links stored as: { id, fromType, fromId, toType, toId, createdAt }
    // Types: 'task', 'goal', 'habit', 'expense', 'contact', 'reminder', 'note'

    function getLinks(type, id) {
        const links = App.getData('links');
        return links.filter(l =>
            (l.fromType === type && l.fromId === id) ||
            (l.toType === type && l.toId === id)
        );
    }

    function addLink(fromType, fromId, toType, toId) {
        const links = App.getData('links');
        // Avoid duplicates
        const exists = links.find(l =>
            (l.fromType === fromType && l.fromId === fromId && l.toType === toType && l.toId === toId) ||
            (l.fromType === toType && l.fromId === toId && l.toType === fromType && l.toId === fromId)
        );
        if (exists) return;
        links.push({ id: App.generateId(), fromType, fromId, toType, toId, createdAt: Date.now() });
        App.setData('links', links);
    }

    function removeLink(linkId) {
        let links = App.getData('links');
        links = links.filter(l => l.id !== linkId);
        App.setData('links', links);
    }

    function getLinkedItem(type, id) {
        const dataMap = {
            task: 'tasks', goal: 'goals', habit: 'habits',
            expense: 'expenses', contact: 'contacts',
            reminder: 'reminders', note: 'notes'
        };
        const key = dataMap[type];
        if (!key) return null;
        const items = App.getData(key);
        return items.find(i => i.id === id) || null;
    }

    function getItemName(type, item) {
        if (!item) return 'Unknown';
        return item.title || item.name || item.source || `${type}`;
    }

    function getTypeIcon(type) {
        const icons = {
            task: 'task_alt', goal: 'flag', habit: 'fitness_center',
            expense: 'receipt', contact: 'person', reminder: 'alarm', note: 'edit_note'
        };
        return icons[type] || 'link';
    }

    function getTypeColor(type) {
        const colors = {
            task: '#3b82f6', goal: '#14b8a6', habit: '#ef4444',
            expense: '#f59e0b', contact: '#6366f1', reminder: '#f97316', note: '#ec4899'
        };
        return colors[type] || '#94a3b8';
    }

    // Render linked items as chips
    function renderLinkedChips(type, id) {
        const links = getLinks(type, id);
        if (links.length === 0) return '';

        let html = '<div class="linked-chips">';
        links.forEach(l => {
            const otherType = l.fromType === type && l.fromId === id ? l.toType : l.fromType;
            const otherId = l.fromType === type && l.fromId === id ? l.toId : l.fromId;
            const item = getLinkedItem(otherType, otherId);
            const name = getItemName(otherType, item);
            const icon = getTypeIcon(otherType);
            const color = getTypeColor(otherType);

            html += `
            <span class="linked-chip" style="--chip-color:${color}" title="${otherType}: ${name}">
                <span class="material-icons-round">${icon}</span>
                <span>${name.substring(0,20)}</span>
                <button class="linked-chip-del" onclick="event.stopPropagation(); Linking.removeAndRefresh('${l.id}')">×</button>
            </span>`;
        });
        html += '</div>';
        return html;
    }

    // Show link picker modal
    function showLinkPicker(fromType, fromId) {
        const types = ['task','goal','habit','expense','contact','reminder','note'].filter(t => t !== fromType);
        const dataMap = {
            task: 'tasks', goal: 'goals', habit: 'habits',
            expense: 'expenses', contact: 'contacts',
            reminder: 'reminders', note: 'notes'
        };

        let options = '';
        types.forEach(t => {
            const items = App.getData(dataMap[t]);
            items.forEach(item => {
                const name = getItemName(t, item);
                options += `<option value="${t}::${item.id}">${getTypeIcon(t)} ${t.toUpperCase()}: ${name}</option>`;
            });
        });

        if (!options) {
            App.showToast('No items available to link', 'info');
            return;
        }

        // Use a simple prompt-based approach (could be modal in future)
        const container = document.createElement('div');
        container.className = 'modal-overlay open';
        container.id = 'linkPickerModal';
        container.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2>Link to...</h2>
                <button class="modal-close" onclick="document.getElementById('linkPickerModal').remove()">
                    <span class="material-icons-round">close</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Select item to link</label>
                    <select id="linkPickerSelect" class="filter-select" style="width:100%;padding:12px;font-size:14px">
                        <option value="">— Choose —</option>
                        ${options}
                    </select>
                </div>
                <button class="btn-primary" onclick="Linking.confirmLink('${fromType}','${fromId}')">Link</button>
            </div>
        </div>`;
        document.body.appendChild(container);
        container.addEventListener('click', (e) => {
            if (e.target === container) container.remove();
        });
    }

    function confirmLink(fromType, fromId) {
        const sel = document.getElementById('linkPickerSelect');
        if (!sel || !sel.value) return;
        const [toType, toId] = sel.value.split('::');
        addLink(fromType, fromId, toType, toId);
        App.showToast('Linked!', 'success');
        document.getElementById('linkPickerModal').remove();
    }

    function removeAndRefresh(linkId) {
        removeLink(linkId);
        App.showToast('Link removed', 'info');
        // Refresh the current page
        const pages = {
            pageTasks: 'Tasks', pageGoals: 'Goals', pageHabits: 'Habits',
            pageExpenses: 'Expenses', pageContacts: 'Contacts',
            pageReminders: 'Reminders', pageNotes: 'Notes'
        };
        // Simple: just refresh by finding active page
        const activePage = document.querySelector('.page.active');
        if (activePage) {
            const pageId = activePage.id;
            if (pages[pageId]) {
                const mod = window[pages[pageId]];
                if (mod && mod.refresh) mod.refresh();
            }
        }
    }

    return { getLinks, addLink, removeLink, renderLinkedChips, showLinkPicker, confirmLink, removeAndRefresh };
})();

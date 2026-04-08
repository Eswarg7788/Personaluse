/* ============================
   Tags & Labels Module
   ============================ */

const Tags = (() => {
    const defaultColors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];

    function init() {
        App.$('#btnAddTag').addEventListener('click', addTag);
        App.$('#tagNameInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTag(); });
    }

    function getTags() {
        return App.getData('tags');
    }

    function addTag() {
        const name = App.$('#tagNameInput').value.trim();
        if (!name) return;
        const tags = getTags();
        if (tags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
            App.showToast('Tag already exists', 'warning');
            return;
        }
        const color = defaultColors[tags.length % defaultColors.length];
        tags.push({ id: App.generateId(), name, color });
        App.setData('tags', tags);
        App.$('#tagNameInput').value = '';
        App.showToast('Tag created!', 'success');
        refreshTagManager();
    }

    function deleteTag(id) {
        let tags = getTags();
        tags = tags.filter(t => t.id !== id);
        App.setData('tags', tags);
        // Remove from all items
        ['tasks', 'expenses', 'notes', 'goals'].forEach(key => {
            const items = App.getData(key);
            items.forEach(item => {
                if (item.tags) item.tags = item.tags.filter(t => t !== id);
            });
            App.setData(key, items);
        });
        App.showToast('Tag deleted', 'info');
        refreshTagManager();
    }

    function refreshTagManager() {
        const tags = getTags();
        const container = App.$('#tagManagerList');
        if (!container) return;
        if (tags.length === 0) {
            container.innerHTML = '<p class="text-muted" style="padding:12px;font-size:13px;">No tags created yet.</p>';
            return;
        }
        container.innerHTML = tags.map(t => `
            <div class="tag-manager-item">
                <span class="tag-chip" style="background:${hexToRgba(t.color, 0.15)};color:${t.color}">
                    <span class="material-icons-round" style="font-size:14px">label</span> ${escapeHtml(t.name)}
                </span>
                <button class="item-action-btn btn-delete" onclick="Tags.delete('${t.id}')">
                    <span class="material-icons-round">close</span>
                </button>
            </div>
        `).join('');
    }

    function renderTagPicker(containerId, selectedTags = []) {
        const tags = getTags();
        const container = document.getElementById(containerId);
        if (!container || tags.length === 0) {
            if (container) container.innerHTML = '';
            return;
        }
        container.innerHTML = tags.map(t => {
            const selected = selectedTags.includes(t.id);
            return `<button type="button" class="tag-pick-btn ${selected ? 'active' : ''}" data-tag-id="${t.id}" 
                style="--tag-color:${t.color}" onclick="Tags.togglePick(this, '${t.id}')">
                ${escapeHtml(t.name)}
            </button>`;
        }).join('');
    }

    function togglePick(btn, tagId) {
        btn.classList.toggle('active');
    }

    function getSelectedTags(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return [];
        return Array.from(container.querySelectorAll('.tag-pick-btn.active')).map(b => b.dataset.tagId);
    }

    function renderItemTags(tagIds) {
        if (!tagIds || tagIds.length === 0) return '';
        const tags = getTags();
        return tagIds.map(id => {
            const tag = tags.find(t => t.id === id);
            if (!tag) return '';
            return `<span class="item-tag-chip" style="background:${hexToRgba(tag.color, 0.15)};color:${tag.color}">${escapeHtml(tag.name)}</span>`;
        }).join('');
    }

    function hexToRgba(hex, a) { const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16); return `rgba(${r},${g},${b},${a})`; }
    function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t || ''; return d.innerHTML; }

    document.addEventListener('DOMContentLoaded', init);

    return { getTags, refreshTagManager, renderTagPicker, togglePick, getSelectedTags, renderItemTags, delete: deleteTag };
})();

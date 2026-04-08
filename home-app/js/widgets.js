/* ============================
   Dashboard Widgets Module
   ============================ */

const Widgets = (() => {
    const availableWidgets = [
        { id: 'summary', name: 'Summary Cards', icon: 'dashboard' },
        { id: 'habits', name: "Today's Habits", icon: 'fitness_center' },
        { id: 'activity', name: 'Recent Activity', icon: 'history' },
        { id: 'chart', name: 'Expense Chart', icon: 'pie_chart' },
        { id: 'budget', name: 'Budget Status', icon: 'account_balance_wallet' },
        { id: 'reminders', name: 'Upcoming Reminders', icon: 'notifications_active' },
        { id: 'pomodoro', name: 'Pomodoro Quick', icon: 'timer' },
        { id: 'streaks', name: 'Streaks', icon: 'local_fire_department' }
    ];

    function getConfig() {
        const saved = App.getSetting('widget_config');
        if (saved) {
            try { return JSON.parse(saved); } catch { }
        }
        return availableWidgets.map(w => ({ id: w.id, visible: true }));
    }

    function saveConfig(config) {
        App.setSetting('widget_config', JSON.stringify(config));
    }

    function openCustomize() {
        const config = getConfig();
        const container = App.$('#widgetConfigList');
        container.innerHTML = config.map((c, i) => {
            const w = availableWidgets.find(a => a.id === c.id);
            if (!w) return '';
            return `
                <div class="widget-config-item" draggable="true" data-widget-id="${c.id}" data-index="${i}">
                    <span class="material-icons-round widget-drag-handle">drag_indicator</span>
                    <span class="material-icons-round" style="color:var(--accent)">${w.icon}</span>
                    <span class="widget-config-name">${w.name}</span>
                    <label class="widget-toggle">
                        <input type="checkbox" ${c.visible ? 'checked' : ''} onchange="Widgets.toggleWidget('${c.id}', this.checked)">
                        <span class="widget-toggle-slider"></span>
                    </label>
                </div>
            `;
        }).join('');

        initDragAndDrop();
        App.openModal('widgetConfigModal');
    }

    function toggleWidget(id, visible) {
        const config = getConfig();
        const item = config.find(c => c.id === id);
        if (item) item.visible = visible;
        saveConfig(config);
    }

    function initDragAndDrop() {
        const container = App.$('#widgetConfigList');
        let dragItem = null;

        container.querySelectorAll('.widget-config-item').forEach(item => {
            item.addEventListener('dragstart', e => {
                dragItem = item;
                item.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                dragItem = null;
                // Save new order
                const newOrder = [];
                container.querySelectorAll('.widget-config-item').forEach(el => {
                    const config = getConfig();
                    const existing = config.find(c => c.id === el.dataset.widgetId);
                    if (existing) newOrder.push(existing);
                });
                saveConfig(newOrder);
            });
            item.addEventListener('dragover', e => {
                e.preventDefault();
                if (dragItem && dragItem !== item) {
                    const rect = item.getBoundingClientRect();
                    const midY = rect.top + rect.height / 2;
                    if (e.clientY < midY) {
                        container.insertBefore(dragItem, item);
                    } else {
                        container.insertBefore(dragItem, item.nextSibling);
                    }
                }
            });
        });
    }

    function getVisibleWidgets() {
        return getConfig().filter(c => c.visible).map(c => c.id);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const btn = App.$('#btnCustomizeDash');
        if (btn) btn.addEventListener('click', openCustomize);
        const closeBtn = App.$('#closeWidgetConfig');
        if (closeBtn) closeBtn.addEventListener('click', () => {
            App.closeModal('widgetConfigModal');
            Dashboard.refresh();
        });
    });

    return { openCustomize, toggleWidget, getVisibleWidgets, availableWidgets };
})();

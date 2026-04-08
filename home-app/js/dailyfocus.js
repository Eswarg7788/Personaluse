/* ============================
   Daily Focus — Home App v5
   ============================ */
const DailyFocus = (() => {
    const KEY = 'dailyFocus';

    function getTodayFocus() {
        const all = App.getData(KEY);
        const todayStr = App.today();
        let entry = all.find(e => e.date === todayStr);
        if (!entry) {
            entry = { date: todayStr, items: [] };
            all.push(entry);
            App.setData(KEY, all);
        }
        return entry;
    }

    function saveFocus(entry) {
        const all = App.getData(KEY);
        const idx = all.findIndex(e => e.date === entry.date);
        if (idx >= 0) all[idx] = entry; else all.push(entry);
        App.setData(KEY, all);
    }

    function refreshDashWidget() {
        const container = document.getElementById('dailyFocusWidget');
        if (!container) return;
        const focus = getTodayFocus();

        if (focus.items.length === 0) {
            container.innerHTML = `
                <div class="daily-focus-empty" onclick="DailyFocus.openAdd()">
                    <span class="material-icons-round">lightbulb</span>
                    <p>Tap to set your focus for today</p>
                </div>`;
            return;
        }

        const doneCount = focus.items.filter(i => i.done).length;
        const progress = Math.round((doneCount / focus.items.length) * 100);

        container.innerHTML = `
            <div class="focus-progress-bar">
                <div class="focus-progress-fill" style="width: ${progress}%"></div>
            </div>
        ` + focus.items.map((item, i) => `
            <div class="daily-focus-item ${item.done ? 'done' : ''}" onclick="DailyFocus.toggle(${i})">
                <span class="material-icons-round">${item.done ? 'check_circle' : 'radio_button_unchecked'}</span>
                <span class="daily-focus-text">${esc(item.text)}</span>
                <button class="daily-focus-del" onclick="event.stopPropagation();DailyFocus.removeItem(${i})" title="Remove">
                    <span class="material-icons-round">close</span>
                </button>
            </div>
        `).join('');
    }

    function openAdd() {
        const focus = getTodayFocus();
        if (focus.items.length >= 3) return App.showToast('Max 3 focus items per day', 'warning');
        const text = prompt('What\'s your focus?');
        if (!text || !text.trim()) return;
        focus.items.push({ text: text.trim(), done: false });
        saveFocus(focus);
        refreshDashWidget();
        App.showToast('Focus added! 🎯', 'success');
    }

    function toggle(idx) {
        const focus = getTodayFocus();
        if (focus.items[idx]) {
            focus.items[idx].done = !focus.items[idx].done;
            saveFocus(focus);
            refreshDashWidget();
            if (focus.items[idx].done) App.showToast('Focus completed! 🎉', 'success');
        }
    }

    function removeItem(idx) {
        const focus = getTodayFocus();
        focus.items.splice(idx, 1);
        saveFocus(focus);
        refreshDashWidget();
    }

    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    return { refreshDashWidget, openAdd, toggle, removeItem };
})();

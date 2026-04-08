/* ============================
   Keyboard Shortcuts — Home App v5
   ============================ */
const Shortcuts = (() => {
    const SHORTCUTS = [
        { key: '1', desc: 'Dashboard', action: () => App.navigateTo('pageDashboard') },
        { key: '2', desc: 'Tasks', action: () => App.navigateTo('pageTasks') },
        { key: '3', desc: 'Calendar', action: () => App.navigateTo('pageCalendar') },
        { key: '4', desc: 'Expenses', action: () => App.navigateTo('pageExpenses') },
        { key: '5', desc: 'More', action: () => App.navigateTo('pageMore') },
        { key: 'n', desc: 'New Task', action: () => { App.navigateTo('pageTasks'); setTimeout(() => document.getElementById('fabAddTask')?.click(), 100); } },
        { key: 'e', desc: 'New Expense', action: () => { App.navigateTo('pageExpenses'); setTimeout(() => document.getElementById('fabAddExp')?.click(), 100); } },
        { key: 's', desc: 'Search', action: () => document.getElementById('btnSearch')?.click() },
        { key: 'h', desc: 'Habits', action: () => App.navigateTo('pageHabits') },
        { key: 'j', desc: 'Journal', action: () => App.navigateTo('pageNotes') },
        { key: 'l', desc: 'Lock App', action: () => document.getElementById('btnLock')?.click() },
        { key: 't', desc: 'Toggle Theme', action: () => document.getElementById('btnThemeToggle')?.click() },
        { key: '?', desc: 'Show Shortcuts', action: () => toggleOverlay() }
    ];

    let overlayVisible = false;

    function init() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input
            const tag = e.target.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            // Ignore if modal is open
            if (document.querySelector('.modal-overlay.open')) return;

            const shortcut = SHORTCUTS.find(s => s.key === e.key.toLowerCase());
            if (shortcut) {
                e.preventDefault();
                shortcut.action();
            }

            if (e.key === 'Escape' && overlayVisible) {
                toggleOverlay();
            }
        });
    }

    function toggleOverlay() {
        const overlay = document.getElementById('shortcutsOverlay');
        if (!overlay) return;
        overlayVisible = !overlayVisible;
        overlay.classList.toggle('open', overlayVisible);
    }

    function buildOverlay() {
        const existing = document.getElementById('shortcutsOverlay');
        if (existing) return;

        const overlay = document.createElement('div');
        overlay.id = 'shortcutsOverlay';
        overlay.className = 'shortcuts-overlay';
        overlay.innerHTML = `
            <div class="shortcuts-panel">
                <div class="shortcuts-header">
                    <h2><span class="material-icons-round" style="margin-right:8px">keyboard</span>Keyboard Shortcuts</h2>
                    <button class="modal-close" onclick="Shortcuts.close()"><span class="material-icons-round">close</span></button>
                </div>
                <div class="shortcuts-grid">
                    ${SHORTCUTS.map(s => `
                        <div class="shortcut-item">
                            <kbd>${s.key === '?' ? '?' : s.key.toUpperCase()}</kbd>
                            <span>${s.desc}</span>
                        </div>
                    `).join('')}
                </div>
                <p class="shortcuts-hint">Press <kbd>?</kbd> to toggle this panel</p>
            </div>
        `;
        overlay.addEventListener('click', (e) => { if (e.target === overlay) toggleOverlay(); });
        document.body.appendChild(overlay);
    }

    function close() {
        overlayVisible = false;
        const overlay = document.getElementById('shortcutsOverlay');
        if (overlay) overlay.classList.remove('open');
    }

    document.addEventListener('DOMContentLoaded', () => {
        buildOverlay();
        init();
    });

    return { toggleOverlay, close };
})();

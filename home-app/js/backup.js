/* ============================
   Backup & Settings Module
   ============================ */

const Backup = (() => {
    function init() {
        const btnExport = App.$('#btnExportData');
        const btnImport = App.$('#btnImportData');
        const fileInput = App.$('#importFileInput');
        const btnResetPin = App.$('#btnResetPin');
        const btnClearAll = App.$('#btnClearAllData');

        if (btnExport) btnExport.addEventListener('click', exportData);
        if (btnImport) btnImport.addEventListener('click', () => fileInput && fileInput.click());
        if (fileInput) fileInput.addEventListener('change', importData);
        if (btnResetPin) btnResetPin.addEventListener('click', resetPin);
        if (btnClearAll) btnClearAll.addEventListener('click', clearAllData);

        updateStats();
    }

    function updateStats() {
        const el = App.$('#storageStats');
        if (!el) return;

        const tasks = App.getData('tasks').length;
        const messages = App.getData('messages').length;
        const expenses = App.getData('expenses').length;
        const reminders = App.getData('reminders').length;
        const habits = App.getData('habits').length;

        // Estimate storage used
        let totalSize = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('home_')) {
                totalSize += localStorage.getItem(key).length * 2; // UTF-16
            }
        }
        const sizeKB = (totalSize / 1024).toFixed(1);

        el.innerHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-num">${tasks}</span>
                    <span class="stat-label">Tasks</span>
                </div>
                <div class="stat-item">
                    <span class="stat-num">${messages}</span>
                    <span class="stat-label">Messages</span>
                </div>
                <div class="stat-item">
                    <span class="stat-num">${expenses}</span>
                    <span class="stat-label">Expenses</span>
                </div>
                <div class="stat-item">
                    <span class="stat-num">${reminders}</span>
                    <span class="stat-label">Reminders</span>
                </div>
                <div class="stat-item">
                    <span class="stat-num">${habits}</span>
                    <span class="stat-label">Habits</span>
                </div>
                <div class="stat-item">
                    <span class="stat-num">${sizeKB}</span>
                    <span class="stat-label">KB Used</span>
                </div>
            </div>`;
    }

    function exportData() {
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('home_')) {
                try {
                    data[key] = JSON.parse(localStorage.getItem(key));
                } catch {
                    data[key] = localStorage.getItem(key);
                }
            }
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const dateStr = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `home-backup-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        App.showToast('Backup downloaded successfully!', 'success');
    }

    function importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);

                // Validate it has home_ keys
                const homeKeys = Object.keys(data).filter(k => k.startsWith('home_'));
                if (homeKeys.length === 0) {
                    App.showToast('Invalid backup file!', 'error');
                    return;
                }

                App.confirmDelete(
                    `Restore ${homeKeys.length} data categories? This will replace your current data.`,
                    () => {
                        homeKeys.forEach(key => {
                            const val = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
                            localStorage.setItem(key, val);
                        });

                        App.showToast(`Restored ${homeKeys.length} categories!`, 'success');
                        updateStats();
                        // Refresh current page
                        Dashboard.refresh();
                    }
                );
            } catch (err) {
                App.showToast('Failed to read backup file!', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function resetPin() {
        App.confirmDelete('Reset your PIN? You will need to set a new one.', () => {
            localStorage.removeItem('home_setting_pin');
            App.showToast('PIN reset! Lock the app to set a new one.', 'success');
        });
    }

    function clearAllData() {
        App.confirmDelete('DELETE ALL DATA? This cannot be undone! Export a backup first.', () => {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('home_') && key !== 'home_setting_pin') {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));
            App.showToast('All data cleared!', 'warning');
            updateStats();
            Dashboard.refresh();
        });
    }

    function refresh() {
        updateStats();
    }

    document.addEventListener('DOMContentLoaded', init);

    return { refresh, exportData };
})();

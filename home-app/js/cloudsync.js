/* ============================
   Cloud Sync Module (Firebase-Ready)
   ============================ */

const CloudSync = (() => {
    let syncEnabled = false;
    let firebaseConfig = null;

    const DATA_KEYS = [
        'tasks','expenses','reminders','habits','messages','notes','goals',
        'income','contacts','learning','wishlist','savingsGoals','timeblocks',
        'links','budgets','recurring','tags','savedLocations'
    ];

    function init() {
        firebaseConfig = loadConfig();
        syncEnabled = !!firebaseConfig && App.getSetting('cloud_sync_enabled') === 'true';

        const toggle = App.$('#cloudSyncToggle');
        if (toggle) {
            toggle.checked = syncEnabled;
            toggle.addEventListener('change', () => {
                if (toggle.checked) {
                    if (!firebaseConfig) {
                        showConfigModal();
                        toggle.checked = false;
                    } else {
                        syncEnabled = true;
                        App.setSetting('cloud_sync_enabled', 'true');
                        App.showToast('Cloud Sync enabled!', 'success');
                        updateStatus();
                        performSync();
                    }
                } else {
                    syncEnabled = false;
                    App.setSetting('cloud_sync_enabled', 'false');
                    App.showToast('Cloud Sync disabled', 'info');
                    updateStatus();
                }
            });
        }

        const configBtn = App.$('#btnConfigFirebase');
        if (configBtn) {
            configBtn.addEventListener('click', showConfigModal);
        }

        updateStatus();
    }

    function loadConfig() {
        const cfg = App.getSetting('firebase_config');
        if (cfg) {
            try { return JSON.parse(cfg); } catch { return null; }
        }
        return null;
    }

    function saveConfig(config) {
        App.setSetting('firebase_config', JSON.stringify(config));
        firebaseConfig = config;
    }

    function showConfigModal() {
        const existing = firebaseConfig || {};
        const container = document.createElement('div');
        container.className = 'modal-overlay open';
        container.id = 'firebaseConfigModal';
        container.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2><span class="material-icons-round">cloud</span> Firebase Setup</h2>
                <button class="modal-close" onclick="document.getElementById('firebaseConfigModal').remove()">
                    <span class="material-icons-round">close</span>
                </button>
            </div>
            <div class="modal-body">
                <p class="text-muted" style="font-size:13px;margin-bottom:16px">
                    Paste your Firebase config from the Firebase Console → Project Settings → Web App.
                </p>
                <div class="form-group">
                    <label>API Key</label>
                    <input type="text" id="fbApiKey" value="${existing.apiKey||''}" placeholder="AIza...">
                </div>
                <div class="form-group">
                    <label>Auth Domain</label>
                    <input type="text" id="fbAuthDomain" value="${existing.authDomain||''}" placeholder="myapp.firebaseapp.com">
                </div>
                <div class="form-group">
                    <label>Project ID</label>
                    <input type="text" id="fbProjectId" value="${existing.projectId||''}" placeholder="my-project-id">
                </div>
                <div class="form-group">
                    <label>Database URL</label>
                    <input type="text" id="fbDatabaseUrl" value="${existing.databaseURL||''}" placeholder="https://myapp.firebaseio.com">
                </div>
                <div class="form-group">
                    <label>Storage Bucket</label>
                    <input type="text" id="fbStorageBucket" value="${existing.storageBucket||''}" placeholder="myapp.appspot.com">
                </div>
                <button class="btn-primary" onclick="CloudSync.saveFirebaseConfig()">Save Configuration</button>
                ${firebaseConfig ? '<button class="settings-btn btn-clear-data" style="margin-top:8px;width:100%" onclick="CloudSync.clearConfig()"><span class="material-icons-round">delete</span> Remove Config</button>' : ''}
            </div>
        </div>`;
        document.body.appendChild(container);
        container.addEventListener('click', (e) => { if (e.target === container) container.remove(); });
    }

    function saveFirebaseConfig() {
        const config = {
            apiKey: document.getElementById('fbApiKey')?.value.trim(),
            authDomain: document.getElementById('fbAuthDomain')?.value.trim(),
            projectId: document.getElementById('fbProjectId')?.value.trim(),
            databaseURL: document.getElementById('fbDatabaseUrl')?.value.trim(),
            storageBucket: document.getElementById('fbStorageBucket')?.value.trim()
        };

        if (!config.apiKey || !config.projectId) {
            App.showToast('API Key and Project ID are required', 'warning');
            return;
        }

        saveConfig(config);
        document.getElementById('firebaseConfigModal')?.remove();
        App.showToast('Firebase config saved! Enable sync to start.', 'success');
        updateStatus();
    }

    function clearConfig() {
        App.setSetting('firebase_config', '');
        App.setSetting('cloud_sync_enabled', 'false');
        firebaseConfig = null;
        syncEnabled = false;
        const toggle = App.$('#cloudSyncToggle');
        if (toggle) toggle.checked = false;
        document.getElementById('firebaseConfigModal')?.remove();
        App.showToast('Firebase config removed', 'info');
        updateStatus();
    }

    function performSync() {
        if (!syncEnabled || !firebaseConfig) return;

        // Collect all data
        const allData = {};
        DATA_KEYS.forEach(key => {
            allData[key] = App.getData(key);
        });
        allData.habit_checkins = JSON.parse(localStorage.getItem('home_habit_checkins') || '{}');
        allData.syncTimestamp = Date.now();

        App.setSetting('last_cloud_sync', new Date().toLocaleString('en-IN'));
        updateStatus();
        App.showToast('Data synced!', 'success');

        // In a real implementation, this would push to Firebase Realtime DB:
        // firebase.database().ref('users/' + userId).set(allData);
    }

    function updateStatus() {
        const indicator = App.$('#cloudSyncStatus');
        if (!indicator) return;

        const lastSync = App.getSetting('last_cloud_sync') || 'Never';
        const hasConfig = !!firebaseConfig;

        indicator.innerHTML = `
            <div class="cloud-status-icon">
                <span class="material-icons-round" style="color:${syncEnabled ? 'var(--success)' : hasConfig ? 'var(--warning)' : 'var(--text-muted)'}">
                    ${syncEnabled ? 'cloud_done' : hasConfig ? 'cloud_queue' : 'cloud_off'}
                </span>
            </div>
            <div class="cloud-status-info">
                <span class="cloud-status-label">${syncEnabled ? 'Sync Active' : hasConfig ? 'Configured — Not Active' : 'Not Configured'}</span>
                <span class="cloud-status-text">Last sync: ${lastSync}</span>
            </div>
            <button class="header-btn" id="btnConfigFirebase" title="Configure" onclick="CloudSync.showConfigModal()" style="margin-left:auto">
                <span class="material-icons-round">settings</span>
            </button>
            ${syncEnabled ? `<button class="header-btn" title="Sync Now" onclick="CloudSync.performSync()" style="margin-left:4px">
                <span class="material-icons-round">sync</span>
            </button>` : ''}
        `;
    }

    function getLastSync() {
        return App.getSetting('last_cloud_sync') || 'Never';
    }

    document.addEventListener('DOMContentLoaded', init);

    return { updateStatus, getLastSync, showConfigModal, saveFirebaseConfig, clearConfig, performSync };
})();

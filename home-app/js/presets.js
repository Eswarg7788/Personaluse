/* ============================
   Expense Presets — 1-Tap Quick Spending
   ============================ */
const ExpensePresets = (() => {
    const KEY = 'expensePresets';

    const DEFAULT_PRESETS = [
        { name: 'Tea', emoji: '☕', amount: 20, category: 'Food' },
        { name: 'Bus', emoji: '🚌', amount: 30, category: 'Travel' },
        { name: 'Lunch', emoji: '🍛', amount: 150, category: 'Food' },
        { name: 'Auto', emoji: '🛺', amount: 50, category: 'Travel' },
        { name: 'Snack', emoji: '🍿', amount: 40, category: 'Food' },
    ];

    function getPresets() {
        const saved = App.getData(KEY);
        return saved.length > 0 ? saved : DEFAULT_PRESETS;
    }

    function savePresets(presets) {
        App.setData(KEY, presets);
    }

    function refresh() {
        const container = document.getElementById('expensePresetsStrip');
        if (!container) return;

        const presets = getPresets();
        container.innerHTML = presets.map((p, i) => `
            <button class="expense-preset-chip" onclick="ExpensePresets.quickAdd(${i})">
                <span class="preset-emoji">${p.emoji}</span>
                <span class="preset-name">${esc(p.name)}</span>
                <span class="preset-amount">₹${p.amount}</span>
            </button>
        `).join('') + `
            <button class="expense-preset-add" onclick="ExpensePresets.addNew()">
                <span class="material-icons-round">add</span>
                <span>Add</span>
            </button>
        `;
    }

    function quickAdd(index) {
        const presets = getPresets();
        const preset = presets[index];
        if (!preset) return;

        const expenses = App.getData('expenses');
        expenses.push({
            id: App.generateId(),
            amount: preset.amount,
            category: preset.category,
            date: App.today(),
            notes: preset.name,
            createdAt: Date.now(),
            timestamp: Date.now()
        });
        App.setData('expenses', expenses);

        App.showToast(`₹${preset.amount} ${preset.name} added! ${preset.emoji}`, 'success');

        // Refresh dashboard
        if (typeof Dashboard !== 'undefined') Dashboard.refresh();
        if (typeof WeeklySummary !== 'undefined') WeeklySummary.refresh();
    }

    function addNew() {
        const name = prompt('Preset name (e.g. "Coffee"):');
        if (!name || !name.trim()) return;

        const amountStr = prompt('Amount in ₹:');
        const amount = parseInt(amountStr);
        if (!amount || amount <= 0) return App.showToast('Invalid amount', 'warning');

        const emojiInput = prompt('Emoji (e.g. ☕, 🍔, 🚗):') || '📦';

        const catOptions = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];
        const catStr = prompt('Category (Food/Travel/Shopping/Bills/Health/Entertainment/Other):') || 'Other';
        const category = catOptions.find(c => c.toLowerCase() === catStr.toLowerCase()) || 'Other';

        const presets = getPresets();
        presets.push({
            name: name.trim(),
            emoji: emojiInput.trim(),
            amount,
            category
        });
        savePresets(presets);
        refresh();
        App.showToast(`Preset "${name.trim()}" added!`, 'success');
    }

    function openManage() {
        const presets = getPresets();
        const actions = ['Delete a preset', 'Reset to defaults', 'Cancel'];
        const choice = prompt(`Manage presets:\n1. Delete a preset\n2. Reset to defaults\n\nEnter 1 or 2:`);

        if (choice === '1') {
            const list = presets.map((p, i) => `${i + 1}. ${p.emoji} ${p.name} — ₹${p.amount}`).join('\n');
            const delIdx = prompt(`Which one to delete?\n\n${list}\n\nEnter number:`);
            const idx = parseInt(delIdx) - 1;
            if (idx >= 0 && idx < presets.length) {
                const removed = presets.splice(idx, 1)[0];
                savePresets(presets);
                refresh();
                App.showToast(`Removed "${removed.name}"`, 'info');
            }
        } else if (choice === '2') {
            App.setData(KEY, []);
            refresh();
            App.showToast('Presets reset to defaults', 'info');
        }
    }

    function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    document.addEventListener('DOMContentLoaded', () => {
        refresh();
    });

    return { refresh, quickAdd, addNew, openManage };
})();

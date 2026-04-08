/* ============================
   Smart Notifications Module
   ============================ */

const Notifications = (() => {
    let checkInterval = null;

    function init() {
        // Settings toggles
        const toggles = ['notifReminders', 'notifHabits', 'notifBudget', 'notifTasks'];
        toggles.forEach(id => {
            const el = App.$(`#${id}`);
            if (el) {
                el.checked = App.getSetting(`notif_${id}`) !== 'false';
                el.addEventListener('change', () => App.setSetting(`notif_${id}`, el.checked));
            }
        });
    }

    function start() {
        check();
        checkInterval = setInterval(check, 30 * 60 * 1000); // every 30 min
    }

    function stop() {
        if (checkInterval) clearInterval(checkInterval);
    }

    function check() {
        const todayStr = App.today();
        const alerts = [];

        // Overdue reminders
        if (App.getSetting('notif_notifReminders') !== 'false') {
            const reminders = App.getData('reminders');
            const overdue = reminders.filter(r => r.deadline < todayStr && r.status !== 'completed');
            if (overdue.length > 0) {
                alerts.push({ icon: 'notification_important', text: `${overdue.length} overdue reminder${overdue.length > 1 ? 's' : ''}!`, type: 'warning' });
            }
            const dueSoon = reminders.filter(r => {
                if (r.status === 'completed') return false;
                const diff = (new Date(r.deadline + 'T00:00:00') - new Date(todayStr + 'T00:00:00')) / 86400000;
                return diff >= 0 && diff <= 2;
            });
            if (dueSoon.length > 0) {
                alerts.push({ icon: 'schedule', text: `${dueSoon.length} reminder${dueSoon.length > 1 ? 's' : ''} due soon`, type: 'info' });
            }
        }

        // Pending tasks
        if (App.getSetting('notif_notifTasks') !== 'false') {
            const tasks = App.getData('tasks');
            const pending = tasks.filter(t => t.date === todayStr && t.status !== 'completed');
            if (pending.length > 0) {
                alerts.push({ icon: 'task_alt', text: `${pending.length} task${pending.length > 1 ? 's' : ''} still pending today`, type: 'info' });
            }
        }

        // Unchecked habits
        if (App.getSetting('notif_notifHabits') !== 'false') {
            const habits = App.getData('habits');
            const unchecked = habits.filter(h => {
                const log = h.log || {};
                return !log[todayStr];
            });
            if (unchecked.length > 0 && new Date().getHours() >= 18) {
                alerts.push({ icon: 'fitness_center', text: `${unchecked.length} habit${unchecked.length > 1 ? 's' : ''} not checked today`, type: 'warning' });
            }
        }

        // Over budget
        if (App.getSetting('notif_notifBudget') !== 'false' && typeof Budget !== 'undefined') {
            const overCats = Budget.getOverBudgetCategories();
            if (overCats.length > 0) {
                alerts.push({ icon: 'warning', text: `Over budget in: ${overCats.join(', ')}`, type: 'error' });
            }
        }

        // Show the most important alert as toast
        if (alerts.length > 0) {
            const priority = alerts.find(a => a.type === 'error') || alerts.find(a => a.type === 'warning') || alerts[0];
            App.showToast(priority.text, priority.type);

            // Also send browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
                sendBrowserNotification(priority.text);
            }
        }

        return alerts;
    }

    function sendBrowserNotification(text) {
        try {
            new Notification('Home — Life Manager', {
                body: text,
                icon: 'icons/icon-192.png',
                badge: 'icons/icon-192.png',
                silent: false
            });
        } catch (e) { /* ignore */ }
    }

    function getAllAlerts() {
        return check();
    }

    document.addEventListener('DOMContentLoaded', init);

    return { start, stop, check, getAllAlerts };
})();

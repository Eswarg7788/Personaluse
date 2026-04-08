/* ============================
   Home App — Core Logic
   ============================ */

const App = (() => {
    // State
    let currentPage = 'pageDashboard';
    let pinCode = '';
    let enteredPin = '';
    let isSettingPin = false;
    let newPinFirst = '';

    // Helpers
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);
    const today = () => new Date().toISOString().split('T')[0];

    function formatDate(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function formatDateShort(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    }

    function timeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // LocalStorage
    function getData(key) {
        try {
            return JSON.parse(localStorage.getItem(`home_${key}`)) || [];
        } catch {
            return [];
        }
    }

    function setData(key, data) {
        localStorage.setItem(`home_${key}`, JSON.stringify(data));
    }

    function getSetting(key) {
        return localStorage.getItem(`home_setting_${key}`);
    }

    function setSetting(key, val) {
        localStorage.setItem(`home_setting_${key}`, val);
    }

    // Toast
    function showToast(message, type = 'info') {
        const toast = $('#toast');
        const icon = $('#toastIcon');
        const msg = $('#toastMessage');

        toast.className = 'toast';
        const icons = { info: 'info', success: 'check_circle', warning: 'warning', error: 'error' };
        icon.textContent = icons[type] || 'info';
        msg.textContent = message;
        toast.classList.add('show', `toast-${type}`);

        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Modal
    function openModal(id) {
        const modal = $(`#${id}`);
        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeModal(id) {
        const modal = $(`#${id}`);
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    // Confirm Delete
    let deleteCallback = null;

    function confirmDelete(message, callback) {
        $('#confirmMessage').textContent = message;
        deleteCallback = callback;
        openModal('confirmModal');
    }

    // Navigation
    function navigateTo(pageId) {
        const titles = {
            pageDashboard: 'Dashboard',
            pageTasks: 'Daily Tasks',
            pageMessages: 'Messages',
            pageExpenses: 'Expenses',
            pageReminders: 'Reminders',
            pageCalendar: 'Calendar',
            pageHabits: 'Habit Tracker',
            pageMore: 'More',
            pageSettings: 'Settings',
            pageNotes: 'Journal',
            pageGoals: 'Goals',
            pagePomodoro: 'Pomodoro Timer',
            pageWishlist: 'Wishlist',
            pageIncome: 'Income',
            pageContacts: 'Contacts',
            pageLearning: 'Learning',
            pageHealth: 'Health Log',
            pageBudget: 'Budget Planner',
            pageRecurring: 'Recurring',
            pageReports: 'Reports',
            pageInsights: 'Expense Insights',
            pageKanban: 'Kanban Board',
            pageWeeklyPlanner: 'Weekly Planner',
            pageSavings: 'Savings Goals',
            pageSplitter: 'Expense Splitter',
            pageMoodTrends: 'Mood Trends'
        };

        $$('.page').forEach(p => p.classList.remove('active'));
        $$('.nav-item').forEach(n => n.classList.remove('active'));

        $(`#${pageId}`).classList.add('active');
        const navBtn = $(`.nav-item[data-page="${pageId}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        } else {
            $(`.nav-item[data-page="pageMore"]`).classList.add('active');
        }
        $('#headerTitle').textContent = titles[pageId] || 'Home';
        currentPage = pageId;

        if (pageId === 'pageDashboard') Dashboard.refresh();
        if (pageId === 'pageTasks') Tasks.refresh();
        if (pageId === 'pageMessages') Messages.refresh();
        if (pageId === 'pageExpenses') Expenses.refresh();
        if (pageId === 'pageReminders') Reminders.refresh();
        if (pageId === 'pageCalendar') Calendar.refresh();
        if (pageId === 'pageHabits') Habits.refresh();
        if (pageId === 'pageSettings') Backup.refresh();
        if (pageId === 'pageNotes') Notes.refresh();
        if (pageId === 'pageGoals') Goals.refresh();
        if (pageId === 'pagePomodoro') Pomodoro.refresh();
        if (pageId === 'pageWishlist') Wishlist.refresh();
        if (pageId === 'pageIncome') Income.refresh();
        if (pageId === 'pageContacts') Contacts.refresh();
        if (pageId === 'pageLearning') Learning.refresh();
        if (pageId === 'pageHealth') Health.refresh();
        if (pageId === 'pageBudget') Budget.refresh();
        if (pageId === 'pageRecurring') Recurring.refresh();
        if (pageId === 'pageReports') Reports.refresh();
        if (pageId === 'pageInsights' && typeof Insights !== 'undefined') Insights.refresh();
        if (pageId === 'pageKanban' && typeof Kanban !== 'undefined') Kanban.refresh();
        if (pageId === 'pageWeeklyPlanner' && typeof WeeklyPlanner !== 'undefined') WeeklyPlanner.refresh();
        if (pageId === 'pageSavings' && typeof Savings !== 'undefined') Savings.refresh();
        if (pageId === 'pageSplitter' && typeof Splitter !== 'undefined') Splitter.refresh();
        if (pageId === 'pageMoodTrends' && typeof MoodTrends !== 'undefined') MoodTrends.refresh();
        if (pageId === 'pageSettings' && typeof Tags !== 'undefined') Tags.refreshTagManager();
    }

    // PIN System
    function initPin() {
        pinCode = getSetting('pin') || '';
        if (!pinCode) {
            isSettingPin = true;
            $('#lockSubtitle').textContent = 'Create a 4-digit PIN';
        } else {
            isSettingPin = false;
            $('#lockSubtitle').textContent = 'Enter your PIN to unlock';
        }
    }

    function handlePinInput(digit) {
        if (enteredPin.length >= 4) return;
        enteredPin += digit;
        updatePinDots();

        if (enteredPin.length === 4) {
            setTimeout(() => processPin(), 200);
        }
    }

    function handlePinBackspace() {
        if (enteredPin.length > 0) {
            enteredPin = enteredPin.slice(0, -1);
            updatePinDots();
        }
    }

    function updatePinDots() {
        const dots = $$('.pin-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('filled', i < enteredPin.length);
        });
    }

    function processPin() {
        if (isSettingPin) {
            if (!newPinFirst) {
                newPinFirst = enteredPin;
                enteredPin = '';
                updatePinDots();
                $('#lockSubtitle').textContent = 'Confirm your PIN';
            } else {
                if (enteredPin === newPinFirst) {
                    setSetting('pin', enteredPin);
                    pinCode = enteredPin;
                    unlock();
                    showToast('PIN set successfully!', 'success');
                } else {
                    enteredPin = '';
                    newPinFirst = '';
                    updatePinDots();
                    const sub = $('#lockSubtitle');
                    sub.textContent = 'PINs didn\'t match. Try again.';
                    sub.classList.add('error');
                    setTimeout(() => {
                        sub.classList.remove('error');
                        sub.textContent = 'Create a 4-digit PIN';
                    }, 1500);
                }
            }
        } else {
            if (enteredPin === pinCode) {
                unlock();
            } else {
                enteredPin = '';
                updatePinDots();
                const sub = $('#lockSubtitle');
                sub.textContent = 'Wrong PIN. Try again.';
                sub.classList.add('error');
                setTimeout(() => {
                    sub.classList.remove('error');
                    sub.textContent = 'Enter your PIN to unlock';
                }, 1500);
            }
        }
    }

    function unlock() {
        $('#lockScreen').classList.add('unlocked');
        $('#appContainer').classList.remove('hidden');
        setTimeout(() => {
            $('#lockScreen').style.display = 'none';
        }, 400);
        navigateTo('pageDashboard');
        if (typeof Recurring !== 'undefined') Recurring.processAll();
        if (typeof Notifications !== 'undefined') Notifications.start();
        if (typeof DailyFocus !== 'undefined') DailyFocus.refreshDashWidget();
        if (typeof Onboarding !== 'undefined') setTimeout(() => Onboarding.start(), 600);
    }

    function lockApp() {
        $('#lockScreen').style.display = '';
        $('#lockScreen').classList.remove('unlocked');
        $('#appContainer').classList.add('hidden');
        enteredPin = '';
        updatePinDots();
        isSettingPin = false;
        $('#lockSubtitle').textContent = 'Enter your PIN to unlock';
    }

    // Notifications
    function checkNotifications() {
        const tasks = getData('tasks');
        const todayStr = today();
        const pendingToday = tasks.filter(t => t.date === todayStr && t.status !== 'completed').length;
        const reminders = getData('reminders');
        const overdueReminders = reminders.filter(r => r.deadline < todayStr && r.status !== 'completed').length;
        const expenses = getData('expenses');
        const todayExpenses = expenses.filter(e => e.date === todayStr).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        const messages = [];
        if (pendingToday > 0) messages.push(`You have ${pendingToday} pending task${pendingToday > 1 ? 's' : ''} today.`);
        if (overdueReminders > 0) messages.push(`${overdueReminders} overdue reminder${overdueReminders > 1 ? 's' : ''}!`);
        if (todayExpenses > 0) messages.push(`You spent ₹${todayExpenses.toLocaleString('en-IN')} today.`);

        if (messages.length > 0) {
            showToast(messages[0], pendingToday > 0 || overdueReminders > 0 ? 'warning' : 'info');
        }
    }

    // Header date
    function setHeaderDate() {
        const now = new Date();
        $('#headerDate').textContent = now.toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    // Theme
    function initTheme() {
        const saved = getSetting('theme') || 'dark';
        applyTheme(saved);
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const icon = $('#themeIcon');
        const meta = $('#metaThemeColor');
        if (icon) icon.textContent = theme === 'light' ? 'dark_mode' : 'light_mode';
        if (meta) meta.setAttribute('content', theme === 'light' ? '#f0f4f8' : '#0a0e1a');
        setSetting('theme', theme);
    }

    function toggleTheme() {
        const current = getSetting('theme') || 'dark';
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        showToast(`${next === 'light' ? '☀️ Light' : '🌙 Dark'} mode`, 'info');
    }

    // Init
    function init() {
        setHeaderDate();
        initPin();
        initTheme();

        // Nav
        $$('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => navigateTo(btn.dataset.page));
        });

        // More page cards
        $$('.more-card[data-goto]').forEach(card => {
            card.addEventListener('click', () => navigateTo(card.dataset.goto));
        });

        // PIN keys
        $$('.pin-key[data-key]').forEach(key => {
            key.addEventListener('click', () => handlePinInput(key.dataset.key));
        });
        $('#pinBackspace').addEventListener('click', handlePinBackspace);

        // Lock button
        $('#btnLock').addEventListener('click', lockApp);

        // Theme toggle
        $('#btnThemeToggle').addEventListener('click', toggleTheme);

        // Charts button
        $('#btnCharts').addEventListener('click', () => {
            Charts.refresh();
            openModal('chartsModal');
        });
        $('#closeChartsModal').addEventListener('click', () => closeModal('chartsModal'));

        // Modal closes
        $$('.modal-close[data-close]').forEach(btn => {
            btn.addEventListener('click', () => closeModal(btn.dataset.close));
        });

        // Modal overlay close
        $$('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal(overlay.id);
            });
        });

        // Confirm delete
        $('#btnCancelDelete').addEventListener('click', () => closeModal('confirmModal'));
        $('#btnConfirmDelete').addEventListener('click', () => {
            if (deleteCallback) deleteCallback();
            closeModal('confirmModal');
            deleteCallback = null;
        });

        // Set default dates on filter inputs
        $$('.filter-date').forEach(input => {
            input.value = today();
            input.addEventListener('change', () => {
                if (currentPage === 'pageTasks') Tasks.refresh();
                if (currentPage === 'pageMessages') Messages.refresh();
                if (currentPage === 'pageExpenses') Expenses.refresh();
            });
        });
        // Savings FAB
        const fabSavings = $('#fabAddSavings');
        if (fabSavings) fabSavings.addEventListener('click', () => { if (typeof Savings !== 'undefined') Savings.openAdd(); });
        // Splitter FAB
        const fabSplitter = $('#fabAddSplitter');
        if (fabSplitter) fabSplitter.addEventListener('click', () => { if (typeof Splitter !== 'undefined') Splitter.openAdd(); });
    }

    document.addEventListener('DOMContentLoaded', init);

    return {
        $, $$, today, formatDate, formatDateShort, timeAgo, generateId,
        getData, setData, getSetting, setSetting,
        showToast, openModal, closeModal, confirmDelete,
        navigateTo, checkNotifications
    };
})();

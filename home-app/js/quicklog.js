/* ============================
   Quick Log — Quick Action Buttons
   Opens respective modals directly
   ============================ */
const QuickLog = (() => {

    function quickExpense() {
        // Open expense modal directly
        const fabBtn = document.getElementById('fabAddExp');
        if (fabBtn) {
            fabBtn.click();
        } else {
            // Fallback: navigate to expenses page and open modal
            App.navigateTo('pageExpenses');
            setTimeout(() => {
                document.getElementById('fabAddExp')?.click();
            }, 300);
        }
    }

    function quickTask() {
        const fabBtn = document.getElementById('fabAddTask');
        if (fabBtn) {
            fabBtn.click();
        } else {
            App.navigateTo('pageTasks');
            setTimeout(() => {
                document.getElementById('fabAddTask')?.click();
            }, 300);
        }
    }

    function quickReminder() {
        const fabBtn = document.getElementById('fabAddReminder');
        if (fabBtn) {
            fabBtn.click();
        } else {
            App.navigateTo('pageReminders');
            setTimeout(() => {
                document.getElementById('fabAddReminder')?.click();
            }, 300);
        }
    }

    function quickNote() {
        const fabBtn = document.getElementById('fabAddNote');
        if (fabBtn) {
            fabBtn.click();
        } else {
            App.navigateTo('pageNotes');
            setTimeout(() => {
                document.getElementById('fabAddNote')?.click();
            }, 300);
        }
    }

    return { quickExpense, quickTask, quickReminder, quickNote };
})();

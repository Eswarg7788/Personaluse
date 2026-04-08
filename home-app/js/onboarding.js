/* ============================
   Onboarding Tour — Home App v5
   ============================ */
const Onboarding = (() => {
    const STORAGE_KEY = 'home_setting_onboardingDone';

    const STEPS = [
        {
            title: 'Welcome to Home! 🏠',
            text: 'Your all-in-one personal life manager. Let\'s take a quick tour!',
            icon: 'home',
            highlight: null
        },
        {
            title: 'Dashboard 📊',
            text: 'See your daily overview — tasks, expenses, habits, and focus items at a glance.',
            icon: 'dashboard',
            highlight: '.summary-cards'
        },
        {
            title: 'Quick Log ⚡',
            text: 'Type natural commands like "spent 200 on food" or "add task finish report" for instant entries.',
            icon: 'bolt',
            highlight: '.quick-log-bar'
        },
        {
            title: 'Navigate with Ease 🧭',
            text: 'Use the bottom bar to switch between Home, Tasks, Calendar, Expenses, and More.',
            icon: 'explore',
            highlight: '.bottom-nav'
        },
        {
            title: 'More Modules 🚀',
            text: 'Explore 20+ modules — Habits, Journal, Kanban, Budget, Goals, and much more!',
            icon: 'apps',
            highlight: null
        },
        {
            title: 'Keyboard Shortcuts ⌨️',
            text: 'Press ? anytime to see all keyboard shortcuts. Power users love this!',
            icon: 'keyboard',
            highlight: null
        },
        {
            title: 'You\'re All Set! 🎉',
            text: 'Start adding tasks, tracking expenses, and building habits. Your data stays private and offline.',
            icon: 'check_circle',
            highlight: null
        }
    ];

    let currentStep = 0;

    function shouldShow() {
        return !localStorage.getItem(STORAGE_KEY);
    }

    function start() {
        if (!shouldShow()) return;
        currentStep = 0;
        renderOverlay();
        showStep();
    }

    function renderOverlay() {
        let overlay = document.getElementById('onboardingOverlay');
        if (overlay) overlay.remove();

        overlay = document.createElement('div');
        overlay.id = 'onboardingOverlay';
        overlay.className = 'onboarding-overlay';
        overlay.innerHTML = `
            <div class="onboarding-backdrop"></div>
            <div class="onboarding-card" id="onboardingCard">
                <div class="onboarding-icon" id="onboardingIcon"></div>
                <h2 class="onboarding-title" id="onboardingTitle"></h2>
                <p class="onboarding-text" id="onboardingText"></p>
                <div class="onboarding-dots" id="onboardingDots"></div>
                <div class="onboarding-actions">
                    <button class="onboarding-skip" id="onboardingSkip">Skip</button>
                    <button class="onboarding-next" id="onboardingNext">Next</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('onboardingSkip').addEventListener('click', finish);
        document.getElementById('onboardingNext').addEventListener('click', next);

        requestAnimationFrame(() => overlay.classList.add('open'));
    }

    function showStep() {
        const step = STEPS[currentStep];
        document.getElementById('onboardingIcon').innerHTML = `<span class="material-icons-round">${step.icon}</span>`;
        document.getElementById('onboardingTitle').textContent = step.title;
        document.getElementById('onboardingText').textContent = step.text;

        const dotsEl = document.getElementById('onboardingDots');
        dotsEl.innerHTML = STEPS.map((_, i) => `<span class="onboarding-dot ${i === currentStep ? 'active' : ''}"></span>`).join('');

        const nextBtn = document.getElementById('onboardingNext');
        nextBtn.textContent = currentStep === STEPS.length - 1 ? 'Get Started' : 'Next';

        // Highlight element
        document.querySelectorAll('.onboarding-highlight').forEach(el => el.classList.remove('onboarding-highlight'));
        if (step.highlight) {
            const el = document.querySelector(step.highlight);
            if (el) el.classList.add('onboarding-highlight');
        }
    }

    function next() {
        currentStep++;
        if (currentStep >= STEPS.length) {
            finish();
        } else {
            showStep();
        }
    }

    function finish() {
        localStorage.setItem(STORAGE_KEY, 'true');
        document.querySelectorAll('.onboarding-highlight').forEach(el => el.classList.remove('onboarding-highlight'));
        const overlay = document.getElementById('onboardingOverlay');
        if (overlay) {
            overlay.classList.remove('open');
            setTimeout(() => overlay.remove(), 400);
        }
    }

    return { start, shouldShow };
})();

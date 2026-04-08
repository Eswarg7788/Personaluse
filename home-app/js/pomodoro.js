/* ============================
   Pomodoro Timer Module
   ============================ */
const Pomodoro = (() => {
    let timer = null;
    let remaining = 25 * 60; // seconds
    let total = 25 * 60;
    let isRunning = false;
    let mode = 'work'; // work | break
    let sessions = 0;

    const WORK_TIME = 25 * 60;
    const BREAK_TIME = 5 * 60;
    const LONG_BREAK = 15 * 60;

    function refresh() {
        // Load today's sessions
        const data = App.getData('pomodoro_sessions');
        const todayStr = App.today();
        const todayData = data.find(d => d.date === todayStr);
        sessions = todayData ? todayData.count : 0;
        updateDisplay();
    }

    function updateDisplay() {
        const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
        const secs = (remaining % 60).toString().padStart(2, '0');
        const timeEl = App.$('#pomodoroTime');
        const modeEl = App.$('#pomodoroMode');
        const sessEl = App.$('#pomodoroSessions');
        const btnStart = App.$('#btnPomodoroStart');
        const ring = App.$('#pomodoroRing');

        if (timeEl) timeEl.textContent = `${mins}:${secs}`;
        if (modeEl) modeEl.textContent = mode === 'work' ? '🔥 Focus Time' : '☕ Break Time';
        if (sessEl) sessEl.textContent = `${sessions} sessions today`;
        if (btnStart) {
            btnStart.innerHTML = isRunning
                ? '<span class="material-icons-round">pause</span>'
                : '<span class="material-icons-round">play_arrow</span>';
        }

        // Update SVG ring
        if (ring) {
            const circumference = 2 * Math.PI * 120;
            const offset = circumference * (1 - remaining / total);
            ring.style.strokeDasharray = circumference;
            ring.style.strokeDashoffset = offset;
        }
    }

    function toggleTimer() {
        if (isRunning) {
            pause();
        } else {
            start();
        }
    }

    function start() {
        isRunning = true;
        updateDisplay();
        timer = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(timer);
                timer = null;
                isRunning = false;
                onComplete();
            }
            updateDisplay();
        }, 1000);
    }

    function pause() {
        isRunning = false;
        clearInterval(timer);
        timer = null;
        updateDisplay();
    }

    function reset() {
        pause();
        if (mode === 'work') {
            remaining = WORK_TIME;
            total = WORK_TIME;
        } else {
            remaining = sessions % 4 === 0 ? LONG_BREAK : BREAK_TIME;
            total = remaining;
        }
        updateDisplay();
    }

    function onComplete() {
        // Play sound
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 800;
            osc.type = 'sine';
            gain.gain.value = 0.3;
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } catch (e) {}

        if (mode === 'work') {
            sessions++;
            saveSessions();
            App.showToast(`Session #${sessions} complete! Time for a break 🎉`, 'success');
            mode = 'break';
            remaining = sessions % 4 === 0 ? LONG_BREAK : BREAK_TIME;
            total = remaining;
        } else {
            App.showToast('Break over! Ready to focus? 💪', 'info');
            mode = 'work';
            remaining = WORK_TIME;
            total = WORK_TIME;
        }
        updateDisplay();

        // Browser notification
        if (Notification.permission === 'granted') {
            new Notification('Pomodoro Timer', {
                body: mode === 'work' ? 'Break is over. Time to focus!' : 'Great work! Take a break.',
                icon: 'icons/icon-192.png'
            });
        }
    }

    function switchMode() {
        pause();
        mode = mode === 'work' ? 'break' : 'work';
        if (mode === 'work') {
            remaining = WORK_TIME;
            total = WORK_TIME;
        } else {
            remaining = BREAK_TIME;
            total = BREAK_TIME;
        }
        updateDisplay();
    }

    function saveSessions() {
        const data = App.getData('pomodoro_sessions');
        const todayStr = App.today();
        const idx = data.findIndex(d => d.date === todayStr);
        if (idx >= 0) {
            data[idx].count = sessions;
        } else {
            data.push({ date: todayStr, count: sessions });
        }
        App.setData('pomodoro_sessions', data);
    }

    function init() {
        App.$('#btnPomodoroStart')?.addEventListener('click', toggleTimer);
        App.$('#btnPomodoroReset')?.addEventListener('click', reset);
        App.$('#btnPomodoroSwitch')?.addEventListener('click', switchMode);
    }

    document.addEventListener('DOMContentLoaded', init);
    return { refresh };
})();

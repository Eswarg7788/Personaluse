/* ============================
   Habits Tracker Module + Gamification
   ============================ */

const Habits = (() => {
    const defaultHabits = [
        { id: 'h1', name: 'Exercise', icon: 'fitness_center', color: '#ef4444' },
        { id: 'h2', name: 'Reading', icon: 'menu_book', color: '#3b82f6' },
        { id: 'h3', name: 'Water (8 cups)', icon: 'water_drop', color: '#06b6d4' },
        { id: 'h4', name: 'Meditation', icon: 'self_improvement', color: '#a855f7' },
        { id: 'h5', name: 'No Junk Food', icon: 'no_meals', color: '#f97316' },
    ];

    // Badge definitions
    const BADGES = [
        { id: 'first_check', name: 'First Step', icon: '⭐', desc: 'Complete your first habit', xpReq: 0, condition: (stats) => stats.totalChecks >= 1 },
        { id: 'streak_3', name: '3-Day Streak', icon: '🔥', desc: '3-day streak on any habit', xpReq: 0, condition: (stats) => stats.bestStreak >= 3 },
        { id: 'streak_7', name: 'Week Warrior', icon: '⚡', desc: '7-day streak on any habit', xpReq: 0, condition: (stats) => stats.bestStreak >= 7 },
        { id: 'streak_14', name: 'Fortnight Fighter', icon: '🛡️', desc: '14-day streak', xpReq: 0, condition: (stats) => stats.bestStreak >= 14 },
        { id: 'streak_30', name: 'Monthly Master', icon: '👑', desc: '30-day streak', xpReq: 0, condition: (stats) => stats.bestStreak >= 30 },
        { id: 'xp_100', name: 'Centurion', icon: '💯', desc: 'Earn 100 XP', xpReq: 100, condition: (stats) => stats.totalXP >= 100 },
        { id: 'xp_500', name: 'Elite', icon: '🏆', desc: 'Earn 500 XP', xpReq: 500, condition: (stats) => stats.totalXP >= 500 },
        { id: 'xp_1000', name: 'Legend', icon: '🌟', desc: 'Earn 1000 XP', xpReq: 1000, condition: (stats) => stats.totalXP >= 1000 },
        { id: 'perfect_day', name: 'Perfect Day', icon: '🎯', desc: 'Complete all habits in a day', xpReq: 0, condition: (stats) => stats.perfectDays >= 1 },
        { id: 'all_habits_5', name: 'Diversified', icon: '🌈', desc: 'Track 5+ habits', xpReq: 0, condition: (stats) => stats.habitCount >= 5 },
    ];

    function getHabits() {
        const stored = App.getData('habits');
        if (stored.length === 0) {
            App.setData('habits', defaultHabits);
            return defaultHabits;
        }
        return stored;
    }

    function getCheckins() {
        try {
            return JSON.parse(localStorage.getItem('home_habit_checkins')) || {};
        } catch {
            return {};
        }
    }

    function setCheckins(data) {
        localStorage.setItem('home_habit_checkins', JSON.stringify(data));
    }

    function getGamification() {
        try {
            return JSON.parse(localStorage.getItem('home_gamification')) || { xp: 0, unlockedBadges: [], level: 1 };
        } catch {
            return { xp: 0, unlockedBadges: [], level: 1 };
        }
    }

    function setGamification(data) {
        localStorage.setItem('home_gamification', JSON.stringify(data));
    }

    function toggleCheckin(habitId, dateStr) {
        const checkins = getCheckins();
        const key = `${habitId}_${dateStr}`;
        const wasChecked = !!checkins[key];

        if (checkins[key]) {
            delete checkins[key];
        } else {
            checkins[key] = true;
        }
        setCheckins(checkins);

        // Award XP
        if (!wasChecked) {
            awardXP(habitId, dateStr);
        }

        refresh();
    }

    function awardXP(habitId, dateStr) {
        const gam = getGamification();
        let xpGain = 10; // Base XP per check

        // Streak bonus
        const streak = getStreak(habitId);
        if (streak >= 7 && streak % 7 === 0) xpGain += 50; // Weekly streak bonus
        if (streak >= 3) xpGain += 5; // Small streak bonus

        // Perfect day bonus
        const progress = getTodayProgress();
        if (progress.done === progress.total) xpGain += 25;

        gam.xp += xpGain;
        gam.level = Math.floor(gam.xp / 100) + 1;

        // Check badges
        const stats = getStats();
        stats.totalXP = gam.xp;
        BADGES.forEach(badge => {
            if (!gam.unlockedBadges.includes(badge.id) && badge.condition(stats)) {
                gam.unlockedBadges.push(badge.id);
                App.showToast(`🏅 Badge Unlocked: ${badge.icon} ${badge.name}!`, 'success');
            }
        });

        setGamification(gam);
    }

    function getStats() {
        const habits = getHabits();
        const checkins = getCheckins();
        let totalChecks = 0;
        let bestStreak = 0;
        let perfectDays = 0;

        Object.keys(checkins).forEach(k => { if (checkins[k]) totalChecks++; });
        habits.forEach(h => {
            const s = getStreak(h.id);
            if (s > bestStreak) bestStreak = s;
            const bs = getBestStreak(h.id);
            if (bs > bestStreak) bestStreak = bs;
        });

        // Check perfect days (last 30)
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            let allDone = true;
            habits.forEach(h => {
                if (!checkins[`${h.id}_${ds}`]) allDone = false;
            });
            if (allDone && habits.length > 0) perfectDays++;
        }

        return { totalChecks, bestStreak, perfectDays, habitCount: habits.length, totalXP: getGamification().xp };
    }

    function getStreak(habitId) {
        const checkins = getCheckins();
        let streak = 0;
        const d = new Date();

        while (true) {
            const dateStr = d.toISOString().split('T')[0];
            const key = `${habitId}_${dateStr}`;
            if (checkins[key]) {
                streak++;
                d.setDate(d.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }

    function getBestStreak(habitId) {
        const checkins = getCheckins();
        let best = 0, current = 0;
        for (let i = 90; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            if (checkins[`${habitId}_${ds}`]) {
                current++;
                if (current > best) best = current;
            } else {
                current = 0;
            }
        }
        return best;
    }

    function getWeekData(habitId) {
        const checkins = getCheckins();
        const week = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const key = `${habitId}_${dateStr}`;
            week.push({
                day: d.toLocaleDateString('en-IN', { weekday: 'narrow' }),
                date: dateStr,
                checked: !!checkins[key],
                isToday: i === 0
            });
        }
        return week;
    }

    function getCompletionRate(habitId) {
        const checkins = getCheckins();
        let total = 0, checked = 0;
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const key = `${habitId}_${dateStr}`;
            total++;
            if (checkins[key]) checked++;
        }
        return total > 0 ? Math.round((checked / total) * 100) : 0;
    }

    function getTodayProgress() {
        const habits = getHabits();
        const checkins = getCheckins();
        const todayStr = App.today();
        let done = 0;
        habits.forEach(h => {
            if (checkins[`${h.id}_${todayStr}`]) done++;
        });
        return { done, total: habits.length };
    }

    function addHabit(name, icon, color) {
        const habits = getHabits();
        habits.push({ id: App.generateId(), name, icon: icon || 'check_circle', color: color || '#06b6d4' });
        App.setData('habits', habits);
        refresh();
        App.showToast('Habit added!', 'success');
    }

    function deleteHabit(id) {
        let habits = getHabits();
        habits = habits.filter(h => h.id !== id);
        App.setData('habits', habits);
        const checkins = getCheckins();
        Object.keys(checkins).forEach(key => {
            if (key.startsWith(id + '_')) delete checkins[key];
        });
        setCheckins(checkins);
        refresh();
        App.showToast('Habit deleted', 'info');
    }

    function refresh() {
        const container = App.$('#habitsList');
        if (!container) return;

        const habits = getHabits();
        const todayStr = App.today();
        const checkins = getCheckins();
        const gam = getGamification();

        if (habits.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons-round">fitness_center</span>
                    <p>No habits yet. Tap + to create your first habit!</p>
                </div>`;
            return;
        }

        const progress = getTodayProgress();
        const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
        const xpInLevel = gam.xp % 100;
        const xpForNext = 100;

        let html = `
            <!-- Gamification Bar -->
            <div class="gamification-bar">
                <div class="gam-level">
                    <span class="gam-level-badge">Lv.${gam.level}</span>
                    <span class="gam-xp-text">${gam.xp} XP</span>
                </div>
                <div class="gam-xp-track">
                    <div class="gam-xp-fill" style="width:${(xpInLevel/xpForNext)*100}%"></div>
                </div>
                <button class="gam-badges-btn" onclick="Habits.showBadges()">
                    🏅 ${gam.unlockedBadges.length}/${BADGES.length}
                </button>
            </div>

            <!-- Today's Progress -->
            <div class="habits-progress-bar">
                <div class="habits-progress-info">
                    <span class="material-icons-round">emoji_events</span>
                    <span>Today's Progress: <strong>${progress.done}/${progress.total}</strong></span>
                    ${pct === 100 ? '<span class="perfect-badge">⭐ Perfect!</span>' : ''}
                </div>
                <div class="habits-progress-track">
                    <div class="habits-progress-fill" style="width: ${pct}%; background: ${pct === 100 ? 'var(--success)' : 'var(--accent)'}"></div>
                </div>
            </div>`;

        habits.forEach(h => {
            const isChecked = !!checkins[`${h.id}_${todayStr}`];
            const streak = getStreak(h.id);
            const bestStreak = getBestStreak(h.id);
            const weekData = getWeekData(h.id);
            const rate = getCompletionRate(h.id);

            html += `
            <div class="habit-card" style="--habit-color: ${h.color}">
                <div class="habit-header">
                    <div class="habit-icon-wrap" style="background: ${h.color}20; color: ${h.color}">
                        <span class="material-icons-round">${h.icon}</span>
                    </div>
                    <div class="habit-info">
                        <div class="habit-name">${escapeHtml(h.name)}</div>
                        <div class="habit-stats">
                            <span class="habit-streak">🔥 ${streak}d</span>
                            <span class="habit-best-streak">Best: ${bestStreak}d</span>
                            <span class="habit-rate">${rate}%</span>
                        </div>
                    </div>
                    <button class="habit-check-btn ${isChecked ? 'checked' : ''}" data-habit="${h.id}" title="Toggle today">
                        <span class="material-icons-round">${isChecked ? 'check_circle' : 'radio_button_unchecked'}</span>
                    </button>
                </div>
                <div class="habit-week">
                    ${weekData.map(d => `
                        <div class="habit-day ${d.checked ? 'done' : ''} ${d.isToday ? 'today' : ''}">
                            <span class="habit-day-label">${d.day}</span>
                            <span class="habit-day-dot">${d.checked ? '✓' : '·'}</span>
                        </div>
                    `).join('')}
                </div>
                ${streak >= 3 ? `<div class="streak-fire-bar"><span>🔥 ${streak}-day streak! ${streak >= 7 ? '+50 XP bonus!' : '+5 XP bonus'}</span></div>` : ''}
                <button class="habit-delete-btn" data-habit-del="${h.id}" title="Delete habit">
                    <span class="material-icons-round">delete_outline</span>
                </button>
            </div>`;
        });

        container.innerHTML = html;

        container.querySelectorAll('.habit-check-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                toggleCheckin(btn.dataset.habit, todayStr);
            });
        });

        container.querySelectorAll('.habit-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                App.confirmDelete('Delete this habit and all its data?', () => {
                    deleteHabit(btn.dataset.habitDel);
                });
            });
        });
    }

    function showBadges() {
        const gam = getGamification();
        let html = '';
        BADGES.forEach(b => {
            const unlocked = gam.unlockedBadges.includes(b.id);
            html += `
            <div class="badge-card ${unlocked ? 'badge-unlocked' : 'badge-locked'}">
                <span class="badge-icon">${b.icon}</span>
                <span class="badge-name">${b.name}</span>
                <span class="badge-desc">${b.desc}</span>
                ${unlocked ? '<span class="badge-check">✓</span>' : '<span class="badge-lock">🔒</span>'}
            </div>`;
        });

        const container = document.createElement('div');
        container.className = 'modal-overlay open';
        container.id = 'badgesModal';
        container.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h2>🏅 Badges</h2>
                <button class="modal-close" onclick="document.getElementById('badgesModal').remove()">
                    <span class="material-icons-round">close</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="gam-summary">
                    <div class="gam-stat"><span class="gam-stat-value">Lv.${gam.level}</span><span class="gam-stat-label">Level</span></div>
                    <div class="gam-stat"><span class="gam-stat-value">${gam.xp}</span><span class="gam-stat-label">Total XP</span></div>
                    <div class="gam-stat"><span class="gam-stat-value">${gam.unlockedBadges.length}</span><span class="gam-stat-label">Badges</span></div>
                </div>
                <div class="badges-grid">${html}</div>
            </div>
        </div>`;
        document.body.appendChild(container);
        container.addEventListener('click', (e) => { if (e.target === container) container.remove(); });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    function init() {
        const btnSave = App.$('#btnSaveHabit');
        if (btnSave) {
            btnSave.addEventListener('click', () => {
                const name = App.$('#habitName').value.trim();
                const icon = App.$('#habitIcon').value || 'check_circle';
                const color = App.$('#habitColor').value || '#06b6d4';
                if (!name) { App.showToast('Please enter a habit name', 'warning'); return; }
                addHabit(name, icon, color);
                App.$('#habitName').value = '';
                App.closeModal('habitModal');
            });
        }

        const fab = App.$('#fabAddHabit');
        if (fab) {
            fab.addEventListener('click', () => {
                App.$('#habitName').value = '';
                App.openModal('habitModal');
            });
        }
    }

    document.addEventListener('DOMContentLoaded', init);

    return { refresh, getTodayProgress, getHabits, getCheckins, showBadges };
})();

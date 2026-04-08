/* ============================
   Mood Trends — Home App v5
   ============================ */
const MoodTrends = (() => {
    let moodChart = null;
    const MOOD_MAP = { '😊': 5, '🤩': 5, '💪': 4, '🤔': 3, '😐': 3, '😴': 2, '😢': 1, '😤': 1 };
    const MOOD_COLORS = { '😊': '#22c55e', '🤩': '#f59e0b', '💪': '#3b82f6', '🤔': '#8b5cf6', '😐': '#64748b', '😴': '#06b6d4', '😢': '#6366f1', '😤': '#ef4444' };

    function refresh() {
        const container = document.getElementById('moodTrendsContent');
        if (!container) return;

        const notes = App.getData('notes');
        if (notes.length < 2) {
            container.innerHTML = `<div class="empty-state"><span class="material-icons-round">mood</span><p>Add at least 2 journal entries with moods to see trends!</p></div>`;
            return;
        }

        // Get last 30 entries sorted by date
        const sorted = [...notes].filter(n => n.mood).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);
        const labels = sorted.map(n => App.formatDateShort(n.date));
        const values = sorted.map(n => MOOD_MAP[n.mood] || 3);
        const bgColors = sorted.map(n => MOOD_COLORS[n.mood] || '#64748b');

        // Mood distribution
        const dist = {};
        notes.forEach(n => { if (n.mood) dist[n.mood] = (dist[n.mood] || 0) + 1; });
        const topMood = Object.entries(dist).sort((a, b) => b[1] - a[1])[0];
        const avgScore = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0;

        container.innerHTML = `
            <div class="mood-stats-row">
                <div class="mood-stat-card">
                    <span class="mood-stat-emoji">${topMood ? topMood[0] : '😐'}</span>
                    <span class="mood-stat-label">Most Frequent</span>
                    <span class="mood-stat-value">${topMood ? topMood[1] + ' times' : '-'}</span>
                </div>
                <div class="mood-stat-card">
                    <span class="mood-stat-emoji">${avgScore >= 4 ? '😊' : avgScore >= 3 ? '😐' : '😢'}</span>
                    <span class="mood-stat-label">Avg Score</span>
                    <span class="mood-stat-value">${avgScore}/5</span>
                </div>
                <div class="mood-stat-card">
                    <span class="mood-stat-emoji">📝</span>
                    <span class="mood-stat-label">Total Entries</span>
                    <span class="mood-stat-value">${notes.length}</span>
                </div>
            </div>
            <div class="mood-dist-row">
                ${Object.entries(dist).sort((a, b) => b[1] - a[1]).map(([mood, count]) => `
                    <div class="mood-dist-item">
                        <span class="mood-dist-emoji">${mood}</span>
                        <div class="mood-dist-bar-wrap"><div class="mood-dist-bar" style="width:${Math.round(count / notes.length * 100)}%;background:${MOOD_COLORS[mood] || '#64748b'}"></div></div>
                        <span class="mood-dist-count">${count}</span>
                    </div>
                `).join('')}
            </div>
            <div class="chart-section" style="margin-top:16px">
                <h3>Mood Over Time</h3>
                <canvas id="moodTrendChart"></canvas>
            </div>
        `;

        // Draw chart
        setTimeout(() => {
            const ctx = document.getElementById('moodTrendChart');
            if (!ctx) return;
            if (moodChart) moodChart.destroy();
            moodChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Mood Score',
                        data: values,
                        borderColor: '#a855f7',
                        backgroundColor: 'rgba(168,85,247,0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: bgColors,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { min: 0, max: 6, ticks: { callback: v => ['', '😢', '😴', '😐', '💪', '😊'][v] || '', color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#94a3b8', maxRotation: 45 }, grid: { display: false } }
                    }
                }
            });
        }, 100);
    }

    return { refresh };
})();

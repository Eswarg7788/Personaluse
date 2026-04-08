/* ============================
   Charts / Analytics Module
   ============================ */

const Charts = (() => {
    let monthlyChart, categoryChart, productivityChart, messagesChart;

    const chartColors = {
        cyan: '#06b6d4',
        purple: '#a855f7',
        pink: '#ec4899',
        orange: '#f97316',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#3b82f6',
        red: '#ef4444',
    };

    const categoryColorMap = {
        Food: chartColors.orange,
        Travel: chartColors.cyan,
        Shopping: chartColors.pink,
        Bills: chartColors.yellow,
        Health: chartColors.green,
        Entertainment: chartColors.purple,
        Other: '#64748b'
    };

    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 12 }
            }
        },
        scales: {
            x: {
                ticks: { color: '#64748b', font: { size: 10 } },
                grid: { display: false },
                border: { display: false }
            },
            y: {
                ticks: { color: '#64748b', font: { size: 10 } },
                grid: { color: 'rgba(255,255,255,0.05)' },
                border: { display: false },
                beginAtZero: true
            }
        }
    };

    function refresh() {
        renderMonthlyExpenses();
        renderCategoryPie();
        renderWeeklyProductivity();
        renderDailyMessages();
    }

    function renderMonthlyExpenses() {
        const canvas = App.$('#monthlyExpensesChart');
        if (monthlyChart) monthlyChart.destroy();

        const expenses = App.getData('expenses');
        const labels = [];
        const data = [];

        // Last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const monthKey = d.toISOString().slice(0, 7);
            labels.push(d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }));
            const total = expenses
                .filter(e => e.date && e.date.startsWith(monthKey))
                .reduce((s, e) => s + (Number(e.amount) || 0), 0);
            data.push(total);
        }

        monthlyChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Expenses (₹)',
                    data,
                    backgroundColor: createGradientBars(canvas, chartColors.cyan, chartColors.blue),
                    borderColor: chartColors.cyan,
                    borderWidth: 1,
                    borderRadius: 8,
                    barPercentage: 0.5
                }]
            },
            options: {
                ...defaultOptions,
                plugins: { legend: { display: false } },
                scales: {
                    ...defaultOptions.scales,
                    y: { ...defaultOptions.scales.y, ticks: { ...defaultOptions.scales.y.ticks, callback: v => '₹' + v } }
                }
            }
        });
    }

    function renderCategoryPie() {
        const canvas = App.$('#categoryPieChart');
        if (categoryChart) categoryChart.destroy();

        const expenses = App.getData('expenses');
        const now = new Date();
        const monthKey = now.toISOString().slice(0, 7);
        const monthExpenses = expenses.filter(e => e.date && e.date.startsWith(monthKey));

        const catTotals = {};
        monthExpenses.forEach(e => {
            catTotals[e.category] = (catTotals[e.category] || 0) + (Number(e.amount) || 0);
        });

        const categories = Object.keys(catTotals);
        const data = categories.map(c => catTotals[c]);
        const colors = categories.map(c => categoryColorMap[c] || '#64748b');

        if (categories.length === 0) {
            categories.push('No data');
            data.push(1);
            colors.push('#1e293b');
        }

        categoryChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderColor: '#111827',
                    borderWidth: 3,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 10 }
                    }
                }
            }
        });
    }

    function renderWeeklyProductivity() {
        const canvas = App.$('#weeklyProductivityChart');
        if (productivityChart) productivityChart.destroy();

        const tasks = App.getData('tasks');
        const labels = [];
        const completedData = [];
        const totalData = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));

            const dayTasks = tasks.filter(t => t.date === dateStr);
            completedData.push(dayTasks.filter(t => t.status === 'completed').length);
            totalData.push(dayTasks.length);
        }

        productivityChart = new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Completed',
                        data: completedData,
                        borderColor: chartColors.green,
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: chartColors.green,
                        borderWidth: 2
                    },
                    {
                        label: 'Total Tasks',
                        data: totalData,
                        borderColor: chartColors.cyan,
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: chartColors.cyan,
                        borderWidth: 2
                    }
                ]
            },
            options: defaultOptions
        });
    }

    function renderDailyMessages() {
        const canvas = App.$('#dailyMessagesChart');
        if (messagesChart) messagesChart.destroy();

        const messages = App.getData('messages');
        const labels = [];
        const data = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            labels.push(d.toLocaleDateString('en-IN', { weekday: 'short' }));

            const dayMsgs = messages.filter(m => m.date === dateStr);
            data.push(dayMsgs.reduce((s, m) => s + (Number(m.count) || 0), 0));
        }

        messagesChart = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Messages',
                    data,
                    backgroundColor: 'rgba(168, 85, 247, 0.4)',
                    borderColor: chartColors.purple,
                    borderWidth: 1,
                    borderRadius: 6,
                    barPercentage: 0.5
                }]
            },
            options: {
                ...defaultOptions,
                plugins: { legend: { display: false } }
            }
        });
    }

    function createGradientBars(canvas, color1, color2) {
        try {
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 200);
            gradient.addColorStop(0, color1 + '99');
            gradient.addColorStop(1, color2 + '33');
            return gradient;
        } catch {
            return color1 + '66';
        }
    }

    return { refresh };
})();

/* ============================
   Expense Insights — Smart Spending Analysis
   ============================ */
const Insights = (() => {
    function refresh() {
        const container = document.getElementById('insightsContent');
        if (!container) return;
        const expenses = App.getData('expenses');
        const income = App.getData('income');
        const todayStr = App.today();
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
        const lastMonth = now.getMonth() === 0
            ? `${now.getFullYear()-1}-12`
            : `${now.getFullYear()}-${String(now.getMonth()).padStart(2,'0')}`;

        const thisMonthExp = expenses.filter(e => e.date && e.date.startsWith(thisMonth));
        const lastMonthExp = expenses.filter(e => e.date && e.date.startsWith(lastMonth));
        const thisMonthTotal = thisMonthExp.reduce((s,e) => s + (Number(e.amount)||0), 0);
        const lastMonthTotal = lastMonthExp.reduce((s,e) => s + (Number(e.amount)||0), 0);

        // Daily average
        const dayOfMonth = now.getDate();
        const dailyAvg = dayOfMonth > 0 ? Math.round(thisMonthTotal / dayOfMonth) : 0;

        // Top category
        const catTotals = {};
        thisMonthExp.forEach(e => {
            catTotals[e.category] = (catTotals[e.category]||0) + (Number(e.amount)||0);
        });
        const topCat = Object.entries(catTotals).sort((a,b) => b[1]-a[1])[0];

        // Spending velocity
        const projectedTotal = dailyAvg * new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();

        // Unusual spends (> 2x daily avg)
        const unusualSpends = thisMonthExp.filter(e => (Number(e.amount)||0) > dailyAvg * 2 && dailyAvg > 0);

        // Change vs last month
        const change = lastMonthTotal > 0 ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) : 0;
        const changeIcon = change > 0 ? 'trending_up' : change < 0 ? 'trending_down' : 'trending_flat';
        const changeColor = change > 0 ? '#ef4444' : change < 0 ? '#22c55e' : '#94a3b8';

        // Category breakdown for chart
        const catEntries = Object.entries(catTotals).sort((a,b) => b[1]-a[1]);
        const catEmojis = { Food:'🍔', Travel:'🚗', Shopping:'🛍️', Bills:'📄', Health:'💊', Entertainment:'🎮', Other:'📦' };

        // Daily spending for the last 7 days
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const ds = d.toISOString().split('T')[0];
            const total = expenses.filter(e => e.date === ds).reduce((s,e) => s + (Number(e.amount)||0), 0);
            last7.push({ date: ds, day: d.toLocaleDateString('en-IN',{weekday:'short'}), total });
        }
        const max7 = Math.max(...last7.map(d=>d.total), 1);

        let html = `
        <div class="insights-hero">
            <div class="insight-big-card">
                <div class="insight-big-icon"><span class="material-icons-round">account_balance_wallet</span></div>
                <div class="insight-big-info">
                    <span class="insight-big-value">₹${thisMonthTotal.toLocaleString('en-IN')}</span>
                    <span class="insight-big-label">Spent This Month</span>
                </div>
                <div class="insight-change" style="color:${changeColor}">
                    <span class="material-icons-round">${changeIcon}</span>
                    <span>${Math.abs(change)}% vs last month</span>
                </div>
            </div>
        </div>

        <div class="insight-grid">
            <div class="insight-card insight-card-blue">
                <span class="material-icons-round">speed</span>
                <span class="insight-card-value">₹${dailyAvg.toLocaleString('en-IN')}</span>
                <span class="insight-card-label">Daily Average</span>
            </div>
            <div class="insight-card insight-card-purple">
                <span class="material-icons-round">rocket_launch</span>
                <span class="insight-card-value">₹${projectedTotal.toLocaleString('en-IN')}</span>
                <span class="insight-card-label">Projected Total</span>
            </div>
            <div class="insight-card insight-card-green">
                <span class="material-icons-round">emoji_events</span>
                <span class="insight-card-value">${topCat ? topCat[0] : '—'}</span>
                <span class="insight-card-label">Top Category</span>
            </div>
            <div class="insight-card insight-card-orange">
                <span class="material-icons-round">warning</span>
                <span class="insight-card-value">${unusualSpends.length}</span>
                <span class="insight-card-label">Unusual Spends</span>
            </div>
        </div>

        <div class="insight-section">
            <h3><span class="material-icons-round">bar_chart</span> Last 7 Days</h3>
            <div class="insight-bar-chart">
                ${last7.map(d => `
                    <div class="insight-bar-col">
                        <span class="insight-bar-val">₹${d.total}</span>
                        <div class="insight-bar" style="height:${Math.max((d.total/max7)*100, 4)}%"></div>
                        <span class="insight-bar-label">${d.day}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="insight-section">
            <h3><span class="material-icons-round">donut_large</span> Category Breakdown</h3>
            <div class="insight-cat-list">
                ${catEntries.length === 0 ? '<p class="text-muted" style="text-align:center;padding:20px">No expenses this month</p>' :
                catEntries.map(([cat, total]) => {
                    const pct = thisMonthTotal > 0 ? Math.round((total/thisMonthTotal)*100) : 0;
                    return `
                    <div class="insight-cat-row">
                        <span class="insight-cat-emoji">${catEmojis[cat]||'📦'}</span>
                        <span class="insight-cat-name">${cat}</span>
                        <div class="insight-cat-bar-wrap"><div class="insight-cat-bar" style="width:${pct}%"></div></div>
                        <span class="insight-cat-amount">₹${total.toLocaleString('en-IN')}</span>
                        <span class="insight-cat-pct">${pct}%</span>
                    </div>`;
                }).join('')}
            </div>
        </div>

        ${unusualSpends.length > 0 ? `
        <div class="insight-section">
            <h3><span class="material-icons-round">notification_important</span> Unusual Spending</h3>
            <div class="insight-alerts">
                ${unusualSpends.map(e => `
                    <div class="insight-alert-card">
                        <span class="material-icons-round">warning_amber</span>
                        <div>
                            <strong>₹${Number(e.amount).toLocaleString('en-IN')}</strong> on ${e.category}
                            <br><small>${App.formatDate(e.date)}${e.notes ? ' — '+e.notes : ''}</small>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}

        <div class="insight-section">
            <h3><span class="material-icons-round">tips_and_updates</span> Smart Tips</h3>
            <div class="insight-tips">
                ${generateTips(thisMonthTotal, lastMonthTotal, dailyAvg, topCat, catEntries, projectedTotal)}
            </div>
        </div>`;

        container.innerHTML = html;
    }

    function generateTips(thisTotal, lastTotal, dailyAvg, topCat, catEntries, projected) {
        const tips = [];
        if (thisTotal > lastTotal && lastTotal > 0) {
            tips.push(`<div class="insight-tip"><span class="material-icons-round">trending_up</span> You're spending ${Math.round(((thisTotal-lastTotal)/lastTotal)*100)}% more than last month. Consider reviewing your expenses.</div>`);
        }
        if (topCat && topCat[0] === 'Food') {
            tips.push(`<div class="insight-tip"><span class="material-icons-round">restaurant</span> Food is your top expense. Try meal-prepping to save money!</div>`);
        }
        if (topCat && topCat[0] === 'Entertainment') {
            tips.push(`<div class="insight-tip"><span class="material-icons-round">sports_esports</span> Entertainment spending is high. Look for free alternatives!</div>`);
        }
        if (dailyAvg > 0 && projected > lastTotal * 1.2 && lastTotal > 0) {
            tips.push(`<div class="insight-tip"><span class="material-icons-round">savings</span> At this rate, you'll spend ₹${projected.toLocaleString('en-IN')} this month. Consider cutting back.</div>`);
        }
        if (catEntries.length === 1) {
            tips.push(`<div class="insight-tip"><span class="material-icons-round">category</span> All spending in one category. Make sure you're tracking everything!</div>`);
        }
        if (tips.length === 0) {
            tips.push(`<div class="insight-tip"><span class="material-icons-round">thumb_up</span> Your spending looks healthy! Keep it up!</div>`);
        }
        return tips.join('');
    }

    return { refresh };
})();

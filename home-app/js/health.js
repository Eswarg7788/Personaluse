/* ============================
   Health Log Module
   ============================ */
const Health = (() => {
    function refresh() {
        const container = App.$('#healthContent');
        if (!container) return;
        const logs = App.getData('health');
        const todayStr = App.today();
        const todayLog = logs.find(l => l.date === todayStr);
        const last7 = getLast7Days(logs);

        container.innerHTML = `
            <div class="health-today-card">
                <h3 class="health-section-title"><span class="material-icons-round">today</span> Today's Log</h3>
                <div class="health-metrics">
                    <div class="health-metric"><span class="health-metric-icon">⚖️</span><label>Weight (kg)</label><input type="number" id="healthWeight" step="0.1" placeholder="0" value="${todayLog?.weight || ''}"></div>
                    <div class="health-metric"><span class="health-metric-icon">💧</span><label>Water (glasses)</label><input type="number" id="healthWater" min="0" max="20" placeholder="0" value="${todayLog?.water || ''}"></div>
                    <div class="health-metric"><span class="health-metric-icon">😴</span><label>Sleep (hrs)</label><input type="number" id="healthSleep" step="0.5" min="0" max="24" placeholder="0" value="${todayLog?.sleep || ''}"></div>
                    <div class="health-metric"><span class="health-metric-icon">🏃</span><label>Exercise (min)</label><input type="number" id="healthExercise" min="0" placeholder="0" value="${todayLog?.exercise || ''}"></div>
                </div>
                <button class="btn-primary" id="btnSaveHealth"><span class="material-icons-round">save</span> Save Today's Log</button>
            </div>
            <div class="health-trend-card">
                <h3 class="health-section-title"><span class="material-icons-round">show_chart</span> 7-Day Trends</h3>
                <div class="health-trend-grid">
                    ${renderMiniTrend('Water 💧', last7.map(d => d.water), 8, 'glasses')}
                    ${renderMiniTrend('Sleep 😴', last7.map(d => d.sleep), 9, 'hrs')}
                    ${renderMiniTrend('Exercise 🏃', last7.map(d => d.exercise), 60, 'min')}
                </div>
            </div>
            <div class="health-history">
                <h3 class="health-section-title"><span class="material-icons-round">history</span> History</h3>
                <div class="health-history-list">
                    ${logs.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,14).map(l=>`<div class="health-history-item"><span class="health-hist-date">${App.formatDateShort(l.date)}</span><div class="health-hist-values">${l.weight?`<span>⚖️${l.weight}kg</span>`:''} ${l.water?`<span>💧${l.water}</span>`:''} ${l.sleep?`<span>😴${l.sleep}h</span>`:''} ${l.exercise?`<span>🏃${l.exercise}m</span>`:''}</div></div>`).join('')}
                    ${logs.length===0?'<p class="text-muted" style="padding:12px;text-align:center">No history yet</p>':''}
                </div>
            </div>`;
        App.$('#btnSaveHealth')?.addEventListener('click', saveToday);
    }

    function saveToday() {
        const w=App.$('#healthWeight')?.value||'', wa=App.$('#healthWater')?.value||'', s=App.$('#healthSleep')?.value||'', e=App.$('#healthExercise')?.value||'';
        if(!w&&!wa&&!s&&!e){App.showToast('Fill at least one metric','warning');return;}
        let logs=App.getData('health'); const todayStr=App.today(); const idx=logs.findIndex(l=>l.date===todayStr);
        const entry={date:todayStr,weight:w,water:wa,sleep:s,exercise:e,timestamp:Date.now()};
        if(idx>=0)logs[idx]=entry; else logs.push(entry);
        App.setData('health',logs); App.showToast('Health log saved! 💪','success'); refresh();
    }

    function getLast7Days(logs) {
        const r=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const ds=d.toISOString().split('T')[0];const l=logs.find(x=>x.date===ds);r.push({date:ds,weight:l?Number(l.weight)||0:0,water:l?Number(l.water)||0:0,sleep:l?Number(l.sleep)||0:0,exercise:l?Number(l.exercise)||0:0});}return r;
    }

    function renderMiniTrend(label,values,maxVal,unit) {
        const max=maxVal||Math.max(...values,1);
        const bars=values.map((v,i)=>{const h=Math.max(4,(v/max)*40);const d=new Date();d.setDate(d.getDate()-(6-i));const dn=['S','M','T','W','T','F','S'][d.getDay()];return`<div class="mini-bar-col"><div class="mini-bar" style="height:${h}px" title="${v} ${unit}"></div><span class="mini-bar-label">${dn}</span></div>`;}).join('');
        const latest=values[values.length-1];
        return`<div class="mini-trend-card"><div class="mini-trend-header"><span class="mini-trend-label">${label}</span><span class="mini-trend-value">${latest||'—'} ${latest?unit:''}</span></div><div class="mini-bar-chart">${bars}</div></div>`;
    }

    document.addEventListener('DOMContentLoaded',()=>{});
    return { refresh };
})();

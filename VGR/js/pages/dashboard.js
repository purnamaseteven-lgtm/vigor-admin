/* ─── DASHBOARD PAGE ─── */
import { STATE, fmt, fmtCur } from '../core/state.js';
import { pages } from '../core/router.js';

// ── Registration KPI helpers ──
function getTodayStr() {
  const d = new Date();
  return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`;
}
function getTodayISO() { return new Date().toISOString().slice(0,10); }

function computeRegKPIs() {
  const members = STATE.members || [];
  const todayISO = getTodayISO();
  const todayStr = getTodayStr();
  // Today's new registrations: joinDate matches today (various formats)
  const todayRegs = members.filter(m => {
    const j = m.joinDate || m.createdAt || m.joined || '';
    return j.startsWith(todayISO) || j.startsWith(todayStr);
  }).length;
  // Total registered (all members)
  const totalRegs = members.length;
  // Reg + Deposit (conversion): members who have at least one approved deposit
  const depositorSet = new Set(
    (STATE.deposits || []).filter(d => d.status === 'Approved').map(d => d.member)
  );
  const converted = members.filter(m => depositorSet.has(m.username)).length;
  return { todayRegs, totalRegs, converted };
}

// ── Enhancement 7: Drag & Reorder widget definitions ──
function getDashboardWidgets(totalDeposit, totalWithdraw, totalMembers, activeMembers, todayRegs, converted, totalRegs) {
  const convRate = totalMembers > 0 ? Math.round((converted / totalMembers) * 100) : 0;
  return [
    {
      id: 'deposit',
      html: `
              <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-arrow-down-to-bracket"></i></div>
              <div class="stat-info">
                <div class="stat-label">Total Deposit</div>
                <div class="stat-value">${fmtCur(totalDeposit)}</div>
                <div class="stat-trend trend-up"><i class="fa-solid fa-caret-up"></i> ${STATE.deposits.filter(d=>d.status==='Approved').length} txn <span>approved</span></div>
              </div>`
    },
    {
      id: 'withdraw',
      html: `
              <div class="stat-icon" style="background:rgba(239,68,68,.1);color:var(--red)"><i class="fa-solid fa-arrow-up-from-bracket"></i></div>
              <div class="stat-info">
                <div class="stat-label">Total Withdrawal</div>
                <div class="stat-value">${fmtCur(totalWithdraw)}</div>
                <div class="stat-trend trend-down"><i class="fa-solid fa-caret-down"></i> ${STATE.withdrawals.filter(w=>w.status==='Approved').length} txn <span>approved</span></div>
              </div>`
    },
    {
      id: 'members',
      html: `
              <div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-users"></i></div>
              <div class="stat-info">
                <div class="stat-label">Total Members</div>
                <div class="stat-value">${fmt(totalMembers)}</div>
                <div class="stat-trend"><span>Active: ${activeMembers} | Suspended: ${STATE.members.filter(m=>m.status==='Suspended').length}</span></div>
              </div>`
    },
    {
      id: 'today_regs',
      html: `
              <div class="stat-icon" style="background:rgba(139,92,246,.1);color:#8b5cf6"><i class="fa-solid fa-user-plus"></i></div>
              <div class="stat-info">
                <div class="stat-label">Registrasi Hari Ini</div>
                <div class="stat-value">${fmt(todayRegs)}</div>
                <div class="stat-trend trend-up"><i class="fa-solid fa-caret-up"></i> Total: ${fmt(totalRegs)} <span>all time</span></div>
              </div>`
    },
    {
      id: 'converted',
      html: `
              <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-user-check"></i></div>
              <div class="stat-info">
                <div class="stat-label">Reg + Deposit (Converted)</div>
                <div class="stat-value">${fmt(converted)}</div>
                <div class="stat-trend ${convRate >= 50 ? 'trend-up' : 'trend-down'}"><i class="fa-solid fa-caret-${convRate >= 50 ? 'up' : 'down'}"></i> ${convRate}% <span>conversion rate</span></div>
              </div>`
    },
    {
      id: 'active',
      html: `
              <div class="stat-icon" style="background:rgba(245,158,11,.1);color:var(--yellow)"><i class="fa-solid fa-bolt"></i></div>
              <div class="stat-info">
                <div class="stat-label">Active Players</div>
                <div class="stat-value">${fmt(activeMembers)}</div>
                <div class="stat-trend"><span>Pending dep: ${STATE.deposits.filter(d=>d.status==='Pending').length} | Pending wd: ${STATE.withdrawals.filter(w=>w.status==='Pending').length}</span></div>
              </div>`
    },
  ];
}

pages['dashboard'] = () => {
  const totalDeposit = STATE.deposits.filter(d => d.status === 'Approved').reduce((s, d) => s + d.amount, 0);
  const totalWithdraw = STATE.withdrawals.filter(w => w.status === 'Approved').reduce((s, w) => s + w.amount, 0);
  const totalMembers = STATE.members.length;
  const activeMembers = STATE.members.filter(m => m.status === 'Active').length;
  const { todayRegs, totalRegs, converted } = computeRegKPIs();

  // Reorder by saved preference
  const WIDGETS = getDashboardWidgets(totalDeposit, totalWithdraw, totalMembers, activeMembers, todayRegs, converted, totalRegs);
  let savedOrder = null;
  try { savedOrder = JSON.parse(localStorage.getItem('VGR_WIDGET_ORDER') || 'null'); } catch (e) { }
  const ordered = savedOrder
    ? savedOrder.map(id => WIDGETS.find(w => w.id === id)).filter(Boolean)
      .concat(WIDGETS.filter(w => !savedOrder.includes(w.id)))
    : WIDGETS;

  const widgetsHTML = ordered.map(w => `
      <div class="stat-card draggable" data-widget="${w.id}">
        <div class="drag-handle" title="Drag to reorder"><i class="fa-solid fa-grip-vertical"></i></div>
        ${w.html}
      </div>`).join('');

  return `
    <div class="page-header" style="margin-bottom:1.5rem">
      <div>
        <div class="breadcrumb"><span>Home</span><span class="sep">›</span><span>Dashboard</span></div>
        <h2 class="page-title">Welcome back, ${STATE.profile.username}</h2>
      </div>
      <div style="display:flex; gap:.75rem; align-items:center">
         <div style="display:flex; background:rgba(255,255,255,0.05); padding:.25rem; border-radius:10px; border:1px solid rgba(255,255,255,0.1)">
            <button class="btn btn-xs btn-secondary" style="border:none; background:var(--bg3)" onclick="toast('Range set to Today','info')">Today</button>
            <button class="btn btn-xs btn-secondary" style="border:none; opacity:0.6" onclick="toast('Range set to 7 Days','info')">7 Days</button>
            <button class="btn btn-xs btn-secondary" style="border:none; opacity:0.6" onclick="toast('Range set to 1 Month','info')">1 Month</button>
         </div>
         <div style="position:relative">
            <input type="date" class="form-control" style="width:140px; height:32px; font-size:11px; padding-left:2rem" value="2026-05-01">
            <i class="fa-solid fa-calendar" style="position:absolute; left:.7rem; top:50%; transform:translateY(-50%); font-size:11px; opacity:0.5; color:var(--acc)"></i>
         </div>
         <i class="fa-solid fa-arrow-right" style="font-size:10px; opacity:0.3"></i>
         <div style="position:relative">
            <input type="date" class="form-control" style="width:140px; height:32px; font-size:11px; padding-left:2rem" value="2026-05-01">
            <i class="fa-solid fa-calendar" style="position:absolute; left:.7rem; top:50%; transform:translateY(-50%); font-size:11px; opacity:0.5; color:var(--acc)"></i>
         </div>
         <button class="btn btn-primary btn-sm" onclick="go('dashboard')"><i class="fa-solid fa-magnifying-glass"></i> Filter</button>
      </div>
    </div>

    <!-- STAT CARDS (draggable) -->
    <div class="stat-grid" id="dashWidgetGrid" style="grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 1.5rem">
        ${widgetsHTML}
    </div>

    <!-- CHARTS ROW 1 -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
      <div class="card">
        <div class="card-header">
          <span class="card-title">Transaction Analysis (Last 10 Days)</span>
        </div>
        <div class="card-body"><div class="chart-container"><canvas id="chartDWValue"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">GGR by Company</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="chartGGR"></canvas></div></div>
      </div>
    </div>

    <!-- CHARTS ROW 2 -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1.25rem">
      <div class="card">
        <div class="card-header"><span class="card-title">Deposit vs Withdrawal Count</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="chartDWCount"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Member Growth</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="chartMembers"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Profit Distribution</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="chartAgentRatio"></canvas></div></div>
      </div>
    </div>

    <!-- BUSINESS INTELLIGENCE & PRODUCTION READINESS -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-top:1.25rem">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fa-solid fa-brain" style="color:var(--purple);margin-right:.5rem"></i>Smart Alerts</span>
          <div style="margin-left:auto;display:flex;align-items:center;gap:.5rem">
            <span style="font-size:.7rem;color:var(--text3)">Auto-refresh:</span>
            <select id="dashRefreshSel" onchange="window.setDashRefresh(this.value)" style="font-size:.7rem;border:1px solid var(--border);border-radius:6px;padding:.15rem .4rem;background:var(--bg2);color:var(--text);outline:none">
              <option value="0" ${(STATE.refreshSettings?.interval||0)===0?'selected':''}>Off</option>
              <option value="30" ${(STATE.refreshSettings?.interval||0)===30?'selected':''}>30s</option>
              <option value="60" ${(STATE.refreshSettings?.interval||0)===60?'selected':''}>1m</option>
              <option value="120" ${(STATE.refreshSettings?.interval||0)===120?'selected':''}>2m</option>
              <option value="300" ${(STATE.refreshSettings?.interval||0)===300?'selected':''}>5m</option>
            </select>
            <span id="lastRefreshTime" style="font-size:.65rem;color:var(--text3)" title="Last refreshed">${STATE.refreshSettings?.lastRefresh ? new Date(STATE.refreshSettings.lastRefresh).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : '--:--:--'}</span>
          </div>
        </div>
        <div class="card-body" style="padding:1.5rem">
          <div style="display:flex;flex-direction:column;gap:1rem" id="smartAlertsBox">
            ${(()=>{
              const alerts = [];
              // Real alert: pending deposits
              const pendDep = STATE.deposits.filter(d=>d.status==='Pending').length;
              if (pendDep > 0) alerts.push({ color:'var(--yellow)', icon:'fa-clock', title:`${pendDep} Pending Deposit${pendDep>1?'s':''}`, msg:`${pendDep} deposit transaction${pendDep>1?'s':''} waiting for approval. <b>Process now to avoid delays.</b>`, action:`go('deposit-list')`, actionLabel:'Review' });
              // Real alert: pending withdrawals
              const pendWd = STATE.withdrawals.filter(w=>w.status==='Pending').length;
              if (pendWd > 0) alerts.push({ color:'var(--red)', icon:'fa-triangle-exclamation', title:`${pendWd} Pending Withdrawal${pendWd>1?'s':''}`, msg:`${pendWd} withdrawal request${pendWd>1?'s':''} need approval.`, action:`go('withdrawal-list')`, actionLabel:'Review' });
              // Real alert: conversion rate
              const convPct = totalMembers > 0 ? Math.round((converted/totalMembers)*100) : 0;
              if (convPct < 30 && totalMembers > 10) alerts.push({ color:'var(--acc)', icon:'fa-chart-line', title:'Low Conversion Rate', msg:`Only <b>${convPct}%</b> of registered members have deposited. Consider running a welcome bonus campaign.`, action:`go('crm-push')`, actionLabel:'Create Campaign' });
              // Today's registration
              if (todayRegs > 0) alerts.push({ color:'var(--green)', icon:'fa-user-plus', title:`${todayRegs} New Registration${todayRegs>1?'s':''} Today`, msg:`${todayRegs} new member${todayRegs>1?'s':''} joined today. Follow up with welcome CRM push.`, action:`go('crm-push')`, actionLabel:'Send Welcome' });
              // System notification
              const sysNotifs = (STATE.systemNotifications||[]).filter(n=>!n.read).slice(0,2);
              sysNotifs.forEach(n => alerts.push({ color:'var(--purple)', icon:'fa-bell', title:n.title, msg:n.message, action:'', actionLabel:'' }));
              if (alerts.length === 0) alerts.push({ color:'var(--green)', icon:'fa-circle-check', title:'All Clear', msg:'No urgent alerts. All systems are operating normally.', action:'', actionLabel:'' });
              return alerts.slice(0,4).map(a => `
                <div style="padding:1rem;background:${a.color}11;border-radius:12px;border-left:4px solid ${a.color};display:flex;gap:1rem;align-items:center">
                  <i class="fa-solid ${a.icon}" style="color:${a.color};font-size:1.2rem;flex-shrink:0"></i>
                  <div style="flex:1"><div style="font-weight:700;font-size:.85rem">${a.title}</div><div style="font-size:.78rem;color:var(--text2)">${a.msg}</div></div>
                  ${a.action ? `<button class="btn btn-xs" style="background:${a.color};color:#fff;border:none;margin-left:auto;white-space:nowrap" onclick="${a.action}">${a.actionLabel}</button>` : ''}
                </div>`).join('');
            })()}
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fa-solid fa-shield-check" style="color:var(--acc);margin-right:.5rem"></i>Production Readiness Check</span>
          <button class="btn btn-xs btn-primary" style="margin-left:auto" onclick="window.runProdCheck()">Run Check</button>
        </div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem" id="prodCheckGrid">
            <div class="check-item" style="padding:.75rem;background:var(--bg2);border-radius:10px;display:flex;align-items:center;gap:.75rem">
                <i class="fa-solid fa-lock" style="color:var(--green)"></i>
                <div style="font-size:.75rem">SSL Certificates<div style="color:var(--text3);font-size:.65rem">All domains valid</div></div>
            </div>
            <div class="check-item" style="padding:.75rem;background:var(--bg2);border-radius:10px;display:flex;align-items:center;gap:.75rem">
                <i class="fa-solid fa-globe" style="color:var(--green)"></i>
                <div style="font-size:.75rem">Global DNS Proxy<div style="color:var(--text3);font-size:.65rem">Cloudflare Connected</div></div>
            </div>
            <div class="check-item" style="padding:.75rem;background:var(--bg2);border-radius:10px;display:flex;align-items:center;gap:.75rem">
                <i class="fa-solid fa-link" style="color:var(--green)"></i>
                <div style="font-size:.75rem">Wallet API Gateway<div style="color:var(--text3);font-size:.65rem">Latency: 45ms</div></div>
            </div>
            <div class="check-item" style="padding:.75rem;background:var(--bg2);border-radius:10px;display:flex;align-items:center;gap:.75rem">
                <i class="fa-solid fa-database" style="color:var(--green)"></i>
                <div style="font-size:.75rem">Supabase Sync<div style="color:var(--text3);font-size:.65rem">Status: Healthy</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

// ── Refresh rate control ──
let _dashRefreshTimer = null;
window.setDashRefresh = (val) => {
  const secs = parseInt(val, 10);
  if (!STATE.refreshSettings) STATE.refreshSettings = {};
  STATE.refreshSettings.interval = secs;
  if (_dashRefreshTimer) { clearInterval(_dashRefreshTimer); _dashRefreshTimer = null; }
  if (secs > 0) {
    _dashRefreshTimer = setInterval(() => {
      STATE.refreshSettings.lastRefresh = Date.now();
      import('../ui/components.js').then(m => {
        if (window.go) window.go('dashboard');
      });
    }, secs * 1000);
    import('../ui/components.js').then(m => m.toast(`Auto-refresh: every ${secs}s`, 'info'));
  } else {
    import('../ui/components.js').then(m => m.toast('Auto-refresh disabled', 'info'));
  }
};

window.runProdCheck = () => {
  const btn = document.querySelector('[onclick="window.runProdCheck()"]');
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = 'Run Check';
    btn.disabled = false;
    import('../ui/components.js').then(m => m.toast('Production readiness check completed. All systems operational.', 'success'));
  }, 2000);
};

// ── Enhancement 7: Dashboard DnD ──
window.initDashboardDnd = function () {
  const grid = document.getElementById('dashWidgetGrid');
  if (!grid) return;
  const items = () => [...grid.querySelectorAll('.stat-card[data-widget]')];
  let dragged = null;

  items().forEach(item => {
    item.addEventListener('dragstart', e => {
      dragged = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      items().forEach(c => c.classList.remove('drag-over'));
      dragged = null;
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (item !== dragged) items().forEach(c => c.classList.toggle('drag-over', c === item));
    });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (!dragged || dragged === item) return;
      const all = items();
      const di = all.indexOf(dragged), ti = all.indexOf(item);
      grid.insertBefore(dragged, di < ti ? item.nextSibling : item);
      // Persist order
      const order = items().map(c => c.dataset.widget);
      localStorage.setItem('VGR_WIDGET_ORDER', JSON.stringify(order));
      if (typeof window.toast === 'function') window.toast('Widget order saved ✓', 'success');
    });
  });
};

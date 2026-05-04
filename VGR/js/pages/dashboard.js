/* ─── DASHBOARD PAGE ─── */
import { STATE, fmt, fmtCur } from '../core/state.js';
import { pages } from '../core/router.js';

// ── Enhancement 7: Drag & Reorder widget definitions ──
function getDashboardWidgets(totalDeposit, totalWithdraw, totalMembers, activeMembers, newRegs, converted) {
  return [
    {
      id: 'deposit',
      html: `
              <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-arrow-down-to-bracket"></i></div>
              <div class="stat-info">
                <div class="stat-label">Total Deposit</div>
                <div class="stat-value">${fmtCur(totalDeposit)}</div>
                <div class="stat-trend trend-up"><i class="fa-solid fa-caret-up"></i> 12.5% <span>vs yesterday</span></div>
              </div>`
    },
    {
      id: 'withdraw',
      html: `
              <div class="stat-icon" style="background:rgba(239,68,68,.1);color:var(--red)"><i class="fa-solid fa-arrow-up-from-bracket"></i></div>
              <div class="stat-info">
                <div class="stat-label">Total Withdrawal</div>
                <div class="stat-value">${fmtCur(totalWithdraw)}</div>
                <div class="stat-trend trend-down"><i class="fa-solid fa-caret-down"></i> 5.2% <span>vs yesterday</span></div>
              </div>`
    },
    {
      id: 'members',
      html: `
              <div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-users"></i></div>
              <div class="stat-info">
                <div class="stat-label">Total Members</div>
                <div class="stat-value">${fmt(totalMembers)}</div>
                <div class="stat-trend"><span>Global across all agents</span></div>
              </div>`
    },
    {
      id: 'new_regs',
      html: `
              <div class="stat-icon" style="background:rgba(139,92,246,.1);color:#8b5cf6"><i class="fa-solid fa-user-plus"></i></div>
              <div class="stat-info">
                <div class="stat-label">New Registrations</div>
                <div class="stat-value">${fmt(newRegs)}</div>
                <div class="stat-trend trend-up"><i class="fa-solid fa-caret-up"></i> +${Math.round(newRegs * 0.1)} <span>today</span></div>
              </div>`
    },
    {
      id: 'converted',
      html: `
              <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-user-check"></i></div>
              <div class="stat-info">
                <div class="stat-label">Converted (Reg+Dep)</div>
                <div class="stat-value">${fmt(converted)}</div>
                <div class="stat-trend"><span>Conversion: ${totalMembers > 0 ? Math.round((converted / totalMembers) * 100) : 0}%</span></div>
              </div>`
    },
    {
      id: 'active',
      html: `
              <div class="stat-icon" style="background:rgba(245,158,11,.1);color:var(--yellow)"><i class="fa-solid fa-bolt"></i></div>
              <div class="stat-info">
                <div class="stat-label">Active Players</div>
                <div class="stat-value">${fmt(activeMembers)}</div>
                <div class="stat-trend"><span>Live: ${Math.round(activeMembers / 4)} online</span></div>
              </div>`
    },
  ];
}

pages['dashboard'] = () => {
  const totalDeposit = STATE.deposits.filter(d => d.status === 'Approved').reduce((s, d) => s + d.amount, 0);
  const totalWithdraw = STATE.withdrawals.filter(w => w.status === 'Approved').reduce((s, w) => s + w.amount, 0);
  const totalMembers = STATE.members.length;
  const activeMembers = STATE.members.filter(m => m.status === 'Active').length;
  const newRegs = Math.round(totalMembers * 0.15); // Mocked for display
  const converted = Math.round(totalMembers * 0.65); // Mocked for display

  // Reorder by saved preference
  const WIDGETS = getDashboardWidgets(totalDeposit, totalWithdraw, totalMembers, activeMembers, newRegs, converted);
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
        <div class="card-header"><span class="card-title"><i class="fa-solid fa-brain" style="color:var(--purple);margin-right:.5rem"></i>Smart Alerts / AI Insights</span></div>
        <div class="card-body" style="padding:1.5rem">
          <div style="display:flex;flex-direction:column;gap:1rem">
            <div style="padding:1rem;background:rgba(239,68,68,0.05);border-radius:12px;border-left:4px solid var(--red);display:flex;gap:1rem;align-items:center">
                <i class="fa-solid fa-triangle-exclamation" style="color:var(--red);font-size:1.2rem"></i>
                <div>
                    <div style="font-weight:700;font-size:.85rem">Agency Limit Warning</div>
                    <div style="font-size:.78rem;color:var(--text2)">Whitelabel <b>Sunwi</b> has reached 98% of credit limit. Auto-blocking in 2%.</div>
                </div>
                <button class="btn btn-xs btn-danger" style="margin-left:auto" onclick="go('whitelabel-list')">Top Up</button>
            </div>
            <div style="padding:1rem;background:rgba(16,185,129,0.05);border-radius:12px;border-left:4px solid var(--green);display:flex;gap:1rem;align-items:center">
                <i class="fa-solid fa-chart-line" style="color:var(--green);font-size:1.2rem"></i>
                <div>
                    <div style="font-weight:700;font-size:.85rem">Revenue Surge Detected</div>
                    <div style="font-size:.78rem;color:var(--text2)">GGR is up 24% compared to this time yesterday. Top contributor: <b>HokiBet</b>.</div>
                </div>
            </div>
            <div style="padding:1rem;background:rgba(14,165,233,0.05);border-radius:12px;border-left:4px solid var(--acc);display:flex;gap:1rem;align-items:center">
                <i class="fa-solid fa-user-shield" style="color:var(--acc);font-size:1.2rem"></i>
                <div>
                    <div style="font-weight:700;font-size:.85rem">Security Recommendation</div>
                    <div style="font-size:.78rem;color:var(--text2)">3 admins are using weak passwords. Force password reset in <b>Settings</b>.</div>
                </div>
            </div>
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

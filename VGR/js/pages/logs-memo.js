/* ─── LOGS & MEMO PAGES ─── */
import { STATE, stateAdd } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsActions, tableWrap, badge, renderPagerHTML, toast } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage, rnd, MEMBERS } from '../utils/helpers.js';

pages['logs-admin'] = () => {
    const PG = 'logs-admin';
    const filtered = filterData(STATE.logs, PG);
    const total = filtered.length;
    const pp = getPerPage(PG);
    const cp = getCurPage(PG);
    const rows = paginate(filtered, cp, pp);

    return `
    ${pageHeader('Admin Logs', '<span>System</span><span class="sep">›</span><span>Admin Logs</span>')}
    ${filterCard(`
      ${fsInput(PG, 'actor', 'Actor', 'Search actor...')}
      ${fsInput(PG, 'action', 'Action', 'Search action...')}
      ${fsActions(PG)}
    `)}
    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Actor</th>
                <th>IP Address</th>
                <th>Action</th>
                <th>Target</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map(l => `
                <tr>
                  <td style="font-size:.72rem;white-space:nowrap">${l.date}</td>
                  <td><strong>${l.actor}</strong></td>
                  <td style="font-size:.72rem">${l.ip}</td>
                  <td>${badge(l.action, 'indigo')}</td>
                  <td>${l.target}</td>
                  <td style="font-size:.75rem;max-width:300px">${l.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>
    ${renderPagerHTML(PG, total, pp, cp)}
  `;
};

pages['memo-list'] = () => {
    return `
    ${pageHeader('Memo / Inbox', '<span>System</span><span class="sep">›</span><span>Memos</span>')}
    <div style="display:grid;grid-template-columns:240px 1fr;gap:1.5rem">
      <div class="card">
        <div class="card-body" style="padding:0">
          <div style="padding:1rem;border-bottom:1px solid var(--border)">
            <button class="btn btn-primary w-full" onclick="toast('Compose memo','info')"><i class="fa-solid fa-pen"></i> Compose</button>
          </div>
          <div class="memo-sidebar">
            <div class="memo-nav-item active"><i class="fa-solid fa-inbox"></i> Inbox <span class="badge badge-warning" style="margin-left:auto">2</span></div>
            <div class="memo-nav-item"><i class="fa-solid fa-paper-plane"></i> Sent</div>
            <div class="memo-nav-item"><i class="fa-solid fa-trash"></i> Trash</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          ${tableWrap(`
            <table>
              <thead>
                <tr>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${STATE.memos.inbox.map(m => `
                  <tr style="cursor:pointer; ${m.read ? '' : 'font-weight:700; background:rgba(14,165,233,.03)'}" onclick="toast('Opening memo...','info')">
                    <td>${m.from}</td>
                    <td>${m.subject}</td>
                    <td>${badge(m.category, 'blue')}</td>
                    <td style="font-size:.72rem">${m.date}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `)}
        </div>
      </div>
    </div>
  `;
};

/* ─── AUTO MEMO ─── */
pages['memo-auto'] = () => {
    const TRIGGER_TYPES = [
        { id: 'AM1', name: 'First Deposit Confirmation', trigger: 'On first deposit approved', target: 'Member', template: 'Dear {member}, your first deposit of {amount} has been approved. Welcome to VIGOR!', active: true, count: rnd(100, 500) },
        { id: 'AM2', name: 'Withdrawal Approved', trigger: 'On withdrawal approved', target: 'Member', template: 'Dear {member}, your withdrawal of {amount} has been processed. Please wait 1-3 business days.', active: true, count: rnd(50, 300) },
        { id: 'AM3', name: 'Withdrawal Rejected', trigger: 'On withdrawal rejected', target: 'Member', template: 'Dear {member}, your withdrawal request has been rejected. Please contact support.', active: false, count: rnd(10, 50) },
        { id: 'AM4', name: 'Account Suspended', trigger: 'On account suspended', target: 'Member', template: 'Your account {member} has been temporarily suspended. Contact admin for assistance.', active: true, count: rnd(5, 30) },
        { id: 'AM5', name: 'Bonus Credited', trigger: 'On bonus approved', target: 'Member', template: 'Dear {member}, bonus of {amount} has been credited to your account!', active: true, count: rnd(80, 400) },
        { id: 'AM6', name: 'VIP Tier Upgrade', trigger: 'On tier level up', target: 'Member', template: 'Congratulations {member}! You have been upgraded to {tier} tier!', active: true, count: rnd(20, 100) },
        { id: 'AM7', name: 'Credit Limit Warning', trigger: 'When credit reaches 80%', target: 'Company', template: 'Warning: {company} has reached 80% of credit limit. Please top up.', active: true, count: rnd(5, 20) },
        { id: 'AM8', name: 'Monthly Statement', trigger: 'Every 1st of month', target: 'Company', template: 'Monthly statement for {month} is ready. Total GGR: {amount}.', active: false, count: rnd(10, 30) },
    ];

    const recentAuto = Array.from({length: 10}, (_, i) => ({
        trigger: TRIGGER_TYPES[i % TRIGGER_TYPES.length].name,
        member: MEMBERS[i % MEMBERS.length],
        sentAt: `${rnd(20,27)}/04/2026 ${rnd(10,23)}:${String(rnd(10,59)).padStart(2,'0')}`,
        status: i % 8 === 0 ? 'Failed' : 'Sent'
    }));

    return `
    ${pageHeader('Auto Memo', '<span>Memo</span><span class="sep">›</span><span>Auto Memo</span>', `
      <button class="btn btn-primary" onclick="toast('Add auto memo rule','info')"><i class="fa-solid fa-plus"></i> Add Rule</button>`)}

    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-robot"></i></div>
        <div class="stat-info"><div class="stat-label">Total Rules</div><div class="stat-value">${TRIGGER_TYPES.length}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-circle-check"></i></div>
        <div class="stat-info"><div class="stat-label">Active Rules</div><div class="stat-value">${TRIGGER_TYPES.filter(t=>t.active).length}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,.1);color:var(--yellow)"><i class="fa-solid fa-paper-plane"></i></div>
        <div class="stat-info"><div class="stat-label">Sent Today</div><div class="stat-value">${rnd(50, 200)}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,.1);color:var(--red)"><i class="fa-solid fa-circle-xmark"></i></div>
        <div class="stat-info"><div class="stat-label">Failed</div><div class="stat-value">${rnd(0, 5)}</div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
      <div class="card">
        <div class="card-header"><span class="card-title">Auto Memo Rules</span></div>
        <div class="card-body" style="padding:0">
          ${TRIGGER_TYPES.map(t => `
            <div style="display:grid;grid-template-columns:1fr auto;align-items:center;gap:.75rem;padding:.9rem 1rem;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-weight:600;font-size:.85rem">${t.name}</div>
                <div style="font-size:.72rem;color:var(--text3);margin:.1rem 0">${t.trigger} → ${badge(t.target, 'indigo')}</div>
                <div style="font-size:.7rem;color:var(--text3);font-style:italic;margin-top:.2rem">"${t.template.slice(0, 60)}..."</div>
                <div style="font-size:.7rem;color:var(--text3);margin-top:.2rem">Sent: <strong>${t.count}</strong> times</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:.4rem;align-items:center">
                <label class="toggle"><input type="checkbox" ${t.active ? 'checked' : ''} onchange="toast('Rule '+(this.checked?'activated':'paused'),'success')"/><div class="toggle-slider"></div></label>
                <button class="btn btn-sm btn-icon" style="background:#f59e0b;color:#fff;padding:.2rem .5rem" onclick="toast('Edit ${t.name}','info')"><i class="fa-solid fa-pen"></i></button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Recent Auto-Sent Memos</span></div>
        <div class="card-body">
          ${tableWrap(`
            <table>
              <thead><tr><th>Trigger</th><th>Recipient</th><th>Sent At</th><th>Status</th></tr></thead>
              <tbody>
                ${recentAuto.map(r => `
                  <tr>
                    <td style="font-size:.75rem;font-weight:600">${r.trigger}</td>
                    <td style="font-size:.78rem">${r.member}</td>
                    <td style="font-size:.72rem;white-space:nowrap">${r.sentAt}</td>
                    <td>${badge(r.status, r.status==='Sent'?'success':'danger')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `)}
        </div>
      </div>
    </div>`;
};

/* ─── LOGS & MEMO PAGES ─── */
import { STATE, stateAdd, saveState } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsActions, tableWrap, badge, renderPagerHTML, openModal, closeModalBtn, toast } from '../ui/components.js';
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
            <button class="btn btn-primary w-full" onclick="window.openComposeMemoModal()"><i class="fa-solid fa-pen"></i> Compose</button>
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
    // Load auto-memo rule config from STATE.settings, with defaults
    const autoRuleConfigs = {
      AM1: { active: true, count: null }, AM2: { active: true, count: null },
      AM3: { active: false, count: null }, AM4: { active: true, count: null },
      AM5: { active: true, count: null }, AM6: { active: true, count: null },
      AM7: { active: true, count: null }, AM8: { active: false, count: null },
    };
    Object.keys(autoRuleConfigs).forEach(id => {
      const cfg = STATE.settings['auto_memo_' + id];
      if (cfg) Object.assign(autoRuleConfigs[id], cfg);
    });

    const TRIGGER_TYPES = [
        { id: 'AM1', name: 'First Deposit Confirmation', trigger: 'On first deposit approved', target: 'Member', template: 'Dear {member}, your first deposit of {amount} has been approved. Welcome to VIGOR!', active: autoRuleConfigs.AM1.active, count: autoRuleConfigs.AM1.count ?? (STATE.deposits || []).filter(d => d.status === 'Approved').length },
        { id: 'AM2', name: 'Withdrawal Approved', trigger: 'On withdrawal approved', target: 'Member', template: 'Dear {member}, your withdrawal of {amount} has been processed. Please wait 1-3 business days.', active: autoRuleConfigs.AM2.active, count: autoRuleConfigs.AM2.count ?? (STATE.withdrawals || []).filter(w => w.status === 'Approved').length },
        { id: 'AM3', name: 'Withdrawal Rejected', trigger: 'On withdrawal rejected', target: 'Member', template: 'Dear {member}, your withdrawal request has been rejected. Please contact support.', active: autoRuleConfigs.AM3.active, count: autoRuleConfigs.AM3.count ?? (STATE.withdrawals || []).filter(w => w.status === 'Rejected').length },
        { id: 'AM4', name: 'Account Suspended', trigger: 'On account suspended', target: 'Member', template: 'Your account {member} has been temporarily suspended. Contact admin for assistance.', active: autoRuleConfigs.AM4.active, count: autoRuleConfigs.AM4.count ?? (STATE.members || []).filter(m => m.status === 'Suspended').length },
        { id: 'AM5', name: 'Bonus Credited', trigger: 'On bonus approved', target: 'Member', template: 'Dear {member}, bonus of {amount} has been credited to your account!', active: autoRuleConfigs.AM5.active, count: autoRuleConfigs.AM5.count ?? (STATE.bonuses || []).filter(b => b.status === 'Approved').length },
        { id: 'AM6', name: 'VIP Tier Upgrade', trigger: 'On tier level up', target: 'Member', template: 'Congratulations {member}! You have been upgraded to {tier} tier!', active: autoRuleConfigs.AM6.active, count: autoRuleConfigs.AM6.count ?? 0 },
        { id: 'AM7', name: 'Credit Limit Warning', trigger: 'When credit reaches 80%', target: 'Company', template: 'Warning: {company} has reached 80% of credit limit. Please top up.', active: autoRuleConfigs.AM7.active, count: autoRuleConfigs.AM7.count ?? 0 },
        { id: 'AM8', name: 'Monthly Statement', trigger: 'Every 1st of month', target: 'Company', template: 'Monthly statement for {month} is ready. Total GGR: {amount}.', active: autoRuleConfigs.AM8.active, count: autoRuleConfigs.AM8.count ?? 0 },
    ];

    // Recent auto memos from STATE.memos.sent (system-generated) or fall back to recent logs
    const allSentMemos = (STATE.memos?.sent || []);
    const todayStr = new Date().toISOString().slice(0, 10);
    const sentToday = allSentMemos.filter(m => (m.date || '').startsWith(todayStr)).length;
    const failedToday = (STATE.logs || []).filter(l => l.action === 'Memo Failed' && (l.date || '').startsWith(todayStr)).length;

    const recentAuto = allSentMemos.slice(0, 10).map(m => ({
        trigger: m.subject || m.category || 'Automated',
        member: m.to,
        sentAt: m.date || '-',
        status: 'Sent'
    }));

    return `
    ${pageHeader('Auto Memo', '<span>Memo</span><span class="sep">›</span><span>Auto Memo</span>', `
      <button class="btn btn-primary" onclick="window.openAddAutoMemoRuleModal()"><i class="fa-solid fa-plus"></i> Add Rule</button>`)}

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
        <div class="stat-info"><div class="stat-label">Sent Today</div><div class="stat-value">${sentToday}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,.1);color:var(--red)"><i class="fa-solid fa-circle-xmark"></i></div>
        <div class="stat-info"><div class="stat-label">Failed</div><div class="stat-value">${failedToday}</div></div>
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

// ═══════════════════════════════════════════════════════════════
//  COMPOSE MEMO MODAL
// ═══════════════════════════════════════════════════════════════
window.openComposeMemoModal = () => {
    const adminList = (STATE.companies || []).map(c => c.username || c.name).filter(Boolean);
    openModal('Compose Memo', `
        <div class="form-grid">
            <div class="form-field">
                <label>To <span style="color:var(--red)">*</span></label>
                <input id="memo_to" class="form-control" list="memo_to_list" placeholder="Username or role..." />
                <datalist id="memo_to_list">
                    <option>All Admins</option>
                    <option>All Companies</option>
                    ${adminList.map(a => `<option>${a}</option>`).join('')}
                </datalist>
            </div>
            <div class="form-field">
                <label>Category</label>
                <select id="memo_category" class="form-control">
                    <option>Finance</option>
                    <option>Bonus</option>
                    <option>System</option>
                    <option>General</option>
                    <option>Urgent</option>
                </select>
            </div>
            <div class="form-field" style="grid-column:1/-1">
                <label>Subject <span style="color:var(--red)">*</span></label>
                <input id="memo_subject" class="form-control" placeholder="Memo subject..." />
            </div>
            <div class="form-field" style="grid-column:1/-1">
                <label>Message <span style="color:var(--red)">*</span></label>
                <textarea id="memo_message" class="form-control" rows="5" placeholder="Write your message..."></textarea>
            </div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-primary" onclick="window.sendMemo()"><i class="fa-solid fa-paper-plane"></i> Send</button>
    `);
};

window.sendMemo = async () => {
    const to = document.getElementById('memo_to')?.value.trim();
    const subject = document.getElementById('memo_subject')?.value.trim();
    const message = document.getElementById('memo_message')?.value.trim();
    const category = document.getElementById('memo_category')?.value;
    if (!to) { toast('Recipient is required', 'error'); return; }
    if (!subject) { toast('Subject is required', 'error'); return; }
    if (!message) { toast('Message cannot be empty', 'error'); return; }

    const memo = {
        id: 'M' + Date.now(),
        from: STATE.currentAdmin?.username || STATE.profile?.username || 'admin',
        to, subject, message, category,
        date: new Date().toLocaleString('id-ID'),
        read: false,
        type: 'sent',
    };

    if (!STATE.memos) STATE.memos = { inbox: [], sent: [], trash: [] };
    STATE.memos.sent.unshift(memo);

    if (window.db?.dbSendMemo) {
        const { error } = await window.db.dbSendMemo({ from: memo.from, to, subject, message, category });
        if (error) { toast('Send failed: ' + error.message, 'error'); return; }
    }
    saveState();
    if (window.db?.dbWriteLog) window.db.dbWriteLog('Memo Sent', to, `Subject: ${subject}`);
    closeModalBtn();
    toast(`Memo sent to ${to}`, 'success');
    window.go('memo-list');
};

// ═══════════════════════════════════════════════════════════════
//  ADD AUTO MEMO RULE MODAL
// ═══════════════════════════════════════════════════════════════
window.openAddAutoMemoRuleModal = (existingId = null) => {
    const existing = existingId ? (STATE.autoMemoRules || []).find(r => r.id === existingId) : null;
    openModal(existing ? 'Edit Auto Memo Rule' : 'Add Auto Memo Rule', `
        <div class="form-grid">
            <div class="form-field">
                <label>Rule Name <span style="color:var(--red)">*</span></label>
                <input id="amr_name" class="form-control" value="${existing?.name || ''}" placeholder="e.g. VIP Upgrade Notification" />
            </div>
            <div class="form-field">
                <label>Trigger Event</label>
                <select id="amr_trigger" class="form-control">
                    ${['On first deposit approved','On withdrawal approved','On withdrawal rejected','On account suspended','On bonus approved','On tier level up','When credit reaches 80%','Every 1st of month','On new registration'].map(t => `<option ${existing?.trigger === t ? 'selected':''}>${t}</option>`).join('')}
                </select>
            </div>
            <div class="form-field">
                <label>Target</label>
                <select id="amr_target" class="form-control">
                    <option ${(existing?.target||'') === 'Member' ? 'selected':''}>Member</option>
                    <option ${(existing?.target||'') === 'Company' ? 'selected':''}>Company</option>
                    <option ${(existing?.target||'') === 'All Admins' ? 'selected':''}>All Admins</option>
                </select>
            </div>
            <div class="form-field">
                <label>Status</label>
                <select id="amr_active" class="form-control">
                    <option value="1" ${(existing?.active !== false) ? 'selected':''}>Active</option>
                    <option value="0" ${(existing?.active === false) ? 'selected':''}>Inactive</option>
                </select>
            </div>
            <div class="form-field" style="grid-column:1/-1">
                <label>Template Message <span style="color:var(--red)">*</span></label>
                <textarea id="amr_template" class="form-control" rows="4" placeholder="Use {member}, {amount}, {company} as variables...">${existing?.template || ''}</textarea>
                <div style="font-size:.72rem;color:var(--text3);margin-top:.3rem">Available variables: {member}, {amount}, {company}, {tier}, {month}</div>
            </div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-primary" onclick="window.saveAutoMemoRule('${existingId || ''}')"><i class="fa-solid fa-check"></i> ${existing ? 'Update' : 'Add'} Rule</button>
    `);
};

window.saveAutoMemoRule = (existingId = '') => {
    const name = document.getElementById('amr_name')?.value.trim();
    const trigger = document.getElementById('amr_trigger')?.value;
    const target = document.getElementById('amr_target')?.value;
    const template = document.getElementById('amr_template')?.value.trim();
    const active = document.getElementById('amr_active')?.value === '1';
    if (!name) { toast('Rule name is required', 'error'); return; }
    if (!template) { toast('Template message is required', 'error'); return; }

    if (!STATE.autoMemoRules) STATE.autoMemoRules = [];
    if (existingId) {
        const rule = STATE.autoMemoRules.find(r => r.id === existingId);
        if (rule) Object.assign(rule, { name, trigger, target, template, active });
    } else {
        STATE.autoMemoRules.unshift({ id: 'AMR' + Date.now(), name, trigger, target, template, active, count: 0 });
    }
    saveState();
    closeModalBtn();
    toast(existingId ? 'Rule updated' : 'Auto memo rule added', 'success');
    window.go('memo-auto');
};

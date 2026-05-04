/* ─── COMPANY, WHITELABEL, MASTER & BANK PAGES ─── */
import { STATE, addLog, fmtCur, stateAdd, stateUpdate, stateDelete } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsSelect, fsActions, tableWrap, badge, actionBtns, renderPagerHTML, openModal, closeModalBtn, toast } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage, rnd, fmt, COMPANIES } from '../utils/helpers.js';

/* ─── MASTER PAGE ─── */
pages['master'] = () => {
  const masters = STATE.companies.filter(c => c.type === 'Master');
  const totalCredit = masters.reduce((s, c) => s + c.credit, 0);
  const totalMembers = masters.reduce((s, c) => s + c.members, 0);

  return `
    ${pageHeader('Master Management', '<span>Main</span><span class="sep">›</span><span>Master</span>', `
      <button class="btn btn-primary" onclick="window.openCompanyTypeForm('Master')"><i class="fa-solid fa-plus"></i> Add Master</button>`)}

    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(139,92,246,.12);color:#8b5cf6"><i class="fa-solid fa-crown"></i></div>
        <div class="stat-info"><div class="stat-label">Total Masters</div><div class="stat-value">${masters.length}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-coins"></i></div>
        <div class="stat-info"><div class="stat-label">Total Credit</div><div class="stat-value" style="font-size:1.1rem">${fmtCur(totalCredit)}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-users"></i></div>
        <div class="stat-info"><div class="stat-label">Total Members</div><div class="stat-value">${fmt(totalMembers)}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,.1);color:var(--yellow)"><i class="fa-solid fa-check-circle"></i></div>
        <div class="stat-info"><div class="stat-label">Active Masters</div><div class="stat-value">${masters.filter(c => c.status === 'Active').length}</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Master Account List</span></div>
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Username</th><th>Company Name</th><th>Email</th><th>Credit</th><th>Members</th><th>Status</th><th>Joined</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${masters.map((c, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong style="color:var(--acc)">${c.username}</strong></td>
                  <td>${c.name}</td>
                  <td style="font-size:.75rem">${c.email}</td>
                  <td style="font-weight:700">${fmtCur(c.credit)}</td>
                  <td>${fmt(c.members)}</td>
                  <td>${badge(c.status, c.status === 'Active' ? 'success' : 'danger')}</td>
                  <td style="font-size:.75rem">${c.joined}</td>
                  <td>${actionBtns(
    `window.openFormModal('company','${c.id}')`,
    `confirmAction('Delete Master','Delete master [${c.username}]?',()=>{window.stateDelete('companies','${c.id}');window.go('master');toast('Master deleted','success')},'Delete','danger')`
  )}</td>
                </tr>
              `).join('')}
              ${masters.length === 0 ? '<tr><td colspan="9" style="text-align:center;color:var(--text3)">No master accounts found</td></tr>' : ''}
            </tbody>
          </table>
        `)}
      </div>
    </div>`;
};

/* ─── COMPANY CREATE ─── */
pages['company-create'] = () => {
  return `
    <style>
        .cc-container {
            max-width: 800px;
            margin: 0 auto;
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            overflow: hidden;
        }
        .cc-header {
            padding: 1.5rem 2rem;
            border-bottom: 1px solid var(--border);
            font-weight: 800;
            font-size: 1.1rem;
            color: var(--text);
        }
        .cc-body {
            padding: 2rem;
        }
        .cc-field {
            margin-bottom: 1.5rem;
        }
        .cc-label {
            display: block;
            font-size: 0.85rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: var(--text);
        }
        .cc-label .req { color: var(--red); margin-left: 2px; }
        .cc-hint {
            font-size: 0.72rem;
            color: var(--text3);
            margin-bottom: 0.5rem;
        }
        .cc-input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid var(--border);
            border-radius: 6px;
            background: var(--bg);
            color: var(--text);
            outline: none;
            transition: border-color 0.2s;
        }
        .cc-input:focus {
            border-color: var(--acc);
        }
        .cc-accordion {
            border: 1px solid var(--border);
            border-radius: 6px;
            margin-bottom: 0.5rem;
            overflow: hidden;
        }
        .cc-accordion-header {
            padding: 0.75rem 1rem;
            background: var(--bg);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 0.85rem;
            font-weight: 600;
            transition: background 0.2s;
        }
        .cc-accordion-header:hover {
            background: var(--border);
        }
        .cc-accordion-header i.arrow {
            font-size: 0.7rem;
            transition: transform 0.3s;
        }
        .cc-accordion.open i.arrow {
            transform: rotate(90deg);
        }
        .cc-accordion-content {
            padding: 1.25rem;
            border-top: 1px solid var(--border);
            display: none;
        }
        .cc-accordion.open .cc-accordion-content {
            display: block;
        }
        .cc-footer {
            padding: 1.5rem 2rem;
            background: var(--bg);
            border-top: 1px solid var(--border);
            display: flex;
            gap: 0.75rem;
        }
        .cc-btn-submit {
            background: var(--acc);
            color: #fff;
            padding: 0.6rem 1.5rem;
            border-radius: 6px;
            font-weight: 700;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .cc-btn-reset {
            background: var(--red);
            color: #fff;
            padding: 0.6rem 1.5rem;
            border-radius: 6px;
            font-weight: 700;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .ip-wrapper {
            display: flex;
            gap: 0.5rem;
        }
        .ip-add-btn {
            background: var(--text3);
            color: #fff;
            width: 38px;
            height: 38px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    </style>

    ${pageHeader('Create Company', '<span>Master</span><span class="sep">›</span><span>Company</span>', '')}

    <div class="cc-container">
        <div class="cc-header">Create Company</div>
        <div class="cc-body">
            
            <div class="cc-field">
                <label class="cc-label">Company Name</label>
                <div class="cc-hint">Maximum 200 chars. Optional</div>
                <input type="text" id="cc_name" class="cc-input" placeholder="Enter Company Name">
            </div>

            <div class="cc-field">
                <label class="cc-label">Username<span class="req">*</span></label>
                <div class="cc-hint">Length 2 to 10 (only allow number or lowercase character)</div>
                <input type="text" id="cc_username" class="cc-input" placeholder="Enter Username">
            </div>

            <div class="cc-field">
                <label class="cc-label">Password<span class="req">*</span></label>
                <div class="cc-hint">From 6 characters. Contains at least one lowercase letter, one uppercase letter, one number, and one special character.</div>
                <input type="password" id="cc_pass" class="cc-input" placeholder="Enter Password">
            </div>

            <div class="cc-field">
                <label class="cc-label">Confirm Password<span class="req">*</span></label>
                <input type="password" id="cc_pass2" class="cc-input" placeholder="Enter Confirm Password">
            </div>

            <div class="cc-field">
                <label class="cc-label">Template</label>
                <select id="cc_template" class="cc-input">
                    <option>CUSTOM TEMPLATE - DEFAULT</option>
                    <option>DARK ELEGANCE - V1</option>
                    <option>CYAN NEON - V2</option>
                </select>
            </div>

            <div class="cc-field">
                <label class="cc-label">Commission</label>
                ${['Sports', 'Slot', 'Fishing', 'Casino', 'Others'].map(cat => `
                    <div class="cc-accordion" id="acc_comm_${cat.toLowerCase()}">
                        <div class="cc-accordion-header" onclick="this.parentElement.classList.toggle('open')">
                            <i class="fa-solid fa-chevron-right arrow"></i> ${cat}
                        </div>
                        <div class="cc-accordion-content">
                            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem">
                                <div><label class="cc-label" style="font-size:.75rem">Profit Share (%)</label><input type="number" class="cc-input" value="0"></div>
                                <div><label class="cc-label" style="font-size:.75rem">Bonus Rate (%)</label><input type="number" class="cc-input" value="0"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="cc-field">
                <label class="cc-label">Country</label>
                <select id="cc_country" class="cc-input">
                    <option>IDN - Indonesia</option>
                    <option>THA - Thailand</option>
                    <option>VNM - Vietnam</option>
                </select>
            </div>

            <div class="cc-field">
                <label class="cc-label">Whitelist IP Address<span class="req">*</span></label>
                <div class="cc-hint">Max 20 IPs.</div>
                <div class="ip-wrapper">
                    <textarea id="cc_ips" class="cc-input" style="height:60px"></textarea>
                    <button class="ip-add-btn"><i class="fa-solid fa-plus"></i></button>
                </div>
            </div>

            <div class="cc-field">
                <label class="cc-label">Pools<span class="req">*</span></label>
                ${['4D Togel External', '4D Togel Vigor', '4D Togel Global', '6D Togel Vigor'].map((p, i) => `
                    <div class="cc-accordion" id="acc_pool_${i}">
                        <div class="cc-accordion-header" onclick="this.parentElement.classList.toggle('open')">
                            <i class="fa-solid fa-chevron-right arrow"></i> 
                            <input type="checkbox" name="cc_pool" value="${p}" style="margin-right:.5rem" onclick="event.stopPropagation()">
                            ${p}
                        </div>
                        <div class="cc-accordion-content">
                            <div style="font-size:.75rem; color:var(--text2)">Configure limits and settings for ${p}...</div>
                        </div>
                    </div>
                `).join('')}
            </div>

        </div>
        <div class="cc-footer">
            <button class="cc-btn-submit" onclick="window.submitCompanyCreate()"><i class="fa-solid fa-save"></i> Submit</button>
            <button class="cc-btn-reset" onclick="go('company-create')"><i class="fa-solid fa-rotate"></i> Reset</button>
        </div>
    </div>
  `;
};

/* ─── COMPANY LIST ─── */
pages['company-list'] = () => {
  const PG = 'company-list';
  const all = STATE.companies.filter(c => c.type === 'Company');
  const filtered = filterData(all, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  return `
    ${pageHeader('Company List', '<span>Company</span><span class="sep">›</span><span>List</span>', `
      <div style="display:flex;gap:.5rem">
        <button class="btn btn-secondary btn-sm" onclick="window.exportCSV(STATE.companies,'companies.csv')"><i class="fa-solid fa-download"></i> Export</button>
        <button class="btn btn-primary" onclick="go('company-create')"><i class="fa-solid fa-plus"></i> Add Company</button>
      </div>`)
    }

    ${filterCard(`
      ${fsInput(PG, 'username', 'Username', 'Search username...')}
      ${fsInput(PG, 'name', 'Company Name', 'Search name...')}
      ${fsSelect(PG, 'status', 'Status', ['All', 'Active', 'Inactive'])}
      ${fsActions(PG)}
    `)
    }

<div class="card">
  <div class="card-body">
    ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Username</th><th>Name</th><th>Email</th><th>Phone</th><th>Credit</th><th>Members</th><th>Status</th><th>Joined</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${rows.map((c, i) => `
                <tr>
                  <td>${(cp - 1) * pp + i + 1}</td>
                  <td><strong style="color:var(--acc)">${c.username}</strong><div style="font-size:.7rem;color:var(--text3)">${c.id}</div></td>
                  <td>${c.name}</td>
                  <td style="font-size:.75rem">${c.email}</td>
                  <td style="font-size:.75rem">${c.phone}</td>
                  <td style="font-weight:700">${fmtCur(c.credit)}</td>
                  <td><span style="font-weight:600">${fmt(c.members)}</span></td>
                  <td>${badge(c.status, c.status === 'Active' ? 'success' : 'danger')}</td>
                  <td style="font-size:.75rem">${c.joined}</td>
                  <td>${actionBtns(
      `window.openFormModal('company','${c.id}')`,
      `confirmAction('Delete Company','Delete company [${c.username}]?',()=>{window.stateDelete('companies','${c.id}');window.go('company-list');toast('Company deleted','success')},'Delete','danger')`
    )}</td>
                </tr>
              `).join('')}
              ${rows.length === 0 ? '<tr><td colspan="10" style="text-align:center;color:var(--text3)">No records found</td></tr>' : ''}
            </tbody>
          </table>
        `)}
  </div>
</div>
    ${renderPagerHTML(PG, total, pp, cp)} `;
};

/* ─── MASTER WHITELABEL LIST ─── */
pages['master-whitelabel-list'] = () => {
  const PG = 'master-whitelabel-list';
  const all = STATE.companies.filter(c => c.type === 'Whitelabel' || c.type === 'Master');
  const filtered = filterData(all, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  return `
    ${pageHeader('Master Whitelabel List', '<span>Whitelabel</span><span class="sep">›</span><span>Master WL</span>', `
      <button class="btn btn-primary" onclick="window.openCompanyTypeForm('Master')"><i class="fa-solid fa-plus"></i> Add Master WL</button>`)
    }

    ${filterCard(`
      ${fsInput(PG, 'username', 'Username', 'Search...')}
      ${fsSelect(PG, 'type', 'Type', ['All', 'Master', 'Whitelabel'])}
      ${fsSelect(PG, 'status', 'Status', ['All', 'Active', 'Inactive'])}
      ${fsActions(PG)}
    `)
    }

<div class="card">
  <div class="card-body">
    ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Username</th><th>Name</th><th>Type</th><th>Credit</th><th>Members</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${rows.map((c, i) => `
                <tr>
                  <td>${(cp - 1) * pp + i + 1}</td>
                  <td><strong style="color:var(--acc)">${c.username}</strong></td>
                  <td>${c.name}</td>
                  <td>${badge(c.type, c.type === 'Master' ? 'purple' : 'indigo')}</td>
                  <td style="font-weight:700">${fmtCur(c.credit)}</td>
                  <td>${fmt(c.members)}</td>
                  <td>${badge(c.status, c.status === 'Active' ? 'success' : 'danger')}</td>
                  <td>${actionBtns(
      `window.openFormModal('company','${c.id}')`,
      `confirmAction('Delete Record','Delete record [${c.username}]?',()=>{window.stateDelete('companies','${c.id}');window.go('master-whitelabel-list');toast('Record deleted','success')},'Delete','danger')`
    )}</td>
                </tr>
              `).join('')}
              ${rows.length === 0 ? '<tr><td colspan="8" style="text-align:center;color:var(--text3)">No records found</td></tr>' : ''}
            </tbody>
          </table>
        `)}
  </div>
</div>
    ${renderPagerHTML(PG, total, pp, cp)} `;
};

/* ─── WHITELABEL LIST ─── */
pages['whitelabel-list'] = () => {
  const PG = 'whitelabel-list';
  const all = STATE.companies.filter(c => c.type === 'Whitelabel');
  const filtered = filterData(all, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  return `
    ${pageHeader('Whitelabel List', '<span>Whitelabel</span><span class="sep">›</span><span>List</span>', `
      <button class="btn btn-primary" onclick="window.openCompanyTypeForm('Whitelabel')"><i class="fa-solid fa-plus"></i> Add Whitelabel</button>`)
    }

    ${filterCard(`
      ${fsInput(PG, 'username', 'Username', 'Search username...')}
      ${fsInput(PG, 'name', 'Name', 'Search name...')}
      ${fsSelect(PG, 'status', 'Status', ['All', 'Active', 'Inactive'])}
      ${fsActions(PG)}
    `)
    }

<div class="card">
  <div class="card-body">
    ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Username</th><th>Name</th><th>Email</th><th>Credit</th><th>Members</th><th>Joined</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${rows.map((c, i) => `
                <tr>
                  <td>${(cp - 1) * pp + i + 1}</td>
                  <td><strong style="color:var(--acc)">${c.username}</strong></td>
                  <td>${c.name}</td>
                  <td style="font-size:.75rem">${c.email}</td>
                  <td style="font-weight:700">${fmtCur(c.credit)}</td>
                  <td>${fmt(c.members)}</td>
                  <td style="font-size:.75rem">${c.joined}</td>
                  <td>${badge(c.status, c.status === 'Active' ? 'success' : 'danger')}</td>
                  <td>${actionBtns(
      `window.openFormModal('company','${c.id}')`,
      `confirmAction('Delete Whitelabel','Delete whitelabel [${c.username}]?',()=>{window.stateDelete('companies','${c.id}');window.go('whitelabel-list');toast('Whitelabel deleted','success')},'Delete','danger')`
    )}</td>
                </tr>
              `).join('')}
              ${rows.length === 0 ? '<tr><td colspan="9" style="text-align:center;color:var(--text3)">No records found</td></tr>' : ''}
            </tbody>
          </table>
        `)}
  </div>
</div>
    ${renderPagerHTML(PG, total, pp, cp)} `;
};

/* ─── TIER HISTORY ─── */
pages['tier-history'] = () => {
  const PG = 'tier-history';
  const TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  const tierColors = { Bronze: '#cd7f32', Silver: '#c0c0c0', Gold: '#f59e0b', Platinum: '#60a5fa', Diamond: '#a78bfa' };
  const rows = STATE.members.slice(0, 25).map((m, i) => ({
    member: m.username, name: m.name, company: m.company,
    prevTier: TIERS[Math.max(0, i % 5 - 1)], newTier: TIERS[i % 5],
    changedAt: `${rnd(20, 27)} /04/2026 ${rnd(10, 23)}:${rnd(10, 59)} `,
    reason: ['Turnover achieved', 'Manual upgrade', 'VIP promotion', 'Deposit threshold'][i % 4]
  }));

  return `
    ${pageHeader('Tier History for Member', '<span>Global Member List</span><span class="sep">›</span><span>Tier History</span>')}

    ${filterCard(`
      ${fsInput(PG, 'member', 'Member', 'Search member...')}
      ${fsSelect(PG, 'newTier', 'Tier', ['All', ...TIERS])}
      ${fsActions(PG)}
    `)
    }

<div class="card">
  <div class="card-body">
    ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Member</th><th>Company</th><th>Previous Tier</th><th>New Tier</th><th>Reason</th><th>Changed At</th></tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${r.member}</strong><div style="font-size:.7rem;color:var(--text3)">${r.name}</div></td>
                  <td>${r.company}</td>
                  <td><span style="font-weight:600;color:${tierColors[r.prevTier]}">${r.prevTier}</span></td>
                  <td><span style="font-weight:700;color:${tierColors[r.newTier]}">${r.newTier} <i class="fa-solid fa-arrow-up" style="font-size:.7rem"></i></span></td>
                  <td style="font-size:.78rem">${r.reason}</td>
                  <td style="font-size:.72rem;white-space:nowrap">${r.changedAt}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
  </div>
</div>`;
};

/* ─── BANK CREATE ─── */
pages['bank-create'] = () => {
  return `
  < style >
        .cc - layout { display: grid; grid - template - columns: 1fr 340px; gap: 1.5rem; align - items: start; }
        .cc - card { background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.05); border - radius: 16px; box - shadow: 0 10px 30px rgba(0, 0, 0, 0.2); overflow: hidden; position: relative; }
        .cc - card.finance - card::before { background: linear - gradient(90deg, #10b981, #059669, #10b981); }
        .cc - section - title { font - size: 0.85rem; font - weight: 800; color: #fff; margin: 0 0 1.25rem 0; display: flex; align - items: center; gap: 0.5rem; padding - bottom: 0.75rem; border - bottom: 1px dashed rgba(255, 255, 255, 0.1); }
        .cc - grid { display: grid; grid - template - columns: 1fr 1fr; gap: 1.25rem; margin - bottom: 2rem; }
        .cc - input - wrap { position: relative; }
        .cc - input - wrap i { position: absolute; left: 1rem; top: 50 %; transform: translateY(-50 %); color: #64748b; font - size: 0.9rem; transition: color 0.3s; }
        .cc - input - wrap input, .cc - input - wrap select, .cc - input - wrap textarea { width: 100 %; background: #1e293b; border: 1px solid rgba(255, 255, 255, 0.1); color: #f1f5f9; padding: 0.75rem 1rem 0.75rem 2.8rem; border - radius: 10px; font - size: 0.85rem; transition: all 0.3s; }
        .cc - input - wrap select { appearance: none; }
        .cc - input - wrap input: focus, .cc - input - wrap select:focus { border - color: #10b981; background: rgba(16, 185, 129, 0.05); box - shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
        .cc - input - wrap input: focus + i, .cc - input - wrap select: focus + i { color: #10b981; }
        .cc - label { display: block; font - size: 0.75rem; font - weight: 700; color: #94a3b8; margin - bottom: 0.5rem; text - transform: uppercase; letter - spacing: 0.05em; }
        .cc - req { color: #ef4444; margin - left: 3px; }
        .cc - sidebar - card { background: #1e293b; border - radius: 12px; padding: 1.5rem; text - align: center; border: 1px solid rgba(255, 255, 255, 0.05); }
        .cc - icon - circle.finance - icon { background: rgba(16, 185, 129, 0.1); color: #10b981; box - shadow: 0 0 20px rgba(16, 185, 129, 0.2); }
        
        .status - radio { display: flex; gap: 1.5rem; background:#1e293b; padding: .5rem 1rem; border - radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05); }
        .status - radio label { display: flex; align - items: center; gap: .5rem; font - size: .85rem; font - weight: 700; color: #cbd5e1; cursor: pointer; }
        .status - radio input { accent - color:#10b981; width: 16px; height: 16px; cursor: pointer; }
    </style >

  ${pageHeader('Create Bank Account', '<span>Bank Management</span><span class="sep">›</span><span>Create</span>', `
        <button class="btn btn-secondary" onclick="go('finance')"><i class="fa-solid fa-arrow-left"></i> Back to Finance</button>
    `)
    }

<div class="cc-layout">
  <!-- Main Form -->
  <div class="cc-card finance-card">
    <div style="padding: 2rem;">

      <!-- Ledger Identification -->
      <div class="cc-section-title"><i class="fa-solid fa-building-columns" style="color:#10b981"></i> LEDGER IDENTIFICATION</div>
      <div class="cc-grid">
        <div>
          <label class="cc-label">Financial Institution <span class="cc-req">*</span></label>
          <div class="cc-input-wrap">
            <select id="bk_bank">
              ${['BCA', 'BNI', 'BRI', 'MANDIRI', 'DANAMON', 'CIMB', 'PERMATA', 'MAYBANK', 'BTN', 'OCBC', 'PANIN', 'MEGA', 'SINARMAS'].map(b => `<option>${b}</option>`).join('')}
            </select>
            <i class="fa-solid fa-university"></i>
            <i class="fa-solid fa-chevron-down" style="left:auto; right:1rem; font-size:.8rem; pointer-events:none"></i>
          </div>
        </div>
        <div>
          <label class="cc-label">Operating Mode <span class="cc-req">*</span></label>
          <div class="cc-input-wrap">
            <select id="bk_type">
              <option>Both (Dep & WD)</option>
              <option>Deposit Only</option>
              <option>Withdraw Only</option>
            </select>
            <i class="fa-solid fa-code-branch"></i>
            <i class="fa-solid fa-chevron-down" style="left:auto; right:1rem; font-size:.8rem; pointer-events:none"></i>
          </div>
        </div>
        <div>
          <label class="cc-label">Registered Account Name <span class="cc-req">*</span></label>
          <div class="cc-input-wrap">
            <input type="text" id="bk_accname" placeholder="VIGOR OFFICIAL BCA">
              <i class="fa-solid fa-id-card"></i>
          </div>
        </div>
        <div>
          <label class="cc-label">Account Number <span class="cc-req">*</span></label>
          <div class="cc-input-wrap">
            <input type="text" id="bk_accno" placeholder="e.g. 5200112233">
              <i class="fa-solid fa-hashtag"></i>
          </div>
        </div>
      </div>

      <!-- Transaction Limits -->
      <div class="cc-section-title"><i class="fa-solid fa-money-bill-transfer" style="color:#10b981"></i> TRANSACTION FLOW CONSTRAINTS</div>
      <div class="cc-grid">
        <div>
          <label class="cc-label">Min Deposit Limit (Rp)</label>
          <div class="cc-input-wrap" style="color:#10b981">
            <input type="number" id="bk_min" value="10000" min="0">
              <i class="fa-solid fa-arrow-down-short-wide"></i>
          </div>
        </div>
        <div>
          <label class="cc-label">Max Deposit Limit (Rp)</label>
          <div class="cc-input-wrap" style="color:#10b981">
            <input type="number" id="bk_max" value="100000000" min="0">
              <i class="fa-solid fa-arrow-up-wide-short"></i>
          </div>
        </div>
        <div>
          <label class="cc-label">Min Withdraw Limit (Rp)</label>
          <div class="cc-input-wrap" style="color:#ef4444">
            <input type="number" id="bk_minw" value="50000" min="0">
              <i class="fa-solid fa-hand-holding-dollar"></i>
          </div>
        </div>
        <div>
          <label class="cc-label">Max Withdraw Limit (Rp)</label>
          <div class="cc-input-wrap" style="color:#ef4444">
            <input type="number" id="bk_maxw" value="50000000" min="0">
              <i class="fa-solid fa-vault"></i>
          </div>
        </div>
      </div>

      <!-- Status -->
      <div class="cc-section-title"><i class="fa-solid fa-power-off" style="color:#10b981"></i> OPERATIONAL STATUS</div>
      <div style="margin-bottom:2rem">
        <label class="cc-label">Gateway Availability</label>
        <div class="status-radio">
          <label><input type="radio" name="bk_status" value="Active" checked /> System Active</label>
          <label><input type="radio" name="bk_status" value="Inactive" /> Temporarily Offline</label>
        </div>
      </div>

      <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:2rem; padding-top:1.5rem; border-top:1px solid rgba(255,255,255,0.05)">
        <button class="btn btn-secondary" style="padding: 0 2rem; border-radius: 12px; height: 48px; font-weight:800" onclick="go('finance')">CANCEL</button>
        <button class="btn" style="background:#10b981; color:#fff; border:none; padding: 0 3rem; border-radius: 12px; height: 48px; font-weight:800; font-size:.9rem; box-shadow: 0 10px 20px rgba(16,185,129,0.3)" onclick="window.submitBankCreate()">
          <i class="fa-solid fa-check-circle" style="margin-right:.5rem"></i> PROVISION ACCOUNT
        </button>
      </div>
    </div>
  </div>

  <!-- Right Side Panel -->
  <div style="display:flex; flex-direction:column; gap:1.5rem">
    <div class="cc-sidebar-card">
      <div class="cc-icon-circle finance-icon"><i class="fa-solid fa-vault"></i></div>
      <h3 style="color:#fff; margin:0 0 .5rem 0; font-size:1.1rem; font-weight:800">Secure Gateway</h3>
      <p style="color:#94a3b8; font-size:.8rem; line-height:1.5; margin:0">
        Registering a new payment gateway automatically provisions receiving limits and routing algorithms.
      </p>
    </div>

    <div class="cc-sidebar-card" style="text-align:left">
      <div style="font-size:.75rem; font-weight:800; color:#fff; text-transform:uppercase; margin-bottom:1rem; display:flex; align-items:center; gap:.5rem">
        <i class="fa-solid fa-shield-halved" style="color:#10b981"></i> Compliance Rules
      </div>
      <ul style="padding-left:1.2rem; color:#94a3b8; font-size:.78rem; line-height:1.8; margin:0">
        <li>Account Name must perfectly match your KYC to avoid player bounce.</li>
        <li>Min/Max constraints protect against algorithmic transaction flooding.</li>
        <li>"System Active" makes the gateway instantly visible to VIP players.</li>
      </ul>
    </div>
  </div>
</div>`;
};

/* ─── PROFILE ─── */
pages['profile'] = () => {
  const p = STATE.profile;
  return `
    ${pageHeader('My Profile', '<span>Account</span><span class="sep">›</span><span>Profile</span>')}

<div style="display:grid;grid-template-columns:340px 1fr;gap:1.25rem;align-items:start">
  <div class="card">
    <div class="card-body" style="text-align:center;padding:2.5rem 1.5rem">
      <div style="width:90px;height:90px;border-radius:50%;background:var(--acc);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;color:#fff;margin:0 auto 1rem">AS</div>
      <div style="font-size:1.15rem;font-weight:700">${p.username}</div>
      <div style="font-size:.82rem;color:var(--text3);margin-top:.25rem">SUBSTAG · Admin</div>
      ${badge('Active', 'success')}
      <div style="margin-top:1.5rem;display:flex;flex-direction:column;gap:.5rem">
        <div style="display:flex;justify-content:space-between;font-size:.82rem;padding:.5rem 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3)">Language</span><strong>${p.language}</strong></div>
        <div style="display:flex;justify-content:space-between;font-size:.82rem;padding:.5rem 0;border-bottom:1px solid var(--border)"><span style="color:var(--text3)">Last Login</span><strong>27 Apr 2026 08:14</strong></div>
        <div style="display:flex;justify-content:space-between;font-size:.82rem;padding:.5rem 0"><span style="color:var(--text3)">IP Address</span><strong>192.168.1.1</strong></div>
      </div>
      <button class="btn btn-danger" style="width:100%;margin-top:1.5rem" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;gap:1rem">
    <div class="card">
      <div class="card-header"><span class="card-title">Edit Profile</span></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" class="form-control" value="${p.username}" readonly style="background:var(--bg2)" />
          </div>
          <div class="form-group">
            <label class="form-label">Display Name</label>
            <input type="text" class="form-control" id="prof_name" value="${p.name}" />
          </div>
          <div class="form-group">
            <label class="form-label">Language</label>
            <select class="form-control" id="prof_lang">
              ${['English', 'Indonesia', 'Chinese', 'Vietnamese'].map(l => `<option ${l === p.language ? 'selected' : ''}>${l}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Timezone</label>
            <select class="form-control">
              <option selected>Asia/Jakarta (UTC+7)</option>
              <option>Asia/Singapore (UTC+8)</option>
              <option>Asia/Bangkok (UTC+7)</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary mt-3" onclick="window.saveProfile()"><i class="fa-solid fa-check"></i> Save Changes</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Change Password</span></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:1rem">
          <div class="form-group">
            <label class="form-label">Current Password</label>
            <input type="password" class="form-control" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input type="password" class="form-control" placeholder="••••••••" />
          </div>
          <div class="form-group">
            <label class="form-label">Confirm Password</label>
            <input type="password" class="form-control" placeholder="••••••••" />
          </div>
        </div>
        <button class="btn btn-warning mt-3" onclick="toast('Password updated successfully','success')"><i class="fa-solid fa-lock"></i> Update Password</button>
      </div>
    </div>
  </div>
</div>`;
};

/* ─── HANDLERS ─── */
window.submitCompanyCreate = () => {
  const u = document.getElementById('cc_username')?.value.trim();
  const n = document.getElementById('cc_name')?.value.trim();
  const p1 = document.getElementById('cc_pass')?.value;
  const p2 = document.getElementById('cc_pass2')?.value;
  const ips = document.getElementById('cc_ips')?.value.trim();
  const pools = Array.from(document.querySelectorAll('input[name="cc_pool"]:checked')).map(el => el.value);

  if (!u) { toast('Username is required', 'error'); return; }
  if (!p1) { toast('Password is required', 'error'); return; }
  if (p1 !== p2) { toast('Passwords do not match', 'error'); return; }
  if (!ips) { toast('Whitelist IP is required', 'error'); return; }
  if (pools.length === 0) { toast('At least one pool must be selected', 'error'); return; }

  const template = document.getElementById('cc_template')?.value;
  const country = document.getElementById('cc_country')?.value;

  stateAdd('companies', {
    id: 'C' + Date.now(),
    username: u,
    name: n || u,
    email: '',
    phone: '',
    credit: 0,
    members: 0,
    status: 'Active',
    type: 'Company',
    template,
    country,
    whitelistIPs: ips,
    togelMarkets: pools,
    joined: new Date().toISOString().split('T')[0]
  });

  addLog('company_create', u, `New company [${u}] created with ${pools.length} pools`);
  toast('Company created successfully', 'success');
  setTimeout(() => window.go('company-list'), 800);
};

window.submitBankCreate = () => {
  const bank = document.getElementById('bk_bank')?.value;
  const accName = document.getElementById('bk_accname')?.value.trim();
  const accNo = document.getElementById('bk_accno')?.value.trim();
  if (!accName || !accNo) { toast('Please fill account name and number', 'error'); return; }
  const type = document.getElementById('bk_type')?.value || 'Both';
  const minD = parseInt(document.getElementById('bk_min')?.value) || 10000;
  const maxD = parseInt(document.getElementById('bk_max')?.value) || 100000000;
  const status = document.querySelector('input[name="bk_status"]:checked')?.value || 'Active';
  stateAdd('banks', { id: 'B' + Date.now(), bank, accountName: accName, accountNumber: accNo, type, minDeposit: minD, maxDeposit: maxD, status });
  addLog('bank_create', bank, 'New bank account added');
  toast('Bank account added successfully', 'success');
  setTimeout(() => window.go('bank-list'), 800);
};

window.saveProfile = () => {
  const name = document.getElementById('prof_name')?.value.trim();
  const lang = document.getElementById('prof_lang')?.value;
  if (name) STATE.profile.name = name;
  if (lang) STATE.profile.language = lang;
  addLog('profile_update', STATE.profile.username, 'Profile updated');
  toast('Profile saved', 'success');
};

window.openCompanyTypeForm = (type) => {
  window.openFormModal('company');
  requestAnimationFrame(() => {
    const typeEl = document.getElementById('f_type');
    if (typeEl) typeEl.value = type;
    const statusEl = document.getElementById('f_status');
    if (statusEl) statusEl.value = 'Active';
  });
};

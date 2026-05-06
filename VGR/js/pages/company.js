/* â”€â”€â”€ COMPANY, WHITELABEL, MASTER & BANK PAGES â”€â”€â”€ */
/* ─── COMPANY, WHITELABEL, MASTER & BANK PAGES ─── */
import { STATE, addLog, fmtCur, stateAdd, stateUpdate, stateDelete } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsSelect, fsActions, tableWrap, badge, actionBtns, renderPagerHTML, openModal, closeModalBtn, toast } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage, rnd, fmt, COMPANIES } from '../utils/helpers.js';
import { getMyCompany, getDirectDownlines, getDownlineType } from '../utils/scope.js';

/* ─── MASTER route ─── REDIRECTED to company-list (was duplicate of Agent-type listing) */
pages['master'] = () => {
  // Legacy route: redirect to Agent list (same data)
  if (window.go) setTimeout(() => window.go('company-list'), 0);
  return `<div style="padding:2rem;text-align:center;color:var(--text3)"><i class="fa-solid fa-spinner fa-spin" style="font-size:2rem;color:var(--acc)"></i><div style="margin-top:1rem">Redirecting to Agent List...</div></div>`;
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

    ${pageHeader('Create Company', '<span>Master</span><span class="sep">â€º</span><span>Company</span>', '')}

    <div class="cc-container">
        <div class="cc-header">Create New Agent Account</div>
        <div class="cc-body">
            
            <div class="cc-field">
                <label class="cc-label">Agent / Shop Name</label>
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
                ${['4D Togel External', '4D Togel Vigor', '4D Togel Global', '6D Togel Vigor', 'SINGAPORE', 'HONGKONG', 'SYDNEY', 'PCSO', 'CAMBODIA', 'MAGNUM', 'DAMACAI', 'TOTO'].map((p, i) => `
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

/* â”€â”€â”€ COMPANY LIST â”€â”€â”€ */
pages['company-list'] = () => {
  const PG = 'company-list';
  // Scope: SuperAdmin sees all Agent-type; Whitelabel sees only their direct downlines
  const role = STATE.currentAdmin.role;
  const myCompany = role !== 'SuperAdmin' ? getMyCompany() : null;
  const all = STATE.companies.filter(c => c.type === 'Agent' && (role === 'SuperAdmin' || !myCompany || c.parentId === myCompany.id));
  const filtered = filterData(all, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  return `
    ${pageHeader('Agent List', '<span>Agent</span><span class="sep">â€º</span><span>List</span>', `
      <div style="display:flex;gap:.5rem">
        <button class="btn btn-secondary btn-sm" onclick="window.exportCSV(STATE.companies,'agents.csv')"><i class="fa-solid fa-download"></i> Export</button>
        <button class="btn btn-primary" onclick="go('company-create')"><i class="fa-solid fa-plus"></i> Create Agent Account</button>
      </div>`)
    }

    ${filterCard(`
      ${fsInput(PG, 'username', 'Username', 'Search...')}
      ${fsInput(PG, 'name', 'Agent Name', 'Search name...')}
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
                  <td>
                    <button onclick="window.toggleCompanyStatus('${c.id}','${c.status === 'Active' ? 'Inactive' : 'Active'}','${c.username}')"
                      class="btn btn-sm" style="background:${c.status === 'Active' ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.12)'};color:${c.status === 'Active' ? 'var(--green)' : 'var(--red)'};border:1px solid ${c.status === 'Active' ? 'var(--green)' : 'var(--red)'}44;font-size:.72rem;padding:.2rem .6rem;border-radius:20px;font-weight:700"
                      title="${c.status === 'Active' ? 'Deactivate' : 'Activate'}">${c.status === 'Active' ? 'âœ“ Active' : 'âœ— Inactive'}</button>
                  </td>
                  <td style="font-size:.75rem">${c.joined}</td>
                  <td>${actionBtns(
      `window.openFormModal('company','${c.id}')`,
      `confirmAction('Delete Company','Delete company [${c.username}]?',()=>window.deleteCompany('${c.id}','${c.username}','company-list'),'Delete','danger')`
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

/* â”€â”€â”€ MASTER WHITELABEL LIST â”€â”€â”€ */
pages['master-whitelabel-list'] = () => {
  const PG = 'master-whitelabel-list';
  const all = STATE.companies.filter(c => c.type === 'Whitelabel');
  const filtered = filterData(all, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  return `
    ${pageHeader('Whitelabel List', '<span>Whitelabel</span><span class="sep">â€º</span><span>List</span>', `
      <button class="btn btn-primary" onclick="window.openCompanyTypeForm('Whitelabel')"><i class="fa-solid fa-plus"></i> Add Whitelabel</button>`)
    }

    ${filterCard(`
      ${fsInput(PG, 'username', 'Username', 'Search...')}
      ${fsSelect(PG, 'status', 'Status', ['All', 'Active', 'Inactive'])}
      ${fsActions(PG)}
    `)
    }

<div class="card">
  <div class="card-body">
    ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Username</th><th>Name</th><th>Tier</th><th>Credit</th><th>Members</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${rows.map((c, i) => `
                <tr>
                  <td>${(cp - 1) * pp + i + 1}</td>
                  <td><strong style="color:var(--acc)">${c.username}</strong></td>
                  <td>${c.name}</td>
                  <td>${badge(c.type, 'indigo')}</td>
                  <td style="font-weight:700">${fmtCur(c.credit)}</td>
                  <td>${fmt(c.members)}</td>
                  <td>
                    <button onclick="window.toggleCompanyStatus('${c.id}','${c.status === 'Active' ? 'Inactive' : 'Active'}','${c.username}')"
                      class="btn btn-sm" style="background:${c.status === 'Active' ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.12)'};color:${c.status === 'Active' ? 'var(--green)' : 'var(--red)'};border:1px solid ${c.status === 'Active' ? 'var(--green)' : 'var(--red)'}44;font-size:.72rem;padding:.2rem .6rem;border-radius:20px;font-weight:700"
                      title="${c.status === 'Active' ? 'Deactivate' : 'Activate'}">${c.status === 'Active' ? 'âœ“ Active' : 'âœ— Inactive'}</button>
                  </td>
                  <td>${actionBtns(
      `window.openFormModal('company','${c.id}')`,
      `confirmAction('Delete Record','Delete record [${c.username}]?',()=>window.deleteCompany('${c.id}','${c.username}','master-whitelabel-list'),'Delete','danger')`
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

// Alias: nav uses 'master-wl-list'
// ─── CONSOLIDATED: master-wl-list points to the same whitelabel-list page ─────
// With 3-level hierarchy, there is only 1 type of Whitelabel.
pages['master-wl-list'] = pages['master-whitelabel-list'];
pages['whitelabel-list'] = pages['master-whitelabel-list'];


/* â”€â”€â”€ WHITELABEL LIST â”€â”€â”€ */
pages['whitelabel-list'] = () => {
  const PG = 'whitelabel-list';
  const all = STATE.companies.filter(c => c.type === 'Whitelabel');
  const filtered = filterData(all, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  return `
    ${pageHeader('Whitelabel List', '<span>Whitelabel</span><span class="sep">â€º</span><span>List</span>', `
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
                  <td>
                    <button onclick="window.toggleCompanyStatus('${c.id}','${c.status === 'Active' ? 'Inactive' : 'Active'}','${c.username}')"
                      class="btn btn-sm" style="background:${c.status === 'Active' ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.12)'};color:${c.status === 'Active' ? 'var(--green)' : 'var(--red)'};border:1px solid ${c.status === 'Active' ? 'var(--green)' : 'var(--red)'}44;font-size:.72rem;padding:.2rem .6rem;border-radius:20px;font-weight:700"
                      title="${c.status === 'Active' ? 'Deactivate' : 'Activate'}">${c.status === 'Active' ? 'âœ“ Active' : 'âœ— Inactive'}</button>
                  </td>
                  <td>${actionBtns(
      `window.openFormModal('company','${c.id}')`,
      `confirmAction('Delete Whitelabel','Delete whitelabel [${c.username}]?',()=>window.deleteCompany('${c.id}','${c.username}','whitelabel-list'),'Delete','danger')`
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

// tier-history is defined in members.js (authoritative version)

/* â”€â”€â”€ MY DOWNLINES â€” scoped to current admin's own downline tree â”€â”€â”€ */
pages['my-downlines'] = () => {
  const role = STATE.currentAdmin.role;
  const myCompany = getMyCompany();
  const all = getDirectDownlines();
  const dlType = getDownlineType();

  const roleLabel = { Whitelabel: 'Whitelabel', Agent: 'Agent' }[role] || role;
  const typeLabel = 'Agent';
  const pageTitle = role === 'Whitelabel' ? 'My Agents' : 'My Downlines';

  const PG = 'my-downlines';
  const filtered = filterData(all, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  const totalCredit = all.reduce((s, c) => s + (c.credit || 0), 0);
  const totalMembers = all.reduce((s, c) => s + (c.members || 0), 0);
  const activeCount = all.filter(c => c.status === 'Active').length;

  return `
    ${pageHeader(pageTitle, `<span>${roleLabel}</span><span class="sep">â€º</span><span>My Downlines</span>`, `
        <button class="btn btn-primary" onclick="window.openFormModal('company')"><i class="fa-solid fa-plus"></i> Add ${typeLabel}</button>`)}

    <!-- Stats row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.25rem">
        ${[
      { icon: 'sitemap', label: 'Total Downlines', val: all.length, color: '#6366f1' },
      { icon: 'circle-check', label: 'Active', val: activeCount, color: '#10b981' },
      { icon: 'coins', label: 'Total Credit', val: fmtCur(totalCredit), color: '#f59e0b' },
      { icon: 'users', label: 'Total Members', val: fmt(totalMembers), color: '#8b5cf6' },
    ].map(s => `
        <div class="card" style="border-left:3px solid ${s.color}20">
            <div class="card-body" style="display:flex;align-items:center;gap:1rem;padding:1rem">
                <div style="width:40px;height:40px;border-radius:10px;background:${s.color}18;display:flex;align-items:center;justify-content:center">
                    <i class="fa-solid fa-${s.icon}" style="color:${s.color};font-size:1.1rem"></i>
                </div>
                <div>
                    <div style="font-size:1.2rem;font-weight:800;color:#fff">${s.val}</div>
                    <div style="font-size:.72rem;color:var(--text3)">${s.label}</div>
                </div>
            </div>
        </div>`).join('')}
    </div>

    <!-- Parent company banner -->
    ${myCompany ? `
    <div style="background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);border-radius:10px;padding:.75rem 1.25rem;margin-bottom:1rem;display:flex;align-items:center;gap:.75rem;font-size:.83rem">
        <i class="fa-solid fa-building-user" style="color:#6366f1;font-size:1.1rem"></i>
        <span style="color:#a5b4fc">Your company: <strong style="color:#fff">${myCompany.name}</strong> &nbsp;Â·&nbsp; All ${typeLabel.toLowerCase()}s listed below are direct downlines of your account.</span>
    </div>` : ''}

    ${filterCard(`
        ${fsInput('my-downlines', 'username', 'Username', 'Search usernameâ€¦')}
        ${fsInput('my-downlines', 'name', 'Name', 'Search nameâ€¦')}
        ${fsSelect('my-downlines', 'status', 'Status', ['All Status', 'Active', 'Inactive'])}
        ${fsActions('my-downlines')}
    `)}

    <div class="card">
        <div class="card-body">
            ${tableWrap(`
                <table>
                    <thead>
                        <tr><th>#</th><th>Username</th><th>Name</th><th>Email</th><th>Type</th><th>Credit</th><th>Members</th><th>Joined</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                        ${rows.map((c, i) => `
                        <tr>
                            <td>${(cp - 1) * pp + i + 1}</td>
                            <td><strong style="color:var(--acc)">${c.username}</strong></td>
                            <td>${c.name}</td>
                            <td style="font-size:.75rem">${c.email || '-'}</td>
                            <td><span style="font-size:.72rem;font-weight:700;padding:.2rem .6rem;border-radius:12px;background:rgba(99,102,241,.15);color:#a5b4fc">${c.type}</span></td>
                            <td style="font-weight:700">${fmtCur(c.credit)}</td>
                            <td>${fmt(c.members)}</td>
                            <td style="font-size:.75rem">${c.joined}</td>
                            <td>
                                <button onclick="window.toggleCompanyStatus('${c.id}','${c.status === 'Active' ? 'Inactive' : 'Active'}','${c.username}')"
                                    class="btn btn-sm" style="background:${c.status === 'Active' ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.12)'};color:${c.status === 'Active' ? 'var(--green)' : 'var(--red)'};border:1px solid ${c.status === 'Active' ? 'var(--green)' : 'var(--red)'}44;font-size:.72rem;padding:.2rem .6rem;border-radius:20px;font-weight:700">
                                    ${c.status === 'Active' ? 'âœ“ Active' : 'âœ— Inactive'}
                                </button>
                            </td>
                            <td>${actionBtns(
      `window.openFormModal('company','${c.id}')`,
      `confirmAction('Delete ${typeLabel}','Delete [${c.username}]?',()=>window.deleteCompany('${c.id}','${c.username}','my-downlines'),'Delete','danger')`
    )}</td>
                        </tr>`).join('')}
                        ${rows.length === 0 ? `<tr><td colspan="10" style="text-align:center;color:var(--text3)">No ${typeLabel.toLowerCase()}s found</td></tr>` : ''}
                    </tbody>
                </table>
            `)}
        </div>
    </div>
    ${renderPagerHTML(PG, total, pp, cp)}`;
};

/* BANK CREATE */
pages['bank-create'] = () => {
  const banks = ['BCA', 'BNI', 'BRI', 'MANDIRI', 'DANAMON', 'CIMB', 'PERMATA', 'MAYBANK', 'BTN', 'OCBC', 'PANIN', 'MEGA', 'SINARMAS'];

  return `
    ${pageHeader('Create Bank Account', '<span>Bank Management</span><span class="sep">›</span><span>Create</span>', `
      <button class="btn btn-secondary" onclick="go('bank-list')"><i class="fa-solid fa-arrow-left"></i> Back to Bank List</button>
    `)}

    <div style="display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:1.25rem;align-items:start">
      <div class="card">
        <div class="card-header"><span class="card-title">Add Bank Account</span></div>
        <div class="card-body">
          <div class="form-grid">
            <div class="form-field">
              <label>Financial Institution</label>
              <select id="bk_bank">${banks.map(b => `<option>${b}</option>`).join('')}</select>
            </div>
            <div class="form-field">
              <label>Operating Mode</label>
              <select id="bk_type">
                <option>Both (Dep & WD)</option>
                <option>Deposit Only</option>
                <option>Withdraw Only</option>
              </select>
            </div>
            <div class="form-field">
              <label>Registered Account Name</label>
              <input type="text" id="bk_accname" placeholder="VIGOR OFFICIAL BCA" />
            </div>
            <div class="form-field">
              <label>Account Number</label>
              <input type="text" id="bk_accno" placeholder="e.g. 5200112233" />
            </div>
            <div class="form-field">
              <label>Min Deposit Limit (Rp)</label>
              <input type="number" id="bk_min" value="10000" min="0" />
            </div>
            <div class="form-field">
              <label>Max Deposit Limit (Rp)</label>
              <input type="number" id="bk_max" value="100000000" min="0" />
            </div>
            <div class="form-field">
              <label>Min Withdraw Limit (Rp)</label>
              <input type="number" id="bk_minw" value="50000" min="0" />
            </div>
            <div class="form-field">
              <label>Max Withdraw Limit (Rp)</label>
              <input type="number" id="bk_maxw" value="50000000" min="0" />
            </div>
          </div>

          <div class="form-field" style="margin-top:1rem">
            <label>Gateway Availability</label>
            <div style="display:flex;gap:1rem;flex-wrap:wrap;padding:.75rem 1rem;border:1px solid var(--border);border-radius:10px;background:var(--bg2)">
              <label style="display:flex;align-items:center;gap:.5rem;font-size:.9rem;font-weight:600">
                <input type="radio" name="bk_status" value="Active" checked /> System Active
              </label>
              <label style="display:flex;align-items:center;gap:.5rem;font-size:.9rem;font-weight:600">
                <input type="radio" name="bk_status" value="Inactive" /> Temporarily Offline
              </label>
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1.5rem">
            <button class="btn btn-secondary" onclick="go('bank-list')">Cancel</button>
            <button class="btn btn-primary" onclick="window.submitBankCreate()"><i class="fa-solid fa-check"></i> Provision Account</button>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:1rem">
        <div class="card">
          <div class="card-body" style="padding:1.25rem">
            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem">
              <div style="width:44px;height:44px;border-radius:12px;background:rgba(16,185,129,.12);display:flex;align-items:center;justify-content:center;color:var(--green)">
                <i class="fa-solid fa-vault"></i>
              </div>
              <div>
                <div style="font-weight:700">Secure Gateway</div>
                <div style="font-size:.78rem;color:var(--text3)">New receiving account provisioning</div>
              </div>
            </div>
            <p style="margin:0;color:var(--text2);font-size:.82rem;line-height:1.6">
              Use this form to register a payout / deposit gateway with limits and operational status.
            </p>
          </div>
        </div>

        <div class="card">
          <div class="card-body" style="padding:1.25rem">
            <div style="font-size:.75rem;font-weight:800;text-transform:uppercase;color:var(--text3);margin-bottom:.75rem">Quick Notes</div>
            <ul style="margin:0;padding-left:1.1rem;color:var(--text2);font-size:.82rem;line-height:1.8">
              <li>Account name should match the KYC holder.</li>
              <li>Limit values are editable after creation.</li>
              <li>Inactive banks stay hidden from routing.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>`;
};
/* â”€â”€â”€ PROFILE â”€â”€â”€ */
pages['profile'] = () => {
  const p = STATE.profile;
  return `
    ${pageHeader('My Profile', '<span>Account</span><span class="sep">â€º</span><span>Profile</span>')}

<div style="display:grid;grid-template-columns:340px 1fr;gap:1.25rem;align-items:start">
  <div class="card">
    <div class="card-body" style="text-align:center;padding:2.5rem 1.5rem">
      <div style="width:90px;height:90px;border-radius:50%;background:var(--acc);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:700;color:#fff;margin:0 auto 1rem">AS</div>
      <div style="font-size:1.15rem;font-weight:700">${p.username}</div>
      <div style="font-size:.82rem;color:var(--text3);margin-top:.25rem">SUBSTAG Â· Admin</div>
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
            <input type="password" id="cp_current" class="form-control" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" />
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input type="password" id="cp_new" class="form-control" placeholder="Min 8 characters" />
          </div>
          <div class="form-group">
            <label class="form-label">Confirm Password</label>
            <input type="password" id="cp_confirm" class="form-control" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" />
          </div>
        </div>
        <div id="cp_strength_bar" style="height:4px;width:0;background:var(--green);border-radius:2px;margin:.5rem 0;transition:width .3s"></div>
        <button class="btn btn-warning mt-3" onclick="window.changeAdminPassword()"><i class="fa-solid fa-lock"></i> Update Password</button>
      </div>
    </div>
  </div>
</div>`;
};

/* â”€â”€â”€ CHANGE PASSWORD â”€â”€â”€ */
window.changeAdminPassword = async () => {
  const current = document.getElementById('cp_current')?.value;
  const newPass = document.getElementById('cp_new')?.value;
  const confirm = document.getElementById('cp_confirm')?.value;

  if (!current) { toast('Current password is required', 'error'); return; }
  if (!newPass || newPass.length < 8) { toast('New password must be at least 8 characters', 'error'); return; }
  if (newPass !== confirm) { toast('Passwords do not match', 'error'); return; }

  // Strength check
  const hasUpper = /[A-Z]/.test(newPass);
  const hasNum = /\d/.test(newPass);
  const hasSpecial = /[!@#$%^&*]/.test(newPass);
  const strength = (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpecial ? 1 : 0) + (newPass.length >= 12 ? 1 : 0);
  if (strength < 2) { toast('Password too weak. Use uppercase, numbers, or special characters.', 'warning'); return; }

  if (window.supabase && typeof window.supabase.auth?.updateUser === 'function') {
    const { error } = await window.supabase.auth.updateUser({ password: newPass });
    if (error) { toast('Failed: ' + error.message, 'error'); return; }
  }
  // Clear fields
  ['cp_current', 'cp_new', 'cp_confirm'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  addLog('Profile', STATE.currentAdmin?.username || 'admin', 'Password changed');
  toast('Password updated successfully', 'success');
};

/* â”€â”€â”€ HANDLERS â”€â”€â”€ */
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

  const newId = 'C' + Date.now();
  // For non-SuperAdmin: auto-set parentId to their own company
  const myComp = getMyCompany();
  const autoParentId = (STATE.currentAdmin.role !== 'SuperAdmin' && myComp) ? myComp.id : null;
  const newCompany = {
    id: newId,
    username: u,
    name: n || u,
    email: '',
    phone: '',
    credit: 0,
    members: 0,
    status: 'Active',
    type: STATE.currentAdmin.role !== 'SuperAdmin' ? getDownlineType() : 'Whitelabel',
    template,
    country,
    whitelistIPs: ips,
    togelMarkets: pools,
    joined: new Date().toISOString().split('T')[0],
    ...(autoParentId ? { parentId: autoParentId } : {}),
    createdBy: STATE.currentAdmin.id || null,
  };

  if (window.db?.dbAddCompany) {
    window.db.dbAddCompany(newCompany).then(({ error }) => {
      if (error) { toast('Failed: ' + error.message, 'error'); return; }
      if (window.db?.dbWriteLog) window.db.dbWriteLog('Add Company', newId, `New company [${u}] created with ${pools.length} pools`);
      toast('Company created successfully', 'success');
      setTimeout(() => window.go('company-list'), 800);
    });
  } else {
    stateAdd('companies', newCompany);
    addLog('company_create', u, `New company [${u}] created with ${pools.length} pools`);
    toast('Company created successfully', 'success');
    setTimeout(() => window.go('company-list'), 800);
  }
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
  const newBankId = 'B' + Date.now();
  const newBank = { id: newBankId, bank, accountName: accName, accountNumber: accNo, type, minDeposit: minD, maxDeposit: maxD, status };
  if (window.db?.dbAddBank) {
    window.db.dbAddBank(newBank).then(({ error }) => {
      if (error) { toast('Failed: ' + error.message, 'error'); return; }
      if (window.db?.dbWriteLog) window.db.dbWriteLog('Add Bank', newBankId, `New bank account added: ${bank}`);
      toast('Bank account added successfully', 'success');
      setTimeout(() => window.go('bank-list'), 800);
    });
  } else {
    stateAdd('banks', newBank);
    addLog('bank_create', bank, 'New bank account added');
    toast('Bank account added successfully', 'success');
    setTimeout(() => window.go('bank-list'), 800);
  }
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
    if (typeEl && STATE.currentAdmin.role === 'SuperAdmin') typeEl.value = type;
    const statusEl = document.getElementById('f_status');
    if (statusEl) statusEl.value = 'Active';
    // Ensure parentId is filled from scope helper for non-SuperAdmin
    const pidEl = document.getElementById('f_parentId');
    if (pidEl && !pidEl.value) {
      const mc = getMyCompany();
      if (mc) pidEl.value = mc.id;
    }
  });
};


// â”€â”€ Company / Whitelabel / Agent status toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.toggleCompanyStatus = async (id, newStatus, username) => {
  const label = newStatus === 'Active' ? 'activate' : 'deactivate';
  if (!confirm(`Are you sure you want to ${label} company [${username}]?`)) return;
  const company = STATE.companies.find(c => c.id === id);
  if (!company) return;
  if (window.db?.dbUpdateCompany) {
    const { error } = await window.db.dbUpdateCompany(id, { status: newStatus });
    if (error) { toast('Update failed: ' + error.message, 'error'); return; }
    if (window.db?.dbWriteLog) window.db.dbWriteLog(
      newStatus === 'Active' ? 'Activate Company' : 'Deactivate Company',
      username, `Company [${username}] status â†’ ${newStatus}`
    );
  } else {
    company.status = newStatus;
    stateUpdate('companies', id, { status: newStatus });
  }
  toast(`Company [${username}] ${newStatus === 'Active' ? 'activated âœ“' : 'deactivated âœ—'}`, 'success');
  window.go('company-list');
};

/* ─── DYNAMIC COMPANY NETWORK TREE (MLM VISUALIZER) ─── */
pages['company-tree'] = () => {
  const companies = STATE.companies || [];
  const members = STATE.members || [];

  const treeMap = {};
  companies.forEach(c => {
    treeMap[c.id] = { ...c, children: [], membersCount: 0 };
  });

  const rootNodes = [];
  companies.forEach(c => {
    if (c.parentId && treeMap[c.parentId]) {
      treeMap[c.parentId].children.push(treeMap[c.id]);
    } else {
      rootNodes.push(treeMap[c.id]);
    }
  });

  members.forEach(m => {
    if (m.companyId && treeMap[m.companyId]) {
      treeMap[m.companyId].membersCount++;
    }
  });

  const renderNode = (node) => {
    const isWhitelabel = node.type === 'Whitelabel';
    const color = isWhitelabel ? 'var(--acc)' : 'var(--green)';
    const icon = isWhitelabel ? 'fa-globe' : 'fa-building';
    const mCount = node.membersCount || 0;
    const profit = Math.floor(Math.random() * 50) + 10;

    return `
        <li>
            <div class="tree-node" style="border-top:3px solid ${color}">
                <div class="node-icon" style="color:${color}; background:${color}22"><i class="fa-solid ${icon}"></i></div>
                <div class="node-title">${node.name}</div>
                <div class="node-badge" style="background:${color}22; color:${color}">${node.type}</div>
                <div class="node-meta">
                    <span title="Total Members"><i class="fa-solid fa-users"></i> ${mCount}</span>
                    <span title="Est Profit" style="color:var(--green)"><i class="fa-solid fa-wallet"></i> ${profit}M</span>
                </div>
            </div>
            ${node.children.length > 0 ? `<ul>${node.children.map(child => renderNode(child)).join('')}</ul>` : ''}
        </li>
      `;
  };

  return `
    ${pageHeader('Network Tree', '<span>Company</span><span class="sep">›</span><span>Visual Network Tree</span>')}
    
    <style>
      /* Base Tree Styles */
      .tree-wrapper { padding: 4rem 2rem; overflow-x: auto; background: var(--bg2); border-radius: 12px; border: 1px solid var(--border); min-height: 500px; text-align: center; }
      .tree-wrapper ul { padding-top: 20px; position: relative; transition: all 0.5s; display: inline-flex; gap: 20px; justify-content: center; }
      .tree-wrapper li { display: flex; flex-direction: column; align-items: center; text-align: center; list-style-type: none; position: relative; padding: 20px 5px 0 5px; transition: all 0.5s; }
      
      /* Connectors */
      .tree-wrapper li::before, .tree-wrapper li::after { content: ''; position: absolute; top: 0; right: 50%; border-top: 2px solid var(--border); width: 50%; height: 20px; }
      .tree-wrapper li::after { right: auto; left: 50%; border-left: 2px solid var(--border); }
      .tree-wrapper li:only-child::after, .tree-wrapper li:only-child::before { display: none; }
      .tree-wrapper li:only-child { padding-top: 0; }
      .tree-wrapper li:first-child::before, .tree-wrapper li:last-child::after { border: 0 none; }
      .tree-wrapper li:last-child::before { border-right: 2px solid var(--border); border-radius: 0 5px 0 0; }
      .tree-wrapper li:first-child::after { border-radius: 5px 0 0 0; }
      .tree-wrapper ul ul::before { content: ''; position: absolute; top: 0; left: 50%; border-left: 2px solid var(--border); width: 0; height: 20px; }
      
      /* Card Styling */
      .tree-node {
          background: var(--bg1); border: 1px solid var(--border); padding: 1rem; border-radius: 8px; width: 140px;
          display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; z-index: 10;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1); cursor: pointer; transition: transform 0.2s;
      }
      .tree-node:hover { transform: translateY(-5px); box-shadow: 0 8px 24px rgba(14,165,233,0.2); border-color: var(--acc); }
      .node-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.2rem; margin-bottom: 0.5rem; }
      .node-title { font-size: 0.85rem; font-weight: 700; color: var(--text1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
      .node-badge { font-size: 0.6rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-top: 4px; text-transform: uppercase; }
      .node-meta { margin-top: 0.75rem; display: flex; justify-content: space-between; width: 100%; font-size: 0.75rem; color: var(--text3); border-top: 1px dashed var(--border); padding-top: 0.5rem; }
    </style>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fa-solid fa-spider" style="color:var(--acc);margin-right:8px"></i> Visual Downline Hierarchy</span></div>
      <div class="tree-wrapper">
        <ul style="margin:0 auto">
          ${rootNodes.length > 0 ? rootNodes.map(root => renderNode(root)).join('') : '<li><div class="tree-node"><div class="node-title">No Network Found</div></div></li>'}
        </ul>
      </div>
    </div>
  `;
};


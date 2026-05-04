/* ─── FINANCE PAGES ─── */
import { STATE, fmtCur, saveState } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsSelect, fsDateFilter, fsActions, tableWrap, badge, renderPagerHTML } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage, BANKS, STATUSES } from '../utils/helpers.js';

pages['deposit-list'] = () => {
  const PG = 'deposit-list';
  const filtered = filterData(STATE.deposits, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);
  const pending = STATE.deposits.filter(d => d.status === 'Pending').length;
  const totalApprovedAmt = filtered.reduce((s, d) => s + (d.status === 'Approved' ? d.amount : 0), 0);

  return `
    ${pageHeader('Deposit Management', '<span>Finance</span><span class="sep">›</span><span>Deposit</span>', `
      <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
        <span style="background:rgba(234,179,8,.15);color:#ca8a04;border:1px solid rgba(234,179,8,.3);border-radius:20px;padding:.25rem .75rem;font-size:.8rem;font-weight:600"><i class="fa-solid fa-clock"></i> Pending: ${pending}</span>
        <span style="background:rgba(16,185,129,.15);color:#059669;border:1px solid rgba(16,185,129,.3);border-radius:20px;padding:.25rem .75rem;font-size:.8rem;font-weight:600"><i class="fa-solid fa-check"></i> Total Approved: ${fmtCur(totalApprovedAmt)}</span>
        <button class="btn btn-export btn-sm" onclick="window.exportTableCSV(null,'deposits.csv')"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
      </div>`
  )}

    ${filterCard(`
      ${fsInput(PG, 'member', 'Member', 'Search member...')}
      ${fsSelect(PG, 'status', 'Status', ['All', 'Pending', 'Approved', 'Rejected'])}
      ${fsSelect(PG, 'bank', 'Bank', ['All', ...BANKS])}
      ${fsDateFilter(PG, 'startDate', 'endDate')}
      ${fsActions(PG)}
    `)}

    ${tableWrap(`
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>ID</th>
            <th>Member</th>
            <th>Company</th>
            <th>Bank</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>By</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((d, i) => `
            <tr>
              <td>${(cp - 1) * pp + i + 1}</td>
              <td><strong>${d.id}</strong></td>
              <td><strong>${d.member}</strong></td>
              <td>${d.company}</td>
              <td>${d.bank}</td>
              <td class="text-green" style="font-weight:700">${fmtCur(d.amount)}</td>
              <td>${badge(d.status, d.status === 'Approved' ? 'success' : d.status === 'Rejected' ? 'danger' : 'warning')}</td>
              <td style="font-size:.75rem;white-space:nowrap">${d.date}</td>
              <td style="font-size:.75rem">${d.processedBy}</td>
              <td>
                ${d.status === 'Pending' ? `
                  <div class="action-btns">
                    <button class="btn btn-sm btn-success" onclick="confirmAction('Approve Deposit','Approve deposit ${fmtCur(d.amount)} from ${d.member}?',()=>window.handleFinance('deposit','${d.id}','approve'),'Approve','primary')"><i class="fa-solid fa-check"></i> Approve</button>
                    <button class="btn btn-sm btn-danger" onclick="confirmAction('Reject Deposit','Reject deposit from ${d.member}? This cannot be undone.',()=>window.handleFinance('deposit','${d.id}','reject'),'Reject','danger')"><i class="fa-solid fa-xmark"></i> Reject</button>
                  </div>` : `<span style="font-size:.75rem;color:var(--text3)">${d.processedBy}</span>`}
              </td>
            </tr>
          `).join('')}
          ${rows.length === 0 ? '<tr><td colspan="10" style="text-align:center;color:var(--text3)">No records found</td></tr>' : ''}
        </tbody>
      </table>
    `)}
    ${renderPagerHTML(PG, total, pp, cp)}
  `;
};

pages['withdrawal-list'] = () => {
  const PG = 'withdrawal-list';
  const filtered = filterData(STATE.withdrawals, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);
  const pending = STATE.withdrawals.filter(w => w.status === 'Pending').length;

  return `
    ${pageHeader('Withdrawal Management', '<span>Finance</span><span class="sep">›</span><span>Withdrawal</span>', `
      <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
        <span style="background:rgba(234,179,8,.15);color:#ca8a04;border:1px solid rgba(234,179,8,.3);border-radius:20px;padding:.25rem .75rem;font-size:.8rem;font-weight:600"><i class="fa-solid fa-clock"></i> Pending: ${pending}</span>
        <button class="btn btn-export btn-sm" onclick="window.exportTableCSV(null,'withdrawals.csv')"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
      </div>`
  )}

    ${filterCard(`
      ${fsInput(PG, 'member', 'Member', 'Search member...')}
      ${fsSelect(PG, 'status', 'Status', ['All', 'Pending', 'Approved', 'Rejected'])}
      ${fsDateFilter(PG, 'startDate', 'endDate')}
      ${fsActions(PG)}
    `)}

    ${tableWrap(`
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>ID</th>
            <th>Member</th>
            <th>Company</th>
            <th>Bank</th>
            <th>Account</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((w, i) => `
            <tr>
              <td>${(cp - 1) * pp + i + 1}</td>
              <td><strong>${w.id}</strong></td>
              <td><strong>${w.member}</strong></td>
              <td>${w.company}</td>
              <td>${w.bank}</td>
              <td style="font-size:.75rem">${w.accountNumber}</td>
              <td class="text-red" style="font-weight:700">${fmtCur(w.amount)}</td>
              <td>${badge(w.status, w.status === 'Approved' ? 'success' : w.status === 'Rejected' ? 'danger' : 'warning')}</td>
              <td style="font-size:.75rem;white-space:nowrap">${w.date}</td>
              <td>
                ${w.status === 'Pending' ? `
                  <div class="action-btns">
                    <button class="btn btn-sm btn-success" onclick="confirmAction('Approve Withdrawal','Approve withdrawal ${fmtCur(w.amount)} for ${w.member}?',()=>window.handleFinance('withdrawal','${w.id}','approve'),'Approve','primary')"><i class="fa-solid fa-check"></i> Approve</button>
                    <button class="btn btn-sm btn-danger" onclick="confirmAction('Reject Withdrawal','Reject withdrawal from ${w.member}? This cannot be undone.',()=>window.handleFinance('withdrawal','${w.id}','reject'),'Reject','danger')"><i class="fa-solid fa-xmark"></i> Reject</button>
                  </div>` : `<span style="font-size:.75rem;color:var(--text3)">${w.processedBy}</span>`}
              </td>
            </tr>
          `).join('')}
          ${rows.length === 0 ? '<tr><td colspan="10" style="text-align:center;color:var(--text3)">No records found</td></tr>' : ''}
        </tbody>
      </table>
    `)}
    ${renderPagerHTML(PG, total, pp, cp)}
  `;
};

pages['bank-list'] = () => {
  const PG = 'bank-list';
  const filtered = filterData(STATE.banks, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  return `
    ${pageHeader('Bank Management', '<span>Finance</span><span class="sep">›</span><span>Bank Management</span>', `
      <button class="btn btn-primary" onclick="go('bank-create')"><i class="fa-solid fa-plus"></i> Add Account</button>`
  )}

    ${filterCard(`
      ${fsInput(PG, 'bank', 'Bank Name', 'Search bank...')}
      ${fsSelect(PG, 'status', 'Status', ['All', 'Active', 'Inactive'])}
      ${fsActions(PG)}
    `)}

    ${tableWrap(`
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Bank</th>
            <th>Name</th>
            <th>Account Number</th>
            <th>Type</th>
            <th>Limits</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((b, i) => `
            <tr>
              <td>${(cp - 1) * pp + i + 1}</td>
              <td><strong>${b.bank}</strong></td>
              <td>${b.accountName}</td>
              <td>${b.accountNumber}</td>
              <td>${badge(b.type, 'indigo')}</td>
              <td style="font-size:.72rem">${fmtCur(b.minDeposit)} - ${fmtCur(b.maxDeposit)}</td>
              <td>${badge(b.status, b.status === 'Active' ? 'success' : 'danger')}</td>
              <td>
                <div class="action-btns">
                  <button class="btn btn-sm btn-icon" style="background:#f59e0b;color:#fff" onclick="window.openFormModal('bank','${b.id}')"><i class="fa-solid fa-pen"></i></button>
                  <button class="btn btn-sm btn-danger btn-icon" onclick="confirmAction('Delete Bank','Delete bank [${b.bank} - ${b.accountName}]?',()=>window.deleteBank('${b.id}','${b.bank} ${b.accountName}'),'Delete','danger')"><i class="fa-solid fa-trash"></i></button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `)}
    ${renderPagerHTML(PG, total, pp, cp)}
  `;
};

window.handleFinance = async (type, id, action) => {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  const status = action === 'approve' ? 'Approved' : 'Rejected';
  const adminUser = window.STATE?.profile?.username || 'admin';

  // Use Supabase db layer if available, else fall back to STATE update
  let error = null;
  if (window.db) {
    const fn = type === 'deposit'
      ? (action === 'approve' ? window.db.dbApproveDeposit : window.db.dbRejectDeposit)
      : (action === 'approve' ? window.db.dbApproveWithdrawal : window.db.dbRejectWithdrawal);
    ({ error } = await fn(id, adminUser));
  } else {
    window.stateUpdate(type === 'deposit' ? 'deposits' : 'withdrawals', id, { status, processedBy: adminUser });
  }

  if (error) {
    window.toast(`Failed: ${error.message}`, 'error');
  } else {
    window.toast(`${label} ${status}`, action === 'approve' ? 'success' : 'error');
    window.go(window.currentPage);
  }
};

/* ─── BALANCE ADJUSTMENT (UNIFIED LIST & FORM) ─── */
pages['finance-adjustment'] = () => {
  const PG = 'finance-adjustment';
  const filtered = filterData(STATE.adjustments, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  const totalAdded = STATE.adjustments.filter(a => a.type === 'deposit').reduce((s, a) => s + a.amount, 0);
  const totalSubbed = STATE.adjustments.filter(a => a.type === 'withdrawal').reduce((s, a) => s + a.amount, 0);
  const totalBonus = STATE.adjustments.filter(a => a.type === 'bonus').reduce((s, a) => s + a.amount, 0);

  return `
    ${pageHeader('Balance Adjustment', '<span>Finance</span><span class="sep">›</span><span>Adjustment</span>', `
        <div style="display:flex; gap:.5rem; align-items:center; flex-wrap:wrap">
            <span style="background:rgba(16,185,129,.15); color:#059669; border-radius:20px; padding:.25rem .75rem; font-size:.8rem; font-weight:600"><i class="fa-solid fa-plus"></i> In: ${fmtCur(totalAdded)}</span>
            <span style="background:rgba(239,68,68,.15); color:#dc2626; border-radius:20px; padding:.25rem .75rem; font-size:.8rem; font-weight:600"><i class="fa-solid fa-minus"></i> Out: ${fmtCur(totalSubbed)}</span>
            <span style="background:rgba(14,165,233,.15); color:#0284c7; border-radius:20px; padding:.25rem .75rem; font-size:.8rem; font-weight:600"><i class="fa-solid fa-gift"></i> Bonus: ${fmtCur(totalBonus)}</span>
            <button class="btn btn-primary" onclick="window.openAdjustmentForm()"><i class="fa-solid fa-plus-circle"></i> Create Adjustment</button>
        </div>
    `)}

    ${filterCard(`
        ${fsInput(PG, 'member', 'Member Username', 'Search...')}
        ${fsSelect(PG, 'type', 'Type', ['All', 'deposit', 'withdrawal', 'bonus'])}
        ${fsDateFilter(PG, 'startDate', 'endDate')}
        ${fsActions(PG)}
    `)}

    <div class="card">
        <div class="card-body">
            ${tableWrap(`
                <table>
                    <thead>
                        <tr><th>#</th><th>ID</th><th>Member</th><th>Type</th><th>Amount</th><th>Notes / Reason</th><th>Date</th><th>Processed By</th></tr>
                    </thead>
                    <tbody>
                        ${rows.map((r, i) => `
                            <tr>
                                <td>${(cp - 1) * pp + i + 1}</td>
                                <td><strong>${r.id}</strong></td>
                                <td><strong>${r.member}</strong></td>
                                <td>${badge(r.type, r.type === 'deposit' ? 'success' : r.type === 'bonus' ? 'info' : 'danger')}</td>
                                <td style="font-weight:700; color:var(--${r.type === 'deposit' ? 'green' : r.type === 'bonus' ? 'acc' : 'red'})">${r.type === 'withdrawal' ? '-' : '+'}${fmtCur(r.amount)}</td>
                                <td style="font-size:.72rem; color:var(--text2)">${r.notes || '-'}</td>
                                <td style="font-size:.75rem; white-space:nowrap">${r.date}</td>
                                <td style="font-size:.75rem"><span class="badge badge-secondary">${r.processedBy}</span></td>
                            </tr>
                        `).join('')}
                        ${rows.length === 0 ? '<tr><td colspan="8" style="text-align:center; color:var(--text3); padding:2rem">No adjustment records found</td></tr>' : ''}
                    </tbody>
                </table>
            `)}
        </div>
    </div>
    ${renderPagerHTML(PG, total, pp, cp)}
    `;
};

window.openAdjustmentForm = () => {
  openModal('Manual Balance Adjustment', `
        <style>
            .adj-container {
                padding: 10px 5px;
                color: var(--text);
            }
            .adj-type-switcher {
                display: flex;
                gap: 8px;
                padding: 6px;
                background: rgba(255,255,255,0.03);
                border: 1px solid var(--border);
                border-radius: 12px;
                margin-bottom: 24px;
            }
            .adj-type-option {
                flex: 1;
                padding: 12px;
                border: 1px solid transparent;
                background: transparent;
                color: var(--text3);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
                font-weight: 700;
                font-size: 0.75rem;
            }
            .adj-type-option i { font-size: 1.1rem; margin-bottom: 2px; }
            .adj-type-option:hover { background: rgba(255,255,255,0.05); }
            
            .adj-type-option.active.dep {
                background: rgba(16,185,129,0.1);
                border-color: rgba(16,185,129,0.3);
                color: var(--green);
            }
            .adj-type-option.active.bonus {
                background: rgba(2,132,199,0.1);
                border-color: rgba(2,132,199,0.3);
                color: var(--acc);
            }
            .adj-type-option.active.wit {
                background: rgba(239,68,68,0.1);
                border-color: rgba(239,68,68,0.3);
                color: var(--red);
            }

            .adj-group {
                margin-bottom: 18px;
            }
            .adj-label {
                display: block;
                font-size: 0.72rem;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--text3);
                margin-bottom: 8px;
            }
            .adj-input-wrapper {
                position: relative;
                display: flex;
                align-items: center;
            }
            .adj-input-wrapper i {
                position: absolute;
                left: 14px;
                color: var(--text3);
                font-size: 0.9rem;
                pointer-events: none;
            }
            .adj-field {
                width: 100%;
                background: var(--bg) !important;
                border: 1px solid var(--border) !important;
                border-radius: 8px !important;
                padding: 12px 12px 12px 42px !important;
                color: var(--text) !important;
                font-size: 0.9rem;
                transition: border-color 0.2s;
            }
            .adj-field:focus {
                border-color: var(--acc) !important;
                background: var(--bg2) !important;
                outline: none;
            }
            .adj-amount-field {
                font-size: 1.25rem !important;
                font-weight: 800 !important;
                letter-spacing: -0.02em;
                color: var(--acc) !important;
            }
        </style>

        <div class="adj-container">
            <div class="adj-type-switcher">
                <button class="adj-type-option dep active" onclick="setAdjType('deposit', this)">
                    <i class="fa-solid fa-circle-plus"></i>
                    <span>CREDIT</span>
                </button>
                <button class="adj-type-option bonus" onclick="setAdjType('bonus', this)">
                    <i class="fa-solid fa-gift"></i>
                    <span>BONUS</span>
                </button>
                <button class="adj-type-option wit" onclick="setAdjType('withdrawal', this)">
                    <i class="fa-solid fa-circle-minus"></i>
                    <span>DEBIT</span>
                </button>
            </div>
            
            <input type="hidden" id="adj_type" value="deposit">

            <div class="adj-group">
                <label class="adj-label">Target Member</label>
                <div class="adj-input-wrapper">
                    <i class="fa-solid fa-user-tag"></i>
                    <input type="text" id="adj_username" class="adj-field" placeholder="Search by username...">
                </div>
            </div>

            <div class="adj-group">
                <label class="adj-label">Adjustment Amount</label>
                <div class="adj-input-wrapper">
                    <i class="fa-solid fa-money-bill-transfer"></i>
                    <input type="number" id="adj_amount" class="adj-field adj-amount-field" placeholder="0.00">
                </div>
            </div>

            <div class="adj-group">
                <label class="adj-label">Internal Remark</label>
                <div class="adj-input-wrapper" style="align-items: flex-start">
                    <i class="fa-solid fa-comment-dots" style="top: 14px"></i>
                    <textarea id="adj_notes" class="adj-field" style="height:90px; padding-top: 12px !important" placeholder="Reason for this adjustment..."></textarea>
                </div>
            </div>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; gap: 12px; justify-content: flex-end">
                <button class="btn btn-secondary" onclick="closeModalBtn()" style="padding: 10px 20px">Cancel</button>
                <button class="btn btn-primary" onclick="window.submitAdjustment()" style="padding: 10px 28px; font-weight: 800">
                    <i class="fa-solid fa-check-double"></i> EXECUTE ADJUSTMENT
                </button>
            </div>
        </div>
    `);
};

window.setAdjType = (type, btn) => {
  document.getElementById('adj_type').value = type;
  document.querySelectorAll('.adj-type-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  // Smooth color shift for the amount field if adding/subtracting
  const amtField = document.getElementById('adj_amount');
  if (amtField) {
    amtField.style.color = type === 'deposit' ? 'var(--green)' : type === 'bonus' ? 'var(--acc)' : 'var(--red)';
  }
};

window.submitAdjustment = async () => {
  const user = document.getElementById('adj_username').value;
  const type = document.getElementById('adj_type').value;
  const amount = parseFloat(document.getElementById('adj_amount').value);
  const notes = document.getElementById('adj_notes').value;

  if (!user || !amount) return toast('Username and Amount are required', 'error');
  if (amount <= 0) return toast('Amount must be greater than zero', 'error');

  const member = STATE.members.find(m => m.username === user);
  if (!member) return toast('Member not found', 'error');

  const signedAmount = type === 'withdrawal' ? -amount : amount;
  const adminUser = STATE.profile.username || 'admin';

  if (window.db?.dbAdjustMemberBalance) {
    const { error } = await window.db.dbAdjustMemberBalance(member.id, signedAmount, notes || `${type} adjustment`, adminUser);
    if (error) return toast('Adjustment failed: ' + error.message, 'error');
    if (window.db.fetchMembers) await window.db.fetchMembers();
  } else {
    member.balance = (member.balance || 0) + signedAmount;
  }

  const newAdj = {
    id: 'ADJ' + Date.now().toString().slice(-6),
    member: user,
    type: type,
    amount: amount,
    notes: notes,
    date: new Date().toLocaleString(),
    processedBy: adminUser
  };

  STATE.adjustments.unshift(newAdj);
  saveState();
  toast('Adjustment processed successfully', 'success');
  closeModalBtn();
  go('finance-adjustment');
};

/* ─── ADJUSTMENT LOGS (Redirected) ─── */
pages['finance-adjustment-logs'] = pages['finance-adjustment'];

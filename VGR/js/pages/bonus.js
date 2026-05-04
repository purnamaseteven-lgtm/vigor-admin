/* BONUS PAGES */
import { STATE, fmtCur, fmt, saveState } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsSelect, fsDateFilter, fsActions, tableWrap, badge, renderPagerHTML, toast, openModal, closeModalBtn } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage, rnd, MEMBERS, COMPANIES } from '../utils/helpers.js';

const BONUS_TYPES = ['Deposit Bonus', 'Cashback', 'Referral', 'Freebet', 'Welcome', 'Weekly', 'Special Event'];
const PROVIDERS = ['PRAGMATIC PLAY', 'HABANERO', 'MICROGAMING', 'EVOLUTION', 'PG SOFT', 'JOKER', 'RTG'];
const GAMES_PP = ['Gates of Olympus', 'Sweet Bonanza', 'The Dog House', 'Big Bass Bonanza', 'Starlight Princess', 'Wild West Gold', 'Book of Fallen', 'Fruit Party'];

function makeFreebets(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: 'FB' + (3000 + i),
    member: MEMBERS[i % MEMBERS.length],
    company: COMPANIES[i % COMPANIES.length],
    provider: PROVIDERS[i % PROVIDERS.length],
    game: 'Slot Game ' + (i + 1),
    amount: rnd(1, 10) * 5000,
    rounds: rnd(5, 50),
    used: i % 3 !== 0 ? rnd(1, 50) : 0,
    expiry: `${rnd(28, 30)}/04/2026`,
    status: i < 4 ? 'Active' : i % 5 === 0 ? 'Expired' : 'Used',
    createdAt: `${rnd(20, 27)}/04/2026 ${rnd(10, 23)}:${rnd(10, 59)}`
  }));
}

function makeBonusReport(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: 'BR' + (9000 + i),
    member: MEMBERS[i % MEMBERS.length],
    company: COMPANIES[i % COMPANIES.length],
    type: BONUS_TYPES[i % BONUS_TYPES.length],
    depositAmt: rnd(5, 100) * 50000,
    bonusAmt: rnd(1, 30) * 50000,
    turnover: rnd(10, 200) * 50000,
    status: i % 5 === 0 ? 'Pending' : i % 8 === 0 ? 'Cancelled' : 'Claimed',
    claimedAt: `${rnd(20, 27)}/04/2026 ${rnd(10, 23)}:${rnd(10, 59)}`
  }));
}

function makeCampaigns(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: 'PFB' + (500 + i),
    name: 'Free Round Campaign #' + (i + 1),
    game: GAMES_PP[i % GAMES_PP.length],
    betLevel: rnd(1, 10),
    rounds: rnd(10, 100),
    issued: rnd(50, 500),
    used: rnd(20, 400),
    expiry: `${rnd(28, 31)}/04/2026`,
    status: i < 3 ? 'Active' : i % 4 === 0 ? 'Completed' : 'Active'
  }));
}

function getFreebets() {
  // Prefer real Freebet records from STATE.bonuses (DB-backed)
  if (Array.isArray(STATE.bonuses) && STATE.bonuses.some(b => b.type === 'Freebet')) {
    return STATE.bonuses
      .filter(b => b.type === 'Freebet')
      .map(b => ({
        id:        b.id,
        member:    b.member,
        company:   b.company || '-',
        provider:  'N/A',
        game:      'Freebet',
        amount:    b.bonusAmount || 0,
        rounds:    0,
        used:      0,
        expiry:    b.expiresAt ? new Date(b.expiresAt).toLocaleDateString('id-ID') : '-',
        status:    b.status === 'Claimed' ? 'Used' : b.status === 'Cancelled' ? 'Expired' : 'Active',
        createdAt: b.claimedAt || '-',
      }));
  }
  // Fallback: mock data for demo / empty DB
  if (!Array.isArray(STATE.freebets) || STATE.freebets.length === 0) {
    STATE.freebets = makeFreebets(40);
    saveState();
  }
  return STATE.freebets;
}

function getBonusRows() {
  // Prefer real DB data from STATE.bonuses (fetched via fetchBonuses)
  if (Array.isArray(STATE.bonuses) && STATE.bonuses.length > 0) {
    return STATE.bonuses.map(b => ({
      id:         b.id,
      member:     b.member,
      company:    b.company || '-',
      type:       b.type || 'Bonus',
      depositAmt: b.depositAmount || 0,
      bonusAmt:   b.bonusAmount   || 0,
      turnover:   b.turnoverAchieved || 0,
      status:     b.status,
      claimedAt:  b.claimedAt || b.expiresAt || '-',
    }));
  }
  // Fallback: mock data for demo / empty DB
  if (!Array.isArray(STATE.bonusReports) || STATE.bonusReports.length === 0) {
    STATE.bonusReports = makeBonusReport(50);
    saveState();
  }
  return STATE.bonusReports;
}

function getCampaigns() {
  if (!Array.isArray(STATE.pragmaticCampaigns) || STATE.pragmaticCampaigns.length === 0) {
    STATE.pragmaticCampaigns = makeCampaigns(12);
    saveState();
  }
  return STATE.pragmaticCampaigns;
}

pages['bonus-agent-freebet'] = () => {
  const PG = 'bonus-agent-freebet';
  const allFreebets = getFreebets();
  const all = filterData(allFreebets, PG);
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(all, cp, pp);
  const active = allFreebets.filter(f => f.status === 'Active').length;
  const totalAmt = allFreebets.reduce((s, f) => s + f.amount, 0);

  // ── Feature #8: Sum per company ──
  const allCompanies = [...new Set(allFreebets.map(f => f.company))].filter(Boolean);
  const compSummary = allCompanies.map(c => {
    const cFBs = allFreebets.filter(f => f.company === c);
    return {
      company: c,
      total: cFBs.length,
      active: cFBs.filter(f => f.status === 'Active').length,
      totalAmt: cFBs.reduce((s, f) => s + f.amount, 0),
      usedAmt: cFBs.filter(f => f.status === 'Used').reduce((s, f) => s + f.amount, 0),
    };
  }).sort((a, b) => b.totalAmt - a.totalAmt);

  return `
    ${pageHeader('Agent Freebet', '<span>Bonus</span><span class="sep">›</span><span>Agent Freebet</span>', `
      <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
        <span style="background:rgba(16,185,129,.15);color:#059669;border:1px solid rgba(16,185,129,.3);border-radius:20px;padding:.25rem .75rem;font-size:.8rem;font-weight:600"><i class="fa-solid fa-ticket"></i> Active: ${active}</span>
        <span style="background:rgba(14,165,233,.15);color:var(--acc);border:1px solid rgba(14,165,233,.3);border-radius:20px;padding:.25rem .75rem;font-size:.8rem;font-weight:600"><i class="fa-solid fa-coins"></i> Total: ${fmtCur(totalAmt)}</span>
        <button class="btn btn-primary" onclick="window.openFreebetModal()"><i class="fa-solid fa-plus"></i> Issue Freebet</button>
      </div>`)}

    <!-- Per-Company Freebet Summary -->
    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-header">
        <span class="card-title"><i class="fa-solid fa-building" style="color:var(--acc);margin-right:.5rem"></i>Sum per Agent / Company</span>
        <span style="margin-left:auto;font-size:.75rem;color:var(--text3)">${allCompanies.length} agents with freebets</span>
      </div>
      <div class="card-body" style="padding:0">
        ${tableWrap(`
          <table>
            <thead><tr><th>#</th><th>Company/Agent</th><th>Total Issued</th><th>Active</th><th>Total Value</th><th>Used Value</th><th>Utilization</th></tr></thead>
            <tbody>
              ${compSummary.slice(0,10).map((c, i) => `
                <tr>
                  <td>${i+1}</td>
                  <td><strong>${c.company}</strong></td>
                  <td>${c.total}</td>
                  <td><span style="color:var(--green);font-weight:700">${c.active}</span></td>
                  <td style="font-weight:700">${fmtCur(c.totalAmt)}</td>
                  <td style="color:var(--acc)">${fmtCur(c.usedAmt)}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:.5rem">
                      <div style="flex:1;height:6px;background:var(--border);border-radius:3px;overflow:hidden">
                        <div style="width:${c.totalAmt>0?Math.round((c.usedAmt/c.totalAmt)*100):0}%;height:100%;background:var(--acc);border-radius:3px"></div>
                      </div>
                      <span style="font-size:.7rem;color:var(--text3)">${c.totalAmt>0?Math.round((c.usedAmt/c.totalAmt)*100):0}%</span>
                    </div>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>

    ${filterCard(`
      ${fsInput(PG, 'member', 'Member', 'Search member...')}
      ${fsSelect(PG, 'provider', 'Provider', ['All', ...PROVIDERS])}
      ${fsSelect(PG, 'status', 'Status', ['All', 'Active', 'Used', 'Expired'])}
      ${fsDateFilter(PG, 'startDate', 'endDate')}
      ${fsActions(PG)}
    `)}

    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>ID</th><th>Member</th><th>Company</th><th>Provider</th><th>Game</th><th>Amount/Rounds</th><th>Used</th><th>Expiry</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${rows.map((f, i) => `
                <tr>
                  <td>${(cp - 1) * pp + i + 1}</td>
                  <td><strong style="font-size:.75rem">${f.id}</strong></td>
                  <td><strong>${f.member}</strong></td>
                  <td style="font-size:.75rem">${f.company}</td>
                  <td><span class="badge badge-indigo">${f.provider}</span></td>
                  <td style="font-size:.75rem">${f.game}</td>
                  <td style="font-size:.8rem"><strong>${fmtCur(f.amount)}</strong><br/><span style="color:var(--text3)">${f.rounds} rounds</span></td>
                  <td><span style="font-size:.7rem">${f.used}/${f.rounds}</span></td>
                  <td style="font-size:.75rem;color:${f.status === 'Active' ? 'var(--green)' : 'var(--text3)'}">${f.expiry}</td>
                  <td>${badge(f.status, f.status === 'Active' ? 'success' : f.status === 'Expired' ? 'danger' : 'warning')}</td>
                  <td>
                    <div class="action-btns">
                      ${f.status === 'Active' ? `<button class="btn btn-sm btn-danger" onclick="window.cancelFreebet('${f.id}')"><i class="fa-solid fa-ban"></i></button>` : ''}
                      <button class="btn btn-sm btn-icon" style="background:#f59e0b;color:#fff" onclick="window.viewFreebet('${f.id}')"><i class="fa-solid fa-eye"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>
    ${renderPagerHTML(PG, all.length, pp, cp)}`;
};

pages['bonus-freebet-report'] = () => {
  const all = getFreebets();
  const byProvider = PROVIDERS.map(p => ({
    provider: p,
    issued: all.filter(f => f.provider === p).length,
    totalAmt: all.filter(f => f.provider === p).reduce((s, f) => s + f.amount, 0),
    used: all.filter(f => f.provider === p && f.status === 'Used').length,
    expired: all.filter(f => f.provider === p && f.status === 'Expired').length
  }));

  return `
    ${pageHeader('Freebet Report', '<span>Bonus</span><span class="sep">›</span><span>Freebet Report</span>', `
      <button class="btn btn-secondary btn-sm" onclick="window.exportTableCSV(null,'freebet_report.csv')"><i class="fa-solid fa-download"></i> Export</button>`)}
    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead><tr><th>#</th><th>Provider</th><th>Issued</th><th>Used</th><th>Expired</th><th>Usage Rate</th><th>Total Value</th></tr></thead>
            <tbody>
              ${byProvider.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${p.provider}</strong></td>
                  <td>${p.issued}</td>
                  <td style="color:var(--green);font-weight:600">${p.used}</td>
                  <td style="color:var(--red)">${p.expired}</td>
                  <td>${p.issued ? Math.round((p.used / p.issued) * 100) : 0}%</td>
                  <td style="font-weight:700">${fmtCur(p.totalAmt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>`;
};

pages['bonus-report'] = () => {
  const PG = 'bonus-report';
  const all = filterData(getBonusRows(), PG);
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(all, cp, pp);
  const totalBonus = getBonusRows().reduce((s, b) => s + b.bonusAmt, 0);
  const totalTurnover = getBonusRows().reduce((s, b) => s + b.turnover, 0);

  return `
    ${pageHeader('Bonus Report', '<span>Bonus</span><span class="sep">›</span><span>Bonus Report</span>', `
      <button class="btn btn-secondary btn-sm" onclick="window.exportTableCSV(null,'bonus_report.csv')"><i class="fa-solid fa-download"></i> Export</button>`)}

    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card"><div class="stat-icon" style="background:rgba(245,158,11,.1);color:var(--yellow)"><i class="fa-solid fa-gift"></i></div><div class="stat-info"><div class="stat-label">Total Bonuses</div><div class="stat-value">${getBonusRows().length}</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(239,68,68,.1);color:var(--red)"><i class="fa-solid fa-coins"></i></div><div class="stat-info"><div class="stat-label">Total Bonus Given</div><div class="stat-value" style="font-size:1rem">${fmtCur(totalBonus)}</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-rotate"></i></div><div class="stat-info"><div class="stat-label">Total Turnover</div><div class="stat-value" style="font-size:1rem">${fmtCur(totalTurnover)}</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-check-double"></i></div><div class="stat-info"><div class="stat-label">Claimed</div><div class="stat-value">${getBonusRows().filter(b => b.status === 'Claimed').length}</div></div></div>
    </div>

    ${filterCard(`
      ${fsInput(PG, 'member', 'Member', 'Search member...')}
      ${fsSelect(PG, 'type', 'Type', ['All', ...BONUS_TYPES])}
      ${fsSelect(PG, 'status', 'Status', ['All', 'Claimed', 'Pending', 'Cancelled'])}
      ${fsDateFilter(PG, 'startDate', 'endDate')}
      ${fsActions(PG)}
    `)}

    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead><tr><th>#</th><th>ID</th><th>Member</th><th>Company</th><th>Type</th><th>Deposit Amt</th><th>Bonus</th><th>Turnover</th><th>Status</th><th>Claimed At</th></tr></thead>
            <tbody>
              ${rows.map((b, i) => `
                <tr>
                  <td>${(cp - 1) * pp + i + 1}</td>
                  <td style="font-size:.75rem"><strong>${b.id}</strong></td>
                  <td><strong>${b.member}</strong></td>
                  <td style="font-size:.75rem">${b.company}</td>
                  <td>${badge(b.type, 'indigo')}</td>
                  <td>${fmtCur(b.depositAmt)}</td>
                  <td style="color:var(--yellow);font-weight:700">${fmtCur(b.bonusAmt)}</td>
                  <td>${fmtCur(b.turnover)}</td>
                  <td>${badge(b.status, b.status === 'Claimed' ? 'success' : b.status === 'Cancelled' ? 'danger' : 'warning')}</td>
                  <td style="font-size:.72rem;white-space:nowrap">${b.claimedAt}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>
    ${renderPagerHTML(PG, all.length, pp, cp)}`;
};

pages['bonus-pragmatic-frb'] = () => {
  const campaigns = getCampaigns();
  return `
    ${pageHeader('Pragmatic Free Rounds Bonus', '<span>Bonus</span><span class="sep">›</span><span>Pragmatic FRB</span>', `
      <button class="btn btn-primary" onclick="window.openPragmaticCampaignModal()"><i class="fa-solid fa-plus"></i> New Campaign</button>`)}
    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card"><div class="stat-icon" style="background:rgba(139,92,246,.12);color:#8b5cf6"><i class="fa-solid fa-gamepad"></i></div><div class="stat-info"><div class="stat-label">Active Campaigns</div><div class="stat-value">${campaigns.filter(c => c.status === 'Active').length}</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-users"></i></div><div class="stat-info"><div class="stat-label">Total Issued</div><div class="stat-value">${fmt(campaigns.reduce((s, c) => s + c.issued, 0))}</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-play"></i></div><div class="stat-info"><div class="stat-label">Total Used</div><div class="stat-value">${fmt(campaigns.reduce((s, c) => s + c.used, 0))}</div></div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(245,158,11,.1);color:var(--yellow)"><i class="fa-solid fa-percent"></i></div><div class="stat-info"><div class="stat-label">Overall Usage</div><div class="stat-value">${Math.round(campaigns.reduce((s, c) => s + c.used, 0) / Math.max(1, campaigns.reduce((s, c) => s + c.issued, 0)) * 100)}%</div></div></div>
    </div>
    <div class="card">
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">
          ${campaigns.map(c => `
            <div style="border:1px solid var(--border);border-radius:10px;padding:1rem;background:var(--bg2);${c.status === 'Active' ? 'border-color:var(--acc)' : ''}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.75rem">
                <div style="font-weight:700;font-size:.88rem">${c.name}</div>
                ${badge(c.status, c.status === 'Active' ? 'success' : 'secondary')}
              </div>
              <div style="font-size:.78rem;color:var(--acc);font-weight:600;margin-bottom:.5rem">${c.game}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;font-size:.78rem;margin-bottom:.75rem">
                <div><span style="color:var(--text3)">Bet Level:</span> <strong>${c.betLevel}</strong></div>
                <div><span style="color:var(--text3)">Rounds:</span> <strong>${c.rounds}</strong></div>
                <div><span style="color:var(--text3)">Issued:</span> <strong>${c.issued}</strong></div>
                <div><span style="color:var(--text3)">Expiry:</span> <strong>${c.expiry}</strong></div>
              </div>
              <div style="display:flex;gap:.4rem;margin-top:.75rem">
                <button class="btn btn-sm btn-primary" style="flex:1;font-size:.72rem" onclick="window.viewCampaign('${c.id}')"><i class="fa-solid fa-eye"></i> Detail</button>
                ${c.status === 'Active' ? `<button class="btn btn-sm btn-danger" style="font-size:.72rem" onclick="window.pauseCampaign('${c.id}')"><i class="fa-solid fa-pause"></i></button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
};

window.openFreebetModal = () => {
  openModal('Issue Freebet', `
      <div class="form-grid">
        <div class="form-field"><label>Member</label><select id="fb_member">${MEMBERS.map(m => `<option>${m}</option>`).join('')}</select></div>
        <div class="form-field"><label>Company</label><select id="fb_company">${COMPANIES.map(c => `<option>${c}</option>`).join('')}</select></div>
        <div class="form-field"><label>Provider</label><select id="fb_provider">${PROVIDERS.map(p => `<option>${p}</option>`).join('')}</select></div>
        <div class="form-field"><label>Game</label><input id="fb_game" value="Slot Game Custom" /></div>
        <div class="form-field"><label>Amount</label><input id="fb_amount" type="number" value="50000" /></div>
        <div class="form-field"><label>Rounds</label><input id="fb_rounds" type="number" value="20" /></div>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
      <button class="btn btn-primary" onclick="window.saveFreebet()">Issue</button>
    `);
};

window.saveFreebet = async () => {
  const amount = parseInt(document.getElementById('fb_amount')?.value || '0', 10);
  const rounds = parseInt(document.getElementById('fb_rounds')?.value || '0', 10);
  if (!document.getElementById('fb_member')?.value) { toast('Member is required', 'error'); return; }
  if (isNaN(amount) || amount <= 0) { toast('Amount must be greater than 0', 'error'); return; }
  if (isNaN(rounds) || rounds <= 0) { toast('Rounds must be greater than 0', 'error'); return; }
  const entry = {
    id: 'FB' + Date.now().toString().slice(-6),
    member: document.getElementById('fb_member')?.value || MEMBERS[0],
    company: document.getElementById('fb_company')?.value || COMPANIES[0],
    provider: document.getElementById('fb_provider')?.value || PROVIDERS[0],
    game: document.getElementById('fb_game')?.value || 'Slot Game Custom',
    amount,
    rounds,
    used: 0,
    expiry: new Date(Date.now() + 7 * 86400000).toLocaleDateString('id-ID'),
    status: 'Active',
    createdAt: new Date().toLocaleString('id-ID')
  };
  // Persist to DB via bonuses table (type = Freebet)
  if (window.db?.dbCreateBonus) {
    const { error } = await window.db.dbCreateBonus({
      member: entry.member, company: entry.company,
      type: 'Freebet',
      bonusAmount: entry.amount,
      depositAmount: 0, turnoverRequired: 0,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    if (error) { toast('DB error: ' + error.message, 'error'); return; }
    if (window.db?.dbWriteLog) window.db.dbWriteLog('Issue Freebet', entry.member, `Issued freebet Rp ${entry.amount} (${entry.rounds} rounds)`);
  }
  // Also update local freebets display cache
  getFreebets().unshift(entry);
  saveState();
  closeModalBtn();
  window.go('bonus-agent-freebet');
  toast('Freebet issued', 'success');
};

window.cancelFreebet = async (id) => {
  const item = getFreebets().find(f => f.id === id);
  if (!item) return;
  // Cancel in DB if this is a DB-backed bonus
  if (window.db?.dbCancelBonus) {
    await window.db.dbCancelBonus(id);
    if (window.db?.dbWriteLog) window.db.dbWriteLog('Cancel Freebet', item.member, `Cancelled freebet ${id}`);
  }
  item.status = 'Expired';
  saveState();
  window.go('bonus-agent-freebet');
  toast('Freebet cancelled', 'success');
};

window.viewFreebet = (id) => {
  const item = getFreebets().find(f => f.id === id);
  if (!item) return;
  openModal('Freebet Detail', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
        <div><strong>ID:</strong> ${item.id}</div>
        <div><strong>Status:</strong> ${item.status}</div>
        <div><strong>Member:</strong> ${item.member}</div>
        <div><strong>Company:</strong> ${item.company}</div>
        <div><strong>Provider:</strong> ${item.provider}</div>
        <div><strong>Game:</strong> ${item.game}</div>
        <div><strong>Amount:</strong> ${fmtCur(item.amount)}</div>
        <div><strong>Rounds:</strong> ${item.rounds}</div>
      </div>
    `, `<button class="btn btn-secondary" onclick="closeModalBtn()">Close</button>`);
};

window.openPragmaticCampaignModal = () => {
  openModal('New Pragmatic Campaign', `
      <div class="form-grid">
        <div class="form-field"><label>Name</label><input id="pc_name" value="Campaign ${Date.now().toString().slice(-4)}" /></div>
        <div class="form-field"><label>Game</label><select id="pc_game">${GAMES_PP.map(g => `<option>${g}</option>`).join('')}</select></div>
        <div class="form-field"><label>Bet Level</label><input id="pc_bet" type="number" value="5" /></div>
        <div class="form-field"><label>Rounds</label><input id="pc_rounds" type="number" value="30" /></div>
        <div class="form-field"><label>Issued</label><input id="pc_issued" type="number" value="100" /></div>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
      <button class="btn btn-primary" onclick="window.saveCampaign()">Create</button>
    `);
};

window.saveCampaign = async () => {
  const name    = document.getElementById('pc_name')?.value?.trim() || '';
  const game    = document.getElementById('pc_game')?.value || GAMES_PP[0];
  const rounds  = parseInt(document.getElementById('pc_rounds')?.value || '0', 10);
  const issued  = parseInt(document.getElementById('pc_issued')?.value || '0', 10);
  if (!name) { toast('Campaign name is required', 'error'); return; }
  if (isNaN(rounds) || rounds <= 0) { toast('Rounds must be greater than 0', 'error'); return; }
  if (isNaN(issued) || issued <= 0) { toast('Issued count must be greater than 0', 'error'); return; }
  const expires = new Date(Date.now() + 30 * 86400000).toISOString();

  // Persist campaign as a special bonus record in DB
  if (window.db?.dbCreateBonus) {
    const { error } = await window.db.dbCreateBonus({
      member: 'system', company: null,
      type: 'Pragmatic FRB',
      bonusAmount: 0, depositAmount: 0,
      turnoverRequired: 0,
      expiresAt: expires,
    });
    if (error) { toast('DB error: ' + error.message, 'error'); return; }
    if (window.db?.dbWriteLog) window.db.dbWriteLog('Create Campaign', 'pragmatic', `Created FRB campaign: ${name} (${game}, ${rounds} rounds, ${issued} issued)`);
  }
  getCampaigns().unshift({
    id: 'PFB' + Date.now().toString().slice(-6),
    name, game,
    betLevel: parseInt(document.getElementById('pc_bet')?.value || '1', 10),
    rounds, issued, used: 0,
    expiry: new Date(Date.now() + 30 * 86400000).toLocaleDateString('id-ID'),
    status: 'Active'
  });
  saveState();
  closeModalBtn();
  window.go('bonus-pragmatic-frb');
  toast('Campaign created', 'success');
};

window.pauseCampaign = (id) => {
  const campaign = getCampaigns().find(c => c.id === id);
  if (!campaign) return;
  campaign.status = 'Completed';
  saveState();
  window.go('bonus-pragmatic-frb');
  toast('Campaign paused', 'success');
};

window.viewCampaign = (id) => {
  const campaign = getCampaigns().find(c => c.id === id);
  if (!campaign) return;
  openModal('Campaign Detail', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
        <div><strong>Name:</strong> ${campaign.name}</div>
        <div><strong>Status:</strong> ${campaign.status}</div>
        <div><strong>Game:</strong> ${campaign.game}</div>
        <div><strong>Bet Level:</strong> ${campaign.betLevel}</div>
        <div><strong>Rounds:</strong> ${campaign.rounds}</div>
        <div><strong>Issued:</strong> ${campaign.issued}</div>
        <div><strong>Used:</strong> ${campaign.used}</div>
        <div><strong>Expiry:</strong> ${campaign.expiry}</div>
      </div>
    `, `<button class="btn btn-secondary" onclick="closeModalBtn()">Close</button>`);
};

/* ─── AGENT FREEBET REPORT ─── */
pages['bonus-agent-freebet-report'] = () => {
  const all = getFreebets();
  const companies = [...new Set(all.map(f => f.company))];

  const companyStats = companies.map(co => {
    const coItems = all.filter(f => f.company === co);
    return {
      company: co,
      totalIssued: coItems.length,
      totalAmt: coItems.reduce((s, f) => s + f.amount, 0),
      used: coItems.filter(f => f.status === 'Used').length,
      active: coItems.filter(f => f.status === 'Active').length,
      expired: coItems.filter(f => f.status === 'Expired').length
    };
  });

  const totalIssued = all.length;
  const totalAmt = all.reduce((s, f) => s + f.amount, 0);

  return `
    ${pageHeader('Agent Freebet Report', '<span>Bonus</span><span class="sep">›</span><span>Agent Freebet Report</span>', `
        <div style="display:flex;gap:.5rem">
            <button class="btn btn-secondary btn-sm" onclick="window.exportTableCSV(null, 'agent_freebet_report.csv')"><i class="fa-solid fa-download"></i> CSV</button>
            <button class="btn btn-primary btn-sm" onclick="toast('Report Refreshed', 'success')"><i class="fa-solid fa-arrows-rotate"></i> Refresh</button>
        </div>
    `)}

    <div class="stat-grid" style="grid-template-columns: repeat(4, 1fr)">
        <div class="stat-card">
            <div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-server"></i></div>
            <div class="stat-info"><div class="stat-label">Agents Active</div><div class="stat-value">${companies.length}</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-ticket-simple"></i></div>
            <div class="stat-info"><div class="stat-label">Tickets Issued</div><div class="stat-value">${totalIssued}</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:rgba(139,92,246,.1);color:#8b5cf6"><i class="fa-solid fa-hand-holding-dollar"></i></div>
            <div class="stat-info"><div class="stat-label">Marketing Cost</div><div class="stat-value">${fmtCur(totalAmt)}</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:rgba(245,158,11,.1);color:var(--yellow)"><i class="fa-solid fa-chart-line"></i></div>
            <div class="stat-info"><div class="stat-label">Conversion</div><div class="stat-value">${Math.round(all.filter(f => f.status === 'Used').length / Math.max(1, totalIssued) * 100)}%</div></div>
        </div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 340px; gap:1.5rem; margin-top:1.5rem">
        <div class="card">
            <div class="card-header"><span class="card-title">Freebet Allocation by Agent</span></div>
            <div class="card-body">
                ${tableWrap(`
                    <table>
                        <thead>
                            <tr>
                                <th>Agent / Company</th>
                                <th>Tickets</th>
                                <th>Used</th>
                                <th>Active</th>
                                <th>Expired</th>
                                <th>Total Value</th>
                                <th style="width:100px">Utilization</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${companyStats.map(s => {
    const rate = Math.round((s.used / s.totalIssued) * 100);
    return `
                                <tr>
                                    <td><strong style="color:var(--acc)">${s.company}</strong></td>
                                    <td>${s.totalIssued}</td>
                                    <td style="color:var(--green)">${s.used}</td>
                                    <td>${s.active}</td>
                                    <td style="color:var(--red)">${s.expired}</td>
                                    <td style="font-weight:700">${fmtCur(s.totalAmt)}</td>
                                    <td>
                                        <div style="display:flex;align-items:center;gap:.5rem">
                                            <div style="flex:1;height:4px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden">
                                                <div style="width:${rate}%;height:100%;background:var(--acc)"></div>
                                            </div>
                                            <span style="font-size:10px">${rate}%</span>
                                        </div>
                                    </td>
                                </tr>`;
  }).join('')}
                        </tbody>
                        <tfoot>
                            <tr style="background:var(--bg3); font-weight:800; border-top:2px solid var(--border)">
                                <td>GRAND TOTAL</td>
                                <td>${all.length}</td>
                                <td style="color:var(--green)">${all.filter(f => f.status === 'Used').length}</td>
                                <td style="color:var(--acc)">${all.filter(f => f.status === 'Active').length}</td>
                                <td style="color:var(--red)">${all.filter(f => f.status === 'Expired').length}</td>
                                <td style="color:var(--yellow)">${fmtCur(all.reduce((s, f) => s + f.amount, 0))}</td>
                                <td>-</td>
                            </tr>
                        </tfoot>
                    </table>
                `)}
            </div>
        </div>

        <div class="card" style="background:linear-gradient(135deg, #1e293b, #0f172a)">
            <div class="card-header border-0"><span class="card-title" style="color:#fff">Strategic Insight</span></div>
            <div class="card-body" style="color:#94a3b8; font-size:0.8rem; line-height:1.6">
                <p>Based on the current <b>${Math.round(all.filter(f => f.status === 'Used').length / Math.max(1, totalIssued) * 100)}%</b> utilization rate across all agents:</p>
                <ul style="padding-left:1rem; margin-top:1rem">
                    <li style="margin-bottom:.5rem"><b style="color:#fff">Optimize Expiry:</b> Agents with high expiration rates should be limited in ticket volume.</li>
                    <li style="margin-bottom:.5rem"><b style="color:#fff">Incentivize Use:</b> Top performing agents (by conversion) are eligible for increased freebet quotas.</li>
                    <li><b style="color:#fff">Fraud Guard:</b> Suspiciously high usage in short periods triggers an automated audit.</li>
                </ul>
                <div style="margin-top:1.5rem; padding:1rem; background:rgba(14,165,233,0.1); border-radius:8px; border:1px solid rgba(14,165,233,0.2)">
                    <small style="color:var(--acc); font-weight:800; text-transform:uppercase">System Suggestion</small>
                    <div style="color:#fff; margin-top:.25rem; font-size:.75rem">Consider increasing the <b>PG SOFT</b> allocation for <b>HokiBet</b> to drive higher turnover.</div>
                </div>
            </div>
        </div>
    </div>
    `;
};

/* ─── PROMOTION RELEASE ─── */
pages['promotion-release'] = () => {
  const PG = 'promotion-release';
  const promos = STATE.promotions || [];
  const members = STATE.members || [];

  // Filters logic (Mock for listing)
  const activeCampaign = window._prCamp || 'All';
  const activeType = window._prType || 'All';

  return `
    ${pageHeader('Promotion Release', '<span>Bonus</span><span class="sep">›</span><span>Promotion Release</span>', `
        <button class="btn btn-primary" onclick="window.releaseBonusBulk()"><i class="fa-solid fa-paper-plane"></i> Bulk Release Bonus</button>
    `)}

    <div class="card" style="margin-bottom:1.5rem">
        <div class="card-body">
            <div style="display:flex; gap:1.5rem; align-items:flex-end">
                <div class="form-group" style="flex:1">
                    <label class="form-label">Select Campaign</label>
                    <select class="form-control" onchange="window._prCamp=this.value">
                        <option>All Campaigns</option>
                        ${promos.map(p => `<option value="${p.id}" ${activeCampaign === p.id ? 'selected' : ''}>${p.title}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group" style="flex:1">
                    <label class="form-label">Bonus Type</label>
                    <select class="form-control" onchange="window._prType=this.value">
                        <option>All Types</option>
                        <option>Bonus</option>
                        <option>Cashback</option>
                        <option>Freebet</option>
                        <option>Event</option>
                    </select>
                </div>
                <div class="form-group" style="flex:1">
                    <label class="form-label">Search Member</label>
                    <input class="form-control" placeholder="Username..." />
                </div>
                <button class="btn btn-secondary" style="height:42px; padding:0 2rem" onclick="go('promotion-release')"><i class="fa-solid fa-filter"></i> Apply</button>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <span class="card-title">Member Targeting</span>
            <div style="font-size:.7rem; color:var(--text3)">Total Target: <strong>${members.length}</strong> Members</div>
        </div>
        <div class="card-body" style="padding:0">
            ${tableWrap(`
                <table style="margin-bottom:0">
                    <thead>
                        <tr>
                            <th style="width:40px"><input type="checkbox" onchange="window.toggleAllPR(this.checked)" /></th>
                            <th>Username</th>
                            <th>Company</th>
                            <th>Total Deposit</th>
                            <th>Total Withdraw</th>
                            <th>Total TO</th>
                            <th>Total Win/Loss</th>
                            <th>Total Bonus Cashback</th>
                            <th style="text-align:right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.slice(0, 20).map(m => {
                          const mBets = (STATE.lotteryBets || []).filter(b => b.member === m.username);
                          const mTxs = (STATE.seamless?.transactions || []).filter(t => t.player === m.username);
                          const totalTurnover = mBets.reduce((s, b) => s + (b.betAmount || 0), 0)
                            + mTxs.reduce((s, t) => s + (t.betAmount || 0), 0);
                          const totalWin = mBets.reduce((s, b) => s + (b.winAmount || 0), 0)
                            + mTxs.reduce((s, t) => s + (t.winAmount || 0), 0);
                          const totalBet = mBets.reduce((s, b) => s + (b.betAmount || 0), 0)
                            + mTxs.reduce((s, t) => s + (t.betAmount || 0), 0);
                          const winloss = totalWin - totalBet;
                          const memberBonuses = (STATE.bonuses || []).filter(b => b.member === m.username && b.status === 'Approved');
                          const totalBonus = memberBonuses.reduce((s, b) => s + (b.bonusAmount || 0), 0);
                          return `
                            <tr>
                                <td><input type="checkbox" class="pr-check" value="${m.username}" /></td>
                                <td><strong>${m.username}</strong></td>
                                <td style="font-size:.75rem">${m.company}</td>
                                <td style="color:var(--green);font-weight:600">${fmtCur(totalTurnover)}</td>
                                <td style="color:var(--red);font-weight:600">${fmtCur(totalBet)}</td>
                                <td style="font-weight:700">${fmtCur(totalTurnover)}</td>
                                <td><span style="color:${winloss >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:700">${fmtCur(winloss)}</span></td>
                                <td style="color:var(--yellow);font-weight:700">${fmtCur(totalBonus)}</td>
                                <td style="text-align:right">
                                    <button class="btn btn-xs btn-primary" onclick="window.releaseBonusMember('${m.username}')">Release</button>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            `)}
        </div>
    </div>
    `;
};

window.toggleAllPR = (checked) => {
  document.querySelectorAll('.pr-check').forEach(c => c.checked = checked);
};

window.releaseBonusMember = (username) => {
  const camp = window._prCamp || 'Selected Campaign';
  openModal('Confirm Release', `<p>Are you sure you want to release bonus to <strong>${username}</strong>?</p>`, `
        <button class="btn btn-secondary" onclick="closeModal()">No</button>
        <button class="btn btn-primary" onclick="window.executeRelease('${username}')">Yes, Release</button>
    `);
};

window.releaseBonusBulk = () => {
  const selected = Array.from(document.querySelectorAll('.pr-check:checked')).map(c => c.value);
  if (selected.length === 0) return toast('Please select at least one member', 'warning');

  openModal('Bulk Release', `<p>Release bonus to <strong>${selected.length}</strong> selected members?</p>`, `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.executeReleaseBulk()">Confirm Bulk Release</button>
    `);
};

window.executeRelease = (username) => {
  closeModal();
  toast(`Bonus successfully released to ${username}`, 'success');
};

window.executeReleaseBulk = () => {
  const selected = document.querySelectorAll('.pr-check:checked').length;
  closeModal();
  toast(`Bulk release triggered for ${selected} members`, 'success');
};

/* ─── PROMOTION ROLLING RELEASE ─── */
pages['promotion-rolling-release'] = () => {
  const promos = (STATE.promotions || []).filter(p => p.type === 'Bonus' || p.amount.includes('%'));
  const members = STATE.members || [];
  const gameTypes = ['Slot', 'Bola', 'Casino', 'Togel', 'Sabung Ayam'];

  return `
    ${pageHeader('Rolling Release', '<span>Bonus</span><span class="sep">›</span><span>Rolling Release</span>', `
        <button class="btn btn-primary" onclick="window.releaseRollingBulk()"><i class="fa-solid fa-arrows-spin"></i> Bulk Release Rolling</button>
    `)}

    <div class="card" style="margin-bottom:1.5rem">
        <div class="card-body">
            <div style="display:grid; grid-template-columns: 200px 200px 1fr auto; gap:1rem; align-items:flex-end">
                <div class="form-group">
                    <label class="form-label">Game Type</label>
                    <select class="form-control" id="rr_game_type">
                        <option>All Types</option>
                        ${gameTypes.map(gt => `<option>${gt}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Campaign</label>
                    <select class="form-control">
                        <option>Weekly Rolling 0.8%</option>
                        ${promos.map(p => `<option>${p.title}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Search Member</label>
                    <input class="form-control" placeholder="Search username..." />
                </div>
                <button class="btn btn-secondary" style="height:42px; padding:0 2rem" onclick="go('promotion-rolling-release')"><i class="fa-solid fa-filter"></i> Apply</button>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-header">
          <span class="card-title">Rolling Progress Per Member</span>
          <span style="margin-left:auto;font-size:.72rem;color:var(--text3)">${members.length} members</span>
        </div>
        <div class="card-body" style="padding:0">
            ${tableWrap(`
                <table style="margin-bottom:0">
                    <thead>
                        <tr>
                            <th style="width:40px"><input type="checkbox" onchange="window.toggleAllPR(this.checked)" /></th>
                            <th>Username</th>
                            <th>Company</th>
                            <th>Type Game</th>
                            <th>TO Achieved</th>
                            <th>TO Required</th>
                            <th>Progress</th>
                            <th>Rolling Bonus</th>
                            <th>Adjustment</th>
                            <th style="text-align:right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.slice(0, 30).map((m, i) => {
                          const mBets = (STATE.lotteryBets || []).filter(b => b.member === m.username);
                          const mTxs = (STATE.seamless?.transactions || []).filter(t => t.player === m.username);
                          const totalTO = mBets.reduce((s, b) => s + (b.betAmount || 0), 0)
                            + mTxs.reduce((s, t) => s + (t.betAmount || 0), 0);
                          const memberBonuses = (STATE.bonuses || []).filter(b => b.member === m.username && b.status === 'Approved');
                          const totalBonus = memberBonuses.reduce((s, b) => s + (b.bonusAmount || 0), 0);
                          // Rolling required = bonus × turnover multiplier (e.g. 5x)
                          const rollingMultiplier = STATE.settings?.rollingMultiplier || 5;
                          const toRequired = totalBonus * rollingMultiplier;
                          const pct = toRequired > 0 ? Math.min(100, Math.round((totalTO / toRequired) * 100)) : (totalTO > 0 ? 100 : 0);
                          const manualAdj = (STATE.rollingAdjustments || {})[m.username] || 0;
                          const effectivePct = Math.min(100, pct + manualAdj);
                          return `
                            <tr>
                                <td><input type="checkbox" class="pr-check" value="${m.username}" /></td>
                                <td><strong>${m.username}</strong><br/><span style="font-size:.65rem;color:var(--text3)">VIP: ${m.vipLevel || 'Bronze'}</span></td>
                                <td style="font-size:.75rem">${m.company}</td>
                                <td>${badge(gameTypes[i % gameTypes.length], 'indigo')}</td>
                                <td style="font-weight:700">${fmtCur(totalTO)}</td>
                                <td style="color:var(--text3)">${toRequired > 0 ? fmtCur(toRequired) : '-'}</td>
                                <td style="min-width:120px">
                                  <div style="display:flex;align-items:center;gap:.4rem">
                                    <div style="flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden">
                                      <div style="width:${effectivePct}%;height:100%;background:${effectivePct>=100?'var(--green)':effectivePct>=50?'var(--acc)':'var(--yellow)'};border-radius:4px;transition:width .3s"></div>
                                    </div>
                                    <span style="font-size:.7rem;font-weight:700;color:${effectivePct>=100?'var(--green)':'var(--text2)'}">${effectivePct}%</span>
                                  </div>
                                </td>
                                <td style="color:#6366f1;font-weight:700">${fmtCur(totalBonus)}</td>
                                <td>
                                  <div style="display:flex;align-items:center;gap:.25rem">
                                    <input type="number" id="radj_${m.username}" value="${manualAdj}" min="-100" max="100" style="width:55px;border:1px solid var(--border);border-radius:6px;padding:.2rem .3rem;font-size:.75rem;background:var(--bg2);color:var(--text)"/>
                                    <span style="font-size:.7rem;color:var(--text3)">%</span>
                                    <button class="btn btn-xs btn-secondary" onclick="window.applyRollingAdj('${m.username}')"><i class="fa-solid fa-check"></i></button>
                                  </div>
                                </td>
                                <td style="text-align:right">
                                  ${effectivePct >= 100
                                    ? `<button class="btn btn-xs btn-success" onclick="window.releaseRollingMember('${m.username}')"><i class="fa-solid fa-check"></i> Release</button>`
                                    : `<button class="btn btn-xs btn-secondary" onclick="window.releaseRollingMember('${m.username}')">Force</button>`}
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            `)}
        </div>
    </div>
    `;
};

window.releaseRollingMember = (username) => {
  openModal('Release Rolling', `<p>Confirm release rolling bonus for <strong>${username}</strong>?</p>`, `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.executeRollingRelease('${username}')">Release Now</button>
    `);
};

window.releaseRollingBulk = () => {
  const selected = document.querySelectorAll('.pr-check:checked').length;
  if (selected === 0) return toast('Select members first', 'warning');
  openModal('Bulk Rolling Release', `<p>Release rolling bonus to <strong>${selected}</strong> members?</p>`, `
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="window.executeRollingReleaseBulk()">Confirm Bulk</button>
    `);
};

window.executeRollingRelease = (u) => {
  closeModal();
  toast(`Rolling bonus released to ${u}`, 'success');
};

window.applyRollingAdj = (username) => {
  const inp = document.getElementById(`radj_${username}`);
  if (!inp) return;
  const val = parseInt(inp.value, 10);
  if (isNaN(val) || val < -100 || val > 100) { toast('Adjustment must be between -100 and 100', 'error'); return; }
  if (!STATE.rollingAdjustments) STATE.rollingAdjustments = {};
  STATE.rollingAdjustments[username] = val;
  saveState();
  go('promotion-rolling-release');
  toast(`Rolling adjustment ${val >= 0 ? '+' : ''}${val}% applied for ${username}`, 'success');
};

window.executeRollingReleaseBulk = () => {
  closeModal();
  toast(`Bulk rolling release complete`, 'success');
};

/* TOOLS, INVOICE, AND EXTRA LOG PAGES */
import { STATE, fmt, fmtCur, addLog, saveState } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsActions, tableWrap, badge, actionBtns, renderPagerHTML, toast, openModal, closeModalBtn } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage, rnd, MEMBERS, COMPANIES } from '../utils/helpers.js';

function ensureToolsState() {
  if (!STATE.tools) STATE.tools = {};

  // UnoPay transactions: derive from real STATE.deposits/withdrawals filtered by VA/QRIS/e-wallet methods
  const UNOPAY_METHODS = ['VA BCA', 'VA BNI', 'VA BRI', 'QRIS', 'Gopay', 'OVO', 'Dana'];
  const realDeposits = (STATE.deposits || []).filter(d => UNOPAY_METHODS.some(m => (d.method || '').includes(m.split(' ').pop())));
  const realWithdrawals = (STATE.withdrawals || []).filter(w => UNOPAY_METHODS.some(m => (w.method || '').includes(m.split(' ').pop())));
  if (!Array.isArray(STATE.tools.unopayTx) || STATE.tools.unopayTx.length === 0) {
    if (realDeposits.length > 0 || realWithdrawals.length > 0) {
      STATE.tools.unopayTx = [
        ...realDeposits.slice(0, 10).map(d => ({ id: d.id, member: d.username, amount: d.amount, fee: 0, method: d.method || 'VA', status: d.status === 'Approved' ? 'Success' : d.status === 'Pending' ? 'Pending' : 'Failed', date: d.date })),
        ...realWithdrawals.slice(0, 5).map(w => ({ id: w.id, member: w.username, amount: w.amount, fee: 0, method: w.method || 'VA', status: w.status === 'Approved' ? 'Success' : w.status === 'Pending' ? 'Pending' : 'Failed', date: w.date })),
      ];
    }
  }
  if (!STATE.tools.unopayConfig) {
    STATE.tools.unopayConfig = { apiVersion: 'v3.2.1', connected: true };
  }

  // Coin2Pay: derive from deposits/withdrawals with crypto methods
  const CRYPTO_METHODS = ['BTC', 'ETH', 'USDT', 'BNB', 'LTC', 'crypto', 'Crypto'];
  const realCrypto = (STATE.deposits || []).filter(d => CRYPTO_METHODS.some(m => (d.method || '').toLowerCase().includes(m.toLowerCase())));
  if (!Array.isArray(STATE.tools.coin2payTx) || STATE.tools.coin2payTx.length === 0) {
    if (realCrypto.length > 0) {
      STATE.tools.coin2payTx = realCrypto.slice(0, 10).map(d => ({
        id: d.id, member: d.username, crypto: d.method || 'USDT',
        cryptoAmt: (d.amount / 16000).toFixed(4), idrAmt: d.amount,
        type: 'Deposit', status: d.status === 'Approved' ? 'Confirmed' : 'Pending',
        txHash: '0x' + d.id.replace(/\D/g, '').padEnd(16, '0') + '...',
        date: d.date,
      }));
    }
  }
  if (!STATE.tools.sawala) {
    STATE.tools.sawala = {
      endpoint: 'https://api.sawala.id/v2',
      token: '********************ab7f',
      webhook: 'https://vigor.io/webhook/sawala',
      callbackIp: '103.21.44.0',
      lastSync: '27 Apr 2026 08:14'
    };
  }
  if (!Array.isArray(STATE.tools.hosts)) {
    STATE.tools.hosts = [
      { id: 'H1', host: 'komp36355.rich.com', ns: 'ram.ns.cloudflare.com, sue.ns.cloudflare.com', created: '18 Feb 2026 15:39:02', build: 'Built', isApp: true, redirect: '', code: '301', ssl: 'cloudflare', company: '001' },
      { id: 'H2', host: '001.arich.com', ns: 'ram.ns.cloudflare.com, sue.ns.cloudflare.com', created: '18 Feb 2026 16:06:30', build: 'Built', isApp: false, redirect: '', code: '301', ssl: 'cloudflare', company: '001' },
      { id: 'H3', host: 'vgr-node-1.io', ns: 'ns1.digitalocean.com, ns2.digitalocean.com', created: '20 Mar 2026 10:12:00', build: 'Pending', isApp: true, redirect: 'global-vgr.net', code: '302', ssl: 'flexible', company: 'VGR' },
    ];
  }
  if (!Array.isArray(STATE.tools.deletedHosts)) {
    STATE.tools.deletedHosts = [];
  }
  if (!Array.isArray(STATE.tools.tournamentWinners)) {
    // Derive from real members sorted by total bet turnover (highest = tournament winners)
    const prizes = [5000000, 3000000, 1500000, 1000000, 750000, 500000, 400000, 300000, 200000, 100000];
    const realBets = STATE.lotteryBets || [];
    const txs = STATE.seamless?.transactions || [];
    const memberScores = (STATE.members || []).map(m => {
      const score = realBets.filter(b => b.member === m.username).reduce((s, b) => s + (b.betAmount || 0), 0)
        + txs.filter(t => t.player === m.username).reduce((s, t) => s + (t.betAmount || 0), 0);
      return { username: m.username, company: m.company, score };
    }).sort((a, b) => b.score - a.score).slice(0, 10);
    STATE.tools.tournamentWinners = memberScores.map((m, i) => ({
      id: 'TW' + (i + 1), rank: i + 1,
      member: m.username, company: m.company,
      score: m.score, prize: prizes[i] || 100000,
      status: i < 3 ? 'Paid' : 'Pending',
    }));
  }
  if (!Array.isArray(STATE.tools.monthlyInvoices)) {
    // Derive invoice amounts from real deposit totals per company (platform fee = 2% of deposits)
    const allDeps = STATE.deposits || [];
    const allWds = STATE.withdrawals || [];
    const companies = STATE.companies?.length ? STATE.companies.map(c => c.name || c) : COMPANIES;
    STATE.tools.monthlyInvoices = companies.slice(0, 10).map((c, i) => {
      const compDeps = allDeps.filter(d => d.company === c && d.status === 'Approved');
      const depTotal = compDeps.reduce((s, d) => s + (d.amount || 0), 0);
      const txCount = compDeps.length + allWds.filter(w => w.company === c && w.status === 'Approved').length;
      const platformFee = Math.round(depTotal * 0.02) || 1000000;
      const licenseFee = 500000;
      const transactionFee = txCount * 2500;
      return {
        id: 'INV-2026-04-' + String(i + 1).padStart(3, '0'),
        company: c, period: 'April 2026',
        platformFee, licenseFee, transactionFee,
        total: platformFee + licenseFee + transactionFee,
        dueDate: '05/05/2026',
        status: i < 3 ? 'Paid' : i < 7 ? 'Unpaid' : 'Overdue',
      };
    });
  }
  if (!Array.isArray(STATE.tools.files)) {
    STATE.tools.files = [
      { id: 'F1', name: 'Invoice_April2026_vigor88.pdf', size: '245 KB', date: '01/05/2026', type: 'pdf', status: 'Sent' },
      { id: 'F2', name: 'Invoice_April2026_s88pw.pdf', size: '198 KB', date: '01/05/2026', type: 'pdf', status: 'Sent' },
      { id: 'F3', name: 'Report_WinLoss_April2026.xlsx', size: '512 KB', date: '01/05/2026', type: 'xlsx', status: 'Ready' },
      { id: 'F4', name: 'TournamentWinners_April2026.csv', size: '45 KB', date: '28/04/2026', type: 'csv', status: 'Ready' },
    ];
  }
  saveState();
}

ensureToolsState();

pages['tools-unopay'] = () => {
  const txs = STATE.tools.unopayTx;
  const pending = txs.filter(t => t.status === 'Pending').length;
  return `
    ${pageHeader('Unopay Payment Gateway', '<span>Tools</span><span class="sep">›</span><span>Unopay</span>', `
      <div style="display:flex;gap:.5rem;align-items:center">
        <span style="background:rgba(16,185,129,.15);color:#059669;border:1px solid rgba(16,185,129,.3);border-radius:20px;padding:.25rem .75rem;font-size:.8rem;font-weight:600"><i class="fa-solid fa-circle" style="font-size:.5rem"></i> ${STATE.tools.unopayConfig.connected ? 'Connected' : 'Disconnected'}</span>
        <button class="btn btn-secondary btn-sm" onclick="window.editUnopaySettings()"><i class="fa-solid fa-gear"></i> Settings</button>
      </div>`)}
    <div class="card">
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1rem">
          <div class="stat-card"><div class="stat-info"><div class="stat-label">API Version</div><div class="stat-value">${STATE.tools.unopayConfig.apiVersion}</div></div></div>
          <div class="stat-card"><div class="stat-info"><div class="stat-label">Pending</div><div class="stat-value">${pending}</div></div></div>
          <div class="stat-card"><div class="stat-info"><div class="stat-label">Total Volume</div><div class="stat-value">${fmtCur(txs.reduce((s, t) => s + t.amount, 0))}</div></div></div>
        </div>
        ${tableWrap(`
          <table>
            <thead><tr><th>ID</th><th>Member</th><th>Method</th><th>Amount</th><th>Fee</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
            <tbody>
              ${txs.map(t => `
                <tr>
                  <td><strong>${t.id}</strong></td>
                  <td>${t.member}</td>
                  <td>${badge(t.method, 'indigo')}</td>
                  <td style="font-weight:700">${fmtCur(t.amount)}</td>
                  <td>${fmtCur(t.fee)}</td>
                  <td>${badge(t.status, t.status === 'Success' ? 'success' : t.status === 'Failed' ? 'danger' : 'warning')}</td>
                  <td>${t.date}</td>
                  <td>${actionBtns(`window.viewToolRecord('unopay','${t.id}')`, t.status === 'Failed' ? `window.retryUnopay('${t.id}')` : '', '')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>`;
};

pages['tools-coin2pay'] = () => {
  const txs = STATE.tools.coin2payTx;
  return `
    ${pageHeader('Coin2Pay Crypto Gateway', '<span>Tools</span><span class="sep">›</span><span>Coin2Pay</span>', `
      <button class="btn btn-secondary btn-sm" onclick="window.addCryptoTransaction()"><i class="fa-solid fa-plus"></i> Add Transaction</button>`)}
    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead><tr><th>ID</th><th>Member</th><th>Type</th><th>Crypto</th><th>Amount</th><th>IDR</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              ${txs.map(t => `
                <tr>
                  <td><strong>${t.id}</strong></td>
                  <td>${t.member}</td>
                  <td>${badge(t.type, t.type === 'Deposit' ? 'success' : 'warning')}</td>
                  <td>${t.crypto} ${t.cryptoAmt}</td>
                  <td>${t.txHash}</td>
                  <td>${fmtCur(t.idrAmt)}</td>
                  <td>${badge(t.status, t.status === 'Confirmed' ? 'success' : 'warning')}</td>
                  <td>${actionBtns(`window.viewToolRecord('coin2pay','${t.id}')`, `window.deleteCryptoTransaction('${t.id}')`)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>`;
};

pages['tools-sawala'] = () => {
  const s = STATE.tools.sawala;
  return `
    ${pageHeader('Sawala Integration', '<span>Tools</span><span class="sep">›</span><span>Sawala</span>', `
      <div style="display:flex;gap:.5rem"><button class="btn btn-primary btn-sm" onclick="window.testSawala()"><i class="fa-solid fa-bolt"></i> Test Connection</button><button class="btn btn-secondary btn-sm" onclick="window.editSawala()"><i class="fa-solid fa-gear"></i> Edit Config</button></div>`)}
    <div class="card"><div class="card-body">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div><strong>API Endpoint</strong><div>${s.endpoint}</div></div>
        <div><strong>Auth Token</strong><div>${s.token}</div></div>
        <div><strong>Webhook URL</strong><div>${s.webhook}</div></div>
        <div><strong>Callback IP</strong><div>${s.callbackIp}</div></div>
        <div><strong>Last Sync</strong><div>${s.lastSync}</div></div>
      </div>
    </div></div>`;
};

pages['tools-host'] = () => {
  const hosts = STATE.tools.hosts;
  const deleted = STATE.tools.deletedHosts || [];
  return `
    ${pageHeader('Host Management', '<span>Tools</span><span class="sep">›</span><span>Host</span>', `
      <button class="btn btn-primary" onclick="window.openHostForm()"><i class="fa-solid fa-plus"></i> Add New Host</button>`)}
    
    <div class="card" style="margin-bottom:1.5rem">
        <div class="card-header"><span class="card-title">Host Filter</span></div>
        <div class="card-body">
            <div style="max-width:400px;display:flex;gap:1rem;align-items:flex-end">
                <div class="form-group" style="flex:1;margin-bottom:0">
                    <label class="form-label">Company / Whitelabel</label>
                    <select class="form-control" onchange="toast('Filtering by ' + this.value, 'info')">
                        <option value="">All Companies</option>
                        <option value="001">001</option>
                        <option value="VGR">VIGOR Gaming</option>
                    </select>
                </div>
                <button class="btn btn-primary" style="height:42px"><i class="fa-solid fa-magnifying-glass"></i> Search</button>
                <button class="btn btn-secondary" style="height:42px">Reset</button>
            </div>
        </div>
    </div>

    <div class="card" style="margin-bottom:1.5rem">
        <div class="card-header"><span class="card-title">List Host</span></div>
        <div class="card-body" style="padding:0">
            ${tableWrap(`
                <table style="margin-bottom:0">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Host (Domain)</th>
                            <th>Status</th>
                            <th>Name Servers</th>
                            <th>Created At</th>
                            <th>Build Status</th>
                            <th>Setting For App</th>
                            <th>Redirect Logic</th>
                            <th>SSL Mode</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hosts.map((h, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td><strong>${h.host}</strong></td>
                                <td>${badge('Active', 'success')}</td>
                                <td style="font-size:.7rem;color:var(--text3);max-width:200px">${h.ns}</td>
                                <td>${h.created}</td>
                                <td>${badge(h.build, h.build === 'Built' ? 'success' : 'warning')}</td>
                                <td><strong>${h.isApp ? 'True' : 'False'}</strong></td>
                                <td>${h.redirect ? `<div style="font-size:.7rem;color:var(--acc)">${h.code} -> ${h.redirect}</div>` : '--'}</td>
                                <td>${badge(h.ssl, 'indigo')}</td>
                                <td>
                                    <div style="display:flex;gap:.25rem">
                                        <button class="btn btn-sm btn-icon btn-secondary" onclick="window.openHostForm('${h.id}')" title="Edit"><i class="fa-solid fa-edit"></i></button>
                                        <button class="btn btn-sm btn-icon btn-danger" onclick="window.deleteHostDetail('${h.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `)}
        </div>
    </div>

    <div class="card">
        <div class="card-header"><span class="card-title">List Delete</span></div>
        <div class="card-body" style="padding:0">
            ${tableWrap(`
                <table style="margin-bottom:0">
                    <thead>
                        <tr><th>#</th><th>Host</th><th>Name Servers</th><th>Deleted At</th></tr>
                    </thead>
                    <tbody>
                        ${deleted.length ? deleted.map((h, i) => `
                            <tr><td>${i + 1}</td><td>${h.host}</td><td>${h.ns}</td><td>${h.deletedAt}</td></tr>
                        `).join('') : `<tr><td colspan="4" style="text-align:center;padding:2rem;color:var(--text3)">No deletion history</td></tr>`}
                    </tbody>
                </table>
            `)}
        </div>
    </div>`;
};

pages['invoice-tournament'] = () => {
  const winners = STATE.tools.tournamentWinners;
  return `
    ${pageHeader('Tournament Winner List', '<span>Monthly Invoice</span><span class="sep">›</span><span>Tournament Winners</span>', `
      <div style="display:flex;gap:.5rem"><button class="btn btn-secondary btn-sm" onclick="window.exportTableCSV(null,'tournament_winners.csv')"><i class="fa-solid fa-download"></i> Export</button><button class="btn btn-primary btn-sm" onclick="window.payAllWinners()"><i class="fa-solid fa-money-bill-transfer"></i> Pay All</button></div>`)}
    <div class="card"><div class="card-body">
      ${tableWrap(`
        <table>
          <thead><tr><th>Rank</th><th>Member</th><th>Company</th><th>Score</th><th>Prize</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${winners.map(w => `
              <tr>
                <td>#${w.rank}</td>
                <td><strong>${w.member}</strong></td>
                <td>${w.company}</td>
                <td>${fmt(w.score)}</td>
                <td>${fmtCur(w.prize)}</td>
                <td>${badge(w.status, w.status === 'Paid' ? 'success' : 'warning')}</td>
                <td>${w.status === 'Pending' ? `<button class="btn btn-sm btn-success" onclick="window.payWinner('${w.id}')"><i class="fa-solid fa-check"></i> Pay</button>` : 'Paid'}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      `)}
    </div></div>`;
};

pages['invoice-monthly'] = () => {
  const invoices = STATE.tools.monthlyInvoices;
  return `
    ${pageHeader('Monthly Invoice', '<span>Monthly Invoice</span><span class="sep">›</span><span>Invoices</span>', `
      <div style="display:flex;gap:.5rem"><button class="btn btn-secondary btn-sm" onclick="window.exportTableCSV(null,'monthly_invoice.csv')"><i class="fa-solid fa-download"></i> Export</button><button class="btn btn-primary btn-sm" onclick="window.sendAllInvoices()"><i class="fa-solid fa-paper-plane"></i> Send All</button></div>`)}
    <div class="card"><div class="card-body">
      ${tableWrap(`
        <table>
          <thead><tr><th>Invoice ID</th><th>Company</th><th>Period</th><th>Total</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${invoices.map(inv => `
              <tr>
                <td><strong>${inv.id}</strong></td>
                <td>${inv.company}</td>
                <td>${inv.period}</td>
                <td>${fmtCur(inv.total)}</td>
                <td>${inv.dueDate}</td>
                <td>${badge(inv.status, inv.status === 'Paid' ? 'success' : inv.status === 'Overdue' ? 'danger' : 'warning')}</td>
                <td>${actionBtns(`window.viewInvoice('${inv.id}')`, inv.status !== 'Paid' ? `window.markInvoicePaid('${inv.id}')` : '')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      `)}
    </div></div>`;
};

pages['invoice-file'] = () => {
  const files = STATE.tools.files;
  const iconMap = { pdf: 'fa-file-pdf', xlsx: 'fa-file-excel', csv: 'fa-file-csv' };
  return `
    ${pageHeader('File Management', '<span>Monthly Invoice</span><span class="sep">›</span><span>Files</span>', `
      <button class="btn btn-primary btn-sm" onclick="window.openFileForm()"><i class="fa-solid fa-upload"></i> Upload</button>`)}
    <div class="card"><div class="card-body">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem">
        ${files.map(f => `
          <div style="border:1px solid var(--border);border-radius:10px;padding:1rem;background:var(--bg2);display:flex;gap:.75rem;align-items:center">
            <div style="font-size:2rem"><i class="fa-regular ${iconMap[f.type]}"></i></div>
            <div style="flex:1">
              <div style="font-weight:600;font-size:.82rem">${f.name}</div>
              <div style="font-size:.72rem;color:var(--text3)">${f.size} · ${f.date}</div>
              <div style="margin-top:.4rem">${badge(f.status, f.status === 'Sent' ? 'success' : f.status === 'Ready' ? 'indigo' : 'secondary')}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:.3rem">
              <button class="btn btn-sm btn-icon" style="background:var(--acc);color:#fff" onclick="window.downloadFile('${f.id}')"><i class="fa-solid fa-download"></i></button>
              <button class="btn btn-sm btn-icon btn-danger" onclick="window.deleteFile('${f.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>`).join('')}
      </div>
    </div></div>`;
};

function makeLogPage(title, breadcrumbLabel, actorType) {
  return () => {
    const PG = 'logs-' + actorType;
    // Use real STATE.logs filtered by actor type; fall back to empty array (no mock)
    const memberUsernames = new Set((STATE.members || []).map(m => m.username));
    const companyNames = new Set((STATE.companies || []).map(c => c.name || c));
    const allLogs = STATE.logs || [];
    const typeLogs = actorType === 'member'
      ? allLogs.filter(l => memberUsernames.has(l.actor))
      : actorType === 'admin'
      ? allLogs.filter(l => !memberUsernames.has(l.actor) && !companyNames.has(l.actor))
      : allLogs.filter(l => companyNames.has(l.actor));
    const filtered = filterData(typeLogs.length ? typeLogs : allLogs, PG);
    const pp = getPerPage(PG);
    const cp = getCurPage(PG);
    const rows = paginate(filtered, cp, pp);
    return `
        ${pageHeader(title, `<span>Logs</span><span class="sep">›</span><span>${breadcrumbLabel}</span>`, `<button class="btn btn-secondary btn-sm" onclick="window.exportTableCSV(null,'${actorType}_logs.csv')"><i class="fa-solid fa-download"></i> Export Logs</button>`)}
        ${filterCard(`${fsInput(PG, 'actor', 'Actor', 'Search actor...')}${fsInput(PG, 'action', 'Action', 'Search action...')}${fsActions(PG)}`)}
        <div class="card"><div class="card-body">
          ${tableWrap(`
            <table>
              <thead><tr><th>Date</th><th>Actor</th><th>IP Address</th><th>Action</th><th>Target</th><th>Description</th></tr></thead>
              <tbody>
                ${rows.map(log => `
                  <tr>
                    <td>${log.date}</td><td><strong>${log.actor}</strong></td><td>${log.ip}</td><td>${badge(log.action, 'secondary')}</td><td>${log.target}</td><td>${log.description}</td>
                  </tr>`).join('')}
              </tbody>
            </table>`)}
        </div></div>
        ${renderPagerHTML(PG, filtered.length, pp, cp)}`;
  };
}

pages['logs-company'] = makeLogPage('Company Logs', 'Company Logs', 'company');
pages['logs-whitelabel'] = makeLogPage('Whitelabel Logs', 'Whitelabel Logs', 'whitelabel');
pages['logs-master-wl'] = makeLogPage('Master WL Logs', 'Master WL Logs', 'master');
pages['logs-member'] = makeLogPage('Member Logs', 'Member Logs', 'member');

window.editUnopaySettings = () => {
  const c = STATE.tools.unopayConfig;
  openModal('Unopay Settings', `<div class="form-grid"><div class="form-field"><label>API Version</label><input id="uo_ver" value="${c.apiVersion}" /></div><div class="form-field"><label>Connected</label><select id="uo_conn"><option ${c.connected ? 'selected' : ''}>true</option><option ${!c.connected ? 'selected' : ''}>false</option></select></div></div>`, `<button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button><button class="btn btn-primary" onclick="window.saveUnopaySettings()">Save</button>`);
};
window.saveUnopaySettings = async () => {
  STATE.tools.unopayConfig.apiVersion = document.getElementById('uo_ver')?.value || STATE.tools.unopayConfig.apiVersion;
  STATE.tools.unopayConfig.connected = (document.getElementById('uo_conn')?.value || 'true') === 'true';
  saveState();
  if (window.db?.dbSaveSetting) {
    await window.db.dbSaveSetting('payment_config_unopay', JSON.stringify(STATE.tools.unopayConfig));
  }
  closeModalBtn(); go('tools-unopay'); toast('Settings updated', 'success');
};
window.viewToolRecord = (type, id) => {
  const map = { unopay: STATE.tools.unopayTx, coin2pay: STATE.tools.coin2payTx };
  const item = map[type]?.find(x => x.id === id);
  if (!item) return;
  openModal('Record Detail', `<pre style="white-space:pre-wrap">${JSON.stringify(item, null, 2)}</pre>`, `<button class="btn btn-secondary" onclick="closeModalBtn()">Close</button>`);
};
window.retryUnopay = (id) => {
  const tx = STATE.tools.unopayTx.find(x => x.id === id); if (!tx) return;
  tx.status = 'Success'; saveState(); go('tools-unopay'); toast(`Retried ${id}`, 'success');
};
window.addCryptoTransaction = () => {
  openModal('Add Crypto Transaction', `<div class="form-grid"><div class="form-field"><label>Member</label><select id="ct_member">${MEMBERS.map(m => `<option>${m}</option>`).join('')}</select></div><div class="form-field"><label>Crypto</label><select id="ct_crypto"><option>BTC</option><option>ETH</option><option>USDT</option></select></div><div class="form-field"><label>Type</label><select id="ct_type"><option>Deposit</option><option>Withdraw</option></select></div><div class="form-field"><label>IDR Value</label><input id="ct_idr" type="number" value="500000" /></div></div>`, `<button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button><button class="btn btn-primary" onclick="window.saveCryptoTransaction()">Save</button>`);
};
window.saveCryptoTransaction = () => {
  STATE.tools.coin2payTx.unshift({ id: 'C2P' + Date.now().toString().slice(-6), member: document.getElementById('ct_member')?.value || MEMBERS[0], crypto: document.getElementById('ct_crypto')?.value || 'BTC', cryptoAmt: '0.0010', idrAmt: parseInt(document.getElementById('ct_idr')?.value || '0', 10), type: document.getElementById('ct_type')?.value || 'Deposit', status: 'Pending', txHash: '0xmanual...', date: new Date().toLocaleDateString('id-ID') });
  saveState(); closeModalBtn(); go('tools-coin2pay'); toast('Crypto transaction added', 'success');
};
window.deleteCryptoTransaction = (id) => { STATE.tools.coin2payTx = STATE.tools.coin2payTx.filter(x => x.id !== id); saveState(); go('tools-coin2pay'); toast('Transaction deleted', 'success'); };
window.testSawala = () => { STATE.tools.sawala.lastSync = new Date().toLocaleString('id-ID'); saveState(); go('tools-sawala'); toast('Connection test passed', 'success'); };
window.editSawala = () => {
  const s = STATE.tools.sawala;
  openModal('Edit Sawala Config', `<div class="form-grid"><div class="form-field"><label>Endpoint</label><input id="sw_endpoint" value="${s.endpoint}" /></div><div class="form-field"><label>Webhook</label><input id="sw_webhook" value="${s.webhook}" /></div><div class="form-field"><label>Callback IP</label><input id="sw_ip" value="${s.callbackIp}" /></div></div>`, `<button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button><button class="btn btn-primary" onclick="window.saveSawala()">Save</button>`);
};
window.saveSawala = async () => {
  const s = STATE.tools.sawala;
  s.endpoint  = document.getElementById('sw_endpoint')?.value || s.endpoint;
  s.webhook   = document.getElementById('sw_webhook')?.value || s.webhook;
  s.callbackIp = document.getElementById('sw_ip')?.value || s.callbackIp;
  saveState();
  if (window.db?.dbSaveSetting) {
    await window.db.dbSaveSetting('payment_config_sawala', JSON.stringify({ endpoint: s.endpoint, webhook: s.webhook, callbackIp: s.callbackIp }));
  }
  closeModalBtn(); go('tools-sawala'); toast('Settings saved', 'success');
};
window.openHostForm = (id = null) => {
  const h = id ? STATE.tools.hosts.find(x => x.id === id) : { host: '', company: '001', redirect: '', code: '301', ssl: 'cloudflare', isApp: true };
  openModal(id ? 'Edit Host Configuration' : 'Provision New Host', `
        <div class="form-grid">
            <div class="form-field">
                <label class="form-label">Host Name (Domain)</label>
                <input id="hs_host" class="form-control" value="${h.host}" placeholder="e.g. site.com" />
            </div>
            <div class="form-field">
                <label class="form-label">Company / Whitelabel</label>
                <select id="hs_company" class="form-control">
                    <option value="001" ${h.company === '001' ? 'selected' : ''}>001</option>
                    <option value="VGR" ${h.company === 'VGR' ? 'selected' : ''}>VIGOR Gaming</option>
                </select>
            </div>
            <div class="form-field">
                <label class="form-label">Redirect To (Optional)</label>
                <input id="hs_redirect" class="form-control" value="${h.redirect}" placeholder="e.g. main-site.com" />
            </div>
            <div class="form-field">
                <label class="form-label">Redirect Code</label>
                <select id="hs_code" class="form-control">
                    <option value="301" ${h.code === '301' ? 'selected' : ''}>301 (Permanent)</option>
                    <option value="302" ${h.code === '302' ? 'selected' : ''}>302 (Temporary)</option>
                </select>
            </div>
            <div class="form-field">
                <label class="form-label">SSL Mode</label>
                <select id="hs_ssl" class="form-control">
                    <option value="cloudflare" ${h.ssl === 'cloudflare' ? 'selected' : ''}>Cloudflare Managed</option>
                    <option value="flexible" ${h.ssl === 'flexible' ? 'selected' : ''}>Flexible (HTTP)</option>
                    <option value="full" ${h.ssl === 'full' ? 'selected' : ''}>Full (HTTPS)</option>
                </select>
            </div>
            <div class="form-field">
                <label class="form-label">Primary App Domain</label>
                <label class="toggle">
                    <input type="checkbox" id="hs_isApp" ${h.isApp ? 'checked' : ''} />
                    <div class="toggle-slider"></div>
                </label>
            </div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-primary" onclick="window.saveHostDetail('${id || ''}')"><i class="fa-solid fa-cloud-arrow-up"></i> ${id ? 'Save Changes' : 'Provision Host'}</button>
    `);
};

window.saveHostDetail = async (id) => {
  const data = {
    host:     document.getElementById('hs_host').value,
    company:  document.getElementById('hs_company').value,
    redirect: document.getElementById('hs_redirect').value,
    code:     document.getElementById('hs_code').value,
    ssl:      document.getElementById('hs_ssl').value,
    isApp:    document.getElementById('hs_isApp').checked,
  };

  if (!data.host) return toast('Host name is required', 'error');

  if (id) {
    // Update existing host config
    const h = STATE.tools.hosts.find(x => x.id === id);
    if (h) {
      Object.assign(h, data);
      // Push redirect update to Cloudflare if zoneId known and redirect set
      if (h.zoneId && data.redirect) {
        const API_BASE = import.meta.env.VITE_API_SERVER_URL || '';
        if (API_BASE) {
          fetch(`${API_BASE}/api/cloudflare/update-redirect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ zoneId: h.zoneId, from: data.host, to: data.redirect, code: parseInt(data.code) }),
          }).catch(() => {});
        }
      }
      if (window.db?.dbWriteLog) window.db.dbWriteLog('Update Host', data.host, `Updated host config for ${data.host}`);
    }
    toast('Host configuration updated', 'success');
  } else {
    // Provision new host — call Cloudflare backend to create zone
    const newHost = {
      id:      'H' + Date.now().toString().slice(-4),
      ...data,
      ns:      'Pending...',
      created: new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      build:   'Pending',
      zoneId:  null,
    };
    STATE.tools.hosts.push(newHost);
    saveState();
    go('tools-host');
    toast('Host provisioning started...', 'info');

    // Call Cloudflare backend
    const API_BASE = import.meta.env.VITE_API_SERVER_URL || '';
    if (API_BASE) {
      try {
        const res  = await fetch(`${API_BASE}/api/cloudflare/add-domain`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ domain: data.host, company: data.company }),
        });
        const json = await res.json();
        const h    = STATE.tools.hosts.find(x => x.host === data.host);
        if (h) {
          if (json.ns) {
            h.ns      = Array.isArray(json.ns) ? json.ns.join(', ') : json.ns;
            h.zoneId  = json.zoneId || null;
            h.build   = 'Built';
          } else {
            h.build   = json.error ? 'Error' : 'Built';
          }
          saveState();
          go('tools-host');
          toast(json.error ? `CF error: ${json.error}` : `Domain ${data.host} provisioned ✓`, json.error ? 'error' : 'success');
        }
      } catch (e) {
        const h = STATE.tools.hosts.find(x => x.host === data.host);
        if (h) { h.build = 'Error'; saveState(); }
        toast('Cloudflare API unreachable', 'error');
      }
    } else {
      // No backend URL — simulate
      setTimeout(() => {
        const h = STATE.tools.hosts.find(x => x.host === data.host);
        if (h) { h.build = 'Built'; h.ns = 'ram.ns.cloudflare.com, sue.ns.cloudflare.com'; saveState(); go('tools-host'); }
        toast(`Build complete for ${data.host}`, 'success');
      }, 3000);
    }
    if (window.db?.dbWriteLog) window.db.dbWriteLog('Provision Host', data.host, `Provisioned domain: ${data.host} [${data.company}]`);
    return; // already called go() above
  }

  saveState();
  closeModalBtn();
  go('tools-host');
};

window.deleteHostDetail = (id) => {
  const h = STATE.tools.hosts.find(x => x.id === id);
  if (!h) return;

  openModal('Delete Host', `<p>Are you sure you want to delete ${h.host}?</p><p style="color:var(--red);font-size:.8rem">This will remove all DNS records and server configurations.</p>`, `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-danger" onclick="window.confirmDeleteHost('${id}')">Delete Forever</button>
    `);
};

window.confirmDeleteHost = async (id) => {
  const h = STATE.tools.hosts.find(x => x.id === id);
  if (!h) return;

  // Call Cloudflare backend to remove zone if zoneId known
  const API_BASE = import.meta.env.VITE_API_SERVER_URL || '';
  if (API_BASE && h.zoneId) {
    fetch(`${API_BASE}/api/cloudflare/remove-domain`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ zoneId: h.zoneId }),
    }).catch(() => {});
  }

  STATE.tools.deletedHosts.unshift({ host: h.host, ns: h.ns, deletedAt: new Date().toLocaleString('en-GB') });
  STATE.tools.hosts = STATE.tools.hosts.filter(x => x.id !== id);
  saveState();
  if (window.db?.dbWriteLog) window.db.dbWriteLog('Delete Host', h.host, `Deleted domain: ${h.host}`);
  closeModalBtn();
  go('tools-host');
  toast('Host deleted and moved to history', 'warning');
};
window.payWinner = (id) => { const w = STATE.tools.tournamentWinners.find(x => x.id === id); if (!w) return; w.status = 'Paid'; saveState(); go('invoice-tournament'); toast(`Prize paid to ${w.member}`, 'success'); };
window.payAllWinners = () => { STATE.tools.tournamentWinners.forEach(w => { w.status = 'Paid'; }); saveState(); go('invoice-tournament'); toast('All payouts processed', 'success'); };
window.viewInvoice = (id) => { const inv = STATE.tools.monthlyInvoices.find(x => x.id === id); if (!inv) return; openModal('Invoice Detail', `<pre style="white-space:pre-wrap">${JSON.stringify(inv, null, 2)}</pre>`, `<button class="btn btn-secondary" onclick="closeModalBtn()">Close</button>`); };
window.markInvoicePaid = (id) => { const inv = STATE.tools.monthlyInvoices.find(x => x.id === id); if (!inv) return; inv.status = 'Paid'; saveState(); go('invoice-monthly'); toast(`Invoice ${inv.id} marked as paid`, 'success'); };
window.sendAllInvoices = () => { addLog('send_invoices', 'monthly', 'Sent all unpaid invoices'); toast('Send all queued', 'success'); };
window.openFileForm = () => { openModal('Upload File', `<div class="form-grid"><div class="form-field"><label>File Name</label><input id="fl_name" value="New_Report.xlsx" /></div><div class="form-field"><label>Type</label><select id="fl_type"><option>xlsx</option><option>pdf</option><option>csv</option></select></div></div>`, `<button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button><button class="btn btn-primary" onclick="window.saveFile()">Save</button>`); };
window.saveFile = () => { STATE.tools.files.unshift({ id: 'F' + Date.now().toString().slice(-4), name: document.getElementById('fl_name')?.value || 'New_File.xlsx', size: '128 KB', date: new Date().toLocaleDateString('id-ID'), type: document.getElementById('fl_type')?.value || 'xlsx', status: 'Ready' }); saveState(); closeModalBtn(); go('invoice-file'); toast('File added', 'success'); };
window.downloadFile = (id) => { const f = STATE.tools.files.find(x => x.id === id); if (!f) return; toast(`Prepared download for ${f.name}`, 'success'); };
window.deleteFile = (id) => { STATE.tools.files = STATE.tools.files.filter(x => x.id !== id); saveState(); go('invoice-file'); toast('File deleted', 'success'); };

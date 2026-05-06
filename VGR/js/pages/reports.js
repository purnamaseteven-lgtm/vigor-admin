/* ─── REPORTS, STATISTICS & ANALYTICS PAGES ─── */
import { STATE, fmt, fmtCur, MEMBERS, COMPANIES, saveState, addLog } from '../core/state.js';
import { scopedDeposits, scopedWithdrawals, scopedMembers, scopedCompanies, getScopeSummary } from '../utils/scope.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsSelect, fsDateFilter, fsActions, tableWrap, badge, renderPagerHTML, openModal, closeModalBtn, toast } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage, rnd, makeDates, makeData, getFilter, setFilter } from '../utils/helpers.js';

const PROVIDERS_LIST = ['PRAGMATIC PLAY', 'HABANERO', 'MICROGAMING', 'EVOLUTION', 'PG SOFT', 'JOKER', 'SPADEGAMING', 'RTG', 'PLAYTECH', 'NETENT'];

const GAMES_BY_PROVIDER = {
  'PRAGMATIC PLAY': ['GATES OF OLYMPUS', 'STARLIGHT PRINCESS', 'SWEET BONANZA', 'WILD WEST GOLD'],
  'PG SOFT': ['MAHJONG WAYS 2', 'LUCKY NEKO', 'TREASURES OF AZTEC', 'WILD BANDITO'],
  'HABANERO': ['KOI GATE', 'FA CAI SHEN', 'HOT HOT FRUIT'],
  'MICROGAMING': ['THUNDERSTRUCK II', 'IMMORTAL ROMANCE', 'GAME OF THRONES'],
  'EVOLUTION': ['LIGHTNING ROULETTE', 'CRAZY TIME', 'MONOPOLY LIVE'],
  'JOKER': ['ROMA', 'DRAGON REALM', 'GOLDEN DRAGON'],
  'SPADEGAMING': ['BROTHER KINGDOM', 'ZEUS', 'FISHING WAR'],
  'RTG': ['FIRE DRAGON', 'SCUBA FISHING', 'RITCHIE VALENS'],
  'PLAYTECH': ['AGE OF THE GODS', 'BUFFALO BLITZ', 'GREAT BLUE'],
  'NETENT': ['STARBURST', 'GONZO QUEST', 'DEAD OR ALIVE 2']
};

/* ─── STATISTICS ─── */
pages['statistics'] = () => {
  const dates = makeDates(14);

  // Scoped data
  const myDeposits = scopedDeposits();
  const myWithdrawals = scopedWithdrawals();
  const myMembers = scopedMembers();
  const myCompanies = scopedCompanies();
  const scopeInfo = getScopeSummary();

  const totalDeposit = myDeposits.filter(d => d.status === 'Approved').reduce((s, d) => s + d.amount, 0);
  const totalWithdraw = myWithdrawals.filter(w => w.status === 'Approved').reduce((s, w) => s + w.amount, 0);
  const ggr = totalDeposit - totalWithdraw;
  const members = myMembers.length;
  const active = myMembers.filter(m => m.status === 'Active').length;

  // Group by company — only companies in scope
  const companyStats = myCompanies.map(c => {
    const key = c.username || c.name;
    const dep = myDeposits.filter(d => d.company === key && d.status === 'Approved').reduce((s, d) => s + d.amount, 0);
    const wd = myWithdrawals.filter(w => w.company === key && w.status === 'Approved').reduce((s, w) => s + w.amount, 0);
    const mems = myMembers.filter(m => m.company === key).length;
    return { company: key, deposit: dep, withdraw: wd, members: mems, ggr: dep - wd };
  }).filter(c => c.deposit > 0 || c.members > 0).slice(0, 15);

  return `
    ${pageHeader('Statistics', '<span>Home</span><span class="sep">›</span><span>Statistics</span>', `
      <div style="display:flex;gap:.5rem;align-items:center">
        <select class="form-control" style="width:140px" onchange="window.go('statistics')">
          <option>Last 14 Days</option><option>Last 30 Days</option><option>Last 3 Months</option>
        </select>
        <button class="btn btn-secondary btn-sm"><i class="fa-solid fa-download"></i> Export</button>
      </div>`)}

    <div class="stat-grid" style="grid-template-columns:repeat(5,1fr)">
      ${[
      ['Total Deposit', fmtCur(totalDeposit), 'fa-arrow-down-to-bracket', 'green', '+12.5%'],
      ['Total Withdraw', fmtCur(totalWithdraw), 'fa-arrow-up-from-bracket', 'red', '-3.2%'],
      ['GGR', fmtCur(ggr), 'fa-chart-line', 'acc', '+8.7%'],
      ['Total Members', fmt(members), 'fa-users', 'yellow', '+24 new'],
      ['Active Players', fmt(active), 'fa-bolt', 'purple', Math.round(active / 4) + ' online']
    ].map(([label, val, icon, color, trend]) => `
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(var(--${color}-rgb,.1);color:var(--${color})"><i class="fa-solid ${icon}"></i></div>
          <div class="stat-info">
            <div class="stat-label">${label}</div>
            <div class="stat-value" style="font-size:${val.length > 12 ? '.95rem' : '1.3rem'}">${val}</div>
            <div class="stat-trend">${trend}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
      <div class="card">
        <div class="card-header"><span class="card-title">Daily Deposit vs Withdrawal (Last 14 Days)</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="chartStatsDW"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Member Status Distribution</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="chartStatsMember"></canvas></div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
      <div class="card">
        <div class="card-header"><span class="card-title">GGR Trend (14 Days)</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="chartStatsGGR"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">New Member Registration</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="chartStatsNewMember"></canvas></div></div>
      </div>
    </div>

    <div class="card" style="margin-bottom:1.25rem">
      <div class="card-header"><span class="card-title">Bank Cashflow Analysis</span></div>
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Bank</th><th>Account Number</th><th>Type</th><th>Total In (Deposit)</th><th>Total Out (Withdraw)</th><th>Net Cashflow</th><th>Usage</th></tr>
            </thead>
            <tbody>
              ${STATE.banks.map((b, i) => {
      const totalIn = myDeposits.filter(d => d.bank === b.bank && d.status === 'Approved').reduce((s, d) => s + d.amount, 0);
      const totalOut = myWithdrawals.filter(w => w.bank === b.bank && w.status === 'Approved').reduce((s, w) => s + w.amount, 0);
      const net = totalIn - totalOut;
      const usage = Math.round((totalIn / totalDeposit) * 100) || 0;
      return `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${b.bank}</strong></td>
                    <td style="font-size:.75rem">${b.accountNumber}</td>
                    <td>${badge(b.type, 'indigo')}</td>
                    <td class="text-green" style="font-weight:700">${fmtCur(totalIn)}</td>
                    <td class="text-red" style="font-weight:700">${fmtCur(totalOut)}</td>
                    <td style="font-weight:800; color:var(--${net >= 0 ? 'green' : 'red'})">${net >= 0 ? '+' : ''}${fmtCur(net)}</td>
                    <td>
                      <div style="display:flex; align-items:center; gap:.5rem">
                         <div style="flex:1; height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden">
                           <div style="width:${usage}%; height:100%; background:var(--acc)"></div>
                         </div>
                         <span style="font-size:.7rem; min-width:25px">${usage}%</span>
                      </div>
                    </td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        `, 'bank_cashflow.csv')}
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Agent / Company Performance</span>
        ${scopeInfo ? `<span style="margin-left:.5rem;font-size:.72rem;background:var(--acc)22;color:var(--acc);padding:.2rem .6rem;border-radius:6px">${scopeInfo.roleLabel}: ${scopeInfo.company}</span>` : ''}
      </div>
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Company/Agent</th><th>Total Deposit</th><th>Total Withdraw</th><th>GGR</th><th>Members</th><th>GGR/Member</th><th>Margin</th><th>Detail</th></tr>
            </thead>
            <tbody>
              ${companyStats.map((c, i) => {
      const margin = c.deposit > 0 ? Math.round((c.ggr / c.deposit) * 100) : 0;
      return `
                  <tr>
                    <td>${i + 1}</td>
                    <td>
                      <strong>${c.company}</strong>
                      <div style="font-size:.65rem;color:var(--text3)">${c.members} members</div>
                    </td>
                    <td style="color:var(--green);font-weight:600">${fmtCur(c.deposit)}</td>
                    <td style="color:var(--red)">${fmtCur(c.withdraw)}</td>
                    <td style="color:var(--acc);font-weight:700">${fmtCur(c.ggr)}</td>
                    <td>${fmt(c.members)}</td>
                    <td style="font-size:.78rem">${c.members > 0 ? fmtCur(Math.round(c.ggr / c.members)) : '-'}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:.5rem">
                        <div style="flex:1;height:8px;background:var(--bg3);border-radius:4px">
                          <div style="width:${Math.min(100, Math.max(0, margin))}%;height:100%;background:${margin > 30 ? 'var(--green)' : margin > 15 ? 'var(--yellow)' : 'var(--red)'};border-radius:4px"></div>
                        </div>
                        <span style="font-size:.75rem;font-weight:600">${margin}%</span>
                      </div>
                    </td>
                    <td>
                      <button class="btn btn-xs btn-primary" onclick="window.showAgentStatDetail('${c.company}')">
                        <i class="fa-solid fa-chart-bar"></i> Detail
                      </button>
                    </td>
                  </tr>`;
    }).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>`;
};

// ── Feature #12: Agent Statistics Drill-down ──
window.showAgentStatDetail = (companyKey) => {
  // Use scoped base so agents can't drill into companies outside their tree
  const base = window.scope || {};
  const baseMembers = base.scopedMembers ? base.scopedMembers() : (STATE.members || []);
  const baseDeps = base.scopedDeposits ? base.scopedDeposits() : (STATE.deposits || []);
  const baseWds = base.scopedWithdrawals ? base.scopedWithdrawals() : (STATE.withdrawals || []);
  const compMembers = baseMembers.filter(m => m.company === companyKey);
  const compDeps = baseDeps.filter(d => d.company === companyKey && d.status === 'Approved');
  const compWds = baseWds.filter(w => w.company === companyKey && w.status === 'Approved');
  const totalDep = compDeps.reduce((s, d) => s + d.amount, 0);
  const totalWd = compWds.reduce((s, w) => s + w.amount, 0);
  const totalBets = (STATE.lotteryBets || []).filter(b => b.company === companyKey);
  const totalTO = totalBets.reduce((s, b) => s + (b.betAmount || 0), 0);
  const ggr = totalDep - totalWd;

  // Top players by deposit
  const memberStats = compMembers.map(m => {
    const mDep = compDeps.filter(d => d.member === m.username).reduce((s, d) => s + d.amount, 0);
    const mWd = compWds.filter(w => w.member === m.username).reduce((s, w) => s + w.amount, 0);
    const mTO = totalBets.filter(b => b.member === m.username).reduce((s, b) => s + (b.betAmount || 0), 0);
    return { username: m.username, deposit: mDep, withdraw: mWd, turnover: mTO, ggr: mDep - mWd };
  }).sort((a, b) => b.deposit - a.deposit).slice(0, 10);

  import('../ui/components.js').then(m => {
    m.openModal(`Agent Detail: ${companyKey}`, `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.75rem;margin-bottom:1.25rem">
        ${[
        ['Members', fmt(compMembers.length), 'fa-users', 'var(--acc)'],
        ['Deposit', fmtCur(totalDep), 'fa-arrow-down-to-bracket', 'var(--green)'],
        ['Withdraw', fmtCur(totalWd), 'fa-arrow-up-from-bracket', 'var(--red)'],
        ['GGR', fmtCur(ggr), 'fa-chart-line', ggr >= 0 ? 'var(--green)' : 'var(--red)'],
      ].map(([label, val, icon, color]) => `
          <div style="background:var(--bg2);border-radius:10px;padding:.75rem;text-align:center;border:1px solid var(--border)">
            <i class="fa-solid ${icon}" style="color:${color};font-size:1.1rem;margin-bottom:.4rem"></i>
            <div style="font-size:.7rem;color:var(--text3)">${label}</div>
            <div style="font-size:.95rem;font-weight:800;color:${color}">${val}</div>
          </div>`).join('')}
      </div>
      <div style="font-size:.8rem;font-weight:700;color:var(--text3);margin-bottom:.5rem;text-transform:uppercase;letter-spacing:.05em">Top Members by Deposit</div>
      <div style="max-height:260px;overflow-y:auto">
        <table style="width:100%;border-collapse:collapse;font-size:.78rem">
          <thead><tr style="background:var(--bg2)"><th style="padding:.4rem .6rem;text-align:left">Username</th><th style="padding:.4rem .6rem;text-align:right">Deposit</th><th style="padding:.4rem .6rem;text-align:right">Withdraw</th><th style="padding:.4rem .6rem;text-align:right">Turnover</th><th style="padding:.4rem .6rem;text-align:right">GGR</th></tr></thead>
          <tbody>
            ${memberStats.map(ms => `
              <tr style="border-bottom:1px solid var(--border)44">
                <td style="padding:.4rem .6rem;color:var(--acc);font-weight:600">${ms.username}</td>
                <td style="padding:.4rem .6rem;text-align:right;color:var(--green)">${fmtCur(ms.deposit)}</td>
                <td style="padding:.4rem .6rem;text-align:right;color:var(--red)">${fmtCur(ms.withdraw)}</td>
                <td style="padding:.4rem .6rem;text-align:right">${fmtCur(ms.turnover)}</td>
                <td style="padding:.4rem .6rem;text-align:right;font-weight:700;color:${ms.ggr >= 0 ? 'var(--green)' : 'var(--red)'}">${fmtCur(ms.ggr)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>`,
      `<button class="btn btn-primary" onclick="window.go('global-member-list')"><i class="fa-solid fa-users"></i> View Members</button><button class="btn btn-secondary" onclick="closeModalBtn()">Close</button>`
    );
  });
};

/* ─── PROVIDER ANALYTICS ─── */
pages['provider-analytics'] = () => {
  // Scoped: only transactions from members visible to current admin
  const _sMembers = scopedMembers();
  const _playerSet = new Set(_sMembers.map(m => m.username));
  let txs = (STATE.seamless?.transactions || []).filter(t =>
    STATE.currentAdmin.role === 'SuperAdmin' || _playerSet.has(t.player)
  );
  // Aggregate per provider from real seamless transaction data
  const providerMap = {};
  txs.forEach(tx => {
    const key = tx.provider || 'Unknown';
    if (!providerMap[key]) providerMap[key] = { name: key, bets: 0, turnover: 0, payout: 0, players: new Set(), sessions: 0 };
    const p = providerMap[key];
    p.bets++;
    p.turnover += tx.betAmount || 0;
    p.payout += tx.winAmount || 0;
    p.players.add(tx.player);
    p.sessions++;
  });
  // Include known providers even with 0 data
  PROVIDERS_LIST.forEach(name => {
    if (!providerMap[name]) providerMap[name] = { name, bets: 0, turnover: 0, payout: 0, players: new Set(), sessions: 0 };
  });
  const providerData = Object.values(providerMap).map(p => {
    const playerCount = p.players instanceof Set ? p.players.size : p.players;
    const ggr = p.turnover - p.payout;
    const rtpVal = p.turnover > 0 ? ((p.payout / p.turnover) * 100).toFixed(1) : '0.0';
    return { name: p.name, bets: p.bets, turnover: p.turnover, payout: p.payout, ggr, players: playerCount, sessions: p.sessions, rtp: rtpVal + '%' };
  });
  const totalGGR = providerData.reduce((s, p) => s + p.ggr, 0);

  return `
    ${pageHeader('Provider Analytics', '<span>Home</span><span class="sep">›</span><span>Provider Analytics</span>', `
      <div style="display:flex;gap:.5rem">
        <select class="form-control" style="width:140px"><option>April 2026</option><option>March 2026</option></select>
        <button class="btn btn-secondary btn-sm"><i class="fa-solid fa-download"></i> Export</button>
      </div>`)}

    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-puzzle-piece"></i></div>
        <div class="stat-info"><div class="stat-label">Active Providers</div><div class="stat-value">${PROVIDERS_LIST.length}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-rotate"></i></div>
        <div class="stat-info"><div class="stat-label">Total Turnover</div><div class="stat-value" style="font-size:.95rem">${fmtCur(providerData.reduce((s, p) => s + p.turnover, 0))}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,.1);color:var(--yellow)"><i class="fa-solid fa-sack-dollar"></i></div>
        <div class="stat-info"><div class="stat-label">Total GGR</div><div class="stat-value" style="font-size:.95rem">${fmtCur(totalGGR)}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(139,92,246,.12);color:#8b5cf6"><i class="fa-solid fa-users"></i></div>
        <div class="stat-info"><div class="stat-label">Total Players</div><div class="stat-value">${fmt(providerData.reduce((s, p) => s + p.players, 0))}</div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
      <div class="card">
        <div class="card-header"><span class="card-title">GGR by Provider</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="chartProviderGGR"></canvas></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Market Share</span></div>
        <div class="card-body"><div class="chart-container"><canvas id="chartProviderShare"></canvas></div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Provider Performance Table</span></div>
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Provider</th><th>Bets</th><th>Turnover</th><th>Payout</th><th>GGR</th><th>Players</th><th>Sessions</th><th>RTP</th><th>GGR Share</th></tr>
            </thead>
            <tbody>
              ${providerData.sort((a, b) => b.ggr - a.ggr).map((p, i) => {
    const share = Math.round((p.ggr / totalGGR) * 100);
    return `
                  <tr>
                    <td>${i + 1}</td>
                    <td>
                      <div style="font-weight:700">${p.name}</div>
                      ${i === 0 ? `<span class="badge badge-yellow" style="font-size:.65rem">TOP</span>` : ''}
                    </td>
                    <td>${fmt(p.bets)}</td>
                    <td>${fmtCur(p.turnover)}</td>
                    <td style="color:var(--red)">${fmtCur(p.payout)}</td>
                    <td style="color:var(--green);font-weight:700">${fmtCur(p.ggr)}</td>
                    <td>${fmt(p.players)}</td>
                    <td>${fmt(p.sessions)}</td>
                    <td style="font-size:.78rem">${p.rtp}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:.4rem">
                        <div style="width:${share * 2}px;height:8px;background:var(--acc);border-radius:4px;min-width:4px"></div>
                        <span style="font-size:.75rem;font-weight:600">${share}%</span>
                      </div>
                    </td>
                  </tr>`;
  }).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>`;
};

/* ─── AGENT DAILY REPORT ─── */
pages['report-agent-daily'] = () => {
  const PG = 'reports-agent-daily';
  const _deps = scopedDeposits();
  const _wds = scopedWithdrawals();
  const _mbrs = scopedMembers();
  const _cos = scopedCompanies();
  const commRate = parseFloat(STATE.settings?.commission_rate || STATE.settings?.commission || 5) / 100;
  const allKeys = _cos.length > 0 ? _cos.map(c => c.username || c.name) : COMPANIES.slice(0, 15);
  const rows = allKeys.map(company => {
    const deps = _deps.filter(d => d.company === company && d.status === 'Approved');
    const wds = _wds.filter(w => w.company === company && w.status === 'Approved');
    const totalDep = deps.reduce((s, d) => s + d.amount, 0);
    const totalWd = wds.reduce((s, w) => s + w.amount, 0);
    const ggr = totalDep - totalWd;
    return {
      company,
      members: _mbrs.filter(m => m.company === company).length,
      newMembers: 0,
      deposit: totalDep,
      depositCount: deps.length,
      withdraw: totalWd,
      withdrawCount: wds.length,
      ggr,
      commission: Math.max(0, Math.round(ggr * commRate)),
      date: new Date().toLocaleDateString('id-ID'),
    };
  }).filter(r => r.members > 0 || r.deposit > 0);

  return `
    ${pageHeader('Agent Daily Report', '<span>Reports</span><span class="sep">›</span><span>Daily Report</span>', `
      <div style="display:flex;gap:.5rem">
        <button class="btn btn-secondary btn-sm" onclick="window.exportTableCSV(null,'agent_daily.csv')"><i class="fa-solid fa-download"></i> Export</button>
        <button class="btn btn-primary btn-sm" onclick="window.go('reports-agent-daily')"><i class="fa-solid fa-rotate"></i> Refresh</button>
      </div>`)}

    ${filterCard(`
      ${fsSelect(PG, 'company', 'Company', ['All', ...COMPANIES.slice(0, 10)])}
      ${fsDateFilter(PG, 'startDate', 'endDate')}
      ${fsActions(PG)}
    `)}

    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-arrow-down-to-bracket"></i></div>
        <div class="stat-info"><div class="stat-label">Total Deposit</div><div class="stat-value" style="font-size:.95rem">${fmtCur(rows.reduce((s, r) => s + r.deposit, 0))}</div><div class="stat-trend">${fmt(rows.reduce((s, r) => s + r.depositCount, 0))} transactions</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,.1);color:var(--red)"><i class="fa-solid fa-arrow-up-from-bracket"></i></div>
        <div class="stat-info"><div class="stat-label">Total Withdrawal</div><div class="stat-value" style="font-size:.95rem">${fmtCur(rows.reduce((s, r) => s + r.withdraw, 0))}</div><div class="stat-trend">${fmt(rows.reduce((s, r) => s + r.withdrawCount, 0))} transactions</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,.1);color:var(--yellow)"><i class="fa-solid fa-sack-dollar"></i></div>
        <div class="stat-info"><div class="stat-label">Total GGR</div><div class="stat-value" style="font-size:.95rem">${fmtCur(rows.reduce((s, r) => s + r.ggr, 0))}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-handshake"></i></div>
        <div class="stat-info"><div class="stat-label">Commission</div><div class="stat-value" style="font-size:.95rem">${fmtCur(rows.reduce((s, r) => s + r.commission, 0))}</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Company</th><th>Members</th><th>New</th><th>Deposit</th><th>Dep. Count</th><th>Withdraw</th><th>WD Count</th><th>GGR</th><th>Commission</th></tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${r.company}</strong></td>
                  <td>${fmt(r.members)}</td>
                  <td>${r.newMembers > 0 ? `<span style="color:var(--green);font-weight:600">+${r.newMembers}</span>` : '0'}</td>
                  <td style="color:var(--green);font-weight:600">${fmtCur(r.deposit)}</td>
                  <td>${r.depositCount}</td>
                  <td style="color:var(--red)">${fmtCur(r.withdraw)}</td>
                  <td>${r.withdrawCount}</td>
                  <td style="color:var(--acc);font-weight:700">${fmtCur(r.ggr)}</td>
                  <td style="color:var(--yellow);font-weight:600">${fmtCur(r.commission)}</td>
                </tr>
              `).join('')}
              <tr style="background:var(--bg3);font-weight:700">
                <td colspan="2">TOTAL</td>
                <td>${fmt(rows.reduce((s, r) => s + r.members, 0))}</td>
                <td style="color:var(--green)">+${rows.reduce((s, r) => s + r.newMembers, 0)}</td>
                <td style="color:var(--green)">${fmtCur(rows.reduce((s, r) => s + r.deposit, 0))}</td>
                <td>${rows.reduce((s, r) => s + r.depositCount, 0)}</td>
                <td style="color:var(--red)">${fmtCur(rows.reduce((s, r) => s + r.withdraw, 0))}</td>
                <td>${rows.reduce((s, r) => s + r.withdrawCount, 0)}</td>
                <td style="color:var(--acc)">${fmtCur(rows.reduce((s, r) => s + r.ggr, 0))}</td>
                <td style="color:var(--yellow)">${fmtCur(rows.reduce((s, r) => s + r.commission, 0))}</td>
              </tr>
            </tbody>
          </table>
        `)}
      </div>
    </div>`;
};

/* ─── WIN LOSS REPORT ─── */
pages['report-winloss'] = () => {
  const PG = 'reports-winloss';
  // Scoped: filter by members visible to current admin
  const _wlMembers = scopedMembers();
  const _wlSet = new Set(_wlMembers.map(m => m.username));
  const isSuper = STATE.currentAdmin.role === 'SuperAdmin';
  const betMap = {};
  (STATE.lotteryBets || []).filter(b => isSuper || _wlSet.has(b.member)).forEach(b => {
    if (!betMap[b.member]) betMap[b.member] = { member: b.member, company: b.company, betAmt: 0, winAmt: 0, bets: 0, wins: 0 };
    betMap[b.member].betAmt += b.betAmount || 0;
    betMap[b.member].bets++;
    if (b.status === 'Won') { betMap[b.member].winAmt += b.winAmount || 0; betMap[b.member].wins++; }
  });
  (STATE.seamless?.transactions || []).filter(t => isSuper || _wlSet.has(t.player)).forEach(t => {
    const key = t.player;
    if (!betMap[key]) betMap[key] = { member: t.player, company: t.company, betAmt: 0, winAmt: 0, bets: 0, wins: 0 };
    betMap[key].betAmt += t.betAmount || 0;
    betMap[key].bets++;
    if ((t.winAmount || 0) > 0) { betMap[key].winAmt += t.winAmount; betMap[key].wins++; }
  });
  const rows = Object.values(betMap).map(r => ({ ...r, net: r.betAmt - r.winAmt })).sort((a, b) => b.betAmt - a.betAmt);

  const totalBet = rows.reduce((s, r) => s + r.betAmt, 0);
  const totalWin = rows.reduce((s, r) => s + r.winAmt, 0);

  const currentProv = getFilter(PG, 'provider');
  const gameOpts = currentProv && GAMES_BY_PROVIDER[currentProv] ? ['All', ...GAMES_BY_PROVIDER[currentProv]] : ['Select Provider First'];

  return `
    ${pageHeader('Win Loss Report', '<span>Reports</span><span class="sep">›</span><span>Win Loss</span>', `
      <div style="display:flex;gap:.5rem">
        <select class="form-control" style="width:140px"><option>April 2026</option><option>March 2026</option></select>
        <button class="btn btn-secondary btn-sm" onclick="window.exportTableCSV(null,'winloss.csv')"><i class="fa-solid fa-download"></i> Export</button>
      </div>`)}

  <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-dice"></i></div>
      <div class="stat-info"><div class="stat-label">Total Bets</div><div class="stat-value" style="font-size:.95rem">${fmtCur(totalBet)}</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(239,68,68,.1);color:var(--red)"><i class="fa-solid fa-trophy"></i></div>
      <div class="stat-info"><div class="stat-label">Total Win</div><div class="stat-value" style="font-size:.95rem">${fmtCur(totalWin)}</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-scale-balanced"></i></div>
      <div class="stat-info"><div class="stat-label">Net (House Profit)</div><div class="stat-value" style="font-size:.95rem;color:var(--green)">${fmtCur(totalBet - totalWin)}</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon" style="background:rgba(245,158,11,.1);color:var(--yellow)"><i class="fa-solid fa-percent"></i></div>
      <div class="stat-info"><div class="stat-label">House Edge</div><div class="stat-value">${Math.round(((totalBet - totalWin) / totalBet) * 100)}%</div></div>
    </div>
  </div>

    ${filterCard(`
      ${fsInput(PG, 'member', 'Member', 'Search member...')}
      ${fsSelect(PG, 'company', 'Agent', ['All', ...COMPANIES.slice(0, 10)])}
      <div class="filter-group">
        <label>Provider</label>
        <select style="width:140px" onchange="window.onProviderFilterChange(this.value)">
            <option value="All" ${currentProv === 'All' ? 'selected' : ''}>All Providers</option>
            ${PROVIDERS_LIST.map(p => `<option value="${p}" ${currentProv === p ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
      </div>
      <div class="filter-group">
        <label>Game Name</label>
        <select style="width:160px" id="filter_game_select" ${!currentProv || currentProv === 'All' ? 'disabled' : ''} onchange="window.setFilter('${PG}','game',this.value)">
            ${gameOpts.map(g => `<option value="${g}" ${getFilter(PG, 'game') === g ? 'selected' : ''}>${g}</option>`).join('')}
        </select>
      </div>
      ${fsDateFilter(PG, 'startDate', 'endDate')}
      ${fsActions(PG)}
    `)
    }

  <div class="card">
    <div class="card-body">
      ${rows.length === 0 ? `<div style="text-align:center;padding:3rem;color:var(--text3)"><i class="fa-solid fa-dice" style="font-size:2rem;margin-bottom:1rem;display:block"></i><div style="font-size:.9rem">No game transaction data yet.<br>Win/Loss report will populate once lottery bets or seamless transactions are recorded.</div></div>` :
      tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Member</th><th>Company</th><th>Total Bet</th><th>Total Win</th><th>Net</th><th>Bet Count</th><th>Win Count</th><th>Win Rate</th></tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${r.member}</strong></td>
                  <td style="font-size:.75rem">${r.company}</td>
                  <td>${fmtCur(r.betAmt)}</td>
                  <td style="color:var(--red)">${fmtCur(r.winAmt)}</td>
                  <td style="font-weight:700;color:${r.net >= 0 ? 'var(--green)' : 'var(--red)'}">
                    ${r.net >= 0 ? '' : '-'}${fmtCur(Math.abs(r.net))}
                  </td>
                  <td>${r.bets}</td>
                  <td>${r.wins}</td>
                  <td>
                    <span style="font-weight:600;color:${Math.round((r.wins / r.bets) * 100) > 50 ? 'var(--red)' : 'var(--green)'}">
                      ${Math.round((r.wins / r.bets) * 100)}%
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
    </div>
  </div>`;
};
/* ─── LIMIT CREDIT REPORT ─── */
pages['report-limit-credit'] = () => {
  // Real: use STATE.companies credit field as creditUsed
  const defaultLimit = parseFloat(STATE.settings?.default_credit_limit || 5000000000);
  const rows = (STATE.companies.length > 0 ? STATE.companies : COMPANIES.slice(0, 12).map(c => ({ username: c, credit: 0 }))).map(c => {
    const creditUsed = Math.abs(c.credit || 0);
    const creditLimit = c.maxCredit || defaultLimit;
    const percentage = creditLimit > 0 ? Math.min(100, Math.round((creditUsed / creditLimit) * 100)) : 0;
    return { company: c.username || c.name, creditLimit, creditUsed, percentage, date: new Date().toLocaleDateString('id-ID') };
  });

  return `
    ${pageHeader('Limit Credit Report', '<span>Reports</span><span class="sep">›</span><span>Limit Credit</span>', `
      <div style="display:flex;gap:.5rem">
        <button class="btn btn-secondary btn-sm" onclick="window.exportTableCSV(null,'credit_report.csv')"><i class="fa-solid fa-download"></i> Export</button>
        <button class="btn btn-secondary btn-sm" onclick="window.printReport('Limit Credit Report')"><i class="fa-solid fa-print"></i> Print</button>
      </div>`)
    }

  <div class="card">
    <div class="card-header">
      <span class="card-title">Credit Usage by Company</span>
      <div style="display:flex;gap:.5rem;align-items:center">
        <span style="display:flex;align-items:center;gap:.3rem;font-size:.78rem"><span style="width:10px;height:10px;border-radius:2px;background:var(--green);display:inline-block"></span> <50%</span>
        <span style="display:flex;align-items:center;gap:.3rem;font-size:.78rem"><span style="width:10px;height:10px;border-radius:2px;background:var(--yellow);display:inline-block"></span> 50-80%</span>
        <span style="display:flex;align-items:center;gap:.3rem;font-size:.78rem"><span style="width:10px;height:10px;border-radius:2px;background:var(--red);display:inline-block"></span> >80%</span>
      </div>
    </div>
    <div class="card-body">
      ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Company</th><th>Credit Limit</th><th>Credit Used</th><th>Remaining</th><th>Usage</th><th>Last Updated</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => {
      const color = r.percentage >= 80 ? 'var(--red)' : r.percentage >= 50 ? '#f59e0b' : 'var(--green)';
      return `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${r.company}</strong></td>
                    <td style="font-weight:600">${fmtCur(r.creditLimit)}</td>
                    <td style="color:${color};font-weight:700">${fmtCur(r.creditUsed)}</td>
                    <td>${fmtCur(r.creditLimit - r.creditUsed)}</td>
                    <td style="width:180px">
                      <div style="display:flex;align-items:center;gap:.5rem">
                        <div style="flex:1;height:10px;background:var(--bg3);border-radius:5px">
                          <div style="width:${r.percentage}%;height:100%;background:${color};border-radius:5px;transition:.3s"></div>
                        </div>
                        <span style="font-weight:700;font-size:.8rem;color:${color};min-width:36px">${r.percentage}%</span>
                      </div>
                    </td>
                    <td style="font-size:.75rem">${r.date}</td>
                    <td>
                      <button class="btn btn-sm btn-primary" onclick="window.openCreditLimitModal('${r.company}',${r.creditLimit})"><i class="fa-solid fa-pen"></i> Edit Limit</button>
                    </td>
                  </tr>`;
    }).join('')}
            </tbody>
          </table>
        `)}
    </div>
  </div>`;
};

/* ─── TOGEL LOST MONEY ─── */
pages['report-togel-lost'] = () => {
  // Real: aggregate STATE.lotteryBets by pool
  const poolMap = {};
  (STATE.lotteryBets || []).forEach(b => {
    if (!poolMap[b.pool]) poolMap[b.pool] = { pool: b.pool, totalBet: 0, totalPayout: 0, periodSet: new Set() };
    poolMap[b.pool].totalBet += b.betAmount || 0;
    if (b.status === 'Won') poolMap[b.pool].totalPayout += b.winAmount || 0;
    if (b.drawDate) poolMap[b.pool].periodSet.add(b.drawDate);
  });
  const rows = Object.values(poolMap).map(r => ({ pool: r.pool, totalBet: r.totalBet, totalPayout: r.totalPayout, net: r.totalBet - r.totalPayout, periods: r.periodSet.size }));

  // Members with highest loss (scoped)
  const _tDeps = scopedDeposits();
  const _tWds = scopedWithdrawals();
  const memberLoss = scopedMembers().slice(0, 12).map(m => {
    const dep = _tDeps.filter(d => d.member === m.username && d.status === 'Approved').reduce((s, d) => s + d.amount, 0);
    const wd = _tWds.filter(w => w.member === m.username && w.status === 'Approved').reduce((s, w) => s + w.amount, 0);
    const loss = dep - wd;
    const bets = (STATE.lotteryBets || []).filter(b => b.member === m.username);
    const topPool = bets.length > 0
      ? Object.entries(bets.reduce((acc, b) => { acc[b.pool] = (acc[b.pool] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0]?.[0]
      : '-';
    return { member: m.username, company: m.company, pool: topPool, totalBet: dep, totalLoss: Math.max(0, loss), period: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) };
  }).filter(r => r.totalLoss > 0).sort((a, b) => b.totalLoss - a.totalLoss);

  return `
    ${pageHeader('Togel Lost Money Report', '<span>Reports</span><span class="sep">›</span><span>Togel Lost</span>', `
      <div style="display:flex;gap:.5rem">
        <select class="form-control" style="width:140px"><option>April 2026</option><option>March 2026</option></select>
        <button class="btn btn-secondary btn-sm"><i class="fa-solid fa-download"></i> Export</button>
      </div>`)
    }

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
    <div class="card">
      <div class="card-header"><span class="card-title">Loss by Pool</span></div>
      <div class="card-body">
        ${tableWrap(`
            <table>
              <thead><tr><th>Pool</th><th>Total Bet</th><th>Total Payout</th><th>Net</th><th>Periods</th></tr></thead>
              <tbody>
                ${rows.map(r => `
                  <tr>
                    <td><strong>${r.pool}</strong></td>
                    <td>${fmtCur(r.totalBet)}</td>
                    <td style="color:var(--red)">${fmtCur(r.totalPayout)}</td>
                    <td style="font-weight:700;color:${r.net >= 0 ? 'var(--green)' : 'var(--red)'}">
                      ${r.net >= 0 ? '+' : ''}${fmtCur(r.net)}
                    </td>
                    <td>${r.periods}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `)}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Members with High Loss</span></div>
      <div class="card-body">
        ${tableWrap(`
            <table>
              <thead><tr><th>Member</th><th>Pool</th><th>Total Bet</th><th>Loss</th></tr></thead>
              <tbody>
                ${memberLoss.map(m => `
                  <tr>
                    <td><strong>${m.member}</strong><div style="font-size:.7rem;color:var(--text3)">${m.company}</div></td>
                    <td style="font-size:.75rem">${m.pool}</td>
                    <td>${fmtCur(m.totalBet)}</td>
                    <td style="font-weight:700;color:var(--red)">${fmtCur(m.totalLoss)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `)}
      </div>
    </div>
  </div>`;
};

/* ─── LOST MONEY REPORT ─── */
pages['report-lost-money'] = () => {
  const _deps = scopedDeposits();
  const _wds = scopedWithdrawals();
  const _mbrs = scopedMembers();
  const rows = _mbrs.map(m => {
    const totalDeposit = _deps.filter(d => d.member === m.username && d.status === 'Approved').reduce((s, d) => s + d.amount, 0);
    const totalWithdraw = _wds.filter(w => w.member === m.username && w.status === 'Approved').reduce((s, w) => s + w.amount, 0);
    const bonusUsed = (STATE.bonuses || []).filter(b => b.member === m.username && b.status === 'Claimed').reduce((s, b) => s + (b.bonusAmount || 0), 0);
    return { member: m.username, name: m.name, company: m.company, bank: m.bank, totalDeposit, totalWithdraw, bonusUsed, net: totalDeposit - totalWithdraw - bonusUsed };
  }).filter(r => r.totalDeposit > 0 || r.totalWithdraw > 0);

  return `
    ${pageHeader('Lost Money Report', '<span>Reports</span><span class="sep">›</span><span>Lost Money</span>', `
      <div style="display:flex;gap:.5rem">
        <select class="form-control" style="width:140px"><option>April 2026</option></select>
        <button class="btn btn-secondary btn-sm" onclick="window.exportTableCSV(null,'lost_money.csv')"><i class="fa-solid fa-download"></i> Export</button>
      </div>`)
    }

    <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,.1);color:var(--red)"><i class="fa-solid fa-arrow-trend-down"></i></div>
        <div class="stat-info"><div class="stat-label">Total Lost (Members)</div><div class="stat-value" style="font-size:.95rem;color:var(--red)">${fmtCur(rows.filter(r => r.net > 0).reduce((s, r) => s + r.net, 0))}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-users"></i></div>
        <div class="stat-info"><div class="stat-label">Members in Loss</div><div class="stat-value">${rows.filter(r => r.net > 0).length}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-calculator"></i></div>
        <div class="stat-info"><div class="stat-label">Avg. Loss per Member</div><div class="stat-value" style="font-size:.95rem">${fmtCur(Math.round(rows.filter(r => r.net > 0).reduce((s, r) => s + r.net, 0) / Math.max(1, rows.filter(r => r.net > 0).length)))}</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Member</th><th>Company</th><th>Bank</th><th>Total Deposit</th><th>Total Withdraw</th><th>Bonus</th><th>Net (Loss)</th></tr>
            </thead>
            <tbody>
              ${rows.sort((a, b) => b.net - a.net).map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${r.member}</strong><div style="font-size:.7rem;color:var(--text3)">${r.name}</div></td>
                  <td style="font-size:.75rem">${r.company}</td>
                  <td style="font-size:.75rem">${r.bank}</td>
                  <td style="color:var(--green);font-weight:600">${fmtCur(r.totalDeposit)}</td>
                  <td style="color:var(--red)">${fmtCur(r.totalWithdraw)}</td>
                  <td style="color:var(--yellow)">${fmtCur(r.bonusUsed)}</td>
                  <td style="font-weight:700;color:${r.net >= 0 ? 'var(--red)' : 'var(--green)'}">
                    ${r.net >= 0 ? fmtCur(r.net) : '-' + fmtCur(-r.net)}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>`;
};

/* ─── TOP TURNOVER MEMBERS ─── */
pages['report-top-turnover'] = () => {
  const _ttMembers = scopedMembers();
  const _ttSet = new Set(_ttMembers.map(m => m.username));
  const _ttSuper = STATE.currentAdmin.role === 'SuperAdmin';
  const turnoverMap = {};
  (STATE.lotteryBets || []).filter(b => _ttSuper || _ttSet.has(b.member)).forEach(b => {
    if (!turnoverMap[b.member]) turnoverMap[b.member] = { member: b.member, company: b.company, turnover: 0, bets: 0, wins: 0, netWin: 0, lastActivity: b.date || '' };
    turnoverMap[b.member].turnover += b.betAmount || 0;
    turnoverMap[b.member].bets++;
    if (b.status === 'Won') { turnoverMap[b.member].wins++; turnoverMap[b.member].netWin += b.winAmount || 0; }
    else { turnoverMap[b.member].netWin -= b.betAmount || 0; }
    if ((b.date || '') > turnoverMap[b.member].lastActivity) turnoverMap[b.member].lastActivity = b.date;
  });
  (STATE.seamless?.transactions || []).filter(t => _ttSuper || _ttSet.has(t.player)).forEach(t => {
    if (!turnoverMap[t.player]) turnoverMap[t.player] = { member: t.player, company: t.company, turnover: 0, bets: 0, wins: 0, netWin: 0, lastActivity: '' };
    turnoverMap[t.player].turnover += t.betAmount || 0;
    turnoverMap[t.player].bets++;
    turnoverMap[t.player].netWin += (t.winAmount || 0) - (t.betAmount || 0);
    if ((t.winAmount || 0) > 0) turnoverMap[t.player].wins++;
  });
  // Enrich with member info (scoped)
  const rows = Object.values(turnoverMap).map(r => {
    const m = _ttMembers.find(x => x.username === r.member);
    return { ...r, name: m?.name || r.member, rank: 0 };
  }).sort((a, b) => b.turnover - a.turnover).map((r, i) => ({ ...r, rank: i + 1 }));

  const medals = ['🥇', '🥈', '🥉'];

  return `
    ${pageHeader('Top Turnover Members', '<span>Reports</span><span class="sep">›</span><span>Top Turnover</span>', `
      <div style="display:flex;gap:.5rem">
        <select class="form-control" style="width:140px"><option>April 2026</option><option>All Time</option></select>
        <button class="btn btn-secondary btn-sm" onclick="window.exportTableCSV(null,'top_turnover.csv')"><i class="fa-solid fa-download"></i> Export</button>
      </div>`)
    }

    <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
      ${rows.slice(0, 3).map((r, i) => `
        <div class="stat-card" style="${i === 0 ? 'border:2px solid var(--yellow)' : ''}">
          <div style="font-size:2rem;text-align:center;padding:.5rem">${medals[i]}</div>
          <div class="stat-info" style="text-align:center">
            <div style="font-weight:700;font-size:1rem">${r.member}</div>
            <div style="font-size:.78rem;color:var(--text3)">${r.company}</div>
            <div style="font-size:1.1rem;font-weight:700;color:var(--acc);margin-top:.3rem">${fmtCur(r.turnover)}</div>
            <div style="font-size:.75rem;color:var(--text3)">${fmt(r.bets)} bets</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr><th>Rank</th><th>Member</th><th>Company</th><th>Turnover</th><th>Total Bets</th><th>Wins</th><th>Net Win</th><th>Last Active</th></tr>
            </thead>
            <tbody>
              ${rows.map(r => `
                <tr>
                  <td>
                    ${r.rank <= 3 ? `<span style="font-size:1.3rem">${medals[r.rank - 1]}</span>` : `<strong>#${r.rank}</strong>`}
                  </td>
                  <td><strong>${r.member}</strong><div style="font-size:.7rem;color:var(--text3)">${r.name}</div></td>
                  <td style="font-size:.75rem">${r.company}</td>
                  <td style="font-weight:700;color:var(--acc)">${fmtCur(r.turnover)}</td>
                  <td>${fmt(r.bets)}</td>
                  <td>${fmt(r.wins)}</td>
                  <td style="font-weight:600;color:${r.netWin >= 0 ? 'var(--green)' : 'var(--red)'}">
                    ${r.netWin >= 0 ? '+' : ''}${fmtCur(r.netWin)}
                  </td>
                  <td style="font-size:.75rem">${r.lastActivity}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>`;
};

/* ─── DEVICE REPORT ─── */
pages['device-report'] = () => {
  const scopedMembersArr = scopedMembers();
  const total = scopedMembersArr.length;

  const devices = [
    { platform: 'Windows', browser: 'Chrome', count: Math.round(total * 0.1), active: Math.round(total * 0.04), trend: '+5%' },
    { platform: 'macOS', browser: 'Safari', count: Math.round(total * 0.04), active: Math.round(total * 0.01), trend: '-2%' },
    { platform: 'iOS', browser: 'Mobile Safari', count: Math.round(total * 0.23), active: Math.round(total * 0.12), trend: '+18%' },
    { platform: 'Android (APK)', browser: 'App WebView', count: Math.round(total * 0.46), active: Math.round(total * 0.35), trend: '+24%' },
    { platform: 'Android (Br.)', browser: 'Chrome Mobile', count: Math.round(total * 0.17), active: Math.round(total * 0.07), trend: '+7%' },
  ];

  const platforms = ['Windows', 'macOS', 'iPhone', 'Android (APK)', 'Android (Br.)'];
  const memberDevices = scopedMembersArr.slice(0, 20).map((m, i) => {
    const plat = platforms[i % platforms.length];
    return {
      username: m.username, company: m.company,
      platform: plat,
      lastLogin: m.lastLogin || m.joined || '-',
      appVersion: plat.includes('APK') ? 'v2.4.1' : '-',
      isApp: plat.includes('APK')
    };
  });

  return `
    ${pageHeader('Device Report', '<span>Reports</span><span class="sep">›</span><span>Device Report</span>', `
        <div style="display:flex;gap:.5rem">
            <button class="btn btn-secondary btn-sm" onclick="toast('Report exported','success')"><i class="fa-solid fa-download"></i> Export</button>
            <button class="btn btn-primary btn-sm" onclick="go('reports-device')"><i class="fa-solid fa-rotate"></i> Refresh</button>
        </div>
    `)
    }

    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
        <div class="stat-card">
            <div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-mobile-screen-button"></i></div>
            <div class="stat-info"><div class="stat-label">Mobile Users</div><div class="stat-value">72%</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-download"></i></div>
            <div class="stat-info"><div class="stat-label">APK Installs</div><div class="stat-value">5,621</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:rgba(245,158,11,.1);color:var(--yellow)"><i class="fa-solid fa-desktop"></i></div>
            <div class="stat-info"><div class="stat-label">Desktop Users</div><div class="stat-value">28%</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:rgba(139,92,246,.1);color:#8b5cf6"><i class="fa-solid fa-bolt"></i></div>
            <div class="stat-info"><div class="stat-label">Active Now</div><div class="stat-value">734</div></div>
        </div>
    </div>

    <div class="card" style="margin-bottom:1.5rem">
        <div class="card-header"><span class="card-title">Platform Distribution</span></div>
        <div class="card-body">
            <div style="display:flex; gap:1.5rem; flex-wrap:wrap">
                ${devices.map(d => `
                    <div style="flex:1; min-width:200px; padding:1.25rem; background:var(--bg2); border-radius:12px; border:1px solid var(--border)">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem">
                            <div>
                                <div style="font-size:.7rem; font-weight:800; color:var(--text3); text-transform:uppercase">${d.platform}</div>
                                <div style="font-size:1.5rem; font-weight:900; margin-top:.2rem">${fmt(d.count)}</div>
                            </div>
                            <div style="font-size:.7rem; font-weight:700; color:${d.trend.startsWith('+') ? 'var(--green)' : 'var(--red)'}">${d.trend} <i class="fa-solid fa-arrow-${d.trend.startsWith('+') ? 'up' : 'down'}"></i></div>
                        </div>
                        <div style="font-size:.75rem; color:var(--text3)">Active: <strong>${d.active}</strong></div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <span class="card-title">Device Sessions & Campaign Triggers</span>
            <div style="display:flex; gap:.5rem">
                <button class="btn btn-xs btn-primary" onclick="go('crm-push')"><i class="fa-solid fa-bell"></i> CRM Push Notification</button>
            </div>
        </div>
        <div class="card-body">
            ${tableWrap(`
                <table>
                    <thead>
                        <tr>
                            <th>Member</th>
                            <th>Platform</th>
                            <th>Browser / App</th>
                            <th>Last Login</th>
                            <th>Campaign Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${memberDevices.map(m => `
                            <tr>
                                <td><strong>${m.username}</strong></td>
                                <td>${badge(m.platform, m.platform.includes('Android') ? 'green' : m.platform.includes('iPhone') ? 'acc' : 'secondary')}</td>
                                <td style="font-size:.75rem">${m.platform.includes('APK') ? '<b>VIGOR Mobile App</b> <span style="opacity:0.6">v2.4.1</span>' : 'Web Browser'}</td>
                                <td style="font-size:.72rem">${m.lastLogin}</td>
                                <td>
                                    <div style="display:flex; gap:.4rem">
                                        ${m.isApp ? `
                                            <button class="btn btn-success btn-xs" 
                                                id="btn_5k_${m.username}"
                                                onclick="window.triggerCampaign('${m.username}', 'add5k', this)"
                                                ${STATE.campaignUsage[m.username + '_add5k'] ? 'disabled style="opacity:0.5"' : ''}>
                                                <i class="fa-solid fa-gift"></i> ${STATE.campaignUsage[m.username + '_add5k'] ? '5k Added' : 'Add 5k'}
                                            </button>
                                            <button class="btn btn-primary btn-xs" 
                                                id="btn_cb_${m.username}"
                                                onclick="window.triggerCampaign('${m.username}', 'cashback30', this)"
                                                ${STATE.campaignUsage[m.username + '_cashback30'] ? 'disabled style="opacity:0.5"' : ''}>
                                                <i class="fa-solid fa-bullhorn"></i> ${STATE.campaignUsage[m.username + '_cashback30'] ? 'Cashback Sent' : '30% Cashback'}
                                            </button>
                                        ` : '<span style="color:var(--text3); font-size:.7rem; font-style:italic">No campaigns for web</span>'}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `)}
        </div>
    </div>`;
};

window.triggerCampaign = (username, type, btn) => {
  const key = username + '_' + type;
  if (STATE.campaignUsage[key]) return;

  STATE.campaignUsage[key] = true;
  const label = type === 'add5k' ? '5k Bonus' : '30% Cashback';
  toast(`${label} applied to ${username} `, 'success');

  if (btn) {
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.innerHTML = `<i class="fa-solid fa-check"></i> ${type === 'add5k' ? '5k Added' : 'Cashback Sent'}`;
  }
};

window.onProviderFilterChange = (val) => {
  const PG = 'reports-winloss';
  window.setFilter(PG, 'provider', val);
  window.setFilter(PG, 'game', 'All');
  window.go(PG);
};

// ─── Credit Limit Edit Modal ──────────────────────────────────
window.openCreditLimitModal = (company, currentLimit) => {
  openModal(`Edit Credit Limit — ${company}`, `
        <div class="form-grid">
            <div class="form-field" style="grid-column:1/-1">
                <label>Company</label>
                <input class="form-control" value="${company}" disabled />
            </div>
            <div class="form-field" style="grid-column:1/-1">
                <label>Credit Limit (Rp) <span style="color:var(--red)">*</span></label>
                <input id="cl_limit" type="number" class="form-control" value="${currentLimit}" min="0" step="1000000" />
                <div style="font-size:.72rem;color:var(--text3);margin-top:.3rem">Current: ${typeof fmtCur === 'function' ? fmtCur(currentLimit) : currentLimit}</div>
            </div>
            <div class="form-field" style="grid-column:1/-1">
                <label>Notes</label>
                <input id="cl_notes" class="form-control" placeholder="Reason for change..." />
            </div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-primary" onclick="window.saveCreditLimit('${company}')"><i class="fa-solid fa-check"></i> Save Limit</button>
    `);
};

window.saveCreditLimit = async (company) => {
  const limit = parseInt(document.getElementById('cl_limit')?.value || '0', 10);
  const notes = document.getElementById('cl_notes')?.value.trim() || '';
  if (isNaN(limit) || limit < 0) { toast('Invalid credit limit', 'error'); return; }
  if (!STATE.settings) STATE.settings = {};
  STATE.settings[`creditLimit_${company}`] = limit;
  STATE.settings.defaultCreditLimit = limit; // fallback update
  // Also update in companies array if exists
  const co = STATE.companies.find(c => (c.username || c.name) === company);
  if (co) co.creditLimit = limit;
  saveState();
  if (window.db?.dbSaveSetting) {
    await window.db.dbSaveSetting(`credit_limit_${company}`, String(limit), company);
  }
  addLog('Credit Limit', company, `Credit limit set to ${limit}${notes ? ' — ' + notes : ''}`);
  closeModalBtn();
  toast(`Credit limit for ${company} updated`, 'success');
  window.go('report-limit-credit');
};

// ─── PDF Print Export ──────────────────────────────────────────
window.printReport = (title) => {
  const content = document.getElementById('main-content')?.innerHTML || document.querySelector('.page-content')?.innerHTML || document.body.innerHTML;
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { toast('Pop-up blocked. Allow pop-ups to print.', 'warning'); return; }
  win.document.write(`<!DOCTYPE html><html><head>
        <title>${title || 'VIGOR Report'}</title>
        <style>
            @media print { @page { size: A4 landscape; margin: 10mm; } }
            body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; }
            table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
            th { background: #0f172a; color: #fff; padding: 6px 8px; text-align: left; }
            td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; }
            tr:nth-child(even) td { background: #f8fafc; }
            h2 { margin: 0 0 1rem; font-size: 16px; }
            .no-print { display: none; }
        </style>
    </head><body>
        <h2>${title || 'VIGOR Report'} — ${new Date().toLocaleDateString('id-ID')}</h2>
        ${content}
        <script>window.onload=()=>{ window.print(); window.close(); }<\/script>
    </body></html>`);
  win.document.close();
};

/* ─── PROVIDER ANALYTICS (Feature #20) ─── */
pages['provider-analytics'] = () => {
    const PG = 'provider-analytics';
    const txs = STATE.seamless?.transactions || [];
    const providers = [...new Set(txs.map(t => t.provider || 'PG_SOFT'))];

    const stats = providers.map(p => {
        const pTxs = txs.filter(t => (t.provider || 'PG_SOFT') === p);
        const bet = pTxs.reduce((s, t) => s + (t.betAmount || 0), 0);
        const win = pTxs.reduce((s, t) => s + (t.winAmount || 0), 0);
        const ggr = bet - win;
        const players = [...new Set(pTxs.map(t => t.player))].length;
        const avgBet = players > 0 ? bet / players : 0;
        const margin = bet > 0 ? (ggr / bet) * 100 : 0;
        return { provider: p, bet, win, ggr, players, avgBet, margin };
    }).sort((a, b) => b.ggr - a.ggr);

    const totalBet = stats.reduce((s, x) => s + x.bet, 0);
    const totalWin = stats.reduce((s, x) => s + x.win, 0);
    const totalGGR = totalBet - totalWin;

    return `
    ${pageHeader('Provider Performance Analytics', '<span>Reports</span><span class="sep">›</span><span>Provider Analytics</span>', `
        <button class="btn btn-secondary btn-sm" onclick="window.printReport('Provider Performance')"><i class="fa-solid fa-print"></i> Print</button>
    `)}

    <div class="stat-grid" style="grid-template-columns:repeat(3,1fr)">
        <div class="stat-card">
            <div class="stat-icon" style="background:var(--acc)22;color:var(--acc)"><i class="fa-solid fa-coins"></i></div>
            <div class="stat-info"><div class="stat-label">Aggregated Bet</div><div class="stat-value">${fmtCur(totalBet)}</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:var(--green)22;color:var(--green)"><i class="fa-solid fa-trophy"></i></div>
            <div class="stat-info"><div class="stat-label">Aggregated Win</div><div class="stat-value">${fmtCur(totalWin)}</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:var(--purple)22;color:var(--purple)"><i class="fa-solid fa-chart-line"></i></div>
            <div class="stat-info"><div class="stat-label">Total GGR Profit</div><div class="stat-value">${fmtCur(totalGGR)}</div></div>
        </div>
    </div>

    <div class="card">
        <div class="card-header"><span class="card-title">Provider Performance Comparison</span></div>
        <div class="card-body">
            ${tableWrap(`
                <table>
                    <thead>
                        <tr>
                            <th>Provider</th>
                            <th>Active Players</th>
                            <th>Total Bet</th>
                            <th>Total Win</th>
                            <th>GGR Profit</th>
                            <th>Avg Bet/Player</th>
                            <th>Profit Margin</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stats.map(s => `
                            <tr>
                                <td><div style="font-weight:800;color:var(--acc)">${s.provider}</div></td>
                                <td>${fmt(s.players)}</td>
                                <td style="font-weight:600">${fmtCur(s.bet)}</td>
                                <td style="color:var(--green)">${fmtCur(s.win)}</td>
                                <td style="font-weight:700;color:var(--acc)">${fmtCur(s.ggr)}</td>
                                <td style="font-size:.78rem">${fmtCur(s.avgBet)}</td>
                                <td>
                                    <div style="display:flex;align-items:center;gap:.5rem">
                                        <div style="flex:1;height:8px;background:var(--bg3);border-radius:4px">
                                            <div style="width:${Math.min(100, Math.max(0, s.margin))}%;height:100%;background:${s.margin > 20 ? 'var(--green)' : s.margin > 10 ? 'var(--yellow)' : 'var(--red)'};border-radius:4px"></div>
                                        </div>
                                        <span style="font-size:.75rem;font-weight:600">${s.margin.toFixed(1)}%</span>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                        ${stats.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text3)">No provider data available. Run some seamless transactions first.</td></tr>' : ''}
                    </tbody>
                </table>
            `)}
        </div>
    </div>
    `;
};

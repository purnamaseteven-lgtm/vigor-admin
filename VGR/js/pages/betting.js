/* ─── BETTING & RESULTS PAGES ─── */
import { STATE, fmt, fmtCur } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsSelect, fsDateFilter, fsActions, tableWrap, badge, actionBtns, toast } from '../ui/components.js';
import { MEMBERS, COMPANIES, GAMES, rnd, filterData, paginate, getCurPage, getPerPage } from '../utils/helpers.js';

pages['bets-list'] = () => {
  const PG = 'bets-list';
  const filtered = filterData(STATE.lotteryBets || [], PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  const rowHtml = rows.length ? rows.map((bet, i) => `
      <tr>
          <td>${(cp - 1) * pp + i + 1}</td>
          <td style="font-size:.72rem">${bet.date}</td>
          <td style="font-size:.78rem"><strong>${bet.member}</strong></td>
          <td style="font-size:.72rem">${bet.game} <span class="badge badge-purple">${bet.pool}</span></td>
          <td style="font-size:.72rem;font-weight:700">${bet.guess}</td>
          <td style="text-align:right">${fmt(bet.betAmount)}</td>
          <td style="text-align:right">${fmt(bet.paidAmount)}</td>
          <td style="text-align:right;color:${bet.winAmount > 0 ? 'var(--green)' : 'var(--text2)'}">${fmt(bet.winAmount)}</td>
          <td>${badge(bet.status, bet.status === 'Win' ? 'success' : bet.status === 'Lose' ? 'danger' : 'warning')}</td>
      </tr>
    `).join('') : '<tr><td colspan="9" style="text-align:center;padding:1.5rem;color:var(--text3)">No bets records found in database</td></tr>';

  return `
    ${pageHeader('Bets List', '<span>Bets</span><span class="sep">›</span><span>List</span>')}
    ${filterCard(`
      ${fsSelect(PG, 'pool', 'Pools', ['All', '4D Togel External', '4D Togel Vigor', '4D Togel Global', '6D Togel Vigor', 'SINGAPORE', 'HONGKONG', 'SYDNEY', 'PCSO'])}
      ${fsSelect(PG, 'game', 'Game', ['All', ...GAMES])}
      ${fsInput(PG, 'member', 'Username', 'Username')}
      ${fsDateFilter(PG, 'startDate', 'endDate')}
      ${fsActions(PG)}
    `)}
    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Username</th>
                <th>Game</th>
                <th>Guess</th>
                <th style="text-align:right">Bet</th>
                <th style="text-align:right">Paid</th>
                <th style="text-align:right">WIN</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${rowHtml}</tbody>
          </table>
        `)}
      </div>
    </div>
  `;
};

pages['bets-table'] = () => {
  const POOLS = ['4D Togel External', '4D Togel Vigor', '4D Togel Global', '6D Togel Vigor', 'SINGAPORE', 'HONGKONG', 'SYDNEY', 'PCSO', 'CAMBODIA'];
  const allBets = STATE.lotteryBets || [];
  const poolRows = POOLS.map(pool => {
    const poolBets = allBets.filter(b => b.pool === pool);
    const winners = poolBets.filter(b => (b.winAmount || 0) > 0);
    // Pool schedule from STATE.settings if available
    const sched = STATE.settings['pool_sched_' + pool.replace(/ /g, '_').toLowerCase()] || {};
    return {
      pool,
      open: sched.open || '10:00',
      close: sched.close || '18:00',
      totalBets: poolBets.length,
      totalAmount: poolBets.reduce((s, b) => s + (b.betAmount || 0), 0),
      winners: winners.length,
      payoutAmt: poolBets.reduce((s, b) => s + (b.winAmount || 0), 0),
      status: sched.status || (pool === 'PCSO' ? 'Closed' : 'Open'),
    };
  });

  return `
    ${pageHeader('Bets Table', '<span>Bets</span><span class="sep">›</span><span>Bets Table</span>', `
      <div style="display:flex;gap:.5rem;align-items:center">
        <span style="font-size:.82rem;color:var(--text3)">Date:</span>
        <input type="date" class="form-control" value="2026-04-27" style="width:160px"/>
        <button class="btn btn-primary btn-sm" onclick="window.go('bets-table')"><i class="fa-solid fa-rotate"></i> Refresh</button>
      </div>`)}

    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-ticket"></i></div>
        <div class="stat-info"><div class="stat-label">Total Bets Today</div><div class="stat-value">${fmt(poolRows.reduce((s, r) => s + r.totalBets, 0))}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-coins"></i></div>
        <div class="stat-info"><div class="stat-label">Total Amount</div><div class="stat-value" style="font-size:.95rem">${fmtCur(poolRows.reduce((s, r) => s + r.totalAmount, 0))}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,.1);color:var(--yellow)"><i class="fa-solid fa-trophy"></i></div>
        <div class="stat-info"><div class="stat-label">Total Winners</div><div class="stat-value">${fmt(poolRows.reduce((s, r) => s + r.winners, 0))}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,.1);color:var(--red)"><i class="fa-solid fa-money-bill-transfer"></i></div>
        <div class="stat-info"><div class="stat-label">Total Payout</div><div class="stat-value" style="font-size:.95rem">${fmtCur(poolRows.reduce((s, r) => s + r.payoutAmt, 0))}</div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(${POOLS.length},1fr);gap:1rem;margin-bottom:1.25rem">
      ${poolRows.map(r => `
        <div class="card" style="border-top:3px solid ${r.status === 'Open' ? 'var(--green)' : 'var(--red)'}">
          <div class="card-body" style="padding:1rem;text-align:center">
            <div style="font-weight:700;font-size:1rem;margin-bottom:.3rem">${r.pool}</div>
            <div style="margin-bottom:.5rem">${badge(r.status, r.status === 'Open' ? 'success' : 'danger')}</div>
            <div style="font-size:.75rem;color:var(--text3);margin-bottom:.5rem">${r.open} – ${r.close}</div>
            <div style="font-size:.82rem;font-weight:600;color:var(--acc)">${fmt(r.totalBets)} bets</div>
            <div style="font-size:.78rem;color:var(--green)">${fmtCur(r.totalAmount)}</div>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Bets Summary by Pool</span></div>
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr><th>Pool</th><th>Status</th><th>Open</th><th>Close</th><th>Total Bets</th><th>Amount</th><th>Winners</th><th>Payout</th><th>Net Profit</th></tr>
            </thead>
            <tbody>
              ${poolRows.map(r => {
    const profit = r.totalAmount - r.payoutAmt;
    return `
                <tr>
                  <td><strong>${r.pool}</strong></td>
                  <td>${badge(r.status, r.status === 'Open' ? 'success' : 'danger')}</td>
                  <td style="font-size:.8rem">${r.open}</td>
                  <td style="font-size:.8rem">${r.close}</td>
                  <td>${fmt(r.totalBets)}</td>
                  <td style="color:var(--acc);font-weight:600">${fmtCur(r.totalAmount)}</td>
                  <td>${fmt(r.winners)}</td>
                  <td style="color:var(--red)">${fmtCur(r.payoutAmt)}</td>
                  <td style="font-weight:700;color:${profit >= 0 ? 'var(--green)' : 'var(--red)'}">${profit >= 0 ? '' : '-'}${fmtCur(Math.abs(profit))}</td>
                </tr>`;
  }).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>`;
};

pages['bets-transferred'] = () => {
  const PG = 'bets-transferred';
  const rows = Array.from({ length: 20 }, (_, i) => ({
    id: 'TRF' + (4000 + i),
    member: MEMBERS[i % MEMBERS.length],
    company: COMPANIES[i % COMPANIES.length],
    fromPool: ['SINGAPORE', 'HONGKONG', 'SYDNEY'][i % 3],
    toPool: ['PCSO', 'CAMBODIA', 'MAGNUM'][i % 3],
    amount: rnd(1, 10) * 50000,
    betType: GAMES[i % GAMES.length],
    number: String(rnd(1000, 9999)),
    reason: ['Duplicate bet', 'System transfer', 'Pool closed', 'Manual transfer'][i % 4],
    date: `${rnd(20, 27)}/04/2026 ${rnd(10, 23)}:${rnd(10, 59)}`,
    status: i < 2 ? 'Pending' : 'Completed'
  }));

  return `
    ${pageHeader('Transfer Bets', '<span>Bets</span><span class="sep">›</span><span>Transfer Bets</span>')}
    ${filterCard(`
      ${filterSelect('From Pool', ['All Pools', 'SINGAPORE', 'HONGKONG', 'SYDNEY'])}
      ${filterSelect('To Pool', ['All Pools', 'PCSO', 'CAMBODIA', 'MAGNUM'])}
      ${filterSelect('Status', ['All', 'Pending', 'Completed'])}
      ${filterActions()}
    `)}
    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Transfer ID</th><th>Member</th><th>From Pool</th><th>To Pool</th><th>Bet Type</th><th>Number</th><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong style="font-size:.75rem">${r.id}</strong></td>
                  <td><strong>${r.member}</strong></td>
                  <td><span class="badge badge-indigo">${r.fromPool}</span></td>
                  <td><span class="badge badge-purple">${r.toPool}</span></td>
                  <td style="font-size:.78rem">${r.betType}</td>
                  <td style="font-weight:700">${r.number}</td>
                  <td style="font-weight:600">${fmtCur(r.amount)}</td>
                  <td style="font-size:.75rem;color:var(--text3)">${r.reason}</td>
                  <td>${badge(r.status, r.status === 'Completed' ? 'success' : 'warning')}</td>
                  <td style="font-size:.72rem;white-space:nowrap">${r.date}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>`;
};

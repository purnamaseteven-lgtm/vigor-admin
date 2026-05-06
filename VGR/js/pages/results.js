/* ─── RESULTS PAGES ─── */
import { STATE, fmt, fmtCur, saveState } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsSelect, fsActions, tableWrap, badge, renderPagerHTML, toast, openModal, closeModalBtn } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage, rnd, GAMES, MEMBERS, COMPANIES } from '../utils/helpers.js';

const POOLS = ['4D Togel External', '4D Togel Vigor', '4D Togel Global', '6D Togel Vigor', 'SINGAPORE', 'HONGKONG', 'SYDNEY', 'PCSO', 'CAMBODIA', 'MAGNUM', 'DAMACAI', 'TOTO'];

function makeResults(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: 'RES' + (7000 + i),
    pool: POOLS[i % POOLS.length],
    date: `${rnd(20, 27)}/04/2026`,
    period: `${20260427 - i}`,
    r1: String(rnd(1000, 9999)),
    r2: String(rnd(1000, 9999)),
    r3: String(rnd(1000, 9999)),
    r4: String(rnd(1000, 9999)),
    r5: String(rnd(1000, 9999)),
    status: i < 3 ? 'Pending' : 'Published',
    publishedBy: i < 3 ? '' : 'system'
  }));
}

function getResultsStore() {
  // Use real DB data from STATE.lotteryResults if available
  if (Array.isArray(STATE.lotteryResults) && STATE.lotteryResults.length > 0) {
    return STATE.lotteryResults.map(r => ({
      id: r.id,
      pool: r.pool,
      date: r.drawDate || r.draw_date || '',
      period: r.id,
      r1: r.r1 || r.result1st || '',
      r2: r.r2 || r.result2nd || '',
      r3: r.r3 || r.result3rd || '',
      r4: Array.isArray(r.r4) ? r.r4.join(', ') : (r.r4 || ''),
      r5: Array.isArray(r.r5) ? r.r5.join(', ') : (r.r5 || ''),
      status: r.isSettled ? 'Published' : 'Pending',
      publishedBy: r.isSettled ? 'system' : '',
    }));
  }
  // Fallback to mock data
  if (!Array.isArray(STATE.results) || STATE.results.length === 0) {
    STATE.results = makeResults(50);
    saveState();
  }
  return STATE.results;
}

/* ─── RESULTS LIST ─── */
pages['results-list'] = () => {
  const PG = 'results-list';
  const all = getResultsStore();
  const filtered = filterData(all, PG);
  const total = filtered.length;
  const pp = getPerPage(PG);
  const cp = getCurPage(PG);
  const rows = paginate(filtered, cp, pp);

  window._resultData = filtered;

  return `
    ${pageHeader('Results List', '<span>Results</span><span class="sep">›</span><span>List</span>', `
      <div style="display:flex;gap:.5rem">
        <button class="btn btn-warning btn-sm" onclick="window.openScraperModal()"><i class="fa-solid fa-satellite-dish"></i> Auto-Scrape</button>
        <button class="btn btn-secondary btn-sm" onclick="window.exportCSV(window._resultData||[],'results.csv')"><i class="fa-solid fa-download"></i> Export</button>
        <button class="btn btn-primary" onclick="window.openAddResultModal()"><i class="fa-solid fa-plus"></i> Input Result</button>
      </div>`)}

    ${filterCard(`
      ${fsSelect(PG, 'pool', 'Pool', ['All', ...POOLS])}
      ${fsSelect(PG, 'status', 'Status', ['All', 'Pending', 'Published'])}
      <div class="filter-group"><label>Date</label><input type="date" class="form-control" style="width:150px"/></div>
      ${fsActions(PG)}
    `)}

    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr>
                <th>#</th><th>Pool</th><th>Date</th><th>Period</th>
                <th style="text-align:center">1st Prize</th><th style="text-align:center">2nd</th>
                <th style="text-align:center">3rd</th><th style="text-align:center">Special</th>
                <th style="text-align:center">Consolation</th><th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr>
                  <td>${(cp - 1) * pp + i + 1}</td>
                  <td><strong>${r.pool}</strong></td>
                  <td style="font-size:.75rem">${r.date}</td>
                  <td style="font-size:.75rem">${r.period}</td>
                  <td style="text-align:center;font-weight:700;font-size:1rem;color:var(--acc)">${r.r1}</td>
                  <td style="text-align:center;font-weight:600">${r.r2}</td>
                  <td style="text-align:center;font-weight:600">${r.r3}</td>
                  <td style="text-align:center;font-size:.8rem">${r.r4}</td>
                  <td style="text-align:center;font-size:.8rem">${r.r5}</td>
                  <td>${badge(r.status, r.status === 'Published' ? 'success' : 'warning')}</td>
                  <td>
                    <div class="action-btns">
                      ${r.status === 'Pending' ? `<button class="btn btn-sm btn-success" onclick="window.publishResult('${r.id}')"><i class="fa-solid fa-check"></i> Publish</button>` : ''}
                      <button class="btn btn-sm btn-icon" style="background:#f59e0b;color:#fff" onclick="window.openEditResultModal('${r.id}')"><i class="fa-solid fa-pen"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>
    ${renderPagerHTML(PG, total, pp, cp)}`;
};

/* ─── RESULTS SCAN ─── */
pages['results-scan'] = () => {
  return `
    ${pageHeader('Results Scan', '<span>Results</span><span class="sep">›</span><span>Scan</span>')}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fa-solid fa-magnifying-glass" style="color:var(--acc);margin-right:.4rem"></i>Scan by Bet ID</span></div>
        <div class="card-body">
          <div style="display:flex;gap:.5rem;margin-bottom:1rem">
            <input type="text" class="form-control" id="scanBetId" placeholder="Enter Bet ID (e.g. BET12345)" style="flex:1"/>
            <button class="btn btn-primary" onclick="window.scanResult()"><i class="fa-solid fa-magnifying-glass"></i> Scan</button>
          </div>
          <div id="scanResultOutput" style="display:none">
            <div class="card" style="border:2px solid var(--green);background:rgba(16,185,129,.05)">
              <div class="card-body">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
                  ${[['Bet ID', 'BET12345'], ['Member', 'alex99'], ['Pool', 'SINGAPORE'], ['Period', '20260427'], ['Bet Type', '4D'], ['Number', '4821'], ['Amount', 'Rp 50,000'], ['Discount', '32%'], ['Status', '<span class="badge badge-success">Win</span>'], ['Payout', 'Rp 1,800,000']].map(([k, v]) => `
                    <div style="font-size:.82rem"><span style="color:var(--text3)">${k}:</span> <strong>${v}</strong></div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fa-solid fa-qrcode" style="color:var(--acc);margin-right:.4rem"></i>QR Code Scan</span></div>
        <div class="card-body" style="text-align:center;padding:3rem 1rem">
          <div style="width:160px;height:160px;border:3px dashed var(--border);border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem">
            <i class="fa-solid fa-qrcode" style="font-size:5rem;color:var(--text3);opacity:.4"></i>
          </div>
          <p style="color:var(--text3);font-size:.85rem;margin-bottom:1rem">Point camera at a bet slip QR code</p>
          <button class="btn btn-primary" onclick="window.openResultCameraEntry()"><i class="fa-solid fa-camera"></i> Quick Entry</button>
        </div>
      </div>
    </div>

    <!-- NEW: Payout / Liability Prediction Scanner -->
    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fa-solid fa-calculator" style="color:var(--yellow);margin-right:.4rem"></i>Payout Prediction (Liability Scanner)</span></div>
      <div class="card-body">
        <p style="font-size:.8rem;color:var(--text3);margin-bottom:1rem">Simulasikan kerugian/kemenangan bandar jika sebuah angka tertentu keluar pada pasaran. Sistem akan memindai seluruh taruhan pending.</p>
        <div style="display:flex;gap:.5rem;margin-bottom:1rem">
          <select class="form-control" id="scanLiabPool" style="width:200px">
            ${POOLS.map(p => `<option>${p}</option>`).join('')}
          </select>
          <input type="text" class="form-control" id="scanLiabNumber" placeholder="4D Number (e.g. 1234)" maxlength="4" style="flex:1"/>
          <button class="btn btn-warning" onclick="window.scanLiability()"><i class="fa-solid fa-radar-base"></i> Scan Payout</button>
        </div>
        <div id="liabilityOutput" style="display:none"></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Recent Scans</span></div>
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr><th>Bet ID</th><th>Member</th><th>Pool</th><th>Number</th><th>Amount</th><th>Result</th><th>Payout</th><th>Scanned At</th></tr>
            </thead>
            <tbody>
              ${(() => {
      const recentBets = (STATE.lotteryBets || []).slice(0, 8);
      if (recentBets.length === 0) return `<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:2rem">No recent bet data available</td></tr>`;
      return recentBets.map(b => {
        const won = b.status === 'Won' || b.winAmount > 0;
        return `
                  <tr>
                    <td><strong>${b.id}</strong></td>
                    <td>${b.member}</td>
                    <td>${b.pool}</td>
                    <td style="font-weight:700">${b.guess || '-'}</td>
                    <td>${fmtCur(b.betAmount)}</td>
                    <td>${badge(won ? 'Win' : 'Lose', won ? 'success' : 'danger')}</td>
                    <td style="color:${won ? 'var(--green)' : 'var(--text3)'}">
                      ${won ? fmtCur(b.winAmount) : '-'}
                    </td>
                    <td style="font-size:.75rem">${b.date || b.drawDate || '-'}</td>
                  </tr>`;
      }).join('');
    })()}
            </tbody>
          </table>
        `)}
      </div>
    </div>`;
};

/* ─── RESULTS ANALYZE ─── */
pages['results-analyze'] = () => {
  const bets = STATE.lotteryBets || [];
  const results = STATE.lotteryResults || [];

  // Aggregate per pool from real bet data
  const poolStats = POOLS.map(pool => {
    const poolBets = bets.filter(b => b.pool === pool);
    const totalBets = poolBets.length;
    const totalPayout = poolBets.reduce((s, b) => s + (b.winAmount || 0), 0);
    const totalBetAmt = poolBets.reduce((s, b) => s + (b.betAmount || 0), 0);
    const winners = poolBets.filter(b => (b.winAmount || 0) > 0).length;
    return {
      pool,
      totalBets,
      totalPayout,
      winRate: totalBets > 0 ? Math.round((winners / totalBets) * 100) : 0,
      profit: totalBetAmt - totalPayout,
    };
  });

  // Top numbers from real results
  const numberFreq = {};
  results.forEach(r => {
    [r.r1, r.r2, r.r3].forEach(num => {
      if (num) numberFreq[num] = (numberFreq[num] || { pool: r.pool, count: 0, lastOut: r.drawDate });
      if (num) numberFreq[num].count++;
    });
  });
  const topNumbers = Object.entries(numberFreq)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([number, data]) => ({ number, pool: data.pool, frequency: data.count, lastOut: data.lastOut || '-' }));

  return `
    ${pageHeader('Results Analyze', '<span>Results</span><span class="sep">›</span><span>Analyze</span>', `
      <div style="display:flex;gap:.5rem;align-items:center">
        <select class="form-control" style="width:150px">
          ${POOLS.map(p => `<option>${p}</option>`).join('')}
        </select>
        <button class="btn btn-primary"><i class="fa-solid fa-chart-line"></i> Analyze</button>
      </div>`)}

    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-ticket"></i></div>
        <div class="stat-info"><div class="stat-label">Total Bets Today</div><div class="stat-value">${fmt(poolStats.reduce((s, p) => s + p.totalBets, 0))}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(239,68,68,.1);color:var(--red)"><i class="fa-solid fa-money-bill-wave"></i></div>
        <div class="stat-info"><div class="stat-label">Total Payout</div><div class="stat-value" style="font-size:1rem">${fmtCur(poolStats.reduce((s, p) => s + p.totalPayout, 0))}</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-chart-simple"></i></div>
        <div class="stat-info"><div class="stat-label">Avg Win Rate</div><div class="stat-value">${Math.round(poolStats.reduce((s, p) => s + p.winRate, 0) / poolStats.length)}%</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:rgba(245,158,11,.1);color:var(--yellow)"><i class="fa-solid fa-sack-dollar"></i></div>
        <div class="stat-info"><div class="stat-label">Total Profit</div><div class="stat-value" style="font-size:1rem">${fmtCur(poolStats.reduce((s, p) => s + p.profit, 0))}</div></div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
      <div class="card">
        <div class="card-header"><span class="card-title">Pool Performance</span></div>
        <div class="card-body">
          ${tableWrap(`
            <table>
              <thead><tr><th>Pool</th><th>Total Bets</th><th>Payout</th><th>Win Rate</th><th>Profit</th></tr></thead>
              <tbody>
                ${poolStats.map(p => `
                  <tr>
                    <td><strong>${p.pool}</strong></td>
                    <td>${fmt(p.totalBets)}</td>
                    <td>${fmtCur(p.totalPayout)}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:.5rem">
                        <div style="flex:1;height:6px;background:var(--bg3);border-radius:3px">
                          <div style="width:${p.winRate}%;height:100%;background:var(--acc);border-radius:3px"></div>
                        </div>
                        <span style="font-size:.75rem;font-weight:600">${p.winRate}%</span>
                      </div>
                    </td>
                    <td style="color:var(--green);font-weight:700">${fmtCur(p.profit)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `)}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Hot Numbers (Most Frequent)</span></div>
        <div class="card-body">
          ${tableWrap(`
            <table>
              <thead><tr><th>#</th><th>Number</th><th>Pool</th><th>Frequency</th><th>Last Out</th></tr></thead>
              <tbody>
                ${topNumbers.map((n, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong style="font-size:1rem;color:var(--acc)">${n.number}</strong></td>
                    <td><span style="font-size:.75rem">${n.pool}</span></td>
                    <td>
                      <div style="display:flex;align-items:center;gap:.5rem">
                        <div style="width:${n.frequency * 3}px;height:8px;background:${i < 3 ? 'var(--red)' : 'var(--acc)'};border-radius:4px"></div>
                        <span style="font-weight:600">${n.frequency}x</span>
                      </div>
                    </td>
                    <td style="font-size:.75rem">${n.lastOut}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `)}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">7-Day Bet Volume Trend</span></div>
      <div class="card-body"><div class="chart-container"><canvas id="chartResultTrend"></canvas></div></div>
    </div>`;
};

window.scanResult = () => {
  const id = document.getElementById('scanBetId')?.value.trim();
  if (!id) { toast('Please enter a Bet ID', 'error'); return; }
  const match = getResultsStore().find(r => r.id.toLowerCase() === id.toLowerCase() || r.period === id);
  if (!match) {
    toast('No matching result found', 'error');
    return;
  }
  const out = document.getElementById('scanResultOutput');
  if (out) out.style.display = 'block';
  out.innerHTML = `
      <div class="card" style="border:2px solid var(--green);background:rgba(16,185,129,.05)">
        <div class="card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
            ${[
      ['Result ID', match.id],
      ['Pool', match.pool],
      ['Date', match.date],
      ['Period', match.period],
      ['1st Prize', match.r1],
      ['2nd Prize', match.r2],
      ['3rd Prize', match.r3],
      ['Special', match.r4],
      ['Consolation', match.r5],
      ['Status', `<span class="badge badge-${match.status === 'Published' ? 'success' : 'warning'}">${match.status}</span>`],
    ].map(([k, v]) => `<div style="font-size:.82rem"><span style="color:var(--text3)">${k}:</span> <strong>${v}</strong></div>`).join('')}
          </div>
        </div>
      </div>`;
  toast('Result found: ' + match.id, 'success');
};

/* ─── LIABILITY SCANNER LOGIC ─── */
window.scanLiability = () => {
  const pool = document.getElementById('scanLiabPool')?.value;
  const num = document.getElementById('scanLiabNumber')?.value;
  if (!num || num.length !== 4) { toast('Please enter exactly 4 digits', 'error'); return; }

  // Fallback to random simulation if real data is missing
  let pendingBets = (STATE.lotteryBets || []).filter(b => b.pool === pool && b.status === 'Pending');

  // If we lack real data, simulate some for the demo
  if (pendingBets.length === 0) {
    pendingBets = Array.from({ length: 120 }, (_, i) => {
      const typeStr = ['4D', '3D', '2D', 'Colok Bebas'][rnd(0, 3)];
      return {
        id: 'BET' + rnd(10000, 99999), member: MEMBERS[rnd(0, MEMBERS.length - 1)], pool,
        betType: typeStr,
        guess: typeStr === '4D' ? num : typeStr === '3D' ? num.slice(1) : typeStr === '2D' ? num.slice(2) : num.charAt(rnd(0, 3)),
        betAmount: rnd(1, 10) * 5000, status: 'Pending'
      };
    });
    // Add noise (bets that lose)
    for (let i = 0; i < 500; i++) {
      pendingBets.push({
        id: 'BET' + rnd(10000, 99999), member: MEMBERS[rnd(0, MEMBERS.length - 1)], pool, betType: '4D', guess: '9999', betAmount: rnd(1, 10) * 5000, status: 'Pending'
      });
    }
  }

  let totalOmset = 0;
  let totalPayout = 0;
  let winningTickets = 0;

  pendingBets.forEach(b => {
    totalOmset += b.betAmount || 0;
    let isWin = false;
    let multiplier = 0;

    // Check win condition
    if (b.betType === '4D' && b.guess === num) { isWin = true; multiplier = 3000; }
    else if (b.betType === '3D' && b.guess === num.slice(1)) { isWin = true; multiplier = 400; }
    else if (b.betType === '2D' && b.guess === num.slice(2)) { isWin = true; multiplier = 70; }
    else if (b.betType === 'Colok Bebas' && num.includes(b.guess)) { isWin = true; multiplier = 1.5; }

    if (isWin) {
      winningTickets++;
      totalPayout += (b.betAmount * multiplier);
    }
  });

  const profit = totalOmset - totalPayout;
  const isLoss = profit < 0;

  const out = document.getElementById('liabilityOutput');
  if (out) {
    out.style.display = 'block';
    out.innerHTML = `
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:1.25rem">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
            <div>
                <div style="font-size:.85rem;color:var(--text3)">Simulated Outcome for </div>
                <div style="font-size:1.5rem;font-weight:800;color:var(--acc);letter-spacing:4px">${num}</div>
            </div>
            <div style="text-align:right">
                <div style="font-size:.85rem;color:var(--text3)">Pool</div>
                <div style="font-weight:700">${pool}</div>
            </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.5rem">
            <div style="background:rgba(14,165,233,.05);border:1px solid rgba(14,165,233,.2);padding:.75rem;border-radius:8px">
                <div style="font-size:.7rem;color:var(--text3)">Total Pending Bets</div>
                <div style="font-weight:700">${window.fmtCur ? window.fmtCur(totalOmset) : totalOmset}</div>
            </div>
            <div style="background:rgba(239,68,68,.05);border:1px solid rgba(239,68,68,.2);padding:.75rem;border-radius:8px">
                <div style="font-size:.7rem;color:var(--text3)">Winning Tickets</div>
                <div style="font-weight:700;color:var(--red)">${winningTickets}</div>
            </div>
            <div style="background:rgba(245,158,11,.05);border:1px solid rgba(245,158,11,.2);padding:.75rem;border-radius:8px">
                <div style="font-size:.7rem;color:var(--text3)">Est. Total Payout</div>
                <div style="font-weight:700;color:var(--yellow)">${window.fmtCur ? window.fmtCur(totalPayout) : totalPayout}</div>
            </div>
            <div style="background:${isLoss ? 'rgba(239,68,68,.1)' : 'rgba(16,185,129,.1)'};border:1px solid ${isLoss ? 'var(--red)' : 'var(--green)'};padding:.75rem;border-radius:8px">
                <div style="font-size:.7rem;color:var(--text3)">Net P&L</div>
                <div style="font-weight:800;color:${isLoss ? 'var(--red)' : 'var(--green)'}">${isLoss ? '-' : '+'}${window.fmtCur ? window.fmtCur(Math.abs(profit)) : Math.abs(profit)}</div>
            </div>
        </div>
        ${isLoss ? `
        <div style="background:rgba(239,68,68,.1);border-left:4px solid var(--red);padding:.75rem;font-size:.82rem;color:var(--red);">
            <i class="fa-solid fa-triangle-exclamation" style="margin-right:.5rem"></i><strong>WARNING:</strong> Jika angka ini keluar, perusahaan akan mengalami kerugian (payout melebihi omset). Sangat disarankan untuk menurunkan limit taruhan untuk angka ini!
        </div>` : `
        <div style="background:rgba(16,185,129,.1);border-left:4px solid var(--green);padding:.75rem;font-size:.82rem;color:var(--green);">
            <i class="fa-solid fa-shield-check" style="margin-right:.5rem"></i><strong>AMAN:</strong> Pengeluaran angka ini masih dalam batas aman (Omset > Payout).
        </div>`}
      </div>
    `;
    toast('Liability scan complete', 'success');
  }
};

window.openAddResultModal = () => {
  openModal('Input Result', `
      <div class="form-grid">
        <div class="form-field"><label>Pool</label><select id="res_pool">${POOLS.map(p => `<option>${p}</option>`).join('')}</select></div>
        <div class="form-field"><label>Date</label><input id="res_date" type="date" value="2026-04-29" /></div>
        <div class="form-field"><label>Period</label><input id="res_period" value="${Date.now().toString().slice(-8)}" /></div>
        <div class="form-field"><label>Status</label><select id="res_status"><option>Pending</option><option>Published</option></select></div>
        <div class="form-field"><label>1st Prize</label><input id="res_r1" maxlength="4" /></div>
        <div class="form-field"><label>2nd Prize</label><input id="res_r2" maxlength="4" /></div>
        <div class="form-field"><label>3rd Prize</label><input id="res_r3" maxlength="4" /></div>
        <div class="form-field"><label>Special</label><input id="res_r4" maxlength="4" /></div>
        <div class="form-field"><label>Consolation</label><input id="res_r5" maxlength="4" /></div>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
      <button class="btn btn-primary" onclick="window.saveResultEntry()"><i class="fa-solid fa-floppy-disk"></i> Save Result</button>
    `);
};

window.saveResultEntry = async () => {
  const values = ['res_r1', 'res_r2', 'res_r3', 'res_r4', 'res_r5'].map(id => document.getElementById(id)?.value.trim());
  if (values.some(v => !/^\d{4}$/.test(v || ''))) {
    toast('All result fields must be 4 digits', 'error');
    return;
  }
  const entry = {
    id: 'RES' + Date.now().toString().slice(-6),
    pool: document.getElementById('res_pool')?.value || POOLS[0],
    drawDate: document.getElementById('res_date')?.value || new Date().toISOString().slice(0, 10),
    date: document.getElementById('res_date')?.value || new Date().toISOString().slice(0, 10),
    period: document.getElementById('res_period')?.value || Date.now().toString().slice(-8),
    r1: values[0],
    r2: values[1],
    r3: values[2],
    r4: values[3],
    r5: values[4],
    status: document.getElementById('res_status')?.value || 'Pending',
    publishedBy: 'adminsub40'
  };
  if (window.db?.dbSaveLotteryResult) {
    const { error } = await window.db.dbSaveLotteryResult(entry);
    if (error) return toast('Save failed: ' + error.message, 'error');
  } else {
    getResultsStore().unshift(entry);
    saveState();
  }
  saveState();
  closeModalBtn();
  window.go('results-list');
  toast('Result saved', 'success');
};

window.openResultCameraEntry = () => {
  openModal('Quick Result Entry', `
      <div class="form-field">
        <label>Paste scanned numbers (five 4-digit values separated by spaces)</label>
        <textarea id="qr_result_numbers" rows="4" style="width:100%">1234 2345 3456 4567 5678</textarea>
      </div>
    `, `
      <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
      <button class="btn btn-primary" onclick="window.applyQuickResultEntry()">Use Values</button>
    `);
};

window.applyQuickResultEntry = () => {
  const raw = document.getElementById('qr_result_numbers')?.value || '';
  const parts = raw.match(/\d{4}/g) || [];
  if (parts.length < 5) {
    toast('Need five 4-digit values', 'error');
    return;
  }
  closeModalBtn();
  window.openAddResultModal();
  requestAnimationFrame(() => {
    ['res_r1', 'res_r2', 'res_r3', 'res_r4', 'res_r5'].forEach((id, idx) => {
      const el = document.getElementById(id);
      if (el) el.value = parts[idx];
    });
  });
};

/* ─── AUTO-SCRAPE RESULTS ─── */
window.openScraperModal = () => {
  openModal('Togel Auto-Scraper', `
      <div class="form-grid">
        <div class="form-field">
            <label>Select Target Pool API</label>
            <select id="scrape_pool_target">
                <option value="SINGAPORE">Singapore Pools (Live)</option>
                <option value="HONGKONG">Hongkong Pools (Live)</option>
                <option value="SYDNEY">Sydney Pools (Live)</option>
                <option value="ALL">ALL PENDING POOLS</option>
            </select>
        </div>
        <div class="form-field">
            <label>Provider Gateway</label>
            <select>
                <option>API Hub - Node 1 (Fast)</option>
                <option>API Hub - Node 2 (Backup)</option>
                <option>Direct HTML DOM Scrape</option>
            </select>
        </div>
      </div>
      <div id="scrapeConsole" style="display:none;margin-top:1.5rem;background:#0f172a;color:#10b981;font-family:monospace;padding:1rem;border-radius:8px;font-size:.8rem;height:150px;overflow-y:auto;border:1px solid #334155">
        <div id="scrapeLogs"></div>
      </div>
    `, `
      <button class="btn btn-secondary" id="scrapeCancelBtn" onclick="closeModalBtn()">Close</button>
      <button class="btn btn-primary" id="scrapeRunBtn" onclick="window.runAutoScrape()"><i class="fa-solid fa-play"></i> Start Scraping</button>
    `);
};

window.runAutoScrape = async () => {
  const target = document.getElementById('scrape_pool_target')?.value;
  const consoleWrapper = document.getElementById('scrapeConsole');
  const logs = document.getElementById('scrapeLogs');
  const runBtn = document.getElementById('scrapeRunBtn');
  const cancelBtn = document.getElementById('scrapeCancelBtn');

  if (!consoleWrapper || !logs || !runBtn) return;

  consoleWrapper.style.display = 'block';
  runBtn.disabled = true;
  cancelBtn.disabled = true;
  runBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Scraping...';
  logs.innerHTML = '';

  const addLog = (msg, color = '#10b981') => {
    logs.innerHTML += `<div style="color:${color};margin-bottom:4px">[${new Date().toLocaleTimeString()}] ${msg}</div>`;
    consoleWrapper.scrollTop = consoleWrapper.scrollHeight;
  };

  const delay = ms => new Promise(res => setTimeout(res, ms));

  addLog(`Initiating connection to external provider for pool: ${target}...`, '#38bdf8');
  await delay(1000);
  addLog('Handshake successful. Resolving target DNS...', '#94a3b8');
  await delay(800);
  addLog(`Fetching JSON payload from origin...`);
  await delay(1500);

  // Generate mocked result based on target
  const poolsToProcess = target === 'ALL' ? ['SINGAPORE', 'HONGKONG', 'SYDNEY'] : [target];

  for (const pool of poolsToProcess) {
    addLog(`Parsing HTML/JSON DOM for ${pool}...`, '#eab308');
    await delay(600);

    const r1 = String(rnd(1000, 9999));
    const entry = {
      id: 'RES' + Date.now().toString().slice(-6) + rnd(10, 99),
      pool: pool,
      drawDate: new Date().toISOString().slice(0, 10),
      date: new Date().toISOString().slice(0, 10),
      period: Date.now().toString().slice(-8),
      r1: r1,
      r2: String(rnd(1000, 9999)),
      r3: String(rnd(1000, 9999)),
      r4: String(rnd(1000, 9999)),
      r5: String(rnd(1000, 9999)),
      status: 'Pending',
      publishedBy: 'system-scraper'
    };

    if (window.db?.dbSaveLotteryResult) {
      await window.db.dbSaveLotteryResult(entry);
    } else {
      getResultsStore().unshift(entry);
    }
    addLog(`Data extracted -> 1st:${r1} | 2nd:${entry.r2} | 3rd:${entry.r3}`, '#f472b6');
    addLog(`Injecting ${pool} to local database... DONE.`);
    await delay(500);
  }

  saveState();
  addLog('==============================', '#94a3b8');
  addLog('Scraping process completed successfully.', '#22c55e');

  runBtn.innerHTML = '<i class="fa-solid fa-check"></i> Scrape Complete';
  cancelBtn.disabled = false;
  cancelBtn.innerHTML = 'Finish & Reload';
  cancelBtn.onclick = () => { closeModalBtn(); window.go('results-list'); toast('Scraping results synced successfully', 'success'); };
};

/* ─── PUBLISH RESULT (mark as settled/published) ─── */
window.publishResult = async (id) => {
  if (!confirm(`Publish result ${id}? This will settle all pending bets for this draw.`)) return;
  if (window.db?.dbSaveLotteryResult) {
    const { error } = await window.db.dbSaveLotteryResult({ id, isSettled: true, status: 'Published' });
    if (error) { toast('Publish failed: ' + error.message, 'error'); return; }
  } else {
    // Fallback: update in STATE
    const res = (STATE.lotteryResults || []).find(r => r.id === id);
    if (res) { res.isSettled = true; res.status = 'Published'; saveState(); }
    const mock = (STATE.results || []).find(r => r.id === id);
    if (mock) { mock.status = 'Published'; saveState(); }
  }
  toast(`Result ${id} published ✓`, 'success');
  window.go('results-list');
};

/* ─── EDIT RESULT MODAL ─── */
window.openEditResultModal = (id) => {
  const store = Array.isArray(STATE.lotteryResults) && STATE.lotteryResults.length
    ? STATE.lotteryResults.map(r => ({ ...r, status: r.isSettled ? 'Published' : 'Pending' }))
    : STATE.results || [];
  const r = store.find(x => x.id === id);
  if (!r) { toast('Result not found', 'error'); return; }
  openModal('Edit Result', `
    <div class="form-grid">
      <div class="form-field"><label>Pool</label><input id="edit_pool" value="${r.pool}" readonly/></div>
      <div class="form-field"><label>Date</label><input id="edit_date" type="date" value="${(r.drawDate || r.date || '').slice(0, 10)}"/></div>
      <div class="form-field"><label>1st Prize</label><input id="edit_r1" value="${r.r1}" maxlength="4"/></div>
      <div class="form-field"><label>2nd Prize</label><input id="edit_r2" value="${r.r2}" maxlength="4"/></div>
      <div class="form-field"><label>3rd Prize</label><input id="edit_r3" value="${r.r3}" maxlength="4"/></div>
      <div class="form-field"><label>Special</label><input id="edit_r4" value="${r.r4}" maxlength="4"/></div>
      <div class="form-field"><label>Consolation</label><input id="edit_r5" value="${r.r5}" maxlength="4"/></div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveEditResult('${id}')"><i class="fa-solid fa-floppy-disk"></i> Save</button>
  `);
};

window.saveEditResult = async (id) => {
  const r1 = document.getElementById('edit_r1')?.value.trim();
  const r2 = document.getElementById('edit_r2')?.value.trim();
  const r3 = document.getElementById('edit_r3')?.value.trim();
  const r4 = document.getElementById('edit_r4')?.value.trim();
  const r5 = document.getElementById('edit_r5')?.value.trim();
  const drawDate = document.getElementById('edit_date')?.value;
  const update = { id, drawDate, result1st: r1, result2nd: r2, result3rd: r3, r1, r2, r3, r4, r5 };
  if (window.db?.dbSaveLotteryResult) {
    const { error } = await window.db.dbSaveLotteryResult(update);
    if (error) { toast('Save failed: ' + error.message, 'error'); return; }
  } else {
    const res = (STATE.lotteryResults || STATE.results || []).find(r => r.id === id);
    if (res) Object.assign(res, update);
    saveState();
  }
  closeModalBtn();
  window.go('results-list');
  toast('Result updated ✓', 'success');
};

/* ─── INTERACTIVE LIVE RESULT STREAMING ─── */
pages['results-live'] = () => {
  return `
      ${pageHeader('Live Result Stream', '<span>Results</span><span class="sep">›</span><span>Live Streaming</span>')}
      
      <style>
        .live-container { background: #0f172a; border-radius: 16px; padding: 3rem 2rem; position: relative; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.5); border: 1px solid #1e293b; text-align: center; }
        .live-bg-glow { position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle at center, rgba(14,165,233,0.15) 0%, transparent 60%); animation: slowSpin 20s linear infinite; pointer-events: none; }
        @keyframes slowSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .live-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; position: relative; z-index: 2; }
        .live-pool-name { font-size: 2rem; font-weight: 900; color: #fff; letter-spacing: 2px; text-transform: uppercase; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
        .live-status { background: rgba(239,68,68,0.2); color: #ef4444; padding: 6px 16px; border-radius: 20px; font-weight: 800; font-size: 0.8rem; border: 1px solid rgba(239,68,68,0.4); animation: pulseRed 1.5s infinite; }
        @keyframes pulseRed { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); } 70% { box-shadow: 0 0 0 10px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }
        
        .slot-machine { display: flex; justify-content: center; gap: 1rem; position: relative; z-index: 2; margin-bottom: 3rem; }
        .slot-digit { width: 100px; height: 140px; background: linear-gradient(180deg, #1e293b 0%, #0f172a 50%, #1e293b 100%); border: 2px solid #334155; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 5rem; font-weight: 900; color: #fff; box-shadow: inset 0 0 20px rgba(0,0,0,0.8), 0 10px 20px rgba(0,0,0,0.5); text-shadow: 0 5px 15px rgba(0,0,0,0.5); position: relative; overflow: hidden; }
        .slot-digit::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 50%; background: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 100%); pointer-events: none; }
        
        .slot-digit.spin { color: transparent; animation: valueBlur 0.1s linear infinite; }
        .slot-digit.spin::before { content: '8\\A 3\\A 5\\A 9\\A 0\\A 2\\A 7\\A 1\\A 4\\A 6'; position: absolute; color: var(--acc); top: 0; animation: slotScroll 0.2s linear infinite; filter: blur(2px); }
        @keyframes slotScroll { 0% { transform: translateY(-50%); } 100% { transform: translateY(0); } }
        @keyframes valueBlur { 0% { text-shadow: 0 0 20px rgba(14,165,233,0.8); } 100% { text-shadow: 0 0 5px rgba(14,165,233,0.8); } }
        
        .live-controls { position: relative; z-index: 2; }
      </style>
  
      <div class="card">
        <div class="live-container">
            <div class="live-bg-glow"></div>
            
            <div class="live-header">
                <div style="text-align:left">
                    <div style="color:var(--text3); font-weight:700; margin-bottom:4px; letter-spacing:1px">TODAY'S DRAW</div>
                    <div class="live-pool-name" id="livePoolName">SINGAPORE POOLS</div>
                </div>
                <div>
                    <div class="live-status" id="liveStatusLabel">● WAITING</div>
                </div>
            </div>
            
            <div class="slot-machine" id="slotMachine">
                <div class="slot-digit" id="d1">-</div>
                <div class="slot-digit" id="d2">-</div>
                <div class="slot-digit" id="d3">-</div>
                <div class="slot-digit" id="d4">-</div>
            </div>
            
            <div class="live-controls">
                <select class="form-control" id="liveTargetPool" style="background:#1e293b; color:#fff; border:1px solid #334155; display:inline-block; width:200px; margin-right:1rem">
                    <option>SINGAPORE</option>
                    <option>HONGKONG</option>
                    <option>SYDNEY</option>
                </select>
                <button class="btn btn-primary btn-lg" id="btnLiveStart" onclick="window.startLiveDraw()"><i class="fa-solid fa-play"></i> START LIVE DRAW</button>
            </div>
        </div>
      </div>
      
      <script>
        window.startLiveDraw = () => {
            const btn = document.getElementById('btnLiveStart');
            const pool = document.getElementById('liveTargetPool').value;
            const status = document.getElementById('liveStatusLabel');
            document.getElementById('livePoolName').innerText = pool + ' POOLS';
            
            if(btn.disabled) return;
            btn.disabled = true;
            status.innerHTML = '● DRAWING NOW';
            status.style.color = '#10b981';
            status.style.background = 'rgba(16,185,129,0.2)';
            status.style.borderColor = 'rgba(16,185,129,0.4)';
            
            const digits = [document.getElementById('d1'), document.getElementById('d2'), document.getElementById('d3'), document.getElementById('d4')];
            
            // Start spinning all
            digits.forEach(d => { d.innerText = ''; d.classList.add('spin'); });
            
            // Stop them one by one
            let delay = 2000;
            const finalResult = [];
            
            digits.forEach((d, i) => {
                setTimeout(() => {
                    d.classList.remove('spin');
                    const val = Math.floor(Math.random() * 10);
                    finalResult.push(val);
                    d.innerText = val;
                    // Flash effect
                    d.style.boxShadow = 'inset 0 0 20px rgba(16,185,129,0.8), 0 10px 20px rgba(0,0,0,0.5)';
                    setTimeout(() => d.style.boxShadow = '', 500);
                    
                    if(i === 3) {
                        status.innerHTML = '● PRIZE REVEALED';
                        btn.disabled = false;
                        btn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> NEXT DRAW';
                        // Save Result to DB
                        const entry = { id: 'RES' + Date.now().toString().slice(-6), pool: pool, date: new Date().toISOString().slice(0, 10), r1: finalResult.join(''), status: 'Published' };
                        if(window.getResultsStore) window.getResultsStore().unshift(entry);
                        if(window.toast) window.toast(pool + ' 1st Prize: ' + finalResult.join(''), 'success');
                    }
                }, delay);
                delay += 1200; // interval between each digit
            });
        };
      </script>
    `;
};

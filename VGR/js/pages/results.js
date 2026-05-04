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
      <div class="form-field"><label>Date</label><input id="edit_date" type="date" value="${(r.drawDate || r.date || '').slice(0,10)}"/></div>
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

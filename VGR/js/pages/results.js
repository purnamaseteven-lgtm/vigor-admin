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
                      ${r.status === 'Pending' ? `<button class="btn btn-sm btn-success" onclick="toast('Result published','success')"><i class="fa-solid fa-check"></i> Publish</button>` : ''}
                      <button class="btn btn-sm btn-icon" style="background:#f59e0b;color:#fff" onclick="toast('Edit result','info')"><i class="fa-solid fa-pen"></i></button>
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
              ${Array.from({ length: 8 }, (_, i) => `
                <tr>
                  <td><strong>BET${10000 + i}</strong></td>
                  <td>${MEMBERS[i % MEMBERS.length]}</td>
                  <td>${POOLS[i % POOLS.length]}</td>
                  <td style="font-weight:700">${rnd(1000, 9999)}</td>
                  <td>${fmtCur(rnd(1, 20) * 50000)}</td>
                  <td>${badge(i % 3 === 0 ? 'Win' : 'Lose', i % 3 === 0 ? 'success' : 'danger')}</td>
                  <td style="color:${i % 3 === 0 ? 'var(--green)' : 'var(--text3)'}">
                    ${i % 3 === 0 ? fmtCur(rnd(5, 50) * 100000) : '-'}
                  </td>
                  <td style="font-size:.75rem">${rnd(10, 23)}:${String(rnd(10, 59)).padStart(2, '0')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>`;
};

/* ─── RESULTS ANALYZE ─── */
pages['results-analyze'] = () => {
  const poolStats = POOLS.map(pool => ({
    pool,
    totalBets: rnd(500, 3000),
    totalPayout: rnd(10, 100) * 1000000,
    winRate: rnd(20, 45),
    profit: rnd(50, 500) * 1000000
  }));
  const topNumbers = Array.from({ length: 10 }, (_, i) => ({
    number: String(rnd(1000, 9999)),
    pool: POOLS[i % POOLS.length],
    frequency: rnd(5, 30),
    lastOut: `${rnd(20, 27)}/04/2026`
  }));

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

window.saveResultEntry = () => {
  const values = ['res_r1', 'res_r2', 'res_r3', 'res_r4', 'res_r5'].map(id => document.getElementById(id)?.value.trim());
  if (values.some(v => !/^\d{4}$/.test(v || ''))) {
    toast('All result fields must be 4 digits', 'error');
    return;
  }
  getResultsStore().unshift({
    id: 'RES' + Date.now().toString().slice(-6),
    pool: document.getElementById('res_pool')?.value || POOLS[0],
    date: document.getElementById('res_date')?.value || new Date().toISOString().slice(0, 10),
    period: document.getElementById('res_period')?.value || Date.now().toString().slice(-8),
    r1: values[0],
    r2: values[1],
    r3: values[2],
    r4: values[3],
    r5: values[4],
    status: document.getElementById('res_status')?.value || 'Pending',
    publishedBy: 'adminsub40'
  });
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

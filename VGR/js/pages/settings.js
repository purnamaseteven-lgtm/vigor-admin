/* ─── SETTINGS PAGES ─── */
import { STATE, addLog, fmtCur, fmt } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, tableWrap, badge, toast } from '../ui/components.js';
import { COMPANIES, rnd } from '../utils/helpers.js';

pages['settings-commission'] = () => {
  const activeTab = window._commActiveTab || 'company';

  return `
    ${pageHeader('Commission', '<span>Settings</span><span class="sep">›</span><span>Commission</span>')}
    
    <div class="card" style="margin-bottom:1.5rem">
        <div class="card-body" style="padding:0">
            <div style="display:flex; border-bottom:1px solid var(--border)">
                <div class="sc-tab ${activeTab === 'company' ? 'active' : ''}" style="padding:1rem 1.5rem; cursor:pointer; font-weight:700; border-bottom:3px solid ${activeTab === 'company' ? 'var(--acc)' : 'transparent'}; color:${activeTab === 'company' ? 'var(--acc)' : 'var(--text3)'}" onclick="window._commActiveTab='company';go('settings-commission')">Company Commission</div>
                <div class="sc-tab ${activeTab === 'whitelabel' ? 'active' : ''}" style="padding:1rem 1.5rem; cursor:pointer; font-weight:700; border-bottom:3px solid ${activeTab === 'whitelabel' ? 'var(--acc)' : 'transparent'}; color:${activeTab === 'whitelabel' ? 'var(--acc)' : 'var(--text3)'}" onclick="window._commActiveTab='whitelabel';go('settings-commission')">Whitelabel Commission</div>
                <div class="sc-tab ${activeTab === 'master' ? 'active' : ''}" style="padding:1rem 1.5rem; cursor:pointer; font-weight:700; border-bottom:3px solid ${activeTab === 'master' ? 'var(--acc)' : 'transparent'}; color:${activeTab === 'master' ? 'var(--acc)' : 'var(--text3)'}" onclick="window._commActiveTab='master';go('settings-commission')">Master Commission</div>
            </div>
            
            <div style="padding:1.5rem; display:flex; align-items:center; gap:1rem; border-bottom:1px solid var(--border)">
                <div style="flex:1; display:flex; align-items:center; border:1px solid var(--border); border-radius:6px; background:var(--bg2); padding:0 .75rem">
                    <i class="fa-solid fa-magnifying-glass" style="color:var(--text3)"></i>
                    <input type="text" class="form-control" placeholder="Username / Name" style="border:none; background:transparent">
                </div>
                <label style="display:flex; align-items:center; gap:.5rem; font-size:.85rem; cursor:pointer">
                    <input type="checkbox"> <span>Show Company/Whitelabel Inactive</span>
                </label>
                <button class="btn btn-primary"><i class="fa-solid fa-search"></i> Search</button>
            </div>
        </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Commission</span></div>
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>${activeTab === 'whitelabel' ? 'Whitelabel' : activeTab === 'master' ? 'Master WL' : 'Company'}</th>
                <th>Last Updated</th>
                <th style="text-align:right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${COMPANIES.slice(0, 15).map((c, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>
                    <div style="font-weight:700">${c}</div>
                    <div style="font-size:.72rem; color:var(--text3); text-transform:uppercase">${activeTab}${100 + i}</div>
                  </td>
                  <td>2${rnd(4, 7)}/04/2026</td>
                  <td style="text-align:right">
                    <button class="btn btn-sm btn-icon" style="background:var(--acc); color:#fff" onclick="toast('Edit commission for ${c}','info')"><i class="fa-solid fa-pen-to-square"></i></button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
      </div>
      <div class="card-footer" style="display:flex; justify-content:space-between; align-items:center">
          <select class="form-control" style="width:70px"><option>30</option><option>50</option></select>
          <div style="display:flex; gap:.25rem">
              <button class="btn btn-xs btn-primary">1</button>
              <button class="btn btn-xs btn-secondary">2</button>
              <button class="btn btn-xs btn-secondary">3</button>
              <button class="btn btn-xs btn-secondary">></button>
          </div>
      </div>
    </div>
  `;
};

pages['settings-pools'] = () => {
  const POOLS = ['4D Togel External', '4D Togel Vigor', '4D Togel Global', '6D Togel Vigor', 'SINGAPORE', 'HONGKONG', 'SYDNEY', 'PCSO', 'CAMBODIA', 'MAGNUM', 'DAMACAI', 'TOTO'];
  return `
    ${pageHeader('Pools Management', '<span>Settings</span><span class="sep">›</span><span>Pools</span>', `
      <button class="btn btn-primary" onclick="toast('Add pool','success')"><i class="fa-solid fa-plus"></i> Add Pool</button>`
  )}
    
    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Pool Name</th>
                <th>Code</th>
                <th>Draw Days</th>
                <th>Time (Close/Open)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${POOLS.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${p}</strong></td>
                  <td>${p.slice(0, 3)}</td>
                  <td>${['Mon,Wed,Thu,Sat', 'Everyday', 'Mon-Sat', 'Mon,Wed,Fri', 'Everyday', 'Wed,Sat', 'Wed,Sat', 'Wed,Sat'][i]}</td>
                  <td>18:00 / 10:00</td>
                  <td><label class="toggle"><input type="checkbox" ${i < 5 ? 'checked' : ''}/><div class="toggle-slider"></div></label></td>
                  <td>
                    <div class="action-btns">
                      <button class="btn btn-sm btn-icon" style="background:#f59e0b;color:#fff"><i class="fa-solid fa-pen"></i></button>
                      <button class="btn btn-sm btn-danger btn-icon"><i class="fa-solid fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>
  `;
};

pages['settings-limit-credit-out'] = () => {
  return `
    ${pageHeader('Limit Credit Out', '<span>Settings</span><span class="sep">›</span><span>Limit Credit Out</span>')}
    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Agent</th>
                <th>Current Credit</th>
                <th>Limit</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${COMPANIES.map((c, i) => {
    const limit = rnd(5, 50) * 1000000;
    const cur = Math.round(limit * (rnd(30, 110) / 100));
    const pct = Math.round(cur / limit * 100);
    return `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${c}</td>
                    <td>${fmtCur(cur)}</td>
                    <td>${fmtCur(limit)}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:.5rem">
                        <div style="flex:1;height:6px;background:var(--border);border-radius:3px">
                          <div style="width:${Math.min(pct, 100)}%;height:100%;background:${pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--yellow)' : 'var(--green)'};border-radius:3px"></div>
                        </div>
                        <span style="font-size:.7rem">${pct}%</span>
                      </div>
                    </td>
                    <td>${badge(pct > 100 ? 'Blocked' : pct > 90 ? 'Warning' : 'OK', pct > 100 ? 'danger' : pct > 90 ? 'warning' : 'success')}</td>
                    <td><button class="btn btn-sm btn-primary" onclick="toast('Credit updated','success')"><i class="fa-solid fa-pen"></i></button></td>
                  </tr>`;
  }).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>
  `;
};

/* ─── REFERRAL RATE ─── */
pages['settings-referral-rate'] = () => {
  return `
    ${pageHeader('Referral Rate Settings', '<span>Settings</span><span class="sep">›</span><span>Referral Rate</span>', `
      <button class="btn btn-primary" onclick="window.saveReferralSettings()"><i class="fa-solid fa-check"></i> Save Settings</button>`)}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fa-solid fa-share-nodes" style="color:var(--acc)"></i> Global Referral Configuration</span></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:1rem">
            ${[
      ['Default Referral Rate', 'settReferral', STATE.settings.referral, '%', 'Commission for direct referral'],
      ['Slot Game Rate', 'settRefSlot', STATE.settings.referralSlot, '%', 'Extra commission from slot bets'],
    ].map(([label, id, val, unit, note]) => `
              <div style="display:grid;grid-template-columns:200px 1fr;align-items:center;gap:1rem;padding:.75rem 0;border-bottom:1px solid var(--border)">
                <div>
                  <div style="font-weight:600;font-size:.85rem">${label}</div>
                  <div style="font-size:.72rem;color:var(--text3)">${note}</div>
                </div>
                <div style="display:flex;align-items:center;gap:.5rem">
                  <input type="number" id="${id}" value="${val}" min="0" max="100" step="0.5" style="width:80px;border:1px solid var(--border);border-radius:6px;padding:.35rem .5rem;font-size:.9rem;outline:none"/>
                  <span style="color:var(--text3)">${unit}</span>
                </div>
              </div>
            `).join('')}
            <div style="display:grid;grid-template-columns:200px 1fr;align-items:center;gap:1rem;padding:.75rem 0">
              <div>
                <div style="font-weight:600;font-size:.85rem">Multi-level Referral</div>
                <div style="font-size:.72rem;color:var(--text3)">Enable multi-tier referral system</div>
              </div>
              <label class="toggle"><input type="checkbox" id="settRefMulti" checked/><div class="toggle-slider"></div></label>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Referral Tier Structure</span></div>
        <div class="card-body">
          ${tableWrap(`
            <table>
              <thead><tr><th>Level</th><th>Rate</th><th>Min. Deposit</th><th>Status</th></tr></thead>
              <tbody>
                ${[['Level 1 (Direct)', '2%', 'Rp 25.000', true], ['Level 2', '0.5%', 'Rp 25.000', true], ['Level 3', '0.25%', 'Rp 50.000', false]].map(([level, rate, dep, active]) => `
                  <tr>
                    <td><strong>${level}</strong></td>
                    <td style="color:var(--green);font-weight:700">${rate}</td>
                    <td>${dep}</td>
                    <td>${badge(active ? 'Active' : 'Inactive', active ? 'success' : 'danger')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `)}
        </div>
      </div>

      <div class="card" style="grid-column:1/-1">
        <div class="card-header"><span class="card-title">Company Referral Rates</span></div>
        <div class="card-body">
          ${tableWrap(`
            <table>
              <thead><tr><th>#</th><th>Company</th><th>Referral Rate</th><th>Slot Rate</th><th>Status</th><th>Active Referrals</th><th>Total Earned</th><th>Action</th></tr></thead>
              <tbody>
                ${COMPANIES.map((c, i) => {
      const active = STATE.settings.companyReferralStatus[c] !== false;
      return `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${c}</strong></td>
                    <td>${STATE.settings.referral}%</td>
                    <td>${STATE.settings.referralSlot}%</td>
                    <td>
                      <label class="toggle">
                        <input type="checkbox" ${active ? 'checked' : ''} onchange="window.toggleCompanyReferrer('${c}', this.checked)"/>
                        <div class="toggle-slider"></div>
                      </label>
                    </td>
                    <td>${rnd(5, 80)}</td>
                    <td style="color:var(--green);font-weight:600">${fmtCur(rnd(1, 50) * 100000)}</td>
                    <td><button class="btn btn-sm btn-primary" onclick="toast('Edit ${c} referral','info')"><i class="fa-solid fa-pen"></i></button></td>
                  </tr>`;
    }).join('')}
              </tbody>
            </table>
          `)}
        </div>
      </div>
    </div>`;
};

/* ─── SETTINGS GAMES ─── */
pages['settings-games'] = () => {
  const GAME_PROVIDERS = ['PRAGMATIC PLAY', 'HABANERO', 'MICROGAMING', 'SBOBET', 'EVOLUTION', 'JOKER', 'SPADEGAMING', 'PG SOFT'];
  const gameSettings = GAME_PROVIDERS.map((p, i) => ({
    provider: p, enabled: i !== 3, minBet: rnd(1, 5) * 10000, maxBet: rnd(10, 100) * 1000000,
    rtp: (94 + Math.random() * 4).toFixed(1), games: rnd(20, 200), maintenance: i === 3
  }));

  return `
    ${pageHeader('Games Settings', '<span>Settings</span><span class="sep">›</span><span>Games</span>', `
      <button class="btn btn-primary" onclick="toast('Settings saved','success')"><i class="fa-solid fa-check"></i> Save All</button>`)}

    <div class="card">
      <div class="card-header"><span class="card-title">Provider Configuration</span></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem">
          ${gameSettings.map(g => `
            <div style="border:1px solid var(--border);border-radius:10px;padding:1rem;background:var(--bg2);${g.maintenance ? 'border-color:var(--yellow);' : g.enabled ? 'border-color:rgba(16,185,129,.3)' : 'border-color:rgba(239,68,68,.3)'}">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
                <strong>${g.provider}</strong>
                <label class="toggle"><input type="checkbox" ${g.enabled ? 'checked' : ''} onchange="toast('${g.provider} '+(this.checked?'enabled':'disabled'),'success')"/><div class="toggle-slider"></div></label>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;font-size:.78rem">
                <div><span style="color:var(--text3)">Games:</span> <strong>${g.games}</strong></div>
                <div><span style="color:var(--text3)">RTP:</span> <strong>${g.rtp}%</strong></div>
                <div><span style="color:var(--text3)">Min Bet:</span> <strong>${fmtCur(g.minBet)}</strong></div>
                <div><span style="color:var(--text3)">Max Bet:</span> <strong>${fmtCur(g.maxBet)}</strong></div>
              </div>
              ${g.maintenance ? `<div style="margin-top:.6rem">${badge('Maintenance', 'warning')}</div>` : ''}
              <button class="btn btn-sm btn-primary" style="width:100%;margin-top:.75rem" onclick="toast('Edit ${g.provider} settings','info')"><i class="fa-solid fa-gear"></i> Configure</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
};

/* ─── AGENT GAME SETTINGS ─── */
pages['settings-agent-games'] = () => {
  const GAME_TYPES = ['Slot', 'Casino Live', 'Sportsbook', 'Togel', 'Poker', 'Cockfight', 'Crash', 'Fishing'];

  return `
    ${pageHeader('Agent Game Settings', '<span>Settings</span><span class="sep">›</span><span>Agent Game Settings</span>', `
      <button class="btn btn-primary" onclick="toast('Agent settings saved','success')"><i class="fa-solid fa-check"></i> Save Changes</button>`)}

    <div style="display:grid;grid-template-columns:260px 1fr;gap:1.25rem">
      <div class="card">
        <div class="card-header"><span class="card-title">Select Company</span></div>
        <div class="card-body" style="padding:.5rem;max-height:500px;overflow-y:auto">
          ${COMPANIES.map((c, i) => `
            <div onclick="toast('Showing settings for ${c}','info')" style="padding:.65rem .75rem;border-radius:7px;cursor:pointer;font-size:.83rem;font-weight:600;margin-bottom:.2rem;${i === 0 ? 'background:rgba(14,165,233,.15);color:var(--acc)' : ''}">
              ${c}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title">Game Access — <span style="color:var(--acc)">vigor88</span></span></div>
        <div class="card-body">
          ${tableWrap(`
            <table>
              <thead><tr><th>#</th><th>Game Type</th><th>Access</th><th>Min Bet</th><th>Max Bet</th><th>Commission</th><th>Action</th></tr></thead>
              <tbody>
                ${GAME_TYPES.map((g, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${g}</strong></td>
                    <td>
                      <label class="toggle"><input type="checkbox" ${i < 6 ? 'checked' : ''} onchange="toast('${g} '+(this.checked?'enabled':'disabled'),'success')"/><div class="toggle-slider"></div></label>
                    </td>
                    <td>${fmtCur(rnd(1, 5) * 10000)}</td>
                    <td>${fmtCur(rnd(1, 10) * 1000000)}</td>
                    <td>${rnd(1, 5)}%</td>
                    <td><button class="btn btn-sm btn-primary" onclick="toast('Edit ${g}','info')"><i class="fa-solid fa-pen"></i></button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `)}
        </div>
      </div>
    </div>`;
};

/* ─── TOGEL COMMISSION ─── */
pages['settings-togel-commission'] = () => {
  const POOLS = ['4D Togel External', '4D Togel Vigor', '4D Togel Global', '6D Togel Vigor', 'SINGAPORE', 'HONGKONG', 'SYDNEY', 'PCSO', 'CAMBODIA', 'MAGNUM', 'DAMACAI', 'TOTO'];
  const BET_TYPES = ['4D', '3D', '2D', 'Colok Bebas', 'Colok Macau', 'Colok Naga', 'Colok Jitu', '50-50', 'Kombinasi / BB', 'Shio'];
  const commissions = POOLS.flatMap(pool =>
    BET_TYPES.map(bet => ({
      pool, bet, disc: rnd(25, 70), prize4d: rnd(3000, 5000),
      prize3d: rnd(300, 500), prize2d: rnd(50, 100)
    }))
  ).slice(0, 24);

  return `
    ${pageHeader('Togel Commission Settings', '<span>Settings</span><span class="sep">›</span><span>Togel Commission</span>', `
      <button class="btn btn-primary" onclick="toast('Togel settings saved','success')"><i class="fa-solid fa-check"></i> Save All</button>`)}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
      <div class="card">
        <div class="card-header"><span class="card-title">Default Commission Structure</span></div>
        <div class="card-body">
          ${tableWrap(`
            <table>
              <thead><tr><th>Bet Type</th><th>Discount</th><th>Prize 4D</th><th>Prize 3D</th><th>Prize 2D</th></tr></thead>
              <tbody>
                ${BET_TYPES.map((bet, i) => `
                  <tr>
                    <td><strong>${bet}</strong></td>
                    <td>${rnd(25, 70)}%</td>
                    <td>${fmt(rnd(3000, 5000))}</td>
                    <td>${fmt(rnd(300, 500))}</td>
                    <td>${fmt(rnd(50, 100))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `)}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">Pool-specific Overrides</span></div>
        <div class="card-body">
          ${tableWrap(`
            <table>
              <thead><tr><th>Pool</th><th>Override Disc.</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                ${POOLS.map((pool, i) => `
                  <tr>
                    <td><strong>${pool}</strong></td>
                    <td>${i < 4 ? `<input type="number" value="${rnd(30, 65)}" min="0" max="100" style="width:60px;border:1px solid var(--border);border-radius:6px;padding:.2rem .4rem;font-size:.82rem;outline:none"/>%` : '<span style="color:var(--text3)">Default</span>'}</td>
                    <td>${badge(i !== 5 ? 'Active' : 'Inactive', i !== 5 ? 'success' : 'danger')}</td>
                    <td><button class="btn btn-sm btn-primary" onclick="toast('Edit ${pool}','info')"><i class="fa-solid fa-pen"></i></button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `)}
        </div>
      </div>
    </div>`;
};

/* ─── ACTIONS ─── */
export function saveSettingsCommission() {
  const v = parseInt(document.getElementById('settCommission')?.value);
  if (isNaN(v) || v < 0 || v > 100) { toast('Invalid commission value (0-100)', 'error'); return; }
  STATE.settings.commission = v;
  addLog('Update Settings', 'commission', `Default commission set to ${v}%`);
  if (window.db?.dbSaveSetting) window.db.dbSaveSetting('commission', v);
  toast(`Default commission updated to ${v}%!`, 'success');
}

window.saveSettingsCommission = saveSettingsCommission;

window.saveReferralSettings = async () => {
  const ref = parseFloat(document.getElementById('settReferral')?.value);
  const slot = parseFloat(document.getElementById('settRefSlot')?.value);
  if (!isNaN(ref)) { STATE.settings.referral = ref; if (window.db?.dbSaveSetting) await window.db.dbSaveSetting('referral', ref); }
  if (!isNaN(slot)) { STATE.settings.referralSlot = slot; if (window.db?.dbSaveSetting) await window.db.dbSaveSetting('referral_slot', slot); }
  addLog('Update Settings', 'referral', `Referral rate set to ${ref}%`);
  toast('Referral settings saved!', 'success');
};

window.toggleCompanyReferrer = (company, checked) => {
  STATE.settings.companyReferralStatus[company] = checked;
  addLog('Update Settings', `Referral: ${company}`, `${company} referral switched ${checked ? 'ON' : 'OFF'}`);
  if (window.db?.dbSaveSetting) window.db.dbSaveSetting(`referral_company_${company}`, checked ? '1' : '0');
  toast(`${company} referral system ${checked ? 'Activated' : 'Deactivated'}`, checked ? 'success' : 'warning');
};

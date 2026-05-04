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
                <th>Commission Rate</th>
                <th>Last Updated</th>
                <th style="text-align:right">Action</th>
              </tr>
            </thead>
            <tbody>
              ${(STATE.companies.length > 0 ? STATE.companies : COMPANIES.slice(0, 15).map((c, i) => ({ username: c, id: `C${i}`, updated_at: null }))).map((c, i) => {
                const name = c.username || c.name || c;
                const commKey = `commission_${activeTab}_${name}`;
                const commVal = STATE.settings?.[commKey] || STATE.settings?.['commission_rate'] || '5';
                const updatedAt = c.updated_at ? new Date(c.updated_at).toLocaleDateString('id-ID') : '-';
                return `
                <tr>
                  <td>${i + 1}</td>
                  <td>
                    <div style="font-weight:700">${name}</div>
                    <div style="font-size:.72rem; color:var(--text3)">${c.type || activeTab} · ${c.status || 'Active'}</div>
                  </td>
                  <td style="font-size:.78rem;font-weight:600;color:var(--acc)">${commVal}%</td>
                  <td style="font-size:.75rem;color:var(--text3)">${updatedAt}</td>
                  <td style="text-align:right">
                    <button class="btn btn-sm btn-icon" style="background:var(--acc); color:#fff" onclick="window.editCommission('${name}','${activeTab}','${commVal}')"><i class="fa-solid fa-pen-to-square"></i></button>
                  </td>
                </tr>`;
              }).join('')}
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
              ${(STATE.companies.length ? STATE.companies : COMPANIES.map(name => ({ name, credit: 0 }))).map((co, i) => {
    const name = co.name || co;
    const defaultLimit = Number(STATE.settings.defaultCreditLimit) || 50000000;
    const limit = defaultLimit;
    const cur = co.credit || 0;
    const pct = limit > 0 ? Math.round(cur / limit * 100) : 0;
    return `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${name}</td>
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
      const companyMembers = STATE.members.filter(m => m.company === c);
      const activeReferrals = companyMembers.filter(m => m.referredBy).length;
      const totalEarned = (STATE.bonuses || [])
        .filter(b => b.company === c && b.type === 'Referral' && b.status === 'Approved')
        .reduce((s, b) => s + (b.bonusAmount || 0), 0);
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
                    <td>${activeReferrals}</td>
                    <td style="color:var(--green);font-weight:600">${fmtCur(totalEarned)}</td>
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
  // Aggregate real game counts per provider from STATE.seamless.games
  const seamlessGames = STATE.seamless?.games || [];
  const gameSettings = GAME_PROVIDERS.map((p, i) => {
    const provGames = seamlessGames.filter(g => (g.provider || '').toUpperCase().includes(p.split(' ')[0]));
    const cfg = STATE.settings['game_config_' + p.replace(/ /g, '_').toLowerCase()] || {};
    return {
      provider: p,
      enabled: cfg.enabled !== false && i !== 3,
      minBet: Number(cfg.minBet) || (i + 1) * 10000,
      maxBet: Number(cfg.maxBet) || (i + 1) * 10 * 1000000,
      rtp: cfg.rtp || '95.0',
      games: provGames.length || seamlessGames.length,
      maintenance: cfg.maintenance || (i === 3),
    };
  });

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
                ${GAME_TYPES.map((g, i) => {
                  const key = 'agent_game_' + g.replace(/ /g, '_').toLowerCase();
                  const cfg = STATE.settings[key] || {};
                  const minBet = Number(cfg.minBet) || (i + 1) * 10000;
                  const maxBet = Number(cfg.maxBet) || (i + 1) * 1000000;
                  const commission = cfg.commission || (i + 1) + '%';
                  return `
                  <tr>
                    <td>${i + 1}</td>
                    <td><strong>${g}</strong></td>
                    <td>
                      <label class="toggle"><input type="checkbox" ${cfg.enabled !== false && i < 6 ? 'checked' : ''} onchange="toast('${g} '+(this.checked?'enabled':'disabled'),'success')"/><div class="toggle-slider"></div></label>
                    </td>
                    <td>${fmtCur(minBet)}</td>
                    <td>${fmtCur(maxBet)}</td>
                    <td>${commission}</td>
                    <td><button class="btn btn-sm btn-primary" onclick="toast('Edit ${g}','info')"><i class="fa-solid fa-pen"></i></button></td>
                  </tr>`;
                }).join('')}
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
    BET_TYPES.map(bet => {
      const key = `togel_${pool.replace(/ /g,'_').toLowerCase()}_${bet.replace(/ /g,'_').toLowerCase()}`;
      const cfg = STATE.settings[key] || {};
      return {
        pool, bet,
        disc: Number(cfg.disc) || 0,
        prize4d: Number(cfg.prize4d) || 0,
        prize3d: Number(cfg.prize3d) || 0,
        prize2d: Number(cfg.prize2d) || 0,
      };
    })
  ).slice(0, 24);

  return `
    ${pageHeader('Togel Commission Settings', '<span>Settings</span><span class="sep">›</span><span>Togel Commission</span>', `
      <button class="btn btn-primary" onclick="window.saveTogelCommissionAll()"><i class="fa-solid fa-check"></i> Save All</button>`)}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem">
      <div class="card">
        <div class="card-header"><span class="card-title">Default Commission Structure</span></div>
        <div class="card-body">
          ${tableWrap(`
            <table>
              <thead><tr><th>Bet Type</th><th>Discount</th><th>Prize 4D</th><th>Prize 3D</th><th>Prize 2D</th></tr></thead>
              <tbody>
                ${BET_TYPES.map((bet) => {
                  const key = `togel_default_${bet.replace(/ /g,'_').toLowerCase()}`;
                  const cfg = STATE.settings[key] || {};
                  return `
                  <tr>
                    <td><strong>${bet}</strong></td>
                    <td>${cfg.disc || 0}%</td>
                    <td>${fmt(cfg.prize4d || 0)}</td>
                    <td>${fmt(cfg.prize3d || 0)}</td>
                    <td>${fmt(cfg.prize2d || 0)}</td>
                  </tr>`;
                }).join('')}
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
                ${POOLS.map((pool, i) => {
                  const key = `togel_pool_override_${pool.replace(/ /g,'_').toLowerCase()}`;
                  const cfg = STATE.settings[key] || {};
                  const hasOverride = cfg.disc !== undefined;
                  const active = cfg.active !== false && i !== 5;
                  return `
                  <tr>
                    <td><strong>${pool}</strong></td>
                    <td>${hasOverride || i < 4 ? `<input type="number" value="${cfg.disc || 0}" min="0" max="100" style="width:60px;border:1px solid var(--border);border-radius:6px;padding:.2rem .4rem;font-size:.82rem;outline:none"/>%` : '<span style="color:var(--text3)">Default</span>'}</td>
                    <td>${badge(active ? 'Active' : 'Inactive', active ? 'success' : 'danger')}</td>
                    <td><button class="btn btn-sm btn-primary" onclick="toast('Edit ${pool}','info')"><i class="fa-solid fa-pen"></i></button></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          `)}
        </div>
      </div>
    </div>`;
};

/* ─── FINANCE LIMITS PAGE ─── */
pages['settings-finance'] = () => {
  const s = STATE.settings;
  return `
    ${pageHeader('Finance Limits & System', '<span>Settings</span><span class="sep">›</span><span>Finance Limits</span>', `
      <button class="btn btn-primary" onclick="window.saveFinanceSettings()"><i class="fa-solid fa-check"></i> Save Settings</button>`)}

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fa-solid fa-money-bill-wave" style="color:var(--green)"></i> Deposit Limits</span></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:1rem">
          ${[
            ['Minimum Deposit', 'sf_min_dep', s.minDeposit, 'Rp', 'Minimum amount per deposit transaction'],
            ['Maximum Deposit', 'sf_max_dep', s.maxDeposit, 'Rp', 'Maximum amount per deposit transaction'],
          ].map(([label, id, val, unit, note]) => `
            <div style="display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:1rem;padding:.75rem 0;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-weight:600;font-size:.85rem">${label}</div>
                <div style="font-size:.72rem;color:var(--text3)">${note}</div>
              </div>
              <div style="display:flex;align-items:center;gap:.5rem">
                <span style="color:var(--text3);font-size:.8rem">${unit}</span>
                <input type="number" id="${id}" value="${val}" min="0" style="flex:1;border:1px solid var(--border);border-radius:6px;padding:.35rem .5rem;font-size:.9rem;outline:none;background:var(--bg2);color:var(--text)"/>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fa-solid fa-money-bill-transfer" style="color:var(--yellow)"></i> Withdrawal Limits</span></div>
        <div class="card-body" style="display:flex;flex-direction:column;gap:1rem">
          ${[
            ['Maximum Withdrawal', 'sf_max_wd', s.maxWithdraw, 'Rp', 'Maximum amount per withdrawal transaction'],
            ['Daily Withdrawal Limit', 'sf_daily_wd', s.dailyWithdrawLimit || s.maxWithdraw * 2, 'Rp', 'Maximum total withdrawal per day per member'],
          ].map(([label, id, val, unit, note]) => `
            <div style="display:grid;grid-template-columns:1fr 1fr;align-items:center;gap:1rem;padding:.75rem 0;border-bottom:1px solid var(--border)">
              <div>
                <div style="font-weight:600;font-size:.85rem">${label}</div>
                <div style="font-size:.72rem;color:var(--text3)">${note}</div>
              </div>
              <div style="display:flex;align-items:center;gap:.5rem">
                <span style="color:var(--text3);font-size:.8rem">${unit}</span>
                <input type="number" id="${id}" value="${val}" min="0" style="flex:1;border:1px solid var(--border);border-radius:6px;padding:.35rem .5rem;font-size:.9rem;outline:none;background:var(--bg2);color:var(--text)"/>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="card" style="grid-column:1/-1">
        <div class="card-header"><span class="card-title"><i class="fa-solid fa-shield-halved" style="color:var(--acc)"></i> System Mode</span></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1.5rem">
            <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
              <div>
                <div style="font-weight:700">Maintenance Mode</div>
                <div style="font-size:.75rem;color:var(--text3);margin-top:.2rem">Block all player access to the platform</div>
              </div>
              <label class="toggle">
                <input type="checkbox" id="sf_maintenance" ${s.maintenanceMode ? 'checked' : ''}/>
                <div class="toggle-slider"></div>
              </label>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
              <div>
                <div style="font-weight:700">Registration Open</div>
                <div style="font-size:.75rem;color:var(--text3);margin-top:.2rem">Allow new member registrations</div>
              </div>
              <label class="toggle">
                <input type="checkbox" id="sf_registration" ${s.registrationOpen !== false ? 'checked' : ''}/>
                <div class="toggle-slider"></div>
              </label>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
              <div>
                <div style="font-weight:700">Auto-Approve Deposits</div>
                <div style="font-size:.75rem;color:var(--text3);margin-top:.2rem">Automatically approve matching deposits</div>
              </div>
              <label class="toggle">
                <input type="checkbox" id="sf_auto_dep" ${s.autoApproveDeposit ? 'checked' : ''}/>
                <div class="toggle-slider"></div>
              </label>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:1rem;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
              <div>
                <div style="font-weight:700">Manual Withdrawal Review</div>
                <div style="font-size:.75rem;color:var(--text3);margin-top:.2rem">All withdrawals require manual approval</div>
              </div>
              <label class="toggle">
                <input type="checkbox" id="sf_manual_wd" ${s.manualWithdrawReview !== false ? 'checked' : ''}/>
                <div class="toggle-slider"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
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

window.saveFinanceSettings = async () => {
  const minDep   = parseInt(document.getElementById('sf_min_dep')?.value);
  const maxDep   = parseInt(document.getElementById('sf_max_dep')?.value);
  const maxWd    = parseInt(document.getElementById('sf_max_wd')?.value);
  const dailyWd  = parseInt(document.getElementById('sf_daily_wd')?.value);
  const maint    = document.getElementById('sf_maintenance')?.checked;
  const regOpen  = document.getElementById('sf_registration')?.checked;
  const autoDep  = document.getElementById('sf_auto_dep')?.checked;
  const manualWd = document.getElementById('sf_manual_wd')?.checked;

  if (!isNaN(minDep)) STATE.settings.minDeposit = minDep;
  if (!isNaN(maxDep)) STATE.settings.maxDeposit = maxDep;
  if (!isNaN(maxWd))  STATE.settings.maxWithdraw = maxWd;
  if (!isNaN(dailyWd)) STATE.settings.dailyWithdrawLimit = dailyWd;
  STATE.settings.maintenanceMode  = maint;
  STATE.settings.registrationOpen = regOpen;
  STATE.settings.autoApproveDeposit  = autoDep;
  STATE.settings.manualWithdrawReview = manualWd;

  if (window.db?.dbSaveSetting) {
    await Promise.all([
      window.db.dbSaveSetting('min_deposit',    minDep),
      window.db.dbSaveSetting('max_deposit',    maxDep),
      window.db.dbSaveSetting('max_withdraw',   maxWd),
      window.db.dbSaveSetting('daily_withdraw_limit', dailyWd),
      window.db.dbSaveSetting('maintenance_mode', maint ? 'true' : 'false'),
      window.db.dbSaveSetting('registration_open', regOpen ? 'true' : 'false'),
      window.db.dbSaveSetting('auto_approve_deposit', autoDep ? 'true' : 'false'),
      window.db.dbSaveSetting('manual_withdraw_review', manualWd ? 'true' : 'false'),
    ]);
  }

  addLog('Update Settings', 'finance', `Finance limits updated — min:${minDep} max_dep:${maxDep} max_wd:${maxWd}`);
  toast('Finance settings saved!', 'success');
};

// ── Commission editor ────────────────────────────────────────────────
window.editCommission = (company, tab, currentVal) => {
  const { openModal, closeModalBtn } = window;
  openModal(`Edit Commission — ${company}`, `
    <div class="form-grid">
      <div class="form-field" style="grid-column:1/-1">
        <label>Commission Rate for <strong>${company}</strong> (${tab})</label>
        <div style="display:flex;align-items:center;gap:.5rem">
          <input id="comm_val" type="number" class="form-control" value="${currentVal}" min="0" max="100" step="0.1" style="width:120px" />
          <span style="font-weight:700;font-size:1.1rem">%</span>
        </div>
        <div style="font-size:.75rem;color:var(--text3);margin-top:.3rem">Enter commission percentage (0–100)</div>
      </div>
    </div>
  `, `
    <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
    <button class="btn btn-primary" onclick="window.saveCommission('${company}','${tab}')">Save</button>
  `);
};

window.saveCommission = async (company, tab) => {
  const val = parseFloat(document.getElementById('comm_val')?.value || '5');
  if (isNaN(val) || val < 0 || val > 100) { toast('Invalid rate (0–100)', 'error'); return; }
  const key = `commission_${tab}_${company}`;
  if (!STATE.settings) STATE.settings = {};
  STATE.settings[key] = String(val);
  if (window.db?.dbSaveSetting) {
    const { error } = await window.db.dbSaveSetting(key, String(val));
    if (error) { toast('Save failed: ' + error.message, 'error'); return; }
    if (window.db?.dbWriteLog) window.db.dbWriteLog('Update Commission', company, `Commission for ${company} (${tab}) set to ${val}%`);
  }
  if (typeof closeModalBtn === 'function') closeModalBtn();
  toast(`Commission for ${company} saved: ${val}%`, 'success');
  window.go('settings-commission');
};

/* ─── TOGEL COMMISSION SAVE ALL ─── */
window.saveTogelCommissionAll = async () => {
  const BET_TYPES = ['4D', '3D', '2D', 'Colok Bebas', 'Colok Macau', 'Colok Naga', 'Colok Jitu', '50-50', 'Kombinasi / BB', 'Shio'];
  const POOLS = ['4D Togel External', '4D Togel Vigor', '4D Togel Global', '6D Togel Vigor', 'SINGAPORE', 'HONGKONG', 'SYDNEY', 'PCSO', 'CAMBODIA', 'MAGNUM', 'DAMACAI', 'TOTO'];

  // Read pool override inputs (first 4 pools have override discount inputs)
  const poolOverrides = {};
  POOLS.slice(0, 4).forEach((pool, i) => {
    const inputs = document.querySelectorAll('.pool-override-disc');
    if (inputs[i]) {
      const key = `togel_pool_override_${pool.replace(/ /g,'_').toLowerCase()}`;
      poolOverrides[key] = { disc: Number(inputs[i].value), active: true };
    }
  });

  const saves = Object.entries(poolOverrides).map(([key, val]) => {
    STATE.settings[key] = val;
    return window.db?.dbSaveSetting ? window.db.dbSaveSetting(key, JSON.stringify(val)) : Promise.resolve();
  });

  await Promise.all(saves);
  saveState();
  toast('Togel commission settings saved ✓', 'success');
};

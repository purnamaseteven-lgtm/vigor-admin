/* CUSTOMIZATION PAGES */
import { STATE, stateAdd, stateDelete, saveState, applyTheme } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsSelect, fsActions, tableWrap, badge, actionBtns, renderPagerHTML, toast, openModal, closeModalBtn, closeModal, confirmAction } from '../ui/components.js';
import { WIDGET_DEFS, WIDGET_CATS } from '../widgets/definitions.js';
import { rnd, filterData, paginate, getCurPage, getPerPage } from '../utils/helpers.js';
import { LAYOUTS, builderState } from '../builder/engine.js';

function ensureCustomizationState() {
    if (!STATE.siteConfig) {
        STATE.siteConfig = {
            siteName: 'VIGOR Gaming',
            siteUrl: 'https://vigor.gaming',
            registrationOpen: true,
            maintenanceMode: false,
        };
    }
    if (!Array.isArray(STATE.banners) || STATE.banners.length === 0) {
        STATE.banners = Array.from({ length: 4 }, (_, i) => ({
            id: 'BNR' + (100 + i),
            title: ['Welcome Bonus', 'Mega Jackpot', 'New Provider', 'VIP Exclusive'][i],
            type: ['Main', 'Popup', 'Marquee', 'Main'][i],
            target: ['All', 'New Member', 'VIP', 'All'][i],
            order: i + 1,
            status: i < 3 ? 'Active' : 'Inactive',
            created: `${rnd(20, 27)}/04/2026`
        }));
    }
}

ensureCustomizationState();

// --- SITE CONFIG ---
// --- SITE CONFIG (Overhauled with Tabs) ---
pages['custom-site-config'] = () => {
    const activeTab = window._scActiveTab || 'favicon';

    return `
    <style>
        .sc-tabs { display: flex; gap: 1rem; border-bottom: 2px solid var(--border); margin-bottom: 2rem; padding-bottom: 0; }
        .sc-tab { padding: 1rem 1.5rem; cursor: pointer; font-weight: 700; color: var(--text3); border-bottom: 3px solid transparent; transition: all 0.2s; margin-bottom: -2px; }
        .sc-tab.active { color: var(--acc); border-color: var(--acc); }
        .sc-tab:hover:not(.active) { color: var(--text1); }
    </style>

    ${pageHeader('Site Config', '<span>Customization</span><span class="sep">›</span><span>Site Config</span>')}
    
    <div class="sc-tabs">
        <div class="sc-tab ${activeTab === 'favicon' ? 'active' : ''}" onclick="window._scActiveTab='favicon';go('custom-site-config')">Favicon</div>
        <div class="sc-tab ${activeTab === 'app-logo' ? 'active' : ''}" onclick="window._scActiveTab='app-logo';go('custom-site-config')">App Logo</div>
        <div class="sc-tab ${activeTab === 'app-list' ? 'active' : ''}" onclick="window._scActiveTab='app-list';go('custom-site-config')">App List</div>
    </div>

    ${activeTab === 'app-list' ? renderAppListTab() : renderConfigTab(activeTab)}
    `;
};

function renderAppListTab() {
    return `
    <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <div style="display:flex; gap:1rem; align-items:center">
                <input class="form-control" placeholder="Search Company..." style="width:300px" />
                <button class="btn btn-primary">Submit</button>
                <button class="btn btn-secondary">Reset</button>
            </div>
        </div>
        <div class="card-body">
            ${tableWrap(`
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Company</th>
                            <th>Link</th>
                            <th>Message</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Array.from({ length: 8 }).map((_, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td><strong>Company ${100 + i}</strong><br/><small>ID: ${2000 + i}</small></td>
                                <td><a href="#" style="color:var(--acc)">https://link-${i}.com</a></td>
                                <td style="max-width:300px; font-size:.75rem; color:var(--text3)">The application is not available right now. Please try again later.</td>
                                <td>${badge('Inactive', 'danger')}</td>
                                <td><button class="btn btn-primary btn-xs"><i class="fa-solid fa-pen-to-square"></i> Update</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `)}
        </div>
    </div>`;
}

function renderConfigTab(tab) {
    return `
    <div class="card" style="max-width:800px">
        <div class="card-body">
            <div style="text-align:center; padding:3rem; border:2px dashed var(--border); border-radius:12px; background:var(--bg2)">
                <i class="fa-solid fa-cloud-arrow-up fa-3x" style="color:var(--text3); margin-bottom:1.5rem"></i>
                <h3 style="margin-bottom:.5rem">Upload ${tab === 'favicon' ? 'Favicon' : 'Logo'}</h3>
                <p style="color:var(--text3); font-size:.85rem; margin-bottom:2rem">Drag and drop your file here, or click to browse.</p>
                <button class="btn btn-primary">Choose File</button>
            </div>
            <div style="margin-top:2rem; display:flex; justify-content:flex-end">
                <button class="btn btn-success" onclick="toast('Settings saved','success')">Save Changes</button>
            </div>
        </div>
    </div>`;
}

// --- THEME & BRANDING ---
pages['custom-theme'] = () => {
    const t = STATE.theme;
    const presets = [
        { id: 'midnight', name: 'Midnight Blue', primary: '#0ea5e9', accent: '#8b5cf6', radius: '10px', font: 'Segoe UI' },
        { id: 'emerald', name: 'Emerald Forest', primary: '#10b981', accent: '#34d399', radius: '4px', font: 'Inter' },
        { id: 'gold', name: 'Royal Gold', primary: '#facc15', accent: '#fbbf24', radius: '0px', font: 'Georgia' },
        { id: 'cyber', name: 'Cyberpunk', primary: '#f472b6', accent: '#2dd4bf', radius: '20px', font: 'Rajdhani' }
    ];

    return `
    ${pageHeader('Branding & Theme', '<span>Customization</span><span class="sep">›</span><span>Theme Designer</span>')}
    <div style="display:grid;grid-template-columns:1fr 340px;gap:2rem">
      <div style="display:flex;flex-direction:column;gap:1.5rem">
        <div class="card">
          <div class="card-header"><span class="card-title">Global Colors</span></div>
          <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
            <div class="form-group">
                <label class="form-label">Primary Color</label>
                <div style="display:flex;gap:.5rem">
                    <input type="color" value="${t.primary}" onchange="window.updateTheme('primary', this.value)" style="height:40px;width:60px;padding:2px;border:1px solid var(--border);border-radius:4px" />
                    <input type="text" value="${t.primary}" class="form-control" onchange="window.updateTheme('primary', this.value)" />
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Accent / Glow</label>
                <div style="display:flex;gap:.5rem">
                    <input type="color" value="${t.accent}" onchange="window.updateTheme('accent', this.value)" style="height:40px;width:60px;padding:2px;border:1px solid var(--border);border-radius:4px" />
                    <input type="text" value="${t.accent}" class="form-control" onchange="window.updateTheme('accent', this.value)" />
                </div>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Typography & Shapes</span></div>
          <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem">
            <div class="form-group">
                <label class="form-label">Border Radius</label>
                <select class="form-control" onchange="window.updateTheme('radius', this.value)">
                    <option value="0px" ${t.radius === '0px' ? 'selected' : ''}>Sharp (0px)</option>
                    <option value="4px" ${t.radius === '4px' ? 'selected' : ''}>Medium (4px)</option>
                    <option value="10px" ${t.radius === '10px' ? 'selected' : ''}>Standard (10px)</option>
                    <option value="20px" ${t.radius === '20px' ? 'selected' : ''}>Round (20px)</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Font Family</label>
                <select class="form-control" onchange="window.updateTheme('font', this.value)">
                    <option value="Segoe UI" ${t.font === 'Segoe UI' ? 'selected' : ''}>Segoe UI</option>
                    <option value="Inter" ${t.font === 'Inter' ? 'selected' : ''}>Inter</option>
                    <option value="Rajdhani" ${t.font === 'Rajdhani' ? 'selected' : ''}>Rajdhani</option>
                </select>
            </div>
          </div>
        </div>
        <div class="card">
            <div class="card-header"><span class="card-title">Theme Presets</span></div>
            <div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(130px, 1fr));gap:1rem">
                ${presets.map(p => `
                    <div onclick="window.applyPreset('${p.id}')" style="cursor:pointer;padding:1rem;border-radius:12px;border:2px solid ${t.presets === p.id ? 'var(--acc)' : 'var(--border)'};background:var(--bg2);text-align:center">
                        <div style="display:flex;justify-content:center;gap:4px;margin-bottom:.5rem">
                            <div style="width:16px;height:16px;border-radius:50%;background:${p.primary}"></div>
                            <div style="width:16px;height:16px;border-radius:50%;background:${p.accent}"></div>
                        </div>
                        <div style="font-size:.75rem;font-weight:700">${p.name}</div>
                    </div>
                `).join('')}
            </div>
        </div>
      </div>
      <div>
        <div class="card" style="position:sticky;top:1rem;border:1px solid var(--border);overflow:hidden">
            <div class="card-header"><span class="card-title">Live Preview</span></div>
            <div style="padding:1.5rem;background:#0f172a;color:#fff;min-height:400px;font-family:${t.font}, sans-serif">
                <div style="margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center">
                    <div style="font-weight:bold;color:${t.primary}">VIGOR PLAYER</div>
                    <div style="font-size:.8rem;opacity:.6">IDR 2.400.000</div>
                </div>
                <div style="background:linear-gradient(135deg, ${t.primary}, ${t.accent});padding:1.25rem;border-radius:${t.radius};margin-bottom:1.5rem">
                    <div style="font-size:1.1rem;font-weight:900">200% BONUS</div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
                    ${Array.from({ length: 4 }).map(() => `<div style="aspect-ratio:1;background:rgba(255,255,255,0.05);border-radius:${t.radius};display:flex;align-items:center;justify-content:center;font-size:1.5rem">🎰</div>`).join('')}
                </div>
                <button style="width:100%;margin-top:1.5rem;background:${t.primary};color:#fff;border:none;padding:.75rem;border-radius:${t.radius};font-weight:bold">PLAY NOW</button>
            </div>
        </div>
      </div>
    </div>`;
};

window.updateTheme = (key, val) => {
    STATE.theme[key] = val;
    STATE.theme.presets = 'custom';
    applyTheme();
    saveState();
    go('custom-theme');
};

window.applyPreset = (id) => {
    const presets = [
        { id: 'midnight', name: 'Midnight Blue', primary: '#0ea5e9', accent: '#8b5cf6', radius: '10px', font: 'Segoe UI' },
        { id: 'emerald', name: 'Emerald Forest', primary: '#10b981', accent: '#34d399', radius: '4px', font: 'Inter' },
        { id: 'gold', name: 'Royal Gold', primary: '#facc15', accent: '#fbbf24', radius: '0px', font: 'Georgia' },
        { id: 'cyber', name: 'Cyberpunk', primary: '#f472b6', accent: '#2dd4bf', radius: '20px', font: 'Rajdhani' }
    ];
    const p = presets.find(x => x.id === id);
    if (p) {
        Object.assign(STATE.theme, p);
        STATE.theme.presets = id;
        applyTheme();
        saveState();
        go('custom-theme');
        toast(`Applied ${p.name} theme`, 'success');
    }
};

// --- VIP DESIGNER ---
pages['custom-vip'] = () => {
    const calcMethod = STATE.settings?.vipCalcMethod || 'turnover';
    const crmSync = STATE.settings?.vipCrmSync !== false;
    const methodLabel = calcMethod === 'turnover' ? 'Min Turnover (TO)' : 'Min Deposit (Kumulatif)';
    const methodField = calcMethod === 'turnover' ? 'turnover' : 'minDeposit';

    // Calculate current member VIP levels
    const members = STATE.members || [];
    const memberVipCounts = {};
    STATE.vipTiers.forEach(t => { memberVipCounts[t.id] = 0; });
    members.forEach(m => {
        const val = calcMethod === 'turnover'
            ? (STATE.lotteryBets||[]).filter(b=>b.member===m.username).reduce((s,b)=>s+(b.betAmount||0),0)
              + (STATE.seamless?.transactions||[]).filter(t=>t.player===m.username).reduce((s,t)=>s+(t.betAmount||0),0)
            : (STATE.deposits||[]).filter(d=>d.member===m.username&&d.status==='Approved').reduce((s,d)=>s+(d.amount||0),0);
        const tier = [...STATE.vipTiers].reverse().find(t => val >= (t[methodField]||t.turnover||0));
        if (tier) memberVipCounts[tier.id] = (memberVipCounts[tier.id]||0) + 1;
    });

    return `
    ${pageHeader('VIP Tier Designer', '<span>Management</span><span class="sep">›</span><span>VIP Tiers</span>', `
        <div style="display:flex;gap:.5rem;align-items:center">
            <button class="btn btn-primary btn-sm" onclick="window.openAddVIPTier()"><i class="fa-solid fa-plus"></i> Add Tier</button>
            <button class="btn btn-secondary btn-sm" onclick="go('rebate-calc')"><i class="fa-solid fa-calculator"></i> Rebate Calc</button>
        </div>`)}

    <!-- VIP Config Bar -->
    <div class="card" style="margin-bottom:1.25rem">
        <div class="card-body" style="display:flex;gap:2rem;align-items:center;flex-wrap:wrap">
            <div>
                <div style="font-size:.75rem;color:var(--text3);margin-bottom:.3rem">Metode Kalkulasi VIP</div>
                <div style="display:flex;gap:.5rem">
                    <button class="btn btn-sm ${calcMethod==='turnover'?'btn-primary':'btn-secondary'}" onclick="window.setVipCalcMethod('turnover')"><i class="fa-solid fa-rotate"></i> Turnover (TO)</button>
                    <button class="btn btn-sm ${calcMethod==='deposit'?'btn-primary':'btn-secondary'}" onclick="window.setVipCalcMethod('deposit')"><i class="fa-solid fa-arrow-down-to-bracket"></i> Total Deposit</button>
                </div>
            </div>
            <div style="border-left:1px solid var(--border);padding-left:2rem">
                <div style="font-size:.75rem;color:var(--text3);margin-bottom:.3rem">CRM Segment Auto-Sync</div>
                <label class="toggle" style="transform:scale(.9)">
                    <input type="checkbox" ${crmSync?'checked':''} onchange="window.setVipCrmSync(this.checked)"/>
                    <div class="toggle-slider"></div>
                </label>
                <span style="font-size:.78rem;color:var(--text2);margin-left:.5rem">${crmSync?'On — VIP tiers create CRM segments automatically':'Off'}</span>
            </div>
            <div style="border-left:1px solid var(--border);padding-left:2rem;flex:1">
                <div style="font-size:.75rem;color:var(--text3);margin-bottom:.5rem">Member Distribution</div>
                <div style="display:flex;gap:.75rem;flex-wrap:wrap">
                    ${STATE.vipTiers.map(t=>`
                        <div style="display:flex;align-items:center;gap:.3rem">
                            <div style="width:10px;height:10px;border-radius:50%;background:${t.color}"></div>
                            <span style="font-size:.72rem;color:var(--text2)">${t.name}: <strong>${memberVipCounts[t.id]||0}</strong></span>
                        </div>`).join('')}
                </div>
            </div>
        </div>
    </div>

    <div class="card">
        <div class="card-header"><span class="card-title">VIP Tier Hierarchy</span><span style="margin-left:.5rem;font-size:.72rem;color:var(--text3)">Kalkulasi berdasarkan: <strong>${calcMethod==='turnover'?'Total Turnover':'Total Deposit'}</strong></span></div>
        <div class="card-body">
            ${tableWrap(`
                <table>
                    <thead>
                        <tr>
                            <th>Level</th><th>Name</th><th>${methodLabel}</th><th>Rebate (%)</th><th>Referral (%)</th><th>Members</th>${crmSync?'<th>CRM Segment</th>':''}
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${STATE.vipTiers.map((t, idx) => {
                            const thresholdVal = t[methodField] || t.turnover || 0;
                            const crmSeg = (STATE.crm?.segments||[]).find(s=>s.name?.toLowerCase().includes(t.name.toLowerCase()));
                            return `
                            <tr>
                                <td>
                                  <div style="display:flex;align-items:center;gap:.5rem">
                                    <div style="width:24px;height:24px;border-radius:50%;background:${t.color};box-shadow:0 0 8px ${t.color}66"></div>
                                    <span style="font-size:.7rem;color:var(--text3)">L${idx+1}</span>
                                  </div>
                                </td>
                                <td><strong style="color:${t.color}">${t.name}</strong></td>
                                <td>${thresholdVal === 0 ? '<span style="color:var(--text3)">Start</span>' : (thresholdVal/1000000).toFixed(0)+'M'}</td>
                                <td><span class="badge badge-success">${t.rebate}%</span></td>
                                <td><span class="badge badge-primary">${t.referral}%</span></td>
                                <td><span style="font-weight:700">${memberVipCounts[t.id]||0}</span> <span style="font-size:.7rem;color:var(--text3)">members</span></td>
                                ${crmSync?`<td>${crmSeg?`<span class="badge badge-secondary" style="font-size:.65rem">${crmSeg.name}</span>`:'<button class="btn btn-xs btn-secondary" onclick="window.createVipCrmSegment(\''+t.id+'\')" style="font-size:.65rem">Create Segment</button>'}</td>`:''}
                                <td>${actionBtns(`window.editVIP('${t.id}')`, `window.deleteVIP('${t.id}')`)}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            `)}
        </div>
    </div>`;
};

window.setVipCalcMethod = (method) => {
    if (!STATE.settings) STATE.settings = {};
    STATE.settings.vipCalcMethod = method;
    saveState();
    go('custom-vip');
    toast(`VIP calculation: ${method === 'turnover' ? 'Turnover (TO)' : 'Total Deposit'}`, 'success');
};

window.setVipCrmSync = (val) => {
    if (!STATE.settings) STATE.settings = {};
    STATE.settings.vipCrmSync = val;
    saveState();
};

window.createVipCrmSegment = (tierId) => {
    const tier = STATE.vipTiers.find(t => t.id === tierId);
    if (!tier) return;
    if (!Array.isArray(STATE.crm.segments)) STATE.crm.segments = [];
    const seg = {
        id: 'SEG_VIP_' + tierId,
        name: `VIP ${tier.name}`,
        description: `Auto-segment for VIP tier: ${tier.name}`,
        criteria: { vipTier: tier.name },
        company: '',
        status: 'Active',
        memberCount: 0,
        createdBy: STATE.profile.username,
        createdAt: new Date().toISOString(),
    };
    const existing = STATE.crm.segments.findIndex(s => s.id === seg.id);
    if (existing >= 0) { toast('Segment already exists', 'warning'); return; }
    STATE.crm.segments.push(seg);
    saveState();
    go('custom-vip');
    toast(`CRM segment created: VIP ${tier.name}`, 'success');
};

window.openAddVIPTier = () => {
    openModal('Add VIP Tier', `
        <div class="form-grid">
            <div class="form-field"><label>Tier Name</label><input id="vt_name" placeholder="e.g. Emerald"/></div>
            <div class="form-field"><label>Color</label><input id="vt_color" type="color" value="#22c55e" style="height:40px;width:100%"/></div>
            <div class="form-field"><label>Min Turnover (Rp)</label><input id="vt_to" type="number" value="0" min="0"/></div>
            <div class="form-field"><label>Min Deposit (Rp)</label><input id="vt_dep" type="number" value="0" min="0"/></div>
            <div class="form-field"><label>Rebate (%)</label><input id="vt_rebate" type="number" step="0.1" value="0.5" min="0" max="10"/></div>
            <div class="form-field"><label>Referral (%)</label><input id="vt_referral" type="number" step="0.1" value="0.2" min="0" max="10"/></div>
        </div>`,
        `<button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
         <button class="btn btn-primary" onclick="window.saveNewVIPTier()">Add Tier</button>`);
};

window.saveNewVIPTier = () => {
    const name = document.getElementById('vt_name')?.value?.trim();
    if (!name) { toast('Tier name required', 'error'); return; }
    const tier = {
        id: 'VIP' + (STATE.vipTiers.length + 1),
        name,
        color: document.getElementById('vt_color')?.value || '#22c55e',
        turnover: parseInt(document.getElementById('vt_to')?.value || '0', 10),
        minDeposit: parseInt(document.getElementById('vt_dep')?.value || '0', 10),
        rebate: parseFloat(document.getElementById('vt_rebate')?.value || '0'),
        referral: parseFloat(document.getElementById('vt_referral')?.value || '0'),
    };
    STATE.vipTiers.push(tier);
    saveState();
    closeModalBtn(); go('custom-vip'); toast('VIP tier added', 'success');
};

// --- SEO SETTINGS ---
pages['custom-seo'] = () => {
    const s = STATE.seo;
    const activeTab = window._seoActiveTab || 'general';

    return `
    <style>
        .seo-tab { padding: 1rem 1.5rem; cursor: pointer; font-weight: 700; transition: all 0.3s; border-radius: 12px; display: flex; align-items: center; gap: .75rem; border: 1px solid transparent; }
        .seo-tab.active { background: var(--acc-glow); color: var(--acc); border-color: var(--acc-border); }
        .seo-tab:not(.active):hover { background: var(--bg2); color: var(--text1); }
        
        .stat-card { background: linear-gradient(180deg, var(--bg2), var(--bg)); border: 1px solid var(--border); border-radius: 16px; padding: 1.5rem; transition: transform 0.2s; }
        .stat-card:hover { transform: translateY(-3px); border-color: var(--acc); }
        .stat-label { font-size: .8rem; font-weight: 600; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: .5rem; }
        .stat-value { font-size: 1.75rem; font-weight: 900; }
        
        .serp-item { transition: all 0.2s; border-radius: 10px; }
        .serp-item:hover { background: var(--bg2); }
        .difficulty-low { color: #22c55e; }
        .difficulty-med { color: #f59e0b; }
        .difficulty-high { color: #ef4444; }
    </style>

    ${pageHeader('SEO Intelligence', '<span>Analysis</span><span class="sep">›</span><span>Keyword Research</span>', `
        <div style="display:flex;background:var(--bg2);padding:4px;border-radius:14px;border:1px solid var(--border)">
            <div onclick="window._seoActiveTab='general';go('custom-seo')" class="seo-tab ${activeTab === 'general' ? 'active' : ''}"><i class="fa-solid fa-sliders"></i> General</div>
            <div onclick="window._seoActiveTab='scripts';go('custom-seo')" class="seo-tab ${activeTab === 'scripts' ? 'active' : ''}"><i class="fa-solid fa-code"></i> Scripts</div>
            <div onclick="window._seoActiveTab='social';go('custom-seo')" class="seo-tab ${activeTab === 'social' ? 'active' : ''}"><i class="fa-solid fa-share-nodes"></i> Social</div>
            <div onclick="window._seoActiveTab='analysis';go('custom-seo')" class="seo-tab ${activeTab === 'analysis' ? 'active' : ''}"><i class="fa-solid fa-chart-pie"></i> Analysis</div>
        </div>
    `)}

    ${activeTab === 'general' ? `
    <div style="display:grid;grid-template-columns:1fr 400px;gap:2rem">
      <div style="display:flex;flex-direction:column;gap:1.5rem">
        <div class="card" style="border-radius:20px;overflow:hidden">
          <div class="card-header" style="background:var(--bg2);padding:1.25rem 1.5rem"><span class="card-title" style="display:flex;align-items:center;gap:.5rem"><i class="fa-solid fa-file-code" style="color:var(--acc)"></i> On-Page Metadata</span></div>
          <div class="card-body" style="padding:2rem">
            <div class="form-group">
                <label class="form-label" style="display:flex;justify-content:space-between">Meta Title <span>${s.title.length} / 60</span></label>
                <input class="form-control form-control-lg" value="${s.title}" onchange="window.updateSEO('title', this.value)" style="border-radius:12px;font-weight:600" />
            </div>
            <div class="form-group" style="margin-top:2rem">
                <label class="form-label">Meta Description</label>
                <textarea class="form-control" rows="4" onchange="window.updateSEO('description', this.value)" style="border-radius:12px;padding:1rem;line-height:1.6">${s.description}</textarea>
            </div>
            <div class="form-group" style="margin-top:2rem">
                <label class="form-label">Search Keywords (Focus)</label>
                <input class="form-control" value="${s.keywords}" onchange="window.updateSEO('keywords', this.value)" placeholder="Enter keywords separated by commas..." style="border-radius:12px" />
            </div>
          </div>
        </div>
        
        <div class="card" style="border-radius:20px;border:1px dashed var(--acc-border);background:var(--acc-glow)">
            <div class="card-body" style="display:flex;align-items:center;gap:1.5rem;padding:1.5rem">
                <div style="font-size:2.5rem;color:var(--acc)"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
                <div>
                    <div style="font-weight:800;font-size:1.1rem;margin-bottom:.2rem">SEO Health Score: 84/100</div>
                    <div style="font-size:.9rem;color:var(--text2)">Your metadata is well-optimized. Consider adding more descriptive keywords to reach 100%.</div>
                </div>
                <button class="btn btn-primary btn-sm" style="margin-left:auto;border-radius:10px">Re-Scan</button>
            </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:1.5rem">
        <div class="card" style="border-radius:24px;border:1px solid var(--border);background:#fff;color:#202124;padding:1.5rem;box-shadow:var(--shadow-lg)">
            <div style="margin-bottom:1rem;display:flex;align-items:center;gap:.5rem;color:#70757a;font-size:.85rem">
                <div style="width:28px;height:28px;background:#f1f3f4;border-radius:50%;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-magnifying-glass"></i></div>
                <span>google.com</span>
            </div>
            <div style="font-size:1.25rem;color:#1a0dab;margin-bottom:.5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;text-decoration:none !important">
                ${s.title}
            </div>
            <div style="color:#4d5156;font-size:.9rem;line-height:1.58;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">
                ${s.description}
            </div>
            <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid #f1f3f4;display:flex;gap:1rem;font-size:.75rem;color:#70757a">
                <span>Sitelinks</span>
                <span>FAQ</span>
                <span>Price</span>
            </div>
        </div>

        <div class="card" style="border-radius:20px">
            <div class="card-header"><span class="card-title">Social Card (X / FB)</span></div>
            <div class="card-body" style="padding:0">
                <div style="background:#1e293b;aspect-ratio:1.91;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);position:relative">
                    <img src="https://placehold.co/1200x630/1e293b/white?text=VIGOR+PREVIEW" style="width:100%;height:100%;object-fit:cover" />
                    <div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.8);padding:1rem">
                        <div style="font-weight:700;font-size:.9rem;color:#fff">${s.title}</div>
                        <div style="font-size:.7rem;color:rgba(255,255,255,0.6)">vigor.gaming</div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
    ` : activeTab === 'scripts' ? `
    <div style="display:grid;grid-template-columns:1fr 340px;gap:2.5rem">
        <div style="display:flex;flex-direction:column;gap:1.5rem">
            <div class="card" style="border-radius:20px">
                <div class="card-header" style="background:var(--bg2);padding:1.25rem 1.5rem">
                    <span class="card-title" style="display:flex;align-items:center;gap:.6rem"><i class="fa-solid fa-terminal" style="color:var(--acc)"></i> Header Injection (Head)</span>
                </div>
                <div class="card-body" style="padding:2rem">
                    <p style="color:var(--text3);font-size:.85rem;margin-bottom:1rem">Inject scripts before the closing <code>&lt;/head&gt;</code> tag. Use for Analytics, Pixels, and Meta verification.</p>
                    <textarea class="form-control" rows="12" onchange="window.updateSEO('injectHead', this.value)" style="font-family:monospace;font-size:.85rem;background:#0f172a;color:#94a3b8;border:none;border-radius:12px;padding:1.5rem" placeholder="<script>\n  // Your code here\n</script>">${s.injectHead || ''}</textarea>
                </div>
            </div>

            <div class="card" style="border-radius:20px">
                <div class="card-header" style="background:var(--bg2);padding:1.25rem 1.5rem">
                    <span class="card-title" style="display:flex;align-items:center;gap:.6rem"><i class="fa-solid fa-code-merge" style="color:var(--green)"></i> Footer Injection (Body)</span>
                </div>
                <div class="card-body" style="padding:2rem">
                    <p style="color:var(--text3);font-size:.85rem;margin-bottom:1rem">Inject scripts before the closing <code>&lt;/body&gt;</code> tag. Best for Live Chat and non-critical trackers.</p>
                    <textarea class="form-control" rows="8" onchange="window.updateSEO('injectBody', this.value)" style="font-family:monospace;font-size:.85rem;background:#0f172a;color:#94a3b8;border:none;border-radius:12px;padding:1.5rem" placeholder="<script>\n  // Your code here\n</script>">${s.injectBody || ''}</textarea>
                </div>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:1.5rem">
            <div class="card" style="border-radius:20px;background:linear-gradient(135deg, #1e293b, #0f172a)">
                <div class="card-body" style="padding:1.5rem">
                    <div style="color:var(--acc);font-weight:900;font-size:.7rem;text-transform:uppercase;margin-bottom:.5rem">Quick Connect</div>
                    <div style="display:flex;flex-direction:column;gap:.75rem">
                        <button class="btn btn-secondary btn-sm" onclick="toast('GTM Helper: Field placeholder updated','info')" style="justify-content:flex-start;background:rgba(255,255,255,0.05);border:none"><i class="fa-brands fa-google"></i> Tag Manager</button>
                        <button class="btn btn-secondary btn-sm" onclick="toast('FB Pixel Template loaded','info')" style="justify-content:flex-start;background:rgba(255,255,255,0.05);border:none"><i class="fa-brands fa-facebook-f"></i> Facebook Pixel</button>
                        <button class="btn btn-secondary btn-sm" onclick="toast('Hotjar tracking sample added','info')" style="justify-content:flex-start;background:rgba(255,255,255,0.05);border:none"><i class="fa-solid fa-fire"></i> Hotjar</button>
                    </div>
                </div>
            </div>
            
            <div class="card" style="border-radius:20px;border:1px solid var(--red-glow);background:rgba(239,68,68,0.05)">
                <div class="card-body" style="padding:1.5rem;display:flex;gap:1rem">
                    <i class="fa-solid fa-triangle-exclamation" style="color:var(--red);font-size:1.5rem"></i>
                    <div style="font-size:.8rem;color:var(--text2);line-height:1.5">
                        <b style="color:var(--text1)">Warning:</b> Incorrect scripts can break the site layout or functionality. Always test in staging first.
                    </div>
                </div>
            </div>
        </div>
    </div>
    ` : activeTab === 'social' ? `
    <div style="display:grid;grid-template-columns:1fr 400px;gap:2rem">
        <div style="display:flex;flex-direction:column;gap:1.5rem">
            <div class="card" style="border-radius:20px">
                <div class="card-header"><span class="card-title">OpenGraph & Social Metadata</span></div>
                <div class="card-body" style="padding:2rem">
                    <div class="form-group">
                        <label class="form-label">Social Sharing Title</label>
                        <input class="form-control" value="${s.title}" onchange="window.updateSEO('title', this.value)" style="border-radius:12px" />
                    </div>
                    <div class="form-group" style="margin-top:1.5rem">
                        <label class="form-label">Social Sharing Description</label>
                        <textarea class="form-control" rows="3" onchange="window.updateSEO('description', this.value)" style="border-radius:12px">${s.description}</textarea>
                    </div>
                    <div class="form-group" style="margin-top:1.5rem">
                        <label class="form-label">OG Image URL</label>
                        <div style="display:flex;gap:.5rem">
                            <input class="form-control" value="${s.ogImage}" onchange="window.updateSEO('ogImage', this.value)" style="border-radius:12px" />
                            <button class="btn btn-secondary" onclick="toast('Image library coming soon','info')"><i class="fa-solid fa-image"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="border-radius:20px;background:rgba(14,165,233,0.05);border:1px dashed var(--acc)">
                <div class="card-body" style="display:flex;align-items:center;gap:1rem;color:var(--acc)">
                    <i class="fa-solid fa-circle-info" style="font-size:1.5rem"></i>
                    <div style="font-size:.85rem;line-height:1.4">Social previews can take up to 24 hours to update on platforms like Facebook after you change them. Use the <b>Facebook Sharing Debugger</b> to clear their cache.</div>
                </div>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:1.5rem">
            <div style="font-size:.8rem;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:-.5rem">Desktop Preview</div>
            
            <!-- Facebook Mockup -->
            <div class="card" style="border-radius:0;border:1px solid #dddfe2;background:#fff;padding:0;overflow:hidden">
                <img src="${s.ogImage}" style="width:100%;aspect-ratio:1.91;object-fit:cover;border-bottom:1px solid #dddfe2" />
                <div style="padding:12px;background:#f2f3f5">
                    <div style="color:#606770;font-size:12px;text-transform:uppercase;margin-bottom:2px">VIGOR.GAMING</div>
                    <div style="color:#1d2129;font-weight:600;font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.title}</div>
                    <div style="color:#606770;font-size:14px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical">${s.description}</div>
                </div>
            </div>

            <!-- X / Twitter Mockup -->
            <div class="card" style="border-radius:16px;border:1px solid #cfd9de;background:#fff;padding:0;overflow:hidden;margin-top:1rem">
                <div style="position:relative">
                    <img src="${s.ogImage}" style="width:100%;aspect-ratio:1.91;object-fit:cover" />
                    <div style="position:absolute;bottom:8px;left:8px;background:rgba(0,0,0,0.7);color:#fff;padding:2px 6px;border-radius:4px;font-size:11px">vigor.gaming</div>
                </div>
                <div style="padding:12px">
                    <div style="color:#0f1419;font-weight:400;font-size:15px;margin-bottom:2px">${s.title}</div>
                    <div style="color:#536471;font-size:15px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${s.description}</div>
                </div>
            </div>
        </div>
    </div>
    ` : `
    <div class="card" style="border-radius:24px;margin-bottom:2rem;background:linear-gradient(90deg, var(--bg2), var(--bg));border:1px solid var(--acc-glow)">
        <div class="card-body" style="padding:2.5rem">
            <div style="display:grid;grid-template-columns:1fr 280px auto;gap:1.5rem;align-items:flex-end">
                <div class="form-group" style="margin-bottom:0">
                    <label class="form-label" style="font-weight:800;color:var(--text1);font-size:.9rem">POWER KEYWORD</label>
                    <div style="position:relative">
                        <i class="fa-solid fa-keyboard" style="position:absolute;left:1.25rem;top:50%;transform:translateY(-50%);color:var(--acc)"></i>
                        <input type="text" id="seo_kw_input" class="form-control form-control-lg" placeholder="Search target keyword..." style="border-radius:16px;padding-left:3rem;background:var(--bg);border:2px solid var(--border)" />
                    </div>
                </div>
                <div class="form-group" style="margin-bottom:0">
                    <label class="form-label" style="font-weight:800;color:var(--text1);font-size:.9rem">GOOGLE REGION</label>
                    <select id="seo_region_input" class="form-control form-control-lg" style="border-radius:16px;background:var(--bg);border:2px solid var(--border)">
                        <option value="id">🇮🇩 Indonesia</option>
                        <option value="th">🇹🇭 Thailand</option>
                        <option value="ph">🇵🇭 Philippines</option>
                        <option value="my">🇲🇾 Malaysia</option>
                        <option value="global">🌐 Global Market</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="window.runKeywordAnalysis()" style="height:54px;border-radius:16px;padding:0 2rem;font-weight:800;font-size:1rem;box-shadow:0 10px 20px var(--acc-glow)"><i class="fa-solid fa-bolt"></i> RUN ANALYSIS</button>
            </div>
        </div>
    </div>

    <div id="seo_analysis_results">
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:1.5rem;margin-bottom:2rem">
            ${['Keyword Difficulty', 'Search Volume', 'Opportunity', 'Avg CPC'].map(l => `
                <div class="stat-card" style="opacity:0.3;filter:grayscale(1)">
                    <div class="stat-label">${l}</div>
                    <div class="stat-value">-</div>
                </div>
            `).join('')}
        </div>
        <div class="card" style="border-radius:24px;border:2px dashed var(--border);background:none">
            <div class="card-body" style="text-align:center;padding:6rem 2rem">
                <div style="font-size:4rem;color:var(--border);margin-bottom:1.5rem"><i class="fa-solid fa-chart-column"></i></div>
                <h3 style="color:var(--text2)">Deep Intelligence Engine</h3>
                <p style="color:var(--text3);max-width:400px;margin:0 auto">Select a target market and keyword above to generate a high-fidelity ranking report from Google SERP.</p>
            </div>
        </div>
    </div>
    `}
    `;
};

window.runKeywordAnalysis = () => {
    const kw = document.getElementById('seo_kw_input')?.value;
    const region = document.getElementById('seo_region_input')?.value;
    const myUrl = (STATE.siteConfig?.siteUrl || 'your-site.com').replace('https://', '').replace('http://', '').replace('www.', '');

    if (!kw) return toast('Please enter a keyword', 'error');

    const container = document.getElementById('seo_analysis_results');
    container.innerHTML = `
        <div class="card" style="border-radius:24px">
            <div class="card-body" style="text-align:center;padding:8rem 2rem">
                <div class="pulse-loader" style="width:80px;height:80px;background:var(--acc-glow);border-radius:50%;margin:0 auto 2rem;display:flex;align-items:center;justify-content:center">
                    <i class="fa-solid fa-satellite-dish fa-spin fa-2x" style="color:var(--acc)"></i>
                </div>
                <div style="font-size:1.5rem;font-weight:900;margin-bottom:.5rem">Connecting to Google ${region.toUpperCase()} Nodes...</div>
                <div style="color:var(--text3);font-size:1.1rem">Calculating SERP metrics for "${kw}"</div>
            </div>
        </div>
    `;

    setTimeout(() => {
        let rows = '';
        const diff = Math.min(99, Math.abs(kw.length * 7 + (region === 'id' ? 15 : 30)));
        const diffLabel = diff > 80 ? 'EXTREME' : diff > 60 ? 'HARD' : 'MODERATE';
        const diffColor = diff > 80 ? 'difficulty-high' : diff > 60 ? 'difficulty-med' : 'difficulty-low';

        const competitors = [
            'detik.com', 'thairath.co.th', 'star.com.ph', 'thestar.com.my',
            'bola.net', 'kompas.com', 'news.google.com', 'viva.co.id',
            'm.pantip.com', 'sanook.com', 'abs-cbn.com', 'philstar.com'
        ];

        // Seeded random for consistency in same keyword
        let seed = kw.length;
        const pseudoRnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

        for (let i = 1; i <= 30; i++) {
            const isMe = i === 14; // Your site at rank 14
            const domain = isMe ? myUrl.toUpperCase() : (competitors[Math.floor(pseudoRnd() * competitors.length)] || `competitor-${i}.net`);
            const relevance = Math.max(20, 100 - i - Math.floor(pseudoRnd() * 10));

            rows += `
                <tr class="serp-item" ${isMe ? 'style="background:var(--acc-glow) !important; border-left:4px solid var(--acc)"' : ''}>
                    <td style="font-weight:900;font-size:1.1rem;padding:1.5rem 1rem;color:${i <= 3 ? (i === 1 ? '#ffd700' : i === 2 ? '#c0c0c0' : '#cd7f32') : 'var(--text3)'}">
                        ${i === 1 ? '<i class="fa-solid fa-crown"></i>' : i}
                    </td>
                    <td>
                        <div style="display:flex;align-items:center;gap:1rem">
                            <div style="width:40px;height:40px;background:var(--bg2);border-radius:10px;display:flex;align-items:center;justify-content:center">
                                <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=64" style="width:24px;height:24px" onerror="this.src='https://placehold.co/24'"/>
                            </div>
                            <div>
                                <div style="font-weight:800;color:${isMe ? 'var(--acc)' : 'var(--text1)'}">${isMe ? domain + ' (SITE UTAMA)' : domain}</div>
                                <div style="font-size:.7rem;color:var(--text3)">https://${domain.toLowerCase()}/search?q=${encodeURIComponent(kw)}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div style="display:flex;align-items:center;gap:.5rem">
                            <div style="flex:1;height:8px;background:var(--bg3);border-radius:4px;overflow:hidden;max-width:100px">
                                <div style="width:${relevance}%;height:100%;background:linear-gradient(90deg, var(--acc), var(--acc-border))"></div>
                            </div>
                            <span style="font-weight:700;font-size:.8rem">${relevance}%</span>
                        </div>
                    </td>
                    <td style="font-weight:700">${isMe ? 24 : Math.floor(pseudoRnd() * (95 - 40) + 40)}</td>
                    <td><span style="background:var(--bg2);padding:.4rem .8rem;border-radius:8px;font-weight:700;font-size:.8rem">${((pseudoRnd() * 50000) / 1000).toFixed(1)}K</span></td>
                    <td style="text-align:right">
                        ${pseudoRnd() > 0.4 ? '<i class="fa-solid fa-arrow-trend-up" style="color:#22c55e"></i>' : '<i class="fa-solid fa-arrow-trend-down" style="color:#ef4444"></i>'}
                    </td>
                </tr>
            `;
        }

        container.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:1.5rem;margin-bottom:2rem">
                <div class="stat-card">
                    <div class="stat-label">Difficulty</div>
                    <div class="stat-value ${diffColor}">${diffLabel} (${diff})</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Volume (Trend)</div>
                    <div class="stat-value" style="color:var(--acc)">${Math.floor(pseudoRnd() * 200 + 10)}K <span style="font-size:.8rem;color:var(--text3);font-weight:normal">/ mo</span></div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Site Authority</div>
                    <div class="stat-value" style="color:var(--green)">${Math.floor(pseudoRnd() * 30 + 10)}%</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Market Share</div>
                    <div class="stat-value" style="color:var(--yellow)">${(pseudoRnd() * 5).toFixed(2)}%</div>
                </div>
            </div>

            <div class="card" style="border-radius:24px;overflow:hidden">
                <div class="card-header" style="background:var(--bg2);padding:1.5rem 2rem;display:flex;justify-content:space-between;align-items:center;border-bottom:none">
                    <div>
                        <span class="card-title">Ranking Deep-Dive: SERP Overview</span>
                        <div style="font-size:.65rem;color:var(--text3);margin-top:.2rem">SOURCE: REGIONAL SE-ASIA MARKET DATABASE (SIMULATED)</div>
                    </div>
                    <div style="display:flex;gap:.5rem">
                        <button class="btn btn-secondary btn-sm" onclick="toast('PDF Analysis generated','success')"><i class="fa-solid fa-file-pdf"></i> PDF</button>
                    </div>
                </div>
                <div class="card-body" style="padding:0">
                    ${tableWrap(`
                        <table style="margin-bottom:0">
                            <thead>
                                <tr style="background:var(--bg3);border-bottom:2px solid var(--border)">
                                    <th style="padding:1rem">POS</th>
                                    <th style="padding:1rem">DOMAIN COMPETITOR</th>
                                    <th style="padding:1rem">RELEVANCE</th>
                                    <th style="padding:1rem">DA</th>
                                    <th style="padding:1rem">REF. DOMAINS</th>
                                    <th style="padding:1rem;text-align:right">POTENTIAL</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                    `)}
                </div>
            </div>
        `;
    }, 2500);
};

window.updateSEO = (key, val) => {
    STATE.seo[key] = val;
    saveState();
    toast('SEO metadata updated successfully', 'success');
    go('custom-seo');
};

// --- REBATE CALC ---
pages['rebate-calc'] = () => {
    return `
    ${pageHeader('Weekly Rebate', '<span>Management</span><span class="sep">›</span><span>Weekly Rebate</span>')}
    <div class="card">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
            <span class="card-title">Pending Payouts (Cycle: 21-28 Apr)</span>
            <button class="btn btn-primary btn-sm" onclick="window.processRebate()"><i class="fa-solid fa-bolt"></i> Process All</button>
        </div>
        <div class="card-body">
            ${tableWrap(`
                <table>
                    <thead><tr><th>Username</th><th>Turnover</th><th>Rebate</th><th>Payout</th><th>Status</th></tr></thead>
                    <tbody>
                        ${Array.from({ length: 5 }).map((_, i) => `
                            <tr>
                                <td>Player${100 + i}</td>
                                <td>IDR ${window.fmt(50000000)}</td>
                                <td>0.5%</td>
                                <td style="color:var(--green);font-weight:bold">IDR ${window.fmt(250000)}</td>
                                <td>${badge('Pending', 'warning')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `)}
        </div>
    </div>`;
};

window.processRebate = () => {
    openModal('Confirm Payout', '<p>Process all pending rebates for 1,542 players?</p>', `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="window.confirmRebate()">Yes, Process</button>`);
};

window.confirmRebate = () => {
    closeModal();
    toast('Rebates successfully credited!', 'success');
};

//* ─── PROMOTION CRUD ─── */
window.openPromotionForm = (id = null) => {
    const p = id ? STATE.promotions.find(x => x.id === id) : { title: '', type: 'Bonus', amount: '100%', status: 'Active', members: 0 };
    openModal(id ? 'Edit Promotion' : 'Create New Promotion', `
        <div class="form-grid">
            <div class="form-field">
                <label>Promotion Title</label>
                <input id="pm_title" value="${p.title}" placeholder="e.g. Welcome Bonus 100%" />
            </div>
            <div class="form-field">
                <label>Category</label>
                <select id="pm_type">
                    <option ${p.type === 'Bonus' ? 'selected' : ''}>Bonus</option>
                    <option ${p.type === 'Cashback' ? 'selected' : ''}>Cashback</option>
                    <option ${p.type === 'Event' ? 'selected' : ''}>Event</option>
                    <option ${p.type === 'VIP' ? 'selected' : ''}>VIP</option>
                </select>
            </div>
            <div class="form-field">
                <label>Bonus Amount/Value</label>
                <input id="pm_amount" value="${p.amount}" placeholder="e.g. 100% or 50.000" />
            </div>
            <div class="form-field">
                <label>Status</label>
                <select id="pm_status">
                    <option ${p.status === 'Active' ? 'selected' : ''}>Active</option>
                    <option ${p.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
            <div class="form-field" style="grid-column: span 2">
                <label><i class="fa-solid fa-desktop"></i> Desktop Banner</label>
                <div style="display:flex; gap:0.5rem">
                    <input id="pm_banner_desktop" value="${p.bannerDesktop || ''}" placeholder="URL: https://..." style="flex:1" />
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('pm_file_desktop').click()" title="Upload from Device"><i class="fa-solid fa-upload"></i></button>
                    <input type="file" id="pm_file_desktop" style="display:none" onchange="window.handlePromoFile(this, 'pm_banner_desktop')" accept="image/*" />
                </div>
            </div>
            <div class="form-field" style="grid-column: span 2">
                <label><i class="fa-solid fa-mobile-screen"></i> Mobile Banner</label>
                <div style="display:flex; gap:0.5rem">
                    <input id="pm_banner_mobile" value="${p.bannerMobile || ''}" placeholder="URL: https://..." style="flex:1" />
                    <button class="btn btn-secondary btn-sm" onclick="document.getElementById('pm_file_mobile').click()" title="Upload from Device"><i class="fa-solid fa-upload"></i></button>
                    <input type="file" id="pm_file_mobile" style="display:none" onchange="window.handlePromoFile(this, 'pm_banner_mobile')" accept="image/*" />
                </div>
            </div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-primary" onclick="window.savePromotion('${id}')">Save Promotion</button>
    `);
};

window.savePromotion = async (id) => {
    const title = document.getElementById('pm_title').value;
    const type = document.getElementById('pm_type').value;
    const amount = document.getElementById('pm_amount').value;
    const status = document.getElementById('pm_status').value;
    const bannerDesktop = document.getElementById('pm_banner_desktop').value;
    const bannerMobile = document.getElementById('pm_banner_mobile').value;

    if (!title) { toast('Title is required', 'error'); return; }
    const payload = { title, type, amount, status, bannerDesktop, bannerMobile };

    if (id && id !== 'null') {
        if (window.db?.dbUpdatePromotion) {
            const { error } = await window.db.dbUpdatePromotion(id, payload);
            if (error) { toast('Update failed: ' + error.message, 'error'); return; }
            if (window.db?.dbWriteLog) window.db.dbWriteLog('Update Promotion', id, `Updated promotion: ${title}`);
        } else { stateUpdate('promotions', id, payload); }
        toast('Promotion updated', 'success');
    } else {
        if (window.db?.dbAddPromotion) {
            const { error } = await window.db.dbAddPromotion(payload);
            if (error) { toast('Failed: ' + error.message, 'error'); return; }
            if (window.db?.dbWriteLog) window.db.dbWriteLog('Add Promotion', 'new', `Created promotion: ${title}`);
        } else { stateAdd('promotions', { id: 'PM' + Date.now(), ...payload, members: 0 }); }
        toast('Promotion created', 'success');
    }
    closeModalBtn();
    go('custom-promotion-list');
};

window.deletePromotion = (id) => {
    confirmAction('Delete Promotion', 'Are you sure you want to delete this promotion? This cannot be undone.', async () => {
        if (window.db?.dbDeletePromotion) {
            const { error } = await window.db.dbDeletePromotion(id);
            if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
            if (window.db?.dbWriteLog) window.db.dbWriteLog('Delete Promotion', id, `Deleted promotion`);
        } else { stateDelete('promotions', id); }
        toast('Promotion deleted', 'success');
        go('custom-promotion-list');
    });
};

window.togglePromotion = async (id, checked) => {
    const status = checked ? 'Active' : 'Inactive';
    if (window.db?.dbUpdatePromotion) {
        await window.db.dbUpdatePromotion(id, { status });
    } else { stateUpdate('promotions', id, { status }); }
    toast(`Promotion ${checked ? 'activated' : 'deactivated'}`, 'info');
};

window.handlePromoFile = (input, targetId) => {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById(targetId).value = e.target.result;
            toast(`${file.name} uploaded successfully`, 'success');
        };
        reader.readAsDataURL(file);
    }
};

// --- PROMOTIONS ---
pages['custom-promotion-list'] = () => `
  ${pageHeader('Promotion List', '<span>Customization</span><span class="sep">›</span><span>Promotions</span>', `<button class="btn btn-primary" onclick="window.openPromotionForm()"><i class="fa-solid fa-plus"></i> Add Promo</button>`)}
  <div class="card">
    <div class="card-body">
      ${tableWrap(`
        <table>
          <thead><tr><th>Category</th><th>Title</th><th>Banners (D/M)</th><th>Display</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${STATE.promotions.map(p => `
              <tr>
                <td>${badge(p.cat, 'indigo')}</td>
                <td><strong>${p.title}</strong></td>
                <td>
                    <div style="display:flex; gap:4px">
                        <div style="width:40px; height:24px; background:${p.bannerDesktop ? `url(${p.bannerDesktop})` : 'var(--bg3)'}; background-size:cover; border-radius:4px" title="Desktop Banner"></div>
                        <div style="width:24px; height:24px; background:${p.bannerMobile ? `url(${p.bannerMobile})` : 'var(--bg3)'}; background-size:cover; border-radius:4px" title="Mobile Banner"></div>
                    </div>
                </td>
                <td>${p.display || p.amount}</td>
                <td><label class="toggle"><input type="checkbox" ${p.status === 'Active' ? 'checked' : ''} onchange="window.togglePromotion('${p.id}',this.checked)"/><div class="toggle-slider"></div></label></td>
                <td>${actionBtns(`window.openPromotionForm('${p.id}')`, `window.deletePromotion('${p.id}')`)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      `)}
    </div>
  </div>`;

// --- APP NOTIFICATION ---
pages['app-notification'] = () => {
    return `
    ${pageHeader('App Notification', '<span>Customization</span><span class="sep">›</span><span>App Notification</span>')}
    
    <div class="card" style="margin-bottom:1.5rem">
        <div class="card-body" style="display:flex; gap:1rem; align-items:flex-end">
            <div class="form-group" style="flex:1; margin-bottom:0">
                <label class="form-label">Title</label>
                <div style="position:relative">
                    <i class="fa-solid fa-search" style="position:absolute; left:1rem; top:50%; transform:translateY(-50%); opacity:.5"></i>
                    <input class="form-control" placeholder="Search Title..." style="padding-left:2.5rem" />
                </div>
            </div>
            <button class="btn btn-primary" style="height:42px; padding:0 2rem"><i class="fa-solid fa-check"></i> Submit</button>
            <button class="btn btn-danger" style="height:42px; padding:0 2rem"><i class="fa-solid fa-undo"></i> Reset</button>
        </div>
    </div>

    <div class="card">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
            <span class="card-title">App Notification List</span>
            <button class="btn btn-primary btn-sm" onclick="toast('Opening notification form...','info')"><i class="fa-solid fa-plus"></i> Add Notification</button>
        </div>
        <div class="card-body">
            ${tableWrap(`
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Created Date</th>
                            <th>Title</th>
                            <th>Content</th>
                            <th>Target</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>16 Apr 2026<br/><small>10:54:31</small></td>
                            <td style="color:var(--acc)">Test notification Test notification Test notifi</td>
                            <td>Test notification Test notification Test notification Test notification Test notification Test notification...</td>
                            <td><span class="badge badge-secondary">s88pw</span></td>
                            <td>
                                <div style="display:flex; gap:.25rem">
                                    <button class="btn btn-success btn-xs"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn btn-danger btn-xs"><i class="fa-solid fa-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            `)}
        </div>
    </div>`;
};

// --- STUDIO X: ADVANCED PROFESSIONAL TEMPLATE BUILDER ---
function ensureStudioState() {
    if (!builderState.studioGrid) {
        builderState.studioGrid = {
            mode: 'layout',
            columns: 12,
            gap: 12,
            maxWidth: 1240,
            showGuides: true,
        };
    }
    if (!builderState.zones) builderState.zones = {};
    builderState.dynamicZones.forEach(z => {
        if (!builderState.zones[z.id]) builderState.zones[z.id] = [];
        if (!z.span) z.span = '1 / -1';
        if (!z.align) z.align = 'stretch';
        if (!z.padding) z.padding = 0;
    });
}

function getStudioGridTemplate(layoutData) {
    const grid = builderState.studioGrid;
    if (grid.mode === 'custom') return `repeat(${grid.columns}, minmax(0, 1fr))`;
    return layoutData.type === 'grid' ? layoutData.grid : '1fr';
}

function getSelectedStudioZone() {
    return builderState.dynamicZones.find(z => z.id === builderState.activeZone) || builderState.dynamicZones[0];
}

function renderStudioArchitecturePanel(activeLayout) {
    const grid = builderState.studioGrid;
    const selected = getSelectedStudioZone();
    const zoneOptions = builderState.dynamicZones.map(z => `<option value="${z.id}" ${z.id === selected?.id ? 'selected' : ''}>${z.label}</option>`).join('');
    const spanOptions = [
        ['1 / -1', 'Full row'],
        ['span 12', '12 columns'],
        ['span 9', '9 columns'],
        ['span 8', '8 columns'],
        ['span 6', '6 columns'],
        ['span 4', '4 columns'],
        ['span 3', '3 columns'],
        ['1 / 4', 'Left rail'],
        ['4 / 10', 'Center band'],
        ['10 / -1', 'Right rail'],
    ];

    return `
        <div>
            <div class="inspector-title"><i class="fa-solid fa-sliders"></i> ARCHITECTURE</div>
            <div class="form-group" style="margin-top:1rem">
                <label class="studio-label">Layout preset</label>
                <select class="form-control studio-input" onchange="window.switchBuilderLayout(this.value)">
                    ${Object.entries(LAYOUTS).map(([id, l]) => `<option value="${id}" ${id === activeLayout ? 'selected' : ''}>${l.name}</option>`).join('')}
                </select>
            </div>
            <div class="studio-segment">
                <button class="${grid.mode === 'layout' ? 'active' : ''}" onclick="window.updateStudioGrid('mode','layout')">Preset</button>
                <button class="${grid.mode === 'custom' ? 'active' : ''}" onclick="window.updateStudioGrid('mode','custom')">Custom Grid</button>
            </div>
            <div class="studio-control-grid">
                <label>
                    <span>Columns</span>
                    <input type="number" min="1" max="24" value="${grid.columns}" onchange="window.updateStudioGrid('columns', this.value)" ${grid.mode !== 'custom' ? 'disabled' : ''}>
                </label>
                <label>
                    <span>Gap</span>
                    <input type="number" min="0" max="48" value="${grid.gap}" onchange="window.updateStudioGrid('gap', this.value)">
                </label>
                <label>
                    <span>Max width</span>
                    <input type="number" min="360" max="1920" step="20" value="${grid.maxWidth}" onchange="window.updateStudioGrid('maxWidth', this.value)">
                </label>
                <label>
                    <span>Guides</span>
                    <select onchange="window.updateStudioGrid('showGuides', this.value)">
                        <option value="true" ${grid.showGuides ? 'selected' : ''}>On</option>
                        <option value="false" ${!grid.showGuides ? 'selected' : ''}>Off</option>
                    </select>
                </label>
            </div>

            <div class="inspector-title" style="margin-top:1.5rem"><i class="fa-solid fa-vector-square"></i> SELECTED SECTION</div>
            <div class="form-group" style="margin-top:1rem">
                <label class="studio-label">Section</label>
                <select class="form-control studio-input" onchange="window.selectStudioZone(this.value)">
                    ${zoneOptions}
                </select>
            </div>
            ${selected ? `
                <div class="studio-control-grid">
                    <label class="wide">
                        <span>Name</span>
                        <input value="${selected.label}" oninput="window.updateStudioZone('${selected.id}', 'label', this.value)">
                    </label>
                    <label>
                        <span>Height</span>
                        <input type="number" min="40" max="1200" step="10" value="${selected.height}" onchange="window.updateStudioZone('${selected.id}', 'height', this.value)">
                    </label>
                    <label>
                        <span>Span</span>
                        <select onchange="window.updateStudioZone('${selected.id}', 'span', this.value)">
                            ${spanOptions.map(([value, label]) => `<option value="${value}" ${selected.span === value ? 'selected' : ''}>${label}</option>`).join('')}
                        </select>
                    </label>
                    <label>
                        <span>Padding</span>
                        <input type="number" min="0" max="80" value="${selected.padding || 0}" onchange="window.updateStudioZone('${selected.id}', 'padding', this.value)">
                    </label>
                    <label>
                        <span>Align</span>
                        <select onchange="window.updateStudioZone('${selected.id}', 'align', this.value)">
                            ${['stretch', 'start', 'center', 'end'].map(v => `<option value="${v}" ${selected.align === v ? 'selected' : ''}>${v}</option>`).join('')}
                        </select>
                    </label>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem;margin-top:.75rem">
                    <button class="btn btn-secondary btn-sm" onclick="window.moveStudioZone('${selected.id}', -1)"><i class="fa-solid fa-arrow-up"></i> Move Up</button>
                    <button class="btn btn-secondary btn-sm" onclick="window.moveStudioZone('${selected.id}', 1)"><i class="fa-solid fa-arrow-down"></i> Move Down</button>
                    <button class="btn btn-secondary btn-sm" onclick="window.duplicateStudioZone('${selected.id}')"><i class="fa-solid fa-copy"></i> Duplicate</button>
                    <button class="btn btn-danger btn-sm" onclick="window.deleteStudioZone('${selected.id}')"><i class="fa-solid fa-trash"></i> Delete</button>
                </div>
            ` : ''}
            <button class="btn btn-primary btn-sm w-100" style="margin-top:1rem" onclick="window.addStudioZone()">
                <i class="fa-solid fa-plus"></i> Add Section
            </button>

            <div class="inspector-title" style="margin-top:2rem; color:var(--acc)"><i class="fa-solid fa-code"></i> SEO & META INJECTION</div>
            <div style="background:rgba(14,165,233,0.05); border:1px solid var(--acc-border); border-radius:12px; padding:1rem; margin-top:1rem">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.5rem">
                    <span style="font-size:.7rem; font-weight:800; color:var(--text2)">GLOBAL INJECTION</span>
                    <span class="badge ${STATE.seo?.injectHead ? 'badge-success' : 'badge-secondary'}" style="font-size:10px">${STATE.seo?.injectHead ? 'ACTIVE' : 'INACTIVE'}</span>
                </div>
                <div style="font-size:.65rem; color:var(--text3); line-height:1.4">
                    Template will automatically inject <strong>${STATE.seo?.title || 'Global SEO'}</strong> metadata and custom scripts into head/body.
                </div>
                <button class="btn btn-secondary btn-xs w-100" style="margin-top:.75rem; font-size:10px" onclick="go('custom-seo')">
                    <i class="fa-solid fa-external-link"></i> EDIT SEO SETTINGS
                </button>
            </div>
        </div>
    `;
}

pages['template-builder'] = () => {
    ensureBannerLayoutState();
    ensureStudioState();
    const activeLayout = builderState.layout || 'classic';
    const layoutData = LAYOUTS[activeLayout];
    const device = builderState.device || 'desktop';
    const gridTemplate = getStudioGridTemplate(layoutData);
    const studioGrid = builderState.studioGrid;

    return `
    <style>
        .studio-root { 
            display: grid; 
            grid-template-columns: 320px 1fr 340px; 
            height: calc(100vh - 120px); 
            gap: 0; 
            margin: -2rem -2rem 0 -2rem; 
            background: #020617;
            overflow: hidden;
        }
        
        /* ─── LEFT: COMPONENT REGISTRY ─── */
        .studio-shelf { 
            background: #0f172a; 
            border-right: 1px solid rgba(255,255,255,0.05); 
            display: flex; 
            flex-direction: column;
            z-index: 10;
        }
        .shelf-header { padding: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .shelf-title { font-size: .65rem; font-weight: 800; color: #64748b; letter-spacing: 1.5px; margin-bottom: 1rem; }
        
        .shelf-drag-item { 
            background: rgba(255,255,255,0.02); 
            border: 1px solid rgba(255,255,255,0.05); 
            padding: 1rem; 
            border-radius: 12px; 
            margin: 0 1.25rem .75rem 1.25rem;
            cursor: grab;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        .shelf-drag-item:hover { 
            background: rgba(14, 165, 233, 0.1); 
            border-color: var(--acc);
            transform: scale(1.02);
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .shelf-icon { 
            width: 38px; height: 38px; border-radius: 10px; 
            background: #1e293b; color: var(--acc);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.2rem;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
        }
        
        /* ─── CENTER: LIVE CANVAS ─── */
        .studio-canvas-area { 
            background: #020617; 
            overflow-y: auto; 
            padding: 4rem 2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            scroll-behavior: smooth;
            background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0);
            background-size: 30px 30px;
        }
        .viewport-frame { 
            width: 100%; 
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            background: #000;
            border-radius: 16px;
            box-shadow: 0 50px 100px rgba(0,0,0,0.8), 0 0 0 8px rgba(255,255,255,0.05);
            min-height: 1000px;
            position: relative;
            overflow: hidden;
        }
        .viewport-frame.mobile { width: 393px; min-height: 852px; border-radius: 40px; }
        .viewport-frame.tablet { width: 768px; }
        
        /* Drop Zones */
        .canvas-zone { 
            min-height: 60px;
            border: 1px dashed rgba(255,255,255,0.08); 
            margin: 4px;
            position: relative;
            transition: all 0.2s;
            overflow: hidden;
        }
        .canvas-zone.selected { outline: 2px solid var(--acc); outline-offset: -2px; background: rgba(14,165,233,0.06); }
        .canvas-zone.active-target { 
            background: rgba(14, 165, 233, 0.1); 
            border: 2px solid var(--acc); 
        }
        .canvas-zone.empty-zone::after {
            content: 'CLICK A MODULE TO ADD HERE';
            position:absolute; inset:auto 1rem 1rem 1rem; text-align:center;
            color:rgba(255,255,255,.16); font-size:.62rem; font-weight:900; letter-spacing:.12em;
        }
        .studio-grid-guides {
            background-image: linear-gradient(to right, rgba(14,165,233,.12) 1px, transparent 1px);
            background-size: calc(100% / ${studioGrid.columns}) 100%;
        }
        .zone-hint { 
            position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; 
            color: rgba(255,255,255,0.1); font-size: .65rem; font-weight: 800; letter-spacing: 2px;
            pointer-events: none;
        }
        
        /* ─── RIGHT: INSPECTOR & LAYERS ─── */
        .studio-inspector { 
            background: #0f172a; 
            border-left: 1px solid rgba(255,255,255,0.05); 
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 2rem;
            overflow-y: auto;
        }
        .inspector-title { font-size: .7rem; font-weight: 900; color: #fff; display: flex; align-items: center; gap: .5rem; }
        .studio-label { display:block; font-size:.65rem; color:#94a3b8; font-weight:800; margin-bottom:.45rem; text-transform:uppercase; letter-spacing:.08em; }
        .studio-input,
        .studio-control-grid input,
        .studio-control-grid select {
            width:100%; background:#1e293b; color:#e2e8f0; border:1px solid rgba(255,255,255,0.08);
            border-radius:10px; padding:.55rem .65rem; font-size:.78rem; outline:none;
        }
        .studio-control-grid input:disabled { opacity:.45; cursor:not-allowed; }
        .studio-segment { display:grid; grid-template-columns:1fr 1fr; gap:4px; padding:4px; background:#020617; border:1px solid rgba(255,255,255,0.06); border-radius:12px; margin:1rem 0; }
        .studio-segment button { border:0; border-radius:9px; background:transparent; color:#64748b; padding:.55rem; font-size:.72rem; font-weight:800; cursor:pointer; }
        .studio-segment button.active { background:var(--acc); color:#fff; }
        .studio-control-grid { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
        .studio-control-grid label { display:flex; flex-direction:column; gap:.35rem; color:#94a3b8; font-size:.65rem; font-weight:800; text-transform:uppercase; letter-spacing:.06em; }
        .studio-control-grid .wide { grid-column:1 / -1; }
        
        .layer-item { 
            background: #1e293b; padding: .75rem 1rem; border-radius: 10px; margin-bottom: .5rem;
            display: flex; align-items: center; justify-content: space-between;
            border: 1px solid transparent; transition: all 0.2s;
        }
        .layer-item:hover { border-color: var(--acc); background: #334155; }
        .layer-meta { display: flex; align-items: center; gap: .75rem; font-size: .8rem; font-weight: 600; }
        
        /* ─── CONTROLS ─── */
        .studio-top-bar { 
            position: absolute; top: 1.5rem; left: 340px; right: 360px;
            display: flex; justify-content: space-between; align-items: center;
            z-index: 100;
        }
        .device-selector { display:flex; background: rgba(15,23,42,0.8); backdrop-filter: blur(10px); padding: 4px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1); }
        .ds-btn { width: 44px; height: 40px; border: none; background: none; color: #64748b; cursor: pointer; border-radius: 10px; transition: all 0.2s; }
        .ds-btn.active { background: var(--acc); color: #fff; box-shadow: 0 4px 12px rgba(14,165,233,0.4); }
    </style>

    <div class="studio-root">
        <!-- COMPONENT SHELF -->
        <div class="studio-shelf">
            <div class="shelf-header">
                <div style="font-weight:900; color:#fff; margin-bottom: .25rem; display:flex; align-items:center; gap:.5rem">
                    <i class="fa-solid fa-wand-magic-sparkles" style="color:var(--acc)"></i> STUDIO X
                </div>
                <div style="font-size:.7rem; color:#64748b">Flexible layout studio</div>
            </div>
            
            <div style="flex:1; overflow-y:auto; padding-top:1.5rem">
                <div class="shelf-title" style="padding:0 1.5rem">CORE MODULES</div>
                ${renderShelfItem('Hero Banner', 'fa-image', 'hero-banner')}
                ${renderShelfItem('Game Grid', 'fa-grid-2', 'game-grid')}
                ${renderShelfItem('Jackpot Counter', 'fa-coins', 'jackpot-ticker')}
                ${renderShelfItem('News Marquee', 'fa-bolt', 'news-marquee')}
                
                <div class="shelf-title" style="padding:1.5rem 1.5rem 1rem">SOCIAL & TRUST</div>
                ${renderShelfItem('Winner Feed', 'fa-trophy', 'winner-list')}
                ${renderShelfItem('Payment Rail', 'fa-credit-card', 'payment-rail')}
                ${renderShelfItem('Live Support', 'fa-headset', 'live-chat')}
                
                <div class="shelf-title" style="padding:1.5rem 1.5rem 1rem">UX UTILITIES</div>
                ${renderShelfItem('Navigation Bar', 'fa-bars', 'nav-main')}
                ${renderShelfItem('Corporate Footer', 'fa-info-circle', 'corp-footer')}
            </div>
            
            <div style="padding:1.5rem; background: rgba(0,0,0,0.2); border-top: 1px solid rgba(255,255,255,0.05)">
                <button class="btn btn-primary w-100" style="border-radius:12px; height:48px; font-weight:800" onclick="window.saveBuilderLayout()">
                    <i class="fa-solid fa-cloud-arrow-up"></i> DEPLOY TO PROD
                </button>
            </div>
        </div>

        <!-- LIVE CANVAS -->
        <div class="studio-canvas-area" id="studioCanvas">
            <div class="studio-top-bar">
                <div class="device-selector">
                    <button class="ds-btn ${device === 'desktop' ? 'active' : ''}" onclick="window.setStudioDevice('desktop')"><i class="fa-solid fa-desktop"></i></button>
                    <button class="ds-btn ${device === 'tablet' ? 'active' : ''}" onclick="window.setStudioDevice('tablet')"><i class="fa-solid fa-tablet"></i></button>
                    <button class="ds-btn ${device === 'mobile' ? 'active' : ''}" onclick="window.setStudioDevice('mobile')"><i class="fa-solid fa-mobile-screen-button"></i></button>
                </div>
                
                <div style="display:flex; gap:.75rem">
                    <button class="btn btn-secondary btn-sm" style="border-radius:10px" onclick="go('template-preview')">
                        <i class="fa-solid fa-layer-group"></i> Library
                    </button>
                </div>
            </div>

            <div class="viewport-frame ${device}" id="canvasViewport" style="max-width:${studioGrid.maxWidth}px">
                <div class="${studioGrid.showGuides ? 'studio-grid-guides' : ''}" style="display:grid; grid-template-columns: ${gridTemplate}; gap: ${studioGrid.gap}px;">
                    ${builderState.dynamicZones.map(z => `
                        <div class="canvas-zone ${builderState.activeZone === z.id ? 'selected' : ''} ${(builderState.zones?.[z.id] || []).length ? '' : 'empty-zone'}" 
                             id="zone_${z.id}" 
                             onclick="window.selectStudioZone('${z.id}')"
                             ondragover="event.preventDefault();this.classList.add('active-target')"
                             ondragleave="this.classList.remove('active-target')"
                             ondrop="window.dropComponentToZone(event, '${z.id}')"
                             style="min-height:${z.height}px; grid-column:${z.span || 'initial'}; align-self:${z.align || 'stretch'}; padding:${z.padding || 0}px">
                            <div class="zone-hint">${z.label}</div>
                            <div id="content_${z.id}">
                                ${renderZoneItems(z.id)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <!-- PROPERTY INSPECTOR -->
        <div class="studio-inspector">
            ${renderStudioArchitecturePanel(activeLayout)}

            <div>
                <div class="inspector-title" style="margin-bottom:1rem"><i class="fa-solid fa-layer-group"></i> LAYER NAVIGATOR</div>
                <div style="max-height: 300px; overflow-y: auto">
                    ${renderLayerList()}
                </div>
            </div>

            <div style="margin-top:auto">
                <div class="card" style="background: linear-gradient(135deg, rgba(14,165,233,0.1), transparent); border: 1px solid rgba(14,165,233,0.2); border-radius:16px">
                    <div class="card-body" style="padding:1.25rem; font-size:.7rem; color:#94a3b8; line-height:1.6">
                        <i class="fa-solid fa-circle-info" style="color:var(--acc); margin-bottom:.5rem"></i><br/>
                        Selected modules are compiled into <strong>JSON Schema v4</strong> and injected into the frontend router on publish.
                    </div>
                </div>
            </div>
        </div>
    </div>`;
};

function renderShelfItem(name, icon, type) {
    return `
        <div class="shelf-drag-item" draggable="true" ondragstart="window.dragStudioComponent(event, '${type}')" onclick="window.addComponentToZone('${type}')">
            <div class="shelf-icon"><i class="fa-solid ${icon}"></i></div>
            <div style="flex:1">
                <div style="font-size:.8rem; font-weight:800; color:#fff">${name}</div>
                <div style="font-size:.65rem; color:#64748b">Dynamic Module</div>
            </div>
            <i class="fa-solid fa-plus-circle" style="opacity:.3; font-size:.8rem"></i>
        </div>
    `;
}

function renderLayerList() {
    const zones = builderState.zones || {};
    let html = '';
    Object.entries(zones).forEach(([zoneId, items]) => {
        if (items.length === 0) return;
        html += `<div style="font-size:.6rem; color:#64748b; font-weight:900; margin-bottom:.5rem; text-transform:uppercase">${zoneId}</div>`;
        items.forEach((it, idx) => {
            html += `
                <div class="layer-item">
                    <div class="layer-meta">
                        <i class="fa-solid fa-grip-vertical" style="opacity:.3"></i>
                        <span>${it.type}</span>
                    </div>
                    <button class="btn btn-xs btn-icon" style="color:#ef4444" onclick="window.removeComponentFromZone('${zoneId}', ${idx})">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
        });
    });
    return html || '<div style="text-align:center; padding:2rem; opacity:.3; font-size:.7rem">Empty Layout</div>';
}

window.setStudioDevice = (dev) => {
    builderState.device = dev;
    go('template-builder');
};

window.selectStudioZone = (id) => {
    builderState.activeZone = id;
    go('template-builder');
};

window.updateStudioGrid = (key, value) => {
    if (!builderState.studioGrid) ensureStudioState();
    if (key === 'columns' || key === 'gap' || key === 'maxWidth') {
        builderState.studioGrid[key] = parseInt(value, 10);
    } else if (key === 'showGuides') {
        builderState.studioGrid.showGuides = value === true || value === 'true';
    } else {
        builderState.studioGrid[key] = value;
    }
    go('template-builder');
};

window.updateStudioZone = (id, key, value) => {
    const zone = builderState.dynamicZones.find(z => z.id === id);
    if (!zone) return;
    if (['height', 'padding'].includes(key)) zone[key] = parseInt(value, 10);
    else zone[key] = value;
    go('template-builder');
};

window.addStudioZone = () => {
    const id = 'z-custom-' + Date.now();
    builderState.dynamicZones.push({ id, label: 'New Section', height: 220, span: '1 / -1', align: 'stretch', padding: 0 });
    if (!builderState.zones) builderState.zones = {};
    builderState.zones[id] = [];
    builderState.activeZone = id;
    go('template-builder');
};

window.deleteStudioZone = (id) => {
    if (builderState.dynamicZones.length <= 1) {
        toast('Keep at least one section on the canvas', 'warning');
        return;
    }
    builderState.dynamicZones = builderState.dynamicZones.filter(z => z.id !== id);
    if (builderState.zones) delete builderState.zones[id];
    builderState.activeZone = builderState.dynamicZones[0]?.id || null;
    go('template-builder');
};

window.duplicateStudioZone = (id) => {
    const zone = builderState.dynamicZones.find(z => z.id === id);
    if (!zone) return;
    const cloneId = 'z-copy-' + Date.now();
    builderState.dynamicZones.push({ ...zone, id: cloneId, label: `${zone.label} Copy` });
    builderState.zones[cloneId] = [...(builderState.zones?.[id] || [])].map(item => ({ ...item, id: Date.now() + Math.random() }));
    builderState.activeZone = cloneId;
    go('template-builder');
};

window.moveStudioZone = (id, direction) => {
    const index = builderState.dynamicZones.findIndex(z => z.id === id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= builderState.dynamicZones.length) return;
    const [zone] = builderState.dynamicZones.splice(index, 1);
    builderState.dynamicZones.splice(next, 0, zone);
    go('template-builder');
};

window.dragStudioComponent = (event, type) => {
    event.dataTransfer.setData('studioComponent', type);
};

window.dropComponentToZone = (event, zoneId) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('studioComponent');
    if (!type) return;
    if (!builderState.zones) builderState.zones = {};
    if (!builderState.zones[zoneId]) builderState.zones[zoneId] = [];
    builderState.zones[zoneId].push({ type, id: Date.now() });
    builderState.activeZone = zoneId;
    go('template-builder');
};

function renderZoneItems(zoneId) {
    const items = builderState.zones?.[zoneId] || [];
    if (items.length === 0) return '';
    return items.map((it, idx) => `
        <div class="preview-item" style="flex-direction:column; align-items:stretch; padding:0; background:none; border:none; margin: 4px 10px;">
            <div style="background:#1e293b; border: 1px solid rgba(255,255,255,0.05); border-bottom:0; padding:.5rem .75rem; border-radius:8px 8px 0 0; display:flex; justify-content:space-between; align-items:center">
                <div style="font-size:.65rem; font-weight:800; color:var(--acc)">
                    <i class="fa-solid fa-microchip"></i> ${it.type.toUpperCase()}
                </div>
                <button class="btn btn-xs btn-icon" onclick="window.removeComponentFromZone('${zoneId}', ${idx})" style="color:#ef4444; height:20px; width:20px">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div style="background:rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding:1.5rem; border-radius: 0 0 8px 8px; text-align:center">
                ${renderMockComponent(it.type)}
            </div>
        </div>
    `).join('');
}

function renderMockComponent(type) {
    if (type === 'hero-banner') return `<div style="height:120px; background:linear-gradient(45deg, #0f172a, #1e293b); border-radius:8px; display:flex; align-items:center; justify-content:center; color:#64748b"><i class="fa-solid fa-image fa-2x"></i></div>`;
    if (type === 'game-grid') return `<div style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px">${Array(4).fill('<div style="height:40px; background:#1e293b; border-radius:4px"></div>').join('')}</div>`;
    if (type === 'jackpot-ticker') return `<div style="color:var(--yellow); font-family:monospace; font-weight:900; font-size:1.2rem; text-shadow:0 0 10px rgba(234,179,8,0.5)">Rp 2,847,391,204</div>`;
    if (type === 'news-marquee') return `<div style="background:rgba(0,0,0,0.4); padding:.4rem; border-radius:4px; font-size:.7rem; color:var(--acc); text-align:left; border-left:3px solid var(--acc)">Breaking: Welcome to BERSAMA Platform! Huge bonuses await!</div>`;
    if (type === 'payment-rail') return `<div style="display:flex; gap:10px; justify-content:center">${['#fff', '#004aab', '#30a444', '#f7931a'].map(c => `<div style="width:30px; height:20px; background:${c}; border-radius:3px; opacity:0.6"></div>`).join('')}</div>`;
    return `<div style="font-size:.7rem; color:#64748b">DYNAMIC COMPONENT PREVIEW</div>`;
}

window.addComponentToZone = (type) => {
    const firstZone = builderState.activeZone || builderState.dynamicZones[0]?.id || 'z-hero';
    if (!builderState.zones) builderState.zones = {};
    if (!builderState.zones[firstZone]) builderState.zones[firstZone] = [];

    builderState.zones[firstZone].push({ type, id: Date.now() });
    builderState.activeZone = firstZone;
    go('template-builder');
    toast(`Added ${type} to ${firstZone}`, 'success');
};

window.removeComponentFromZone = (zoneId, index) => {
    builderState.zones[zoneId].splice(index, 1);
    go('template-builder');
    toast('Module removed', 'info');
};

window.switchBuilderLayout = (id) => {
    builderState.layout = id;
    go('template-builder');
};

window.saveBuilderLayout = () => {
    if (!STATE.savedLayouts) STATE.savedLayouts = [];
    const newTpl = {
        id: 'TPL' + Date.now(),
        name: 'My Custom Layout ' + (STATE.savedLayouts.length + 1),
        layout: builderState.layout,
        zones: builderState.zones,
        seo: { ...STATE.seo } // Inject SEO metadata into the template
    };
    STATE.savedLayouts.push(newTpl);
    saveState();
    toast('Layout Published Successfully!', 'success');
    go('template-preview');
};

const PREBUILT_TEMPLATES = [
    { id: 'custom', name: 'Custom Template', users: 21, image: 'img/templates/custom-layout.jpg', colors: ['#1e293b'] },
    { id: 'fs', name: 'Flagship Store', users: 25, image: 'img/templates/sports.png', colors: ['#543b2d', '#2b2d42', '#3b82f6', '#fbbf24', '#f87171', '#9333ea', '#db2777', '#10b981', '#2dd4bf', '#a855f7', '#3b82f6'] },
    { id: 't1', name: 'Template 1', users: 47, image: 'img/templates/template1.png', colors: ['#ccc', '#0ea5e9', '#0891b2', '#fbbf24', '#f59e0b', '#dc2626', '#111', '#5b21b6', '#db2777', '#f43f5e', '#ef4444'] },
    { id: 't13', name: 'Template 13', users: 2, image: 'img/templates/crypto.png', colors: ['#f97316'] },
    { id: 't14', name: 'Template 14', users: 1, image: 'img/templates/esports.png', colors: ['#10b981', '#fbbf24'] },
    { id: 't15', name: 'Template 15', users: 2, image: 'img/templates/mobile.png', colors: ['#3b82f6'] },
    { id: 't16', name: 'Template 16', users: 1, image: 'img/templates/lottery.png', colors: ['#1e293b'] },
    { id: 't3', name: 'Template 3', users: 11, image: 'img/templates/sports.png', colors: ['#111', '#fbbf24', '#f59e0b', '#facc15', '#a3e635', '#65a30d', '#22c55e', '#991b1b', '#be185d', '#d946ef', '#c026d3', '#831843'] },
    { id: 't4', name: 'Template 4', users: 2, image: 'img/templates/esports.png', colors: ['#111', '#dc2626', '#3b82f6', '#6366f1', '#fbbf24', '#f59e0b', '#ec4899', '#db2777', '#a855f7', '#7c3aed'] },
    { id: 't5', name: 'Template 5', users: 1, image: 'img/templates/mobile.png', colors: ['#1e293b', '#64748b', '#22c55e', '#ef4444'] },
    { id: 't6', name: 'Template 6', users: 2, image: 'img/templates/lottery.png', colors: ['#111', '#543b2d', '#22c55e', '#65a30d', '#fbbf24', '#991b1b', '#3b82f6', '#6366f1', '#cbd5e1', '#a3e635', '#bef264'] },
    { id: 't7', name: 'Template 7', users: 1, image: 'img/templates/crypto.png', colors: ['#64748b', '#6366f1'] },
    { id: 't8', name: 'Template 8', users: 3, image: 'img/templates/template1.png', colors: ['#dc2626'] },
    { id: 't9', name: 'Template 9', users: 1, image: 'img/templates/sports.png', colors: ['#111'] },
    { id: 't10', name: 'Template 10', users: 3, image: 'img/templates/esports.png', colors: ['#334155'] },
    { id: 't2', name: 'Template 2', users: 3, image: 'img/templates/mobile.png', colors: ['#3b82f6', '#0ea5e9', '#facc15', '#bef264', '#a3e635', '#22c55e', '#db2777', '#ec4899', '#f43f5e', '#ef4444', '#fca5a5', '#fbbf24'] },
    { id: 'joshoki', name: 'Template Joshoki', users: 1, image: 'img/templates/custom-layout.jpg', colors: ['#f59e0b', '#0b1120', '#2563eb', '#f97316'] },
];

pages['template-preview'] = () => {
    return `
    <style>
        .tpl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 2rem; padding: 1rem; }
        .tpl-card { 
            background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; 
            overflow: hidden; transition: all 0.3s; position: relative;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .tpl-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: var(--acc); }
        .tpl-preview { height: 180px; background: #0f172a; position: relative; overflow: hidden; border-bottom: 1px solid #f1f5f9; }
        .tpl-preview img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .tpl-preview::after { content:''; position:absolute; inset:0; background:linear-gradient(to top, rgba(2,6,23,.46), transparent 58%); pointer-events:none; }
        .tpl-card:hover .tpl-preview img { transform: scale(1.05); }
        .tpl-content { padding: 1.25rem; display: flex; flex-direction: column; align-items: center; }
        .tpl-name { font-weight: 700; font-size: 1rem; color: #334155; margin-bottom: 0.5rem; text-align: center; }
        .tpl-colors { display: flex; flex-wrap: wrap; gap: 2px; justify-content: center; margin-bottom: 0.75rem; max-width: 140px; }
        .color-sq { width: 14px; height: 14px; border: 1px solid rgba(0,0,0,0.1); }
        .tpl-usage { font-size: 0.7rem; color: #3b82f6; font-weight: 700; align-self: flex-start; margin-top: auto; }
        
        .tpl-overlay { 
            position: absolute; inset: 0; background: rgba(0,0,0,0.4); 
            display: flex; flex-direction: column; align-items: center; justify-content: center; 
            opacity: 0; transition: opacity 0.3s; gap: 0.5rem;
        }
        .tpl-card:hover .tpl-overlay { opacity: 1; }
    </style>

    ${pageHeader('Templates List', '<span>Customization</span><span class="sep">›</span><span>Templates List</span>', `
        <button class="btn btn-primary" onclick="go('template-builder')"><i class="fa-solid fa-wand-magic-sparkles"></i> Studio X</button>
    `)}

    <div class="tpl-grid">
        ${PREBUILT_TEMPLATES.map(t => `
            <div class="tpl-card">
                <div class="tpl-preview">
                    <img src="${t.image}" alt="${t.name} preview" onerror="this.src='img/templates/template1.png'"/>
                    <div class="tpl-overlay">
                        <button class="btn btn-white btn-sm" style="width:120px" onclick="window.installTemplate('${t.id}')">Apply Skin</button>
                        <button class="btn btn-primary btn-sm" style="width:120px" onclick="window.loadAndOptimizeTemplate('${t.id}', '${t.name}', '${t.colors.join(',')}')">Optimize</button>
                    </div>
                </div>
                <div class="tpl-content">
                    <div class="tpl-name">${t.name}</div>
                    <div class="tpl-colors">
                        ${t.colors.map(c => `<div class="color-sq" style="background:${c}"></div>`).join('')}
                    </div>
                    <div class="tpl-usage">In use: ${t.users}</div>
                </div>
            </div>
        `).join('')}
    </div>`;
};

window.installTemplate = (id) => {
    const t = PREBUILT_TEMPLATES.find(x => x.id === id);
    confirmAction(`Install ${t.name}`, `This will load the <strong>${t.name}</strong> pre-built configuration into the Studio. Continue?`, () => {
        // Mock installation logic - setting state based on template
        if (id === 'neon_casino') builderState.layout = 'classic';
        if (id === 'royal_sport') builderState.layout = 'sidebar_left';

        toast(`${t.name} configuration cached! Redirecting to Studio X...`, 'success');
        setTimeout(() => go('template-builder'), 800);
    });
};

window.deleteTemplatePreview = (id) => {
    STATE.savedLayouts = (STATE.savedLayouts || []).filter(t => t.id !== id);
    saveState();
    go('template-preview');
    toast('Template deleted', 'success');
};

// --- BANNERS & OTHER PLUMBING ---
const BANNER_SECTIONS = ['Home', 'Sports', 'Togel', 'Slot', 'Casino', 'Others'];

function ensureBannerLayoutState() {
    if (!STATE.bannerLayoutSections) {
        STATE.bannerLayoutSections = Object.fromEntries(BANNER_SECTIONS.map(n => [n, { desktop: [], mobile: [] }]));
    }
}

function renderTemplateMockup(id, data) {
    return `<div style="height:120px;background:linear-gradient(135deg,#0ea5e9,#8b5cf6);border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:bold;font-size:.8rem">${data.name}</div>`;
}

// Global Banner Page
pages['custom-global-banner'] = () => {
    ensureBannerLayoutState();
    if (!Array.isArray(STATE.popupBanners)) STATE.popupBanners = [];
    const banners = STATE.popupBanners;
    const TRIGGER_OPTS = ['On Login', 'On Deposit Success', 'On First Visit', 'Timed (Every X Hours)', 'Manual'];
    const TARGET_OPTS  = ['All Players', 'New Members Only', 'VIP Members', 'By Company', 'By Agent'];

    return `
    ${pageHeader('Global Banner & Popup Manager', '<span>Customization</span><span class="sep">›</span><span>Global Banner</span>', `
        <button class="btn btn-primary btn-sm" onclick="window.openPopupBannerModal()"><i class="fa-solid fa-plus"></i> Add Popup Banner</button>`)}

    <!-- Section tabs -->
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1.25rem">
        ${BANNER_SECTIONS.map((s, i) => `<button class="btn btn-sm ${i===0?'btn-primary':'btn-secondary'}" onclick="window.selectBannerSection('${s}', this)">${s}</button>`).join('')}
        <button class="btn btn-sm btn-secondary" style="margin-left:auto;border-color:var(--purple);color:var(--purple)" onclick="window.openPopupBannerModal()"><i class="fa-solid fa-window-restore"></i> Popup Banners (${banners.length})</button>
    </div>

    <!-- Popup Banners Table -->
    <div class="card" style="margin-bottom:1.25rem">
        <div class="card-header">
            <span class="card-title"><i class="fa-solid fa-window-restore" style="color:var(--purple);margin-right:.5rem"></i>Popup Banner List</span>
            <span style="margin-left:auto;font-size:.75rem;color:var(--text3)">${banners.filter(b=>b.active).length} active</span>
        </div>
        <div class="card-body" style="padding:0">
            ${tableWrap(`
                <table>
                    <thead><tr><th>Title</th><th>Trigger</th><th>Target</th><th>Priority</th><th>Start</th><th>End</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        ${banners.length === 0 ? '<tr><td colspan="8" style="text-align:center;color:var(--text3);padding:2rem">No popup banners. Click + Add to create one.</td></tr>' :
                          banners.map(b => `
                            <tr>
                                <td>
                                  <div style="display:flex;align-items:center;gap:.5rem">
                                    ${b.imageUrl ? `<img src="${b.imageUrl}" style="width:40px;height:28px;object-fit:cover;border-radius:4px;border:1px solid var(--border)" onerror="this.style.display='none'"/>` : '<div style="width:40px;height:28px;background:var(--bg2);border-radius:4px;border:1px dashed var(--border);display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-image" style="font-size:.6rem;color:var(--text3)"></i></div>'}
                                    <strong>${b.title}</strong>
                                  </div>
                                </td>
                                <td><span class="badge badge-indigo">${b.trigger || 'On Login'}</span></td>
                                <td style="font-size:.78rem">${b.target || 'All Players'}</td>
                                <td><span style="background:var(--acc)22;color:var(--acc);border-radius:4px;padding:.1rem .4rem;font-size:.75rem;font-weight:700">${b.priority || 1}</span></td>
                                <td style="font-size:.75rem">${b.startDate || '-'}</td>
                                <td style="font-size:.75rem">${b.endDate || '-'}</td>
                                <td>
                                  <label class="toggle" style="transform:scale(.8)">
                                    <input type="checkbox" ${b.active ? 'checked' : ''} onchange="window.togglePopupBanner('${b.id}', this.checked)"/>
                                    <div class="toggle-slider"></div>
                                  </label>
                                </td>
                                <td>
                                  <div style="display:flex;gap:.25rem">
                                    <button class="btn btn-xs btn-primary" onclick="window.openPopupBannerModal('${b.id}')"><i class="fa-solid fa-pen"></i></button>
                                    <button class="btn btn-xs btn-secondary" onclick="window.previewPopupBanner('${b.id}')"><i class="fa-solid fa-eye"></i></button>
                                    <button class="btn btn-xs btn-danger" onclick="window.deletePopupBanner('${b.id}')"><i class="fa-solid fa-trash"></i></button>
                                  </div>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            `)}
        </div>
    </div>

    <!-- Section Banner Area -->
    <div class="card">
        <div class="card-header"><span class="card-title" id="sectionBannerTitle">Homepage Section Banners</span></div>
        <div class="card-body">
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem" id="sectionBannerGrid">
                ${BANNER_SECTIONS.slice(0,6).map((s,i) => `
                    <div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;cursor:pointer" onclick="window.selectBannerSection('${s}', null)">
                        <div style="height:70px;background:linear-gradient(135deg,var(--acc)22,var(--bg2));display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;color:var(--text2)">${s}</div>
                        <div style="padding:.5rem .75rem;font-size:.7rem;color:var(--text3);border-top:1px solid var(--border)">${Math.floor(Math.random()*3)} banner(s)</div>
                    </div>`).join('')}
            </div>
        </div>
    </div>`;
};

// ── Popup Banner Actions ──
window.openPopupBannerModal = (id = null) => {
    if (!Array.isArray(STATE.popupBanners)) STATE.popupBanners = [];
    const b = id ? STATE.popupBanners.find(x => x.id === id) : null;
    const TRIGGER_OPTS = ['On Login', 'On Deposit Success', 'On First Visit', 'Timed (Every X Hours)', 'Manual'];
    const TARGET_OPTS  = ['All Players', 'New Members Only', 'VIP Members', 'By Company', 'By Agent'];
    openModal(b ? 'Edit Popup Banner' : 'Add Popup Banner', `
        <div class="form-grid">
            <div class="form-field" style="grid-column:1/-1"><label>Title</label><input id="pb_title" value="${b?.title||''}" placeholder="e.g. Welcome Bonus Popup"/></div>
            <div class="form-field" style="grid-column:1/-1"><label>Image URL</label><input id="pb_image" value="${b?.imageUrl||''}" placeholder="https://cdn.example.com/popup.jpg" oninput="document.getElementById('pb_img_prev').src=this.value"/></div>
            <div class="form-field" style="grid-column:1/-1;text-align:center"><img id="pb_img_prev" src="${b?.imageUrl||''}" style="max-width:100%;max-height:120px;border-radius:8px;border:1px solid var(--border);${b?.imageUrl?'':'display:none'}" onerror="this.style.display='none'" onload="this.style.display='block'"/></div>
            <div class="form-field"><label>Link URL</label><input id="pb_link" value="${b?.linkUrl||''}" placeholder="https://... or /promo"/></div>
            <div class="form-field"><label>Button Text</label><input id="pb_btn" value="${b?.buttonText||'Claim Now'}" /></div>
            <div class="form-field"><label>Trigger</label><select id="pb_trigger">${TRIGGER_OPTS.map(o=>`<option ${b?.trigger===o?'selected':''}>${o}</option>`).join('')}</select></div>
            <div class="form-field"><label>Target Audience</label><select id="pb_target">${TARGET_OPTS.map(o=>`<option ${b?.target===o?'selected':''}>${o}</option>`).join('')}</select></div>
            <div class="form-field"><label>Company Filter (blank = all)</label><input id="pb_company" value="${b?.company||''}" placeholder="Leave blank for all"/></div>
            <div class="form-field"><label>Priority (1=highest)</label><input id="pb_priority" type="number" min="1" max="99" value="${b?.priority||1}"/></div>
            <div class="form-field"><label>Start Date</label><input id="pb_start" type="date" value="${b?.startDate||''}"/></div>
            <div class="form-field"><label>End Date</label><input id="pb_end" type="date" value="${b?.endDate||''}"/></div>
            <div class="form-field"><label>Show Close Button</label><select id="pb_closeable"><option ${b?.closeable!==false?'selected':''}>Yes</option><option ${b?.closeable===false?'selected':''}>No</option></select></div>
        </div>`,
        `<button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
         <button class="btn btn-primary" onclick="window.savePopupBanner('${b?.id||''}')"><i class="fa-solid fa-check"></i> Save</button>`
    );
};

window.savePopupBanner = (id) => {
    if (!Array.isArray(STATE.popupBanners)) STATE.popupBanners = [];
    const obj = {
        id: id || 'PB' + Date.now().toString().slice(-6),
        title: document.getElementById('pb_title')?.value?.trim() || 'Popup',
        imageUrl: document.getElementById('pb_image')?.value?.trim() || '',
        linkUrl: document.getElementById('pb_link')?.value?.trim() || '',
        buttonText: document.getElementById('pb_btn')?.value?.trim() || 'Claim Now',
        trigger: document.getElementById('pb_trigger')?.value || 'On Login',
        target: document.getElementById('pb_target')?.value || 'All Players',
        company: document.getElementById('pb_company')?.value?.trim() || '',
        priority: parseInt(document.getElementById('pb_priority')?.value || '1', 10),
        startDate: document.getElementById('pb_start')?.value || '',
        endDate: document.getElementById('pb_end')?.value || '',
        closeable: document.getElementById('pb_closeable')?.value !== 'No',
        active: true,
        createdAt: id ? undefined : new Date().toISOString(),
    };
    if (!obj.title) { toast('Title required', 'error'); return; }
    if (id) {
        const idx = STATE.popupBanners.findIndex(b => b.id === id);
        if (idx >= 0) STATE.popupBanners[idx] = { ...STATE.popupBanners[idx], ...obj };
    } else {
        STATE.popupBanners.unshift(obj);
    }
    saveState();
    closeModalBtn();
    go('custom-global-banner');
    toast('Popup banner saved', 'success');
};

window.togglePopupBanner = (id, val) => {
    const b = (STATE.popupBanners||[]).find(x=>x.id===id);
    if (b) { b.active = val; saveState(); }
};

window.deletePopupBanner = (id) => {
    STATE.popupBanners = (STATE.popupBanners||[]).filter(x=>x.id!==id);
    saveState(); go('custom-global-banner'); toast('Deleted', 'success');
};

window.previewPopupBanner = (id) => {
    const b = (STATE.popupBanners||[]).find(x=>x.id===id);
    if (!b) return;
    openModal('Preview: ' + b.title, `
        <div style="background:#0f172a;border-radius:16px;overflow:hidden;max-width:400px;margin:0 auto;box-shadow:0 20px 60px rgba(0,0,0,.5)">
            ${b.imageUrl ? `<img src="${b.imageUrl}" style="width:100%;display:block" onerror="this.style.display='none'"/>` : '<div style="height:120px;background:linear-gradient(135deg,var(--acc),#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:2rem">🎰</div>'}
            <div style="padding:1.5rem;text-align:center">
                <div style="font-size:1.2rem;font-weight:800;margin-bottom:.75rem;color:#fff">${b.title}</div>
                ${b.linkUrl ? `<a href="${b.linkUrl}" style="display:inline-block;background:var(--acc);color:#fff;border-radius:10px;padding:.6rem 2rem;font-weight:700;text-decoration:none">${b.buttonText}</a>` : ''}
                ${b.closeable!==false ? '<div style="font-size:.7rem;color:rgba(255,255,255,.3);margin-top:.75rem;cursor:pointer">✕ Close</div>' : ''}
            </div>
        </div>`, `<button class="btn btn-secondary" onclick="closeModalBtn()">Close</button>`);
};

window.selectBannerSection = (section, btn) => {
    document.querySelectorAll('.tpl-filter-btn').forEach(b => b?.classList?.remove('active'));
    if (btn) btn.classList?.add('active');
    const title = document.getElementById('sectionBannerTitle');
    if (title) title.textContent = section + ' Section Banners';
    toast('Section: ' + section, 'info');
};
// ─── BRANDING & THEME (LIVE PREVIEW) ───
pages['custom-theme'] = () => {
    const config = STATE.siteConfig || {};
    const primary = config.primaryColor || '#0ea5e9';
    const secondary = config.secondaryColor || '#0f172a';
    const accent = config.accentColor || '#fbbf24';

    return `
    ${pageHeader('Branding & Theme', '<span>Customization</span><span class="sep">›</span><span>Branding & Theme</span>', `
        <button class="btn btn-primary" onclick="toast('Theme settings saved and synced!','success')"><i class="fa-solid fa-cloud-arrow-up"></i> Save & Publish</button>
    `)}

    <div style="display:grid;grid-template-columns:380px 1fr;gap:2rem">
        <div style="display:flex;flex-direction:column;gap:1.5rem">
            <div class="card" style="border-radius:20px">
                <div class="card-header"><span class="card-title">Color Palette</span></div>
                <div class="card-body" style="padding:1.5rem">
                    <div class="form-group">
                        <label class="form-label">Primary Color</label>
                        <div style="display:flex;gap:1rem;align-items:center">
                            <input type="color" value="${primary}" oninput="window.updateLiveTheme('primary', this.value)" style="width:50px;height:50px;border:none;background:none;cursor:pointer" />
                            <input type="text" value="${primary}" id="theme_primary_text" class="form-control" style="font-family:monospace" readonly />
                        </div>
                    </div>
                    <div class="form-group" style="margin-top:1.5rem">
                        <label class="form-label">Secondary / Sidebar</label>
                        <div style="display:flex;gap:1rem;align-items:center">
                            <input type="color" value="${secondary}" oninput="window.updateLiveTheme('secondary', this.value)" style="width:50px;height:50px;border:none;background:none;cursor:pointer" />
                            <input type="text" value="${secondary}" id="theme_secondary_text" class="form-control" style="font-family:monospace" readonly />
                        </div>
                    </div>
                    <div class="form-group" style="margin-top:1.5rem">
                        <label class="form-label">Accent / Highlights</label>
                        <div style="display:flex;gap:1rem;align-items:center">
                            <input type="color" value="${accent}" oninput="window.updateLiveTheme('accent', this.value)" style="width:50px;height:50px;border:none;background:none;cursor:pointer" />
                            <input type="text" value="${accent}" id="theme_accent_text" class="form-control" style="font-family:monospace" readonly />
                        </div>
                    </div>
                </div>
            </div>

            <div class="card" style="border-radius:20px">
                <div class="card-header"><span class="card-title">Logo & Typography</span></div>
                <div class="card-body" style="padding:1.5rem">
                    <div class="form-group">
                        <label class="form-label">Site Title</label>
                        <input class="form-control" value="${config.siteName || 'BERSAMA'}" oninput="window.updateLiveTheme('name', this.value)" placeholder="Enter site name" />
                    </div>
                    <div class="form-group" style="margin-top:1.5rem">
                        <label class="form-label">Font Family</label>
                        <select class="form-control" onchange="window.updateLiveTheme('font', this.value)">
                            <option value="Inter">Inter (Sans-Serif)</option>
                            <option value="Roboto">Roboto</option>
                            <option value="Outfit">Outfit (Modern)</option>
                            <option value="Oswald">Oswald (Bold)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:1.5rem">
            <div style="font-size:.8rem;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:-.5rem">Live Player-Site Preview</div>
            
            <div class="card" id="themePreviewIframe" style="border-radius:24px;border:8px solid var(--sb2);height:600px;overflow:hidden;background:#f8fafc;position:relative;box-shadow:var(--shadow-lg)">
                <!-- MOCK PLAYER SITE -->
                <div id="mockPlayerSite" style="height:100%;display:flex;flex-direction:column;font-family:Inter, sans-serif">
                    <!-- Nav -->
                    <div id="mockNav" style="background:${secondary};height:60px;padding:0 2rem;display:flex;align-items:center;justify-content:space-between">
                        <div id="mockLogo" style="color:#fff;font-weight:900;font-size:1.2rem;display:flex;align-items:center;gap:.5rem">
                            <i class="fa-solid fa-bolt" style="color:${primary}"></i>
                            <span id="mockName">${config.siteName || 'BERSAMA'}</span>
                        </div>
                        <div style="display:flex;gap:1.5rem;color:rgba(255,255,255,0.7);font-size:.8rem;font-weight:600">
                            <span>SPORTS</span><span>SLOT</span><span>CASINO</span><span>TOGEL</span>
                        </div>
                        <button style="background:${primary};color:#fff;border:none;padding:.6rem 1.2rem;border-radius:8px;font-weight:700;font-size:.75rem">LOGIN / REGISTER</button>
                    </div>
                    <!-- Hero -->
                    <div id="mockHero" style="height:240px;background:linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://placehold.co/1200x600/1e293b/white?text=PROMOTION+BANNER');background-size:cover;background-position:center;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-align:center">
                        <h2 style="font-size:2rem;font-weight:900;margin-bottom:.5rem">JACKPOT SURGE 2026</h2>
                        <div style="background:rgba(0,0,0,0.4);backdrop-filter:blur(10px);padding:.5rem 1.5rem;border-radius:30px;font-size:1.5rem;font-weight:800;color:${accent};border:1px solid ${accent}55">Rp 2.847.391.204</div>
                    </div>
                    <!-- Grid -->
                    <div style="padding:2rem;flex:1">
                        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:1rem">
                            ${Array.from({ length: 4 }).map(() => `
                                <div style="aspect-ratio:4/5;background:#fff;border-radius:15px;box-shadow:0 4px 6px rgba(0,0,0,0.05);overflow:hidden;display:flex;flex-direction:column">
                                    <div style="flex:1;background:linear-gradient(45deg, #f1f5f9, #e2e8f0)"></div>
                                    <div style="padding:.75rem;font-weight:700;font-size:.7rem;text-align:center">PRAGMATIC PLAY</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <!-- Status Bar -->
                    <div style="background:${primary};height:40px;padding:0 2rem;display:flex;align-items:center;gap:1.5rem;color:#fff;font-size:.7rem;font-weight:600">
                        <span><i class="fa-solid fa-bullhorn" style="margin-right:.5rem"></i> Welcome to the most trusted gaming platform...</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
};

window.updateLiveTheme = (key, val) => {
    const mock = document.getElementById('mockPlayerSite');
    if (!mock) return;

    if (key === 'primary') {
        mock.querySelector('button').style.background = val;
        mock.querySelector('.fa-bolt').style.color = val;
        mock.querySelector('div:last-child').style.background = val;
        document.getElementById('theme_primary_text').value = val;
    }
    if (key === 'secondary') {
        document.getElementById('mockNav').style.background = val;
        document.getElementById('theme_secondary_text').value = val;
    }
    if (key === 'accent') {
        const jkp = mock.querySelector('h2 + div');
        jkp.style.color = val;
        jkp.style.borderColor = val + '55';
        document.getElementById('theme_accent_text').value = val;
    }
    if (key === 'name') {
        document.getElementById('mockName').textContent = val;
    }
    if (key === 'font') {
        mock.style.fontFamily = `${val}, sans-serif`;
    }
};

// ─────────────────────────────────────────────
//  ANNOUNCEMENT LIST + CRUD
// ─────────────────────────────────────────────
pages['announcement-list'] = () => {
    const PG = 'announcement-list';
    const anns = STATE.announcements || [];
    const filtered = filterData(anns, PG);
    const total = filtered.length;
    const pp = getPerPage(PG);
    const cp = getCurPage(PG);
    const rows = paginate(filtered, cp, pp);
    const TYPE_COLORS = { info: 'blue', success: 'success', warning: 'warning', danger: 'danger', error: 'danger' };

    return `
    ${pageHeader('Announcements', '<span>Customization</span><span class="sep">›</span><span>Announcements</span>', `
        <button class="btn btn-primary" onclick="window.openAnnouncementForm()"><i class="fa-solid fa-plus"></i> Add Announcement</button>`)}

    ${filterCard(`
        ${fsInput(PG, 'title', 'Title', 'Search title...')}
        ${fsSelect(PG, 'type', 'Type', ['All', 'info', 'success', 'warning', 'danger'])}
        ${fsActions(PG)}
    `)}

    ${tableWrap(`
        <table>
            <thead>
                <tr>
                    <th>#</th><th>Title</th><th>Content</th><th>Type</th>
                    <th>Priority</th><th>Status</th><th>Company</th><th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${rows.length === 0 ? '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text3)">No announcements found. Click Add Announcement to create one.</td></tr>' : ''}
                ${rows.map((a, i) => `
                    <tr>
                        <td style="color:var(--text3)">${i + 1 + (cp - 1) * pp}</td>
                        <td><div style="font-weight:700;color:var(--acc)">${a.title || '-'}</div></td>
                        <td style="max-width:260px;font-size:.78rem;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.content || '-'}</td>
                        <td>${badge(a.type || 'info', TYPE_COLORS[a.type] || 'blue')}</td>
                        <td style="font-weight:700">${a.priority || 0}</td>
                        <td>
                            <label class="toggle">
                                <input type="checkbox" ${(a.isActive !== false && a.is_active !== false) ? 'checked' : ''} onchange="window.toggleAnnouncement('${a.id}', this.checked)"/>
                                <div class="toggle-slider"></div>
                            </label>
                        </td>
                        <td style="font-size:.75rem;color:var(--text3)">${a.company || '<span style="opacity:.5">Global</span>'}</td>
                        <td>${actionBtns(
                            `window.openAnnouncementForm('${a.id}')`,
                            `confirmAction('Delete Announcement','Delete this announcement? Cannot be undone.',()=>window.deleteAnnouncement('${a.id}'),'Delete','danger')`
                        )}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `)}
    ${renderPagerHTML(PG, total, pp, cp)}
    `;
};

window.openAnnouncementForm = (id = null) => {
    const a = id ? (STATE.announcements || []).find(x => x.id === id) : null;
    openModal(a ? 'Edit Announcement' : 'Add Announcement', `
        <div class="form-grid">
            <div class="form-field" style="grid-column:1/-1"><label>Title</label><input id="an2_title" value="${a?.title || ''}" placeholder="Announcement title..."/></div>
            <div class="form-field" style="grid-column:1/-1"><label>Content</label><textarea id="an2_content" rows="4" placeholder="Announcement content...">${a?.content || ''}</textarea></div>
            <div class="form-field"><label>Type</label>
                <select id="an2_type">
                    ${['info','success','warning','danger'].map(t => `<option value="${t}" ${(a?.type||'info')===t?'selected':''}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`).join('')}
                </select>
            </div>
            <div class="form-field"><label>Priority (higher = shown first)</label><input type="number" id="an2_priority" value="${a?.priority || 0}" min="0" max="100"/></div>
            <div class="form-field"><label>Company (blank = Global)</label><input id="an2_company" value="${a?.company || ''}" placeholder="Leave blank for all companies"/></div>
            <div class="form-field" style="display:flex;align-items:center;gap:.75rem;padding-top:1.2rem">
                <label class="toggle"><input type="checkbox" id="an2_active" ${(a?.isActive!==false&&a?.is_active!==false)?'checked':''}/><div class="toggle-slider"></div></label>
                <span style="font-size:.85rem">Active (visible to users)</span>
            </div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-primary" onclick="window.saveAnnouncement('${id||''}')">Save Announcement</button>
    `);
};

window.saveAnnouncement = async (id) => {
    const title    = document.getElementById('an2_title')?.value?.trim();
    const content  = document.getElementById('an2_content')?.value?.trim();
    const type     = document.getElementById('an2_type')?.value;
    const priority = parseInt(document.getElementById('an2_priority')?.value) || 0;
    const company  = document.getElementById('an2_company')?.value?.trim() || null;
    const isActive = document.getElementById('an2_active')?.checked;
    if (!title) { toast('Title is required', 'error'); return; }
    const payload = { title, content, type, priority, company, isActive };

    if (id && id !== 'null') {
        if (window.db?.dbUpdateAnnouncement) {
            const { error } = await window.db.dbUpdateAnnouncement(id, payload);
            if (error) { toast('Update failed: ' + error.message, 'error'); return; }
            if (window.db?.dbWriteLog) window.db.dbWriteLog('Update Announcement', id, `Updated: ${title}`);
        } else {
            const i = (STATE.announcements||[]).findIndex(x => x.id === id);
            if (i !== -1) STATE.announcements[i] = { ...STATE.announcements[i], ...payload };
            saveState();
        }
        toast('Announcement updated', 'success');
    } else {
        if (window.db?.dbAddAnnouncement) {
            const { error } = await window.db.dbAddAnnouncement(payload);
            if (error) { toast('Failed: ' + error.message, 'error'); return; }
            if (window.db?.dbWriteLog) window.db.dbWriteLog('Add Announcement', 'new', `Created: ${title}`);
        } else {
            STATE.announcements = STATE.announcements || [];
            STATE.announcements.unshift({ id: 'ANN' + Date.now(), ...payload });
            saveState();
        }
        toast('Announcement created', 'success');
    }
    closeModalBtn();
    go('announcement-list');
};

window.deleteAnnouncement = async (id) => {
    if (window.db?.dbDeleteAnnouncement) {
        const { error } = await window.db.dbDeleteAnnouncement(id);
        if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
        if (window.db?.dbWriteLog) window.db.dbWriteLog('Delete Announcement', id, 'Deleted announcement');
    } else {
        STATE.announcements = (STATE.announcements || []).filter(x => x.id !== id);
        saveState();
    }
    toast('Announcement deleted', 'success');
    go('announcement-list');
};

window.toggleAnnouncement = async (id, checked) => {
    if (window.db?.dbUpdateAnnouncement) {
        await window.db.dbUpdateAnnouncement(id, { isActive: checked });
    } else {
        const a = (STATE.announcements || []).find(x => x.id === id);
        if (a) { a.isActive = checked; saveState(); }
    }
    toast(`Announcement ${checked ? 'activated' : 'deactivated'}`, 'info');
};


/* ─── NAWALA SCANNER ─── */
import { STATE, saveState, addLog, fmtCur } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsSelect, fsActions, tableWrap, badge, renderPagerHTML, openModal, closeModalBtn, toast } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage, COMPANIES } from '../utils/helpers.js';
import { SUPABASE_ENABLED } from '../core/supabase.js';
import { scopedCompanies, getScopeSummary } from '../utils/scope.js';
const STRICT_REAL_MODE = String((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_STRICT_REAL_MODE) || '').toLowerCase() === 'true';

// ══════════════════════════════════════════════════════════════
//  ISP CONFIGURATION
// ══════════════════════════════════════════════════════════════
const ISP_LIST = [
    { id: 'indosat',   name: 'Indosat',    fullName: 'Indosat Ooredoo Hutchison', color: '#f59e0b', bgColor: 'rgba(245,158,11,.12)', icon: 'fa-signal' },
    { id: 'telkomsel', name: 'Telkomsel',  fullName: 'Telkomsel (Tsel)',          color: '#ef4444', bgColor: 'rgba(239,68,68,.12)',  icon: 'fa-signal' },
    { id: 'axis',      name: 'AXIS',       fullName: 'AXIS / H3 Indonesia',       color: '#8b5cf6', bgColor: 'rgba(139,92,246,.12)', icon: 'fa-signal' },
    { id: 'xl',        name: 'XL',         fullName: 'XL Axiata',                 color: '#3b82f6', bgColor: 'rgba(59,130,246,.12)', icon: 'fa-signal' },
    { id: 'smartfren', name: 'Smartfren',  fullName: 'Smartfren Telecom',         color: '#10b981', bgColor: 'rgba(16,185,129,.12)', icon: 'fa-signal' },
];
const DOMAIN_RE = /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,}$/i;

// ── State helpers ──
function getNawalaResults() {
    if (!STATE.nawalaResults) STATE.nawalaResults = {};
    return STATE.nawalaResults;
}

// Returns ALL nawala targets stored globally (cross-role).
// Each target has an optional `addedBy` field (admin id who added it).
function _getAllNawalaTargets() {
    if (!STATE.nawalaTargets || STATE.nawalaTargets.length === 0) {
        // Auto-seed from ALL companies on first run (SuperAdmin level)
        STATE.nawalaTargets = (STATE.companies || []).map(c => ({
            id: c.id ? ('NT_' + c.id) : ('NT_' + (c.username || c.name)),
            company: c.username || c.name || c,
            domain: c.domain || c.website || guessCompanyDomain(c.username || c.name || c),
            active: true,
            addedBy: 'adm-1',  // attributed to SuperAdmin seed
        }));
        // Fallback demo targets if companies list is empty
        if (STATE.nawalaTargets.length === 0 && !STRICT_REAL_MODE) {
            STATE.nawalaTargets = COMPANIES.slice(0, 12).map((c, i) => ({
                id: 'NT_' + i,
                company: c,
                domain: guessCompanyDomain(c),
                active: true,
                addedBy: 'adm-1',
            }));
        }
    }
    return STATE.nawalaTargets;
}

// Scoped view: filter to only companies visible to the current admin.
function getNawalaTargets() {
    const all = _getAllNawalaTargets();
    const { role } = STATE.currentAdmin;
    if (role === 'SuperAdmin') return all;

    // Build set of company usernames in scope
    const myCos = scopedCompanies();
    const scopeSet = new Set(myCos.map(c => (c.username || c.name || c).toLowerCase()));

    return all.filter(t => scopeSet.has((t.company || '').toLowerCase()));
}

// Returns scoped company list for dropdowns/datalists
function getScopedCompanyList() {
    const cos = scopedCompanies();
    return cos.map(c => (typeof c === 'string' ? c : (c.username || c.name)));
}
function guessCompanyDomain(name) {
    return (name || 'site').toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
}
function getProxyUrl(isp) {
    const configured = STATE.settings?.['nawala_proxy_' + isp];
    if (configured) return configured;
    // Default internal proxy endpoints — replace with real proxy URLs in production
    return `https://nawala-proxy.vigor.internal/check/${isp}`;
}
function getScanResult(domain, ispId) {
    return getNawalaResults()?.[domain]?.[ispId] || null;
}
function getOverallStatus(domain) {
    const results = getNawalaResults()?.[domain] || {};
    const statuses = ISP_LIST.map(isp => results[isp.id]?.status || 'unchecked');
    if (statuses.every(s => s === 'unchecked')) return 'unchecked';
    if (statuses.some(s => s === 'blocked')) return 'partial';
    if (statuses.every(s => s === 'accessible')) return 'accessible';
    if (statuses.every(s => s === 'blocked')) return 'blocked';
    return 'partial';
}

// ── Status badge renderer ──
function ispBadge(result) {
    if (!result) return `<span style="font-size:1rem;opacity:0.3" title="Not scanned">○</span>`;
    if (result.scanning) return `<span class="nawala-spin" style="color:var(--acc);font-size:.85rem" title="Scanning..."><i class="fa-solid fa-spinner fa-spin"></i></span>`;
    switch (result.status) {
        case 'accessible': return `<span style="color:var(--green);font-size:.95rem" title="Accessible (${result.latency}ms)"><i class="fa-solid fa-circle-check"></i></span>`;
        case 'blocked':    return `<span style="color:var(--red);font-size:.95rem" title="BLOCKED by Nawala"><i class="fa-solid fa-ban"></i></span>`;
        case 'timeout':    return `<span style="color:var(--yellow);font-size:.95rem" title="Timeout (>${result.latency}ms)"><i class="fa-solid fa-clock"></i></span>`;
        case 'error':      return `<span style="color:var(--text3);font-size:.95rem" title="${result.message || 'Error'}"><i class="fa-solid fa-triangle-exclamation"></i></span>`;
        default:           return `<span style="font-size:1rem;opacity:0.3">○</span>`;
    }
}

// ══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════
pages['nawala-scan'] = () => {
    const PG = 'nawala-scan';
    const targets = getNawalaTargets();   // already scoped
    const results = getNawalaResults();
    const scopeInfo = getScopeSummary();

    // KPI aggregation
    let totalAccessible = 0, totalBlocked = 0, totalPartial = 0, totalUnchecked = 0;
    targets.filter(t => t.active).forEach(t => {
        const s = getOverallStatus(t.domain);
        if (s === 'accessible') totalAccessible++;
        else if (s === 'blocked') totalBlocked++;
        else if (s === 'partial') totalPartial++;
        else totalUnchecked++;
    });
    const totalSites = targets.filter(t => t.active).length;

    const filtered = filterData(targets.filter(t => t.active), PG);
    const total = filtered.length;
    const pp = getPerPage(PG);
    const cp = getCurPage(PG);
    const rows = paginate(filtered, cp, pp);

    const scanActive = STATE._nawalaScanning || false;
    const lastScan = STATE._nawalaLastScan ? new Date(STATE._nawalaLastScan).toLocaleString('id-ID') : '-';

    return `
    ${pageHeader('Nawala Scanner', '<span>Tools</span><span class="sep">›</span><span>Nawala Scanner</span>', `
        <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
            <span style="font-size:.72rem;color:var(--text3)">Last: ${lastScan}</span>
            <div style="display:flex;align-items:center;gap:.35rem;background:var(--bg2);padding:.25rem .5rem;border-radius:8px;border:1px solid var(--border)">
                <i class="fa-solid fa-clock-rotate-left" style="font-size:.75rem;color:var(--text3)"></i>
                <select id="nawala_auto_interval" class="form-control" style="width:110px;height:24px;font-size:.72rem;padding:0 .3rem;border:none" onchange="window.updateNawalaInterval(this.value)">
                    ${[1, 2, 5, 10, 15, 30, 45, 60].map(m => `<option value="${m}" ${STATE._nawalaAutoInterval == m ? 'selected' : ''}>Every ${m}m</option>`).join('')}
                </select>
                <button class="btn btn-sm btn-${STATE._nawalaAutoRunning ? 'danger' : 'success'}" style="width:24px;height:24px;padding:0;display:flex;align-items:center;justify-content:center;border-radius:4px" onclick="window.toggleNawalaAutoScan()" title="${STATE._nawalaAutoRunning ? 'Stop Auto-Scan' : 'Start Auto-Scan'}">
                    <i class="fa-solid fa-${STATE._nawalaAutoRunning ? 'pause' : 'play'}" style="font-size:.7rem"></i>
                </button>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.openNawalaSettings()"><i class="fa-solid fa-gear"></i> Proxy Config</button>
            <button class="btn btn-secondary btn-sm" onclick="window.openAddNawalaTarget()"><i class="fa-solid fa-plus"></i> Add Target</button>
            <button class="btn btn-secondary btn-sm" onclick="window.exportNawalaCSV()"><i class="fa-solid fa-download"></i> Export</button>
            <button class="btn btn-${scanActive ? 'danger' : 'primary'} btn-sm" id="btnScanAll" onclick="window.${scanActive ? 'stopNawalaScan' : 'startNawalaScanAll'}()">
                <i class="fa-solid fa-${scanActive ? 'stop' : 'satellite-dish'}"></i> ${scanActive ? 'Stop Scan' : 'Scan All'}
            </button>
        </div>
    `)}

    <!-- SCOPE BANNER (non-SuperAdmin only) -->
    ${scopeInfo ? `
    <div style="display:flex;align-items:center;gap:.75rem;padding:.6rem 1rem;background:rgba(14,165,233,.07);border:1px solid rgba(14,165,233,.2);border-radius:10px;margin-bottom:1.25rem;font-size:.8rem">
        <i class="fa-solid fa-sitemap" style="color:var(--acc)"></i>
        <div>
            <strong style="color:var(--acc)">${scopeInfo.roleLabel}: ${scopeInfo.company}</strong>
            <span style="color:var(--text3);margin-left:.75rem">Menampilkan <strong>${targets.length}</strong> website milik organisasi Anda dan downline-nya</span>
        </div>
        <span style="margin-left:auto;font-size:.72rem;color:var(--text3)">${scopeInfo.companyCount} company dalam scope</span>
    </div>` : ''}

    <!-- KPI CARDS -->
    <div class="stat-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:1.5rem">
        <div class="stat-card">
            <div class="stat-icon" style="background:rgba(14,165,233,.1);color:var(--acc)"><i class="fa-solid fa-globe"></i></div>
            <div class="stat-info"><div class="stat-label">Total Sites</div><div class="stat-value">${totalSites}</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:rgba(16,185,129,.1);color:var(--green)"><i class="fa-solid fa-circle-check"></i></div>
            <div class="stat-info"><div class="stat-label">Accessible</div><div class="stat-value" style="color:var(--green)">${totalAccessible}</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:rgba(239,68,68,.1);color:var(--red)"><i class="fa-solid fa-ban"></i></div>
            <div class="stat-info"><div class="stat-label">Fully Blocked</div><div class="stat-value" style="color:var(--red)">${totalBlocked}</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:rgba(245,158,11,.1);color:var(--yellow)"><i class="fa-solid fa-shield-halved"></i></div>
            <div class="stat-info"><div class="stat-label">Partially Blocked</div><div class="stat-value" style="color:var(--yellow)">${totalPartial}</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:rgba(148,163,184,.1);color:var(--text3)"><i class="fa-solid fa-circle-question"></i></div>
            <div class="stat-info"><div class="stat-label">Not Scanned</div><div class="stat-value">${totalUnchecked}</div></div>
        </div>
    </div>

    <!-- SCAN PROGRESS BAR -->
    <div id="nawala_progress_wrap" style="display:${scanActive ? 'block' : 'none'};margin-bottom:1.25rem">
        <div class="card" style="padding:1.25rem 1.5rem;border:1px solid rgba(14,165,233,.25);background:rgba(14,165,233,.05)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
                <div style="display:flex;align-items:center;gap:.75rem">
                    <i class="fa-solid fa-satellite-dish fa-beat" style="color:var(--acc);font-size:1.2rem"></i>
                    <div>
                        <div style="font-weight:700;font-size:.9rem">Scanning in progress...</div>
                        <div id="nawala_scan_status" style="font-size:.75rem;color:var(--text3)">Initializing...</div>
                    </div>
                </div>
                <div id="nawala_progress_pct" style="font-weight:900;font-size:1.5rem;color:var(--acc)">0%</div>
            </div>
            <div style="background:var(--bg3);border-radius:999px;height:8px;overflow:hidden">
                <div id="nawala_progress_bar" style="height:100%;background:linear-gradient(90deg,var(--acc),#8b5cf6);border-radius:999px;transition:width .3s;width:0%"></div>
            </div>
        </div>
    </div>

    <!-- LEGEND -->
    <div style="display:flex;gap:1.5rem;align-items:center;margin-bottom:1rem;flex-wrap:wrap">
        <span style="font-size:.78rem;font-weight:600;color:var(--text3)">Legend:</span>
        <span style="font-size:.82rem;display:flex;align-items:center;gap:.35rem"><i class="fa-solid fa-circle-check" style="color:var(--green)"></i> Accessible</span>
        <span style="font-size:.82rem;display:flex;align-items:center;gap:.35rem"><i class="fa-solid fa-ban" style="color:var(--red)"></i> Blocked</span>
        <span style="font-size:.82rem;display:flex;align-items:center;gap:.35rem"><i class="fa-solid fa-clock" style="color:var(--yellow)"></i> Timeout</span>
        <span style="font-size:.82rem;display:flex;align-items:center;gap:.35rem"><i class="fa-solid fa-triangle-exclamation" style="color:var(--text3)"></i> Error</span>
        <span style="font-size:.82rem;display:flex;align-items:center;gap:.35rem">○ Not Scanned</span>
        <div style="margin-left:auto;font-size:.75rem;color:var(--text3)">
            <i class="fa-solid fa-info-circle"></i> Scan checks each site through real ISP proxy nodes
        </div>
    </div>

    ${filterCard(`
        ${fsInput(PG, 'company', 'Company', 'Search company...')}
        ${fsInput(PG, 'domain', 'Domain', 'Search domain...')}
        ${fsSelect(PG, 'overallStatus', 'Status', [
            ['', 'All Status'],
            ['accessible', 'Accessible'],
            ['partial', 'Partially Blocked'],
            ['blocked', 'Fully Blocked'],
            ['unchecked', 'Not Scanned'],
        ])}
        ${fsActions(PG)}
    `)}

    <!-- RESULTS TABLE -->
    <div class="card" id="nawala_table_card">
        <div class="card-header">
            <span class="card-title">Site Status per ISP Proxy</span>
            <div style="display:flex;gap:1rem;margin-left:auto">
                ${ISP_LIST.map(isp => `
                    <div style="display:flex;align-items:center;gap:.35rem;font-size:.75rem;font-weight:700;color:${isp.color}">
                        <i class="fa-solid fa-circle" style="font-size:.5rem"></i>
                        ${isp.name}
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="card-body" style="padding:0">
            ${tableWrap(`
                <table id="nawala_main_table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Company</th>
                            <th>Domain</th>
                            <th style="text-align:center">Overall</th>
                            ${ISP_LIST.map(isp => `<th style="text-align:center;color:${isp.color};white-space:nowrap"><i class="fa-solid fa-circle" style="font-size:.5rem"></i> ${isp.name}</th>`).join('')}
                            <th style="text-align:center">Latency</th>
                            <th>Last Scan</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody id="nawala_tbody">
                        ${rows.map((t, i) => renderNawalaRow(t, i)).join('')}
                    </tbody>
                </table>
            `)}
        </div>
    </div>

    ${renderPagerHTML(PG, total, pp, cp)}

    <style>
        #nawala_main_table td { vertical-align: middle; }
        .nawala-domain { font-family: monospace; font-size:.82rem; color:var(--acc); }
        .nawala-isp-cell { text-align:center; min-width:60px; }
        .nawala-row-blocked td { background: rgba(239,68,68,.03); }
        .nawala-row-partial td { background: rgba(245,158,11,.03); }
        @keyframes nawala-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .nawala-scanning-row { animation: nawala-pulse 1.2s infinite; }
    </style>
    `;
};

function renderNawalaRow(t, i) {
    const results = getNawalaResults();
    const domainResults = results[t.domain] || {};
    const overall = getOverallStatus(t.domain);

    const overallBadge = {
        accessible: `<span style="color:var(--green);font-weight:700;font-size:.78rem">✓ OK</span>`,
        blocked:    `<span style="color:var(--red);font-weight:700;font-size:.78rem">✗ BLOCKED</span>`,
        partial:    `<span style="color:var(--yellow);font-weight:700;font-size:.78rem">⚠ PARTIAL</span>`,
        unchecked:  `<span style="color:var(--text3);font-size:.78rem">—</span>`,
    }[overall] || `<span style="color:var(--text3);font-size:.78rem">—</span>`;

    const latencies = ISP_LIST.map(isp => domainResults[isp.id]?.latency).filter(Boolean);
    const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null;
    const lastScanTimes = ISP_LIST.map(isp => domainResults[isp.id]?.timestamp).filter(Boolean);
    const lastScan = lastScanTimes.length ? new Date(Math.max(...lastScanTimes.map(ts => new Date(ts)))).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

    const rowClass = overall === 'blocked' ? 'nawala-row-blocked' : overall === 'partial' ? 'nawala-row-partial' : '';

    return `
        <tr class="${rowClass}" id="nawala_row_${t.id}">
            <td>${i + 1}</td>
            <td>
                <div style="font-weight:700;font-size:.85rem">${t.company}</div>
            </td>
            <td>
                <a class="nawala-domain" href="https://${t.domain}" target="_blank" onclick="event.stopPropagation()">${t.domain}</a>
            </td>
            <td style="text-align:center">${overallBadge}</td>
            ${ISP_LIST.map(isp => `
                <td class="nawala-isp-cell" id="nawala_cell_${t.id}_${isp.id}">
                    ${ispBadge(domainResults[isp.id] || null)}
                </td>
            `).join('')}
            <td style="text-align:center;font-size:.78rem;font-family:monospace">
                ${avgLatency ? `<span style="color:${avgLatency < 800 ? 'var(--green)' : avgLatency < 2000 ? 'var(--yellow)' : 'var(--red)'}">${avgLatency}ms</span>` : '-'}
            </td>
            <td style="font-size:.72rem;white-space:nowrap">${lastScan}</td>
            <td>
                <div style="display:flex;gap:.3rem">
                    <button class="btn btn-sm btn-primary" id="nawala_btn_${t.id}" onclick="window.scanSingleTarget('${t.id}','${t.domain}')" title="Scan this domain">
                        <i class="fa-solid fa-satellite-dish" style="font-size:.75rem"></i>
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="window.openNawalaDetail('${t.id}')" title="View detail">
                        <i class="fa-solid fa-chart-bar" style="font-size:.75rem"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-icon" onclick="window.removeNawalaTarget('${t.id}')" title="Remove">
                        <i class="fa-solid fa-trash" style="font-size:.75rem"></i>
                    </button>
                </div>
            </td>
        </tr>`;
}

// ══════════════════════════════════════════════════════════════
//  SCAN ENGINE
// ══════════════════════════════════════════════════════════════

// Simulated ISP nawala patterns (deterministic based on domain)
function simulateNawalaCheck(domain, ispId) {
    // Deterministic hash so same domain+ISP always gives same result
    let hash = 0;
    for (let i = 0; i < domain.length + ispId.length; i++) {
        const ch = (domain + ispId).charCodeAt(i);
        hash = ((hash << 5) - hash) + ch;
        hash |= 0;
    }
    const h = Math.abs(hash);

    // ISP-specific nawala aggressiveness (Telkomsel blocks the most)
    const blockChance = { telkomsel: 0.35, indosat: 0.25, xl: 0.22, axis: 0.20, smartfren: 0.18 };
    const timeoutChance = 0.08;
    const rnd = (h % 1000) / 1000;

    if (rnd < timeoutChance) return { status: 'timeout', latency: 5000 };
    if (rnd < timeoutChance + (blockChance[ispId] || 0.22)) return { status: 'blocked', latency: Math.floor(50 + (h % 200)) };
    return { status: 'accessible', latency: Math.floor(120 + (h % 800)) };
}

async function checkOneDomain(domain, ispId, signal) {
    const proxyUrl = getProxyUrl(ispId);
    const timeout = parseInt(STATE.settings?.nawala_timeout || '5000', 10);

    // Demo / no-backend mode: simulate results
    if (STRICT_REAL_MODE && (!SUPABASE_ENABLED || proxyUrl.includes('vigor.internal'))) {
        return { status: 'error', latency: 0, message: 'Missing real proxy URL in strict real mode', timestamp: new Date().toISOString() };
    }
    if (!SUPABASE_ENABLED || proxyUrl.includes('vigor.internal')) {
        const delay = 400 + Math.floor(Math.random() * 1800);
        await new Promise(resolve => {
            const t = setTimeout(resolve, delay);
            signal?.addEventListener('abort', () => clearTimeout(t));
        });
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        const sim = simulateNawalaCheck(domain, ispId);
        return { ...sim, timestamp: new Date().toISOString(), domain, isp: ispId, proxy: proxyUrl };
    }

    // Real proxy check
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const url = `${proxyUrl}?url=${encodeURIComponent('https://' + domain)}&t=${Date.now()}`;
        const t0 = performance.now();
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        const latency = Math.round(performance.now() - t0);
        clearTimeout(timer);
        if (!res.ok) return { status: 'error', latency, message: `HTTP ${res.status}`, timestamp: new Date().toISOString() };
        const json = await res.json();
        return { status: json.accessible === false ? 'blocked' : 'accessible', latency: json.latency || latency, timestamp: new Date().toISOString(), redirectUrl: json.redirectUrl };
    } catch (e) {
        clearTimeout(timer);
        if (e.name === 'AbortError') return { status: 'timeout', latency: timeout, timestamp: new Date().toISOString() };
        return { status: 'error', latency: 0, message: e.message, timestamp: new Date().toISOString() };
    }
}

// ── Scan a single target (all 5 ISPs in parallel) ──
window.scanSingleTarget = async (targetId, domain) => {
    const results = getNawalaResults();
    if (!results[domain]) results[domain] = {};

    // Mark all as scanning
    ISP_LIST.forEach(isp => {
        results[domain][isp.id] = { scanning: true };
        const cell = document.getElementById(`nawala_cell_${targetId}_${isp.id}`);
        if (cell) cell.innerHTML = ispBadge({ scanning: true });
    });
    const btn = document.getElementById(`nawala_btn_${targetId}`);
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size:.75rem"></i>'; }

    const controller = new AbortController();
    STATE._nawalaControllers = STATE._nawalaControllers || {};
    STATE._nawalaControllers[targetId] = controller;

    // Fire all 5 ISP checks in parallel
    const checks = ISP_LIST.map(async (isp) => {
        try {
            const result = await checkOneDomain(domain, isp.id, controller.signal);
            results[domain][isp.id] = result;
        } catch (e) {
            results[domain][isp.id] = { status: 'error', latency: 0, message: e.message, timestamp: new Date().toISOString() };
        }
        // Update cell immediately as each ISP completes
        const cell = document.getElementById(`nawala_cell_${targetId}_${isp.id}`);
        if (cell) cell.innerHTML = ispBadge(results[domain][isp.id]);
    });

    await Promise.allSettled(checks);

    // Update row appearance
    const row = document.getElementById(`nawala_row_${targetId}`);
    if (row) {
        const overall = getOverallStatus(domain);
        row.className = overall === 'blocked' ? 'nawala-row-blocked' : overall === 'partial' ? 'nawala-row-partial' : '';
    }
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-satellite-dish" style="font-size:.75rem"></i>';
    }
    saveState();
    addLog('Nawala Scan', domain, `Single scan complete — ${getOverallStatus(domain)}`);
};

// ── Scan all targets sequentially with progress ──
window.startNawalaScanAll = async () => {
    const targets = getNawalaTargets().filter(t => t.active);
    if (targets.length === 0) { toast('No targets configured', 'warning'); return; }

    STATE._nawalaScanning = true;
    STATE._nawalaAbort = new AbortController();
    window.go('nawala-scan');

    const progressBar = document.getElementById('nawala_progress_bar');
    const progressPct = document.getElementById('nawala_progress_pct');
    const progressStatus = document.getElementById('nawala_scan_status');
    const progressWrap = document.getElementById('nawala_progress_wrap');
    if (progressWrap) progressWrap.style.display = 'block';

    let completed = 0;
    const total = targets.length;

    for (const t of targets) {
        if (STATE._nawalaAbort?.signal.aborted) break;

        if (progressStatus) progressStatus.textContent = `Scanning ${t.domain} (${completed + 1}/${total})...`;
        const pct = Math.round((completed / total) * 100);
        if (progressBar) progressBar.style.width = pct + '%';
        if (progressPct) progressPct.textContent = pct + '%';

        // Scan this domain
        const results = getNawalaResults();
        if (!results[t.domain]) results[t.domain] = {};
        const checks = ISP_LIST.map(async (isp) => {
            try {
                const result = await checkOneDomain(t.domain, isp.id, STATE._nawalaAbort.signal);
                results[t.domain][isp.id] = result;
            } catch (e) {
                if (e.name !== 'AbortError') results[t.domain][isp.id] = { status: 'error', latency: 0, message: e.message };
            }
        });
        await Promise.allSettled(checks);
        completed++;
    }

    STATE._nawalaScanning = false;
    STATE._nawalaLastScan = new Date().toISOString();
    saveState();
    addLog('Nawala Scan', 'All Targets', `Bulk scan complete — ${completed} sites scanned`);
    toast(`Scan complete! ${completed} sites checked.`, 'success');
    window.go('nawala-scan');
};

window.stopNawalaScan = () => {
    STATE._nawalaAbort?.abort();
    STATE._nawalaScanning = false;
    toast('Scan stopped', 'warning');
    window.go('nawala-scan');
};

// ── Auto Scan Logic ──
window.updateNawalaInterval = (val) => {
    STATE._nawalaAutoInterval = parseInt(val, 10);
    saveState();
    if (STATE._nawalaAutoRunning) {
        window.toggleNawalaAutoScan(); // Stop
        window.toggleNawalaAutoScan(); // Restart with new interval
    }
};

window.toggleNawalaAutoScan = () => {
    if (STATE._nawalaAutoRunning) {
        clearInterval(window._nawalaAutoTimer);
        STATE._nawalaAutoRunning = false;
        toast('Auto-Scan disabled', 'warning');
    } else {
        const interval = (STATE._nawalaAutoInterval || 5) * 60 * 1000;
        STATE._nawalaAutoRunning = true;
        
        // Immediate first scan
        window.startNawalaScanAll();
        
        window._nawalaAutoTimer = setInterval(() => {
            if (!STATE._nawalaScanning) {
                window.startNawalaScanAll();
            }
        }, interval);
        
        toast(`Auto-Scan enabled: every ${STATE._nawalaAutoInterval || 5}m`, 'success');
    }
    saveState();
    window.go('nawala-scan');
};

// ══════════════════════════════════════════════════════════════
//  DETAIL MODAL
// ══════════════════════════════════════════════════════════════
window.openNawalaDetail = (targetId) => {
    const t = getNawalaTargets().find(x => x.id === targetId);
    if (!t) return;
    const domainResults = getNawalaResults()[t.domain] || {};

    const rows = ISP_LIST.map(isp => {
        const r = domainResults[isp.id] || null;
        const statusText = r ? ({
            accessible: '<span style="color:var(--green);font-weight:700">✓ Accessible</span>',
            blocked: '<span style="color:var(--red);font-weight:700">✗ BLOCKED</span>',
            timeout: '<span style="color:var(--yellow);font-weight:700">⌛ Timeout</span>',
            error: '<span style="color:var(--text3)">⚠ Error</span>',
        }[r.status] || '-') : '<span style="color:var(--text3)">Not scanned</span>';

        return `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:.6rem">
                        <div style="width:10px;height:10px;border-radius:50%;background:${isp.color}"></div>
                        <div>
                            <div style="font-weight:700;font-size:.85rem">${isp.name}</div>
                            <div style="font-size:.7rem;color:var(--text3)">${isp.fullName}</div>
                        </div>
                    </div>
                </td>
                <td>${statusText}</td>
                <td style="font-family:monospace;font-size:.82rem">${r?.latency != null ? r.latency + 'ms' : '-'}</td>
                <td style="font-size:.72rem">${r?.timestamp ? new Date(r.timestamp).toLocaleTimeString('id-ID') : '-'}</td>
                <td style="font-size:.72rem;max-width:150px;word-break:break-all">${r?.redirectUrl ? `<a href="${r.redirectUrl}" target="_blank" style="color:var(--acc)">${r.redirectUrl.slice(0,40)}...</a>` : r?.message || '-'}</td>
                <td>
                    <button class="btn btn-xs btn-primary" onclick="window.scanSingleISP('${targetId}','${t.domain}','${isp.id}')">
                        <i class="fa-solid fa-rotate"></i>
                    </button>
                </td>
            </tr>`;
    }).join('');

    openModal(`Nawala Detail — ${t.domain}`, `
        <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.25rem;padding:.75rem 1rem;background:var(--bg2);border-radius:10px">
            <i class="fa-solid fa-globe" style="color:var(--acc);font-size:1.2rem"></i>
            <div>
                <div style="font-weight:700">${t.company}</div>
                <a href="https://${t.domain}" target="_blank" class="nawala-domain" style="font-size:.85rem">${t.domain}</a>
            </div>
            <div style="margin-left:auto">
                <button class="btn btn-sm btn-primary" onclick="closeModalBtn();window.scanSingleTarget('${t.id}','${t.domain}')">
                    <i class="fa-solid fa-satellite-dish"></i> Rescan All
                </button>
            </div>
        </div>
        <table style="width:100%;border-collapse:collapse">
            <thead>
                <tr style="font-size:.78rem;color:var(--text3);border-bottom:1px solid var(--border)">
                    <th style="padding:.5rem .75rem;text-align:left">ISP</th>
                    <th style="padding:.5rem .75rem;text-align:left">Status</th>
                    <th style="padding:.5rem .75rem;text-align:left">Latency</th>
                    <th style="padding:.5rem .75rem;text-align:left">Time</th>
                    <th style="padding:.5rem .75rem;text-align:left">Redirect / Notes</th>
                    <th style="padding:.5rem .75rem">Rescan</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `, `<button class="btn btn-secondary" onclick="closeModalBtn()">Close</button>`);
};

// ── Rescan single ISP from detail modal ──
window.scanSingleISP = async (targetId, domain, ispId) => {
    const results = getNawalaResults();
    if (!results[domain]) results[domain] = {};
    results[domain][ispId] = { scanning: true };
    toast(`Scanning ${domain} via ${ispId}...`, 'info');
    try {
        const result = await checkOneDomain(domain, ispId, null);
        results[domain][ispId] = result;
        saveState();
        toast(`${ispId}: ${result.status}`, result.status === 'accessible' ? 'success' : result.status === 'blocked' ? 'error' : 'warning');
    } catch (e) {
        results[domain][ispId] = { status: 'error', latency: 0, message: e.message };
    }
    // Refresh detail modal
    closeModalBtn();
    setTimeout(() => window.openNawalaDetail(targetId), 100);
};

// ══════════════════════════════════════════════════════════════
//  TARGET MANAGEMENT
// ══════════════════════════════════════════════════════════════
window.openAddNawalaTarget = (existingId = null) => {
    const existing = existingId ? _getAllNawalaTargets().find(t => t.id === existingId) : null;
    const scopedCoList = getScopedCompanyList();

    openModal(existing ? 'Edit Target' : 'Add Scan Target', `
        <div class="form-grid">
            <div class="form-field">
                <label>Company / Label <span style="color:var(--red)">*</span></label>
                <input id="nt_company" class="form-control" value="${existing?.company || ''}" placeholder="e.g. vigor88" list="nt_company_list" />
                <datalist id="nt_company_list">
                    ${scopedCoList.map(c => `<option>${c}</option>`).join('')}
                </datalist>
                ${scopedCoList.length > 0 ? `
                <div style="margin-top:.4rem;display:flex;flex-wrap:wrap;gap:.3rem">
                    ${scopedCoList.slice(0, 10).map(c => `
                        <span style="font-size:.68rem;padding:.1rem .45rem;border-radius:20px;background:var(--bg2);border:1px solid var(--border);cursor:pointer;color:var(--text2)"
                              onclick="document.getElementById('nt_company').value='${c}';window._autoFillDomain('${c}')">${c}</span>
                    `).join('')}
                    ${scopedCoList.length > 10 ? `<span style="font-size:.65rem;color:var(--text3)">+${scopedCoList.length - 10} more</span>` : ''}
                </div>` : ''}
            </div>
            <div class="form-field">
                <label>Domain <span style="color:var(--red)">*</span></label>
                <input id="nt_domain" class="form-control" value="${existing?.domain || ''}" placeholder="e.g. vigor88.com (no https://)" />
            </div>
        </div>
        <div style="font-size:.75rem;color:var(--text3);margin-top:.5rem">
            <i class="fa-solid fa-info-circle"></i> Masukkan domain tanpa protokol (contoh: <code>vigor88.com</code>)
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-primary" onclick="window.saveNawalaTarget('${existingId || ''}')"><i class="fa-solid fa-plus"></i> ${existing ? 'Update' : 'Add'} Target</button>
    `);
};

// Auto-fill domain guess when company chip is clicked
window._autoFillDomain = (companyName) => {
    const coData = (STATE.companies || []).find(c => (c.username || c.name) === companyName);
    const domain = coData?.domain || coData?.website || guessCompanyDomain(companyName);
    const el = document.getElementById('nt_domain');
    if (el && !el.value) el.value = domain;
};

window.saveNawalaTarget = (existingId = '') => {
    const company = document.getElementById('nt_company')?.value.trim();
    let domain = document.getElementById('nt_domain')?.value.trim().toLowerCase().replace(/^https?:\/\//i, '').split('/')[0];
    if (!company) { toast('Company name is required', 'error'); return; }
    if (!domain) { toast('Domain is required', 'error'); return; }
    if (company.length < 2) { toast('Company name is too short', 'error'); return; }
    if (!DOMAIN_RE.test(domain)) { toast('Invalid domain format', 'error'); return; }

    const allTargets = _getAllNawalaTargets();
    if (existingId) {
        const t = allTargets.find(x => x.id === existingId);
        if (t) { t.company = company; t.domain = domain; }
    } else {
        if (allTargets.some(t => t.domain === domain)) { toast('Domain sudah ada di scan list', 'warning'); return; }
        allTargets.unshift({
            id: 'NT_' + Date.now(),
            company, domain, active: true,
            addedBy: STATE.currentAdmin.id,
        });
    }
    saveState();
    closeModalBtn();
    toast(existingId ? 'Target updated' : `${domain} ditambahkan ke scan list`, 'success');
    window.go('nawala-scan');
};

window.removeNawalaTarget = (id) => {
    const t = _getAllNawalaTargets().find(x => x.id === id);
    if (!t) return;
    // Non-SuperAdmin: only allow removing targets they added
    const { role, id: adminId } = STATE.currentAdmin;
    if (role !== 'SuperAdmin' && t.addedBy && t.addedBy !== adminId) {
        toast('Hanya bisa menghapus target yang Anda tambahkan sendiri', 'warning');
        return;
    }
    if (typeof window.confirmAction === 'function') {
        window.confirmAction('Remove Target', `Hapus ${t.domain} dari scan list?`, () => {
            STATE.nawalaTargets = _getAllNawalaTargets().filter(x => x.id !== id);
            delete (STATE.nawalaResults || {})[t.domain];
            saveState();
            toast(`${t.domain} dihapus`, 'success');
            window.go('nawala-scan');
        }, 'Remove', 'danger');
    } else {
        STATE.nawalaTargets = _getAllNawalaTargets().filter(x => x.id !== id);
        saveState(); toast('Dihapus', 'success'); window.go('nawala-scan');
    }
};

// ══════════════════════════════════════════════════════════════
//  PROXY SETTINGS
// ══════════════════════════════════════════════════════════════
window.openNawalaSettings = () => {
    const timeout = STATE.settings?.nawala_timeout || '5000';
    openModal('Proxy Configuration', `
        <div style="margin-bottom:1.25rem;padding:.75rem 1rem;background:rgba(14,165,233,.05);border:1px solid rgba(14,165,233,.2);border-radius:10px;font-size:.8rem;color:var(--text2)">
            <i class="fa-solid fa-circle-info" style="color:var(--acc)"></i>
            Each proxy endpoint should be a server running inside the ISP's network. The endpoint receives <code>?url=https://target.com</code> and returns <code>{"accessible": true/false, "latency": ms}</code>
        </div>
        <div class="form-grid">
            ${ISP_LIST.map(isp => `
                <div class="form-field" style="grid-column:1/-1">
                    <label style="display:flex;align-items:center;gap:.5rem">
                        <span style="width:10px;height:10px;border-radius:50%;background:${isp.color};display:inline-block"></span>
                        ${isp.fullName} Proxy URL
                    </label>
                    <input id="np_${isp.id}" class="form-control" value="${STATE.settings?.['nawala_proxy_' + isp.id] || ''}" placeholder="https://proxy-${isp.id}.yourserver.com/check" />
                </div>
            `).join('')}
            <div class="form-field">
                <label>Timeout (ms)</label>
                <input id="np_timeout" type="number" class="form-control" value="${timeout}" min="1000" max="30000" step="500" />
            </div>
        </div>
        <div style="margin-top:1rem;padding:.75rem;background:var(--bg2);border-radius:8px;font-size:.75rem;color:var(--text3)">
            <strong>Strict Real Mode:</strong> Set <code>VITE_STRICT_REAL_MODE=true</code> to disable simulated checks and require real ISP proxy URLs.
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-secondary" onclick="window.testNawalaProxies()"><i class="fa-solid fa-vial"></i> Test Proxies</button>
        <button class="btn btn-primary" onclick="window.saveNawalaSettings()"><i class="fa-solid fa-check"></i> Save</button>
    `);
};

window.saveNawalaSettings = async () => {
    if (!STATE.settings) STATE.settings = {};
    ISP_LIST.forEach(isp => {
        const val = document.getElementById(`np_${isp.id}`)?.value.trim();
        STATE.settings[`nawala_proxy_${isp.id}`] = val || '';
    });
    const timeout = document.getElementById('np_timeout')?.value;
    if (timeout) STATE.settings.nawala_timeout = timeout;
    saveState();
    if (window.db?.dbSaveSetting) {
        await Promise.all(ISP_LIST.map(isp =>
            window.db.dbSaveSetting(`nawala_proxy_${isp.id}`, STATE.settings[`nawala_proxy_${isp.id}`])
        ));
    }
    closeModalBtn();
    toast('Proxy settings saved', 'success');
};

window.testNawalaProxies = async () => {
    toast('Testing proxy endpoints...', 'info');
    const results = await Promise.allSettled(ISP_LIST.map(async isp => {
        const url = document.getElementById(`np_${isp.id}`)?.value.trim();
        if (!url || url.includes('vigor.internal')) {
            if (STRICT_REAL_MODE) return { isp: isp.name, status: 'error', msg: 'Missing real proxy URL' };
            return { isp: isp.name, status: 'demo', msg: 'Demo mode (simulated)' };
        }
        try {
            const res = await fetch(url + '?url=https://google.com&test=1', { signal: AbortSignal.timeout(4000) });
            return { isp: isp.name, status: res.ok ? 'ok' : 'error', msg: `HTTP ${res.status}` };
        } catch (e) {
            return { isp: isp.name, status: 'error', msg: e.message };
        }
    }));
    const lines = results.map(r => r.value || r.reason);
    const msg = lines.map(l => `${l.status === 'ok' ? '✓' : l.status === 'demo' ? '○' : '✗'} ${l.isp}: ${l.msg}`).join('\n');
    toast('Proxy test results:\n' + msg, 'info');
};

// ══════════════════════════════════════════════════════════════
//  EXPORT CSV
// ══════════════════════════════════════════════════════════════
window.exportNawalaCSV = () => {
    const targets = getNawalaTargets().filter(t => t.active);
    const results = getNawalaResults();
    const headers = ['Company', 'Domain', 'Overall', ...ISP_LIST.map(i => i.name + ' Status'), ...ISP_LIST.map(i => i.name + ' Latency(ms)'), 'Last Scan'];
    const rows = targets.map(t => {
        const dr = results[t.domain] || {};
        const overall = getOverallStatus(t.domain);
        const statuses = ISP_LIST.map(isp => dr[isp.id]?.status || 'unchecked');
        const latencies = ISP_LIST.map(isp => dr[isp.id]?.latency ?? '');
        const timestamps = ISP_LIST.map(isp => dr[isp.id]?.timestamp).filter(Boolean);
        const lastScan = timestamps.length ? new Date(Math.max(...timestamps.map(ts => new Date(ts)))).toLocaleString('id-ID') : '';
        return [t.company, t.domain, overall, ...statuses, ...latencies, lastScan].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = `nawala_scan_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    toast('CSV exported', 'success');
};

/* MAIN ENTRY POINT */
import { initState } from './core/state.js';
import { go, toggleMenu, setPageResolver } from './core/router.js';
import { requireAuth, onAuthChange } from './core/auth.js';
import { initRealtime } from './core/realtime.js';
import { fetchSettings } from './core/db.js';
import { SUPABASE_ENABLED } from './core/supabase.js';
import { t, applyTranslations, changeLanguage } from './core/i18n.js';
import { renderSidebar, renderProfileDisplay, toast } from './ui/components.js';
import './api/payment.js';  // register window.paymentAPI

import * as stateFuncs from './core/state.js';
import * as routerFuncs from './core/router.js';
import * as uiFuncs from './ui/components.js';
import * as chartFuncs from './ui/charts.js';
import * as helperFuncs from './utils/helpers.js';
import * as formFuncs from './utils/forms.js';
import * as tierFuncs from './utils/tier.js';

Object.assign(window, stateFuncs, routerFuncs, uiFuncs, chartFuncs, helperFuncs, formFuncs, tierFuncs);

const lazyPageModules = [
    { loaded: false, match: (p) => p === 'dashboard', load: () => import('./pages/dashboard.js') },
    // tools.js: logs-company, logs-whitelabel, logs-master-wl, logs-member, invoice-*, tools-*
    // MUST come before logs-memo (which also matches 'log') and before reports (which matches 'invoice')
    { loaded: false, match: (p) => p.startsWith('logs-company') || p.startsWith('logs-whitelabel') || p.startsWith('logs-master') || p.startsWith('logs-member') || p.startsWith('invoice') || p.startsWith('tools-'), load: () => import('./pages/tools.js') },
    // members.js: tier-history MUST come before customization (which matches 'tier')
    { loaded: false, match: (p) => p.includes('member') || p === 'tier-history', load: () => import('./pages/members.js') },
    { loaded: false, match: (p) => p.includes('finance') || p.includes('deposit') || p.includes('withdraw') || p.includes('bank'), load: () => import('./pages/finance.js') },
    { loaded: false, match: (p) => p.includes('setting') || p === 'profile', load: () => import('./pages/settings.js') },
    // betting: also covers transferred-list
    { loaded: false, match: (p) => p.includes('bet') || p.includes('lottery') || p.includes('game') || p.includes('transfer'), load: () => import('./pages/betting.js') },
    // admins: system-notifications MUST come before customization (which matches 'notif')
    { loaded: false, match: (p) => p.includes('admin') || p === 'dev-menu-config' || p.startsWith('system-'), load: () => import('./pages/admins.js') },
    // customization: also covers announcement-list, app-notification, rebate-calc
    { loaded: false, match: (p) => p.includes('custom') || p.includes('template') || p.includes('widget') || p.includes('vip') || p.includes('tier') || p.includes('announc') || p.includes('rebate') || p.includes('seo') || p === 'site-config', load: async () => { await import('./pages/customization.js'); await import('./builder/engine.js'); } },
    // logs-memo: memo + logs-admin only (specific log pages are routed to tools.js above)
    { loaded: false, match: (p) => p.includes('memo') || p === 'logs-admin', load: () => import('./pages/logs-memo.js') },
    // missing-pages handles notifications and template list
    { loaded: false, match: (p) => p.includes('notif'), load: () => import('./pages/missing-pages.js') },
    { loaded: false, match: (p) => p.includes('company') || p.includes('whitelabel') || p.includes('agent') || p === 'my-downlines' || p === 'master', load: () => import('./pages/company.js') },
    { loaded: false, match: (p) => p.includes('result'), load: () => import('./pages/results.js') },
    { loaded: false, match: (p) => p.includes('bonus') || p.includes('promo'), load: () => import('./pages/bonus.js') },
    // reports: statistics, provider-analytics, device-report, reports-*
    { loaded: false, match: (p) => p.includes('report') || p === 'statistics' || p.includes('analytic') || p.startsWith('provider-') || p === 'device-report', load: () => import('./pages/reports.js') },
    { loaded: false, match: (p) => p === 'seamless-sandbox', load: () => import('./pages/seamless-sandbox.js') },
    { loaded: false, match: (p) => p.includes('seamless') || p.includes('pgsoft'), load: () => import('./pages/seamless.js') },
    // master.js: also covers whitelist, blacklist
    { loaded: false, match: (p) => p.includes('master') || p === 'whitelist' || p === 'blacklist', load: () => import('./pages/master.js') },
    { loaded: false, match: (p) => p === 'rbac-management', load: () => import('./pages/rbac.js') },
    { loaded: false, match: (p) => p === 'branding-settings', load: () => import('./pages/branding.js') },
    { loaded: false, match: (p) => p === 'security-center', load: () => import('./pages/security.js') },
    { loaded: false, match: (p) => p.includes('crm'), load: () => import('./pages/crm.js') },
    { loaded: false, match: (p) => p.includes('manual'), load: () => import('./pages/manual.js') },
    { loaded: false, match: (p) => p.includes('nawala') || p.includes('sawala'), load: () => import('./pages/nawala.js') },
    { loaded: false, match: (p) => p.includes('autonomous') || p.startsWith('agent-'), load: () => import('./pages/autonomous.js') },
    { loaded: false, match: (p) => p.includes('simulator'), load: () => import('./pages/simulator.js') },
    { loaded: false, match: () => true, load: () => import('./pages/missing-pages.js') },
];

async function ensurePageForRoute(page) {
    let lastError = null;
    for (const mod of lazyPageModules) {
        if (mod.match(page) && !mod.loaded) {
            try {
                await mod.load();
                mod.loaded = true;
                break;
            } catch (e) {
                lastError = e;
                console.error('[Init] Failed loading module for page:', page, e);
            }
        }
        if (mod.match(page) && mod.loaded) break;
    }
    if (!window.pages?.[page] && lastError) throw lastError;
}

setPageResolver(ensurePageForRoute);

/* REAL-TIME WIDGET TIMERS */
let jackpotInterval = null;
let countdownInterval = null;
let jackpotValue = 2847391204;

function startRealTimeWidgets() {
    if (jackpotInterval) clearInterval(jackpotInterval);
    jackpotInterval = setInterval(() => {
        jackpotValue += Math.floor(Math.random() * 1000) + 800;
        document.querySelectorAll('.jk-value').forEach((el) => {
            el.textContent = 'Rp ' + window.fmt(jackpotValue);
        });
    }, 1000);

    if (countdownInterval) clearInterval(countdownInterval);
    const target = Date.now() + (2 * 86400 + 14 * 3600 + 33 * 60 + 7) * 1000;
    countdownInterval = setInterval(() => {
        const rem = Math.max(0, Math.floor((target - Date.now()) / 1000));
        const d = Math.floor(rem / 86400);
        const h = Math.floor((rem % 86400) / 3600);
        const m = Math.floor((rem % 3600) / 60);
        const s = rem % 60;
        document.querySelectorAll('.cd-num').forEach((el, i) => {
            el.textContent = String([d, h, m, s][i] || 0).padStart(2, '0');
        });
    }, 1000);
}

/* SUPABASE MODE BANNER */
function showModeBanner() {
    if (SUPABASE_ENABLED) return;
    const banner = document.createElement('div');
    banner.id = 'modeBanner';
    banner.style.cssText = `
        position:fixed; bottom:1rem; right:1rem; z-index:9999;
        background:rgba(14,165,233,.12); border:1px solid rgba(14,165,233,.3);
        color:#38bdf8; border-radius:10px; padding:.6rem 1rem;
        font-size:.75rem; display:flex; align-items:center; gap:.5rem;
        backdrop-filter:blur(8px); cursor:pointer;
    `;
    banner.innerHTML = `
        <i class="fa-solid fa-flask"></i>
        <span><strong>Demo Mode</strong> - Supabase not connected. Data is mock only.</span>
        <i class="fa-solid fa-xmark" onclick="this.parentElement.remove()" style="margin-left:.5rem;opacity:.6"></i>
    `;
    document.body.appendChild(banner);
}

window.simulateDevRole = (role) => {
    STATE.currentAdmin.role = role;
    const toastMsg = 'Dev Simulator: Role switched to ' + role;
    if (window.toast) toast(toastMsg, 'success');

    // Update the visual profile block so the dev knows their current simulated context
    const hUser = document.querySelector('.header-user-info .huser-role');
    if (hUser) hUser.textContent = 'SIMULATOR | ' + role;
    const sUser = document.querySelector('.sidebar-user .user-role');
    if (sUser) sUser.textContent = 'SIMULATOR | ' + role;

    // Rerender the sidebar to apply the new role permissions matrix
    renderSidebar();

    // Update active state in sidebar just in case
    setTimeout(() => {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const currentPageStr = localStorage.getItem('VGR_PG') || 'dashboard';
        const activeLink = document.querySelector(`.nav-link[onclick*="${currentPageStr}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
            const parentSub = activeLink.closest('.nav-submenu');
            if (parentSub) {
                parentSub.style.maxHeight = parentSub.scrollHeight + "px";
                if (parentSub.previousElementSibling) parentSub.previousElementSibling.classList.add('active');
            }
        }
    }, 50);
};

/* INIT */
document.addEventListener('DOMContentLoaded', async () => {
    initState();
    try {
        await ensurePageForRoute('dashboard');
    } catch (e) {
        console.error('[Init] Dashboard preload failed:', e);
    }

    const authed = await requireAuth();
    if (!authed) return;

    try {
        await go('dashboard');
    } catch (e) {
        console.error('[Init] Initial route failed:', e);
        const content = document.getElementById('pageContent');
        if (content) {
            content.innerHTML = `
            <div class="card" style="margin-top:1rem">
                <div class="card-body" style="padding:2rem;text-align:center">
                    <h2 style="margin-bottom:.5rem">Failed to Load Dashboard</h2>
                    <p style="color:var(--text3);margin-bottom:1rem">${(e && e.message) ? e.message : 'Unknown startup error'}</p>
                    <button class="btn btn-primary" onclick="window.go('dashboard')"><i class="fa-solid fa-rotate-right"></i> Retry</button>
                </div>
            </div>`;
        }
    }

    // Render canonical sidebar (contains full menu map incl. CRM/Nawala and validated routes).
    renderSidebar();
    renderProfileDisplay();
    window.initOmniSearch();

    const homeMenuTrigger = document.querySelector('[onclick*="toggleMenu(\'homeMenu\'"]');
    if (homeMenuTrigger) toggleMenu('homeMenu', homeMenuTrigger);

    const theme = localStorage.getItem('VGR_THEME') || 'light';
    const themeBtn = document.querySelector('[onclick="window.toggleTheme()"] i, [onclick="toggleTheme()"] i');
    if (themeBtn) {
        themeBtn.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }

    setTimeout(startRealTimeWidgets, 500);

    if (SUPABASE_ENABLED) {
        initRealtime();
        onAuthChange((event) => {
            if (event === 'TOKEN_REFRESHED') console.log('[Auth] Token refreshed');
        });
        // Load settings from DB on startup so STATE.settings reflects persisted values
        fetchSettings().catch(e => console.warn('[Init] fetchSettings failed:', e.message));
        console.log('[VIGOR] Supabase mode — live data enabled');
    } else {
        showModeBanner();
        showRoleSimulator();
        console.log('[VIGOR] Demo mode — using mock data');
    }
});

function showRoleSimulator() {
    const bar = document.createElement('div');
    bar.style.cssText = `
        position:fixed; top:0; left:50%; transform:translateX(-50%); z-index:10001;
        background:rgba(15,23,42,.9); backdrop-filter:blur(10px); 
        border:1px solid var(--border); border-top:none; border-radius:0 0 12px 12px;
        padding:6px 12px; display:flex; align-items:center; gap:1rem;
        box-shadow: 0 4px 15px rgba(0,0,0,.5);
    `;

    // 3-level hierarchy: SuperAdmin / Whitelabel / Agent
    const roles = [
        { r: 'SuperAdmin', c: 'Global', label: '⚡ Super Admin', verified: true },
        { r: 'Whitelabel', c: 'vigor88', label: '🌐 Whitelabel' },
        { r: 'Agent', c: 'casino888', label: '🏪 Agent' },
    ];

    bar.innerHTML = `
        <span style="font-size:10px; font-weight:800; color:var(--text3); text-transform:uppercase">Dev Simulator</span>
        <div style="display:flex; gap:4px">
            ${roles.map(r => `
                <button class="btn btn-xs ${STATE.currentAdmin.role === r.r && (r.verified === undefined || STATE.currentAdmin.is2FAVerified === r.verified) ? 'btn-primary' : 'btn-secondary'}" 
                        style="font-size:10px; padding:2px 8px"
                        onclick="window.switchSimulatedRole('${r.r}', '${r.c}', '${r.s || ''}', ${r.verified || false})">
                    ${r.label}
                </button>
            `).join('')}
        </div>
    `;
    document.body.appendChild(bar);
}

window.switchSimulatedRole = (role, company, shop = '', verified = false) => {
    const idMap = { SuperAdmin: 'adm-1', Whitelabel: 'adm-2', Agent: 'adm-3' };
    STATE.currentAdmin = {
        id: idMap[role] || 'adm-1',
        username: role.toLowerCase() + '_sim',
        name: role + ' Simulator',
        role: role,
        company: company,
        is2FAVerified: verified,
        permissions: role === 'SuperAdmin' ? ['*'] : []
    };

    // Refresh UI
    renderSidebar();
    renderProfileDisplay();
    toast(`God-Mode Active: ${role} (${company})`, 'info');
    go('dashboard');

    const oldBar = document.querySelector('div[style*="z-index: 10001"]');
    if (oldBar) oldBar.remove();
    showRoleSimulator();
};

/* --- GLOBAL SEARCH LOGIC (Task 2) --- */
window.openQuickSearch = () => {
    const overlay = document.getElementById('quickSearchOverlay');
    overlay.classList.add('active');
    document.getElementById('globalSearchInput').focus();
};

window.closeQuickSearch = () => {
    document.getElementById('quickSearchOverlay').classList.remove('active');
};

window.runGlobalSearch = (val) => {
    const results = document.getElementById('globalSearchResults');
    if (!val || val.length < 2) {
        results.innerHTML = '<div class="search-hint">Type at least 2 characters...</div>';
        return;
    }

    const q = val.toLowerCase();
    const matches = [];

    // 1. Match Pages
    const pMatches = [
        { t: 'Dashboard', p: 'dashboard', i: 'fa-chart-line' },
        { t: 'Member List', p: 'global-member-list', i: 'fa-users' },
        { t: 'Deposit List', p: 'deposit-list', i: 'fa-arrow-down' },
        { t: 'Withdrawal List', p: 'withdrawal-list', i: 'fa-arrow-up' },
        { t: 'Site Config', p: 'site-config', i: 'fa-sliders' },
        { t: 'Template Builder', p: 'template-builder', i: 'fa-object-group' },
    ].filter(x => x.t.toLowerCase().includes(q));
    pMatches.forEach(m => matches.push({ ...m, type: 'Page' }));

    // 2. Match Members (from STATE)
    const mMatches = STATE.members.filter(m => m.username.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)).slice(0, 5);
    mMatches.forEach(m => matches.push({ t: m.username, p: 'global-member-list', i: 'fa-user', sub: `ID: ${m.id}`, type: 'Member' }));

    if (matches.length === 0) {
        results.innerHTML = '<div class="search-hint">No results found for "' + val + '"</div>';
        return;
    }

    results.innerHTML = matches.map(m => `
        <div class="search-item" onclick="window.closeQuickSearch(); go('${m.p}')">
            <div class="search-item-icon"><i class="fa-solid ${m.i}"></i></div>
            <div class="search-item-info">
                <div class="title">${m.t}</div>
                <div class="subtitle">${m.sub} • ${m.type}</div>
            </div>
        </div>
    `).join('');
};

window.appendLiveFeed = (htmlStr) => {
    const container = document.getElementById('liveFeedContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.innerHTML = htmlStr;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
};


// Global Hotkey Listener
});

// ── AUTOMATION WORKERS (Feature #21) ──
window.refreshAutomations = () => {
    // 1. VIP Tier Automation
    if (STATE.settings?.vipAutoEval) {
        if (!window._vipAutoTimer) {
            console.log('[Automation] Starting VIP Tier Evaluation Worker...');
            // Run every 10 minutes for demo, or 1 hour for production
            const interval = 10 * 60 * 1000; 
            window._vipAutoTimer = setInterval(() => {
                if (window.evaluateAllMemberTiers) {
                    console.log('[Automation] Triggering VIP Tier Recalculation...');
                    window.evaluateAllMemberTiers();
                }
            }, interval);
        }
    } else {
        if (window._vipAutoTimer) {
            console.log('[Automation] Stopping VIP Tier Worker...');
            clearInterval(window._vipAutoTimer);
            window._vipAutoTimer = null;
        }
    }
};

// Start automations after state is loaded
setTimeout(window.refreshAutomations, 2000);


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

Object.assign(window, stateFuncs, routerFuncs, uiFuncs, chartFuncs, helperFuncs, formFuncs);

const lazyPageModules = [
    { loaded: false, match: (p) => p === 'dashboard', load: () => import('./pages/dashboard.js') },
    { loaded: false, match: (p) => p.includes('member'), load: () => import('./pages/members.js') },
    { loaded: false, match: (p) => p.includes('finance') || p.includes('deposit') || p.includes('withdraw') || p.includes('bank'), load: () => import('./pages/finance.js') },
    { loaded: false, match: (p) => p.includes('setting') || p === 'profile', load: () => import('./pages/settings.js') },
    { loaded: false, match: (p) => p.includes('betting') || p.includes('lottery') || p.includes('game'), load: () => import('./pages/betting.js') },
    { loaded: false, match: (p) => p.includes('custom') || p.includes('template') || p.includes('widget') || p.includes('vip') || p.includes('tier'), load: async () => { await import('./pages/customization.js'); await import('./builder/engine.js'); } },
    { loaded: false, match: (p) => p.includes('memo') || p.includes('log'), load: () => import('./pages/logs-memo.js') },
    { loaded: false, match: (p) => p.includes('company') || p.includes('whitelabel') || p.includes('agent') || p.includes('shop') || p === 'my-downlines' || p === 'master', load: () => import('./pages/company.js') },
    { loaded: false, match: (p) => p.includes('result'), load: () => import('./pages/results.js') },
    { loaded: false, match: (p) => p.includes('admin'), load: () => import('./pages/admins.js') },
    { loaded: false, match: (p) => p.includes('bonus') || p.includes('promo'), load: () => import('./pages/bonus.js') },
    { loaded: false, match: (p) => p.includes('report') || p.includes('invoice'), load: () => import('./pages/reports.js') },
    { loaded: false, match: (p) => p.includes('tools'), load: () => import('./pages/tools.js') },
    { loaded: false, match: (p) => p.includes('seamless') || p.includes('pgsoft'), load: () => import('./pages/seamless.js') },
    { loaded: false, match: (p) => p.includes('master'), load: () => import('./pages/master.js') },
    { loaded: false, match: (p) => p.includes('crm'), load: () => import('./pages/crm.js') },
    { loaded: false, match: (p) => p.includes('manual'), load: () => import('./pages/manual.js') },
    { loaded: false, match: (p) => p.includes('nawala') || p.includes('sawala'), load: () => import('./pages/nawala.js') },
    { loaded: false, match: (p) => p.includes('simulator'), load: () => import('./pages/simulator.js') },
    { loaded: false, match: () => true, load: () => import('./pages/missing-pages.js') },
];

async function ensurePageForRoute(page) {
    for (const mod of lazyPageModules) {
        if (mod.match(page) && !mod.loaded) {
            await mod.load();
            mod.loaded = true;
            break;
        }
        if (mod.match(page) && mod.loaded) break;
    }
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
    await ensurePageForRoute('dashboard');

    const authed = await requireAuth();
    if (!authed) return;

    go('dashboard');

    // Keep static sidebar from app.html to ensure all configured menu items stay visible.
    // Dynamic sidebar RBAC renderer can hide sections when role mapping is stale.
    // renderSidebar();
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

    const roles = [
        { r: 'SuperAdmin', c: 'Global',    label: '⚡ Super Admin',  verified: true },
        { r: 'Company',    c: 'vigor88',   label: '🌐 Whitelabel'               },
        { r: 'Master',     c: 'budi',      label: '👑 Master Agent'              },
        { r: 'Shop',       c: 'casino888', label: '🏪 Agent/Toko'               },
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
    const idMap = { SuperAdmin: 'adm-1', Company: 'adm-2', Master: 'adm-3', Shop: 'adm-4', Agent: 'adm-5' };
    STATE.currentAdmin = {
        id: idMap[role] || 'adm-1',
        username: role.toLowerCase() + '_sim',
        name: role + ' Simulator',
        role: role,
        company: company,
        shop: shop || null,
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

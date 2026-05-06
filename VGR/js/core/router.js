/* ─── ROUTER & NAVIGATION ─── */
import { toast } from '../ui/components.js';

export let currentPage = 'dashboard';
export let sidebarCollapsed = false;
export let activeCharts = {};

export const pages = {};
let ensurePageForRoute = null;

export function setPageResolver(resolver) {
    ensurePageForRoute = resolver;
}

export async function go(page) {
    // ── Enhancement 5: Maintenance Mode Gate (Production Readiness) ──
    if (window.maintenanceMode && page !== 'dashboard' && page !== 'profile') {
        renderMaintenanceUI(page);
        return;
    }

    if (!page || typeof page !== 'string') page = 'dashboard';
    currentPage = page;
    destroyCharts();
    const content = document.getElementById('pageContent');
    if (!content) {
        console.error('[Router] #pageContent not found');
        return;
    }
    if (!pages[page] && typeof ensurePageForRoute === 'function') {
        content.classList.add('page-entering');
        content.innerHTML = renderSkeletonUI();
        try {
            await ensurePageForRoute(page);
        } catch (e) {
            console.warn('[Router] lazy load failed for page:', page, e?.message || e);
        }
    }
    if (pages[page]) {
        try {
            content.innerHTML = pages[page]();
        } catch (err) {
            console.error('[Router] Page render error for:', page, err);
            content.innerHTML = `
                <div class="card" style="margin-top:2rem">
                    <div class="card-body" style="text-align:center;padding:4rem">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem;color:var(--yellow);margin-bottom:1rem;display:block"></i>
                        <h2 style="margin-bottom:.5rem">Page Render Error</h2>
                        <p style="color:var(--text3);margin-bottom:1.5rem">${err.message || 'Unknown error'}</p>
                        <button class="btn btn-primary" onclick="go('dashboard')"><i class="fa-solid fa-house"></i> Go to Dashboard</button>
                    </div>
                </div>`;
            return;
        }

        // Sync Browser Tab Title (UX 1)
        const label = page.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        document.title = `${label} - BERSAMA Admin`;

        // ── Enhancement 3: Page Fade-in ──
        content.classList.remove('page-entering');
        void content.offsetWidth; // force reflow
        content.classList.add('page-entering');

        if (typeof window.initPageCharts === 'function') {
            window.initPageCharts(page);
        }

        // ── Enhancement 7: Dashboard DnD ──
        if (page === 'dashboard' && typeof window.initDashboardDnd === 'function') {
            setTimeout(() => window.initDashboardDnd(), 60);
        }

        // ── Enhancement 6: Restore focus after live-search re-render ──
        if (window._liveSearchRestore && window._liveSearchRestore.pg === page) {
            const { k } = window._liveSearchRestore;
            window._liveSearchRestore = null;
            requestAnimationFrame(() => {
                const inp = document.querySelector(`input[oninput*="'${page}','${k}'"]`);
                if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
            });
        }

        updateActiveNav(page);
        window.scrollTo(0, 0);

        // ── Supabase: stale-while-revalidate (background refresh) ──
        if (window.db && typeof window.db.fetchForPage === 'function') {
            window.db.fetchForPage(page).then(() => {
                // If still on the same page, re-render with fresh data
                if (currentPage === page && pages[page]) {
                    const c = document.getElementById('pageContent');
                    if (c) {
                        c.innerHTML = pages[page]();
                        if (typeof window.initPageCharts === 'function') window.initPageCharts(page);
                        if (page === 'dashboard' && typeof window.initDashboardDnd === 'function') {
                            setTimeout(() => window.initDashboardDnd(), 60);
                        }
                    }
                }
            }).catch(() => { }); // silent fail — page already rendered from cache
        }
    } else {
        renderMaintenanceUI(page, 'under-construction');
    }
}

function renderMaintenanceUI(page, type = 'maintenance') {
    const label = page.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const content = document.getElementById('pageContent');
    const isUnderConst = type === 'under-construction';

    content.innerHTML = `
        <div class="page-header">
            <div><h1 class="page-title">${label}</h1><div class="breadcrumb"><span>System</span><span class="sep">›</span><span>${label}</span></div></div>
        </div>
        <div class="card" style="border: 1px dashed var(--border)">
            <div class="card-body" style="text-align:center;padding:5rem">
                <div style="position:relative;display:inline-block;margin-bottom:2rem">
                    <i class="fa-solid ${isUnderConst ? 'fa-screwdriver-wrench' : 'fa-clock-rotate-left'}" style="font-size:3.5rem;color:var(--acc);opacity:.2"></i>
                    <i class="fa-solid fa-lock" style="position:absolute;bottom:0;right:0;font-size:1.5rem;color:var(--text1)"></i>
                </div>
                <h2 style="margin-bottom:.5rem">${isUnderConst ? 'Feature Under Optimization' : 'Global Maintenance Active'}</h2>
                <p style="color:var(--text3);max-width:480px;margin:1rem auto;line-height:1.6">
                    ${isUnderConst ?
            `The <strong>${label}</strong> module is currently being calibrated for your region. Please contact SuperAdmin for activation.` :
            'Our systems are currently undergoing a scheduled security upgrade. Global access is restricted to Dashboard only.'}
                </p>
                <div style="display:flex;gap:1rem;justify-content:center;margin-top:2rem">
                    <button class="btn btn-primary" onclick="go('dashboard')"><i class="fa-solid fa-house"></i> Home</button>
                    ${!isUnderConst ? '<button class="btn btn-secondary" onclick="window.runProdCheck()">Check Status</button>' : ''}
                </div>
            </div>
        </div>`;
    updateActiveNav(page);
    window.scrollTo(0, 0);
}


export function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    document.getElementById('sidebar').classList.toggle('collapsed');
    // Main content margin-left is controlled by .main.collapsed in style.css:516
    document.getElementById('main').classList.toggle('collapsed');
}

export function toggleMenu(id, el) {
    const menu = document.getElementById(id);
    if (!menu) return;
    const arrow = el?.querySelector('.nav-arrow');
    const isOpen = menu.classList.contains('active');
    if (!isOpen) {
        document.querySelectorAll('.nav-submenu.active').forEach(other => {
            if (other.id === id) return;
            other.classList.remove('active');
            other.style.maxHeight = '0px';
            const trigger = document.querySelector(`[onclick*="toggleMenu('${other.id}'"]`);
            const otherArrow = trigger?.querySelector('.nav-arrow');
            if (otherArrow) otherArrow.style.transform = 'rotate(0deg)';
        });
    }
    if (isOpen) {
        menu.classList.remove('active');
        menu.style.maxHeight = '0px';
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    } else {
        menu.classList.add('active');
        menu.style.maxHeight = `${menu.scrollHeight}px`;
        if (arrow) arrow.style.transform = 'rotate(90deg)';
    }
}

export function updateActiveNav(page) {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => {
        if (l.getAttribute('onclick')?.includes(`'${page}'`)) {
            l.classList.add('active');
            const parentSubmenu = l.closest('.nav-submenu');
            if (parentSubmenu) {
                parentSubmenu.classList.add('active');
                parentSubmenu.style.maxHeight = `${parentSubmenu.scrollHeight}px`;
                const triggerId = parentSubmenu.id;
                const trigger = document.querySelector(`[onclick*="toggleMenu('${triggerId}'"]`);
                if (trigger) {
                    const arrow = trigger.querySelector('.nav-arrow');
                    if (arrow) arrow.style.transform = 'rotate(90deg)';
                }
            }
        }
    });
}


export function destroyCharts() {
    Object.values(activeCharts).forEach(c => {
        if (c && typeof c.destroy === 'function') c.destroy();
    });
    activeCharts = {};
}

export function logout() {
    confirmAction('Logout', 'Are you sure you want to log out?', () => {
        try { sessionStorage.removeItem('VGR_DEMO_SESSION'); } catch (_) {}
        window.location.href = './index.html';
    });
}

// Global Flags
window.maintenanceMode = false;

// Expose globals for onclick compatibility
window.go = go;
window.toggleSidebar = toggleSidebar;
window.toggleMenu = toggleMenu;
window.logout = logout;
window.maintenanceToggle = (val) => {
    window.maintenanceMode = val;
    toast(`Maintenance Mode: ${val ? 'ON' : 'OFF'}`, val ? 'warning' : 'success');
};

function renderSkeletonUI() {
    return `
        <div class="page-header" style="margin-bottom:1.5rem">
            <div>
                <div class="skeleton" style="width:120px;height:12px;margin-bottom:.5rem"></div>
                <div class="skeleton" style="width:250px;height:32px"></div>
            </div>
            <div style="display:flex;gap:.5rem">
                <div class="skeleton" style="width:80px;height:32px;border-radius:8px"></div>
                <div class="skeleton" style="width:80px;height:32px;border-radius:8px"></div>
            </div>
        </div>
        <div class="stat-grid" style="grid-template-columns: repeat(3, 1fr); gap: 1.25rem; margin-bottom: 1.5rem">
            <div class="stat-card"><div class="skeleton" style="width:44px;height:44px;border-radius:10px"></div><div style="flex:1"><div class="skeleton" style="width:60%;height:10px;margin-bottom:.5rem"></div><div class="skeleton" style="width:80%;height:18px"></div></div></div>
            <div class="stat-card"><div class="skeleton" style="width:44px;height:44px;border-radius:10px"></div><div style="flex:1"><div class="skeleton" style="width:60%;height:10px;margin-bottom:.5rem"></div><div class="skeleton" style="width:80%;height:18px"></div></div></div>
            <div class="stat-card"><div class="skeleton" style="width:44px;height:44px;border-radius:10px"></div><div style="flex:1"><div class="skeleton" style="width:60%;height:10px;margin-bottom:.5rem"></div><div class="skeleton" style="width:80%;height:18px"></div></div></div>
        </div>
        <div class="card">
            <div class="card-header"><div class="skeleton" style="width:150px;height:14px"></div></div>
            <div class="card-body">
                <div class="skeleton" style="height:20px;margin-bottom:1rem"></div>
                <div class="skeleton" style="height:20px;margin-bottom:1rem"></div>
                <div class="skeleton" style="height:20px;margin-bottom:1rem"></div>
                <div class="skeleton" style="height:20px;margin-bottom:1rem"></div>
            </div>
        </div>`;
}

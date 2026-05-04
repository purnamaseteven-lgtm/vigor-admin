/* ─── UI COMPONENTS ─── */
import { fmt, getFilter, goToPage, setPerPage, setFilter } from '../utils/helpers.js';
import { STATE, fmtCur } from '../core/state.js';

export function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('VGR_THEME', next);

    // Update icon
    const btn = document.querySelector('[onclick="window.toggleTheme()"] i');
    if (btn) {
        btn.className = next === 'light' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }
}

window.toggleTheme = toggleTheme;

export function toast(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-circle-check' : type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'}"></i> <span>${msg}</span>`;
    container.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(-20px)'; setTimeout(() => t.remove(), 300); }, 3000);
}

export function openModal(title, body, footerHTML = '') {
    const overlay = document.getElementById('modalOverlay');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalFooter').innerHTML = footerHTML;
    overlay.classList.add('active');
    overlay.classList.add('open');
    document.getElementById('modal').style.transform = 'scale(1)';
}

export function closeModalBtn() {
    const overlay = document.getElementById('modalOverlay');
    document.getElementById('modal').style.transform = 'scale(0.9)';
    overlay.classList.remove('active');
    overlay.classList.remove('open');
}
window.closeModalBtn = closeModalBtn;
// Alias for onclick="closeModal(event)" on overlay background
export function closeModal(event) {
    if (event.target === document.getElementById('modalOverlay')) closeModalBtn();
}
window.closeModal = closeModal;

// ── Enhancement 1: Confirmation Modal ──
export function confirmAction(title, msg, callback, btnLabel = 'Confirm', variant = 'danger') {
    window._confirmCb = callback;
    const colorMap = { danger: 'var(--red)', warning: 'var(--yellow)', primary: 'var(--acc)' };
    const iconMap = { danger: 'fa-triangle-exclamation', warning: 'fa-circle-exclamation', primary: 'fa-circle-question' };
    const btnMap = { danger: 'btn-danger', warning: 'btn-secondary', primary: 'btn-primary' };
    const clr = colorMap[variant] || colorMap.danger;
    const icn = iconMap[variant] || iconMap.danger;
    const btnCls = btnMap[variant] || btnMap.danger;
    openModal(title, `
        <div class="confirm-body">
            <div class="confirm-icon" style="color:${clr}"><i class="fa-solid ${icn}"></i></div>
            <div class="confirm-msg">${msg}</div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn ${btnCls}" onclick="if(window._confirmCb){window._confirmCb();}closeModalBtn();">${btnLabel}</button>
    `);
}
window.confirmAction = confirmAction;
window._confirmCb = null;

// ── Enhancement 8: Member Detail Modal ──
export function showMember(username) {
    const m = STATE.members.find(x => x.username === username);
    if (!m) { toast('Member not found', 'error'); return; }
    const statusColors = { Active: 'success', Inactive: 'warning', Suspended: 'danger', Blocked: 'danger' };
    const sc = statusColors[m.status] || 'warning';
    const initials = (m.name || m.username).substring(0, 2).toUpperCase();
    openModal(`Member Profile`, `
        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid var(--border)">
            <div class="member-avatar-lg">${initials}</div>
            <div>
                <div style="font-size:1.05rem;font-weight:700;margin-bottom:.15rem">${m.name}</div>
                <div style="font-size:.8rem;color:var(--text3)">@${m.username}</div>
                <div style="margin-top:.4rem;display:flex;gap:.4rem;flex-wrap:wrap">
                    <span class="badge badge-${sc}">${m.status}</span>
                    ${m.tier ? `<span class="badge badge-indigo">${m.tier}</span>` : ''}
                    <span class="badge badge-blue">${m.company}</span>
                </div>
            </div>
            <div style="margin-left:auto;text-align:right">
                <div style="font-size:.68rem;color:var(--text3);text-transform:uppercase;letter-spacing:.06em">Balance</div>
                <div style="font-size:1.15rem;font-weight:700;color:var(--green)">${fmtCur(m.balance || 0)}</div>
            </div>
        </div>
        <div class="member-detail-grid">
            <div class="member-detail-item"><label>Phone</label><span>${m.phone || '-'}</span></div>
            <div class="member-detail-item"><label>Bank</label><span>${m.bank || '-'}</span></div>
            <div class="member-detail-item"><label>Account Number</label><span>${m.bankAccount || '-'}</span></div>
            <div class="member-detail-item"><label>Company</label><span>${m.company || '-'}</span></div>
            <div class="member-detail-item"><label>Joined</label><span>${m.joined || '-'}</span></div>
            <div class="member-detail-item"><label>Last Login</label><span>${m.lastLogin || '-'}</span></div>
            <div class="member-detail-item"><label>IP Address</label><span style="font-size:.78rem;font-family:monospace">${m.ip || '-'}</span></div>
            <div class="member-detail-item"><label>Referral</label><span>${m.referral || '-'}</span></div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Close</button>
        <button class="btn btn-primary" onclick="closeModalBtn();setTimeout(()=>openFormModal('member','${m.id}'),120)">
            <i class="fa-solid fa-pen"></i> Edit Member
        </button>
        <button class="btn btn-danger" onclick="confirmAction('Delete Member','Delete member [${m.username}]? This action cannot be undone.',()=>{window.stateDelete('members','${m.id}');closeModalBtn();window.go('global-member-list');toast('Member deleted','success');},'Delete','danger')">
            <i class="fa-solid fa-trash"></i>
        </button>
    `);
}
window.showMember = showMember;

// ── Enhancement 4: Export CSV button HTML helper ──
export function exportBtn(filename = 'export.csv', label = 'Export CSV') {
    return `<button class="btn btn-export btn-sm" onclick="window.exportTableCSV(null,'${filename}')"><i class="fa-solid fa-file-csv"></i> ${label}</button>`;
}
window.exportBtn = exportBtn;

export function pageHeader(title, breadcrumb, actions = '') {
    return `
    <div class="page-header">
      <div>
        <div class="breadcrumb">${breadcrumb}</div>
        <h2 class="page-title">${title}</h2>
      </div>
      <div class="page-actions">${actions}</div>
    </div>`;
}

export function filterCard(html) { return `<div class="filter-card"><div class="filter-row">${html}</div></div>`; }
export function card(header, body) { return `<div class="card"><div class="card-header"><span class="card-title">${header}</span></div><div class="card-body">${body}</div></div>`; }

export function tableWrap(html, exportName = 'platform_export.csv') {
    return `<div class="table-wrapper-outer" style="position:relative;">
        <div style="display:flex; justify-content:flex-end; margin-bottom: 0.8rem; padding-right: 0.2rem;">
            <button class="btn btn-secondary btn-sm" style="border:1px solid rgba(255,255,255,0.1); background:var(--bg2); color:var(--text2); font-weight:700;" onclick="window.exportTableCSV(this.closest('.table-wrapper-outer').querySelector('table'), '${exportName}')">
                <i class="fa-solid fa-file-csv" style="color:#10b981; margin-right:4px;"></i> Export Data
            </button>
        </div>
        <div class="table-wrapper">${html}</div>
    </div>`;
}

export function badge(text, color) { return `<span class="badge badge-${color}">${text}</span>`; }
export function actionBtns(editCb = '', deleteCb = '', extra = '') {
    const editClick = editCb || "toast('Edit','info')";
    const delClick = deleteCb || "confirmAction('Delete Record','Are you sure you want to delete this record? This cannot be undone.',()=>toast('Deleted','success'),'Delete','danger')";
    return `<div class="action-btns"><button class="btn btn-sm btn-icon" style="background:#f59e0b;color:#fff" title="Edit" onclick="${editClick}"><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm btn-danger btn-icon" title="Delete" onclick="${delClick}"><i class="fa-solid fa-trash"></i></button>${extra}</div>`;
}

export function filterInput(label, placeholder, width = '160px') {
    return `<div class="filter-group"><label>${label}</label><input type="text" placeholder="${placeholder}" style="width:${width}"/></div>`;
}
export function filterSelect(label, options, width = '160px') {
    return `<div class="filter-group"><label>${label}</label><select style="width:${width}">${options.map(o => `<option>${o}</option>`).join('')}</select></div>`;
}
export function filterDate(label) {
    return `<div class="filter-group"><label>${label}</label><div class="input-icon" style="width:140px"><i class="fa-regular fa-calendar"></i><input type="text" placeholder="YYYY-MM-DD" style="width:100%"/></div></div>`;
}
export function filterActions() {
    return `<div class="filter-actions"><button class="btn btn-primary" title="Search"><i class="fa-solid fa-magnifying-glass"></i> Search</button><button class="btn btn-danger" title="Reset"><i class="fa-solid fa-rotate-left"></i></button></div>`;
}

/* ─── SMART FILTERS (FS-...) ─── */
export function fsInput(pg, k, label, ph = '', w = '160px') {
    const v = getFilter(pg, k);
    return `<div class="filter-group"><label>${label}</label><input type="text" value="${v}" placeholder="${ph}" style="width:${w}" oninput="window.setFilter('${pg}','${k}',this.value)"/></div>`;
}
export function fsSelect(pg, k, label, opts, w = '140px') {
    const v = getFilter(pg, k);
    return `<div class="filter-group"><label>${label}</label><select style="width:${w}" onchange="window.setFilter('${pg}','${k}',this.value)">${opts.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select></div>`;
}
export function fsActions(pg, extra = '') {
    return `<div class="filter-actions"><button class="btn btn-primary" onclick="window.go('${pg}')"><i class="fa-solid fa-magnifying-glass"></i> Search</button><button class="btn btn-danger" onclick="window.resetFilters('${pg}');window.go('${pg}')"><i class="fa-solid fa-rotate-left"></i></button>${extra}</div>`;
}

export function fsDateFilter(pg, startK, endK, label = 'Periode') {
    const startV = getFilter(pg, startK);
    const endV = getFilter(pg, endK);
    return `
    <div class="filter-group date-filter-group">
        <label>${label}</label>
        <div style="display:flex;align-items:center;gap:.5rem">
            <input type="date" value="${startV}" onchange="window.setFilter('${pg}','${startK}',this.value)" class="form-control" style="width:130px;height:32px;font-size:.75rem"/>
            <span style="color:var(--text3)">-</span>
            <input type="date" value="${endV}" onchange="window.setFilter('${pg}','${endK}',this.value)" class="form-control" style="width:130px;height:32px;font-size:.75rem"/>
            <div class="date-quick-btns">
                <button onclick="window.setQuickDateRange('${pg}','${startK}','${endK}','today')" title="Hari Ini">HI</button>
                <button onclick="window.setQuickDateRange('${pg}','${startK}','${endK}','7days')" title="7 Hari Terakhir">7D</button>
                <button onclick="window.setQuickDateRange('${pg}','${startK}','${endK}','month')" title="Bulan Ini">BI</button>
            </div>
        </div>
    </div>`;
}


export function renderPagerHTML(key, total, perPage, curPage) {
    const totalPages = Math.ceil(total / perPage);
    if (totalPages <= 1) return '';
    let html = `<div class="pager">`;
    html += `<button class="btn btn-sm btn-secondary" ${curPage === 1 ? 'disabled' : ''} onclick="window.goToPage('${key}',${curPage - 1});window.go('${key}')"><i class="fa-solid fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= curPage - 2 && i <= curPage + 2)) {
            html += `<button class="btn btn-sm ${i === curPage ? 'btn-primary' : 'btn-secondary'}" onclick = "window.goToPage('${key}',${i});window.go('${key}')" > ${i}</button> `;
        } else if (i === curPage - 3 || i === curPage + 3) {
            html += `<span style = "color:var(--text3)" >...</span> `;
        }
    }
    html += `<button class="btn btn-sm btn-secondary" ${curPage === totalPages ? 'disabled' : ''} onclick = "window.goToPage('${key}',${curPage + 1});window.go('${key}')" > <i class="fa-solid fa-chevron-right"></i></button> `;
    html += `<div style = "margin-left:auto;display:flex;align-items:center;gap:.5rem" ><span style="font-size:.75rem;color:var(--text3)">Per page:</span><select onchange="window.setPerPage('${key}',this.value);window.go('${key}')" style="border:1px solid var(--border);border-radius:6px;padding:.2rem .4rem;font-size:.75rem;outline:none">${[10, 30, 50, 100].map(n => `<option ${n === perPage ? 'selected' : ''}>${n}</option>`).join('')}</select></div> `;
    html += `</div> `;
    return html;
}

export function renderSidebar() {
    const role = STATE.currentAdmin.role;
    const isSuper = role === 'SuperAdmin';
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    const mx = STATE.permissionMatrix || {};
    const check = (mod, sub) => isSuper || (mx[role] && mx[role][mod] && mx[role][mod][sub]);
    const sectionActive = (mod) => isSuper || (mx[role] && mx[role][mod] && Object.values(mx[role][mod]).some(v => v === true));

    let html = '';

    // 1. Home
    if (sectionActive('home')) {
        html += `<div class="sidebar-menu-label">${isSuper ? 'Whitelabel Console' : 'Management'}</div>`;
        html += `
        <div class="nav-item">
            <div class="nav-link" onclick="toggleMenu('homeMenu', this)"><i class="fa-solid fa-house nav-icon"></i><span class="nav-label">Home</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
            <div class="nav-submenu" id="homeMenu">
                <div class="nav-link" style="${check('home', 'dashboard') ? '' : 'display:none'}" onclick="go('dashboard')"><i class="fa-solid fa-gauge-high nav-icon"></i><span class="nav-label">Dashboard</span></div>
                <div class="nav-link" style="${check('home', 'statistics') ? '' : 'display:none'}" onclick="go('statistics')"><i class="fa-solid fa-chart-line nav-icon"></i><span class="nav-label">Statistics</span></div>
                <div class="nav-link" style="${check('home', 'providerAnalytics') ? '' : 'display:none'}" onclick="go('provider-analytics')"><i class="fa-solid fa-chart-pie nav-icon"></i><span class="nav-label">Provider Analytics</span></div>
                <div class="nav-link" style="${check('home', 'deviceReport') ? '' : 'display:none'}" onclick="go('device-report')"><i class="fa-solid fa-mobile-screen nav-icon"></i><span class="nav-label">Device Report</span></div>
            </div>
        </div>`;
    }

    // 3. Master Management
    if (sectionActive('master')) {
        html += `
        <div class="nav-item">
            <div class="nav-link" onclick="toggleMenu('masterMenu', this)"><i class="fa-solid fa-crown nav-icon"></i><span class="nav-label">Master Agent</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
            <div class="nav-submenu" id="masterMenu">
                <div class="nav-link" style="${check('master', 'whitelist') ? '' : 'display:none'}" onclick="go('whitelist')"><i class="fa-solid fa-shield-halved nav-icon"></i><span class="nav-label">IP Whitelist</span></div>
                <div class="nav-link" style="${check('master', 'blacklist') ? '' : 'display:none'}" onclick="go('blacklist')"><i class="fa-solid fa-ban nav-icon"></i><span class="nav-label">IP/User Blacklist</span></div>
                <div class="nav-link" style="${check('master', 'masterWhitelist') ? '' : 'display:none'}" onclick="go('master-whitelist')"><i class="fa-solid fa-check-double nav-icon"></i><span class="nav-label">Master Whitelist</span></div>
            </div>
        </div>`;
    }

    // 4. Administrators
    if (sectionActive('administrators')) {
        html += `
        <div class="nav-item">
            <div class="nav-link" onclick="toggleMenu('admMenu', this)"><i class="fa-solid fa-user-shield nav-icon"></i><span class="nav-label">Administrators</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
            <div class="nav-submenu" id="admMenu">
                <div class="nav-link" style="${check('administrators', 'systemAdmins') ? '' : 'display:none'}" onclick="go('admins-list')"><i class="fa-solid fa-users-gear nav-icon"></i><span class="nav-label">System Admins</span></div>
                <div class="nav-link" style="${check('administrators', 'rolePermissions') ? '' : 'display:none'}" onclick="go('dev-menu-config')"><i class="fa-solid fa-toggle-on nav-icon"></i><span class="nav-label">Platform Matrix</span></div>
            </div>
        </div>`;
    }

    // 5. Agent Management (Renamed from Company Management)
    if (sectionActive('companyManagement')) {
        html += `
        <div class="nav-item">
            <div class="nav-link" onclick="toggleMenu('compMenu', this)"><i class="fa-solid fa-building nav-icon"></i><span class="nav-label">Agent Management</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
            <div class="nav-submenu" id="compMenu">
                <div class="nav-link" style="${check('companyManagement', 'whitelabelList') ? '' : 'display:none'}" onclick="go('company-list')"><i class="fa-solid fa-list-ul nav-icon"></i><span class="nav-label">Agent List</span></div>
                <div class="nav-link" style="${check('companyManagement', 'regisNewCompany') ? '' : 'display:none'}" onclick="go('company-create')"><i class="fa-solid fa-plus-circle nav-icon"></i><span class="nav-label">Create New Agent</span></div>
            </div>
        </div>`;
    }

    // 6. Whitelabel Management (Renamed to Master Whitelabel)
    if (sectionActive('whitelabel')) {
        html += `
        <div class="nav-item">
            <div class="nav-link" onclick="toggleMenu('wlMenu', this)"><i class="fa-solid fa-tags nav-icon"></i><span class="nav-label">Master Agent WL</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
            <div class="nav-submenu" id="wlMenu">
                <div class="nav-link" style="${check('whitelabel', 'whitelabelList') ? '' : 'display:none'}" onclick="go('whitelabel-list')"><i class="fa-solid fa-list-ul nav-icon"></i><span class="nav-label">Agent WL List</span></div>
                <div class="nav-link" style="${check('whitelabel', 'masterWlList') ? '' : 'display:none'}" onclick="go('master-wl-list')"><i class="fa-solid fa-crown nav-icon"></i><span class="nav-label">Master Agent List</span></div>
            </div>
        </div>`;
    }

    // 7. Members
    if (sectionActive('members')) {
        html += `
        <div class="nav-item">
            <div class="nav-link" onclick="toggleMenu('memMenu', this)"><i class="fa-solid fa-users nav-icon"></i><span class="nav-label">Members</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
            <div class="nav-submenu" id="memMenu">
                <div class="nav-link" style="${check('members', 'memberList') ? '' : 'display:none'}" onclick="go('global-member-list')"><i class="fa-solid fa-user-group nav-icon"></i><span class="nav-label">Member List</span></div>
                <div class="nav-link" style="${check('members', 'addMember') ? '' : 'display:none'}" onclick="go('global-member-list')"><i class="fa-solid fa-user-plus nav-icon"></i><span class="nav-label">Add Member</span></div>
                <div class="nav-link" style="${check('members', 'tierHistory') ? '' : 'display:none'}" onclick="go('tier-history')"><i class="fa-solid fa-clock-rotate-left nav-icon"></i><span class="nav-label">Tier History</span></div>
            </div>
        </div>`;
    }

    // 6. Bank Management & Finance
    if (sectionActive('bankManagement')) {
        html += `
        <div class="nav-item">
            <div class="nav-link" onclick="toggleMenu('bankMenu', this)"><i class="fa-solid fa-building-columns nav-icon"></i><span class="nav-label">Bank Management</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
            <div class="nav-submenu" id="bankMenu">
                <div class="nav-link" style="${check('bankManagement', 'bankList') ? '' : 'display:none'}" onclick="go('bank-list')"><i class="fa-solid fa-list nav-icon"></i><span class="nav-label">Bank List</span></div>
                <div class="nav-link" style="${check('bankManagement', 'createNewBank') ? '' : 'display:none'}" onclick="go('bank-create')"><i class="fa-solid fa-plus nav-icon"></i><span class="nav-label">Create New Bank</span></div>
            </div>
        </div>`;
    }

    if (sectionActive('finance')) {
        html += `
        <div class="nav-item">
            <div class="nav-link" onclick="toggleMenu('finMenu', this)"><i class="fa-solid fa-coins nav-icon"></i><span class="nav-label">Finance</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
            <div class="nav-submenu" id="finMenu">
                <div class="nav-link" style="${check('finance', 'deposit') ? '' : 'display:none'}" onclick="go('deposit-list')"><i class="fa-solid fa-arrow-down-to-bracket nav-icon"></i><span class="nav-label">Deposit</span></div>
                <div class="nav-link" style="${check('finance', 'withdrawal') ? '' : 'display:none'}" onclick="go('withdrawal-list')"><i class="fa-solid fa-arrow-up-from-bracket nav-icon"></i><span class="nav-label">Withdrawal</span></div>
                <div class="nav-link" style="${check('finance', 'adjustment') ? '' : 'display:none'}" onclick="go('finance-adjustment')"><i class="fa-solid fa-scale-unbalanced nav-icon"></i><span class="nav-label">Adjustment</span></div>
                <div class="nav-link" style="${check('finance', 'adjustmentLogs') ? '' : 'display:none'}" onclick="go('finance-adjustment-logs')"><i class="fa-solid fa-receipt nav-icon"></i><span class="nav-label">Adjustment Logs</span></div>
            </div>
        </div>`;
    }

    // 7. Betting & Results
    if (sectionActive('bets') || sectionActive('bonus') || sectionActive('results')) {
        html += `<div class="sidebar-menu-label">Gaming Operations</div>`;
        if (sectionActive('bets')) {
            html += `
            <div class="nav-item">
                <div class="nav-link" onclick="toggleMenu('betMenu', this)"><i class="fa-solid fa-dice nav-icon"></i><span class="nav-label">Bets</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
                <div class="nav-submenu" id="betMenu">
                    <div class="nav-link" style="${check('bets', 'betsListing') ? '' : 'display:none'}" onclick="go('bets-list')"><i class="fa-solid fa-list nav-icon"></i><span class="nav-label">Bets Listing</span></div>
                    <div class="nav-link" style="${check('bets', 'bettingTable') ? '' : 'display:none'}" onclick="go('bets-table')"><i class="fa-solid fa-table nav-icon"></i><span class="nav-label">Betting Table</span></div>
                    <div class="nav-link" style="${check('bets', 'transferredList') ? '' : 'display:none'}" onclick="go('bets-transferred')"><i class="fa-solid fa-arrow-right-arrow-left nav-icon"></i><span class="nav-label">Transferred List</span></div>
                </div>
            </div>`;
        }

        if (sectionActive('bonus')) {
            html += `
            <div class="nav-item">
                <div class="nav-link" onclick="toggleMenu('bonMenu', this)"><i class="fa-solid fa-gift nav-icon"></i><span class="nav-label">Bonus</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
                <div class="nav-submenu" id="bonMenu">
                    <div class="nav-link" style="${check('bonus', 'promotionRelease') ? '' : 'display:none'}" onclick="go('promotion-release')"><i class="fa-solid fa-paper-plane nav-icon"></i><span class="nav-label">Promotion Release</span></div>
                    <div class="nav-link" style="${check('bonus', 'promotionRollingRelease') ? '' : 'display:none'}" onclick="go('promotion-rolling-release')"><i class="fa-solid fa-arrows-spin nav-icon"></i><span class="nav-label">Rolling Release</span></div>
                    <div class="nav-link" style="${check('bonus', 'promotions') ? '' : 'display:none'}" onclick="go('custom-promotion-list')"><i class="fa-solid fa-bullhorn nav-icon"></i><span class="nav-label">Promotions List</span></div>
                    <div class="nav-link" style="${check('bonus', 'bonusReport') ? '' : 'display:none'}" onclick="go('bonus-report')"><i class="fa-solid fa-file-invoice nav-icon"></i><span class="nav-label">Bonus Report</span></div>
                    <div class="nav-link" style="${check('bonus', 'agentFreebet') ? '' : 'display:none'}" onclick="go('bonus-agent-freebet')"><i class="fa-solid fa-hand-holding-dollar nav-icon"></i><span class="nav-label">Agent Freebet</span></div>
                    <div class="nav-link" style="${check('bonus', 'agentFreebetReport') ? '' : 'display:none'}" onclick="go('bonus-agent-freebet-report')"><i class="fa-solid fa-file-contract nav-icon"></i><span class="nav-label">Agent Freebet Report</span></div>
                    <div class="nav-link" style="${check('bonus', 'pragmaticFrb') ? '' : 'display:none'}" onclick="go('bonus-pragmatic-frb')"><i class="fa-solid fa-coins nav-icon"></i><span class="nav-label">Pragmatic FRB</span></div>
                </div>
            </div>`;
        }

        if (sectionActive('results')) {
            html += `
            <div class="nav-item">
                <div class="nav-link" onclick="toggleMenu('resMenu', this)"><i class="fa-solid fa-square-poll-vertical nav-icon"></i><span class="nav-label">Results</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
                <div class="nav-submenu" id="resMenu">
                    <div class="nav-link" style="${check('results', 'resultsListing') ? '' : 'display:none'}" onclick="go('results-list')"><i class="fa-solid fa-list-ol nav-icon"></i><span class="nav-label">Results Listing</span></div>
                    <div class="nav-link" style="${check('results', 'resultScan') ? '' : 'display:none'}" onclick="go('results-scan')"><i class="fa-solid fa-barcode nav-icon"></i><span class="nav-label">Result Scan</span></div>
                    <div class="nav-link" style="${check('results', 'resultsAnalyze') ? '' : 'display:none'}" onclick="go('results-analyze')"><i class="fa-solid fa-magnifying-glass-chart nav-icon"></i><span class="nav-label">Results Analyze</span></div>
                </div>
            </div>`;
        }
    }

    // 8. Integrations & Systems
    if (sectionActive('integrations') || sectionActive('customization') || sectionActive('settings')) {
        html += `<div class="sidebar-menu-label">System Control</div>`;

        if (sectionActive('integrations')) {
            html += `
            <div class="nav-item">
                    <div class="nav-link" onclick="toggleMenu('seamlessMenu', this)"><i class="fa-solid fa-puzzle-piece nav-icon" style="color:var(--acc)"></i><span class="nav-label">Seamless API</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
                    <div class="nav-submenu" id="seamlessMenu">
                        <div class="nav-link" style="${check('integrations', 'providerSetup') ? '' : 'display:none'}" onclick="go('seamless-config')"><i class="fa-solid fa-gear nav-icon"></i><span class="nav-label">Provider Setup</span></div>
                        <div class="nav-link" style="${check('integrations', 'apiLogs') ? '' : 'display:none'}" onclick="go('seamless-api-logs')"><i class="fa-solid fa-file-code nav-icon"></i><span class="nav-label">API Logs</span></div>
                        <div class="nav-link" style="${check('integrations', 'developerDocs') ? '' : 'display:none'}" onclick="go('seamless-docs')"><i class="fa-solid fa-book nav-icon"></i><span class="nav-label">Developer Docs</span></div>
                    </div>
                </div>`;
        }

        if (sectionActive('customization')) {
            html += `
            <div class="nav-item">
                    <div class="nav-link" onclick="toggleMenu('customMenu', this)"><i class="fa-solid fa-palette nav-icon"></i><span class="nav-label">Customization</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
                    <div class="nav-submenu" id="customMenu">
                        <div class="nav-link" style="${check('customization', 'templateBuilder') ? '' : 'display:none'}" onclick="go('template-builder')"><i class="fa-solid fa-object-group nav-icon"></i><span class="nav-label">Template Builder</span></div>
                        <div class="nav-link" style="${check('customization', 'templatePreview') ? '' : 'display:none'}" onclick="go('custom-template')"><i class="fa-solid fa-list-check nav-icon"></i><span class="nav-label">Templates List</span></div>
                        <div class="nav-link" style="${check('customization', 'templatePreview') ? '' : 'display:none'}" onclick="go('template-preview')"><i class="fa-solid fa-eye nav-icon"></i><span class="nav-label">Template Preview</span></div>
                        <div class="nav-link" style="${check('customization', 'systemTheme') ? '' : 'display:none'}" onclick="go('custom-theme')"><i class="fa-solid fa-droplet nav-icon"></i><span class="nav-label">System Theme</span></div>
                        <div class="nav-link" style="${check('customization', 'globalBanner') ? '' : 'display:none'}" onclick="go('custom-global-banner')"><i class="fa-solid fa-images nav-icon"></i><span class="nav-label">Global Banner</span></div>
                        <div class="nav-link" style="${check('customization', 'appNotification') ? '' : 'display:none'}" onclick="go('custom-app-notification')"><i class="fa-solid fa-bell-concierge nav-icon"></i><span class="nav-label">App Notification</span></div>
                        <div class="nav-link" style="${check('customization', 'announcements') ? '' : 'display:none'}" onclick="go('announcement-list')"><i class="fa-solid fa-bullhorn nav-icon"></i><span class="nav-label">Announcements</span></div>
                        <div class="nav-link" style="${check('customization', 'siteConfig') ? '' : 'display:none'}" onclick="go('custom-site-config')"><i class="fa-solid fa-sliders nav-icon"></i><span class="nav-label">Site Config</span></div>
                        <div class="nav-link" style="${check('customization', 'seoTools') ? '' : 'display:none'}" onclick="go('custom-seo')"><i class="fa-solid fa-magnifying-glass-chart nav-icon"></i><span class="nav-label">SEO Settings</span></div>
                    </div>
                </div>`;
        }

        if (sectionActive('settings')) {
            html += `
            <div class="nav-item">
                <div class="nav-link" onclick="toggleMenu('setMenu', this)"><i class="fa-solid fa-gears nav-icon"></i><span class="nav-label">Settings</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
                <div class="nav-submenu" id="setMenu">
                    <div class="nav-link" style="${check('settings', 'commission') ? '' : 'display:none'}" onclick="go('settings-commission')"><i class="fa-solid fa-percent nav-icon"></i><span class="nav-label">Commission</span></div>
                    <div class="nav-link" style="${check('settings', 'referralRate') ? '' : 'display:none'}" onclick="go('settings-referral-rate')"><i class="fa-solid fa-share-nodes nav-icon"></i><span class="nav-label">Referral Rate</span></div>
                    <div class="nav-link" style="${check('settings', 'poolsList') ? '' : 'display:none'}" onclick="go('settings-pools')"><i class="fa-solid fa-water nav-icon"></i><span class="nav-label">Pools List</span></div>
                    <div class="nav-link" style="${check('settings', 'games') ? '' : 'display:none'}" onclick="go('settings-games')"><i class="fa-solid fa-gamepad nav-icon"></i><span class="nav-label">Games</span></div>
                    <div class="nav-link" style="${check('settings', 'agentGameSettings') ? '' : 'display:none'}" onclick="go('settings-agent-games')"><i class="fa-solid fa-user-gear nav-icon"></i><span class="nav-label">Agent Game Settings</span></div>
                    <div class="nav-link" style="${check('settings', 'togelCommission') ? '' : 'display:none'}" onclick="go('settings-togel-commission')"><i class="fa-solid fa-clover nav-icon"></i><span class="nav-label">Togel Commission</span></div>
                    <div class="nav-link" style="${check('settings', 'limitCreditOut') ? '' : 'display:none'}" onclick="go('settings-limit-credit-out')"><i class="fa-solid fa-gauge nav-icon"></i><span class="nav-label">Limit Credit Out</span></div>
                    <div class="nav-link" style="${check('settings', 'vipDesigner') ? '' : 'display:none'}" onclick="go('custom-vip')"><i class="fa-solid fa-crown nav-icon"></i><span class="nav-label">VIP Tiers</span></div>
                    <div class="nav-link" style="${check('settings', 'rebateCalc') ? '' : 'display:none'}" onclick="go('rebate-calc')"><i class="fa-solid fa-calculator nav-icon"></i><span class="nav-label">Weekly Rebate</span></div>
                    <div class="nav-link" style="${check('settings', 'financeLimits') ? '' : 'display:none'}" onclick="go('settings-finance')"><i class="fa-solid fa-sliders nav-icon"></i><span class="nav-label">Finance Limits</span></div>
                </div>
            </div>`;
        }
    }

    // 9. Tools
    if (sectionActive('tools')) {
        html += `
        <div class="nav-item">
            <div class="nav-link" onclick="toggleMenu('toolsMenu', this)"><i class="fa-solid fa-screwdriver-wrench nav-icon"></i><span class="nav-label">Tools</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
            <div class="nav-submenu" id="toolsMenu">
                <div class="nav-link" style="${check('tools', 'coin2pay') ? '' : 'display:none'}" onclick="go('tools-coin2pay')"><i class="fa-solid fa-coins nav-icon"></i><span class="nav-label">Coin2pay</span></div>
                <div class="nav-link" style="${check('tools', 'hostManagement') ? '' : 'display:none'}" onclick="go('tools-host')"><i class="fa-solid fa-server nav-icon"></i><span class="nav-label">Host Management</span></div>
                <div class="nav-link" style="${check('tools', 'sawala') ? '' : 'display:none'}" onclick="go('tools-sawala')"><i class="fa-solid fa-comments nav-icon"></i><span class="nav-label">Sawala</span></div>
                <div class="nav-link" style="${check('tools', 'smartico') ? '' : 'display:none'}" onclick="go('tools-smartico')"><i class="fa-solid fa-brain nav-icon"></i><span class="nav-label">Smartico</span></div>
                <div class="nav-link" style="${check('tools', 'unopay') ? '' : 'display:none'}" onclick="go('tools-unopay')"><i class="fa-solid fa-credit-card nav-icon"></i><span class="nav-label">Unopay Payment</span></div>
            </div>
        </div>`;
    }

    // 10. Memo
    if (sectionActive('memo')) {
        html += `
        <div class="nav-item">
            <div class="nav-link" onclick="toggleMenu('memoMenu', this)"><i class="fa-solid fa-envelope-open-text nav-icon"></i><span class="nav-label">Memo</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
            <div class="nav-submenu" id="memoMenu">
                <div class="nav-link" style="${check('memo', 'memoBox') ? '' : 'display:none'}" onclick="go('memo-list')"><i class="fa-solid fa-inbox nav-icon"></i><span class="nav-label">Memo Box</span></div>
                <div class="nav-link" style="${check('memo', 'autoMemo') ? '' : 'display:none'}" onclick="go('memo-auto')"><i class="fa-solid fa-robot nav-icon"></i><span class="nav-label">Auto Memo</span></div>
            </div>
        </div>`;
    }

    // 11. Advanced Reports
    if (sectionActive('reports')) {
        html += `
        <div class="nav-item">
            <div class="nav-link" onclick="toggleMenu('repMenu', this)"><i class="fa-solid fa-chart-column nav-icon"></i><span class="nav-label">Reports</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
            <div class="nav-submenu" id="repMenu">
                <div class="nav-link" style="${check('reports', 'winloss') ? '' : 'display:none'}" onclick="go('reports-winloss')"><i class="fa-solid fa-chart-line nav-icon"></i><span class="nav-label">WinLoss Report</span></div>
                <div class="nav-link" style="${check('reports', 'agentDaily') ? '' : 'display:none'}" onclick="go('reports-agent-daily')"><i class="fa-solid fa-calendar-day nav-icon"></i><span class="nav-label">Agent Daily Report</span></div>
                <div class="nav-link" style="${check('reports', 'limitCredit') ? '' : 'display:none'}" onclick="go('reports-limit-credit')"><i class="fa-solid fa-gauge nav-icon"></i><span class="nav-label">Limit Credit</span></div>
                <div class="nav-link" style="${check('reports', 'lostMoney') ? '' : 'display:none'}" onclick="go('reports-lost-money')"><i class="fa-solid fa-money-bill-trend-up nav-icon"></i><span class="nav-label">Lost Money Report</span></div>
                <div class="nav-link" style="${check('reports', 'togelLost') ? '' : 'display:none'}" onclick="go('reports-togel-lost')"><i class="fa-solid fa-dice-five nav-icon"></i><span class="nav-label">Togel Lost Money</span></div>
                <div class="nav-link" style="${check('reports', 'topTurnover') ? '' : 'display:none'}" onclick="go('reports-top-turnover')"><i class="fa-solid fa-trophy nav-icon"></i><span class="nav-label">Top Turnover</span></div>
            </div>
        </div>`;
    }

    // 12. Monthly Invoice
    if (sectionActive('invoice')) {
        html += `
        <div class="nav-item">
            <div class="nav-link" onclick="toggleMenu('invMenu', this)"><i class="fa-solid fa-file-invoice nav-icon"></i><span class="nav-label">Monthly Invoice</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
            <div class="nav-submenu" id="invMenu">
                <div class="nav-link" style="${check('invoice', 'monthly') ? '' : 'display:none'}" onclick="go('invoice-monthly')"><i class="fa-solid fa-calendar-check nav-icon"></i><span class="nav-label">Monthly Invoice</span></div>
                <div class="nav-link" style="${check('invoice', 'fileManagement') ? '' : 'display:none'}" onclick="go('invoice-file')"><i class="fa-solid fa-folder-open nav-icon"></i><span class="nav-label">File Management</span></div>
                <div class="nav-link" style="${check('invoice', 'tournamentWinners') ? '' : 'display:none'}" onclick="go('invoice-tournament')"><i class="fa-solid fa-medal nav-icon"></i><span class="nav-label">Tournament Winners</span></div>
            </div>
        </div>`;
    }

    // 13. Logs
    if (sectionActive('logs')) {
        html += `
        <div class="nav-item">
            <div class="nav-link" onclick="toggleMenu('logMenu', this)"><i class="fa-solid fa-scroll nav-icon"></i><span class="nav-label">System Logs</span><i class="fa-solid fa-chevron-right nav-arrow"></i></div>
            <div class="nav-submenu" id="logMenu">
                <div class="nav-link" style="${check('logs', 'adminLogs') ? '' : 'display:none'}" onclick="go('logs-admin')"><i class="fa-solid fa-user-shield nav-icon"></i><span class="nav-label">Admin Logs</span></div>
                <div class="nav-link" style="${check('logs', 'companyLogs') ? '' : 'display:none'}" onclick="go('logs-company')"><i class="fa-solid fa-building nav-icon"></i><span class="nav-label">Company Logs</span></div>
                <div class="nav-link" style="${check('logs', 'whitelabelLogs') ? '' : 'display:none'}" onclick="go('logs-whitelabel')"><i class="fa-solid fa-tag nav-icon"></i><span class="nav-label">Whitelabel Logs</span></div>
                <div class="nav-link" style="${check('logs', 'memberLogs') ? '' : 'display:none'}" onclick="go('logs-member')"><i class="fa-solid fa-users nav-icon"></i><span class="nav-label">Member Logs</span></div>
                <div class="nav-link" style="${check('logs', 'masterWlLogs') ? '' : 'display:none'}" onclick="go('logs-master-wl')"><i class="fa-solid fa-crown nav-icon"></i><span class="nav-label">Master WL Logs</span></div>
            </div>
        </div>`;
    }

    // Session Control
    html += `<div class="sidebar-menu-label">Session Control</div>
        <div class="nav-item"><div class="nav-link" onclick="logout()"><i class="fa-solid fa-right-from-bracket nav-icon"></i><span class="nav-label">Logout Account</span></div></div>`;

    nav.innerHTML = html;
}

export function renderProfileDisplay() {
    const admin = STATE.currentAdmin;
    const nameEls = document.querySelectorAll('.user-name, .huser-name');
    const roleEls = document.querySelectorAll('.user-role, .huser-role');
    const avatarEls = document.querySelectorAll('.user-avatar, .header-avatar');

    nameEls.forEach(el => el.textContent = admin.username);
    roleEls.forEach(el => el.textContent = `${admin.role} · ${admin.company} `);
    avatarEls.forEach(el => el.textContent = admin.username.substring(0, 2).toUpperCase());

    // Update Header Badges
    const memoBadge = document.querySelector('.header-icon-btn[onclick*="memo-list"] .badge');
    const bellBadge = document.querySelector('.header-icon-btn[onclick*="showNotifications"] .badge');
    if (memoBadge) memoBadge.textContent = '3'; // Dummy count
    if (bellBadge) bellBadge.textContent = '5'; // Dummy count
}

export function showNotifications() {
    const alerts = [
        { icon: 'fa-arrow-down-to-bracket', color: 'var(--green)', msg: 'New Deposit: Rp 1,500,000 from @user123', time: '2m ago' },
        { icon: 'fa-triangle-exclamation', color: 'var(--red)', msg: 'Company [Sunwi] reached 100% credit limit', time: '10m ago' },
        { icon: 'fa-user-plus', color: 'var(--acc)', msg: 'New Whitelabel Request: Zenith88', time: '1h ago' },
        { icon: 'fa-shield-halved', color: 'var(--yellow)', msg: 'Failed Login attempt from IP 103.21.32.4', time: '3h ago' }
    ];

    const body = `
        <div style = "display:flex;flex-direction:column;gap:.5rem" >
            ${alerts.map(a => `
                <div style="padding:.75rem;background:var(--bg2);border-radius:10px;display:flex;gap:1rem;align-items:center;cursor:pointer">
                    <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;color:${a.color}">
                        <i class="fa-solid ${a.icon}"></i>
                    </div>
                    <div style="flex:1">
                        <div style="font-size:.82rem;font-weight:600;margin-bottom:.15rem">${a.msg}</div>
                        <div style="font-size:.68rem;color:var(--text3)">${a.time}</div>
                    </div>
                </div>
            `).join('')
        }
        </div>
        `;

    openModal('<i class="fa-regular fa-bell"></i> System Notifications', body, '<button class="btn btn-secondary btn-sm" onclick="closeModalBtn()">Mark all as read</button>');
}
window.showNotifications = showNotifications;

export function showInbox() {
    const messages = [
        { from: 'System', msg: 'Weekly performance report is ready for HokiBet', time: '09:00 AM' },
        { from: 'Technical Support', msg: 'Scheduled maintenance for API Gateway on Sunday', time: 'Yesterday' },
        { from: 'Owner', msg: 'Please review the new commission tier for Platinum members', time: '2 days ago' }
    ];

    const body = `
        <div style = "display:flex;flex-direction:column;gap:.5rem" >
            ${messages.map(m => `
                <div style="padding:1rem;background:var(--bg2);border-radius:12px;border-left:3px solid var(--acc)">
                    <div style="display:flex;justify-content:space-between;margin-bottom:.4rem">
                        <span style="font-weight:700;font-size:.85rem;color:var(--acc)">${m.from}</span>
                        <span style="font-size:.68rem;color:var(--text3)">${m.time}</span>
                    </div>
                    <div style="font-size:.82rem;line-height:1.4">${m.msg}</div>
                </div>
            `).join('')
        }
        </div>
        `;

    openModal('<i class="fa-regular fa-envelope"></i> Internal Inbox', body, '<button class="btn btn-primary btn-sm" onclick="go(\'memo-list\');closeModalBtn()">Go to Memo Center</button>');
}
window.showInbox = showInbox;

export function open2FAModal(onSuccess) {
    openModal('<i class="fa-solid fa-shield-halved"></i> Two-Factor Authentication', `
        <div style = "text-align:center;padding:1rem" >
            <div style="font-size:3rem;color:var(--acc);margin-bottom:1rem"><i class="fa-solid fa-mobile-screen-button"></i></div>
            <p style="font-size:.9rem;color:var(--text2);margin-bottom:1.5rem">Security verification required. Please enter the 6-digit code from your authenticator app.</p>
            <div style="display:flex;gap:.5rem;justify-content:center;margin-bottom:1rem">
                ${[1, 2, 3, 4, 5, 6].map(i => `<input type="text" maxlength="1" style="width:40px;height:50px;text-align:center;font-size:1.5rem;font-weight:700;border:1px solid var(--border);border-radius:8px;background:var(--bg2);color:var(--text1)" id="otp_${i}" oninput="if(this.value && this.nextElementSibling) this.nextElementSibling.focus()"/>`).join('')}
            </div>
        </div>
        `, `
        <button class="btn btn-secondary" onclick = "closeModalBtn()" > Cancel</button>
            <button class="btn btn-primary" onclick="window.verify2FA('${onSuccess}')">Verify & Continue</button>
    `);
}

window.verify2FA = (onSuccess) => {
    const code = [1, 2, 3, 4, 5, 6].map(i => document.getElementById(`otp_${i} `).value).join('');
    if (code.length === 6) {
        STATE.currentAdmin.is2FAVerified = true;
        toast('2FA Verified Successfully', 'success');
        closeModalBtn();
        if (onSuccess) window.go(onSuccess);
    } else {
        toast('Please enter the full 6-digit code', 'error');
    }
};

window.secureGo = (target) => {
    const sensitive = ['tools-host', 'admin-management'];
    if (sensitive.includes(target) && !STATE.currentAdmin.is2FAVerified && STATE.currentAdmin.role === 'SuperAdmin') {
        open2FAModal(target);
    } else {
        window.go(target);
    }
};
export function performGlobalSearch(query) {
    if (!query) return [];
    const q = query.toLowerCase();
    const results = [];

    // Search Menus
    const items = [
        { name: 'Dashboard', page: 'dashboard', icon: 'fa-gauge-high' },
        { name: 'SEO Settings', page: 'custom-seo', icon: 'fa-magnifying-glass-chart' },
        { name: 'Agent Freebet', page: 'bonus-agent-freebet', icon: 'fa-ticket' },
        { name: 'Member List', page: 'global-member-list', icon: 'fa-users' },
        { name: 'Whitelabel List', page: 'whitelabel-list', icon: 'fa-tag' },
        { name: 'Seamless Config', page: 'seamless-config', icon: 'fa-gear' },
        { name: 'WinLoss Report', page: 'reports-winloss', icon: 'fa-chart-line' }
    ];
    items.forEach(i => {
        if (i.name.toLowerCase().includes(q)) results.push({ ...i, type: 'Menu' });
    });

    // Search Members
    STATE.members.forEach(m => {
        if (m.username.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)) {
            results.push({ name: m.name, sub: `@${m.username}`, page: 'global-member-list', icon: 'fa-user', type: 'Member' });
        }
    });

    return results.slice(0, 8);
}

export function initOmniSearch() {
    const input = document.getElementById('omniSearchInput');
    if (!input) return;

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey && e.key === 'k') || e.key === '/') {
            if (document.activeElement !== input) {
                e.preventDefault();
                input.focus();
            }
        }
    });

    input.addEventListener('input', () => {
        const query = input.value;
        const results = performGlobalSearch(query);
        showSearchFloatingResults(results);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            input.value = '';
            hideSearchFloatingResults();
            input.blur();
        }
    });
}

function showSearchFloatingResults(results) {
    let float = document.getElementById('searchFloating');
    if (!float) {
        float = document.createElement('div');
        float.id = 'searchFloating';
        float.className = 'search-floating';
        document.querySelector('.search-container').appendChild(float);
    }

    if (!results.length) {
        float.innerHTML = `<div style="padding:1rem;color:var(--text3);font-size:.8rem;text-align:center">No results found for "${document.getElementById('omniSearchInput').value}"</div>`;
    } else {
        float.innerHTML = results.map(r => `
            <div class="search-result-item" onclick="go('${r.page}');document.getElementById('omniSearchInput').value='';hideSearchFloatingResults();">
                <div class="res-icon"><i class="fa-solid ${r.icon}"></i></div>
                <div class="res-info">
                    <div class="res-name">${r.name}</div>
                    <div class="res-type">${r.type}${r.sub ? ' · ' + r.sub : ''}</div>
                </div>
                <div class="res-arrow"><i class="fa-solid fa-chevron-right"></i></div>
            </div>
        `).join('');
    }
    float.style.display = 'block';
}

function hideSearchFloatingResults() {
    const float = document.getElementById('searchFloating');
    if (float) float.style.display = 'none';
}
window.hideSearchFloatingResults = hideSearchFloatingResults;
window.initOmniSearch = initOmniSearch;

window.setQuickDateRange = function (pg, startK, endK, range) {
    const now = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    let start, end = now;
    if (range === 'today') {
        start = now;
    } else if (range === '7days') {
        start = new Date();
        start.setDate(now.getDate() - 7);
    } else if (range === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Update state without individual debounce to prevent double re-rendering
    if (!STATE._filters[pg]) STATE._filters[pg] = {};
    STATE._filters[pg][startK] = formatDate(start);
    STATE._filters[pg][endK] = formatDate(end);

    // Manual trigger go(pg)
    if (typeof window.go === 'function') {
        STATE._page[pg] = 1;
        window.go(pg);
        toast(`Periode diset: ${range === 'today' ? 'Hari Ini' : range === '7days' ? '7 Hari Terakhir' : 'Bulan Ini'}`, 'success');
    }
};

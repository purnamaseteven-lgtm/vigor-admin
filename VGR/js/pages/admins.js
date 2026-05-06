/* ─── ADMIN & ROLE MANAGEMENT PAGE ─── */
import { STATE, stateAdd, stateUpdate, stateDelete, saveState } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsSelect, fsActions, tableWrap, badge, actionBtns, renderPagerHTML, openModal, closeModalBtn, toast } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage } from '../utils/helpers.js';
import { scopedAdmins } from '../utils/scope.js';

// ── Page-permission catalogue: all pages visible to the permission builder ───
const PAGE_CATALOGUE = [
    {
        group: 'Home & Analytics', pages: [
            { key: 'dashboard', label: 'Dashboard' },
            { key: 'statistics', label: 'Statistics' },
            { key: 'provider-analytics', label: 'Provider Analytics' },
            { key: 'device-report', label: 'Device Report' },
        ]
    },
    {
        group: 'Members', pages: [
            { key: 'global-member-list', label: 'Member List' },
            { key: 'tier-history', label: 'Tier / Group History' },
        ]
    },
    {
        group: 'Finance', pages: [
            { key: 'deposit-list', label: 'Deposits' },
            { key: 'withdrawal-list', label: 'Withdrawals' },
        ]
    },
    {
        group: 'Company Management', pages: [
            { key: 'company-list', label: 'Whitelabel & Agent List' },
            { key: 'company-create', label: 'Register Brand' },
            { key: 'whitelabel-list', label: 'Whitelabel List' },
            { key: 'master-wl-list', label: 'Master WL (Legacy)' },
        ]
    },
    {
        group: 'Bets', pages: [
            { key: 'bets-list', label: 'Bet History' },
            { key: 'bets-table', label: 'Betting Table' },
            { key: 'transferred-list', label: 'Transferred List' },
        ]
    },
    {
        group: 'Bonus & Promo', pages: [
            { key: 'bonus-report', label: 'Bonus Report' },
            { key: 'bonus-agent-freebet', label: 'Agent Freebet' },
            { key: 'bonus-agent-freebet-report', label: 'Agent Freebet Report' },
            { key: 'bonus-pragmatic-frb', label: 'Pragmatic FRB' },
            { key: 'promotions', label: 'Promotions' },
            { key: 'promotion-release', label: 'Promotion Release' },
            { key: 'promotion-rolling-release', label: 'Rolling Release' },
        ]
    },
    {
        group: 'Results', pages: [
            { key: 'results-listing', label: 'Results Listing' },
            { key: 'result-scan', label: 'Result Scan' },
            { key: 'results-analyze', label: 'Results Analyze' },
        ]
    },
    {
        group: 'Banks', pages: [
            { key: 'bank-list', label: 'Bank List' },
            { key: 'bank-create', label: 'Add Bank' },
        ]
    },
    {
        group: 'Settings', pages: [
            { key: 'settings-commission', label: 'Commission' },
            { key: 'settings-referral-rate', label: 'Referral Rate' },
            { key: 'settings-pools', label: 'Pools' },
            { key: 'settings-games', label: 'Games' },
            { key: 'settings-agent-games', label: 'Agent Games' },
            { key: 'settings-togel-commission', label: 'Togel Commission' },
            { key: 'settings-limit-credit-out', label: 'Limit Credit Out' },
            { key: 'custom-vip', label: 'VIP Designer' },
            { key: 'settings-rebate-calc', label: 'Rebate Calc' },
        ]
    },
    {
        group: 'Customization', pages: [
            { key: 'site-config', label: 'Site Config' },
            { key: 'custom-template', label: 'Template Builder' },
            { key: 'template-preview', label: 'Template Preview' },
            { key: 'seo-tools', label: 'SEO Tools' },
            { key: 'system-theme', label: 'System Theme' },
            { key: 'global-banner', label: 'Global Banner' },
            { key: 'app-notification', label: 'App Notification' },
        ]
    },
    {
        group: 'Tools', pages: [
            { key: 'tools-coin2pay', label: 'Coin2Pay' },
            { key: 'tools-host', label: 'Host Management' },
            { key: 'tools-sawala', label: 'Sawala' },
            { key: 'tools-unopay', label: 'Unopay' },
            { key: 'nawala-scan', label: 'Nawala Scan' },
        ]
    },
    {
        group: 'CRM', pages: [
            { key: 'crm-dashboard', label: 'CRM Dashboard' },
            { key: 'crm-segments', label: 'Segments' },
            { key: 'crm-missions', label: 'Missions' },
            { key: 'crm-tournaments', label: 'Tournaments' },
            { key: 'crm-automation', label: 'Automation' },
            { key: 'crm-push', label: 'Push Campaign' },
            { key: 'crm-dormancy', label: 'Dormancy' },
            { key: 'crm-loyalty', label: 'Loyalty' },
        ]
    },
    {
        group: 'Reports', pages: [
            { key: 'report-winloss', label: 'Win/Loss' },
            { key: 'report-agent-daily', label: 'Agent Daily' },
            { key: 'report-limit-credit', label: 'Limit Credit' },
            { key: 'report-lost-money', label: 'Lost Money' },
            { key: 'report-togel-lost', label: 'Togel Lost' },
            { key: 'report-top-turnover', label: 'Top Turnover' },
        ]
    },
    {
        group: 'Memo', pages: [
            { key: 'memo-list', label: 'Memo Box' },
            { key: 'auto-memo', label: 'Auto Memo' },
        ]
    },
    {
        group: 'Invoice', pages: [
            { key: 'invoice-monthly', label: 'Monthly Invoice' },
            { key: 'invoice-file-management', label: 'File Management' },
            { key: 'invoice-tournament', label: 'Tournament Invoice' },
        ]
    },
    {
        group: 'Logs', pages: [
            { key: 'logs-admin', label: 'Admin Logs' },
            { key: 'logs-company', label: 'Company Logs' },
            { key: 'logs-whitelabel', label: 'Whitelabel Logs' },
            { key: 'logs-member', label: 'Member Logs' },
            { key: 'logs-master-wl', label: 'Master WL Logs' },
        ]
    },
    {
        group: 'Administrators', pages: [
            { key: 'admin-management', label: 'Admin Management' },
            { key: 'dev-menu-config', label: 'Permission Matrix' },
        ]
    },
];

// ── Pre-built team permission presets ────────────────────────────────────────
// Each team gets a curated set of page keys with appropriate CRUD defaults
const TEAM_TEMPLATES = {
    'Team CRM': {
        icon: 'fa-users-rays', color: '#8b5cf6',
        desc: 'CRM, segmentasi, misi, promosi, loyalitas member',
        pages: {
            'dashboard': { read: true, add: false, edit: false, delete: false },
            'statistics': { read: true, add: false, edit: false, delete: false },
            'crm-dashboard': { read: true, add: false, edit: false, delete: false },
            'crm-segments': { read: true, add: true, edit: true, delete: false },
            'crm-missions': { read: true, add: true, edit: true, delete: false },
            'crm-tournaments': { read: true, add: true, edit: true, delete: false },
            'crm-automation': { read: true, add: true, edit: true, delete: false },
            'crm-push': { read: true, add: true, edit: true, delete: false },
            'crm-dormancy': { read: true, add: false, edit: false, delete: false },
            'crm-loyalty': { read: true, add: true, edit: true, delete: false },
            'promotions': { read: true, add: true, edit: true, delete: false },
            'promotion-release': { read: true, add: true, edit: false, delete: false },
            'bonus-report': { read: true, add: false, edit: false, delete: false },
            'global-member-list': { read: true, add: false, edit: false, delete: false },
            'memo-list': { read: true, add: true, edit: false, delete: false },
        }
    },
    'Team CS': {
        icon: 'fa-headset', color: '#0ea5e9',
        desc: 'Customer service, deposit/withdraw, live support',
        pages: {
            'dashboard': { read: true, add: false, edit: false, delete: false },
            'global-member-list': { read: true, add: true, edit: true, delete: false },
            'tier-history': { read: true, add: false, edit: false, delete: false },
            'deposit-list': { read: true, add: true, edit: true, delete: false },
            'withdrawal-list': { read: true, add: true, edit: true, delete: false },
            'bonus-report': { read: true, add: true, edit: false, delete: false },
            'bonus-agent-freebet': { read: true, add: true, edit: false, delete: false },
            'memo-list': { read: true, add: true, edit: true, delete: false },
            'auto-memo': { read: true, add: false, edit: false, delete: false },
            'logs-member': { read: true, add: false, edit: false, delete: false },
        }
    },
    'Data Analyst': {
        icon: 'fa-chart-line', color: '#10b981',
        desc: 'Laporan, statistik, analitik — read only',
        pages: {
            'dashboard': { read: true, add: false, edit: false, delete: false },
            'statistics': { read: true, add: false, edit: false, delete: false },
            'provider-analytics': { read: true, add: false, edit: false, delete: false },
            'device-report': { read: true, add: false, edit: false, delete: false },
            'report-winloss': { read: true, add: false, edit: false, delete: false },
            'report-agent-daily': { read: true, add: false, edit: false, delete: false },
            'report-limit-credit': { read: true, add: false, edit: false, delete: false },
            'report-lost-money': { read: true, add: false, edit: false, delete: false },
            'report-togel-lost': { read: true, add: false, edit: false, delete: false },
            'report-top-turnover': { read: true, add: false, edit: false, delete: false },
            'invoice-monthly': { read: true, add: false, edit: false, delete: false },
            'bets-list': { read: true, add: false, edit: false, delete: false },
            'global-member-list': { read: true, add: false, edit: false, delete: false },
        }
    },
    'Team Finance': {
        icon: 'fa-wallet', color: '#f59e0b',
        desc: 'Deposit, withdraw, bank, laporan keuangan',
        pages: {
            'dashboard': { read: true, add: false, edit: false, delete: false },
            'deposit-list': { read: true, add: true, edit: true, delete: false },
            'withdrawal-list': { read: true, add: true, edit: true, delete: false },
            'bank-list': { read: true, add: false, edit: false, delete: false },
            'report-winloss': { read: true, add: false, edit: false, delete: false },
            'report-agent-daily': { read: true, add: false, edit: false, delete: false },
            'invoice-monthly': { read: true, add: false, edit: false, delete: false },
            'invoice-file-management': { read: true, add: true, edit: false, delete: false },
            'logs-member': { read: true, add: false, edit: false, delete: false },
            'statistics': { read: true, add: false, edit: false, delete: false },
        }
    },
    'Team Content': {
        icon: 'fa-paintbrush', color: '#ec4899',
        desc: 'Template, banner, promosi, notifikasi frontend',
        pages: {
            'dashboard': { read: true, add: false, edit: false, delete: false },
            'custom-template': { read: true, add: true, edit: true, delete: false },
            'template-preview': { read: true, add: false, edit: false, delete: false },
            'site-config': { read: true, add: false, edit: true, delete: false },
            'global-banner': { read: true, add: true, edit: true, delete: true },
            'app-notification': { read: true, add: true, edit: true, delete: false },
            'seo-tools': { read: true, add: false, edit: true, delete: false },
            'system-theme': { read: true, add: false, edit: true, delete: false },
            'promotions': { read: true, add: true, edit: true, delete: false },
        }
    },
    'Supervisor': {
        icon: 'fa-user-tie', color: '#64748b',
        desc: 'Monitor semua area — hanya read, tanpa edit/delete',
        pages: {
            'dashboard': { read: true, add: false, edit: false, delete: false },
            'statistics': { read: true, add: false, edit: false, delete: false },
            'global-member-list': { read: true, add: false, edit: false, delete: false },
            'deposit-list': { read: true, add: false, edit: false, delete: false },
            'withdrawal-list': { read: true, add: false, edit: false, delete: false },
            'bets-list': { read: true, add: false, edit: false, delete: false },
            'bonus-report': { read: true, add: false, edit: false, delete: false },
            'report-winloss': { read: true, add: false, edit: false, delete: false },
            'report-agent-daily': { read: true, add: false, edit: false, delete: false },
            'logs-member': { read: true, add: false, edit: false, delete: false },
            'logs-company': { read: true, add: false, edit: false, delete: false },
            'crm-dashboard': { read: true, add: false, edit: false, delete: false },
            'memo-list': { read: true, add: false, edit: false, delete: false },
        }
    },
};

// ── Role options per creator role ────────────────────────────────────────────
function getAllowedRoles() {
    const r = STATE.currentAdmin.role;
    if (r === 'SuperAdmin') return ['SuperAdmin', 'Whitelabel', 'Agent', 'Custom'];
    if (r === 'Whitelabel') return ['Agent', 'Custom'];
    return ['Custom'];
}

// ── Role badge colour ────────────────────────────────────────────────────────
function roleBadgeColor(role) {
    return role === 'SuperAdmin' ? 'purple' : role === 'Whitelabel' ? 'blue' :
        role === 'Agent' ? 'success' : 'secondary';
}

/* ─── PAGE ─────────────────────────────────────────────────────────────────── */
pages['admin-management'] = () => {
    const PG = 'admin-management';
    const curAdmin = STATE.currentAdmin;
    const rawAdmins = scopedAdmins();

    const filtered = filterData(rawAdmins, PG);
    const total = filtered.length;
    const pp = getPerPage(PG);
    const cp = getCurPage(PG);
    const rows = paginate(filtered, cp, pp);

    const allowedRoles = getAllowedRoles();
    const canAdd = allowedRoles.length > 0;

    return `
    ${pageHeader('Admin & Role Management', '<span>Settings</span><span class="sep">›</span><span>Administrators</span>', `
        <div style="display:flex;gap:.5rem;align-items:center">
            <span class="badge" style="background:var(--acc-glow);color:var(--acc);border:1px solid var(--acc)44">Login as: ${curAdmin.role}</span>
            ${canAdd ? `<button class="btn btn-primary btn-sm" onclick="window.openAdminForm()"><i class="fa-solid fa-user-plus"></i> Add Admin</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="go('dev-menu-config')"><i class="fa-solid fa-shield-halved"></i> Role Permissions</button>
        </div>
    `)}

    <div class="alert alert-info" style="margin-bottom:1.5rem">
        <i class="fa-solid fa-shield-halved"></i>
        <div><strong>Hierarchical Scope Active:</strong> You are managing administrators within the <u>${curAdmin.company}</u> organization and its downline.</div>
    </div>

    ${filterCard(`
        ${fsInput(PG, 'username', 'Username', 'Search user...')}
        ${fsSelect(PG, 'role', 'Level Role', ['All', 'SuperAdmin', 'Whitelabel', 'Agent', 'Custom'])}
        ${fsActions(PG)}
    `)}

    ${tableWrap(`
        <table>
            <thead>
                <tr>
                    <th>Admin Details</th>
                    <th>Role Level</th>
                    <th>Company / Affiliation</th>
                    <th>Custom Permissions</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${rows.map(a => {
        const cpCount = a.customPermissions ? Object.keys(a.customPermissions).length : 0;
        const creator = a.parentId ? STATE.admins.find(x => x.id === a.parentId) : null;
        return `
                    <tr>
                        <td>
                            <div style="font-weight:700;color:var(--acc)">${a.username}</div>
                            <div style="font-size:.7rem;color:var(--text3)">${a.name}</div>
                            ${creator ? `<div style="font-size:.65rem;color:var(--text3);margin-top:.1rem"><i class="fa-solid fa-sitemap" style="opacity:.4"></i> by ${creator.username}</div>` : ''}
                        </td>
                        <td>
                            ${badge(a.customRole || a.role, roleBadgeColor(a.role))}
                            ${a.customRole ? `<div style="font-size:.62rem;color:var(--text3);margin-top:.15rem"><i class="fa-solid fa-tag" style="opacity:.4"></i> Custom</div>` : ''}
                        </td>
                        <td>
                            <div style="font-size:.85rem;font-weight:600">${a.company || '—'}</div>
                            ${a.shop ? `<div style="font-size:.7rem;color:var(--text3)">Shop: ${a.shop}</div>` : ''}
                        </td>
                        <td>
                            ${cpCount > 0
                ? `<span style="color:var(--green);font-size:.75rem;font-weight:600"><i class="fa-solid fa-key"></i> ${cpCount} pages</span>`
                : `<span style="color:var(--text3);font-size:.72rem">Role Default</span>`}
                        </td>
                        <td>${badge(a.status || 'Active', (a.status || 'Active') === 'Active' ? 'success' : 'danger')}</td>
                        <td style="font-size:.72rem;color:var(--text3)">${a.lastLogin || '-'}</td>
                        <td>
                            ${actionBtns(
                    `openAdminForm('${a.id}')`,
                    `confirmAction('Delete Admin','Are you sure you want to remove ${a.username}? This will revoke all dashboard access.',()=>{window.deleteAdmin('${a.id}')},'Delete Admin','danger')`,
                    `<button class="btn btn-sm btn-icon" style="background:var(--acc);color:#fff" title="Manage Permissions" onclick="window.openPermModal('${a.id}')"><i class="fa-solid fa-key"></i></button>`
                )}
                        </td>
                    </tr>`;
    }).join('')}
                ${rows.length === 0 ? '<tr><td colspan="7" style="text-align:center;padding:3rem;color:var(--text3)">No administrators found in your scope.</td></tr>' : ''}
            </tbody>
        </table>
    `)}
    ${renderPagerHTML(PG, total, pp, cp)}
    `;
};

/* ─── ADD / EDIT ADMIN FORM ─────────────────────────────────────────────────── */
window.openAdminForm = (id = null) => {
    const admin = id ? STATE.admins.find(a => a.id === id) : null;
    const curRole = STATE.currentAdmin.role;
    const roleOptions = getAllowedRoles();

    const companiesList = (STATE.companies || []).map(c => typeof c === 'string' ? c : c.username);

    const isCustomRole = admin?.role === 'Custom';
    openModal(admin ? 'Edit Administrator' : 'Add New Administrator', `
        <div class="form-grid" style="gap:1rem">
            <div class="form-field">
                <label>Username</label>
                <input id="adm_username" value="${admin?.username || ''}" ${admin ? 'readonly style="opacity:.6"' : ''} placeholder="e.g., cs_team_01"/>
            </div>
            <div class="form-field">
                <label>Full Name</label>
                <input id="adm_name" value="${admin?.name || ''}" placeholder="Nama lengkap / display name"/>
            </div>
            <div class="form-field">
                <label>Role / Level</label>
                <select id="adm_role" onchange="window._toggleCustomRoleField(this.value)">
                    ${roleOptions.map(r => `<option value="${r}" ${admin?.role === r ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
            </div>
            <div class="form-field" id="wrap_custom_role" style="display:${isCustomRole ? 'block' : 'none'}">
                <label>Nama Role Kustom <span style="color:var(--acc)">*</span></label>
                <input id="adm_custom_role" value="${admin?.customRole || ''}" placeholder="e.g., Team CRM, Team CS, Data Analyst"/>
                <div style="margin-top:.3rem;display:flex;flex-wrap:wrap;gap:.3rem">
                    ${Object.keys(TEAM_TEMPLATES).map(t => `
                        <span style="font-size:.68rem;padding:.15rem .5rem;border-radius:20px;background:var(--bg2);border:1px solid var(--border);cursor:pointer;color:var(--text2)"
                              onclick="document.getElementById('adm_custom_role').value='${t}'">${t}</span>
                    `).join('')}
                </div>
            </div>
            <div class="form-field">
                <label>Company Affiliation</label>
                <select id="adm_company">
                    <option value="${STATE.currentAdmin.company}" selected>${STATE.currentAdmin.company}</option>
                    ${companiesList
            .filter(c => c !== STATE.currentAdmin.company)
            .map(c => `<option value="${c}" ${admin?.company === c ? 'selected' : ''}>${c}</option>`)
            .join('')}
                </select>
            </div>
            <div class="form-field">
                <label>Password ${admin ? '(Leave blank to keep)' : ''}</label>
                <input type="password" id="adm_pass" placeholder="${admin ? '••••••••' : 'Set password'}"/>
            </div>
            <div class="form-field">
                <label>Status</label>
                <select id="adm_status">
                    <option value="Active" ${(admin?.status || 'Active') === 'Active' ? 'selected' : ''}>Active</option>
                    <option value="Suspended" ${admin?.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
                </select>
            </div>
        </div>
        <div style="margin-top:.75rem;padding:.65rem .9rem;background:var(--acc)0d;border-radius:8px;border:1px solid var(--acc)22;font-size:.75rem;color:var(--text3)">
            <i class="fa-solid fa-lightbulb" style="color:var(--acc);margin-right:.4rem"></i>
            Pilih role <strong>Custom</strong> untuk membuat tim spesifik (CRM, CS, Finance, dll). Setelah disimpan, klik <i class="fa-solid fa-key" style="color:var(--acc)"></i> untuk mengatur akses halaman.
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        ${!admin ? `<button class="btn btn-secondary" onclick="window._saveAdminAndOpenPerms=true;window.saveAdmin('')"><i class="fa-solid fa-key"></i> Save & Set Permissions</button>` : ''}
        <button class="btn btn-primary" onclick="window.saveAdmin('${id || ''}')">Save Administrator</button>
    `);
};

window._toggleCustomRoleField = (roleVal) => {
    const wrap = document.getElementById('wrap_custom_role');
    if (wrap) wrap.style.display = roleVal === 'Custom' ? 'block' : 'none';
};

window.saveAdmin = async (id) => {
    const username = document.getElementById('adm_username')?.value?.trim();
    const name = document.getElementById('adm_name')?.value?.trim();
    const role = document.getElementById('adm_role')?.value;
    const customRole = document.getElementById('adm_custom_role')?.value?.trim() || null;
    const company = document.getElementById('adm_company')?.value || STATE.currentAdmin.company;
    const status = document.getElementById('adm_status')?.value || 'Active';
    const password = document.getElementById('adm_pass')?.value;

    if (!username) { toast('Username is required', 'error'); return; }
    if (role === 'Custom' && !customRole) { toast('Nama role kustom wajib diisi', 'error'); return; }

    const data = { username, name, role, customRole: role === 'Custom' ? customRole : null, company, status, parentId: STATE.currentAdmin.id };

    if (id) {
        if (window.db?.dbUpdateAdmin) {
            const { error } = await window.db.dbUpdateAdmin(id, data);
            if (error) { toast('Update failed: ' + error.message, 'error'); return; }
            if (window.db?.dbWriteLog) window.db.dbWriteLog('Update Admin', id, `Updated admin ${username}`);
        } else {
            stateUpdate('admins', id, data);
        }
        toast('Administrator updated ✓', 'success');
        closeModalBtn();
        go('admin-management');
    } else {
        data.id = 'adm-' + Date.now();
        data.lastLogin = 'Never';
        data.customPermissions = null;
        if (window.db?.dbAddAdmin) {
            const { error } = await window.db.dbAddAdmin(data, password);
            if (error) { toast('Failed: ' + error.message, 'error'); return; }
            if (window.db?.dbWriteLog) window.db.dbWriteLog('Add Admin', data.id, `Created admin ${username} [${role}]`);
        } else {
            stateAdd('admins', data);
        }
        toast('New administrator created ✓', 'success');
        closeModalBtn();
        if (window._saveAdminAndOpenPerms) {
            window._saveAdminAndOpenPerms = false;
            setTimeout(() => window.openPermModal(data.id), 200);
        } else {
            go('admin-management');
        }
    }
};

window.deleteAdmin = async (id) => {
    const admin = STATE.admins?.find(a => a.id === id);
    if (admin?.id === 'adm-1') { toast('Cannot delete root SuperAdmin', 'error'); return; }
    if (window.db?.dbDeleteAdmin) {
        const { error } = await window.db.dbDeleteAdmin(id);
        if (error) { toast('Delete failed: ' + error.message, 'error'); return; }
        if (window.db?.dbWriteLog) window.db.dbWriteLog('Delete Admin', id, `Deleted admin ${admin?.username}`);
    } else {
        stateDelete('admins', id);
    }
    toast('Administrator access revoked', 'warning');
    go('admin-management');
};

// Alias
pages['admins-list'] = pages['admin-management'];

/* ─── PERMISSION MODAL ────────────────────────────────────────────────────────
 *  Granular per-page CRUD permission builder.
 *  Opens a scrollable table with group headers and R/A/E/D checkboxes.
 * ─────────────────────────────────────────────────────────────────────────── */
window.openPermModal = (adminId) => {
    const admin = STATE.admins.find(a => a.id === adminId);
    if (!admin) return;

    const cp = admin.customPermissions || {};

    // Pre-fill template selector values
    const templateRoles = Object.keys(STATE.permissionMatrix || {}).filter(r => r !== 'SuperAdmin');
    const cpCount = admin.customPermissions ? Object.keys(admin.customPermissions).length : 0;

    // Build the permission table HTML
    let tableHTML = `
    <!-- Team template presets -->
    <div style="margin-bottom:1rem">
        <div style="font-size:.72rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5rem">
            <i class="fa-solid fa-wand-magic-sparkles" style="color:var(--acc);margin-right:.3rem"></i>Template Tim Siap Pakai
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem">
            ${Object.entries(TEAM_TEMPLATES).map(([name, tpl]) => `
            <button onclick="window._fillTeamTemplate('${name}','${adminId}')"
                style="display:flex;align-items:center;gap:.5rem;padding:.5rem .75rem;background:var(--bg2);border:1px solid var(--border);border-radius:8px;cursor:pointer;text-align:left;transition:border-color .15s"
                onmouseover="this.style.borderColor='${tpl.color}'" onmouseout="this.style.borderColor='var(--border)'">
                <i class="fa-solid ${tpl.icon}" style="color:${tpl.color};font-size:.9rem;flex-shrink:0"></i>
                <div>
                    <div style="font-size:.75rem;font-weight:700;color:var(--text1)">${name}</div>
                    <div style="font-size:.62rem;color:var(--text3);line-height:1.3">${tpl.desc}</div>
                </div>
            </button>`).join('')}
        </div>
    </div>
    <!-- Role-based templates + quick actions -->
    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;flex-wrap:wrap;padding:.5rem .75rem;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
        <span style="font-size:.72rem;color:var(--text3);font-weight:600">Dari Role:</span>
        ${templateRoles.map(r => `
            <button class="btn btn-xs btn-secondary" onclick="window._fillPermFromRole('${r}','${adminId}')">
                <i class="fa-solid fa-copy"></i> ${r}
            </button>`).join('')}
        <div style="margin-left:auto;display:flex;gap:.4rem">
            <button class="btn btn-xs btn-danger" onclick="window._clearAllPerms('${adminId}')">
                <i class="fa-solid fa-trash"></i> Clear
            </button>
            <button class="btn btn-xs btn-success" onclick="window._grantAllPerms('${adminId}')">
                <i class="fa-solid fa-check-double"></i> All
            </button>
        </div>
    </div>
    <div style="font-size:.72rem;color:var(--text3);margin-bottom:.5rem">
        <i class="fa-solid fa-key" style="color:var(--acc);margin-right:.3rem"></i>
        ${cpCount > 0 ? `<strong style="color:var(--green)">${cpCount} halaman</strong> sudah dikonfigurasi` : 'Belum ada custom permission — centang halaman yang diinginkan'}
    </div>
    <div style="max-height:480px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">
    <table style="width:100%;border-collapse:collapse">
    <thead style="position:sticky;top:0;background:var(--bg2);z-index:5">
        <tr style="border-bottom:2px solid var(--border)">
            <th style="padding:.6rem 1rem;text-align:left;font-size:.78rem;color:var(--acc)">Page / Module</th>
            <th style="padding:.6rem .5rem;text-align:center;font-size:.72rem;width:52px"><i class="fa-solid fa-eye" title="Read"></i><div style="font-size:.6rem;opacity:.6">Read</div></th>
            <th style="padding:.6rem .5rem;text-align:center;font-size:.72rem;width:52px"><i class="fa-solid fa-plus" title="Add"></i><div style="font-size:.6rem;opacity:.6">Add</div></th>
            <th style="padding:.6rem .5rem;text-align:center;font-size:.72rem;width:52px"><i class="fa-solid fa-pencil" title="Edit"></i><div style="font-size:.6rem;opacity:.6">Edit</div></th>
            <th style="padding:.6rem .5rem;text-align:center;font-size:.72rem;width:52px"><i class="fa-solid fa-trash" title="Delete"></i><div style="font-size:.6rem;opacity:.6">Delete</div></th>
        </tr>
    </thead>
    <tbody id="permTableBody_${adminId}">`;

    PAGE_CATALOGUE.forEach(group => {
        tableHTML += `<tr style="background:var(--bg2)">
            <td colspan="5" style="padding:.4rem 1rem;font-size:.7rem;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.06em">
                <i class="fa-solid fa-folder-open" style="margin-right:.4rem;opacity:.4"></i>${group.group}
            </td>
        </tr>`;
        group.pages.forEach(pg => {
            const perm = cp[pg.key] || {};
            tableHTML += `<tr style="border-bottom:1px dashed var(--border)33" id="permrow_${adminId}_${pg.key}">
                <td style="padding:.35rem 1rem .35rem 2rem;font-size:.8rem;color:var(--text2)">
                    <i class="fa-solid fa-angle-right" style="margin-right:.35rem;opacity:.25;font-size:.65rem"></i>${pg.label}
                    <code style="font-size:.6rem;color:var(--text3);margin-left:.3rem">${pg.key}</code>
                </td>
                ${['read', 'add', 'edit', 'delete'].map(crud => `
                <td style="text-align:center;padding:.35rem .2rem">
                    <input type="checkbox" class="perm-cb" data-admin="${adminId}" data-page="${pg.key}" data-crud="${crud}"
                        style="width:15px;height:15px;accent-color:var(--acc);cursor:pointer"
                        ${perm[crud] ? 'checked' : ''}
                        onchange="window._onPermCbChange('${adminId}','${pg.key}','${crud}',this.checked)">
                </td>`).join('')}
            </tr>`;
        });
    });

    tableHTML += `</tbody></table></div>`;

    openModal(
        `<i class="fa-solid fa-key" style="color:var(--acc)"></i> Permissions: ${admin.username} <span style="font-size:.75rem;opacity:.6">[${admin.customRole || admin.role}]</span>`,
        tableHTML,
        `<button class="btn btn-secondary" onclick="closeModalBtn();go('admin-management')">Close</button>
         <button class="btn btn-primary" onclick="window.saveCustomPerms('${adminId}')"><i class="fa-solid fa-floppy-disk"></i> Save Permissions</button>`
    );
};

// ── Live checkbox → STATE update ─────────────────────────────────────────────
window._onPermCbChange = (adminId, pageKey, crud, checked) => {
    const admin = STATE.admins.find(a => a.id === adminId);
    if (!admin) return;
    if (!admin.customPermissions) admin.customPermissions = {};
    if (!admin.customPermissions[pageKey]) admin.customPermissions[pageKey] = { read: false, add: false, edit: false, delete: false };

    admin.customPermissions[pageKey][crud] = checked;

    // Auto-enable read when any other permission is checked
    if (crud !== 'read' && checked) {
        admin.customPermissions[pageKey].read = true;
        const readCb = document.querySelector(`[data-admin="${adminId}"][data-page="${pageKey}"][data-crud="read"]`);
        if (readCb) readCb.checked = true;
    }
    // Auto-remove page entry if all false
    const p = admin.customPermissions[pageKey];
    if (!p.read && !p.add && !p.edit && !p.delete) {
        delete admin.customPermissions[pageKey];
    }
};

// ── Fill from role template ───────────────────────────────────────────────────
window._fillPermFromRole = (role, adminId) => {
    const admin = STATE.admins.find(a => a.id === adminId);
    if (!admin) return;
    const matrix = STATE.permissionMatrix[role] || {};

    // MODULE → pages mapping (mirrors auth.js MODULE_MAP)
    const MODULE_PAGES = {
        'home': ['dashboard', 'statistics', 'provider-analytics', 'device-report'],
        'master': ['master-whitelist', 'master-blacklist', 'master-wl-list'],
        'administrators': ['system-admins', 'role-permissions', 'admin-management', 'admins-list'],
        'companyManagement': ['company-list', 'company-create'],
        'whitelabel': ['whitelabel-list', 'master-wl-list'],
        'members': ['global-member-list', 'tier-history'],
        'bankManagement': ['bank-list', 'bank-create'],
        'finance': ['deposit-list', 'withdrawal-list'],
        'bets': ['bets-list', 'bets-table', 'transferred-list'],
        'bonus': ['bonus-report', 'bonus-agent-freebet', 'bonus-agent-freebet-report', 'bonus-pragmatic-frb', 'promotions', 'promotion-release', 'promotion-rolling-release'],
        'results': ['results-listing', 'result-scan', 'results-analyze'],
        'integrations': ['provider-setup', 'pgsoft-api-logs', 'developer-docs'],
        'customization': ['site-config', 'custom-template', 'template-preview', 'seo-tools', 'system-theme', 'global-banner', 'app-notification'],
        'settings': ['settings-commission', 'settings-referral-rate', 'settings-pools', 'settings-games', 'settings-agent-games', 'settings-togel-commission', 'settings-limit-credit-out', 'custom-vip', 'settings-rebate-calc'],
        'tools': ['tools-coin2pay', 'tools-host', 'tools-sawala', 'tools-unopay', 'nawala-scan'],
        'crm': ['crm-dashboard', 'crm-segments', 'crm-missions', 'crm-tournaments', 'crm-automation', 'crm-push', 'crm-dormancy', 'crm-loyalty'],
        'memo': ['memo-list', 'auto-memo'],
        'reports': ['report-winloss', 'report-agent-daily', 'report-limit-credit', 'report-lost-money', 'report-togel-lost', 'report-top-turnover'],
        'invoice': ['invoice-monthly', 'invoice-file-management', 'invoice-tournament'],
        'logs': ['logs-admin', 'logs-company', 'logs-whitelabel', 'logs-member', 'logs-master-wl'],
    };

    const cp = {};
    for (const [modKey, pageKeys] of Object.entries(MODULE_PAGES)) {
        const mod = matrix[modKey] || {};
        const hasAny = Object.values(mod).some(v => v === true);
        pageKeys.forEach(pk => {
            if (hasAny) {
                cp[pk] = { read: true, add: false, edit: false, delete: false };
            }
        });
    }

    admin.customPermissions = cp;

    // Refresh all checkboxes
    document.querySelectorAll(`[data-admin="${adminId}"].perm-cb`).forEach(cb => {
        const page = cb.getAttribute('data-page');
        const crud = cb.getAttribute('data-crud');
        cb.checked = !!(cp[page] && cp[page][crud]);
    });

    toast(`Permissions pre-filled from ${role} template`, 'info');
};

// ── Fill from team template ──────────────────────────────────────────────────
window._fillTeamTemplate = (templateName, adminId) => {
    const admin = STATE.admins.find(a => a.id === adminId);
    const tpl = TEAM_TEMPLATES[templateName];
    if (!admin || !tpl) return;

    admin.customPermissions = JSON.parse(JSON.stringify(tpl.pages));

    // Refresh all checkboxes in the modal
    document.querySelectorAll(`[data-admin="${adminId}"].perm-cb`).forEach(cb => {
        const page = cb.getAttribute('data-page');
        const crud = cb.getAttribute('data-crud');
        const perm = admin.customPermissions[page];
        cb.checked = !!(perm && perm[crud]);
    });

    toast(`Template "${templateName}" diterapkan — ${Object.keys(tpl.pages).length} halaman`, 'success');
};

// ── Grant / Clear all ────────────────────────────────────────────────────────
window._grantAllPerms = (adminId) => {
    const admin = STATE.admins.find(a => a.id === adminId);
    if (!admin) return;
    const cp = {};
    PAGE_CATALOGUE.forEach(g => g.pages.forEach(pg => {
        cp[pg.key] = { read: true, add: true, edit: true, delete: true };
    }));
    admin.customPermissions = cp;
    document.querySelectorAll(`[data-admin="${adminId}"].perm-cb`).forEach(cb => cb.checked = true);
    toast('All permissions granted', 'success');
};

window._clearAllPerms = (adminId) => {
    const admin = STATE.admins.find(a => a.id === adminId);
    if (!admin) return;
    admin.customPermissions = null;
    document.querySelectorAll(`[data-admin="${adminId}"].perm-cb`).forEach(cb => cb.checked = false);
    toast('All permissions cleared — admin will use role defaults', 'warning');
};

// ── Save permissions ─────────────────────────────────────────────────────────
window.saveCustomPerms = async (adminId) => {
    const admin = STATE.admins.find(a => a.id === adminId);
    if (!admin) return;
    if (window.db?.dbUpdateAdmin) {
        const { error } = await window.db.dbUpdateAdmin(adminId, { customPermissions: admin.customPermissions });
        if (error) { toast('Save failed: ' + error.message, 'error'); return; }
        if (window.db?.dbWriteLog) window.db.dbWriteLog('Update Admin Permissions', adminId, `Saved permissions for ${admin.username}`);
    } else {
        saveState();
    }
    toast(`Permissions for [${admin.username}] saved ✓`, 'success');

    // If modifying current logged-in admin, re-apply RBAC immediately
    if (adminId === STATE.currentAdmin.id) {
        STATE.currentAdmin.customPermissions = admin.customPermissions;
        if (window.applyRBAC) window.applyRBAC();
    }
    closeModalBtn();
    go('admin-management');
};

/* ─── PERMISSION MATRIX EDITOR (built-in roles) ─────────────────────────────── */
pages['dev-menu-config'] = () => {
    const defaultTree = {
        home: { dashboard: true, statistics: true, providerAnalytics: true, deviceReport: true },
        master: { whitelist: true, blacklist: true, masterWhitelist: true },
        administrators: { systemAdmins: true, rolePermissions: true },
        companyManagement: { whitelabelList: true, masterWlList: true, regisNewCompany: true, myDownlines: true },
        members: { memberList: true, addMember: true, tierHistory: true },
        bankManagement: { bankList: true, createNewBank: true },
        finance: { deposit: true, withdrawal: true, adjustment: true, adjustmentLogs: true },
        bets: { betsListing: true, bettingTable: true, transferredList: true },
        bonus: { bonusReport: true, agentFreebet: true, agentFreebetReport: true, pragmaticFrb: true, promotions: true, promotionRelease: true, promotionRollingRelease: true },
        results: { resultsListing: true, resultScan: true, resultsAnalyze: true },
        integrations: { providerSetup: true, apiLogs: true, developerDocs: true },
        customization: { templateBuilder: true, templatePreview: true, promotions: true, systemTheme: true, globalBanner: true, appNotification: true, siteConfig: true, seoTools: true },
        settings: { commission: true, referralRate: true, poolsList: true, games: true, agentGameSettings: true, togelCommission: true, limitCreditOut: true, vipDesigner: true, rebateCalc: true, financeLimits: true },
        tools: { coin2pay: true, hostManagement: true, sawala: true, unopay: true, nawalaScan: true },
        crm: { dashboard: true, segments: true, missions: true, tournaments: true, automation: true, push: true, dormancy: true, loyalty: true },
        memo: { memoBox: true, autoMemo: true },
        reports: { winloss: true, agentDaily: true, limitCredit: true, lostMoney: true, togelLost: true, topTurnover: true },
        invoice: { monthly: true, fileManagement: true, tournamentWinners: true },
        logs: { adminLogs: true, companyLogs: true, whitelabelLogs: true, memberLogs: true, masterWlLogs: true }
    };

    const mx = STATE.permissionMatrix;
    const roles = ['Whitelabel', 'Agent'];
    const roleLabels = { Whitelabel: 'Whitelabel', Agent: 'Agent' };

    let tableHTML = `<div style="max-height:600px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">`;
    tableHTML += `<table style="width:100%;border-collapse:collapse;text-align:left">`;
    tableHTML += `<thead style="position:sticky;top:0;background:var(--bg2);z-index:10">
        <tr style="border-bottom:1px solid var(--border)">
            <th style="padding:1rem;color:var(--acc);font-weight:800;font-size:.85rem">Module / Feature</th>`;
    roles.forEach(r => tableHTML += `<th style="padding:1rem;font-size:.82rem;font-weight:700;text-align:center">${roleLabels[r] || r}</th>`);
    tableHTML += `</tr></thead><tbody>`;

    Object.keys(defaultTree).forEach(mod => {
        tableHTML += `<tr style="border-bottom:1px solid var(--border);background:var(--bg2)">`;
        tableHTML += `<td colspan="${roles.length + 1}" style="padding:.6rem 1rem;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;font-size:.72rem"><i class="fa-solid fa-folder-open" style="margin-right:.4rem;opacity:.5"></i>${mod}</td>`;
        tableHTML += `</tr>`;
        Object.keys(defaultTree[mod]).forEach(sub => {
            tableHTML += `<tr style="border-bottom:1px dashed var(--border)44">`;
            tableHTML += `<td style="padding:.45rem 1rem .45rem 2.2rem;font-size:.8rem;color:var(--text2)"><i class="fa-solid fa-angle-right" style="margin-right:.4rem;opacity:.3"></i>${sub}</td>`;
            roles.forEach(r => {
                if (!mx[r]) mx[r] = JSON.parse(JSON.stringify(defaultTree));
                if (!mx[r][mod]) mx[r][mod] = {};
                const isChecked = mx[r][mod][sub] ? 'checked' : '';
                tableHTML += `<td style="padding:.45rem 1rem;text-align:center">
                    <input type="checkbox" style="width:15px;height:15px;accent-color:var(--acc);cursor:pointer"
                        onchange="window.updateRoleMatrix('${r}','${mod}','${sub}',this.checked)" ${isChecked}>
                </td>`;
            });
            tableHTML += `</tr>`;
        });
    });
    tableHTML += `</tbody></table></div>`;

    return `
    ${pageHeader('Permission Matrix', '<span>Administrators</span><span class="sep">›</span><span>Permissions</span>', `
        <div style="display:flex;gap:.5rem">
            <button class="btn btn-secondary" onclick="go('admin-management')"><i class="fa-solid fa-arrow-left"></i> Back</button>
            <button class="btn btn-primary" id="btnSaveMatrix" onclick="window.savePermissionMatrix()"><i class="fa-solid fa-floppy-disk"></i> Save to Database</button>
        </div>
    `)}

    <div class="alert alert-info" style="margin-bottom:1.25rem">
        <i class="fa-solid fa-info-circle"></i>
        <div>These are the <strong>default role permissions</strong>. Individual admins can also have custom per-page permissions (set via the <strong>🔑 key icon</strong> on Admin Management).</div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 300px;gap:1.5rem;align-items:start">
        <div class="card">
            <div class="card-header"><span class="card-title"><i class="fa-solid fa-shield-halved" style="color:var(--acc)"></i> Role Access Control</span></div>
            <div class="card-body" style="padding:.75rem">
                ${tableHTML}
            </div>
        </div>
        <div class="card" style="position:sticky;top:1rem">
            <div class="card-header"><span class="card-title">Quick Actions</span></div>
            <div class="card-body" style="display:flex;flex-direction:column;gap:.75rem">
                ${roles.map(r => `
                <div style="padding:.75rem;background:var(--bg2);border-radius:8px;border:1px solid var(--border)">
                    <div style="font-weight:700;margin-bottom:.5rem">${roleLabels[r]}</div>
                    <div style="display:flex;gap:.4rem">
                        <button class="btn btn-xs btn-success" style="flex:1" onclick="window.setAllRolePerms('${r}',true)"><i class="fa-solid fa-check-double"></i> All On</button>
                        <button class="btn btn-xs btn-danger" style="flex:1" onclick="window.setAllRolePerms('${r}',false)"><i class="fa-solid fa-xmark"></i> All Off</button>
                    </div>
                </div>`).join('')}
                <div style="padding:.75rem;background:var(--acc)11;border-radius:8px;border:1px solid var(--acc)33;font-size:.75rem;color:var(--text3)">
                    <i class="fa-solid fa-lightbulb" style="color:var(--acc);margin-right:.3rem"></i>
                    Parent categories with 0 active items auto-hide in sidebar.
                </div>
                <button class="btn btn-secondary btn-sm" onclick="window.resetMatrixToDefault()"><i class="fa-solid fa-rotate-left"></i> Reset to Defaults</button>
            </div>
        </div>
    </div>
    `;
};

window.updateRoleMatrix = (role, mod, sub, isChecked) => {
    if (!STATE.permissionMatrix[role]) STATE.permissionMatrix[role] = {};
    if (typeof STATE.permissionMatrix[role][mod] !== 'object') STATE.permissionMatrix[role][mod] = {};
    STATE.permissionMatrix[role][mod][sub] = isChecked;
    saveState();
    if (window.renderSidebar) window.renderSidebar();
};

window.setAllRolePerms = (role, value) => {
    if (!STATE.permissionMatrix[role]) STATE.permissionMatrix[role] = {};
    document.querySelectorAll(`input[onchange*="'${role}'"]`).forEach(cb => {
        cb.checked = value;
        const match = cb.getAttribute('onchange').match(/'([^']+)','([^']+)','([^']+)'/);
        if (match) {
            const [, r, mod, sub] = match;
            if (!STATE.permissionMatrix[r][mod]) STATE.permissionMatrix[r][mod] = {};
            STATE.permissionMatrix[r][mod][sub] = value;
        }
    });
    saveState();
    toast(`${role}: all permissions ${value ? 'enabled' : 'disabled'}`, 'info');
};

window.resetMatrixToDefault = () => {
    confirmAction('Reset Permission Matrix', 'This will reset all role permissions to system defaults. Continue?', () => {
        delete STATE.permissionMatrix.Whitelabel;
        delete STATE.permissionMatrix.Agent;
        // Also clean up any legacy keys if they exist
        delete STATE.permissionMatrix.Master;
        delete STATE.permissionMatrix.Company;
        delete STATE.permissionMatrix.Shop;
        saveState();
        go('dev-menu-config');
        toast('Matrix reset to defaults', 'success');
    });
};

window.savePermissionMatrix = async () => {
    const btn = document.getElementById('btnSaveMatrix');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...'; }

    const matrixJson = JSON.stringify({
        Whitelabel: STATE.permissionMatrix.Whitelabel || {},
        Agent: STATE.permissionMatrix.Agent || {},
    });

    if (window.db?.dbSaveSetting) {
        const { error } = await window.db.dbSaveSetting('permission_matrix', matrixJson);
        if (error) {
            toast('Save failed: ' + error.message, 'error');
            if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save to Database'; }
            return;
        }
        if (window.db?.dbWriteLog) window.db.dbWriteLog('Update Permissions', 'matrix', 'Permission matrix saved to database');
        toast('Permission matrix saved to database', 'success');
    } else {
        saveState();
        toast('Saved to local storage (no DB connection)', 'info');
    }

    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save to Database'; }
};

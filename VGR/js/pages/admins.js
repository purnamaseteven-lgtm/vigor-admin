/* ─── ADMIN & ROLE MANAGEMENT PAGE ─── */
import { STATE, stateAdd, stateUpdate, stateDelete } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsSelect, fsActions, tableWrap, badge, actionBtns, renderPagerHTML, openModal, closeModalBtn, toast } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage } from '../utils/helpers.js';

pages['admin-management'] = () => {
    const PG = 'admin-management';
    const curAdmin = STATE.currentAdmin;

    // Authorization Logic: Filter which admins a user can see
    let rawAdmins = STATE.admins;
    if (curAdmin.role === 'Company') {
        rawAdmins = STATE.admins.filter(a => a.company === curAdmin.company && a.role !== 'SuperAdmin');
    } else if (curAdmin.role === 'Shop') {
        rawAdmins = STATE.admins.filter(a => a.shop === curAdmin.shop);
    }

    const filtered = filterData(rawAdmins, PG);
    const total = filtered.length;
    const pp = getPerPage(PG);
    const cp = getCurPage(PG);
    const rows = paginate(filtered, cp, pp);

    const canAdd = curAdmin.role !== 'Shop';

    return `
    ${pageHeader('Admin & Role Management', '<span>Settings</span><span class="sep">›</span><span>Administrators</span>', `
        <div style="display:flex;gap:.5rem;align-items:center">
            <span class="badge" style="background:var(--acc-glow);color:var(--acc);border:1px solid var(--acc)44">Login as: ${curAdmin.role}</span>
            ${canAdd ? `<button class="btn btn-primary btn-sm" onclick="window.openAdminForm()"><i class="fa-solid fa-user-plus"></i> Add Admin</button>` : ''}
        </div>
    `)}

    <div class="alert alert-info" style="margin-bottom:1.5rem">
        <i class="fa-solid fa-shield-halved"></i>
        <div><strong>Data Isolation Active:</strong> You are currently managing administrators within the <u>${curAdmin.company}</u> organization.</div>
    </div>

    ${filterCard(`
        ${fsInput(PG, 'username', 'Username', 'Search user...')}
        ${fsSelect(PG, 'role', 'Level Role', ['All', 'SuperAdmin', 'Company', 'Shop'])}
        ${fsActions(PG)}
    `)}

    ${tableWrap(`
        <table>
            <thead>
                <tr>
                    <th>Admin Details</th>
                    <th>Role Level</th>
                    <th>Affiliation (Company/Shop)</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${rows.map(a => `
                    <tr>
                        <td>
                            <div style="font-weight:700;color:var(--acc)">${a.username}</div>
                            <div style="font-size:.7rem;color:var(--text3)">${a.name}</div>
                        </td>
                        <td>${badge(a.role, a.role === 'SuperAdmin' ? 'purple' : a.role === 'Company' ? 'blue' : 'green')}</td>
                        <td>
                            <div style="font-size:.85rem;font-weight:600">${a.company}</div>
                            ${a.shop ? `<div style="font-size:.7rem;color:var(--text3)">Shop: ${a.shop}</div>` : ''}
                        </td>
                        <td>${badge(a.status, a.status === 'Active' ? 'success' : 'danger')}</td>
                        <td style="font-size:.72rem;color:var(--text3)">${a.lastLogin || '-'}</td>
                        <td>
                            ${actionBtns(
        `openAdminForm('${a.id}')`,
        `confirmAction('Delete Admin','Are you sure you want to remove ${a.username}? This will revoke all dashboard access.',()=>{window.deleteAdmin('${a.id}')},'Delete Admin','danger')`
    )}
                        </td>
                    </tr>
                `).join('')}
                ${rows.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:3rem;color:var(--text3)">No administrators found in your scope.</td></tr>' : ''}
            </tbody>
        </table>
    `)}
    ${renderPagerHTML(PG, total, pp, cp)}
    `;
};

// ─── FORM & ACTIONS ───

window.openAdminForm = (id = null) => {
    const admin = id ? STATE.admins.find(a => a.id === id) : null;
    const curRole = STATE.currentAdmin.role;

    const roleOptions = curRole === 'SuperAdmin'
        ? ['SuperAdmin', 'Company', 'Shop']
        : curRole === 'Company' ? ['Company', 'Shop'] : ['Shop'];

    openModal(admin ? 'Edit Administrator' : 'Add New Administrator', `
        <div class="form-grid" style="gap:1rem">
            <div class="form-field"><label>Username</label><input id="adm_username" value="${admin?.username || ''}" ${admin ? 'readonly' : ''} placeholder="e.g., admin_main"/></div>
            <div class="form-field"><label>Full Name</label><input id="adm_name" value="${admin?.name || ''}" placeholder="Display name"/></div>
            <div class="form-field"><label>Account Level (Role)</label>
                <select id="adm_role" onchange="window.toggleAdminFields(this.value)">
                    ${roleOptions.map(r => `<option value="${r}" ${admin?.role === r ? 'selected' : ''}>${r}</option>`).join('')}
                </select>
            </div>
            <div class="form-field" id="wrap_company" style="display:${curRole === 'SuperAdmin' ? 'block' : 'none'}">
                <label>Company Affiliation</label>
                <select id="adm_company">
                    ${STATE.companies.map(c => `<option value="${c}" ${admin?.company === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
            </div>
            <div class="form-field" id="wrap_shop" style="display:none">
                <label>Shop Affiliation</label>
                <select id="adm_shop">
                    <option value="">-- No Shop --</option>
                    ${STATE.shops.map(s => `<option value="${s.name}" ${admin?.shop === s.name ? 'selected' : ''}>${s.name} (${s.company})</option>`).join('')}
                </select>
            </div>
            <div class="form-field"><label>Password ${admin ? '(Leave blank to keep current)' : ''}</label><input type="password" id="adm_pass"/></div>
        </div>
    `, `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-primary" onclick="window.saveAdmin('${id || ''}')">Save administrator</button>
    `);

    // Initial toggle
    setTimeout(() => {
        const roleVal = document.getElementById('adm_role').value;
        window.toggleAdminFields(roleVal);
    }, 100);
};

window.toggleAdminFields = (role) => {
    const wrapCo = document.getElementById('wrap_company');
    const wrapSh = document.getElementById('wrap_shop');
    const curAdmin = STATE.currentAdmin;

    if (role === 'SuperAdmin') {
        wrapCo.style.display = 'block';
        wrapSh.style.display = 'none';
    } else if (role === 'Company') {
        wrapCo.style.display = curAdmin.role === 'SuperAdmin' ? 'block' : 'none';
        wrapSh.style.display = 'none';
    } else {
        wrapCo.style.display = curAdmin.role === 'SuperAdmin' ? 'block' : 'none';
        wrapSh.style.display = 'block';
    }
};

window.saveAdmin = (id) => {
    const data = {
        username: document.getElementById('adm_username').value,
        name: document.getElementById('adm_name').value,
        role: document.getElementById('adm_role').value,
        company: document.getElementById('adm_company')?.value || STATE.currentAdmin.company,
        shop: document.getElementById('adm_shop')?.value || null,
        status: 'Active'
    };

    if (id) {
        stateUpdate('admins', id, data);
        toast('Administrator profile updated', 'success');
    } else {
        data.id = 'adm-' + Date.now();
        data.lastLogin = 'Never';
        stateAdd('admins', data);
        toast('New administrator created successfully', 'success');
    }
    closeModalBtn();
    go('admin-management');
};

window.deleteAdmin = (id) => {
    stateDelete('admins', id);
    toast('Administrator access revoked', 'warning');
    go('admin-management');
};

/* ─── DEV SIMULATOR: ROLE MATRIX ─── */
pages['dev-menu-config'] = () => {
    const defaultTree = {
        home: { dashboard: true, statistics: true, providerAnalytics: true, deviceReport: true },
        master: { whitelist: true, blacklist: true, masterWhitelist: true },
        administrators: { systemAdmins: true, rolePermissions: true },
        companyManagement: { whitelabelList: true, regisNewCompany: true },
        whitelabel: { whitelabelList: true, masterWlList: true },
        members: { memberList: true, addMember: true, tierHistory: true },
        bankManagement: { bankList: true, createNewBank: true },
        finance: { deposit: true, withdrawal: true },
        bets: { betsListing: true, bettingTable: true, transferredList: true },
        bonus: { bonusReport: true, agentFreebet: true, agentFreebetReport: true, pragmaticFrb: true },
        results: { resultsListing: true, resultScan: true, resultsAnalyze: true },
        integrations: { providerSetup: true, apiLogs: true, developerDocs: true },
        customization: { templateBuilder: true, templatePreview: true, promotions: true, systemTheme: true, globalBanner: true, appNotification: true, siteConfig: true, seoTools: true },
        settings: { commission: true, referralRate: true, poolsList: true, games: true, agentGameSettings: true, togelCommission: true, limitCreditOut: true, vipDesigner: true, rebateCalc: true },
        tools: { coin2pay: true, hostManagement: true, sawala: true, smartico: true, unopay: true },
        memo: { memoBox: true, autoMemo: true },
        reports: { winloss: true, agentDaily: true, limitCredit: true, lostMoney: true, togelLost: true, topTurnover: true },
        invoice: { monthly: true, fileManagement: true, tournamentWinners: true },
        logs: { adminLogs: true, companyLogs: true, whitelabelLogs: true, memberLogs: true, masterWlLogs: true }
    };

    const mx = STATE.permissionMatrix;
    const roles = ['Master', 'Company'];

    let tableHTML = `<div style="max-height: 600px; overflow-y: auto; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;">`;
    tableHTML += `<table style="width:100%; border-collapse:collapse; text-align:left;">`;
    tableHTML += `<thead style="position: sticky; top: 0; background: #1e293b; z-index: 10;">
        <tr style="border-bottom:1px solid rgba(255,255,255,0.1)">
            <th style="padding:1rem; color:var(--acc); font-weight:800; font-size:0.85rem">System Module & Sub-Menus</th>`;
    const roleLabels = {
        Master: 'Master Agent',
        Company: 'Agent/Toko'
    };

    roles.forEach(r => tableHTML += `<th style="padding:1rem">${roleLabels[r] || r}</th>`);
    tableHTML += `</tr></thead><tbody>`;

    Object.keys(defaultTree).forEach(mod => {
        // Parent Header
        tableHTML += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.03);">`;
        tableHTML += `<td style="padding:.8rem 1rem; font-weight:700; color:#cbd5e1; text-transform:uppercase; letter-spacing:0.05em; font-size:0.75rem">${mod}</td>`;
        roles.forEach(r => tableHTML += `<td></td>`);
        tableHTML += `</tr>`;

        // Sub Items
        Object.keys(defaultTree[mod]).forEach(sub => {
            tableHTML += `<tr style="border-bottom:1px dashed rgba(255,255,255,0.02)">`;
            tableHTML += `<td style="padding:.5rem 1rem .5rem 2.5rem; font-size:0.8rem; color:#94a3b8"><i class="fa-solid fa-turn-up fa-rotate-90" style="margin-right:6px; opacity:0.3"></i> ${sub}</td>`;
            roles.forEach(r => {
                if (!mx[r]) mx[r] = JSON.parse(JSON.stringify(defaultTree));
                if (!mx[r][mod]) mx[r][mod] = JSON.parse(JSON.stringify(defaultTree[mod]));
                const isChecked = mx[r][mod][sub] ? 'checked' : '';
                tableHTML += `<td style="padding:.5rem 1rem">
                    <label style="display:flex; align-items:center; cursor:pointer;">
                        <input type="checkbox" style="width:15px;height:15px;accent-color:var(--acc)" 
                            onchange="window.updateRoleMatrix('${r}', '${mod}', '${sub}', this.checked)" ${isChecked}>
                    </label>
                </td>`;
            });
            tableHTML += `</tr>`;
        });
    });
    tableHTML += `</tbody></table></div>`;

    return `
    ${pageHeader('Full Platform Matrix', '<span>System Config</span><span class="sep">›</span><span>Permissions</span>', `
        <button class="btn btn-secondary" onclick="go('admin-management')"><i class="fa-solid fa-arrow-left"></i> Back</button>
    `)}

    <div style="display:grid; grid-template-columns: 1fr 320px; gap: 1.5rem; align-items:start;">
        <div class="card" style="box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            <div class="card-header"><span class="card-title"><i class="fa-solid fa-shield-halved" style="color:var(--acc)"></i> Granular Visibility Control</span></div>
            <div class="card-body">
                <p style="font-size:0.8rem; color:#94a3b8; margin-bottom:1rem">This matrix now covers <b>100% of detected platform modules</b>. Toggling a checkbox will instantly remove/add that sub-menu for the selected role.</p>
                <div class="table-wrapper-outer" style="background:#0f172a; border-radius:12px; border:1px solid rgba(255,255,255,0.05); padding:1px">
                    ${tableHTML}
                </div>
            </div>
        </div>
        <div class="card" style="background:#1e293b; border:1px solid var(--acc); border-radius:12px; padding:1.5rem; position:sticky; top:1.5rem">
            <h3 style="color:#fff; margin:0 0 1rem 0; display:flex; align-items:center; gap:.5rem; font-size:1rem"><i class="fa-solid fa-bolt" style="color:var(--acc)"></i> Simulator Tips</h3>
            <ul style="color:#cbd5e1; font-size:0.75rem; line-height:1.6; padding-left:1.1rem; margin:0">
                <li><b>Ghost Menus:</b> If a parent category has zero items checked, the entire label will disappear from the sidebar.</li>
                <li><b>Instant Persistence:</b> All changes save to <code>STATE.permissionMatrix</code> and <code>localStorage</code> immediately.</li>
                <li><b>Role Switching:</b> Change roles in the top-right header to verify your changes.</li>
            </ul>
            <div style="margin-top:1.5rem; padding-top:1rem; border-top:1px solid rgba(255,255,255,0.1)">
                <button class="btn btn-primary" style="width:100%" onclick="saveState(); toast('Snapshot Saved', 'success')"><i class="fa-solid fa-floppy-disk"></i> Save Matrix Snapshot</button>
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
    toast(`Permission updated: [${role}] -> ${mod} : ${sub} = ${isChecked}`, 'info');

    // Automatically re-render the sidebar to reflect the change visually if we are simulating that role
    if (window.renderSidebar) window.renderSidebar();
};

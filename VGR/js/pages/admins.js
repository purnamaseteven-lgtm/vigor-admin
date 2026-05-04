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

window.saveAdmin = async (id) => {
    const data = {
        username: document.getElementById('adm_username').value,
        name: document.getElementById('adm_name').value,
        role: document.getElementById('adm_role').value,
        company: document.getElementById('adm_company')?.value || STATE.currentAdmin.company,
        shop: document.getElementById('adm_shop')?.value || null,
        status: 'Active'
    };
    const password = document.getElementById('adm_pass')?.value;

    if (id) {
        // Update in Supabase admin_profiles
        if (window.db?.dbUpdateAdmin) {
            const { error } = await window.db.dbUpdateAdmin(id, data);
            if (error) { toast('Update failed: ' + error.message, 'error'); return; }
            if (window.db?.dbWriteLog) window.db.dbWriteLog('Update Admin', id, `Updated admin ${data.username}`);
        } else {
            stateUpdate('admins', id, data);
        }
        toast('Administrator profile updated', 'success');
    } else {
        data.id = 'adm-' + Date.now();
        data.lastLogin = 'Never';
        // Create in Supabase admin_profiles
        if (window.db?.dbAddAdmin) {
            const { error } = await window.db.dbAddAdmin(data, password);
            if (error) { toast('Failed: ' + error.message, 'error'); return; }
            if (window.db?.dbWriteLog) window.db.dbWriteLog('Add Admin', data.id, `Created admin ${data.username} [${data.role}]`);
        } else {
            stateAdd('admins', data);
        }
        toast('New administrator created successfully', 'success');
    }
    closeModalBtn();
    go('admin-management');
};

window.deleteAdmin = async (id) => {
    const admin = STATE.admins?.find(a => a.id === id);
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

// Alias: nav uses 'admins-list', page is registered as 'admin-management'
pages['admins-list'] = pages['admin-management'];

/* ─── PERMISSION MATRIX EDITOR ─── */
pages['dev-menu-config'] = () => {
    const defaultTree = {
        home:               { dashboard: true, statistics: true, providerAnalytics: true, deviceReport: true },
        master:             { whitelist: true, blacklist: true, masterWhitelist: true },
        administrators:     { systemAdmins: true, rolePermissions: true },
        companyManagement:  { whitelabelList: true, regisNewCompany: true },
        whitelabel:         { whitelabelList: true, masterWlList: true },
        members:            { memberList: true, addMember: true, tierHistory: true },
        bankManagement:     { bankList: true, createNewBank: true },
        finance:            { deposit: true, withdrawal: true },
        bets:               { betsListing: true, bettingTable: true, transferredList: true },
        bonus:              { bonusReport: true, agentFreebet: true, agentFreebetReport: true, pragmaticFrb: true, promotions: true, promotionRelease: true, promotionRollingRelease: true },
        results:            { resultsListing: true, resultScan: true, resultsAnalyze: true },
        integrations:       { providerSetup: true, apiLogs: true, developerDocs: true },
        customization:      { templateBuilder: true, templatePreview: true, promotions: true, systemTheme: true, globalBanner: true, appNotification: true, announcements: true, siteConfig: true, seoTools: true },
        settings:           { commission: true, referralRate: true, poolsList: true, games: true, agentGameSettings: true, togelCommission: true, limitCreditOut: true, vipDesigner: true, rebateCalc: true, financeLimits: true },
        tools:              { coin2pay: true, hostManagement: true, sawala: true, unopay: true },
        crm:                { dashboard: true, segments: true, missions: true, tournaments: true, automation: true, push: true },
        memo:               { memoBox: true, autoMemo: true },
        reports:            { winloss: true, agentDaily: true, limitCredit: true, lostMoney: true, togelLost: true, topTurnover: true },
        invoice:            { monthly: true, fileManagement: true, tournamentWinners: true },
        logs:               { adminLogs: true, companyLogs: true, whitelabelLogs: true, memberLogs: true, masterWlLogs: true }
    };

    const mx = STATE.permissionMatrix;
    const roles = ['Master', 'Company', 'Shop'];
    const roleLabels = { Master: 'Master Agent', Company: 'Agent / Toko', Shop: 'Shop Operator' };

    let tableHTML = `<div style="max-height:600px;overflow-y:auto;border:1px solid var(--border);border-radius:8px">`;
    tableHTML += `<table style="width:100%;border-collapse:collapse;text-align:left">`;
    tableHTML += `<thead style="position:sticky;top:0;background:var(--bg2);z-index:10">
        <tr style="border-bottom:1px solid var(--border)">
            <th style="padding:1rem;color:var(--acc);font-weight:800;font-size:.85rem">Module / Feature</th>`;
    roles.forEach(r => tableHTML += `<th style="padding:1rem;font-size:.82rem;font-weight:700;text-align:center">${roleLabels[r]||r}</th>`);
    tableHTML += `</tr></thead><tbody>`;

    Object.keys(defaultTree).forEach(mod => {
        tableHTML += `<tr style="border-bottom:1px solid var(--border);background:var(--bg2)">`;
        tableHTML += `<td colspan="${roles.length+1}" style="padding:.6rem 1rem;font-weight:800;color:var(--text3);text-transform:uppercase;letter-spacing:.06em;font-size:.72rem"><i class="fa-solid fa-folder-open" style="margin-right:.4rem;opacity:.5"></i>${mod}</td>`;
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
        <div>Changes are applied <strong>live</strong> to STATE immediately. Click <strong>Save to Database</strong> to persist across sessions.</div>
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
        Master:  STATE.permissionMatrix.Master  || {},
        Company: STATE.permissionMatrix.Company || {},
        Shop:    STATE.permissionMatrix.Shop    || {},
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

/* ─── ROLE-BASED ACCESS CONTROL (RBAC) UI ─── */
import { pages } from '../core/router.js';
import { pageHeader, toast } from '../ui/components.js';
import { STATE } from '../core/state.js';

const PERMISSION_GROUPS = {
    'Home': ['dashboard', 'statistics', 'provider-analytics'],
    'Members': ['global-member-list', 'tier-history', 'finance-adjustment'],
    'Companies': ['company-list', 'company-create', 'company-tree', 'whitelabel-list'],
    'Finance': ['deposit-list', 'withdrawal-list', 'bank-list', 'bank-create'],
    'Providers': ['seamless-config', 'seamless-transactions', 'seamless-games', 'seamless-api-logs', 'seamless-sandbox'],
    'CRM': ['crm-dashboard', 'crm-segments', 'crm-missions', 'crm-tournaments', 'crm-automation', 'crm-push'],
    'Tools': ['nawala-scan', 'seo-tools', 'site-config', 'template-builder']
};

pages['rbac-management'] = () => {
    return `
        ${pageHeader('Role Management', '<span>System Control</span><span class="sep">›</span><span>RBAC Matrix</span>')}

        <div class="card">
            <div class="card-header">
                <span class="card-title">Permissions Matrix</span>
                <div style="display:flex; gap:.5rem">
                    <select class="form-control form-control-sm" id="rbacRoleSelect" onchange="window.loadRolePermissions(this.value)">
                        <option value="Admin">Admin</option>
                        <option value="Finance">Finance</option>
                        <option value="CS">Customer Service</option>
                        <option value="Agent">Agent Manager</option>
                    </select>
                    <button class="btn btn-primary btn-sm" onclick="window.saveRolePermissions()">Save Matrix</button>
                </div>
            </div>
            <div class="card-body" style="padding:0">
                <table class="table" style="width:100%">
                    <thead style="background:var(--bg)">
                        <tr>
                            <th style="padding:1rem;text-align:left">Module Group</th>
                            <th style="padding:1rem;text-align:left">Pages / Sub-modules</th>
                            <th style="padding:1rem;text-align:center">Access Control</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(PERMISSION_GROUPS).map(([group, subItems]) => `
                            <tr style="border-bottom:1px solid var(--border)">
                                <td style="padding:1rem;font-weight:700">${group}</td>
                                <td style="padding:1rem">
                                    <div style="display:flex; flex-wrap:wrap; gap:1.5rem">
                                        ${subItems.map(item => `
                                            <label style="display:flex; align-items:center; gap:.5rem; cursor:pointer; font-size:.85rem">
                                                <input type="checkbox" class="perm-check" data-group="${group.toLowerCase()}" data-item="${item}" checked>
                                                ${item.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                            </label>
                                        `).join('')}
                                    </div>
                                </td>
                                <td style="padding:1rem; text-align:center">
                                    <button class="btn btn-xs btn-secondary" onclick="window.toggleGroupPerms('${group.toLowerCase()}', true)">All</button>
                                    <button class="btn btn-xs btn-secondary" onclick="window.toggleGroupPerms('${group.toLowerCase()}', false)">None</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

window.toggleGroupPerms = (group, state) => {
    document.querySelectorAll(`.perm-check[data-group="${group}"]`).forEach(el => el.checked = state);
};

window.loadRolePermissions = (role) => {
    toast(`Permissions loaded for ${role}`, 'info');
    // In real app, fetch from DB and update checkboxes
};

window.saveRolePermissions = () => {
    const role = document.getElementById('rbacRoleSelect').value;
    const perms = {};
    document.querySelectorAll('.perm-check').forEach(el => {
        if (el.checked) {
            const g = el.dataset.group;
            const i = el.dataset.item;
            if (!perms[g]) perms[g] = [];
            perms[g].push(i);
        }
    });
    console.log('Saving permissions for', role, perms);
    toast(`Permissions for ${role} saved successfully!`, 'success');
};

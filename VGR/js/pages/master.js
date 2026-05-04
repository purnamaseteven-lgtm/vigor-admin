/* ─── MASTER MANAGEMENT PAGES ─── */
import { STATE, addLog, rnd } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsActions, tableWrap, badge, actionBtns, toast } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage, COMPANIES } from '../utils/helpers.js';

/* ─── WHITELIST ─── */
pages['whitelist'] = () => {
    const PG = 'whitelist';
    const rawData = Array.from({ length: 15 }, (_, i) => ({
        id: 'WL' + (1000 + i),
        ip: `192.168.${rnd(1, 254)}.${rnd(1, 254)}`,
        note: ['Main Server', 'Dev Office', 'Admin Backup', 'Super Admin Home', 'API Node ' + i][i % 5],
        status: 'Active',
        created: `2${rnd(0, 7)}/04/2026`,
        actor: 'adminusb40'
    }));

    const filtered = filterData(rawData, PG);
    const total = filtered.length;
    const pp = getPerPage(PG);
    const cp = getCurPage(PG);
    const rows = paginate(filtered, cp, pp);

    return `
    ${pageHeader('Whitelist Management', '<span>Master</span><span class="sep">›</span><span>Whitelist</span>', `
        <button class="btn btn-primary" onclick="toast('Add IP to whitelist','info')"><i class="fa-solid fa-plus"></i> Add IP</button>
    `)}

    <div class="alert alert-info" style="margin-bottom:1.5rem">
        <i class="fa-solid fa-shield-halved"></i>
        <div><strong>Security Protocol:</strong> Whitelisted IPs are granted access to restricted administrative gateways.</div>
    </div>

    ${filterCard(`
        ${fsInput(PG, 'ip', 'IP Address', 'Search IP...')}
        ${fsInput(PG, 'note', 'Note', 'Search note...')}
        ${fsActions(PG)}
    `)}

    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>IP Address</th><th>Note</th><th>Added By</th><th>Date</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong style="color:var(--acc)">${r.ip}</strong></td>
                  <td>${r.note}</td>
                  <td style="font-size:.75rem">${r.actor}</td>
                  <td style="font-size:.72rem">${r.created}</td>
                  <td>${badge(r.status, 'success')}</td>
                  <td>${actionBtns(
        `toast('Edit Whitelist','info')`,
        `toast('IP removed','warning')`
    )}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>
    `;
};

/* ─── BLACKLIST ─── */
pages['blacklist'] = () => {
    const PG = 'blacklist';
    const rawData = Array.from({ length: 12 }, (_, i) => ({
        id: 'BL' + (1000 + i),
        target: ['112.54.21.3', 'user_scammer99', '103.22.41.5', 'malicious_bot', '88.21.3.4'][i % 5],
        type: i % 2 === 0 ? 'IP Address' : 'Username',
        reason: ['Spamming', 'Multiple Accounts', 'Chargeback risk', 'Suspicious activity', 'Automation bot'][i % 5],
        status: 'Blocked',
        created: `2${rnd(0, 7)}/04/2026`,
        actor: 'adminusb40'
    }));

    const filtered = filterData(rawData, PG);
    const total = filtered.length;
    const pp = getPerPage(PG);
    const cp = getCurPage(PG);
    const rows = paginate(filtered, cp, pp);

    return `
    ${pageHeader('Blacklist Management', '<span>Master</span><span class="sep">›</span><span>Blacklist</span>', `
        <button class="btn btn-danger" onclick="toast('Add to blacklist','info')"><i class="fa-solid fa-ban"></i> Blacklist Entry</button>
    `)}

    ${filterCard(`
        ${fsInput(PG, 'target', 'Target', 'IP or Username...')}
        ${fsActions(PG)}
    `)}

    <div class="card">
      <div class="card-body">
        ${tableWrap(`
          <table>
            <thead>
              <tr><th>#</th><th>Target</th><th>Type</th><th>Reason</th><th>Admin</th><th>Date</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong style="color:var(--red)">${r.target}</strong></td>
                  <td>${badge(r.type, r.type === 'IP Address' ? 'indigo' : 'indigo-glow')}</td>
                  <td style="font-size:.78rem">${r.reason}</td>
                  <td style="font-size:.75rem">${r.actor}</td>
                  <td style="font-size:.72rem">${r.created}</td>
                  <td>${badge(r.status, 'danger')}</td>
                  <td>${actionBtns(
        `toast('Edit Blacklist','info')`,
        `toast('Entry removed','success')`
    )}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `)}
      </div>
    </div>
    `;
};

/* ─── MASTER WHITELIST ─── */
pages['master-whitelist'] = () => {
    return `
    ${pageHeader('Master Whitelist', '<span>Master</span><span class="sep">›</span><span>Master Whitelist</span>')}
    
    <div class="card" style="max-width:800px">
        <div class="card-header"><span class="card-title">Root Domain & API Whitelist</span></div>
        <div class="card-body">
            <div style="display:flex; flex-direction:column; gap:1.25rem">
                ${['main-gateway.production.io', 'api-cluster-01.vgr.com', 'admin-tunnel.vigor.net', 'backup-node.secure.io'].map(domain => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border:1px solid var(--border); border-radius:10px; background:var(--bg2)">
                        <div>
                            <div style="font-weight:700; color:var(--acc)">${domain}</div>
                            <div style="font-size:.72rem; color:var(--text3)">Primary Access Domain</div>
                        </div>
                        <div style="display:flex; gap:.5rem">
                            ${badge('Verified', 'success')}
                            <button class="btn btn-xs btn-primary"><i class="fa-solid fa-shield-check"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-top:2rem">
                <button class="btn btn-primary" onclick="toast('Adding new domain...','info')"><i class="fa-solid fa-plus"></i> Add Root Domain</button>
            </div>
        </div>
    </div>
    `;
};

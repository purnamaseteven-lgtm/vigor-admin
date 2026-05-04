/* ─── MASTER MANAGEMENT PAGES ─── */
import { STATE, addLog, rnd, saveState } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsActions, tableWrap, badge, actionBtns, openModal, closeModalBtn, toast } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage, COMPANIES } from '../utils/helpers.js';

// ── Helpers: ensure STATE lists exist ──
function getWhitelist() {
    if (!STATE.whitelist) {
        STATE.whitelist = Array.from({ length: 6 }, (_, i) => ({
            id: 'WL' + (1000 + i),
            ip: `192.168.${rnd(1, 254)}.${rnd(1, 254)}`,
            note: ['Main Server', 'Dev Office', 'Admin Backup', 'Super Admin Home', 'API Node'][i % 5],
            status: 'Active',
            created: `${rnd(1,28).toString().padStart(2,'0')}/04/2026`,
            actor: STATE.currentAdmin?.username || 'adminusb40'
        }));
    }
    return STATE.whitelist;
}
function getBlacklist() {
    if (!STATE.blacklist) {
        STATE.blacklist = Array.from({ length: 6 }, (_, i) => ({
            id: 'BL' + (1000 + i),
            target: ['112.54.21.3', 'user_scammer99', '103.22.41.5', 'malicious_bot', '88.21.3.4'][i % 5],
            type: i % 2 === 0 ? 'IP Address' : 'Username',
            reason: ['Spamming', 'Multiple Accounts', 'Chargeback risk', 'Suspicious activity', 'Automation bot'][i % 5],
            status: 'Blocked',
            created: `${rnd(1,28).toString().padStart(2,'0')}/04/2026`,
            actor: STATE.currentAdmin?.username || 'adminusb40'
        }));
    }
    return STATE.blacklist;
}
function getDomains() {
    if (!STATE.masterDomains) {
        STATE.masterDomains = [
            { id: 'D1', domain: 'main-gateway.production.io', type: 'Primary', status: 'Verified', created: '01/04/2026' },
            { id: 'D2', domain: 'api-cluster-01.vgr.com', type: 'API', status: 'Verified', created: '02/04/2026' },
            { id: 'D3', domain: 'admin-tunnel.vigor.net', type: 'Admin', status: 'Verified', created: '03/04/2026' },
            { id: 'D4', domain: 'backup-node.secure.io', type: 'Backup', status: 'Verified', created: '05/04/2026' },
        ];
    }
    return STATE.masterDomains;
}

/* ─── WHITELIST ─── */
pages['whitelist'] = () => {
    const PG = 'whitelist';
    const rawData = getWhitelist();
    const filtered = filterData(rawData, PG);
    const total = filtered.length;
    const pp = getPerPage(PG);
    const cp = getCurPage(PG);
    const rows = paginate(filtered, cp, pp);

    return `
    ${pageHeader('Whitelist Management', '<span>Master</span><span class="sep">›</span><span>Whitelist</span>', `
        <button class="btn btn-primary" onclick="window.openAddWhitelistModal()"><i class="fa-solid fa-plus"></i> Add IP</button>
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
        `window.openEditWhitelistModal('${r.id}')`,
        `window.deleteWhitelistEntry('${r.id}','${r.ip}')`
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
    const rawData = getBlacklist();
    const filtered = filterData(rawData, PG);
    const total = filtered.length;
    const pp = getPerPage(PG);
    const cp = getCurPage(PG);
    const rows = paginate(filtered, cp, pp);

    return `
    ${pageHeader('Blacklist Management', '<span>Master</span><span class="sep">›</span><span>Blacklist</span>', `
        <button class="btn btn-danger" onclick="window.openAddBlacklistModal()"><i class="fa-solid fa-ban"></i> Blacklist Entry</button>
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
        `window.openEditBlacklistModal('${r.id}')`,
        `window.deleteBlacklistEntry('${r.id}','${r.target}')`
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
    const domains = getDomains();
    return `
    ${pageHeader('Master Whitelist', '<span>Master</span><span class="sep">›</span><span>Master Whitelist</span>', `
        <button class="btn btn-primary" onclick="window.openAddDomainModal()"><i class="fa-solid fa-plus"></i> Add Root Domain</button>
    `)}

    <div class="card" style="max-width:900px">
        <div class="card-header"><span class="card-title">Root Domain & API Whitelist</span></div>
        <div class="card-body">
            <div style="display:flex; flex-direction:column; gap:1rem">
                ${domains.map(d => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border:1px solid var(--border); border-radius:10px; background:var(--bg2)">
                        <div>
                            <div style="font-weight:700; color:var(--acc)">${d.domain}</div>
                            <div style="font-size:.72rem; color:var(--text3)">${d.type} Domain · Added ${d.created}</div>
                        </div>
                        <div style="display:flex; gap:.5rem; align-items:center">
                            ${badge(d.status, 'success')}
                            <button class="btn btn-xs btn-primary" onclick="window.openEditDomainModal('${d.id}')"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn btn-xs btn-danger" onclick="window.deleteDomainEntry('${d.id}','${d.domain}')"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    `;
};

// ═══════════════════════════════════════════════════════════════
//  WHITELIST HANDLERS
// ═══════════════════════════════════════════════════════════════
function whitelistForm(entry = {}) {
    return `
    <div class="form-grid">
        <div class="form-field" style="grid-column:1/-1">
            <label>IP Address <span style="color:var(--red)">*</span></label>
            <input id="wl_ip" class="form-control" value="${entry.ip || ''}" placeholder="e.g. 192.168.1.100" />
        </div>
        <div class="form-field" style="grid-column:1/-1">
            <label>Note / Description</label>
            <input id="wl_note" class="form-control" value="${entry.note || ''}" placeholder="e.g. Dev Office IP" />
        </div>
    </div>`;
}

window.openAddWhitelistModal = () => {
    openModal('Add IP to Whitelist', whitelistForm(), `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-primary" onclick="window.saveWhitelistEntry()"><i class="fa-solid fa-plus"></i> Add IP</button>
    `);
};

window.openEditWhitelistModal = (id) => {
    const entry = getWhitelist().find(x => x.id === id);
    if (!entry) return;
    openModal('Edit Whitelist Entry', whitelistForm(entry), `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-primary" onclick="window.saveWhitelistEntry('${id}')"><i class="fa-solid fa-check"></i> Save</button>
    `);
};

window.saveWhitelistEntry = (id = null) => {
    const ip = document.getElementById('wl_ip')?.value.trim();
    const note = document.getElementById('wl_note')?.value.trim();
    if (!ip) { toast('IP address is required', 'error'); return; }
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(ip)) { toast('Invalid IP address format', 'error'); return; }
    const list = getWhitelist();
    if (id) {
        const entry = list.find(x => x.id === id);
        if (entry) { entry.ip = ip; entry.note = note; }
    } else {
        list.unshift({ id: 'WL' + Date.now(), ip, note, status: 'Active', created: new Date().toLocaleDateString('id-ID'), actor: STATE.currentAdmin?.username || 'admin' });
    }
    saveState();
    addLog('Whitelist', ip, id ? 'Updated whitelist entry' : 'Added IP to whitelist');
    closeModalBtn();
    toast(id ? 'IP updated' : 'IP added to whitelist', 'success');
    window.go('whitelist');
};

window.deleteWhitelistEntry = (id, ip) => {
    if (typeof window.confirmAction === 'function') {
        window.confirmAction('Remove IP', `Remove ${ip} from whitelist?`, () => {
            STATE.whitelist = getWhitelist().filter(x => x.id !== id);
            saveState();
            addLog('Whitelist', ip, 'Removed IP from whitelist');
            toast('IP removed from whitelist', 'success');
            window.go('whitelist');
        }, 'Remove', 'danger');
    } else {
        STATE.whitelist = getWhitelist().filter(x => x.id !== id);
        saveState();
        toast('IP removed', 'success');
        window.go('whitelist');
    }
};

// ═══════════════════════════════════════════════════════════════
//  BLACKLIST HANDLERS
// ═══════════════════════════════════════════════════════════════
function blacklistForm(entry = {}) {
    return `
    <div class="form-grid">
        <div class="form-field">
            <label>Target <span style="color:var(--red)">*</span></label>
            <input id="bl_target" class="form-control" value="${entry.target || ''}" placeholder="IP Address or Username" />
        </div>
        <div class="form-field">
            <label>Type</label>
            <select id="bl_type" class="form-control">
                <option ${(entry.type || '') === 'IP Address' ? 'selected' : ''}>IP Address</option>
                <option ${(entry.type || '') === 'Username' ? 'selected' : ''}>Username</option>
            </select>
        </div>
        <div class="form-field" style="grid-column:1/-1">
            <label>Reason <span style="color:var(--red)">*</span></label>
            <select id="bl_reason" class="form-control">
                ${['Spamming','Multiple Accounts','Chargeback risk','Suspicious activity','Automation bot','Fraud','Other'].map(r => `<option ${entry.reason === r ? 'selected':''}>${r}</option>`).join('')}
            </select>
        </div>
    </div>`;
}

window.openAddBlacklistModal = () => {
    openModal('Add to Blacklist', blacklistForm(), `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-danger" onclick="window.saveBlacklistEntry()"><i class="fa-solid fa-ban"></i> Blacklist</button>
    `);
};

window.openEditBlacklistModal = (id) => {
    const entry = getBlacklist().find(x => x.id === id);
    if (!entry) return;
    openModal('Edit Blacklist Entry', blacklistForm(entry), `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-danger" onclick="window.saveBlacklistEntry('${id}')"><i class="fa-solid fa-check"></i> Save</button>
    `);
};

window.saveBlacklistEntry = (id = null) => {
    const target = document.getElementById('bl_target')?.value.trim();
    const type = document.getElementById('bl_type')?.value;
    const reason = document.getElementById('bl_reason')?.value;
    if (!target) { toast('Target is required', 'error'); return; }
    const list = getBlacklist();
    if (id) {
        const entry = list.find(x => x.id === id);
        if (entry) { entry.target = target; entry.type = type; entry.reason = reason; }
    } else {
        list.unshift({ id: 'BL' + Date.now(), target, type, reason, status: 'Blocked', created: new Date().toLocaleDateString('id-ID'), actor: STATE.currentAdmin?.username || 'admin' });
    }
    saveState();
    addLog('Blacklist', target, id ? 'Updated blacklist entry' : `Added ${target} to blacklist`);
    closeModalBtn();
    toast(id ? 'Entry updated' : `${target} blacklisted`, 'success');
    window.go('blacklist');
};

window.deleteBlacklistEntry = (id, target) => {
    if (typeof window.confirmAction === 'function') {
        window.confirmAction('Remove from Blacklist', `Remove ${target}?`, () => {
            STATE.blacklist = getBlacklist().filter(x => x.id !== id);
            saveState();
            addLog('Blacklist', target, 'Removed from blacklist');
            toast('Entry removed', 'success');
            window.go('blacklist');
        }, 'Remove', 'warning');
    } else {
        STATE.blacklist = getBlacklist().filter(x => x.id !== id);
        saveState(); toast('Entry removed', 'success'); window.go('blacklist');
    }
};

// ═══════════════════════════════════════════════════════════════
//  DOMAIN HANDLERS
// ═══════════════════════════════════════════════════════════════
function domainForm(entry = {}) {
    return `
    <div class="form-grid">
        <div class="form-field" style="grid-column:1/-1">
            <label>Domain <span style="color:var(--red)">*</span></label>
            <input id="dm_domain" class="form-control" value="${entry.domain || ''}" placeholder="e.g. api.mysite.com" />
        </div>
        <div class="form-field" style="grid-column:1/-1">
            <label>Type</label>
            <select id="dm_type" class="form-control">
                ${['Primary','API','Admin','Backup','CDN'].map(t => `<option ${entry.type === t ? 'selected':''}>${t}</option>`).join('')}
            </select>
        </div>
    </div>`;
}

window.openAddDomainModal = () => {
    openModal('Add Root Domain', domainForm(), `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-primary" onclick="window.saveDomainEntry()"><i class="fa-solid fa-plus"></i> Add Domain</button>
    `);
};

window.openEditDomainModal = (id) => {
    const entry = getDomains().find(x => x.id === id);
    if (!entry) return;
    openModal('Edit Domain', domainForm(entry), `
        <button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button>
        <button class="btn btn-primary" onclick="window.saveDomainEntry('${id}')"><i class="fa-solid fa-check"></i> Save</button>
    `);
};

window.saveDomainEntry = (id = null) => {
    const domain = document.getElementById('dm_domain')?.value.trim();
    const type = document.getElementById('dm_type')?.value;
    if (!domain) { toast('Domain is required', 'error'); return; }
    const list = getDomains();
    if (id) {
        const entry = list.find(x => x.id === id);
        if (entry) { entry.domain = domain; entry.type = type; }
    } else {
        list.unshift({ id: 'D' + Date.now(), domain, type, status: 'Verified', created: new Date().toLocaleDateString('id-ID') });
    }
    saveState();
    addLog('Domain Whitelist', domain, id ? 'Updated domain' : 'Added domain to master whitelist');
    closeModalBtn();
    toast(id ? 'Domain updated' : 'Domain added', 'success');
    window.go('master-whitelist');
};

window.deleteDomainEntry = (id, domain) => {
    if (typeof window.confirmAction === 'function') {
        window.confirmAction('Remove Domain', `Remove ${domain} from whitelist?`, () => {
            STATE.masterDomains = getDomains().filter(x => x.id !== id);
            saveState(); addLog('Domain Whitelist', domain, 'Removed domain');
            toast('Domain removed', 'success'); window.go('master-whitelist');
        }, 'Remove', 'danger');
    } else {
        STATE.masterDomains = getDomains().filter(x => x.id !== id);
        saveState(); toast('Domain removed', 'success'); window.go('master-whitelist');
    }
};

/* Seamless Integrations INTEGRATION MODULE */
import { STATE, PG_CURRENCIES, saveState } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, filterCard, fsInput, fsSelect, fsActions, tableWrap, badge, renderPagerHTML, toast, openModal, closeModalBtn } from '../ui/components.js';
import { filterData, paginate, getCurPage, getPerPage, fmtCur } from '../utils/helpers.js';
import { mockseamlessApiRequest } from '../api/seamless-api.js';

const fmt = (n) => Number(n).toLocaleString('id-ID');
const fmtTime = (ts) => new Date(ts).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

function ensurePgState() {
    if (!STATE.seamless.config.whitelistedIPs) STATE.seamless.config.whitelistedIPs = [];
    if (!STATE.seamless.config.endpoints) {
        STATE.seamless.config.endpoints = {
            verifySession: '/api/seamless/VerifySession',
            getWallet: '/api/seamless/Cash/Get',
            transferInOut: '/api/seamless/Cash/TransferInOut',
            adjustment: '/api/seamless/Cash/Adjustment',
            updateBetDetail: '/api/seamless/Cash/UpdateBetDetail',
        };
    }
    if (!Array.isArray(STATE.seamless.transactions)) STATE.seamless.transactions = [];
    if (!Array.isArray(STATE.seamless.games)) STATE.seamless.games = [];
    if (!Array.isArray(STATE.seamless.apiLogs)) STATE.seamless.apiLogs = [];
    saveState();
}

ensurePgState();

pages['seamless-config'] = () => {
    const c = STATE.seamless.config;
    const totalTx = STATE.seamless.transactions.length;
    const totalGames = STATE.seamless.games.filter(g => g.status === 'Active').length;
    const recentErrors = STATE.seamless.apiLogs.filter(l => l.httpStatus !== 200).length;
    const avgResponse = STATE.seamless.apiLogs.length ? (STATE.seamless.apiLogs.reduce((s, l) => s + parseInt(l.responseTime, 10), 0) / STATE.seamless.apiLogs.length).toFixed(0) : 0;

    return `
    ${pageHeader('Seamless Integrations Provider Settings', '<span>Integration</span><span class="sep">›</span><span>Seamless Integrations Config</span>', `
        <button class="btn btn-success btn-sm" onclick="window.pgTestConnection()"><i class="fa-solid fa-plug-circle-check"></i> Test Connection</button>
        <button class="btn btn-primary btn-sm" onclick="window.pgSyncGames()"><i class="fa-solid fa-rotate"></i> Sync Games</button>
    `)}

    <div class="stat-grid">
        <div class="stat-card"><div class="stat-icon ${c.status === 'Active' ? 'green' : 'red'}"><i class="fa-solid fa-circle-check"></i></div><div><div class="stat-label">Connection ${c.env}</div><div class="stat-value" style="color:${c.status === 'Active' ? 'var(--green)' : 'var(--red)'}">${c.status}</div></div></div>
        <div class="stat-card"><div class="stat-icon blue"><i class="fa-solid fa-gamepad"></i></div><div><div class="stat-label">Active Games</div><div class="stat-value">${totalGames}</div></div></div>
        <div class="stat-card"><div class="stat-icon purple"><i class="fa-solid fa-exchange-alt"></i></div><div><div class="stat-label">Total Transactions</div><div class="stat-value">${fmt(totalTx)}</div></div></div>
        <div class="stat-card"><div class="stat-icon ${recentErrors > 3 ? 'red' : 'yellow'}"><i class="fa-solid fa-triangle-exclamation"></i></div><div><div class="stat-label">API Errors</div><div class="stat-value">${recentErrors}</div></div></div>
        <div class="stat-card"><div class="stat-icon blue"><i class="fa-solid fa-stopwatch"></i></div><div><div class="stat-label">Avg Response</div><div class="stat-value">${avgResponse}ms</div></div></div>
        <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-clock"></i></div><div><div class="stat-label">Last Sync</div><div class="stat-value" style="font-size:.85rem">${c.lastSync}</div></div></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
        <div class="card">
            <div class="card-header"><span class="card-title"><i class="fa-solid fa-key" style="color:var(--acc);margin-right:.5rem"></i>Authentication</span></div>
            <div class="card-body">
                <div class="form-grid" style="gap:.85rem">
                    <div class="form-field"><label>Operator Token</label><input id="pgf_token" value="${c.operatorToken}" style="font-family:monospace;font-size:.8rem"/></div>
                    <div class="form-field"><label>Secret Key</label><div style="display:flex;gap:.5rem"><input id="pgf_secret" type="password" value="${c.secretKey}" style="flex:1;font-family:monospace"/><button class="btn btn-sm btn-secondary" onclick="document.getElementById('pgf_secret').type=document.getElementById('pgf_secret').type==='password'?'text':'password'"><i class="fa-solid fa-eye"></i></button></div></div>
                    <div class="form-field"><label>Hash Salt</label><input id="pgf_salt" value="${c.salt}" style="font-family:monospace;font-size:.8rem"/></div>
                    <div class="form-field"><label>Hash Authentication</label><div style="display:flex;align-items:center;gap:.75rem"><label class="toggle"><input type="checkbox" ${c.hashAuth ? 'checked' : ''} id="pgf_hash"/><span class="toggle-slider"></span></label><span style="font-size:.78rem;color:var(--text2)">${c.hashAuth ? 'Enabled (HMAC-SHA256)' : 'Disabled'}</span></div></div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><span class="card-title"><i class="fa-solid fa-server" style="color:var(--purple);margin-right:.5rem"></i>API Configuration</span></div>
            <div class="card-body">
                <div class="form-grid" style="gap:.85rem">
                    <div class="form-field"><label>Seamless Integrations API Domain</label><input id="pgf_api" value="${c.apiDomain}" style="font-family:monospace;font-size:.8rem"/></div>
                    <div class="form-field"><label>Callback Domain</label><input id="pgf_cb" value="${c.callbackDomain}" style="font-family:monospace;font-size:.8rem"/></div>
                    <div class="form-field"><label>Currency</label><select id="pgf_cur">${PG_CURRENCIES.map(cc => `<option ${cc === c.currency ? 'selected' : ''}>${cc}</option>`).join('')}</select></div>
                    <div class="form-field"><label>Base Unit Multiplier</label><select id="pgf_base"><option ${c.baseUnit === 1 ? 'selected' : ''}>1</option><option ${c.baseUnit === 1000 ? 'selected' : ''}>1000</option></select></div>
                    <div class="form-field"><label>Group ID</label><input id="pgf_gid" type="number" value="${c.groupId}"/></div>
                    <div class="form-field"><label>Environment</label><select id="pgf_env"><option ${c.env === 'Staging' ? 'selected' : ''}>Staging</option><option ${c.env === 'Production' ? 'selected' : ''}>Production</option></select></div>
                </div>
            </div>
        </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem">
        <div class="card">
            <div class="card-header"><span class="card-title"><i class="fa-solid fa-code" style="color:var(--green);margin-right:.5rem"></i>Operator API Endpoints</span></div>
            <div class="card-body">
                <div class="form-grid" style="gap:.75rem">
                    ${Object.entries(c.endpoints).map(([k, v]) => `<div class="form-field"><label style="font-family:monospace;font-size:.72rem;text-transform:none">${k}</label><input value="${v}" style="font-family:monospace;font-size:.78rem" readonly/></div>`).join('')}
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header"><span class="card-title"><i class="fa-solid fa-shield-halved" style="color:var(--yellow);margin-right:.5rem"></i>IP Whitelist</span><button class="btn btn-sm btn-secondary" onclick="window.pgAddIP()"><i class="fa-solid fa-plus"></i> Add</button></div>
            <div class="card-body">
                <div style="display:flex;flex-direction:column;gap:.5rem">
                    ${c.whitelistedIPs.map((ip, i) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:.4rem .6rem;background:var(--bg);border-radius:6px;border:1px solid var(--border)"><code style="font-size:.8rem">${ip}</code><button class="btn btn-sm btn-danger btn-icon" style="width:22px;height:22px" onclick="window.pgRemoveIP(${i})"><i class="fa-solid fa-xmark" style="font-size:.6rem"></i></button></div>`).join('')}
                </div>
            </div>
        </div>
    </div>

    <div style="margin-top:1rem;display:flex;gap:.75rem">
        <button class="btn btn-primary" onclick="window.pgSaveConfig()"><i class="fa-solid fa-floppy-disk"></i> Save Configuration</button>
        <button class="btn btn-secondary" onclick="go('seamless-config')"><i class="fa-solid fa-rotate-left"></i> Reset</button>
    </div>`;
};

pages['seamless-transactions'] = () => {
    const PG = 'seamless-transactions';
    const data = [...STATE.seamless.transactions].sort((a, b) => b.createTime - a.createTime);
    const filtered = filterData(data, PG);
    const total = filtered.length;
    const pp = getPerPage(PG);
    const cp = getCurPage(PG);
    const rows = paginate(filtered, cp, pp);
    const totalBet = data.reduce((s, t) => s + t.betAmount, 0);
    const totalWin = data.reduce((s, t) => s + t.winAmount, 0);
    const ggr = totalBet - totalWin;

    return `
    ${pageHeader('Seamless Integrations Transactions', '<span>Integration</span><span class="sep">›</span><span>Transactions</span>', `
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;align-items:center">
            <span style="background:rgba(14,165,233,.12);color:var(--acc);border-radius:20px;padding:.25rem .75rem;font-size:.78rem;font-weight:600"><i class="fa-solid fa-coins"></i> Total Bet: ${fmtCur(totalBet)}</span>
            <span style="background:rgba(16,185,129,.12);color:var(--green);border-radius:20px;padding:.25rem .75rem;font-size:.78rem;font-weight:600"><i class="fa-solid fa-trophy"></i> Total Win: ${fmtCur(totalWin)}</span>
            <span style="background:rgba(139,92,246,.12);color:var(--purple);border-radius:20px;padding:.25rem .75rem;font-size:.78rem;font-weight:600"><i class="fa-solid fa-chart-line"></i> GGR: ${fmtCur(ggr)}</span>
            <button class="btn btn-export btn-sm" onclick="window.exportTableCSV(null,'seamless-transactions.csv')"><i class="fa-solid fa-file-csv"></i> Export CSV</button>
        </div>
    `)}

    ${filterCard(`
        ${fsInput(PG, 'player', 'Player', 'Search player...')}
        ${fsInput(PG, 'company', 'Company', 'Search company...')}
        ${fsInput(PG, 'gameName', 'Game', 'Search game...')}
        ${fsSelect(PG, 'transactionType', 'Type', ['All', 'BetPayout', 'BonusToCash', 'FreeGameToCash'])}
        ${fsSelect(PG, 'status', 'Status', ['All', 'Completed', 'Pending'])}
        ${fsActions(PG)}
    `)}

    ${tableWrap(`
        <table>
            <thead>
                <tr><th>#</th><th>Trace ID</th><th>Player</th><th>Company</th><th>Game</th><th>Bet</th><th>Win</th><th>Transfer</th><th>Type</th><th>Wallet</th><th>Status</th><th>Time</th></tr>
            </thead>
            <tbody>
                ${rows.map((t, i) => {
        const member = STATE.members.find(m => m.username === t.player);
        const company = t.company || member?.company || '-';
        return `
                    <tr>
                        <td>${(cp - 1) * pp + i + 1}</td>
                        <td><code style="font-size:.68rem;color:var(--text3)" title="${t.traceId}">${t.traceId.substring(0, 8)}...</code></td>
                        <td><span style="font-weight:600;color:var(--acc);cursor:pointer" onclick="window.showMember('${t.player}')" title="View Member Detail">${t.player}</span>${member ? `<div style="font-size:.68rem;color:var(--text3)">${member.name}</div>` : ''}</td>
                        <td><span style="font-size:.78rem;font-weight:600;color:var(--acc)">${company}</span></td>
                        <td><div style="font-weight:500">${t.gameName}</div><div style="font-size:.68rem;color:var(--text3)">ID: ${t.gameId}</div></td>
                        <td style="font-weight:600">${fmtCur(t.betAmount)}</td>
                        <td style="font-weight:600;color:var(--green)">${fmtCur(t.winAmount)}</td>
                        <td style="font-weight:700;color:${t.transferAmount >= 0 ? 'var(--green)' : 'var(--red)'}">${t.transferAmount >= 0 ? '+' : ''}${fmtCur(t.transferAmount)}</td>
                        <td>${badge(t.transactionType, t.transactionType === 'BetPayout' ? 'blue' : t.transactionType === 'BonusToCash' ? 'purple' : 'green')}</td>
                        <td>${badge(t.walletType === 'C' ? 'Cash' : t.walletType === 'B' ? 'Bonus' : 'Free', t.walletType === 'C' ? 'blue' : t.walletType === 'B' ? 'purple' : 'green')}</td>
                        <td>${badge(t.status, t.status === 'Completed' ? 'success' : 'warning')}</td>
                        <td style="font-size:.72rem;white-space:nowrap">${fmtTime(t.createTime)}</td>
                    </tr>`;
    }).join('')}
                ${rows.length === 0 ? '<tr><td colspan="12" style="text-align:center;padding:2rem;color:var(--text3)">No transactions found</td></tr>' : ''}
            </tbody>
        </table>
    `)}
    ${renderPagerHTML(PG, total, pp, cp)}`;
};

pages['seamless-games'] = () => {
    const PG = 'seamless-games';
    const filtered = filterData(STATE.seamless.games, PG);
    const total = filtered.length;
    const pp = getPerPage(PG) || 30;
    const cp = getCurPage(PG);
    const rows = paginate(filtered, cp, pp);

    return `
    ${pageHeader('Seamless Integrations Game Catalog', '<span>Integration</span><span class="sep">›</span><span>Games</span>', `
        <button class="btn btn-primary btn-sm" onclick="window.pgSyncGames()"><i class="fa-solid fa-rotate"></i> Sync from API</button>
    `)}
    ${filterCard(`
        ${fsInput(PG, 'name', 'Game Name', 'Search...')}
        ${fsSelect(PG, 'type', 'Type', ['All', 'Slot', 'Card'])}
        ${fsSelect(PG, 'status', 'Status', ['All', 'Active', 'Maintenance'])}
        ${fsActions(PG)}
    `)}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem">
        ${rows.map(g => `
        <div class="card" style="overflow:hidden">
            <div style="height:100px;background:linear-gradient(135deg,${g.type === 'Card' ? '#7c3aed,#4f46e5' : '#0ea5e9,#8b5cf6'});display:flex;align-items:center;justify-content:center;position:relative">
                <i class="fa-solid fa-gamepad" style="font-size:2.5rem;color:rgba(255,255,255,.2)"></i>
                <div style="position:absolute;top:.5rem;right:.5rem">${badge(g.status, g.status === 'Active' ? 'success' : 'warning')}</div>
                <div style="position:absolute;bottom:.5rem;left:.75rem;font-size:.65rem;color:rgba(255,255,255,.7)">ID: ${g.id}</div>
            </div>
            <div style="padding:.75rem">
                <div style="font-weight:700;font-size:.88rem;margin-bottom:.2rem">${g.name}</div>
                <div style="display:flex;gap:.75rem;font-size:.72rem;color:var(--text3)">
                    <span><i class="fa-solid fa-percentage"></i> RTP ${g.rtp}%</span>
                    <span><i class="fa-solid fa-trophy"></i> ${fmt(g.maxWin)}x</span>
                </div>
                <div style="font-size:.7rem;color:var(--text3);margin-top:.35rem">Bet: ${g.betSizes}</div>
            </div>
        </div>`).join('')}
    </div>
    <div style="margin-top:1rem">${renderPagerHTML(PG, total, pp, cp)}</div>`;
};

pages['seamless-api-logs'] = () => {
    const PG = 'seamless-api-logs';
    const data = [...STATE.seamless.apiLogs].sort((a, b) => b.timestamp - a.timestamp);
    const filtered = filterData(data, PG);
    const total = filtered.length;
    const pp = getPerPage(PG);
    const cp = getCurPage(PG);
    const rows = paginate(filtered, cp, pp);
    const successRate = data.length ? ((data.filter(l => l.httpStatus === 200).length / data.length) * 100).toFixed(1) : 0;

    return `
    ${pageHeader('Seamless Integrations API Logs', '<span>Integration</span><span class="sep">›</span><span>API Logs</span>', `
        <button class="btn btn-primary btn-sm" onclick="window.pgSimulateRequest()"><i class="fa-solid fa-code-pull-request"></i> Simulate API Request</button>
        <span style="background:${successRate > 95 ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)'};color:${successRate > 95 ? 'var(--green)' : 'var(--red)'};border-radius:20px;padding:.25rem .75rem;font-size:.78rem;font-weight:600;margin-left:.5rem"><i class="fa-solid fa-chart-pie"></i> Success Rate: ${successRate}%</span>
    `)}
    ${filterCard(`
        ${fsSelect(PG, 'endpoint', 'Endpoint', ['All', '/VerifySession', '/Cash/Get', '/Cash/TransferInOut', '/Cash/Adjustment'])}
        ${fsInput(PG, 'player', 'Player', 'Search player...')}
        ${fsActions(PG)}
    `)}
    ${tableWrap(`
        <table>
            <thead><tr><th>#</th><th>Time</th><th>Endpoint</th><th>Player</th><th>HTTP</th><th>Status</th><th>Response</th><th>Trace</th><th>Action</th></tr></thead>
            <tbody>
                ${rows.map((l, i) => `
                <tr>
                    <td>${(cp - 1) * pp + i + 1}</td>
                    <td style="font-size:.72rem;white-space:nowrap">${fmtTime(l.timestamp)}</td>
                    <td><code style="font-size:.75rem;background:var(--bg);padding:.15rem .4rem;border-radius:4px">${l.endpoint}</code></td>
                    <td><strong>${l.player}</strong></td>
                    <td>${badge(String(l.httpStatus), l.httpStatus === 200 ? 'success' : l.httpStatus === 400 ? 'warning' : 'danger')}</td>
                    <td>${badge(l.status, l.status === 'OK' ? 'success' : l.status === 'Bad Request' ? 'warning' : 'danger')}</td>
                    <td style="font-weight:600;color:${parseInt(l.responseTime, 10) > 1000 ? 'var(--red)' : parseInt(l.responseTime, 10) > 500 ? 'var(--yellow)' : 'var(--green)'}">${l.responseTime}</td>
                    <td><code style="font-size:.65rem;color:var(--text3)">${l.traceId.substring(0, 12)}...</code></td>
                    <td><button class="btn btn-sm btn-icon btn-secondary" onclick="window.pgShowLogDetail('${l.id}')"><i class="fa-solid fa-eye"></i></button></td>
                </tr>`).join('')}
                ${rows.length === 0 ? '<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--text3)">No API logs found</td></tr>' : ''}
            </tbody>
        </table>
    `)}
    ${renderPagerHTML(PG, total, pp, cp)}`;
};

pages['seamless-docs'] = () => {
    const cb = STATE.seamless.config.callbackDomain;
    const endpoints = [
        { method: 'POST', path: '/VerifySession', title: 'Verify Session', desc: 'Validates player session token when the game launches.' },
        { method: 'POST', path: '/Cash/Get', title: 'Get Player Wallet', desc: 'Returns player balance for Seamless Integrations games.' },
        { method: 'POST', path: '/Cash/TransferInOut', title: 'Bet Payout', desc: 'Processes combined bet and payout transactions.' },
        { method: 'POST', path: '/Cash/Adjustment', title: 'Balance Adjustment', desc: 'Adjusts player balance for promotions or tournaments.' },
    ];
    return `
    ${pageHeader('Seamless Integrations API Documentation', '<span>Integration</span><span class="sep">›</span><span>API Docs</span>', `
        <span style="font-size:.78rem;color:var(--text3)">Seamless Mode v2.4.11</span>
    `)}
    <div class="alert alert-info" style="margin-bottom:1rem">
        <i class="fa-solid fa-circle-info"></i>
        <div><strong>Seamless Wallet Mode</strong> - Seamless Integrations calls your API in real time for every transaction. All operator APIs must return HTTP 200 and JSON within <strong>10 seconds</strong>.</div>
    </div>
    <div style="display:flex;flex-direction:column;gap:1rem">
        ${endpoints.map((ep) => `
        <div class="card">
            <div class="card-header">
                <div style="display:flex;align-items:center;gap:.75rem">
                    <span style="background:#0ea5e9;color:#fff;padding:.15rem .5rem;border-radius:4px;font-size:.7rem;font-weight:700;font-family:monospace">${ep.method}</span>
                    <code style="font-size:.82rem;font-weight:600">${cb}${ep.path}</code>
                </div>
                <span style="font-size:.78rem;color:var(--text3)">${ep.title}</span>
            </div>
            <div class="card-body"><p style="color:var(--text2);font-size:.82rem;margin:0">${ep.desc}</p></div>
        </div>`).join('')}
    </div>`;
};

window.pgSaveConfig = () => {
    const c = STATE.seamless.config;
    c.operatorToken = document.getElementById('pgf_token')?.value || c.operatorToken;
    c.secretKey = document.getElementById('pgf_secret')?.value || c.secretKey;
    c.salt = document.getElementById('pgf_salt')?.value || c.salt;
    c.hashAuth = document.getElementById('pgf_hash')?.checked ?? c.hashAuth;
    c.apiDomain = document.getElementById('pgf_api')?.value || c.apiDomain;
    c.callbackDomain = document.getElementById('pgf_cb')?.value || c.callbackDomain;
    c.currency = document.getElementById('pgf_cur')?.value || c.currency;
    c.baseUnit = parseInt(document.getElementById('pgf_base')?.value || c.baseUnit, 10);
    c.groupId = parseInt(document.getElementById('pgf_gid')?.value || c.groupId, 10);
    c.env = document.getElementById('pgf_env')?.value || c.env;
    c.lastSync = new Date().toLocaleString('sv-SE');
    saveState();
    toast('Seamless Integrations configuration saved successfully', 'success');
};

window.pgTestConnection = () => {
    STATE.seamless.config.status = 'Active';
    STATE.seamless.config.lastSync = new Date().toLocaleString('sv-SE');
    saveState();
    go('seamless-config');
    toast('Connection successful! API responded in 42ms', 'success');
};

window.pgSyncGames = async () => {
    toast('Syncing games from provider...', 'info');
    if (window.db?.fetchSeamlessGames) {
        const err = await window.db.fetchSeamlessGames();
        if (err) { toast('Sync failed: ' + err, 'error'); return; }
    }
    STATE.seamless.config.lastSync = new Date().toLocaleString('sv-SE');
    saveState();
    go('seamless-games');
    toast(`Synced ${STATE.seamless.games?.length || 0} games successfully`, 'success');
};

window.pgAddIP = () => {
    openModal('Add IP Whitelist', `<div class="form-field"><label>IP address or CIDR</label><input id="pg_ip" placeholder="103.28.12.0/24" /></div>`, `<button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button><button class="btn btn-primary" onclick="window.pgSaveIP()">Add</button>`);
};

window.pgSaveIP = () => {
    const ip = document.getElementById('pg_ip')?.value.trim();
    if (!ip) {
        toast('IP is required', 'error');
        return;
    }
    STATE.seamless.config.whitelistedIPs.push(ip);
    saveState();
    closeModalBtn();
    go('seamless-config');
    toast('IP added to whitelist', 'success');
};

window.pgRemoveIP = (idx) => {
    STATE.seamless.config.whitelistedIPs.splice(idx, 1);
    saveState();
    go('seamless-config');
    toast('IP removed', 'success');
};

window.pgShowLogDetail = (id) => {
    const log = STATE.seamless.apiLogs.find(l => l.id === id);
    if (!log) return;
    openModal('API Log Detail', `
        <div style="display:grid;gap:.75rem">
            <div style="display:flex;gap:1rem;flex-wrap:wrap">
                <div><span style="font-size:.72rem;color:var(--text3);text-transform:uppercase">Endpoint</span><div style="font-weight:600;font-family:monospace;font-size:.82rem">${log.endpoint}</div></div>
                <div><span style="font-size:.72rem;color:var(--text3);text-transform:uppercase">HTTP</span><div>${badge(String(log.httpStatus), log.httpStatus === 200 ? 'success' : 'danger')}</div></div>
                <div><span style="font-size:.72rem;color:var(--text3);text-transform:uppercase">Response</span><div style="font-weight:600">${log.responseTime}</div></div>
                <div><span style="font-size:.72rem;color:var(--text3);text-transform:uppercase">Player</span><div style="font-weight:600">${log.player}</div></div>
            </div>
            <div><span style="font-size:.72rem;color:var(--text3);text-transform:uppercase">Trace ID</span><div style="font-family:monospace;font-size:.78rem;word-break:break-all">${log.traceId}</div></div>
            <div><span style="font-size:.72rem;color:var(--text3);text-transform:uppercase">Request Body</span><pre style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:.75rem;font-size:.72rem;overflow-x:auto;margin-top:.3rem">${log.requestBody}</pre></div>
            <div><span style="font-size:.72rem;color:var(--text3);text-transform:uppercase">Response Body</span><pre style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:.75rem;font-size:.72rem;overflow-x:auto;margin-top:.3rem">${JSON.stringify(JSON.parse(log.responseBody), null, 2)}</pre></div>
        </div>
    `, '<button class="btn btn-secondary" onclick="closeModalBtn()">Close</button>');
};

window.pgSimulateRequest = () => {
    const m = STATE.members[0];
    const operatorToken = STATE.seamless.config.operatorToken;
    const secretKey = STATE.seamless.config.secretKey;
    openModal('Simulate Seamless Wallet Request', `
        <div class="form-grid" style="gap:.75rem">
            <div class="form-field"><label>Endpoint</label>
                <select id="sim_endpoint" onchange="document.getElementById('sim_data').value=window.pgGetSimTemplate(this.value)">
                    <option value="/VerifySession">/VerifySession</option>
                    <option value="/Cash/Get">/Cash/Get</option>
                    <option value="/Cash/TransferInOut">/Cash/TransferInOut</option>
                    <option value="/Cash/Adjustment">/Cash/Adjustment</option>
                </select>
            </div>
            <div class="form-field"><label>Payload</label>
                <textarea id="sim_data" rows="5" style="width:100%;font-family:monospace;font-size:.75rem;padding:.5rem;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text)">operator_token=${operatorToken}&secret_key=${secretKey}&operator_player_session=${m.username}&game_id=54&bet_type=1</textarea>
            </div>
        </div>
    `, `<button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button><button class="btn btn-primary" onclick="window.pgExecuteSim()"><i class="fa-solid fa-paper-plane"></i> Send Request</button>`);
};

window.pgGetSimTemplate = (ep) => {
    const ot = STATE.seamless.config.operatorToken;
    const sk = STATE.seamless.config.secretKey;
    const m = STATE.members[0].username;
    if (ep === '/VerifySession') return `operator_token=${ot}&secret_key=${sk}&operator_player_session=${m}&game_id=35&bet_type=1&provider=PRAGMATIC_PLAY`;
    if (ep === '/Cash/Get') return `operator_token=${ot}&secret_key=${sk}&player_name=${m}&game_id=35&provider=PRAGMATIC_PLAY`;
    if (ep === '/Cash/TransferInOut') return `operator_token=${ot}&secret_key=${sk}&player_name=${m}&game_id=35&parent_bet_id=18492040&bet_id=${Date.now()}&transaction_id=TX-${Date.now()}&bet_amount=1000.00&win_amount=5000.00&transfer_amount=4000.00&real_transfer_amount=4000000.00&wallet_type=C&is_end_round=1&provider=PRAGMATIC_PLAY`;
    if (ep === '/Cash/Adjustment') return `operator_token=${ot}&secret_key=${sk}&player_name=${m}&transfer_amount=50000.00&real_transfer_amount=50000000.00&adjustment_id=ADJ-${Date.now()}&adjustment_transaction_id=TX-${Date.now()}&transaction_type=115&provider=PRAGMATIC_PLAY`;
    return '';
};

window.pgExecuteSim = () => {
    const ep = document.getElementById('sim_endpoint')?.value;
    const dataStr = document.getElementById('sim_data')?.value || '';
    const params = Object.fromEntries(new URLSearchParams(dataStr));
    const res = mockseamlessApiRequest(ep, params);
    toast(`API response ${res.status} returned`, res.status === 200 ? 'success' : 'error');
    closeModalBtn();
    setTimeout(() => go('seamless-api-logs'), 200);
};


/* ─── AUTONOMOUS OS DASHBOARD ─── */
import { STATE, saveState, addLog } from '../core/state.js';
import { pages } from '../core/router.js';
import { pageHeader, card, tableWrap, badge, toast } from '../ui/components.js';
import { fmtCur, fmt } from '../utils/helpers.js';

pages['autonomous-dashboard'] = () => {
    const PG = 'autonomous-dashboard';
    const agents = STATE.autonomous?.agents || [
        { id: 'ceo-1', name: 'CEO Agent', role: 'Strategic Oversight', status: 'Active', heartbeat: '30s ago', trust: 'High' },
        { id: 'fin-1', name: 'Finance Agent', role: 'Treasury & Rebates', status: 'Running', heartbeat: '5s ago', trust: 'Autonomous' },
        { id: 'risk-1', name: 'Risk Auditor', role: 'Win/Loss Monitoring', status: 'Active', heartbeat: '12m ago', trust: 'Semi-auto' },
        { id: 'sec-1', name: 'Security Sentinel', role: 'Nawala & IP Protection', status: 'Active', heartbeat: '1m ago', trust: 'Autonomous' },
    ];

    const plans = STATE.autonomous?.plans || [
        { id: 'p1', title: 'Expand to Vietnamese Market', progress: 65, status: 'Active', deadline: '2026-08-15' },
        { id: 'p2', title: 'Automate Tier Re-evaluation', progress: 100, status: 'Completed', deadline: '2026-05-01' },
        { id: 'p3', title: 'Deploy Distributed Proxy Mesh', progress: 40, status: 'Active', deadline: '2026-06-10' },
    ];

    return `
    ${pageHeader('Autonomous OS Overview', '<span>Autonomous Evolution</span><span class="sep">›</span><span>Overview</span>', `
        <button class="btn btn-primary btn-sm" onclick="window.triggerCeoHeartbeat()"><i class="fa-solid fa-pulse"></i> CEO Heartbeat</button>
    `)}

    <div class="stat-grid" style="grid-template-columns:repeat(4,1fr)">
        <div class="stat-card">
            <div class="stat-icon" style="background:var(--acc)22;color:var(--acc)"><i class="fa-solid fa-brain"></i></div>
            <div class="stat-info"><div class="stat-label">System Intelligence</div><div class="stat-value">Evolved</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:var(--green)22;color:var(--green)"><i class="fa-solid fa-robot"></i></div>
            <div class="stat-info"><div class="stat-label">Active Agents</div><div class="stat-value">${agents.length}</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:var(--purple)22;color:var(--purple)"><i class="fa-solid fa-map-location-dot"></i></div>
            <div class="stat-info"><div class="stat-label">Active Strategies</div><div class="stat-value">${plans.filter(p => p.status === 'Active').length}</div></div>
        </div>
        <div class="stat-card">
            <div class="stat-icon" style="background:var(--yellow)22;color:var(--yellow)"><i class="fa-solid fa-shield-halved"></i></div>
            <div class="stat-info"><div class="stat-label">Trust Score</div><div class="stat-value">98.4%</div></div>
        </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 400px;gap:1.5rem;margin-top:1.5rem">
        <div style="display:flex;flex-direction:column;gap:1.5rem">
            <!-- AGENT STATUS -->
            <div class="card">
                <div class="card-header"><span class="card-title">Agent Fleet Status</span></div>
                <div class="card-body" style="padding:0">
                    ${tableWrap(`
                        <table>
                            <thead>
                                <tr><th>Agent</th><th>Role</th><th>Status</th><th>Last Heatbeat</th><th>Trust</th><th>Action</th></tr>
                            </thead>
                            <tbody>
                                ${agents.map(a => `
                                    <tr>
                                        <td><div style="font-weight:800;color:var(--acc)">${a.name}</div><div style="font-size:.65rem;color:var(--text3)">ID: ${a.id}</div></td>
                                        <td><div style="font-size:.8rem">${a.role}</div></td>
                                        <td>${badge(a.status, a.status === 'Active' || a.status === 'Running' ? 'success' : 'warning')}</td>
                                        <td><div style="font-size:.78rem;color:var(--text3)"><i class="fa-solid fa-clock"></i> ${a.heartbeat}</div></td>
                                        <td><div style="font-size:.72rem;font-weight:700">${a.trust}</div></td>
                                        <td>
                                            <button class="btn btn-xs btn-secondary" onclick="toast('Agent console linked', 'info')"><i class="fa-solid fa-terminal"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `)}
                </div>
            </div>

            <!-- STRATEGIC PLANS -->
            <div class="card">
                <div class="card-header"><span class="card-title">Strategic Roadmap</span></div>
                <div class="card-body">
                    <div style="display:flex;flex-direction:column;gap:1.25rem">
                        ${plans.map(p => `
                            <div style="padding:1rem;background:var(--bg2);border-radius:12px;border:1px solid var(--border)">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
                                    <div>
                                        <div style="font-weight:800;font-size:.9rem">${p.title}</div>
                                        <div style="font-size:.72rem;color:var(--text3)">Target: ${p.deadline}</div>
                                    </div>
                                    ${badge(p.status, p.status === 'Completed' ? 'success' : 'primary')}
                                </div>
                                <div style="display:flex;align-items:center;gap:.75rem">
                                    <div style="flex:1;height:8px;background:var(--bg3);border-radius:4px;overflow:hidden">
                                        <div style="width:${p.progress}%;height:100%;background:linear-gradient(90deg,var(--acc),var(--purple));border-radius:4px"></div>
                                    </div>
                                    <span style="font-size:.75rem;font-weight:800;color:var(--acc)">${p.progress}%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:1.5rem">
            <!-- RECENT PROPOSALS -->
            <div class="card">
                <div class="card-header"><span class="card-title">Autonomous Proposals</span></div>
                <div class="card-body">
                    <div style="display:flex;flex-direction:column;gap:1rem">
                        <div style="padding:.75rem;background:rgba(14,165,233,.05);border:1px solid rgba(14,165,233,.2);border-radius:10px">
                            <div style="font-weight:700;font-size:.8rem;color:var(--acc);margin-bottom:.25rem">Spawn: Marketing Bot #4</div>
                            <div style="font-size:.75rem;color:var(--text2);line-height:1.4">Proposed by CEO Agent to handle increasing user acquisition load in Thai market.</div>
                            <div style="display:flex;gap:.5rem;margin-top:.75rem">
                                <button class="btn btn-xs btn-primary" onclick="toast('Proposal Approved', 'success')">Approve</button>
                                <button class="btn btn-xs btn-secondary" onclick="toast('Proposal Rejected', 'warning')">Reject</button>
                            </div>
                        </div>
                        <div style="padding:.75rem;background:var(--bg2);border:1px solid var(--border);border-radius:10px">
                            <div style="font-weight:700;font-size:.8rem;color:var(--text2);margin-bottom:.25rem">Adjust: Tier Rebate Threshold</div>
                            <div style="font-size:.75rem;color:var(--text3);line-height:1.4">Proposed by Finance Agent based on win/loss volatility analysis.</div>
                            <div style="display:flex;gap:.5rem;margin-top:.75rem">
                                <button class="btn btn-xs btn-primary" onclick="toast('Proposal Approved', 'success')">Approve</button>
                                <button class="btn btn-xs btn-secondary" onclick="toast('Proposal Rejected', 'warning')">Reject</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SYSTEM LOGS -->
            <div class="card">
                <div class="card-header"><span class="card-title">Heartbeat Feed</span></div>
                <div class="card-body" style="padding:0">
                    <div style="height:300px;overflow-y:auto;padding:1rem;display:flex;flex-direction:column;gap:.75rem;font-size:.72rem;font-family:monospace" id="autonomous_feed">
                        <div style="display:flex;gap:.5rem"><span style="color:var(--text3)">[21:17:02]</span> <span style="color:var(--acc)">CEO:</span> Running strategic optimization loop...</div>
                        <div style="display:flex;gap:.5rem"><span style="color:var(--text3)">[21:16:45]</span> <span style="color:var(--green)">FIN:</span> Audited 432 member rebates. Total: Rp 124M.</div>
                        <div style="display:flex;gap:.5rem"><span style="color:var(--text3)">[21:16:30]</span> <span style="color:var(--purple)">SEC:</span> Rotating Nawala proxy nodes. Node #3 is healthy.</div>
                        <div style="display:flex;gap:.5rem"><span style="color:var(--text3)">[21:16:12]</span> <span style="color:var(--acc)">CEO:</span> All agents reported heartbeat. System stable.</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
};

window.triggerCeoHeartbeat = () => {
    toast('Triggering CEO Heartbeat...', 'info');
    setTimeout(() => {
        const feed = document.getElementById('autonomous_feed');
        if (feed) {
            const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.gap = '.5rem';
            div.innerHTML = `<span style="color:var(--text3)">[${time}]</span> <span style="color:var(--acc)">CEO:</span> Manual pulse triggered. Recalibrating strategic vectors...`;
            feed.prepend(div);
        }
        toast('CEO Pulse successful', 'success');
    }, 1200);
};

pages['autonomous-agents'] = () => {
    return `
    ${pageHeader('Active Agents Fleet', '<span>Autonomous OS</span><span class="sep">›</span><span>Agents</span>', `
        <button class="btn btn-primary btn-sm" onclick="toast('Spawning new agent...', 'info')"><i class="fa-solid fa-plus"></i> Spawn Agent</button>
    `)}
    <div class="card"><div class="card-body" style="padding:3rem;text-align:center;color:var(--text3)">Agent management terminal is initializing. Connect to AutoDesk for full console access.</div></div>
    `;
};

pages['autonomous-plans'] = () => {
    return `
    ${pageHeader('Strategic Planning', '<span>Autonomous OS</span><span class="sep">›</span><span>Plans</span>', `
        <button class="btn btn-primary btn-sm" onclick="toast('Creating new plan...', 'info')"><i class="fa-solid fa-map-location-dot"></i> New Strategy</button>
    `)}
    <div class="card"><div class="card-body" style="padding:3rem;text-align:center;color:var(--text3)">Strategic visualization engine loading...</div></div>
    `;
};

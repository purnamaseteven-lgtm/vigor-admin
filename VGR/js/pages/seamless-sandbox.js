/* ─── SEAMLESS API SANDBOX ─── */
import { pages } from '../core/router.js';
import { pageHeader, toast } from '../ui/components.js';
import { STATE } from '../core/state.js';

pages['seamless-sandbox'] = () => {
    return `
        ${pageHeader('API Sandbox', '<span>Seamless Integration</span><span class="sep">›</span><span>API Sandbox</span>')}

        <div style="display:grid;grid-template-columns:1fr 2fr;gap:1.5rem">
            <!-- Sandbox Controls -->
            <div class="card">
                <div class="card-header"><span class="card-title">Test Parameters</span></div>
                <div class="card-body">
                    <div class="form-group" style="margin-bottom:1rem">
                        <label>Provider</label>
                        <select class="form-control" id="sandboxProvider">
                            <option value="pgsoft">PG Soft</option>
                            <option value="pragmatic">Pragmatic Play</option>
                            <option value="evolution">Evolution Gaming</option>
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:1rem">
                        <label>Player Username</label>
                        <input type="text" class="form-control" id="sandboxPlayer" value="Player007">
                    </div>
                    <div class="form-group" style="margin-bottom:1.5rem">
                        <label>Simulation Action</label>
                        <select class="form-control" id="sandboxAction">
                            <option value="ping">Ping (Connectivity Check)</option>
                            <option value="getBalance">GetBalance (Wallet Check)</option>
                            <option value="kickPlayer">KickPlayer (Session Force Close)</option>
                            <option value="bet">Simulate Bet (Transfer)</option>
                        </select>
                    </div>
                    <button class="btn btn-primary w-full" onclick="window.runSandboxTest()">
                        <i class="fa-solid fa-play"></i> Execute Test
                    </button>
                </div>
            </div>

            <!-- Sandbox Output -->
            <div class="card">
                <div class="card-header">
                    <span class="card-title">API Response Log</span>
                    <button class="btn btn-xs btn-secondary" style="margin-left:auto" onclick="document.getElementById('sandboxLog').innerHTML=''">Clear</button>
                </div>
                <div class="card-body" id="sandboxLog" style="height:400px; overflow-y:auto; background:#000; color:#0f0; font-family:monospace; font-size:.75rem; padding:1rem; border-radius:8px">
                    <div style="opacity:0.5">// Ready for simulation...</div>
                </div>
            </div>
        </div>
    `;
};

window.runSandboxTest = async () => {
    const provider = document.getElementById('sandboxProvider').value;
    const action = document.getElementById('sandboxAction').value;
    const player = document.getElementById('sandboxPlayer').value;
    const log = document.getElementById('sandboxLog');

    const addLog = (msg, type = 'info') => {
        const d = new Date().toLocaleTimeString();
        const color = type === 'error' ? '#f00' : (type === 'success' ? '#0f0' : '#fff');
        log.innerHTML += `<div style="margin-bottom:.25rem;color:${color}">[${d}] [${provider}] ${msg}</div>`;
        log.scrollTop = log.scrollHeight;
    };

    addLog(`Initiating ${action} request for ${player}...`);
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 800));

    try {
        if (action === 'ping') {
            addLog(`SUCCESS: Connection to ${provider} API Gateway established.`, 'success');
            addLog(`Latency: ${Math.floor(Math.random() * 50) + 20}ms`);
        } else if (action === 'getBalance') {
            const balance = 2847000;
            addLog(`SUCCESS: Wallet balance for ${player} is Rp ${balance.toLocaleString()}`, 'success');
            addLog(`{ "status": 200, "balance": ${balance}, "currency": "IDR" }`);
        } else if (action === 'kickPlayer') {
            addLog(`SUCCESS: Session for ${player} has been terminated.`, 'success');
        } else if (action === 'bet') {
            addLog(`SUCCESS: Bet of Rp 10.000 processed for ${player}.`, 'success');
            addLog(`TraceID: TX-${Date.now()}`);
        }
        toast(`${action} test completed successfully`, 'success');
    } catch (e) {
        addLog(`ERROR: ${e.message}`, 'error');
        toast(`Sandbox test failed`, 'error');
    }
};

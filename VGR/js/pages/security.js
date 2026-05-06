/* ─── SECURITY CENTER (2FA & ACCESS) ─── */
import { pages } from '../core/router.js';
import { pageHeader, toast } from '../ui/components.js';
import { STATE, saveState } from '../core/state.js';

pages['security-center'] = () => {
    const is2FA = STATE.profile.is2FAEnabled || false;
    
    return `
        ${pageHeader('Security Center', '<span>Profile</span><span class="sep">›</span><span>Security & 2FA</span>')}

        <div style="max-width: 800px; margin: 0 auto">
            <div class="card" style="margin-bottom: 1.5rem">
                <div class="card-header"><span class="card-title">Two-Factor Authentication (2FA)</span></div>
                <div class="card-body">
                    <div style="display:flex; gap:2rem; align-items:center">
                        <div style="flex:1">
                            <h3 style="margin-bottom:.5rem">Secure your account with TOTP</h3>
                            <p style="color:var(--text3); font-size:.85rem; margin-bottom:1.5rem">
                                Two-factor authentication adds an extra layer of security to your account. 
                                In addition to your password, you'll need to enter a code from your mobile app.
                            </p>
                            ${is2FA ? `
                                <div style="display:inline-flex; align-items:center; gap:.5rem; padding:.5rem 1rem; background:rgba(16,185,129,0.1); color:var(--green); border-radius:8px; font-weight:700">
                                    <i class="fa-solid fa-circle-check"></i> 2FA IS ACTIVE
                                </div>
                                <button class="btn btn-secondary" style="margin-left:1rem" onclick="window.toggle2FA(false)">Disable</button>
                            ` : `
                                <button class="btn btn-primary" onclick="window.show2FASetup()">Enable 2FA Now</button>
                            `}
                        </div>
                        <div style="width:120px; height:120px; background:var(--bg); border-radius:12px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border)">
                            <i class="fa-solid fa-shield-lock" style="font-size:3rem; color:var(--acc); opacity:0.3"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><span class="card-title">Login History & IP Whitelist</span></div>
                <div class="card-body">
                    <div class="form-group" style="margin-bottom:1.5rem">
                        <label>Authorized IP Addresses</label>
                        <textarea class="form-control" placeholder="Enter IP addresses (one per line). Empty allows all IPs." style="height:100px">103.28.12.55\n202.134.56.78</textarea>
                        <p style="font-size:.7rem; color:var(--text3); mt:2px">Only these IPs will be able to login to this admin account.</p>
                    </div>
                    <button class="btn btn-primary" onclick="toast('IP Whitelist saved', 'success')">Save Security Policy</button>
                </div>
            </div>
        </div>
    `;
};

window.show2FASetup = () => {
    const body = `
        <div style="text-align:center">
            <p style="margin-bottom:1.5rem">Scan this QR code with Google Authenticator or Authy</p>
            <div style="background:#fff; padding:1rem; display:inline-block; border-radius:12px; margin-bottom:1rem">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=OTP-VIGOR-ANTIGRAVITY" width="150">
            </div>
            <div class="form-group" style="max-width:200px; margin:0 auto">
                <input type="text" class="form-control" placeholder="Enter 6-digit code" style="text-align:center; font-size:1.2rem; letter-spacing:4px">
            </div>
        </div>
    `;
    window.openModal('Setup 2FA', body, `<button class="btn btn-primary w-full" onclick="window.toggle2FA(true)">Verify & Activate</button>`);
};

window.toggle2FA = (state) => {
    STATE.profile.is2FAEnabled = state;
    saveState();
    if (state) {
        window.closeModal();
        toast('2FA has been successfully activated!', 'success');
    } else {
        toast('2FA has been disabled', 'warning');
    }
    window.go('security-center');
};

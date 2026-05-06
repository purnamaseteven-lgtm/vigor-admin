/* ─── BRANDING & WHITELABEL SETTINGS ─── */
import { pages } from '../core/router.js';
import { pageHeader, toast } from '../ui/components.js';
import { STATE, saveState } from '../core/state.js';

pages['branding-settings'] = () => {
    const theme = STATE.theme || { primary: '#0ea5e9', accent: '#8b5cf6', radius: '10px' };
    
    return `
        ${pageHeader('Branding Settings', '<span>System Control</span><span class="sep">›</span><span>Whitelabel Branding</span>')}

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1.5rem">
            <!-- Form -->
            <div class="card">
                <div class="card-header"><span class="card-title">Brand Identity</span></div>
                <div class="card-body">
                    <div class="form-group" style="margin-bottom:1rem">
                        <label>Brand Name</label>
                        <input type="text" class="form-control" id="brandName" value="${STATE.profile.company.toUpperCase()}">
                    </div>
                    <div class="form-group" style="margin-bottom:1rem">
                        <label>Primary Color</label>
                        <div style="display:flex; gap:.5rem">
                            <input type="color" id="primaryColor" value="${theme.primary}" style="width:44px; height:44px; border:none; padding:0; background:none; cursor:pointer">
                            <input type="text" class="form-control" value="${theme.primary}" readonly>
                        </div>
                    </div>
                    <div class="form-group" style="margin-bottom:1rem">
                        <label>Accent Color</label>
                        <div style="display:flex; gap:.5rem">
                            <input type="color" id="accentColor" value="${theme.accent}" style="width:44px; height:44px; border:none; padding:0; background:none; cursor:pointer">
                            <input type="text" class="form-control" value="${theme.accent}" readonly>
                        </div>
                    </div>
                    <div class="form-group" style="margin-bottom:1.5rem">
                        <label>Border Radius (px)</label>
                        <input type="range" min="0" max="24" value="${parseInt(theme.radius)}" id="borderRadius" oninput="this.nextElementSibling.value = this.value + 'px'">
                        <output style="font-size:.8rem; margin-left:.5rem">${theme.radius}</output>
                    </div>
                    
                    <div class="form-group" style="margin-bottom:1.5rem">
                        <label>Logo Upload (PNG/SVG)</label>
                        <input type="file" id="logoUpload" style="display:none" accept="image/*" onchange="window.handleBrandingUpload(this, 'logo')">
                        <div id="logoDropzone" style="border:2px dashed var(--border); padding:2rem; text-align:center; border-radius:12px; cursor:pointer" onclick="document.getElementById('logoUpload').click()">
                            <i class="fa-solid fa-cloud-arrow-up" style="font-size:2rem; color:var(--text3); margin-bottom:1rem"></i>
                            <div style="font-size:.85rem; color:var(--text2)">Click to browse or drag & drop logo</div>
                            <div id="logoStatus" style="font-size:.7rem; color:var(--acc); margin-top:.5rem"></div>
                        </div>
                    </div>

                    <button class="btn btn-primary w-full" onclick="window.saveBranding()">
                        <i class="fa-solid fa-floppy-disk"></i> Apply & Save Branding
                    </button>
                </div>
            </div>

            <!-- Real-time Preview -->
            <div class="card">
                <div class="card-header"><span class="card-title">Live Preview</span></div>
                <div class="card-body" style="background:var(--bg); display:flex; justify-content:center; align-items:center; min-height:400px; padding:2rem">
                    <div id="brandingPreview" style="background:#fff; width:100%; max-width:320px; border-radius:${theme.radius}; overflow:hidden; box-shadow:var(--shadow-lg)">
                        <div style="background:${theme.primary}; padding:1rem; color:#fff; text-align:center; font-weight:800">
                            BRAND PREVIEW
                        </div>
                        <div style="padding:1.5rem">
                            <div style="font-weight:700; margin-bottom:.5rem">Login to your account</div>
                            <div style="height:32px; background:#f1f5f9; border-radius:4px; margin-bottom:1rem"></div>
                            <div style="height:32px; background:#f1f5f9; border-radius:4px; margin-bottom:1.5rem"></div>
                            <button style="width:100%; background:${theme.primary}; border:none; padding:.75rem; border-radius:6px; color:#fff; font-weight:700">SIGN IN</button>
                            <div style="text-align:center; margin-top:1rem; font-size:.7rem; color:${theme.accent}">Forgot Password?</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.handleBrandingUpload = async (input, type) => {
    const file = input.files[0];
    if (!file) return;

    const status = document.getElementById(`${type}Status`);
    status.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';

    try {
        const { supabase, SUPABASE_ENABLED } = await import('../core/supabase.js');
        if (!SUPABASE_ENABLED) {
            toast('Storage requires Supabase configuration', 'warning');
            status.textContent = 'Demo Mode: Upload Skipped';
            return;
        }

        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
            .from('branding')
            .upload(`logos/${fileName}`, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('branding')
            .getPublicUrl(data.path);

        STATE.theme[type] = publicUrl;
        saveState();

        status.innerHTML = `<i class="fa-solid fa-circle-check"></i> Uploaded: ${file.name}`;
        toast('Logo uploaded successfully', 'success');
        
        // Update preview image if exists
        const previewImg = document.getElementById('brandingPreviewImg');
        if (previewImg) previewImg.src = publicUrl;

    } catch (e) {
        console.error('[Branding] Upload failed:', e);
        status.innerHTML = `<span style="color:var(--red)">Upload failed: ${e.message}</span>`;
        toast('Upload failed', 'error');
    }
};

window.saveBranding = () => {
    const primary = document.getElementById('primaryColor').value;
    const accent = document.getElementById('accentColor').value;
    const radius = document.getElementById('borderRadius').value + 'px';
    
    STATE.theme = { ...STATE.theme, primary, accent, radius };
    saveState();
    
    document.documentElement.style.setProperty('--acc', primary);
    document.documentElement.style.setProperty('--radius', radius);
    
    toast('Branding settings applied successfully!', 'success');
    setTimeout(() => window.location.reload(), 1000);
};

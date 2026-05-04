/* ─── FRONTEND SIMULATOR ─── */
import { builderState } from '../builder/engine.js';
import { STATE } from '../core/state.js';
import { pages } from '../core/router.js';
import { renderWidgetPreview } from '../widgets/preview.js';
import { pageHeader } from '../ui/components.js';

pages['frontend-simulator'] = () => {
    const t = STATE.theme;
    const zones = builderState.dynamicZones;

    return `
    <style>
        .sim-body {
            background: #0f172a;
            color: #fff;
            font-family: "${t.font}", sans-serif;
            min-height: 100vh;
            margin: 0 auto;
            max-width: ${builderState.device === 'mobile' ? '400px' : (builderState.device === 'tablet' ? '800px' : '100%')};
            box-shadow: 0 0 50px rgba(0,0,0,0.5);
            transition: max-width 0.3s;
            position: relative;
        }
        .sim-section {
            width: 100%;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .sim-widget-wrap {
            width: 100%;
            height: 100%;
        }
        :root {
            --acc: ${t.primary};
            --radius: ${t.radius};
        }
    </style>

    ${pageHeader('Frontend Simulator', '<span>Preview</span><span class="sep">›</span><span>Player View</span>', `
        <div style="display:flex;gap:.5rem">
            <button class="btn btn-secondary" onclick="go('template-builder')"><i class="fa-solid fa-arrow-left"></i> Back to Builder</button>
            <button class="btn btn-primary" onclick="window.print()"><i class="fa-solid fa-download"></i> Export JPG</button>
        </div>
    `)}

    <div style="background:#0b1120; padding: 2rem; display:flex; justify-content:center">
        <div class="sim-body">
            <!-- Navigation simulation -->
            <div style="padding: 1rem 1.5rem; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05)">
                <div style="font-weight:900; font-size:1.2rem; color:${t.primary}">VIGOR</div>
                <div style="display:flex; gap:1.5rem; font-size:.85rem; font-weight:600">
                    <span>SPORTS</span>
                    <span>CASINO</span>
                    <span>SLOTS</span>
                </div>
                <button style="background:${t.primary}; border:none; padding:.5rem 1rem; border-radius:${t.radius}; color:#fff; font-weight:bold; font-size:.8rem">JOIN NOW</button>
            </div>

            <!-- Dynamic Sections -->
            ${zones.map(z => `
                <div class="sim-section" style="min-height:${z.height}px">
                    <div class="sim-widget-wrap">
                        ${z.widget ? renderWidgetPreview(z.widget) : `
                            <div style="height:100%; display:flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.02); color:rgba(255,255,255,0.1); font-weight:bold">${z.label}</div>
                        `}
                    </div>
                </div>
            `).join('')}

            <!-- Bottom Nav (Mobile Only) -->
            ${builderState.device === 'mobile' ? `
                <div style="position:sticky; bottom:0; padding:1rem; background:rgba(15,23,42,0.95); display:flex; justify-content:around; border-top:1px solid rgba(255,255,255,0.1); backdrop-filter:blur(10px)">
                    <div style="text-align:center"><i class="fa-solid fa-house" style="color:${t.primary}"></i><div style="font-size:.6rem">HOME</div></div>
                    <div style="text-align:center"><i class="fa-solid fa-gift"></i><div style="font-size:.6rem">PROMO</div></div>
                    <div style="text-align:center"><i class="fa-solid fa-gamepad"></i><div style="font-size:.6rem">GAMES</div></div>
                    <div style="text-align:center"><i class="fa-solid fa-user"></i><div style="font-size:.6rem">PROFILE</div></div>
                </div>
            ` : ''}
        </div>
    </div>
    `;
};

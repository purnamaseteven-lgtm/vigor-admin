/* ─── WIDGET PREVIEW ENGINE ─── */
import { fmt } from '../utils/helpers.js';

export function renderWidgetPreview(id) {
  const previews = {
    'banner-slider': `<div style="background:linear-gradient(135deg,#0f172a,#1e293b);height:100%;display:flex;flex-direction:column;justify-content:center;padding:2rem;color:#fff">
      <div style="font-size:1.5rem;font-weight:800;margin-bottom:.5rem">Welcome Bonus 200% 🎉</div>
      <div style="opacity:.8;font-size:.9rem;margin-bottom:1rem">Start your winning journey with us today</div>
      <button style="width:fit-content;background:var(--acc);color:#fff;border:none;padding:.6rem 1.25rem;border-radius:6px;font-weight:700">CLAIM NOW</button>
    </div>`,
    'marquee': `<div style="background:var(--acc);color:#fff;padding:.6rem 1rem;font-size:.85rem;white-space:nowrap;overflow:hidden">
      <div style="display:inline-block;animation:marquee 20s linear infinite">🔥 HOT: Gates of Olympus pays 5000x &nbsp;&nbsp; 🏆 VIP Tournament live now! Join before 30 April. &nbsp;&nbsp; ⚡ Instant WD processing 24/7</div>
    </div>`,
    'game-grid': `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:12px;background:#0f172a">
      ${Array.from({ length: 8 }, () => `<div style="aspect-ratio:1;background:rgba(255,255,255,0.05);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.5rem">🎰</div>`).join('')}
    </div>`,
    'jackpot-ticker': `<div style="background:#000;color:#facc15;padding:1rem;text-align:center;border:2px solid #facc15;border-radius:8px">
      <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Progressive Jackpot</div>
      <div style="font-size:1.75rem;font-weight:900" class="jk-value">Rp 2.847.391.204</div>
    </div>`,
    'promo-card': `<div style="background:linear-gradient(to right,#0ea5e9,#8b5cf6);padding:1.5rem;border-radius:12px;color:#fff;display:flex;justify-content:space-between;align-items:center">
      <div><div style="font-size:.7rem;font-weight:800;opacity:.8">LIMITED EVENT</div><div style="font-size:1.25rem;font-weight:800">New Member Bonus 100%</div></div>
      <div style="font-size:2rem;font-weight:900">100%</div>
    </div>`,
    'countdown': `<div style="background:#0f172a;color:#fff;padding:1rem;border-radius:12px;text-align:center">
      <div style="font-size:.7rem;margin-bottom:.5rem;opacity:.7">EVENT ENDS IN</div>
      <div style="display:flex;justify-content:center;gap:12px">
        ${['DAYS', 'HRS', 'MIN', 'SEC'].map(u => `<div><div class="cd-num" style="font-size:1.5rem;font-weight:800;color:var(--acc)">00</div><div style="font-size:.6rem;opacity:.5">${u}</div></div>`).join('')}
      </div>
    </div>`,
    'vip-progress': `<div style="background:#1e293b;padding:1.25rem;border-radius:12px;color:#fff">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.75rem">
        <div style="display:flex;align-items:center;gap:8px"><div style="width:32px;height:32px;background:var(--acc);border-radius:50%;display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-user"></i></div><span>Player007</span></div>
        <span style="font-weight:800;color:#facc15">PLATINUM</span>
      </div>
      <div style="height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden"><div style="width:65%;height:100%;background:linear-gradient(to right,var(--acc),#8b5cf6)"></div></div>
      <div style="display:flex;justify-content:space-between;font-size:.7rem;margin-top:6px;opacity:.7"><span>Progress to Diamond</span><span>650 / 1,000 pts</span></div>
    </div>`,
    'login-form': `<div style="background:#fff;padding:1.5rem;border-radius:12px;color:#0f172a">
      <div style="font-weight:800;margin-bottom:1rem">Sign In</div>
      <div style="margin-bottom:.75rem"><input type="text" placeholder="Username" style="width:100%;padding:.6rem;border:1px solid #e2e8f0;border-radius:6px"/></div>
      <div style="margin-bottom:1rem"><input type="password" placeholder="Password" style="width:100%;padding:.6rem;border:1px solid #e2e8f0;border-radius:6px"/></div>
      <button style="width:100%;padding:.75rem;background:#0f172a;color:#fff;border:none;border-radius:6px;font-weight:700">LOGIN</button>
    </div>`,
    'social-connect': `<div style="display:flex;justify-content:center;gap:1.5rem;padding:1rem">
      ${['whatsapp', 'telegram', 'line', 'facebook'].map(s => `<div style="width:44px;height:44px;background:var(--acc-glow);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--acc);font-size:1.25rem"><i class="fa-brands fa-${s}"></i></div>`).join('')}
    </div>`,
    'promotion-list': `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;padding:1rem;background:#0f172a">
      ${Array.from({ length: 4 }, (_, i) => `
        <div style="background:rgba(255,255,255,0.05);border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.1)">
          <div style="height:80px;background:linear-gradient(rgba(0,0,0,0.3),rgba(0,0,0,0.3)),url('https://placehold.co/400x200/1e293b/white?text=PROMO+IMAGE');background-size:cover;background-position:center"></div>
          <div style="padding:.75rem">
            <div style="color:var(--acc);font-size:.6rem;font-weight:800;text-transform:uppercase;margin-bottom:2px">PROMOTION</div>
            <div style="color:#fff;font-size:.75rem;font-weight:700;line-height:1.2;margin-bottom:6px">Promo Event Member Baru ${i + 1}</div>
          </div>
        </div>
      `).join('')}
    </div>`
  };
  return previews[id] || `<div style="padding:2rem;text-align:center;color:var(--text3)">Preview not available</div>`;
}

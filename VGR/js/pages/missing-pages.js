/* ─── MISSING PAGE REGISTRATIONS ─── */
/* Pages referenced by app.html sidebar but not yet registered in modular JS */
import { STATE, saveState } from '../core/state.js';
import { pages, go } from '../core/router.js';
import { pageHeader, tableWrap, badge, openModal, closeModalBtn, toast } from '../ui/components.js';
import { WIDGET_DEFS } from '../widgets/definitions.js';

// --- TEMPLATE LIST (Gallery of pre-built player-site themes) ---
const TEMPLATES = [
    // ── Flagship Variants ──
    { id: 'fs-black', name: 'Flagship - Black', inUse: 47, colors: ['#dc2626', '#0f172a', '#fbbf24', '#fff'], active: true, bg: '#0f0f0f', accent: '#dc2626', demo: 'https://flagship.avarich.com/' },
    { id: 'fs-blackgold', name: 'Flagship - Black Gold', inUse: 32, colors: ['#fbbf24', '#0f172a', '#dc2626', '#fff'], active: false, bg: '#0f0a00', accent: '#fbbf24', demo: 'https://flagshipbg.avarich.com/' },
    { id: 'fs-blackred', name: 'Flagship - Black Red', inUse: 18, colors: ['#dc2626', '#0f172a', '#fff', '#fbbf24'], active: false, bg: '#18020a', accent: '#dc2626', demo: 'https://flagshipbr.avarich.com/' },
    { id: 'fs-blackblue', name: 'Flagship - Black Blue', inUse: 14, colors: ['#0ea5e9', '#0f172a', '#fff', '#fbbf24'], active: false, bg: '#020c1a', accent: '#0ea5e9', demo: 'https://flagshipbb.avarich.com/' },
    { id: 'fs-whiteblue', name: 'Flagship - White Blue', inUse: 9, colors: ['#0ea5e9', '#f1f5f9', '#0f172a', '#fbbf24'], active: false, bg: '#f1f5f9', accent: '#0ea5e9', demo: 'https://flagshipwb.avarich.com/' },
    { id: 'fs-limeblack', name: 'Flagship - Lime Black', inUse: 6, colors: ['#84cc16', '#0f172a', '#fbbf24', '#fff'], active: false, bg: '#0a1200', accent: '#84cc16', demo: 'https://flagshiplb.avarich.com/' },
    { id: 'fs-bg1', name: 'Flagship - Black Gold 01', inUse: 5, colors: ['#fbbf24', '#1c1400', '#dc2626', '#fff'], active: false, bg: '#0f0a00', accent: '#fbbf24', demo: 'https://flagshipbg1.avarich.com/' },

    // ── Template 1 Variants ──
    { id: 't1-black', name: 'Template 1 - Black', inUse: 12, colors: ['#7c3aed', '#0f172a', '#f59e0b', '#10b981'], active: false, bg: '#0a0a0a', accent: '#7c3aed', demo: 'https://t1black.n1trovip.com/' },
    { id: 't1-greenneon', name: 'Template 1 - Green Neon', inUse: 8, colors: ['#22c55e', '#0f172a', '#10b981', '#fff'], active: false, bg: '#001a0a', accent: '#22c55e', demo: 'https://t1greenneon.n1trovip.com/' },
    { id: 't1-originalblue', name: 'Template 1 - Original Blue', inUse: 15, colors: ['#3b82f6', '#0f172a', '#60a5fa', '#fff'], active: false, bg: '#020c1a', accent: '#3b82f6', demo: 'https://t1originalblue.n1trovip.com/' },
    { id: 't1-yellowblack2', name: 'Template 1 - Yellow Black 2', inUse: 4, colors: ['#eab308', '#0f172a', '#fbbf24', '#fff'], active: false, bg: '#0f0a00', accent: '#eab308', demo: 'https://t1yellowblack2.n1trovip.com/' },
    { id: 't1-purpleblack', name: 'Template 1 - Purple Black', inUse: 7, colors: ['#a855f7', '#0f172a', '#c084fc', '#fff'], active: false, bg: '#1a0a2e', accent: '#a855f7', demo: 'https://t1purpleblack.n1trovip.com/' },
    { id: 't1-yellowblack', name: 'Template 1 - Yellow Black', inUse: 6, colors: ['#facc15', '#0f172a', '#fbbf24', '#fff'], active: false, bg: '#0f0a00', accent: '#facc15', demo: 'https://t1yellowblack.n1trovip.com/' },
    { id: 't1-pinkblack', name: 'Template 1 - Pink Black', inUse: 3, colors: ['#ec4899', '#0f172a', '#f472b6', '#fff'], active: false, bg: '#1a020f', accent: '#ec4899', demo: 'https://t1pinkblack.n1trovip.com/' },
    { id: 't1-orangeblack', name: 'Template 1 - Orange Black', inUse: 5, colors: ['#f97316', '#0f172a', '#fb923c', '#fff'], active: false, bg: '#1a0a00', accent: '#f97316', demo: 'https://t1orangeblack.n1trovip.com/' },
    { id: 't1-blackred', name: 'Template 1 - Black Red', inUse: 9, colors: ['#ef4444', '#0f172a', '#f87171', '#fff'], active: false, bg: '#1a0505', accent: '#ef4444', demo: 'https://t1blackred.n1trovip.com/' },
    { id: 't1-lightblue', name: 'Template 1 - Light Blue', inUse: 4, colors: ['#38bdf8', '#0f172a', '#7dd3fc', '#fff'], active: false, bg: '#020c1a', accent: '#38bdf8', demo: 'https://t1lightblue.n1trovip.com/' },
    { id: 't1-violetblack', name: 'Template 1 - Violet Black', inUse: 2, colors: ['#8b5cf6', '#0f172a', '#a78bfa', '#fff'], active: false, bg: '#130a2e', accent: '#8b5cf6', demo: 'https://t1violetblack.n1trovip.com/' },
    { id: 't1-cyanblack', name: 'Template 1 - Cyan Black', inUse: 3, colors: ['#06b6d4', '#0f172a', '#22d3ee', '#fff'], active: false, bg: '#001a1f', accent: '#06b6d4', demo: 'https://t1cyanblack.n1trovip.com/' },
    { id: 't1-azureblue', name: 'Template 1 - Azure Blue', inUse: 2, colors: ['#2563eb', '#0f172a', '#3b82f6', '#fff'], active: false, bg: '#020b1f', accent: '#2563eb', demo: 'https://t1azureblue.n1trovip.com/' },
    { id: 't1-navyblue', name: 'Template 1 - Navy Blue', inUse: 3, colors: ['#1e40af', '#0f172a', '#3b82f6', '#fff'], active: false, bg: '#020820', accent: '#1e40af', demo: 'https://t1navyblue.n1trovip.com/' },
    { id: 't1-blueblack', name: 'Template 1 - Blue Black', inUse: 4, colors: ['#3b82f6', '#0a0a0a', '#60a5fa', '#fff'], active: false, bg: '#050a18', accent: '#3b82f6', demo: 'https://t1blueblack.n1trovip.com/' },

    // ── Template 2 ──
    { id: 't2-greenblack', name: 'Template 2 - Green Black', inUse: 5, colors: ['#10b981', '#0f172a', '#34d399', '#fff'], active: false, bg: '#001a0a', accent: '#10b981', demo: 'https://totogreenblack.avarich.com/' },
    { id: 't2-greenneon', name: 'N1TRO 2 - Green Neon', inUse: 3, colors: ['#22c55e', '#0f172a', '#4ade80', '#fff'], active: false, bg: '#001a0a', accent: '#22c55e', demo: 'https://t2greenneon.n1trovip.com/' },

    // ── Template 7 ──
    { id: 't7-gray', name: 'Template 7 - Gray', inUse: 2, colors: ['#6b7280', '#1f2937', '#9ca3af', '#fff'], active: false, bg: '#111827', accent: '#6b7280', demo: 'https://t7gray.avarich.com/' },
    { id: 't7-greenneon', name: 'Template 7 - Green Neon', inUse: 1, colors: ['#22c55e', '#0f172a', '#4ade80', '#fff'], active: false, bg: '#001a0a', accent: '#22c55e', demo: 'https://t7greenneon.n1trovip.com/' },

    // ── Template 13 ──
    { id: 't13-orangeblack', name: 'Template 13 - Orange Black', inUse: 3, colors: ['#f97316', '#0f172a', '#fb923c', '#059669'], active: false, bg: '#1a0a00', accent: '#f97316', demo: 'https://t13orangeblack.avarich.com/' },

    // ── Template 14 ──
    { id: 't14-bluemint', name: 'Template 14 - Blue Mint', inUse: 1, colors: ['#0ea5e9', '#10b981', '#fff', '#0f172a'], active: false, bg: '#0a1a12', accent: '#0ea5e9', demo: 'https://t14bluemint.avarich.com/' },

    // ── Template 15 ──
    { id: 't15-blueblack', name: 'Template 15 - Blue Black', inUse: 2, colors: ['#0ea5e9', '#0f172a', '#1d4ed8', '#fff'], active: false, bg: '#051428', accent: '#0ea5e9', demo: 'https://t15blueblack.avarich.com/' },

    // ── Template 16 ──
    { id: 't16-black', name: 'Template 16 - Black', inUse: 3, colors: ['#fbbf24', '#0f172a', '#dc2626', '#fff'], active: false, bg: '#0f0a00', accent: '#fbbf24', demo: 'https://t16black.avarich.com/' },

    // ── Joshoki ──
    { id: 'joshoki-dark', name: 'Template Joshoki', inUse: 1, colors: ['#f59e0b', '#0b1120', '#2563eb', '#f97316'], active: false, bg: '#0b1120', accent: '#f59e0b', demo: '' },

    // ── Custom ──
    { id: 'custom', name: 'Custom Template', inUse: 21, colors: ['#0ea5e9', '#0f172a', '#f59e0b', '#10b981'], active: false, bg: '#0a0e1a', accent: '#0ea5e9', demo: '' },
];

/* ─── Template Preview Renderer ─── */
function renderTplPreview(t) {
    const isDark = t.bg !== '#f1f5f9';
    const textColor = isDark ? '#fff' : '#0f172a';
    return '<div style="background:' + t.bg + ';height:100%">' +
        '<div style="background:linear-gradient(90deg,' + t.accent + ',' + (t.colors[1] || '#0f172a') + ');height:8px"></div>' +
        '<div style="padding:4px;display:flex;justify-content:space-between;align-items:center"><span style="color:' + t.accent + ';font-weight:800;font-size:.7rem">' + t.name.split(' - ')[0].toUpperCase() + '</span><span style="font-size:.55rem;color:' + textColor + '">' + '\u{1F3B0}' + '</span></div>' +
        '<div style="background:linear-gradient(135deg,' + t.accent + '33,' + t.bg + ');height:40px;display:flex;align-items:center;justify-content:center;color:' + textColor + ';font-size:.5rem;font-weight:700">WELCOME BONUS 200%</div>' +
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:2px;padding:3px">' +
        Array.from({ length: 8 }, () => '<div style="aspect-ratio:1;background:linear-gradient(135deg,' + t.accent + '22,' + t.bg + ');border-radius:2px;font-size:.6rem;display:flex;align-items:center;justify-content:center;color:' + textColor + '">\u{1F3B0}</div>').join('') +
        '</div></div>';
}

/* ─── Template List Page ─── */
pages['template-list'] = () => {
    // Group templates by family
    const groups = {};
    TEMPLATES.forEach(t => {
        const family = t.name.startsWith('Flagship') ? 'Flagship' :
            t.name.startsWith('Template 1') || t.name.startsWith('Template 1') ? t.name.split(' - ')[0] :
                t.name.startsWith('N1TRO') ? 'N1TRO' : t.name.split(' - ')[0];
        if (!groups[family]) groups[family] = [];
        groups[family].push(t);
    });

    const cards = TEMPLATES.map(t => `
        <div class="card" id="tcard-${t.id}" style="cursor:pointer;overflow:hidden;transition:all .25s;border:2px solid ${t.active ? 'var(--acc)' : 'var(--border)'}">
            <div style="height:150px;overflow:hidden;position:relative;background:${t.bg}">
                ${renderTplPreview(t)}
                ${t.active ? '<div style="position:absolute;top:6px;right:6px;background:var(--acc);color:#fff;font-size:.6rem;font-weight:700;padding:.2rem .5rem;border-radius:4px">\u2713 ACTIVE</div>' : ''}
                <div style="position:absolute;inset:0;background:rgba(0,0,0,0);transition:background .2s" onmouseover="this.style.background='rgba(0,0,0,.2)'" onmouseout="this.style.background='rgba(0,0,0,0)'"></div>
            </div>
            <div style="padding:.6rem .75rem .35rem">
                <div style="font-size:.78rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${t.name}">${t.name}</div>
                <div style="font-size:.65rem;color:var(--text3);margin-top:.1rem">In use: <strong>${t.inUse}</strong></div>
            </div>
            <div style="display:flex;gap:.3rem;padding:.25rem .75rem .35rem;align-items:center">
                ${t.colors.map(c => '<div style="width:14px;height:14px;border-radius:50%;background:' + c + ';border:1px solid rgba(0,0,0,.15)" title="' + c + '"></div>').join('')}
            </div>
            <div style="display:flex;gap:.3rem;padding:.25rem .75rem .6rem">
                ${t.demo ? '<a href="' + t.demo + '" target="_blank" onclick="event.stopPropagation()" class="btn btn-sm btn-secondary btn-icon" title="Live Demo" style="font-size:.65rem;text-decoration:none"><i class="fa-solid fa-external-link"></i></a>' : ''}
                <button class="btn btn-sm btn-secondary btn-icon" onclick="event.stopPropagation();window.previewTpl('${t.id}')" title="Preview"><i class="fa-solid fa-eye"></i></button>
                <button class="btn btn-sm ${t.active ? 'btn-primary' : 'btn-secondary'}" onclick="event.stopPropagation();window.applyTpl('${t.id}')" style="font-size:.68rem;padding:.2rem .5rem;flex:1">${t.active ? 'Active' : 'Apply'}</button>
            </div>
        </div>`).join('');

    return `
    <style>
        .tpl-filter-bar { display:flex; gap:.5rem; flex-wrap:wrap; margin-bottom:1.5rem; }
        .tpl-filter-btn { padding:.4rem 1rem; border-radius:8px; border:1px solid var(--border); background:var(--card); color:var(--text2); font-size:.75rem; font-weight:600; cursor:pointer; transition:all .2s; }
        .tpl-filter-btn:hover { border-color:var(--acc); color:var(--acc); }
        .tpl-filter-btn.active { background:var(--acc); color:#fff; border-color:var(--acc); }
        .tpl-stats { display:flex; gap:1.5rem; margin-bottom:1.5rem; }
        .tpl-stat-card { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:1rem 1.5rem; display:flex; align-items:center; gap:1rem; flex:1; }
        .tpl-stat-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.1rem; color:#fff; }
    </style>

    ${pageHeader('Template List', '<span>Customization</span><span class="sep">\u203A</span><span>Template List</span>', `
        <div style="display:flex;gap:.5rem">
            <div style="position:relative">
                <i class="fa-solid fa-search" style="position:absolute;left:.75rem;top:50%;transform:translateY(-50%);color:var(--text3);font-size:.75rem"></i>
                <input type="text" placeholder="Search templates..." oninput="window.filterTpls(this.value)" style="padding:.45rem .75rem .45rem 2rem;border:1px solid var(--border);border-radius:8px;font-size:.8rem;background:var(--card);color:var(--text);outline:none;width:220px" />
            </div>
        </div>
    `)}

    <div class="tpl-stats">
        <div class="tpl-stat-card">
            <div class="tpl-stat-icon" style="background:linear-gradient(135deg,#0ea5e9,#0284c7)"><i class="fa-solid fa-layer-group"></i></div>
            <div><div style="font-size:1.5rem;font-weight:900">${TEMPLATES.length}</div><div style="font-size:.72rem;color:var(--text3)">Total Templates</div></div>
        </div>
        <div class="tpl-stat-card">
            <div class="tpl-stat-icon" style="background:linear-gradient(135deg,#10b981,#059669)"><i class="fa-solid fa-check-circle"></i></div>
            <div><div style="font-size:1.5rem;font-weight:900">${TEMPLATES.filter(t => t.active).length}</div><div style="font-size:.72rem;color:var(--text3)">Active</div></div>
        </div>
        <div class="tpl-stat-card">
            <div class="tpl-stat-icon" style="background:linear-gradient(135deg,#8b5cf6,#6d28d9)"><i class="fa-solid fa-link"></i></div>
            <div><div style="font-size:1.5rem;font-weight:900">${TEMPLATES.filter(t => t.demo).length}</div><div style="font-size:.72rem;color:var(--text3)">Live Demos</div></div>
        </div>
        <div class="tpl-stat-card">
            <div class="tpl-stat-icon" style="background:linear-gradient(135deg,#f59e0b,#d97706)"><i class="fa-solid fa-users"></i></div>
            <div><div style="font-size:1.5rem;font-weight:900">${TEMPLATES.reduce((s, t) => s + t.inUse, 0)}</div><div style="font-size:.72rem;color:var(--text3)">Total Usage</div></div>
        </div>
    </div>

    <div class="tpl-filter-bar">
        <div class="tpl-filter-btn active" onclick="window.filterTplGroup('all',this)">All (${TEMPLATES.length})</div>
        ${Object.entries(groups).map(([name, items]) =>
        '<div class="tpl-filter-btn" onclick="window.filterTplGroup(\'' + name.replace(/'/g, "\\'") + '\',this)">' + name + ' (' + items.length + ')</div>'
    ).join('')}
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:1rem" id="templateGrid">${cards}</div>`;
};

/* ─── Template Actions ─── */
window.applyTpl = (id) => {
    TEMPLATES.forEach(t => { t.active = false; });
    const t = TEMPLATES.find(x => x.id === id);
    if (t) t.active = true;
    go('custom-template');
    toast('Template "' + (t?.name || '') + '" applied!', 'success');
};

window.previewTpl = (id) => {
    const t = TEMPLATES.find(x => x.id === id);
    if (!t) return;
    const demoBtn = t.demo ? '<a href="' + t.demo + '" target="_blank" class="btn btn-secondary" style="text-decoration:none"><i class="fa-solid fa-external-link"></i> Live Demo</a>' : '';

    // Use the uploaded image for the Joshoki/Custom template preview, otherwise use the CSS render
    const previewContent = (t.id === 'custom' || t.id === 'joshoki-dark')
        ? '<img src="img/templates/custom-layout.jpg" style="width:100%;height:100%;object-fit:cover;object-position:top" alt="Preview"/>'
        : renderTplPreview(t);

    openModal('Preview: ' + t.name,
        '<div style="border:1px solid var(--border);border-radius:12px;overflow:hidden;height:220px;background:' + t.bg + '">' + previewContent + '</div>' +
        '<div style="margin-top:1.25rem;display:flex;justify-content:space-between;align-items:flex-start">' +
        '<div><div style="font-weight:800;font-size:1.1rem">' + t.name + '</div>' +
        '<div style="font-size:.8rem;color:var(--text3);margin-top:.25rem">In use by ' + t.inUse + ' companies</div>' +
        (t.demo ? '<div style="margin-top:.5rem"><a href="' + t.demo + '" target="_blank" style="font-size:.78rem;color:var(--acc);text-decoration:none"><i class="fa-solid fa-external-link" style="margin-right:.3rem"></i>' + t.demo + '</a></div>' : '') +
        '<div style="display:flex;gap:.4rem;margin-top:.75rem">' + t.colors.map(c => '<div style="width:22px;height:22px;border-radius:50%;background:' + c + ';border:1px solid rgba(0,0,0,.15)"></div>').join('') + '</div>' +
        '</div>' +
        '</div>',
        '<button class="btn btn-primary" onclick="window.applyTpl(\'' + id + '\');closeModalBtn()">Apply</button>' +
        '<button class="btn btn-success" onclick="closeModalBtn();window.loadAndOptimizeTemplate(\'' + id + '\',\'' + t.name.replace(/'/g, "\\'") + '\',\'' + t.colors.join(',') + '\')"><i class="fa-solid fa-wand-magic-sparkles"></i> Customize in Studio X</button>' +
        demoBtn +
        '<button class="btn btn-secondary" onclick="closeModalBtn()">Close</button>'
    );
};

window.filterTpls = (q) => {
    const lq = q.toLowerCase();
    TEMPLATES.forEach(t => {
        const card = document.getElementById('tcard-' + t.id);
        if (card) card.style.display = (!lq || t.name.toLowerCase().includes(lq)) ? '' : 'none';
    });
};

window.filterTplGroup = (group, btn) => {
    // Update active button
    document.querySelectorAll('.tpl-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    // Filter cards
    TEMPLATES.forEach(t => {
        const card = document.getElementById('tcard-' + t.id);
        if (!card) return;
        if (group === 'all') { card.style.display = ''; return; }
        const family = t.name.startsWith('Flagship') ? 'Flagship' :
            t.name.startsWith('N1TRO') ? 'N1TRO' : t.name.split(' - ')[0];
        card.style.display = (family === group) ? '' : 'none';
    });
};

// ────────────────────────────────────────────────────
// APP NOTIFICATION (app-notification)
// ────────────────────────────────────────────────────
pages['app-notification'] = () => {
    const notifs = STATE.notifications || [];
    return `
    ${pageHeader('App Notification', '<span>Customization</span><span class="sep">›</span><span>App Notification</span>', '<button class="btn btn-primary btn-sm" onclick="window.addAppNotif()"><i class="fa-solid fa-plus"></i> Add Notification</button>')}
    <div class="card">
        <div class="card-header"><span class="card-title">App Notification List</span></div>
        <div class="card-body">
            ${tableWrap(`<table><thead><tr><th>#</th><th>Created Date</th><th>Title</th><th>Content</th><th>Target</th><th>Action</th></tr></thead><tbody>` +
        (notifs.length ? notifs.map((n, i) =>
            `<tr><td>${i + 1}</td><td style="font-size:.75rem">${n.date || '-'}</td><td style="color:var(--acc)">${n.title || '-'}</td><td style="font-size:.75rem;max-width:300px;color:var(--text3)">${n.content || '-'}</td><td>${badge(n.target || 'All', 'secondary')}</td><td><div style="display:flex;gap:.25rem"><button class="btn btn-success btn-xs" onclick="toast('Edit','info')"><i class="fa-solid fa-pen"></i></button><button class="btn btn-danger btn-xs" onclick="window.delAppNotif('${n.id}')"><i class="fa-solid fa-trash"></i></button></div></td></tr>`
        ).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--text3);padding:2rem">No notifications</td></tr>') +
        '</tbody></table>')}
        </div>
    </div>`;
};

window.addAppNotif = () => {
    openModal('Add Notification',
        '<div class="form-grid"><div class="form-field"><label>Title</label><input id="an_title" placeholder="Title" /></div><div class="form-field"><label>Content</label><textarea id="an_content" rows="3" placeholder="Content..."></textarea></div><div class="form-field"><label>Target</label><input id="an_target" value="All" /></div></div>',
        '<button class="btn btn-secondary" onclick="closeModalBtn()">Cancel</button><button class="btn btn-primary" onclick="window.saveAppNotif()">Save</button>');
};
window.saveAppNotif = () => {
    const title = document.getElementById('an_title')?.value?.trim();
    if (!title) { toast('Title required', 'error'); return; }
    if (!STATE.notifications) STATE.notifications = [];
    STATE.notifications.unshift({ id: 'NOT' + Date.now().toString().slice(-4), date: new Date().toLocaleString('id-ID'), title, content: document.getElementById('an_content')?.value || '', target: document.getElementById('an_target')?.value || 'All' });
    saveState(); closeModalBtn(); go('custom-app-notification'); toast('Added', 'success');
};
window.delAppNotif = (id) => { STATE.notifications = (STATE.notifications || []).filter(x => x.id !== id); saveState(); go('custom-app-notification'); toast('Deleted', 'success'); };

// ────────────────────────────────────────────────────
// SYSTEM NOTIFICATIONS PAGE
// ────────────────────────────────────────────────────
pages['system-notifications'] = () => {
    const notifs = STATE.systemNotifications || [];
    const unread = notifs.filter(n => !n.read).length;
    const typeIcon  = { info: 'fa-circle-info', success: 'fa-circle-check', warning: 'fa-triangle-exclamation', danger: 'fa-circle-xmark' };
    const typeColor = { info: 'var(--acc)', success: 'var(--green)', warning: 'var(--yellow)', danger: 'var(--red)' };

    return `
    ${pageHeader('System Notifications', '<span>Notifications</span>', `
        <div style="display:flex;gap:.5rem">
            ${unread > 0 ? `<button class="btn btn-secondary btn-sm" onclick="window.markAllNotifsRead()"><i class="fa-solid fa-check-double"></i> Mark All Read</button>` : ''}
            <button class="btn btn-primary btn-sm" onclick="window.openBroadcastNotifModal()"><i class="fa-solid fa-bullhorn"></i> Broadcast</button>
        </div>
    `)}

    ${unread > 0 ? `<div style="background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.3);border-radius:10px;padding:.65rem 1rem;margin-bottom:1rem;font-size:.82rem;color:var(--yellow)"><i class="fa-solid fa-circle-exclamation" style="margin-right:.4rem"></i>${unread} unread notification${unread>1?'s':''}</div>` : ''}

    <div style="display:flex;flex-direction:column;gap:.6rem">
    ${notifs.length ? notifs.map(n => `
        <div style="background:var(--bg2);border:1px solid ${n.read ? 'var(--border)' : typeColor[n.type]||'var(--acc)'}44;border-left:3px solid ${typeColor[n.type]||'var(--acc)'};border-radius:10px;padding:.85rem 1rem;display:flex;align-items:flex-start;gap:.75rem;cursor:pointer;transition:opacity .15s;${n.read?'opacity:.7':''}">
            <div style="width:32px;height:32px;border-radius:50%;background:${typeColor[n.type]||'var(--acc)'}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:.1rem">
                <i class="fa-solid ${typeIcon[n.type]||'fa-bell'}" style="color:${typeColor[n.type]||'var(--acc)'};font-size:.85rem"></i>
            </div>
            <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.2rem">
                    <strong style="font-size:.85rem;${n.read?'':'color:var(--text1)'}">${n.title || 'Notification'}</strong>
                    ${!n.read ? '<span style="width:7px;height:7px;border-radius:50%;background:var(--acc);flex-shrink:0"></span>' : ''}
                    ${n.targetRole ? `<span style="font-size:.65rem;background:var(--bg3);border:1px solid var(--border);border-radius:20px;padding:.05rem .45rem;color:var(--text3)">${n.targetRole}</span>` : ''}
                </div>
                <div style="font-size:.8rem;color:var(--text2);margin-bottom:.3rem">${n.message || ''}</div>
                <div style="display:flex;align-items:center;gap:.75rem">
                    <span style="font-size:.68rem;color:var(--text3)">${n.date ? new Date(n.date).toLocaleString('id-ID') : ''}</span>
                    ${n.createdBy ? `<span style="font-size:.68rem;color:var(--text3)">by ${n.createdBy}</span>` : ''}
                </div>
            </div>
            <div style="display:flex;gap:.3rem;flex-shrink:0">
                ${!n.read ? `<button class="btn btn-xs btn-secondary" onclick="window.markNotifRead('${n.id}')" title="Mark read"><i class="fa-solid fa-check"></i></button>` : ''}
                <button class="btn btn-xs btn-danger" onclick="window.deleteSystemNotif('${n.id}')" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('') : `
        <div style="text-align:center;padding:3rem;color:var(--text3)">
            <i class="fa-solid fa-bell-slash" style="font-size:2rem;opacity:.3;margin-bottom:.75rem"></i>
            <div style="font-size:.85rem">No notifications</div>
        </div>
    `}
    </div>`;
};

window.deleteSystemNotif = (id) => {
    STATE.systemNotifications = (STATE.systemNotifications || []).filter(n => n.id !== id);
    saveState();
    go('system-notifications');
};

// ────────────────────────────────────────────────────
// WIDGET LIBRARY
// ────────────────────────────────────────────────────
pages['widget-library'] = () => {
    return `
    ${pageHeader('Widget Library', '<span>Customization</span><span class="sep">\u203A</span><span>Widget Library</span>', '<button class="btn btn-primary" onclick="go(\'widget-configure\');window.pendingWidget=null"><i class="fa-solid fa-plus"></i> Create Widget</button>')}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1.25rem">
        ${WIDGET_DEFS.map(w => `
            <div class="card" style="overflow:hidden;transition:all .2s;cursor:pointer" onmouseover="this.style.borderColor='var(--acc)'" onmouseout="this.style.borderColor='var(--border)'">
                <div style="height:140px;background:linear-gradient(135deg,${w.bg},#0f172a);display:flex;align-items:center;justify-content:center;font-size:2.5rem;color:rgba(255,255,255,.8)"><i class="fa-solid ${w.icon}"></i></div>
                <div class="card-body" style="padding:1rem">
                    <div style="font-weight:700;font-size:.9rem;margin-bottom:.25rem">${w.name}</div>
                    <div style="font-size:.72rem;color:var(--text3);margin-bottom:.75rem">${w.cat}</div>
                    <div style="display:flex;gap:.5rem">
                        <button class="btn btn-sm btn-primary" style="flex:1" onclick="window.pendingWidget='${w.id}';go('widget-configure')"><i class="fa-solid fa-pen"></i> Configure</button>
                        <button class="btn btn-sm btn-secondary btn-icon" onclick="toast('Preview: ${w.name}','info')"><i class="fa-solid fa-eye"></i></button>
                    </div>
                </div>
            </div>
        `).join('')}
    </div>`;
};

// ────────────────────────────────────────────────────
// WIDGET CONFIGURE
// ────────────────────────────────────────────────────
pages['widget-configure'] = () => {
    const wid = window.pendingWidget;
    const w = wid ? WIDGET_DEFS.find(x => x.id === wid) : null;
    return `
    ${pageHeader(w ? 'Configure: ' + w.name : 'Create New Widget', '<span>Customization</span><span class="sep">\u203A</span><span>Widget Configure</span>', '<button class="btn btn-secondary btn-sm" onclick="go(\'widget-library\')"><i class="fa-solid fa-arrow-left"></i> Back</button>')}
    <div style="display:grid;grid-template-columns:1fr 380px;gap:1.5rem">
        <div class="card">
            <div class="card-header"><span class="card-title">${w ? w.name + ' Settings' : 'Widget Settings'}</span></div>
            <div class="card-body">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
                    <div class="form-group"><label class="form-label">Widget Name</label><input class="form-control" value="${w ? w.name : ''}" placeholder="My Widget" /></div>
                    <div class="form-group"><label class="form-label">Category</label><select class="form-control"><option>Navigation</option><option>Content</option><option>Games</option><option>Promotion</option></select></div>
                    <div class="form-group"><label class="form-label">Max Items</label><input class="form-control" type="number" value="12" /></div>
                    <div class="form-group"><label class="form-label">Auto-Rotate</label><select class="form-control"><option>Yes</option><option>No</option></select></div>
                </div>
                <div style="display:flex;gap:.75rem;justify-content:flex-end;margin-top:1.5rem">
                    <button class="btn btn-secondary" onclick="go('widget-library')">Cancel</button>
                    <button class="btn btn-primary" onclick="window.saveWidgetConfig('${wid || ''}')"><i class="fa-solid fa-check"></i> Save Widget</button>
                </div>
            </div>
        </div>
        <div class="card" style="position:sticky;top:1rem">
            <div class="card-header"><span class="card-title">Live Preview</span></div>
            <div style="background:#0f172a;min-height:300px;border-radius:0 0 var(--radius) var(--radius);display:flex;align-items:center;justify-content:center">
                ${w ? '<div style="text-align:center;color:#fff"><div style="width:60px;height:60px;border-radius:16px;background:' + w.bg + ';display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto 1rem"><i class="fa-solid ' + w.icon + '"></i></div><div style="font-weight:700">' + w.name + '</div><div style="font-size:.75rem;color:rgba(255,255,255,.5);margin-top:.25rem">' + w.cat + '</div></div>' : '<div style="color:rgba(255,255,255,.3);font-size:.85rem">Select a widget to preview</div>'}
            </div>
        </div>
    </div>`;
};

// ═══════════════════════════════════════════════════════════════
//  WIDGET CONFIGURE SAVE
// ═══════════════════════════════════════════════════════════════
window.saveWidgetConfig = (wid) => {
    const name = document.querySelector('#main-content input[placeholder="My Widget"]')?.value?.trim() ||
                 document.querySelector('#widget_name')?.value?.trim();
    const maxItems = document.querySelector('#main-content input[type="number"]')?.value || '12';
    const autoRotate = document.querySelector('#main-content select')?.value || 'Yes';
    const category = document.querySelectorAll('#main-content select')[1]?.value || 'Navigation';

    if (!STATE.savedWidgets) STATE.savedWidgets = [];
    const existing = wid ? STATE.savedWidgets.find(w => w.id === wid) : null;
    if (existing) {
        Object.assign(existing, { name: name || existing.name, maxItems: Number(maxItems), autoRotate, category, updatedAt: new Date().toISOString() });
    } else {
        const def = WIDGET_DEFS.find(d => d.id === window.pendingWidget);
        STATE.savedWidgets.push({
            id: window.pendingWidget || ('W' + Date.now()),
            name: name || (def?.name || 'My Widget'),
            cat: category,
            icon: def?.icon || 'fa-puzzle-piece',
            bg: def?.bg || 'var(--acc)',
            maxItems: Number(maxItems),
            autoRotate,
            createdAt: new Date().toISOString(),
        });
    }
    saveState();
    window.pendingWidget = null;
    if (typeof window.toast === 'function') window.toast('Widget saved successfully', 'success');
    window.go('widget-library');
};

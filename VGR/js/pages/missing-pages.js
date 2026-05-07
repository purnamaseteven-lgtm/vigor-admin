/* ─── MISSING PAGE REGISTRATIONS ─── */
/* Pages referenced by app.html sidebar but not yet registered in modular JS */
import { STATE, saveState } from '../core/state.js';
import { pages, go } from '../core/router.js';
import { pageHeader, tableWrap, badge, openModal, closeModalBtn, toast } from '../ui/components.js';
import { WIDGET_DEFS } from '../widgets/definitions.js';

// Template list/actions were moved to customization.js.

// ────────────────────────────────────────────────────
// APP NOTIFICATION LEGACY FALLBACK
// ────────────────────────────────────────────────────
pages['app-notification-legacy'] = () => {
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

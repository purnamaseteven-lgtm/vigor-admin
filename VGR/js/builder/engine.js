/* ─── ADVANCED TEMPLATE BUILDER ENGINE v2.0 ─── */
import { pages } from '../core/router.js';
import { STATE, saveState } from '../core/state.js';
import { pageHeader, toast, openModal, closeModalBtn } from '../ui/components.js';
import { renderWidgetPreview } from '../widgets/preview.js';
import { WIDGET_DEFS } from '../widgets/definitions.js';

// Configuration & Default State
export const builderState = {
  layout: 'classic',
  templateName: 'My Awesome Site',
  device: 'desktop',
  activeZone: null,
  history: [],
  historyIdx: -1,
  theme: {
    primary: '#0ea5e9',
    accent: '#8b5cf6',
    radius: '16px',
    glass: '0.1',
    font: 'Inter'
  },
  dynamicZones: [
    { id: 'z-header', label: 'Main Navigation', height: 72, widget: 'banner-slider', span: '1 / -1' },
    { id: 'z-hero', label: 'Primary Banner', height: 350, widget: 'banner-slider', span: '1 / -1' },
    { id: 'z-games', label: 'All Games Grid', height: 450, widget: 'game-grid', span: '1 / -1' },
    { id: 'z-footer', label: 'Corporate Footer', height: 120, widget: null, span: '1 / -1' },
  ]
};

// Global Layout Definitions with Advanced Grid Support
export const LAYOUTS = {
  classic: {
    name: 'Classic Full-Width',
    type: 'single-col',
    grid: '1fr',
    desc: 'Standard vertical stacking, best for simple landing pages.'
  },
  sidebar_left: {
    name: 'Modern Sidebar Left',
    type: 'grid',
    grid: '280px 1fr',
    desc: 'Perfect for Sportsbook or category-heavy navigation.'
  },
  sidebar_right: {
    name: 'Dashboard Sidebar Right',
    type: 'grid',
    grid: '1fr 300px',
    desc: 'Ideal for casinos with active betslips or social feeds.'
  },
  three_column: {
    name: 'Pro Three-Column',
    type: 'grid',
    grid: '240px 1fr 240px',
    desc: 'Dense layout for master agents or professional betting.'
  },
  hybrid_app: {
    name: 'Hybrid Mobile-First',
    type: 'grid',
    grid: '80px 1fr',
    desc: 'Next-gen app style with vertical icon rail.'
  },
  joshoki_app: {
    name: 'Joshoki Premium Dark',
    type: 'single-col',
    grid: '1fr',
    desc: 'Dark theme mobile layout with Telegram & Mega Jackpot banners.'
  }
};

// ─── RENDERING FUNCTIONS ───

function renderVisualThumbnail(key, config) {
  const active = builderState.layout === key;
  const color = active ? 'var(--acc)' : 'var(--text3)';

  let gridStyle = '';
  if (config.type === 'grid') gridStyle = `display:grid; grid-template-columns:${config.grid.replace(/fr/g, 'fr ').replace(/px/g, 'px ')}; gap:2px;`;
  else gridStyle = `display:flex; flex-direction:column; gap:2px;`;

  return `
        <div class="layout-thumb ${active ? 'active' : ''}" onclick="window.switchLayout('${key}')">
            <div class="layout-preview" style="${gridStyle}">
                ${config.type === 'single-col' ? `
                    <div class="thumb-box head"></div>
                    <div class="thumb-box main"></div>
                    <div class="thumb-box foot"></div>
                ` : `
                    <div class="thumb-box head" style="grid-column:1/-1; height:8px"></div>
                    ${config.grid.split(' ').map((_, i) => `<div class="thumb-box" style="height:40px; opacity:${i === 1 || config.grid.split(' ').length === 2 ? '1' : '.4'}"></div>`).join('')}
                    <div class="thumb-box foot" style="grid-column:1/-1; height:8px"></div>
                `}
            </div>
            <div class="layout-label">${config.name}</div>
        </div>
    `;
}

function renderInspectorPanel() {
  const zone = builderState.activeZone ? builderState.dynamicZones.find(z => z.id === builderState.activeZone) : null;

  return `
        <div class="inspector-tabs">
            <button class="tab-btn active" onclick="window.setInspectorTab('section')">Section</button>
            <button class="tab-btn" onclick="window.setInspectorTab('theme')">Global Theme</button>
        </div>
        <div class="inspector-content">
            ${builderState.inspectorTab === 'section' ? renderSectionInspector(zone) : renderThemeInspector()}
        </div>
    `;
}

function renderSectionInspector(zone) {
  if (!zone) return `<div class="empty-inspector"><i class="fa-solid fa-mouse-pointer"></i><p>Select a section on canvas to edit</p></div>`;

  const widget = zone.widget ? WIDGET_DEFS.find(w => w.id === zone.widget) : null;

  return `
        <div class="inspector-group">
            <label>Section Label</label>
            <input type="text" value="${zone.label}" oninput="window.updateZoneData('${zone.id}', 'label', this.value)" />
        </div>
        <div class="inspector-group">
            <label>Height: ${zone.height}px</label>
            <input type="range" min="50" max="800" step="10" value="${zone.height}" oninput="window.updateZoneData('${zone.id}', 'height', this.value)" />
        </div>
        <div class="inspector-group">
            <label>Column Span (Grid Only)</label>
            <select onchange="window.updateZoneData('${zone.id}', 'span', this.value)">
                <option value="1 / -1" ${zone.span === '1 / -1' ? 'selected' : ''}>Full Width</option>
                <option value="1" ${zone.span === '1' ? 'selected' : ''}>Column 1</option>
                <option value="2" ${zone.span === '2' ? 'selected' : ''}>Column 2</option>
                <option value="3" ${zone.span === '3' ? 'selected' : ''}>Column 3</option>
            </select>
        </div>
        <div class="inspector-widget-card">
            <div class="card-label">Active Widget</div>
            ${widget ? `
                <div class="widget-info">
                    <div class="widget-icon" style="background:${widget.bg}"><i class="fa-solid ${widget.icon}"></i></div>
                    <div class="widget-meta"><strong>${widget.name}</strong><span>${widget.cat}</span></div>
                    <button class="clear-btn" onclick="window.clearZoneWidget('${zone.id}')"><i class="fa-solid fa-xmark"></i></button>
                </div>
            ` : `<div class="widget-empty">No widget assigned</div>`}
        </div>
        <button class="btn btn-danger btn-sm w-100" style="margin-top:2rem" onclick="window.deleteZone('${zone.id}')"><i class="fa-solid fa-trash"></i> Delete Section</button>
    `;
}

function renderThemeInspector() {
  const t = builderState.theme;
  return `
        <div class="inspector-group">
            <label>Primary Brand Color</label>
            <div class="color-picker-wrap">
                <input type="color" value="${t.primary}" oninput="window.updateTheme('primary', this.value)" />
                <code>${t.primary}</code>
            </div>
        </div>
        <div class="inspector-group">
            <label>Accent Color</label>
            <div class="color-picker-wrap">
                <input type="color" value="${t.accent}" oninput="window.updateTheme('accent', this.value)" />
                <code>${t.accent}</code>
            </div>
        </div>
        <div class="inspector-group">
            <label>Border Roundness</label>
            <select onchange="window.updateTheme('radius', this.value)">
                <option value="0px" ${t.radius === '0px' ? 'selected' : ''}>Square</option>
                <option value="8px" ${t.radius === '8px' ? 'selected' : ''}>Slightly Round</option>
                <option value="16px" ${t.radius === '16px' ? 'selected' : ''}>Default (Vigor)</option>
                <option value="32px" ${t.radius === '32px' ? 'selected' : ''}>Extra Round</option>
            </select>
        </div>
        <div class="inspector-group">
            <label>Glass Intensity</label>
            <input type="range" min="0" max="0.4" step="0.05" value="${t.glass}" oninput="window.updateTheme('glass', this.value)" />
        </div>
        <div class="alert alert-info" style="margin-top:2rem; font-size:.75rem">
            Theme changes apply globally to all widgets and layouts in this template.
        </div>
    `;
}

// ─── PAGE EXPORT ───

pages['template-builder'] = () => {
  const currentLayout = LAYOUTS[builderState.layout];

  return `
    <style>
        .builder-grid { display: grid; grid-template-columns: 280px 1fr 320px; gap: 1.25rem; height: calc(100vh - 160px); }
        .builder-sidebar { display: flex; flex-direction: column; gap: 1rem; overflow-y: auto; padding-right: .5rem; }
        
        /* Layout Thumbs */
        .layout-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
        .layout-thumb { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 10px; cursor: pointer; transition: all .2s; }
        .layout-thumb:hover { border-color: var(--acc); transform: translateY(-2px); }
        .layout-thumb.active { border-color: var(--acc); background: var(--acc-glow); box-shadow: 0 0 15px rgba(14,165,233,.1); }
        .layout-preview { height: 70px; background: rgba(0,0,0,.2); border-radius: 6px; padding: 4px; margin-bottom: 8px; }
        .thumb-box { background: var(--text3); border-radius: 2px; opacity: .3; }
        .thumb-box.head { background: var(--acc); opacity: .6; }
        .thumb-box.main { background: var(--acc); opacity: .8; height: 35px; }
        .layout-label { font-size: 11px; font-weight: 700; text-align: center; color: var(--text2); }
        
        /* Widgets */
        .widget-list { display: flex; flex-direction: column; gap: .6rem; }
        .draggable-widget { background: var(--surface); border: 1px solid var(--border); padding: .75rem; border-radius: 12px; display: flex; align-items: center; gap: .75rem; cursor: grab; transition: all .2s; }
        .draggable-widget:hover { border-color: var(--acc); background: var(--bg2); }
        .w-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.1rem; }
        .w-meta strong { display: block; font-size: .85rem; }
        .w-meta span { font-size: .68rem; color: var(--text3); }

        /* Canvas */
        .builder-canvas-wrap { background: var(--bg); border: 1px solid var(--border); border-radius: 24px; position: relative; overflow-y: auto; padding: 2rem; display: flex; justify-content: center; }
        .canvas-device { width: 100%; max-width: 1040px; min-height: 800px; background: #000; border-radius: 12px; padding: 1rem; transition: width .3s ease; }
        .canvas-grid-engine { display: grid; gap: 1rem; }
        
        /* Zones */
        .drop-zone { border: 1px dashed var(--border); border-radius: 16px; position: relative; transition: all .3s; display: flex; align-items: center; justify-content: center; min-height: 60px; background: rgba(255,255,255,.02); }
        .drop-zone:hover { border-color: var(--acc); background: rgba(14,165,233,.03); }
        .drop-zone.active { border-color: var(--acc); border-style: solid; background: rgba(14,165,233,.05); box-shadow: inset 0 0 20px rgba(14,165,233,.05); }
        .zone-label-tag { position: absolute; top: -10px; left: 15px; background: var(--surface); border: 1px solid var(--border); padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; color: var(--text3); z-index: 2; }
        
        /* Inspector */
        .inspector-panel { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; }
        .inspector-tabs { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid var(--border); }
        .tab-btn { padding: .75rem; border: none; background: none; color: var(--text3); font-weight: 700; font-size: .85rem; cursor: pointer; }
        .tab-btn.active { color: var(--acc); border-bottom: 2px solid var(--acc); background: rgba(14,165,233,.05); }
        .inspector-content { padding: 1.25rem; overflow-y: auto; flex: 1; }
        .inspector-group { margin-bottom: 1.25rem; }
        .inspector-group label { display: block; font-size: .75rem; font-weight: 700; color: var(--text2); margin-bottom: .5rem; }
        .color-picker-wrap { display: flex; align-items: center; gap: .75rem; }
        .color-picker-wrap input { width: 32px; height: 32px; padding: 0; border: none; background: none; cursor: pointer; }
        .color-picker-wrap code { font-size: .8rem; color: var(--acc); }
        .widget-info { display: flex; align-items: center; gap: .75rem; background: var(--bg2); padding: 10px; border-radius: 12px; margin-top: .5rem; }
    </style>

    ${pageHeader('Template Builder Pro', '<span>Customization</span><span class="sep">></span><span>Builder</span>', `
        <div style="display:flex; gap:.6rem">
            <div style="display:flex; background:var(--surface); padding:4px; border-radius:8px; border:1px solid var(--border)">
                <button class="btn btn-sm btn-icon ${builderState.device === 'desktop' ? 'active' : ''}" onclick="window.setDevice('desktop')"><i class="fa-solid fa-desktop"></i></button>
                <button class="btn btn-sm btn-icon ${builderState.device === 'tablet' ? 'active' : ''}" onclick="window.setDevice('tablet')"><i class="fa-solid fa-tablet"></i></button>
                <button class="btn btn-sm btn-icon ${builderState.device === 'mobile' ? 'active' : ''}" onclick="window.setDevice('mobile')"><i class="fa-solid fa-mobile"></i></button>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="window.undo()"><i class="fa-solid fa-rotate-left"></i></button>
            <button class="btn btn-primary btn-sm" onclick="window.saveTemplate()"><i class="fa-solid fa-floppy-disk"></i> Save Template</button>
        </div>
    `)}

    <div class="builder-grid">
        <aside class="builder-sidebar">
            <div class="card">
                <div class="card-header border-0"><span class="card-title">Layout Library</span></div>
                <div class="card-body pt-0 layout-grid">
                    ${Object.entries(LAYOUTS).map(([k, v]) => renderVisualThumbnail(k, v)).join('')}
                </div>
            </div>
            
            <div class="card">
                <div class="card-header border-0"><span class="card-title">Widget Library</span></div>
                <div class="card-body pt-0 widget-list" style="max-height:400px; overflow-y:auto">
                    ${WIDGET_DEFS.map(w => `
                        <div class="draggable-widget" draggable="true" ondragstart="window.dragWidgetStart(event, '${w.id}')" onclick="window.quickAssign('${w.id}')">
                            <div class="w-icon" style="background:${w.bg}"><i class="fa-solid ${w.icon}"></i></div>
                            <div class="w-meta"><strong>${w.name}</strong><span>${w.cat}</span></div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <button class="btn btn-outline btn-sm w-100" onclick="window.addNewZone()"><i class="fa-solid fa-plus"></i> Add New Section</button>
        </aside>

        <main class="builder-canvas-wrap">
            <div class="canvas-device" id="mainCanvas" style="width: ${builderState.device === 'mobile' ? '420px' : builderState.device === 'tablet' ? '768px' : '100%'}">
                <div class="canvas-grid-engine" style="grid-template-columns: ${currentLayout.type === 'grid' ? currentLayout.grid : '1fr'}">
                    ${builderState.dynamicZones.map((z, idx) => `
                        <div class="drop-zone ${builderState.activeZone === z.id ? 'active' : ''}" 
                             id="zone-${z.id}"
                             onclick="window.selectBuilderZone('${z.id}')"
                             ondragover="event.preventDefault()"
                             ondrop="window.handleWidgetDrop(event, '${z.id}')"
                             style="min-height:${z.height}px; grid-column:${z.span || 'initial'}">
                            <div class="zone-label-tag">${z.label}</div>
                            ${z.widget ? renderWidgetPreview(z.widget) : `<div style="opacity:.3; font-size:.7rem">DROP WIDGET</div>`}
                        </div>
                    `).join('')}
                </div>
            </div>
        </main>

        <section class="inspector-panel">
            ${renderInspectorPanel()}
        </section>
    </div>
  `;
};

// ─── WINDOW ACTIONS ───

window.switchLayout = (key) => {
  builderState.layout = key;
  toast(`Layout switched to ${LAYOUTS[key].name}`, 'info');
  go('template-builder');
};

window.selectBuilderZone = (id) => {
  builderState.activeZone = id;
  builderState.inspectorTab = 'section';
  go('template-builder');
};

window.setInspectorTab = (tab) => {
  builderState.inspectorTab = tab;
  go('template-builder');
};

window.setDevice = (dev) => {
  builderState.device = dev;
  go('template-builder');
};

window.updateZoneData = (id, key, val) => {
  const zone = builderState.dynamicZones.find(z => z.id === id);
  if (zone) {
    zone[key] = key === 'height' ? parseInt(val) : val;
    go('template-builder'); // Real-time update
  }
};

window.dragWidgetStart = (e, id) => {
  e.dataTransfer.setData('widgetId', id);
};

window.handleWidgetDrop = (e, zoneId) => {
  e.preventDefault();
  const widgetId = e.dataTransfer.getData('widgetId');
  const zone = builderState.dynamicZones.find(z => z.id === zoneId);
  if (zone && widgetId) {
    zone.widget = widgetId;
    toast('Widget assigned', 'success');
    go('template-builder');
  }
};

window.clearZoneWidget = (id) => {
  const zone = builderState.dynamicZones.find(z => z.id === id);
  if (zone) zone.widget = null;
  go('template-builder');
};

window.addNewZone = () => {
  const id = 'z-' + Date.now();
  builderState.dynamicZones.push({ id, label: 'New Section', height: 150, widget: null, span: '1 / -1' });
  builderState.activeZone = id;
  go('template-builder');
  toast('New section added', 'success');
};

window.deleteZone = (id) => {
  builderState.dynamicZones = builderState.dynamicZones.filter(z => z.id !== id);
  builderState.activeZone = null;
  go('template-builder');
  toast('Section removed', 'warning');
};

window.updateTheme = (key, val) => {
  builderState.theme[key] = val;
  // Apply real-time CSS variable update if needed, but go() rebuilds the UI
  go('template-builder');
};

window.saveTemplate = () => {
  saveState();
  toast('Template and theme saved successfully', 'success');
};

window.undo = () => {
  toast('Undo functionality coming in next build', 'info');
};

window.loadAndOptimizeTemplate = (tplId, tplName, colorsStr) => {
  let layoutType = 'classic';
  if (tplId === 'fs') layoutType = 'three_column';
  else if (tplId === 'joshoki' || tplId === 'joshoki-dark') layoutType = 'joshoki_app';

  // Initialize and load default widgets so the builder looks like a real template!
  builderState.zones = {};

  if (layoutType === 'joshoki_app') {
    builderState.zones['z-header'] = [{ type: 'nav-main' }, { type: 'news-marquee' }];
    builderState.zones['z-hero'] = [{ type: 'hero-banner' }];
    builderState.zones['z-games'] = [{ type: 'jackpot-ticker' }, { type: 'game-grid' }];
    builderState.zones['z-footer'] = [{ type: 'payment-rail' }, { type: 'corp-footer' }];
  } else if (layoutType === 'three_column') {
    builderState.zones['z-header'] = [{ type: 'nav-main' }, { type: 'winner-list' }];
    builderState.zones['z-hero'] = [{ type: 'hero-banner' }];
    builderState.zones['z-games'] = [{ type: 'game-grid' }];
    builderState.zones['z-footer'] = [{ type: 'payment-rail' }, { type: 'corp-footer' }];
  } else {
    builderState.zones['z-header'] = [{ type: 'nav-main' }];
    builderState.zones['z-hero'] = [{ type: 'hero-banner' }];
    builderState.zones['z-games'] = [{ type: 'game-grid' }];
    builderState.zones['z-footer'] = [{ type: 'corp-footer' }];
  }

  builderState.layout = layoutType;
  builderState.templateName = tplName || 'Custom Template';

  if (colorsStr) {
    const colors = colorsStr.split(',');
    if (colors[0]) builderState.theme.primary = colors[0];
    if (colors[1]) builderState.theme.accent = colors[1];
  }

  go('template-builder');
};

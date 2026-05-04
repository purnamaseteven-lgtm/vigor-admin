/* ─── HELPERS & UTILITIES ─── */
import { STATE } from '../core/state.js';
// Re-export constants from state for convenience
export { MEMBERS, COMPANIES, BANKS, STATUSES, GAMES, PROVIDERS, NL } from '../core/state.js';

export const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
export const fmtCur = (n) => "Rp " + fmt(n);
export const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export function makeDates(n) {
    const dates = [];
    const start = new Date(2026, 3, 27); // Apr 27, 2026
    for (let i = n - 1; i >= 0; i--) {
        const d = new Date(start);
        d.setDate(d.getDate() - i);
        dates.push(d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }));
    }
    return dates;
}

export function makeData(n, min, max) {
    return Array.from({ length: n }, () => rnd(min, max));
}

// ── Enhancement 4: Export table DOM to CSV ──
export function exportTableCSV(tableIdOrEl, filename = 'export.csv') {
    const table = (typeof tableIdOrEl === 'string')
        ? (document.getElementById(tableIdOrEl) || document.querySelector('.table-wrapper table'))
        : (tableIdOrEl || document.querySelector('.table-wrapper table'));
    if (!table) { if (typeof window.toast === 'function') window.toast('No table found', 'error'); return; }
    const rows = [...table.querySelectorAll('tr')];
    const csv = rows.map(row =>
        [...row.querySelectorAll('th,td')].map(cell => {
            const v = cell.innerText.replace(/[\r\n]+/g, ' ').trim();
            return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
        }).join(',')
    ).filter(r => r.replace(/,/g, '').trim()).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (typeof window.toast === 'function') window.toast('CSV exported successfully!', 'success');
}
window.exportTableCSV = exportTableCSV;

export function exportCSV(data, filename) {
    if (!data || !data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [
        keys.join(','),
        ...data.map(row => keys.map(k => {
            const v = row[k] === null || row[k] === undefined ? '' : String(row[k]);
            return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
window.exportCSV = exportCSV;

/* ─── PAGINATION & FILTERING ─── */
export const getFilter = (pg, k, def = '') => STATE._filters[pg]?.[k] ?? def;

// ── Enhancement 6: Live search with debounce ──
const _filterTimers = {};
export const setFilter = (pg, k, v) => {
    if (!STATE._filters[pg]) STATE._filters[pg] = {};
    if (v === 'All' || v === '') delete STATE._filters[pg][k];
    else STATE._filters[pg][k] = v;
    // Debounce re-render for live search (text inputs trigger this on every keystroke)
    clearTimeout(_filterTimers[pg]);
    _filterTimers[pg] = setTimeout(() => {
        if (typeof window.go === 'function') {
            STATE._page[pg] = 1; // reset to page 1 on filter change
            window._liveSearchRestore = { pg, k };
            window.go(pg);
        }
    }, 320);
};
export const resetFilters = (pg) => { if (STATE._filters[pg]) STATE._filters[pg] = {}; };

export const getCurPage = (k) => STATE._page[k] || 1;
export const getPerPage = (k) => STATE._perPage[k] || 30;
export const setPerPage = (k, n) => { STATE._perPage[k] = parseInt(n); STATE._page[k] = 1; };
export const goToPage = (k, n) => { STATE._page[k] = n; };

export function paginate(data, pg, pp) {
    const start = (pg - 1) * pp;
    return data.slice(start, start + pp);
}

// Keys from fsSelect use exact match; keys from fsInput use substring match
// We distinguish by checking if the value was from a <select> (exact) vs <input> (substring).
// Convention: select-based filters store value as-is; text filters also store as-is but we use contains.
// Since we can't easily distinguish, use exact only for known enum-like values (status, bank, company, type, etc.)
const EXACT_MATCH_KEYS = new Set(['status', 'bank', 'type', 'transactionType', 'walletType', 'category', 'action', 'target', 'pool', 'provider', 'tier']);

export function filterData(arr, pg) {
    const f = STATE._filters[pg];
    if (!f) return arr;
    return arr.filter(item => {
        return Object.entries(f).every(([k, v]) => {
            if (!v) return true;
            if (k === 'startDate') return new Date(item.date) >= new Date(v);
            if (k === 'endDate') {
                const ed = new Date(v);
                ed.setHours(23, 59, 59, 999);
                return new Date(item.date) <= ed;
            }
            if (k === '_search') {
                return Object.values(item).some(val => String(val).toLowerCase().includes(v.toLowerCase()));
            }
            const itemVal = String(item[k] ?? '').toLowerCase();
            const filterVal = String(v).toLowerCase();
            // Exact match for known enum keys; substring match for text search keys
            if (EXACT_MATCH_KEYS.has(k)) {
                return itemVal === filterVal;
            }
            return itemVal.includes(filterVal);
        });
    });
}

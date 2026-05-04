/* ─── CHART INITIALIZATION ─── */
import { STATE } from '../core/state.js';
import { makeDates, makeData, rnd } from '../utils/helpers.js';
import { activeCharts } from '../core/router.js';

const CHART_COLORS = { blue: '#0ea5e9', green: '#10b981', red: '#ef4444', yellow: '#f59e0b', purple: '#8b5cf6', indigo: '#6366f1' };

function prepareChart(id) {
    const ctx = document.getElementById(id);
    if (!ctx) return null;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();
    return ctx;
}

export function lineChart(id, labels, datasets) {
    const ctx = prepareChart(id);
    if (!ctx) return;
    activeCharts[id] = new Chart(ctx, {
        type: 'line',
        data: {
            labels, datasets: datasets.map(d => ({
                ...d, tension: 0.4, fill: d.fill !== false, pointRadius: 3,
                backgroundColor: d.color ? d.color + '20' : 'transparent',
                borderColor: d.color || CHART_COLORS.blue, borderWidth: 2,
                pointBackgroundColor: d.color || CHART_COLORS.blue
            }))
        },
        options: {
            responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
            plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } } },
            scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } } }
        }
    });
}

export function barChart(id, labels, datasets, stacked = false) {
    const ctx = prepareChart(id);
    if (!ctx) return;
    activeCharts[id] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels, datasets: datasets.map(d => ({
                ...d, backgroundColor: d.color || CHART_COLORS.blue, borderRadius: 4, borderSkipped: false
            }))
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { boxWidth: 10, font: { size: 11 } } } },
            scales: { x: { stacked, grid: { display: false }, ticks: { font: { size: 10 } } }, y: { stacked, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } } }
        }
    });
}

export function donutChart(id, labels, data, colors) {
    const ctx = prepareChart(id);
    if (!ctx) return;
    activeCharts[id] = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, hoverOffset: 4 }] },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, padding: 8 } } }
        }
    });
}

export function initPageCharts(page) {
    const DATES = makeDates(10);
    const PROVIDERS = ['All Providers', 'PRAGMATIC PLAY', 'HABANERO', 'MICROGAMING', 'SBOBET', 'EVOLUTION', 'JOKER', 'SPADEGAMING'];

    setTimeout(() => {
        if (page === 'statistics') {
            const dates14 = makeDates(14);
            lineChart('chartStatsDW', dates14, [
                { label: 'Deposit (M)', data: makeData(14, 30, 150), color: CHART_COLORS.green },
                { label: 'Withdraw (M)', data: makeData(14, 20, 100), color: CHART_COLORS.red }
            ]);
            donutChart('chartStatsMember', ['Active', 'Inactive', 'Suspended'], [
                STATE.members.filter(m => m.status === 'Active').length,
                STATE.members.filter(m => m.status === 'Inactive').length,
                STATE.members.filter(m => m.status === 'Suspended').length || 2
            ], [CHART_COLORS.green, CHART_COLORS.yellow, CHART_COLORS.red]);
            lineChart('chartStatsGGR', dates14, [{ label: 'GGR (M)', data: makeData(14, 10, 80), color: CHART_COLORS.purple }]);
            barChart('chartStatsNewMember', dates14, [{ label: 'New Members', data: makeData(14, 1, 10), color: CHART_COLORS.blue }]);
        }
        if (page === 'provider-analytics') {
            const pNames = ['PRAGMATIC', 'HABANERO', 'EVOLUTION', 'PG SOFT', 'JOKER', 'RTG', 'PLAY\nTECH', 'NETENT'];
            barChart('chartProviderGGR', pNames, [{ label: 'GGR (M)', data: makeData(8, 10, 120), color: CHART_COLORS.blue }]);
            donutChart('chartProviderShare', ['PRAGMATIC', 'HABANERO', 'EVOLUTION', 'PG SOFT', 'Others'],
                [35, 20, 18, 15, 12],
                [CHART_COLORS.blue, CHART_COLORS.purple, CHART_COLORS.green, CHART_COLORS.yellow, CHART_COLORS.indigo]);
        }
        if (page === 'results-analyze') {
            lineChart('chartResultTrend', makeDates(7), [
                { label: 'Total Bets', data: makeData(7, 200, 1000), color: CHART_COLORS.blue },
                { label: 'Total Payout (÷10k)', data: makeData(7, 150, 800), color: CHART_COLORS.red }
            ]);
        }
        if (page === 'dashboard') {
            const depCounts = [], witCounts = [], depVals = [], witVals = [];
            for (let d = 9; d >= 0; d--) {
                const dayN = 27 - d;
                const dDeps = STATE.deposits.filter(dep => dep.date && dep.date.includes(String(dayN) + '/') && dep.status === 'Approved');
                const dWits = STATE.withdrawals.filter(wit => wit.date && wit.date.includes(String(dayN) + '/') && wit.status === 'Approved');
                depCounts.push(dDeps.length || rnd(5, 25));
                witCounts.push(dWits.length || rnd(3, 18));
                depVals.push(Math.round((dDeps.reduce((s, dep) => s + dep.amount, 0) || rnd(50, 250) * 1000000) / 1000000));
                witVals.push(Math.round((dWits.reduce((s, wit) => s + wit.amount, 0) || rnd(30, 180) * 1000000) / 1000000));
            }
            lineChart('chartAgents', DATES, [{ label: 'Active', data: makeData(10, 5, 30), color: CHART_COLORS.blue }, { label: 'New', data: makeData(10, 0, 5), color: CHART_COLORS.green }]);
            lineChart('chartMembers', DATES, [{ label: 'Total', data: DATES.map((_, i) => Math.max(0, STATE.members.length - 40 + i * 4)), color: CHART_COLORS.green }, { label: 'Active', data: DATES.map((_, i) => Math.max(0, STATE.members.filter(m => m.status === 'Active').length - 25 + i * 3)), color: CHART_COLORS.blue }]);
            barChart('chartDWCount', DATES, [{ label: 'Deposit', data: depCounts, color: CHART_COLORS.green }, { label: 'Withdraw', data: witCounts, color: CHART_COLORS.red }]);
            lineChart('chartDWValue', DATES, [{ label: 'Deposit (M)', data: depVals, color: CHART_COLORS.green }, { label: 'Withdraw (M)', data: witVals, color: CHART_COLORS.red }]);
            barChart('chartTurnover', DATES.slice(-5), [{ label: 'Turnover (M)', data: DATES.slice(-5).map((_, i) => depVals[5 + i] + witVals[5 + i]), color: CHART_COLORS.purple }]);
            const totalDeposit = STATE.deposits.filter(d => d.status === 'Approved').reduce((s, d) => s + d.amount, 0);
            const totalWithdraw = STATE.withdrawals.filter(w => w.status === 'Approved').reduce((s, w) => s + w.amount, 0);
            const ggr = Math.round((totalDeposit - totalWithdraw) * 0.07);
            donutChart('chartAgentRatio', ['GGR', 'Commission', 'Transfer'], [Math.round(ggr * 0.6) || 55, Math.round(ggr * 0.3) || 30, Math.round(ggr * 0.1) || 15], [CHART_COLORS.green, CHART_COLORS.blue, CHART_COLORS.yellow]);
            const companyDeps = STATE.companies.slice(0, 4).map(c => STATE.deposits.filter(d => d.company === c.username && d.status === 'Approved').reduce((s, d) => s + d.amount, 0) / 1000000 || rnd(10, 50));
            donutChart('chartGGR', STATE.companies.slice(0, 4).map(c => c.username), companyDeps, [CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.purple, CHART_COLORS.yellow]);
            lineChart('chartBetCount', DATES, [{ label: 'Bets', data: makeData(10, 500, 3000), color: CHART_COLORS.indigo, fill: false }]);
            barChart('chartHourly', ['00', '04', '08', '12', '16', '20', '23'], [{ label: 'Players', data: makeData(7, 10, 500), color: CHART_COLORS.yellow }]);
        }
    }, 50);
}

window.initPageCharts = initPageCharts;

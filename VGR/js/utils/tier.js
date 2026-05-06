/* ─── TIER EVALUATION ENGINE ─── */
import { STATE, saveState, addLog, fmt, fmtCur } from '../core/state.js';

// ── Value calc for a single member ──────────────────────────────────
export function calcMemberValue(member, method) {
    const calcMethod = method || STATE.settings?.vipCalcMethod || 'turnover';
    if (calcMethod === 'deposit') {
        return (STATE.deposits || [])
            .filter(d => d.member === member.username && d.status === 'Approved')
            .reduce((s, d) => s + (d.amount || 0), 0);
    }
    // turnover: lottery bets + seamless transactions
    const lottoBets = (STATE.lotteryBets || [])
        .filter(b => b.member === member.username)
        .reduce((s, b) => s + (b.betAmount || 0), 0);
    const seamlessBets = (STATE.seamless?.transactions || [])
        .filter(t => t.player === member.username)
        .reduce((s, t) => s + (t.betAmount || 0), 0);
    return lottoBets + seamlessBets;
}

// ── Find qualifying tier from value ─────────────────────────────────
export function getQualifyingTier(value, method) {
    const calcMethod = method || STATE.settings?.vipCalcMethod || 'turnover';
    const field = calcMethod === 'deposit' ? 'minDeposit' : 'turnover';
    const sorted = [...STATE.vipTiers].sort(
        (a, b) => (b[field] || b.turnover || 0) - (a[field] || a.turnover || 0)
    );
    return sorted.find(t => value >= (t[field] || t.turnover || 0)) || STATE.vipTiers[0];
}

// ── Evaluate single member, log change if any ───────────────────────
export function evaluateMemberTier(member) {
    const method = STATE.settings?.vipCalcMethod || 'turnover';
    const value = calcMemberValue(member, method);
    const newTier = getQualifyingTier(value, method);
    const oldTierName = member.tier || (STATE.vipTiers[0]?.name);

    if (newTier.name !== oldTierName) {
        const oldIdx = STATE.vipTiers.findIndex(t => t.name === oldTierName);
        const newIdx = STATE.vipTiers.findIndex(t => t.name === newTier.name);
        const isUpgrade = newIdx > oldIdx;

        member.tier = newTier.name;
        member.tierId = newTier.id;
        member.tierValue = value;

        const event = {
            id: 'TH' + Date.now() + Math.random().toString(36).slice(2, 6),
            member: member.username,
            company: member.company || 'Global',
            fromTier: oldTierName,
            toTier: newTier.name,
            prevTier: oldTierName,
            newTier: newTier.name,
            reason: isUpgrade ? 'Auto-Upgrade' : 'Auto-Downgrade',
            change: isUpgrade ? 'Auto-Upgrade' : 'Auto-Downgrade',
            date: new Date().toLocaleString('id-ID', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }),
            turnover: value,
            actor: 'System',
        };

        if (!STATE.tierHistory) STATE.tierHistory = [];
        STATE.tierHistory.unshift(event);
        if (STATE.tierHistory.length > 500) STATE.tierHistory.pop();

        addLog('Tier Change', member.username,
            `${oldTierName} → ${newTier.name} (${isUpgrade ? 'upgrade' : 'downgrade'})`);

        return { changed: true, from: oldTierName, to: newTier.name, upgrade: isUpgrade };
    }
    return { changed: false };
}

// ── Evaluate ALL members ─────────────────────────────────────────────
export function evaluateAllMembers() {
    const members = STATE.members || [];
    let upgraded = 0, downgraded = 0;
    members.forEach(m => {
        const result = evaluateMemberTier(m);
        if (result.changed) {
            if (result.upgrade) upgraded++;
            else downgraded++;
        }
    });
    saveState();
    return { upgraded, downgraded, total: members.length };
}

// ── Tier distribution count per tier ────────────────────────────────
export function getTierDistribution() {
    const members = STATE.members || [];
    const method = STATE.settings?.vipCalcMethod || 'turnover';
    const dist = {};
    STATE.vipTiers.forEach(t => { dist[t.id] = { tier: t, count: 0 }; });
    members.forEach(m => {
        // Use member.tier if set, otherwise calculate
        if (m.tier) {
            const t = STATE.vipTiers.find(v => v.name === m.tier);
            if (t) { dist[t.id].count++; return; }
        }
        const value = calcMemberValue(m, method);
        const tier = getQualifyingTier(value, method);
        if (tier) dist[tier.id].count++;
    });
    return dist;
}

// ── Members close to next upgrade (within thresholdPct of next tier) ──
export function getMembersNearUpgrade(thresholdPct = 0.15) {
    const members = STATE.members || [];
    const method = STATE.settings?.vipCalcMethod || 'turnover';
    const field = method === 'deposit' ? 'minDeposit' : 'turnover';
    const sortedTiers = [...STATE.vipTiers].sort(
        (a, b) => (a[field] || a.turnover || 0) - (b[field] || b.turnover || 0)
    );
    const near = [];
    members.forEach(m => {
        const value = calcMemberValue(m, method);
        // Find their current tier index
        let currentIdx = -1;
        for (let i = sortedTiers.length - 1; i >= 0; i--) {
            if (value >= (sortedTiers[i][field] || sortedTiers[i].turnover || 0)) {
                currentIdx = i;
                break;
            }
        }
        if (currentIdx >= 0 && currentIdx < sortedTiers.length - 1) {
            const nextTier = sortedTiers[currentIdx + 1];
            const nextThreshold = nextTier[field] || nextTier.turnover || 0;
            const gap = nextThreshold - value;
            const pct = nextThreshold > 0 ? gap / nextThreshold : 1;
            if (pct <= thresholdPct && gap > 0) {
                near.push({
                    member: m.username,
                    currentTier: sortedTiers[currentIdx].name,
                    currentTierColor: sortedTiers[currentIdx].color,
                    nextTier: nextTier.name,
                    nextTierColor: nextTier.color,
                    value,
                    nextThreshold,
                    gap,
                    pct: Math.round(pct * 100),
                    progress: Math.round((value / nextThreshold) * 100),
                });
            }
        }
    });
    return near.sort((a, b) => a.pct - b.pct).slice(0, 8);
}

// ── Expose globally ──────────────────────────────────────────────────
window.evaluateAllMemberTiers = () => {
    const result = evaluateAllMembers();
    if (window.toast) toast(`Evaluasi selesai: ${result.upgraded} naik tier, ${result.downgraded} turun tier dari ${result.total} member`, 'success');
    if (window.go) go('custom-vip');
    return result;
};

window.tierEngine = { calcMemberValue, getQualifyingTier, evaluateMemberTier, evaluateAllMembers, getTierDistribution, getMembersNearUpgrade };

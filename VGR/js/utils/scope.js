/* ─── DATA SCOPE ENGINE ─────────────────────────────────────────────────────
 *
 *  Resolves which companies / members / transactions the current admin
 *  is allowed to see, based on their role + position in the company tree.
 *
 *  3-Level Hierarchy (parentId chain):
 *    SuperAdmin → everything
 *    Whitelabel → their brand + every child Agent in the tree
 *    Agent      → their company only (leaf node)
 * ─────────────────────────────────────────────────────────────────────────── */
import { STATE } from '../core/state.js';

// ── Resolve the set of company usernames visible to current admin ────────────
export function getScopedCompanyNames() {
    const { role, company } = STATE.currentAdmin;
    if (role === 'SuperAdmin') return null;           // null = unrestricted

    const myCompany = STATE.companies.find(c => c.username === company);
    if (!myCompany) return new Set([company]);        // fallback: own company only

    const result = new Set([company]);

    // Recursively add all children
    function addChildren(parentId) {
        STATE.companies
            .filter(c => c.parentId === parentId)
            .forEach(c => { result.add(c.username); addChildren(c.id); });
    }
    addChildren(myCompany.id);
    return result;
}

// ── Scoped data accessors ────────────────────────────────────────────────────
export function scopedMembers() {
    const { role, company, shop, id } = STATE.currentAdmin;
    const all = STATE.members || [];

    if (role === 'SuperAdmin') return all;

    const scope = getScopedCompanyNames();

    // Agent: own company only; if agentId present, further restrict
    if (role === 'Agent') {
        return all.filter(m => {
            if (m.company !== company) return false;
            if (m.agentId) return m.agentId === id;
            return true;   // no agentId on member → visible to any agent in company
        });
    }

    return all.filter(m => scope.has(m.company));
}

export function scopedDeposits() {
    const { role } = STATE.currentAdmin;
    const all = STATE.deposits || [];
    if (role === 'SuperAdmin') return all;

    const scope = getScopedCompanyNames();
    if (role === 'Agent') {
        const memberNames = new Set(scopedMembers().map(m => m.username));
        return all.filter(d => memberNames.has(d.member));
    }
    return all.filter(d => scope.has(d.company));
}

export function scopedWithdrawals() {
    const { role } = STATE.currentAdmin;
    const all = STATE.withdrawals || [];
    if (role === 'SuperAdmin') return all;

    const scope = getScopedCompanyNames();
    if (role === 'Agent') {
        const memberNames = new Set(scopedMembers().map(m => m.username));
        return all.filter(w => memberNames.has(w.member));
    }
    return all.filter(w => scope.has(w.company));
}

export function scopedCompanies() {
    const { role } = STATE.currentAdmin;
    const all = STATE.companies || [];
    if (role === 'SuperAdmin') return all;

    const scope = getScopedCompanyNames();
    return all.filter(c => scope.has(c.username));
}

// ── Scoped admins: returns only admins in the current admin's downline tree ──
export function scopedAdmins() {
    const { role, id } = STATE.currentAdmin;
    const all = STATE.admins || [];
    if (role === 'SuperAdmin') return all;

    // Build the set of admin IDs reachable downwards from the current admin
    const result = new Set([id]);
    function addChildren(parentId) {
        all.filter(a => a.parentId === parentId).forEach(a => {
            result.add(a.id);
            addChildren(a.id);
        });
    }
    addChildren(id);
    return all.filter(a => result.has(a.id));
}

// ── Human-readable scope description for UI banner ──────────────────────────
export function getScopeSummary() {
    const { role, company, name } = STATE.currentAdmin;
    if (role === 'SuperAdmin') return null;   // no banner for SuperAdmin

    const scope = getScopedCompanyNames();
    const companies = scopedCompanies();
    const members   = scopedMembers();
    const childCo   = companies.filter(c => c.username !== company);

    const roleLabel = {
        Whitelabel: 'Whitelabel',
        Agent:      'Agent',
    }[role] || role;

    return {
        role,
        roleLabel,
        company,
        name: name || company,
        scopeCount: scope ? scope.size : 'ALL',
        companyCount: companies.length,
        memberCount: members.length,
        childCount: childCo.length,
    };
}

// ── My own company record ────────────────────────────────────────────────────
export function getMyCompany() {
    const { company } = STATE.currentAdmin;
    return STATE.companies.find(c => c.username === company) || null;
}

// ── Direct (immediate) children of my company ────────────────────────────────
export function getDirectDownlines() {
    const { role } = STATE.currentAdmin;
    const all = STATE.companies || [];
    if (role === 'SuperAdmin') return all;

    const myCompany = getMyCompany();
    if (!myCompany) return [];
    return all.filter(c => c.parentId === myCompany.id);
}

// ── What company type this role creates as a downline ────────────────────────
// 3-level: SuperAdmin can create Whitelabel or Agent
//          Whitelabel creates Agent
//          Agent is a leaf (creates nothing)
export function getDownlineType() {
    const role = STATE.currentAdmin.role;
    const map = { SuperAdmin: 'Agent', Whitelabel: 'Agent', Agent: 'Agent' };
    return map[role] || 'Agent';
}

// ── Expose globally so pages can use without importing ──────────────────────
window.scope = {
    getScopedCompanyNames,
    scopedMembers,
    scopedDeposits,
    scopedWithdrawals,
    scopedCompanies,
    scopedAdmins,
    getScopeSummary,
    getMyCompany,
    getDirectDownlines,
    getDownlineType,
};

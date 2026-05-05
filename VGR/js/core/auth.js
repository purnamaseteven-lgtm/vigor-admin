/* ─── AUTH LAYER ─── */
import { supabase, SUPABASE_ENABLED } from './supabase.js';
import { STATE } from './state.js';

const DEMO_USERNAME    = 'adminsub40';
const DEMO_PASSWORD    = 'vgr-demo-2026';
const DEMO_SESSION_KEY = 'VGR_DEMO_SESSION';
const ROLE_ALIAS_MAP = {
    superadmin: 'SuperAdmin',
    company: 'Company',
    whitelabel: 'Company',
    master: 'Master',
    shop: 'Shop',
    agent: 'Agent',
};

function normalizeRole(role) {
    const key = String(role || '').toLowerCase().replace(/[\s_-]+/g, '');
    return ROLE_ALIAS_MAP[key] || 'Agent';
}

// ── Current session ──────────────────────────────────────────────
export async function getSession() {
    if (!SUPABASE_ENABLED || !supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// ── Get current admin profile ────────────────────────────────────
export async function getAdminProfile() {
    if (!SUPABASE_ENABLED || !supabase) return null;
    const session = await getSession();
    if (!session) return null;

    let { data } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

    // ── Auto-create profile on first login (no record found) ──────
    if (!data) {
        const email    = session.user.email || '';
        const username = email.split('@')[0] || 'admin';
        // Check if ANY admin profile exists; if none → first user = SuperAdmin
        const { count } = await supabase
            .from('admin_profiles')
            .select('id', { count: 'exact', head: true });
        const role = (count === 0) ? 'SuperAdmin' : 'Agent';
        const { data: created } = await supabase
            .from('admin_profiles')
            .insert({ id: session.user.id, username, name: username, role, company: 'SUBSTAG' })
            .select()
            .single();
        data = created;
    }

    if (data) {
        STATE.profile.username = data.username;
        STATE.profile.name     = data.name || data.username;
        const normalizedRole = normalizeRole(data.role);
        STATE.profile.role     = normalizedRole;
        STATE.profile.company  = data.company;
        STATE.profile.shop     = data.shop;
        STATE.currentAdmin.id       = session.user.id;
        STATE.currentAdmin.role     = normalizedRole;
        STATE.currentAdmin.company  = data.company;
        STATE.currentAdmin.username = data.username;
        STATE.currentAdmin.name     = data.name || data.username;
    }
    return data;
}

// ── Sign In ───────────────────────────────────────────────────────
export async function signIn(email, password) {
    if (!SUPABASE_ENABLED || !supabase) {
        const username = email.includes('@') ? email.split('@')[0] : email;
        if (username !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
            return { data: null, error: { message: 'Invalid demo credentials.' } };
        }
        const session = {
            user: { email: `${DEMO_USERNAME}@vigor.internal` },
            access_token: 'mock',
            expires_at: Date.now() + 8 * 60 * 60 * 1000,
        };
        sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
        STATE.profile.username         = DEMO_USERNAME;
        STATE.profile.name             = 'SUBSTAG';
        STATE.profile.role             = 'SuperAdmin';
        STATE.currentAdmin.role        = 'SuperAdmin';
        STATE.currentAdmin.username    = DEMO_USERNAME;
        STATE.currentAdmin.is2FAVerified = true;
        return { data: { user: session.user, session }, error: null };
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.user) {
        await getAdminProfile();
    }
    return { data, error };
}

// ── Sign Out ──────────────────────────────────────────────────────
export async function signOut() {
    if (!SUPABASE_ENABLED || !supabase) {
        sessionStorage.removeItem(DEMO_SESSION_KEY);
        window.location.href = './index.html';
        return;
    }
    await supabase.auth.signOut();
    window.location.href = './index.html';
}

// ── Auth guard ────────────────────────────────────────────────────
export async function requireAuth() {
    if (!SUPABASE_ENABLED) {
        const session = sessionStorage.getItem(DEMO_SESSION_KEY);
        if (!session) { window.location.href = './index.html'; return false; }
        return true;
    }
    const session = await getSession();
    if (!session) { window.location.href = './index.html'; return false; }
    await getAdminProfile();
    return true;
}

// ── Auth state change ─────────────────────────────────────────────
export function onAuthChange(callback) {
    if (!SUPABASE_ENABLED || !supabase) return () => { };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session);
        if (event === 'SIGNED_OUT') window.location.href = './index.html';
    });
    return () => subscription.unsubscribe();
}

window.logout = () => signOut();

// ══════════════════════════════════════════════════════════════════
//  RBAC — uses permissionMatrix from state.js (5 roles)
//  SuperAdmin / Company / Master / Shop / Agent
// ══════════════════════════════════════════════════════════════════

// ── Page key → module mapping (reverse of MODULE_MAP in applyRBAC) ───────────
const PAGE_MODULE_MAP = {
    'dashboard': 'home', 'statistics': 'home', 'provider-analytics': 'home', 'device-report': 'home',
    'master-whitelist': 'master', 'master-blacklist': 'master', 'master-wl-list': 'master',
    'system-admins': 'administrators', 'role-permissions': 'administrators', 'admin-management': 'administrators', 'admins-list': 'administrators',
    'company-list': 'companyManagement', 'company-create': 'companyManagement', 'my-downlines': 'companyManagement',
    'whitelabel-list': 'whitelabel', 'master-wl-list': 'whitelabel',
    'global-member-list': 'members', 'add-member': 'members', 'tier-history': 'members',
    'bank-list': 'bankManagement', 'bank-create': 'bankManagement',
    'deposit-list': 'finance', 'withdrawal-list': 'finance',
    'bets-list': 'bets', 'bets-table': 'bets', 'transferred-list': 'bets', 'bets-transferred': 'bets',
    'bonus-report': 'bonus', 'bonus-agent-freebet': 'bonus', 'bonus-agent-freebet-report': 'bonus', 'bonus-pragmatic-frb': 'bonus', 'promotions': 'bonus', 'promotion-release': 'bonus', 'promotion-rolling-release': 'bonus',
    'results-listing': 'results', 'result-scan': 'results', 'results-analyze': 'results',
    'provider-setup': 'integrations', 'pgsoft-api-logs': 'integrations', 'developer-docs': 'integrations',
    'site-config': 'customization', 'custom-template': 'customization', 'template-preview': 'customization', 'seo-tools': 'customization', 'system-theme': 'customization', 'global-banner': 'customization', 'app-notification': 'customization',
    'settings-commission': 'settings', 'settings-referral-rate': 'settings', 'settings-pools': 'settings', 'settings-games': 'settings', 'settings-agent-games': 'settings', 'settings-togel-commission': 'settings', 'settings-limit-credit-out': 'settings', 'custom-vip': 'settings', 'settings-rebate-calc': 'settings',
    'tools-coin2pay': 'tools', 'tools-host': 'tools', 'tools-sawala': 'tools', 'tools-unopay': 'tools', 'nawala-scan': 'tools',
    'crm-dashboard': 'crm', 'crm-segments': 'crm', 'crm-missions': 'crm', 'crm-tournaments': 'crm', 'crm-automation': 'crm', 'crm-push': 'crm', 'crm-dormancy': 'crm', 'crm-loyalty': 'crm',
    'memo-list': 'memo', 'auto-memo': 'memo',
    'report-winloss': 'reports', 'report-agent-daily': 'reports', 'report-limit-credit': 'reports', 'report-lost-money': 'reports', 'report-togel-lost': 'reports', 'report-top-turnover': 'reports',
    'invoice-monthly': 'invoice', 'invoice-file-management': 'invoice', 'invoice-tournament': 'invoice',
    'logs-admin': 'logs', 'logs-company': 'logs', 'logs-whitelabel': 'logs', 'logs-member': 'logs', 'logs-master-wl': 'logs',
};

// ── CRUD action normaliser — maps legacy action names to read/add/edit/delete ─
function normaliseToCRUD(action) {
    if (['read','view','list','get','statistics','dashboard','providerAnalytics','deviceReport','betsListing','bettingTable','transferredList','bonusReport','resultsListing','resultScan','resultsAnalyze','apiLogs','developerDocs','siteConfig','seoTools','systemTheme','globalBanner','commission','referralRate','poolsList','games','togelCommission','limitCreditOut','vipDesigner','rebateCalc','coin2pay','sawala','unopay','nawalaScan','memoBox','autoMemo','winloss','agentDaily','limitCredit','lostMoney','togelLost','topTurnover','monthly','fileManagement','tournamentWinners','adminLogs','companyLogs','whitelabelLogs','memberLogs','masterWlLogs','whitelist','blacklist','masterWhitelist','whitelabelList','bankList','rolePermissions','systemAdmins','agentFreebet','agentFreebetReport','pragmaticFrb','promotionRelease','promotionRollingRelease','promotions','templatePreview','appNotification','announcements','templateBuilder','dormancy','loyalty','segments','missions','tournaments','automation','push'].includes(action)) return 'read';
    if (['add','create','regisNewCompany','createNewBank','addMember','providerSetup','hostManagement'].includes(action)) return 'add';
    if (['edit','update','agentGameSettings','financeLimits'].includes(action)) return 'edit';
    if (['delete','remove'].includes(action)) return 'delete';
    return 'read';
}

/**
 * Check if current role has access to a specific permission
 * @param {string} module  e.g. 'finance'
 * @param {string} action  e.g. 'deposit'
 */
export function can(module, action) {
    const role = normalizeRole(STATE.currentAdmin.role);
    const roleNorm = String(role).toLowerCase().replace(/[\s_-]+/g, '');
    if (roleNorm === 'superadmin') return true;

    // Custom per-admin permissions override role matrix
    const cp = STATE.currentAdmin.customPermissions;
    if (cp) {
        const crud = normaliseToCRUD(action);
        // Find pages that belong to this module and check CRUD
        const relevantPages = Object.entries(PAGE_MODULE_MAP)
            .filter(([, mod]) => mod === module)
            .map(([page]) => page);
        return relevantPages.some(page => cp[page] && cp[page][crud] === true);
    }

    const matrix = STATE.permissionMatrix[role];
    if (!matrix) return false;
    const mod = matrix[module];
    if (!mod) return false;
    return !!mod[action];
}

/**
 * applyRBAC — hide sidebar items the current role can't access
 * Uses STATE.permissionMatrix for granular per-module control.
 */
export function applyRBAC() {
    const role = normalizeRole(STATE.currentAdmin.role);
    const roleNorm = String(role).toLowerCase().replace(/[\s_-]+/g, '');
    if (roleNorm === 'superadmin') {
        document.querySelectorAll('.nav-link[data-page]').forEach(link => { link.style.display = ''; });
        document.querySelectorAll('.sidebar-section').forEach(section => { section.style.display = ''; });
        document.body.setAttribute('data-role', 'SuperAdmin');
        return;
    }
    const matrix = STATE.permissionMatrix[role] || STATE.permissionMatrix['Agent'];

    // Module → sidebar data-module attribute mapping
    const MODULE_MAP = {
        'home':               ['dashboard','statistics','provider-analytics','device-report'],
        'master':             ['master-whitelist','master-blacklist','master-wl-list'],
        'administrators':     ['system-admins','role-permissions'],
        'companyManagement':  ['company-list','company-create','my-downlines'],
        'whitelabel':         ['whitelabel-list','master-wl-list'],
        'members':            ['global-member-list','add-member','tier-history'],
        'bankManagement':     ['bank-list','bank-create'],
        'finance':            ['deposit-list','withdrawal-list'],
        'bets':               ['bets-list','bets-table','transferred-list','bets-transferred'],
        'bonus':              ['bonus-report','bonus-agent-freebet','bonus-agent-freebet-report','bonus-pragmatic-frb','promotions','promotion-release','promotion-rolling-release'],
        'results':            ['results-listing','result-scan','results-analyze'],
        'integrations':       ['provider-setup','pgsoft-api-logs','developer-docs'],
        'customization':      ['site-config','custom-template','template-preview','seo-tools','system-theme','global-banner','app-notification'],
        'settings':           ['settings-commission','settings-referral-rate','settings-pools','settings-games','settings-agent-games','settings-togel-commission','settings-limit-credit-out','custom-vip','settings-rebate-calc'],
        'tools':              ['tools-coin2pay','tools-host','tools-sawala','tools-unopay','nawala-scan'],
        'crm':                ['crm-dashboard','crm-segments','crm-missions','crm-tournaments','crm-automation','crm-push','crm-dormancy','crm-loyalty'],
        'memo':               ['memo-list','auto-memo'],
        'reports':            ['report-winloss','report-agent-daily','report-limit-credit','report-lost-money','report-togel-lost','report-top-turnover'],
        'invoice':            ['invoice-monthly','invoice-file-management','invoice-tournament'],
        'logs':               ['logs-admin','logs-company','logs-whitelabel','logs-member','logs-master-wl'],
    };

    // Action key mapping per module (order matches MODULE_MAP arrays)
    const ACTION_MAP = {
        'home':               ['dashboard','statistics','providerAnalytics','deviceReport'],
        'master':             ['whitelist','blacklist','masterWhitelist'],
        'administrators':     ['systemAdmins','rolePermissions'],
        'companyManagement':  ['whitelabelList','regisNewCompany','myDownlines'],
        'whitelabel':         ['whitelabelList','masterWlList'],
        'members':            ['memberList','addMember','tierHistory'],
        'bankManagement':     ['bankList','createNewBank'],
        'finance':            ['deposit','withdrawal'],
        'bets':               ['betsListing','bettingTable','transferredList'],
        'bonus':              ['bonusReport','agentFreebet','agentFreebetReport','pragmaticFrb','promotions','promotionRelease','promotionRollingRelease'],
        'results':            ['resultsListing','resultScan','resultsAnalyze'],
        'integrations':       ['providerSetup','apiLogs','developerDocs'],
        'customization':      ['siteConfig','templateBuilder','templatePreview','seoTools','systemTheme','globalBanner','appNotification'],
        'settings':           ['commission','referralRate','poolsList','games','agentGameSettings','togelCommission','limitCreditOut','vipDesigner','rebateCalc'],
        'tools':              ['coin2pay','hostManagement','sawala','unopay','nawalaScan'],
        'crm':                ['dashboard','segments','missions','tournaments','automation','push','dormancy','loyalty'],
        'memo':               ['memoBox','autoMemo'],
        'reports':            ['winloss','agentDaily','limitCredit','lostMoney','togelLost','topTurnover'],
        'invoice':            ['monthly','fileManagement','tournamentWinners'],
        'logs':               ['adminLogs','companyLogs','whitelabelLogs','memberLogs','masterWlLogs'],
    };

    // Custom per-admin permissions override the role matrix for sidebar
    const cp = STATE.currentAdmin.customPermissions;

    // Hide/show nav links based on permission matrix
    document.querySelectorAll('.nav-link[data-page]').forEach(link => {
        const page = link.getAttribute('data-page');
        if (!page) return;

        let hasPermission = false;

        if (cp) {
            // Custom permissions: page must exist in cp with read:true
            hasPermission = !!(cp[page] && cp[page].read === true);
        } else {
            for (const [moduleName, pages] of Object.entries(MODULE_MAP)) {
                const idx = pages.indexOf(page);
                if (idx === -1) continue;
                const mod = matrix[moduleName];
                if (!mod) break;
                const actions = ACTION_MAP[moduleName] || [];
                const actionKey = actions[idx];
                hasPermission = actionKey ? !!mod[actionKey] : false;
                break;
            }
        }

        link.style.display = hasPermission ? '' : 'none';
    });

    // Hide section labels if all children are hidden
    document.querySelectorAll('.sidebar-section').forEach(section => {
        const links = section.querySelectorAll('.nav-link[data-page]');
        const anyVisible = Array.from(links).some(l => l.style.display !== 'none');
        section.style.display = anyVisible ? '' : 'none';
    });

    // Store resolved role in DOM for CSS targeting
    document.body.setAttribute('data-role', role);
}

/**
 * applyRBACToPage — call on each page render to conditionally show/hide
 * action buttons based on permissions.
 */
export function applyRBACToPage() {
    const role = STATE.currentAdmin.role || 'Agent';
    document.querySelectorAll('[data-require-role]').forEach(el => {
        const required = el.getAttribute('data-require-role').split(',').map(r => r.trim());
        el.style.display = required.includes(role) ? '' : 'none';
    });
    document.querySelectorAll('[data-require-perm]').forEach(el => {
        const [mod, action] = el.getAttribute('data-require-perm').split('.');
        el.style.display = can(mod, action) ? '' : 'none';
    });
}

// Expose globally
window.can = can;
window.applyRBAC = applyRBAC;
window.applyRBACToPage = applyRBACToPage;

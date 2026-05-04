/* ─── DATA ACCESS LAYER ───────────────────────────────────────────
   Bridge between Supabase (real DB) and STATE (local cache).
   Strategy: "stale-while-revalidate"
    1. Pages render instantly from STATE cache
    2. fetchForPage() fetches fresh data from Supabase in background
    3. STATE is updated → page auto re-renders
   ─────────────────────────────────────────────────────────────── */
import { supabase, SUPABASE_ENABLED } from './supabase.js';
import { STATE, saveState } from './state.js';

// ══════════════════════════════════════════════════════════════════
//  ROW MAPPERS  (DB snake_case → STATE camelCase)
// ══════════════════════════════════════════════════════════════════
const mapMember = r => ({
    id: r.id, username: r.username, name: r.name, company: r.company,
    phone: r.phone, bank: r.bank, bankAccount: r.bank_account,
    balance: r.balance || 0, status: r.status, tier: r.tier || 'Bronze',
    referral: r.referral, joined: r.joined, lastLogin: r.last_login, ip: r.ip,
});
const mapCompany = r => ({
    id: r.id, username: r.username, name: r.name, email: r.email,
    phone: r.phone, credit: r.credit || 0, members: r.members || 0,
    status: r.status, type: r.type, joined: r.joined,
    parentCompany: r.parent_company, togelMarkets: r.togel_markets || [],
});
const mapBank = r => ({
    id: r.id, bank: r.bank, accountName: r.account_name,
    accountNumber: r.account_number, type: r.type,
    minDeposit: r.min_deposit, maxDeposit: r.max_deposit,
    status: r.status, company: r.company,
});
const mapDeposit = r => ({
    id: r.id, member: r.member, company: r.company, bank: r.bank,
    amount: r.amount, status: r.status, date: r.date,
    processedBy: r.processed_by || '',
    paymentMethod: r.payment_method || 'manual',
    paymentRef: r.payment_ref || '',
});
const mapWithdrawal = r => ({
    id: r.id, member: r.member, company: r.company, bank: r.bank,
    accountNumber: r.account_number, amount: r.amount,
    status: r.status, date: r.date, processedBy: r.processed_by || '',
    paymentRef: r.payment_ref || '',
});
const mapMemo = r => ({
    id: r.id, type: r.type, from: r.from_user, to: r.to_user,
    subject: r.subject, body: r.body, category: r.category,
    read: r.is_read, date: r.date,
});
const mapLog = r => ({
    id: r.id, date: r.date, actor: r.actor, ip: r.ip,
    action: r.action, target: r.target, description: r.description,
});
const mapSeamlessTx = r => ({
    id: r.id, traceId: r.trace_id, player: r.player, company: r.company,
    provider: r.provider, gameId: r.game_id, gameName: r.game_name,
    parentBetId: r.parent_bet_id, betId: r.bet_id,
    transactionId: r.transaction_id,
    betAmount: r.bet_amount, winAmount: r.win_amount,
    transferAmount: r.transfer_amount, realTransferAmount: r.real_transfer_amount,
    transactionType: r.transaction_type, walletType: r.wallet_type,
    currency: r.currency, isEndRound: r.is_end_round, isFeature: r.is_feature,
    status: r.status, balanceAfter: r.balance_after,
    createTime: new Date(r.create_time).getTime(),
});
const mapPromotion = r => ({
    id: r.id, title: r.title, description: r.description, type: r.type,
    value: r.value, minDeposit: r.min_deposit, maxBonus: r.max_bonus,
    turnoverMultiplier: r.turnover_multiplier, status: r.status,
    startDate: r.start_date, endDate: r.end_date,
    company: r.company, imageUrl: r.image_url,
});
const mapBonus = r => ({
    id: r.id, member: r.member, company: r.company, type: r.type,
    depositAmount: r.deposit_amount, bonusAmount: r.bonus_amount,
    turnoverRequired: r.turnover_required, turnoverAchieved: r.turnover_achieved,
    status: r.status, promotionId: r.promotion_id,
    claimedAt: r.claimed_at, expiresAt: r.expires_at,
});
const mapLotteryBet = r => ({
    id: r.id, member: r.member, company: r.company,
    pool: r.pool, game: r.game, guess: r.guess,
    betAmount: r.bet_amount, paidAmount: r.paid_amount, winAmount: r.win_amount,
    discount: r.discount, status: r.status, drawDate: r.draw_date, date: r.date,
});
const mapLotteryResult = r => ({
    id: r.id, pool: r.pool, drawDate: r.draw_date,
    r1: r.result_1st, r2: r.result_2nd, r3: r.result_3rd,
    r4: Array.isArray(r.starter) ? r.starter.join(', ') : r.starter,
    r5: Array.isArray(r.consolation) ? r.consolation.join(', ') : r.consolation,
    result1st: r.result_1st, result2nd: r.result_2nd, result3rd: r.result_3rd,
    consolation: r.consolation || [], starter: r.starter || [],
    isSettled: r.is_settled, settledAt: r.settled_at,
});

function rpcOk(data) {
    return data && (data.ok === true || data.code === 'already_processed');
}

async function runMoneyRpc(name, params) {
    const { data, error } = await supabase.rpc(name, params);
    if (error) return { data, error };
    if (!rpcOk(data)) {
        return { data, error: { message: data?.message || data?.code || 'Transaction was not processed' } };
    }
    return { data, error: null };
}

async function getAuthHeaders() {
    if (!SUPABASE_ENABLED || !supabase) return { 'Content-Type': 'application/json' };
    const { data: { session } } = await supabase.auth.getSession();
    return {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    };
}

// ══════════════════════════════════════════════════════════════════
//  STATE → DB MAPPERS (camelCase → snake_case)
// ══════════════════════════════════════════════════════════════════
const toDbMember = d => ({
    id: d.id, username: d.username, name: d.name, company: d.company,
    phone: d.phone, bank: d.bank, bank_account: d.bankAccount,
    balance: d.balance, status: d.status, tier: d.tier,
    joined: d.joined, last_login: d.lastLogin, ip: d.ip,
});
const toDbCompany = d => ({
    id: d.id, username: d.username, name: d.name, email: d.email,
    phone: d.phone, credit: d.credit, status: d.status, type: d.type,
    parent_company: d.parentCompany || null,
    togel_markets: d.togelMarkets || [],
    joined: d.joined || new Date().toISOString().split('T')[0],
});
const toDbBank = d => ({
    id: d.id, bank: d.bank, account_name: d.accountName,
    account_number: d.accountNumber, type: d.type,
    min_deposit: d.minDeposit || 10000, max_deposit: d.maxDeposit || 100000000,
    status: d.status || 'Active', company: d.company || null,
});
const toDbDeposit = d => ({
    id: d.id, member: d.member, company: d.company, bank: d.bank,
    amount: d.amount, status: d.status, date: d.date,
    processed_by: d.processedBy, payment_method: d.paymentMethod || 'manual',
    payment_ref: d.paymentRef || null,
});
const toDbWithdrawal = d => ({
    id: d.id, member: d.member, company: d.company, bank: d.bank,
    account_number: d.accountNumber, amount: d.amount,
    status: d.status, date: d.date, processed_by: d.processedBy,
    payment_ref: d.paymentRef || null,
});
const toDbMemo = d => ({
    from_user: d.from, to_user: d.to, subject: d.subject,
    body: d.body, category: d.category || 'General',
    type: d.type || 'sent', date: d.date,
});
const toDbPromotion = d => ({
    id: d.id, title: d.title, description: d.description, type: d.type,
    value: d.value, min_deposit: d.minDeposit || 0, max_bonus: d.maxBonus || 0,
    turnover_multiplier: d.turnoverMultiplier || 1, status: d.status || 'Active',
    start_date: d.startDate, end_date: d.endDate,
    company: d.company || null, image_url: d.imageUrl || null,
});
const toDbBonus = d => ({
    member: d.member, company: d.company, type: d.type,
    deposit_amount: d.depositAmount || 0, bonus_amount: d.bonusAmount || 0,
    turnover_required: d.turnoverRequired || 0, turnover_achieved: d.turnoverAchieved || 0,
    status: d.status || 'Pending', promotion_id: d.promotionId || null,
    claimed_at: d.claimedAt || null, expires_at: d.expiresAt || null,
});
const toDbLotteryBet = d => ({
    id: d.id, member: d.member, company: d.company,
    pool: d.pool, game: d.game, guess: d.guess,
    bet_amount: d.betAmount, paid_amount: d.paidAmount || d.betAmount,
    win_amount: d.winAmount || 0, discount: d.discount || 0,
    status: d.status || 'Pending', draw_date: d.drawDate, date: d.date,
});

// ══════════════════════════════════════════════════════════════════
//  GENERIC FETCH WRAPPER
// ══════════════════════════════════════════════════════════════════
async function sbFetch(table, mapper, stateKey, query = null) {
    if (!SUPABASE_ENABLED || !supabase) return;
    try {
        let q = query || supabase.from(table).select('*').order('created_at', { ascending: false }).limit(500);
        const { data, error } = await q;
        if (error) { console.error(`[DB] ${table}:`, error.message); return; }
        if (data) {
            if (stateKey.includes('.')) {
                const [a, b] = stateKey.split('.');
                STATE[a][b] = data.map(mapper);
            } else {
                STATE[stateKey] = data.map(mapper);
            }
            saveState();
        }
    } catch (e) { console.error(`[DB] ${table} exception:`, e.message); }
}

// ══════════════════════════════════════════════════════════════════
//  FETCH FUNCTIONS
// ══════════════════════════════════════════════════════════════════
export const fetchMembers     = () => sbFetch('members', mapMember, 'members');
export const fetchCompanies   = () => sbFetch('companies', mapCompany, 'companies');
export const fetchBanks       = () => sbFetch('banks', mapBank, 'banks');
export const fetchDeposits    = () => sbFetch('deposits', mapDeposit, 'deposits',
    supabase?.from('deposits').select('*').order('created_at', { ascending: false }).limit(200));
export const fetchWithdrawals = () => sbFetch('withdrawals', mapWithdrawal, 'withdrawals',
    supabase?.from('withdrawals').select('*').order('created_at', { ascending: false }).limit(200));
export const fetchLogs        = () => sbFetch('admin_logs', mapLog, 'logs',
    supabase?.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(200));
export const fetchPromotions  = () => sbFetch('promotions', mapPromotion, 'promotions');
export const fetchAnnouncements = () => sbFetch('announcements', r => ({ ...r }), 'announcements');
export const fetchNotifications = () => sbFetch('notifications', r => ({ ...r }), 'notifications');
export const fetchBonuses     = () => sbFetch('bonuses', mapBonus, 'bonuses',
    supabase?.from('bonuses').select('*').order('created_at', { ascending: false }).limit(200));
export const fetchLotteryBets = () => sbFetch('lottery_bets', mapLotteryBet, 'lotteryBets',
    supabase?.from('lottery_bets').select('*').order('created_at', { ascending: false }).limit(300));
export const fetchLotteryResults = () => sbFetch('lottery_results', mapLotteryResult, 'lotteryResults',
    supabase?.from('lottery_results').select('*').order('draw_date', { ascending: false }).limit(100));
export const fetchSeamlessTransactions = () => sbFetch('seamless_transactions', mapSeamlessTx, 'seamless.transactions',
    supabase?.from('seamless_transactions').select('*').order('create_time', { ascending: false }).limit(300));
export const fetchSeamlessGames    = () => sbFetch('seamless_games', r => ({ ...r }), 'seamless.games');
export const fetchSeamlessApiLogs  = () => sbFetch('seamless_api_logs', r => ({
    id: r.id, provider: r.provider, endpoint: r.endpoint, method: r.method,
    httpStatus: r.http_status, traceId: r.trace_id, responseTime: r.response_time,
    player: r.player, status: r.status, requestBody: r.request_body,
    responseBody: r.response_body, timestamp: new Date(r.created_at).getTime(),
}), 'seamless.apiLogs');

export const fetchMemos = async () => {
    if (!SUPABASE_ENABLED || !supabase) return;
    const myUsername = STATE.profile.username;
    const { data } = await supabase
        .from('memos')
        .select('*')
        .or(`to_user.eq.${myUsername},from_user.eq.${myUsername}`)
        .order('created_at', { ascending: false });
    if (data) {
        STATE.memos.inbox = data.filter(m => m.to_user === myUsername && m.type !== 'trash').map(mapMemo);
        STATE.memos.sent  = data.filter(m => m.from_user === myUsername && m.type === 'sent').map(mapMemo);
        STATE.memos.trash = data.filter(m => m.type === 'trash').map(mapMemo);
        saveState();
    }
};

export const fetchSettings = async () => {
    if (!SUPABASE_ENABLED || !supabase) return;
    const { data } = await supabase.from('settings').select('*').is('company', null);
    if (data) {
        data.forEach(s => {
            switch (s.key) {
                case 'commission':             STATE.settings.commission            = Number(s.value); break;
                case 'referral':               STATE.settings.referral              = Number(s.value); break;
                case 'referral_slot':          STATE.settings.referralSlot          = Number(s.value); break;
                case 'min_deposit':            STATE.settings.minDeposit            = Number(s.value); break;
                case 'max_deposit':            STATE.settings.maxDeposit            = Number(s.value); break;
                case 'max_withdraw':           STATE.settings.maxWithdraw           = Number(s.value); break;
                case 'daily_withdraw_limit':   STATE.settings.dailyWithdrawLimit    = Number(s.value); break;
                case 'maintenance_mode':       STATE.settings.maintenanceMode       = s.value === 'true'; break;
                case 'registration_open':      STATE.settings.registrationOpen      = s.value !== 'false'; break;
                case 'auto_approve_deposit':   STATE.settings.autoApproveDeposit    = s.value === 'true'; break;
                case 'manual_withdraw_review': STATE.settings.manualWithdrawReview  = s.value !== 'false'; break;
                case 'permission_matrix': {
                    try { const pm = JSON.parse(s.value); if (pm && typeof pm === 'object') Object.assign(STATE.permissionMatrix, pm); } catch {}
                    break;
                }
            }
        });
        saveState();
    }
};

// ── Map page → fetches ─────────────────────────────────────────
const PAGE_FETCHES = {
    // ── Core ──────────────────────────────────────────────────
    'dashboard':                    [fetchDeposits, fetchWithdrawals, fetchMembers],

    // ── Members ───────────────────────────────────────────────
    'global-member-list':           [fetchMembers],
    'tier-history':                 [fetchMembers],
    'finance-adjustment':           [fetchMembers],

    // ── Companies & Banks ─────────────────────────────────────
    'company-list':                 [fetchCompanies],
    'company-create':               [fetchCompanies],
    'master':                       [fetchCompanies],
    'whitelabel-list':              [fetchCompanies],
    'master-whitelabel-list':       [fetchCompanies],
    'bank-list':                    [fetchBanks],
    'bank-create':                  [fetchBanks],

    // ── Finance ───────────────────────────────────────────────
    'deposit-list':                 [fetchDeposits],
    'withdrawal-list':              [fetchWithdrawals],

    // ── Bets & Results ────────────────────────────────────────
    'bets-list':                    [fetchLotteryBets],
    'bets-table':                   [fetchLotteryBets],
    'bets-transferred':             [fetchLotteryBets],
    'results-list':                 [fetchLotteryResults],
    'results-scan':                 [fetchLotteryResults],
    'results-analyze':              [fetchLotteryResults, fetchLotteryBets],

    // ── Bonus ─────────────────────────────────────────────────
    'bonus-report':                 [fetchBonuses],
    'bonus-agent-freebet':          [fetchBonuses],
    'bonus-agent-freebet-report':   [fetchBonuses],
    'bonus-freebet-report':         [fetchBonuses],
    'bonus-pragmatic-frb':          [fetchBonuses],

    // ── Promotions ────────────────────────────────────────────
    'custom-promotion-list':        [fetchPromotions],
    'promotions':                   [fetchPromotions],
    'custom-promotions':            [fetchPromotions],
    'promotion-release':            [fetchPromotions],
    'promotion-rolling-release':    [fetchPromotions],

    // ── Announcements ─────────────────────────────────────────
    'announcement-list':            [fetchAnnouncements],
    'announcements':                [fetchAnnouncements],
    'custom-app-notification':      [fetchAnnouncements],
    'app-notification':             [fetchAnnouncements],
    'custom-global-banner':         [fetchAnnouncements],

    // ── Seamless ──────────────────────────────────────────────
    'pgsoft-transactions':          [fetchSeamlessTransactions],
    'pgsoft-games':                 [fetchSeamlessGames],
    'pgsoft-api-logs':              [fetchSeamlessApiLogs],
    'seamless-transactions':        [fetchSeamlessTransactions],
    'seamless-games':               [fetchSeamlessGames],
    'seamless-api-logs':            [fetchSeamlessApiLogs],
    'seamless-config':              [fetchSeamlessGames],

    // ── Logs ──────────────────────────────────────────────────
    'logs-admin':                   [fetchLogs],
    'logs-company':                 [fetchLogs],
    'logs-member':                  [fetchLogs],
    'logs-whitelabel':              [fetchLogs],
    'logs-master-wl':               [fetchLogs],

    // ── Memos ─────────────────────────────────────────────────
    'memo-list':                    [fetchMemos],
    'memo-auto':                    [fetchMemos],

    // ── Settings ──────────────────────────────────────────────
    'settings-commission':          [fetchSettings],
    'settings-referral-rate':       [fetchSettings],
    'settings-finance':             [fetchSettings],
    'settings-pools':               [fetchSettings],
    'settings-togel-commission':    [fetchSettings],
    'settings-limit-credit-out':    [fetchSettings],
    'settings-vip-designer':        [fetchSettings, fetchMembers],
    'settings-rebate-calc':         [fetchSettings],
    'rebate-calc':                  [fetchSettings],
    'dev-menu-config':              [fetchSettings],
    'admin-management':             [fetchSettings],
    'settings-games':               [fetchSeamlessGames],
    'settings-agent-games':         [fetchSeamlessGames],

    // ── Customization ─────────────────────────────────────────
    'custom-site-config':           [fetchSettings],
    'custom-theme':                 [fetchSettings],
    'custom-seo':                   [fetchSettings],
    'custom-vip':                   [fetchSettings, fetchMembers],

    // ── Statistics & Reports ──────────────────────────────────
    'statistics':                   [fetchDeposits, fetchWithdrawals, fetchMembers, fetchCompanies],
    'provider-analytics':           [fetchSeamlessTransactions, fetchMembers],
    'device-report':                [fetchMembers],
    'reports-agent-daily':          [fetchDeposits, fetchWithdrawals, fetchCompanies],
    'reports-winloss':              [fetchDeposits, fetchWithdrawals, fetchMembers],
    'reports-limit-credit':         [fetchMembers, fetchCompanies],
    'reports-togel-lost':           [fetchLotteryBets, fetchLotteryResults],
    'reports-lost-money':           [fetchLotteryBets],
    'reports-top-turnover':         [fetchLotteryBets, fetchMembers],

    // ── Invoice ───────────────────────────────────────────────
    'invoice-monthly':              [fetchDeposits, fetchWithdrawals, fetchCompanies],
    'invoice-file':                 [fetchDeposits, fetchWithdrawals],
    'invoice-tournament':           [fetchMembers, fetchBonuses],
};

export async function fetchForPage(page) {
    const fns = PAGE_FETCHES[page];
    if (!fns || !SUPABASE_ENABLED) return;
    await Promise.all(fns.map(fn => fn()));
}

// ══════════════════════════════════════════════════════════════════
//  MEMBERS
// ══════════════════════════════════════════════════════════════════
export async function dbAddMember(member) {
    if (!SUPABASE_ENABLED || !supabase) {
        STATE.members.unshift(member); saveState(); return { data: member };
    }
    const { data, error } = await supabase.from('members').insert(toDbMember(member)).select().single();
    if (!error) { STATE.members.unshift(mapMember(data)); saveState(); }
    return { data, error };
}
export async function dbUpdateMember(id, updates) {
    if (!SUPABASE_ENABLED || !supabase) {
        const i = STATE.members.findIndex(x => x.id === id);
        if (i !== -1) STATE.members[i] = { ...STATE.members[i], ...updates };
        saveState(); return { error: null };
    }
    const { error } = await supabase.from('members').update(toDbMember({ ...updates, id })).eq('id', id);
    if (!error) {
        const i = STATE.members.findIndex(x => x.id === id);
        if (i !== -1) STATE.members[i] = { ...STATE.members[i], ...updates };
        saveState();
    }
    return { error };
}
export async function dbDeleteMember(id) {
    if (!SUPABASE_ENABLED || !supabase) {
        STATE.members = STATE.members.filter(x => x.id !== id); saveState(); return { error: null };
    }
    const { error } = await supabase.from('members').delete().eq('id', id);
    if (!error) { STATE.members = STATE.members.filter(x => x.id !== id); saveState(); }
    return { error };
}
export async function dbAdjustMemberBalance(memberId, amount, notes, processedBy) {
    const member = STATE.members.find(m => m.id === memberId);
    if (!member) return { error: { message: 'Member not found' } };
    const newBalance = member.balance + amount;
    if (newBalance < 0) return { error: { message: 'Insufficient member balance' } };
    if (!SUPABASE_ENABLED || !supabase) {
        member.balance = newBalance; saveState(); return { error: null };
    }
    const { error } = await supabase.from('members').update({ balance: newBalance }).eq('id', memberId);
    if (!error) {
        member.balance = newBalance; saveState();
        await dbWriteLog('Balance Adjustment', memberId, `${amount > 0 ? '+' : ''}${amount} — ${notes}`, processedBy);
    }
    return { error };
}

// ══════════════════════════════════════════════════════════════════
//  COMPANIES
// ══════════════════════════════════════════════════════════════════
export async function dbAddCompany(company) {
    if (!SUPABASE_ENABLED || !supabase) {
        STATE.companies.unshift(company); saveState(); return { data: company };
    }
    const { data, error } = await supabase.from('companies').insert(toDbCompany(company)).select().single();
    if (!error) { STATE.companies.unshift(mapCompany(data)); saveState(); }
    return { data, error };
}
export async function dbUpdateCompany(id, updates) {
    if (!SUPABASE_ENABLED || !supabase) {
        const i = STATE.companies.findIndex(x => x.id === id);
        if (i !== -1) STATE.companies[i] = { ...STATE.companies[i], ...updates };
        saveState(); return { error: null };
    }
    const { error } = await supabase.from('companies').update(toDbCompany({ ...updates, id })).eq('id', id);
    if (!error) {
        const i = STATE.companies.findIndex(x => x.id === id);
        if (i !== -1) STATE.companies[i] = { ...STATE.companies[i], ...updates };
        saveState();
    }
    return { error };
}
export async function dbDeleteCompany(id) {
    if (!SUPABASE_ENABLED || !supabase) {
        STATE.companies = STATE.companies.filter(x => x.id !== id); saveState(); return { error: null };
    }
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (!error) { STATE.companies = STATE.companies.filter(x => x.id !== id); saveState(); }
    return { error };
}

// ══════════════════════════════════════════════════════════════════
//  BANKS
// ══════════════════════════════════════════════════════════════════
export async function dbAddBank(bank) {
    if (!SUPABASE_ENABLED || !supabase) {
        STATE.banks.unshift(bank); saveState(); return { data: bank };
    }
    const { data, error } = await supabase.from('banks').insert(toDbBank(bank)).select().single();
    if (!error) { STATE.banks.unshift(mapBank(data)); saveState(); }
    return { data, error };
}
export async function dbUpdateBank(id, updates) {
    if (!SUPABASE_ENABLED || !supabase) {
        const i = STATE.banks.findIndex(x => x.id === id);
        if (i !== -1) STATE.banks[i] = { ...STATE.banks[i], ...updates };
        saveState(); return { error: null };
    }
    const { error } = await supabase.from('banks').update(toDbBank({ ...updates, id })).eq('id', id);
    if (!error) {
        const i = STATE.banks.findIndex(x => x.id === id);
        if (i !== -1) STATE.banks[i] = { ...STATE.banks[i], ...updates };
        saveState();
    }
    return { error };
}
export async function dbDeleteBank(id) {
    if (!SUPABASE_ENABLED || !supabase) {
        STATE.banks = STATE.banks.filter(x => x.id !== id); saveState(); return { error: null };
    }
    const { error } = await supabase.from('banks').delete().eq('id', id);
    if (!error) { STATE.banks = STATE.banks.filter(x => x.id !== id); saveState(); }
    return { error };
}

// ══════════════════════════════════════════════════════════════════
//  DEPOSITS
// ══════════════════════════════════════════════════════════════════
export async function dbAddDeposit(deposit) {
    if (!SUPABASE_ENABLED || !supabase) {
        STATE.deposits.unshift(deposit); saveState(); return { data: deposit };
    }
    const { data, error } = await supabase.from('deposits').insert(toDbDeposit(deposit)).select().single();
    if (!error) { STATE.deposits.unshift(mapDeposit(data)); saveState(); }
    return { data, error };
}
export async function dbApproveDeposit(id, adminUser = 'admin') {
    if (!SUPABASE_ENABLED || !supabase) {
        const i = STATE.deposits.findIndex(x => x.id === id);
        if (i !== -1) STATE.deposits[i] = { ...STATE.deposits[i], status: 'Approved', processedBy: adminUser };
        saveState(); return { error: null };
    }
    const { error } = await runMoneyRpc('approve_deposit', { p_deposit_id: id, p_processed_by: adminUser });
    if (!error) {
        await Promise.all([fetchDeposits(), fetchMembers(), fetchLogs()]);
    }
    return { error };
}
export async function dbRejectDeposit(id, adminUser = 'admin') {
    if (!SUPABASE_ENABLED || !supabase) {
        const i = STATE.deposits.findIndex(x => x.id === id);
        if (i !== -1) STATE.deposits[i] = { ...STATE.deposits[i], status: 'Rejected', processedBy: adminUser };
        saveState(); return { error: null };
    }
    const { error } = await runMoneyRpc('reject_deposit', { p_deposit_id: id, p_processed_by: adminUser });
    if (!error) await Promise.all([fetchDeposits(), fetchLogs()]);
    return { error };
}

// ══════════════════════════════════════════════════════════════════
//  WITHDRAWALS
// ══════════════════════════════════════════════════════════════════
export async function dbAddWithdrawal(withdrawal) {
    if (!SUPABASE_ENABLED || !supabase) {
        STATE.withdrawals.unshift(withdrawal); saveState(); return { data: withdrawal };
    }
    const { data, error } = await supabase.from('withdrawals').insert(toDbWithdrawal(withdrawal)).select().single();
    if (!error) { STATE.withdrawals.unshift(mapWithdrawal(data)); saveState(); }
    return { data, error };
}
export async function dbApproveWithdrawal(id, adminUser = 'admin') {
    if (!SUPABASE_ENABLED || !supabase) {
        const i = STATE.withdrawals.findIndex(x => x.id === id);
        if (i !== -1) STATE.withdrawals[i] = { ...STATE.withdrawals[i], status: 'Approved', processedBy: adminUser };
        saveState(); return { error: null };
    }
    const { error } = await runMoneyRpc('approve_withdrawal', { p_withdrawal_id: id, p_processed_by: adminUser });
    if (!error) {
        await Promise.all([fetchWithdrawals(), fetchMembers(), fetchLogs()]);
    }
    return { error };
}
export async function dbRejectWithdrawal(id, adminUser = 'admin') {
    if (!SUPABASE_ENABLED || !supabase) {
        const i = STATE.withdrawals.findIndex(x => x.id === id);
        if (i !== -1) STATE.withdrawals[i] = { ...STATE.withdrawals[i], status: 'Rejected', processedBy: adminUser };
        saveState(); return { error: null };
    }
    const { error } = await runMoneyRpc('reject_withdrawal', { p_withdrawal_id: id, p_processed_by: adminUser });
    if (!error) await Promise.all([fetchWithdrawals(), fetchLogs()]);
    return { error };
}

// ══════════════════════════════════════════════════════════════════
//  MEMOS
// ══════════════════════════════════════════════════════════════════
export async function dbSendMemo(memo) {
    const now = new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const entry = { ...memo, date: now, type: 'sent' };
    if (!SUPABASE_ENABLED || !supabase) {
        STATE.memos.sent.unshift({ id: 'M' + Date.now(), ...entry, read: false });
        saveState(); return { error: null };
    }
    const { error } = await supabase.from('memos').insert(toDbMemo({ ...entry, type: 'sent' }));
    if (!error) {
        // Also create inbox copy for recipient
        await supabase.from('memos').insert(toDbMemo({ ...entry, type: 'inbox' }));
        await fetchMemos();
    }
    return { error };
}
export async function dbMarkMemoRead(id) {
    if (!SUPABASE_ENABLED || !supabase) {
        const m = STATE.memos.inbox.find(x => x.id === id);
        if (m) m.read = true; saveState(); return;
    }
    await supabase.from('memos').update({ is_read: true }).eq('id', id);
    const m = STATE.memos.inbox.find(x => x.id === id);
    if (m) { m.read = true; saveState(); }
}
export async function dbDeleteMemo(id) {
    if (!SUPABASE_ENABLED || !supabase) {
        STATE.memos.inbox = STATE.memos.inbox.filter(x => x.id !== id);
        STATE.memos.sent  = STATE.memos.sent.filter(x => x.id !== id);
        saveState(); return { error: null };
    }
    const { error } = await supabase.from('memos').update({ type: 'trash' }).eq('id', id);
    if (!error) await fetchMemos();
    return { error };
}

// ══════════════════════════════════════════════════════════════════
//  PROMOTIONS
// ══════════════════════════════════════════════════════════════════
export async function dbAddPromotion(promo) {
    const entry = { id: 'PROMO' + Date.now(), ...promo };
    if (!SUPABASE_ENABLED || !supabase) {
        if (!STATE.promotions) STATE.promotions = [];
        STATE.promotions.unshift(entry); saveState(); return { data: entry };
    }
    const { data, error } = await supabase.from('promotions').insert(toDbPromotion(entry)).select().single();
    if (!error) { STATE.promotions.unshift(mapPromotion(data)); saveState(); }
    return { data, error };
}
export async function dbUpdatePromotion(id, updates) {
    if (!SUPABASE_ENABLED || !supabase) {
        const i = STATE.promotions.findIndex(x => x.id === id);
        if (i !== -1) STATE.promotions[i] = { ...STATE.promotions[i], ...updates };
        saveState(); return { error: null };
    }
    const { error } = await supabase.from('promotions').update(toDbPromotion({ ...updates, id })).eq('id', id);
    if (!error) {
        const i = STATE.promotions.findIndex(x => x.id === id);
        if (i !== -1) STATE.promotions[i] = { ...STATE.promotions[i], ...updates };
        saveState();
    }
    return { error };
}
export async function dbDeletePromotion(id) {
    if (!SUPABASE_ENABLED || !supabase) {
        STATE.promotions = STATE.promotions.filter(x => x.id !== id); saveState(); return { error: null };
    }
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (!error) { STATE.promotions = STATE.promotions.filter(x => x.id !== id); saveState(); }
    return { error };
}

// ══════════════════════════════════════════════════════════════════
//  ANNOUNCEMENTS
// ══════════════════════════════════════════════════════════════════
export async function dbAddAnnouncement(ann) {
    const entry = { id: 'ANN' + Date.now(), ...ann };
    if (!SUPABASE_ENABLED || !supabase) {
        STATE.announcements.unshift(entry); saveState(); return { data: entry };
    }
    const { data, error } = await supabase.from('announcements').insert({
        title: ann.title, content: ann.content, type: ann.type || 'info',
        priority: ann.priority || 0, is_active: ann.isActive !== false,
        company: ann.company || null,
    }).select().single();
    if (!error) { STATE.announcements.unshift(data); saveState(); }
    return { data, error };
}
export async function dbUpdateAnnouncement(id, updates) {
    if (!SUPABASE_ENABLED || !supabase) {
        const i = STATE.announcements.findIndex(x => x.id === id);
        if (i !== -1) STATE.announcements[i] = { ...STATE.announcements[i], ...updates };
        saveState(); return { error: null };
    }
    const { error } = await supabase.from('announcements').update({
        title: updates.title, content: updates.content, type: updates.type,
        priority: updates.priority, is_active: updates.isActive,
    }).eq('id', id);
    if (!error) {
        const i = STATE.announcements.findIndex(x => x.id === id);
        if (i !== -1) STATE.announcements[i] = { ...STATE.announcements[i], ...updates };
        saveState();
    }
    return { error };
}
export async function dbDeleteAnnouncement(id) {
    if (!SUPABASE_ENABLED || !supabase) {
        STATE.announcements = STATE.announcements.filter(x => x.id !== id); saveState(); return { error: null };
    }
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) { STATE.announcements = STATE.announcements.filter(x => x.id !== id); saveState(); }
    return { error };
}

// ══════════════════════════════════════════════════════════════════
//  BONUSES
// ══════════════════════════════════════════════════════════════════
export async function dbCreateBonus(bonus) {
    const entry = { id: 'BNS' + Date.now(), ...bonus, status: 'Pending' };
    if (!SUPABASE_ENABLED || !supabase) {
        if (!STATE.bonuses) STATE.bonuses = [];
        STATE.bonuses.unshift(entry); saveState(); return { data: entry };
    }
    const { data, error } = await supabase.from('bonuses').insert(toDbBonus(entry)).select().single();
    if (!error) { STATE.bonuses.unshift(mapBonus(data)); saveState(); }
    return { data, error };
}
export async function dbClaimBonus(id) {
    const now = new Date().toLocaleString('id-ID');
    if (!SUPABASE_ENABLED || !supabase) {
        const i = (STATE.bonuses || []).findIndex(x => x.id === id);
        if (i !== -1) STATE.bonuses[i] = { ...STATE.bonuses[i], status: 'Claimed', claimedAt: now };
        saveState(); return { error: null };
    }
    const { error } = await supabase.from('bonuses').update({ status: 'Claimed', claimed_at: now }).eq('id', id);
    if (!error) await fetchBonuses();
    return { error };
}
export async function dbCancelBonus(id) {
    if (!SUPABASE_ENABLED || !supabase) {
        const i = (STATE.bonuses || []).findIndex(x => x.id === id);
        if (i !== -1) STATE.bonuses[i] = { ...STATE.bonuses[i], status: 'Cancelled' };
        saveState(); return { error: null };
    }
    const { error } = await supabase.from('bonuses').update({ status: 'Cancelled' }).eq('id', id);
    if (!error) await fetchBonuses();
    return { error };
}

// ══════════════════════════════════════════════════════════════════
//  LOTTERY BETS + RESULTS
// ══════════════════════════════════════════════════════════════════
export async function dbAddLotteryBet(bet) {
    if (!SUPABASE_ENABLED || !supabase) {
        if (!STATE.lotteryBets) STATE.lotteryBets = [];
        STATE.lotteryBets.unshift(bet); saveState(); return { data: bet };
    }
    const { data, error } = await supabase.from('lottery_bets').insert(toDbLotteryBet(bet)).select().single();
    if (!error) { STATE.lotteryBets.unshift(mapLotteryBet(data)); saveState(); }
    return { data, error };
}
export async function dbSaveLotteryResult(result) {
    if (!SUPABASE_ENABLED || !supabase) {
        if (!STATE.lotteryResults) STATE.lotteryResults = [];
        STATE.lotteryResults.unshift(result); saveState(); return { data: result };
    }
    const { data, error } = await supabase.from('lottery_results').upsert({
        pool: result.pool, draw_date: result.drawDate,
        result_1st: result.result1st || result.r1,
        result_2nd: result.result2nd || result.r2,
        result_3rd: result.result3rd || result.r3,
        consolation: result.consolation || (result.r5 ? [result.r5] : []),
        starter: result.starter || (result.r4 ? [result.r4] : []),
        is_settled: result.isSettled || false,
    }, { onConflict: 'pool,draw_date' }).select().single();
    if (!error && data) {
        if (!STATE.lotteryResults) STATE.lotteryResults = [];
        const i = STATE.lotteryResults.findIndex(x => x.pool === data.pool && x.drawDate === data.draw_date);
        const mapped = mapLotteryResult(data);
        if (i !== -1) STATE.lotteryResults[i] = mapped;
        else STATE.lotteryResults.unshift(mapped);
        saveState();
    }
    return { data, error };
}
export async function dbSettleLotteryBets(pool, drawDate, results) {
    // Called after a draw result is saved — settles all pending bets for that pool/date
    if (!SUPABASE_ENABLED || !supabase) {
        // Mock settlement
        (STATE.lotteryBets || []).forEach(bet => {
            if (bet.pool === pool && bet.drawDate === drawDate && bet.status === 'Pending') {
                bet.status = checkBetWin(bet, results) ? 'Won' : 'Lost';
            }
        });
        saveState(); return;
    }
    const { data: bets } = await supabase.from('lottery_bets')
        .select('*')
        .eq('pool', pool)
        .eq('draw_date', drawDate)
        .eq('status', 'Pending');

    if (!bets || !bets.length) return;

    for (const bet of bets) {
        const won = checkBetWin(mapLotteryBet(bet), results);
        const winAmount = won ? calculateWinAmount(mapLotteryBet(bet), results) : 0;
        await supabase.from('lottery_bets').update({
            status: won ? 'Won' : 'Lost',
            win_amount: winAmount,
        }).eq('id', bet.id);
        if (won && winAmount > 0) {
            const member = STATE.members.find(m => m.username === bet.member);
            if (member) await dbAdjustMemberBalance(member.id, winAmount, `Lottery win ${bet.id}`, 'system');
        }
    }
    await fetchLotteryBets();
}

function checkBetWin(bet, results) {
    const { result1st, result2nd, result3rd } = results;
    const r1 = result1st || '';
    switch (bet.game) {
        case '4D': return bet.guess === r1.slice(-4);
        case '3D': return bet.guess === r1.slice(-3);
        case '2D': return bet.guess === r1.slice(-2);
        case 'Colok Bebas': return r1.includes(bet.guess);
        default: return false;
    }
}

function calculateWinAmount(bet, results) {
    const BASE_PRIZES = { '4D': 3000, '3D': 400, '2D': 70, 'Colok Bebas': 70 };
    const multiplier = BASE_PRIZES[bet.game] || 1;
    return (bet.paidAmount || bet.betAmount) * multiplier;
}

// ══════════════════════════════════════════════════════════════════
//  SEAMLESS CONFIG
// ══════════════════════════════════════════════════════════════════
export async function dbUpdateSeamlessConfig(config) {
    STATE.seamless.config = { ...STATE.seamless.config, ...config };
    if (!SUPABASE_ENABLED || !supabase) { saveState(); return { error: null }; }
    const configEntries = Object.entries(config).map(([k, v]) => ({
        key: 'seamless_' + k, value: typeof v === 'object' ? JSON.stringify(v) : String(v), company: null,
    }));
    const { error } = await supabase.from('settings').upsert(configEntries, { onConflict: 'key' });
    saveState();
    return { error };
}

// ══════════════════════════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════════════════════════
export async function dbSaveSetting(key, value, company = null) {
    if (!SUPABASE_ENABLED || !supabase) return { error: null };
    const { error } = await supabase.from('settings').upsert(
        { key, value: String(value), company, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
    );
    return { error };
}

// ══════════════════════════════════════════════════════════════════
//  ADMIN PROFILES CRUD
// ══════════════════════════════════════════════════════════════════
export async function dbAddAdmin(adminData, password = null) {
    if (!SUPABASE_ENABLED || !supabase) {
        STATE.admins = STATE.admins || [];
        STATE.admins.unshift(adminData);
        saveState();
        return { error: null };
    }

    // Prefer server-side creation (has service_role key to create Auth users)
    const API_BASE    = import.meta.env.VITE_API_SERVER_URL || '';
    if (API_BASE && password) {
        try {
            const res = await fetch(`${API_BASE}/api/admin/create-user`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({ ...adminData, password }),
            });
            const result = await res.json();
            if (!res.ok && res.status !== 207) {
                return { error: { message: result.error || 'Server: admin creation failed' } };
            }
            // Use the real Supabase user ID returned by server
            adminData.id = result.id || adminData.id;
            STATE.admins = STATE.admins || [];
            STATE.admins.unshift(adminData);
            saveState();
            if (result.warning) console.warn('[dbAddAdmin] Warning:', result.warning);
            return { error: null };
        } catch (e) {
            console.error('[dbAddAdmin] Server call failed, falling back to direct insert:', e.message);
        }
    }

    // Fallback: direct profile insert only (no Auth user — admin won't be able to log in)
    const { error } = await supabase.from('admin_profiles').insert({
        id:       adminData.id,
        username: adminData.username,
        name:     adminData.name,
        role:     adminData.role,
        company:  adminData.company || null,
        shop:     adminData.shop    || null,
        status:   adminData.status  || 'Active',
    });
    if (!error) {
        STATE.admins = STATE.admins || [];
        STATE.admins.unshift(adminData);
        saveState();
    }
    return { error };
}

export async function dbUpdateAdmin(id, updates) {
    if (!SUPABASE_ENABLED || !supabase) {
        stateUpdate('admins', id, updates);
        saveState();
        return { error: null };
    }
    const { error } = await supabase.from('admin_profiles').update({
        name: updates.name,
        role: updates.role,
        company: updates.company || null,
        shop: updates.shop || null,
        status: updates.status,
    }).eq('id', id);
    if (!error) { stateUpdate('admins', id, updates); saveState(); }
    return { error };
}

export async function dbDeleteAdmin(id) {
    if (!SUPABASE_ENABLED || !supabase) {
        stateDelete('admins', id);
        saveState();
        return { error: null };
    }

    // Try server-side auth user deletion first
    const API_BASE  = import.meta.env.VITE_API_SERVER_URL || '';
    if (API_BASE) {
        try {
            await fetch(`${API_BASE}/api/admin/delete-user`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({ userId: id }),
            });
            // Auth delete also cascades profile via FK — but do it explicitly too
        } catch (e) {
            console.warn('[dbDeleteAdmin] Server delete failed, deleting profile only:', e.message);
        }
    }

    const { error } = await supabase.from('admin_profiles').delete().eq('id', id);
    if (!error) { stateDelete('admins', id); saveState(); }
    return { error };
}

// ══════════════════════════════════════════════════════════════════
//  ADMIN LOGS
// ══════════════════════════════════════════════════════════════════
export async function dbWriteLog(action, target = '', description = '', actor = '') {
    const date = new Date().toLocaleString('id-ID', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
    const ip = '—';
    const logEntry = {
        id: 'L' + Date.now(),
        date, actor: actor || STATE.profile.username, ip, action, target, description,
    };
    STATE.logs.unshift(logEntry);
    if (STATE.logs.length > 200) STATE.logs.pop();
    if (!SUPABASE_ENABLED || !supabase) { saveState(); return; }
    await supabase.from('admin_logs').insert({
        id: logEntry.id, date, actor: logEntry.actor, ip,
        action, target, description,
        company: STATE.profile.company || null,
    });
}

// ══════════════════════════════════════════════════════════════════
//  EXPOSE ON WINDOW (onclick compatibility)
// ══════════════════════════════════════════════════════════════════
window.db = {
    // Fetches
    fetchForPage, fetchMembers, fetchDeposits, fetchWithdrawals,
    fetchCompanies, fetchBanks, fetchLogs, fetchMemos, fetchSettings,
    fetchSeamlessTransactions, fetchSeamlessGames, fetchSeamlessApiLogs,
    fetchPromotions, fetchAnnouncements, fetchNotifications,
    fetchLotteryBets, fetchLotteryResults, fetchBonuses,
    // Members
    dbAddMember, dbUpdateMember, dbDeleteMember, dbAdjustMemberBalance,
    // Companies
    dbAddCompany, dbUpdateCompany, dbDeleteCompany,
    // Banks
    dbAddBank, dbUpdateBank, dbDeleteBank,
    // Finance
    dbAddDeposit, dbApproveDeposit, dbRejectDeposit,
    dbAddWithdrawal, dbApproveWithdrawal, dbRejectWithdrawal,
    // Memos
    dbSendMemo, dbMarkMemoRead, dbDeleteMemo,
    // Promotions
    dbAddPromotion, dbUpdatePromotion, dbDeletePromotion,
    // Announcements
    dbAddAnnouncement, dbUpdateAnnouncement, dbDeleteAnnouncement,
    // Bonuses
    dbCreateBonus, dbClaimBonus, dbCancelBonus,
    // Lottery
    dbAddLotteryBet, dbSaveLotteryResult, dbSettleLotteryBets,
    // Seamless
    dbUpdateSeamlessConfig,
    // Admins
    dbAddAdmin, dbUpdateAdmin, dbDeleteAdmin,
    // Settings & Logs
    dbSaveSetting, dbWriteLog,
};

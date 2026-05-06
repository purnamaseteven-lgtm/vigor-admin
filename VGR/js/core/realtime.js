/* ─── REALTIME SUBSCRIPTIONS ──────────────────────────────────────
   Supabase Realtime → push updates to STATE → auto re-render page
   ─────────────────────────────────────────────────────────────── */
import { supabase, SUPABASE_ENABLED } from './supabase.js';
import { STATE, saveState } from './state.js';

const channels = [];

// ── Helper: re-render current page if matches ────────────────────
function reRenderIf(...pages) {
    if (pages.includes(window.currentPage) && typeof window.go === 'function') {
        window.go(window.currentPage);
    }
}

// ── Helper: show realtime notification badge ─────────────────────
function notifyBadge(type, message) {
    if (typeof window.toast === 'function') {
        window.toast(`🔴 LIVE: ${message}`, type);
    }
    // Update header badge (unread count)
    const badge = document.querySelector('.header-icon-btn .badge');
    if (badge) {
        const cur = parseInt(badge.textContent || '0', 10);
        badge.textContent = cur + 1;
        badge.style.display = 'block';
    }
}

// ── Map DB row → STATE format ─────────────────────────────────────
const mapRow = {
    deposits: r => ({
        id: r.id, member: r.member, company: r.company, bank: r.bank,
        amount: r.amount, status: r.status, date: r.date, processedBy: r.processed_by || '',
    }),
    withdrawals: r => ({
        id: r.id, member: r.member, company: r.company, bank: r.bank,
        accountNumber: r.account_number, amount: r.amount,
        status: r.status, date: r.date, processedBy: r.processed_by || '',
    }),
    members: r => ({
        id: r.id, username: r.username, name: r.name, company: r.company,
        phone: r.phone, bank: r.bank, bankAccount: r.bank_account,
        balance: r.balance || 0, status: r.status, tier: r.tier || 'Bronze',
        joined: r.joined, lastLogin: r.last_login, ip: r.ip,
    }),
    seamless_transactions: r => ({
        id: r.id, traceId: r.trace_id, player: r.player, company: r.company,
        provider: r.provider, gameId: r.game_id, gameName: r.game_name,
        betAmount: r.bet_amount, winAmount: r.win_amount, transferAmount: r.transfer_amount,
        transactionType: r.transaction_type, walletType: r.wallet_type,
        currency: r.currency, status: r.status,
        createTime: new Date(r.create_time || r.created_at).getTime(),
    }),
};

// ── Subscribe handler factory ─────────────────────────────────────
function makeHandler(stateKey, mapper, onInsert, onUpdate) {
    return (payload) => {
        const { eventType, new: newRow, old: oldRow } = payload;
        if (eventType === 'INSERT' && newRow) {
            const mapped = mapper(newRow);
            STATE[stateKey].unshift(mapped);
            saveState();
            if (onInsert) onInsert(mapped);
            reRenderIf(...(onInsert?._pages || []));
        }
        if (eventType === 'UPDATE' && newRow) {
            const mapped = mapper(newRow);
            const idx = STATE[stateKey].findIndex(x => x.id === newRow.id);
            if (idx !== -1) STATE[stateKey][idx] = mapped;
            else STATE[stateKey].unshift(mapped);
            saveState();
            if (onUpdate) onUpdate(mapped);
            reRenderIf(...(onUpdate?._pages || []));
        }
        if (eventType === 'DELETE' && oldRow) {
            STATE[stateKey] = STATE[stateKey].filter(x => x.id !== oldRow.id);
            saveState();
        }
    };
}

// ══════════════════════════════════════════════════════════════════
//  INIT — Start all realtime subscriptions
// ══════════════════════════════════════════════════════════════════
export function initRealtime() {
    if (!SUPABASE_ENABLED || !supabase) {
        console.log('[Realtime] Mock mode — no live subscriptions');
        return;
    }

    // ── Deposits ──────────────────────────────────────────────────
    const onNewDeposit = (d) => {
        notifyBadge('warning', `New deposit ${d.member} — Rp ${Number(d.amount).toLocaleString('id-ID')}`);
        // Play deposit alert sound for new incoming deposit
        if (window.playAlertSound) window.playAlertSound();
        // Refresh bell badge live
        if (typeof window.renderProfileDisplay === 'function') window.renderProfileDisplay();
    };
    onNewDeposit._pages = ['deposit-list', 'dashboard'];
    const onDepositUpdate = (d) => { };
    onDepositUpdate._pages = ['deposit-list'];

    channels.push(
        supabase.channel('rt-deposits')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' },
                makeHandler('deposits', mapRow.deposits, onNewDeposit, onDepositUpdate))
            .subscribe()
    );

    // ── Withdrawals ───────────────────────────────────────────────
    const onNewWithdrawal = (w) => {
        notifyBadge('warning', `Withdrawal request ${w.member} — Rp ${Number(w.amount).toLocaleString('id-ID')}`);
        if (window.playAlertSound) window.playAlertSound();
        if (typeof window.renderProfileDisplay === 'function') window.renderProfileDisplay();
    };
    onNewWithdrawal._pages = ['withdrawal-list', 'dashboard'];
    const onWithdrawalUpdate = (w) => { };
    onWithdrawalUpdate._pages = ['withdrawal-list'];

    channels.push(
        supabase.channel('rt-withdrawals')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' },
                makeHandler('withdrawals', mapRow.withdrawals, onNewWithdrawal, onWithdrawalUpdate))
            .subscribe()
    );

    // ── Members ───────────────────────────────────────────────────
    const onMemberChange = () => { };
    onMemberChange._pages = ['global-member-list'];

    channels.push(
        supabase.channel('rt-members')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'members' },
                makeHandler('members', mapRow.members, onMemberChange, onMemberChange))
            .subscribe()
    );

    // ── Seamless Transactions ───────────────────────────────────────
    const onNewSeamlessTx = (t) => {
        // Update GGR counter in header if visible
        if (window.currentPage === 'seamless-transactions') {
            reRenderIf('seamless-transactions');
        }
    };
    onNewSeamlessTx._pages = [];

    channels.push(
        supabase.channel('rt-seamless-tx')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'seamless_transactions' },
                (payload) => {
                    if (payload.new) {
                        STATE.seamless.transactions.unshift(mapRow.seamless_transactions(payload.new));
                        saveState();
                        onNewSeamlessTx(payload.new);
                    }
                })
            .subscribe()
    );

    // ── Memos ───────────────────────────────────────────────────
    channels.push(
        supabase.channel('rt-memos')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'memos' },
                (payload) => {
                    if (payload.new && payload.new.type === 'inbox') {
                        notifyBadge('info', `New memo from ${payload.new.from_user || 'Player'}: ${payload.new.subject}`);
                        if (window.currentPage === 'memo-list') reRenderIf('memo-list');
                    }
                })
            .subscribe()
    );

    // ── Announcements ───────────────────────────────────────────
    channels.push(
        supabase.channel('rt-ann')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' },
                (payload) => {
                    if (payload.new) {
                        if (window.currentPage === 'tools') reRenderIf('tools');
                    }
                })
            .subscribe()
    );

    // ── System Notifications ────────────────────────────────────
    channels.push(
        supabase.channel('rt-sysnotif')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_notifications' },
                (payload) => {
                    if (!payload.new) return;
                    const r = payload.new;
                    const notif = {
                        id: r.id, title: r.title, message: r.message, type: r.type,
                        targetRole: r.target_role, read: false,
                        createdBy: r.created_by, date: r.created_at,
                    };
                    if (!STATE.systemNotifications) STATE.systemNotifications = [];
                    STATE.systemNotifications.unshift(notif);
                    saveState();
                    notifyBadge('info', r.title || 'New system notification');
                    if (window.playAlertSound) window.playAlertSound();
                    if (typeof window.renderProfileDisplay === 'function') window.renderProfileDisplay();
                    reRenderIf('system-notifications');
                })
            .subscribe()
    );

    // ── Header live deposit/withdrawal count ──────────────────────
    supabase.channel('rt-pending-count')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits', filter: 'status=eq.Pending' },
            updatePendingBadge)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals', filter: 'status=eq.Pending' },
            updatePendingBadge)
        .subscribe();

    // ── Live System Feed (Admin Logs) ───────────────────────────
    channels.push(
        supabase.channel('rt-admin-logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_logs' },
                (payload) => {
                    if (payload.new && typeof window.appendLiveFeed === 'function') {
                        const dateStr = new Date(payload.new.created_at || Date.now()).toLocaleTimeString();
                        window.appendLiveFeed(`[${dateStr}] SYS: ${payload.new.actor} performed ${payload.new.action}`);
                    }
                })
            .subscribe()
    );

    console.log('[Realtime] ✅ Live subscriptions active: deposits, withdrawals, members, seamless_transactions, memos, announcements');
}

function updatePendingBadge() {
    const pendingDeposits = STATE.deposits.filter(d => d.status === 'Pending').length;
    const pendingWithdrawals = STATE.withdrawals.filter(w => w.status === 'Pending').length;
    const total = pendingDeposits + pendingWithdrawals;
    const badge = document.querySelector('[onclick*="memo-list"] .badge');
    if (badge) badge.textContent = total || '';
    // Update header alert text
    const alert = document.querySelector('.header-alert span');
    if (alert && total > 0) {
        alert.innerHTML = `<strong>${total} pending</strong> transactions waiting for approval — <a onclick="go('deposit-list')" style="cursor:pointer;text-decoration:underline">View deposits</a>`;
    }
}

// ── Teardown ─────────────────────────────────────────────────────
export function destroyRealtime() {
    channels.forEach(c => c.unsubscribe());
    channels.length = 0;
}

/* ─── Seamless Integrations MOCK API HANDLER ─── */
import { STATE, saveState, addLog } from '../core/state.js';

// Simple mock for HMAC-SHA256 (in a real backend this uses crypto lib)
function verifyHash(data, salt, expectedHash) {
    if (!STATE.seamless.config.hashAuth) return true; // Disabled
    // In our mock, we just skip real signature validation for simplicity 
    // unless building a real tester
    return true;
}

const formatResponse = (data, error = null) => {
    return JSON.stringify({ data, error });
};

const formatError = (code, message) => {
    return formatResponse(null, { code: String(code), message });
};

// Main dispatcher
export function mockseamlessApiRequest(endpoint, params, hash = '') {
    const config = STATE.seamless.config;
    const { operator_token, secret_key } = params;
    // Client mock no longer owns real credentials. Keep basic field validation only.
    if (!operator_token || !secret_key) {
        return formatError(1204, "operator_token and secret_key are required");
    }

    let response;
    let httpStatus = 200;

    switch (endpoint) {
        case '/VerifySession':
            response = handleVerifySession(params);
            break;
        case '/Cash/Get':
            response = handleCashGet(params);
            break;
        case '/Cash/TransferInOut':
            response = handleTransferInOut(params);
            break;
        case '/Cash/Adjustment':
            response = handleAdjustment(params);
            break;
        case '/Cash/UpdateBetDetail':
            response = handleUpdateBetDetail(params);
            break;
        default:
            response = formatError(1034, "Invalid endpoint");
            httpStatus = 404;
    }

    // Log the API call
    STATE.seamless.apiLogs.unshift({
        id: 'PGLOG' + Date.now() + Math.floor(Math.random() * 1000),
        timestamp: Date.now(),
        endpoint,
        method: 'POST',
        httpStatus,
        traceId: crypto.randomUUID ? crypto.randomUUID() : 'trace-' + Date.now(),
        responseTime: Math.floor(Math.random() * 50 + 10) + 'ms',
        provider: params.provider || 'PG_SOFT',
        player: params.player_name || params.operator_player_session || 'Unknown',
        status: httpStatus === 200 && !JSON.parse(response).error ? 'OK' : 'Error',
        requestBody: new URLSearchParams(params).toString(),
        responseBody: response
    });

    if (STATE.seamless.apiLogs.length > 500) STATE.seamless.apiLogs.length = 500;
    saveState();

    return { status: httpStatus, body: response };
}

function handleVerifySession(params) {
    const { operator_player_session } = params;
    // Mock player lookup via session token (using session as username for mock)
    const member = STATE.members.find(m => m.username === operator_player_session) || STATE.members[0];

    if (!member) return formatError(1302, "Invalid player session");

    return formatResponse({
        player_name: member.username,
        nickname: member.name,
        currency: STATE.seamless.config.currency
    });
}

function handleCashGet(params) {
    const { player_name } = params;
    const member = STATE.members.find(m => m.username === player_name);

    if (!member) return formatError(3004, "Player does not exist");

    return formatResponse({
        currency_code: STATE.seamless.config.currency,
        balance_amount: member.balance,
        updated_time: Date.now()
    });
}

function handleTransferInOut(params) {
    // bet payout combined
    const {
        player_name, game_id, parent_bet_id, bet_id, transaction_id,
        bet_amount, win_amount, transfer_amount, real_transfer_amount,
        wallet_type = 'C', is_end_round, updated_time
    } = params;

    const member = STATE.members.find(m => m.username === player_name);
    if (!member) return formatError(3004, "Player does not exist");

    // Idempotency check
    const existingTx = STATE.seamless.transactions.find(tx => tx.transactionId === transaction_id);
    if (existingTx) {
        // Return previous successful response
        return formatResponse({
            currency_code: STATE.seamless.config.currency,
            balance_amount: existingTx.balanceAfter,
            updated_time: existingTx.createTime,
            real_transfer_amount: existingTx.realTransferAmount
        });
    }

    const tAmt = parseFloat(transfer_amount);
    const btAmt = parseFloat(bet_amount);
    const wnAmt = parseFloat(win_amount);

    // Validate balance for debits (negative transfer amount)
    // Actually transfer_amount = win_amount - bet_amount
    if (tAmt < 0 && member.balance + wnAmt < btAmt) {
        if (wallet_type !== 'G') return formatError(3202, "Not enough cash balance to bet"); // dont reject free games
    }

    // Process balance update
    member.balance += tAmt;

    const game = STATE.seamless.games.find(g => String(g.id) === String(game_id));

    // Save transaction
    const newTx = {
        id: 'PGT' + Date.now(),
        transactionId: transaction_id,
        traceId: crypto.randomUUID ? crypto.randomUUID() : 'trace-' + Date.now(),
        player: player_name,
        provider: params.provider || 'PG_SOFT',
        gameId: game_id,
        gameName: game ? game.name : 'Unknown Game',
        parentBetId: parent_bet_id,
        betId: bet_id,
        betAmount: btAmt,
        winAmount: wnAmt,
        transferAmount: tAmt,
        realTransferAmount: parseFloat(real_transfer_amount || tAmt * STATE.seamless.config.baseUnit),
        transactionType: 'BetPayout',
        walletType: wallet_type,
        currency: STATE.seamless.config.currency,
        isEndRound: is_end_round === '1' || is_end_round === 'true',
        status: 'Completed',
        createTime: Date.now(),
        balanceAfter: member.balance
    };

    STATE.seamless.transactions.unshift(newTx);
    if (STATE.seamless.transactions.length > 2000) STATE.seamless.transactions.length = 2000;

    return formatResponse({
        currency_code: STATE.seamless.config.currency,
        balance_amount: member.balance,
        updated_time: Date.now(),
        real_transfer_amount: newTx.realTransferAmount
    });
}

function handleAdjustment(params) {
    const {
        player_name, transfer_amount, real_transfer_amount,
        adjustment_transaction_id, transaction_type
    } = params;

    const member = STATE.members.find(m => m.username === player_name);
    if (!member) return formatError(3004, "Player does not exist");

    // Idempotency
    const existingTx = STATE.seamless.transactions.find(tx => tx.transactionId === adjustment_transaction_id);
    if (existingTx) {
        return formatResponse({
            adjust_amount: parseFloat(transfer_amount),
            balance_before: existingTx.balanceAfter - existingTx.transferAmount,
            balance_after: existingTx.balanceAfter,
            updated_time: existingTx.createTime,
            real_transfer_amount: existingTx.realTransferAmount
        });
    }

    const tAmt = parseFloat(transfer_amount);
    const balBefore = member.balance;

    if (tAmt < 0 && member.balance + tAmt < 0) {
        return formatError(3202, "Not enough cash balance");
    }

    member.balance += tAmt;

    const newTx = {
        id: 'PGT' + Date.now(),
        transactionId: adjustment_transaction_id,
        traceId: crypto.randomUUID ? crypto.randomUUID() : 'trace-' + Date.now(),
        player: player_name,
        provider: params.provider || 'PG_SOFT',
        gameId: '-',
        gameName: 'Manual Adjustment',
        parentBetId: '-',
        betId: '-',
        betAmount: 0,
        winAmount: 0,
        transferAmount: tAmt,
        realTransferAmount: parseFloat(real_transfer_amount || tAmt * STATE.seamless.config.baseUnit),
        transactionType: 'Adjustment ' + transaction_type,
        walletType: 'C',
        currency: STATE.seamless.config.currency,
        isEndRound: true,
        status: 'Completed',
        createTime: Date.now(),
        balanceAfter: member.balance
    };

    STATE.seamless.transactions.unshift(newTx);

    return formatResponse({
        adjust_amount: Math.abs(tAmt),
        balance_before: balBefore,
        balance_after: member.balance,
        updated_time: Date.now(),
        real_transfer_amount: newTx.realTransferAmount
    });
}

function handleUpdateBetDetail(params) {
    // Normally we just store the updated end time
    return formatResponse({ is_success: true });
}


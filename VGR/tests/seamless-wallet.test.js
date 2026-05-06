// Integration Test for Supabase Edge Function: Seamless Wallet

// Mock test suite assuming running via node and testing live Supabase instance
import assert from 'assert';

// Required env for integration tests (no insecure defaults)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const OPERATOR_TOKEN = process.env.VITE_PG_OPERATOR_TOKEN;
const SECRET_KEY = process.env.VITE_PG_SECRET_KEY;
const TEST_PLAYER = process.env.VITE_SEAMLESS_TEST_PLAYER;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/seamless-wallet`;

async function sendRequest(endpoint, payload) {
    const urlParams = new URLSearchParams({
        operator_token: OPERATOR_TOKEN,
        secret_key: SECRET_KEY,
        provider: 'PRAGMATIC_PLAY',
        ...payload
    }).toString();

    const response = await fetch(`${EDGE_FUNCTION_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: urlParams
    });

    return await response.json();
}

async function runTests() {
    console.log('🧪 Starting Seamless Wallet Integration Tests...');

    // 1. VerifySession Test
    console.log('\n[TEST 1] VerifySession (Valid Player)');
    let res = await sendRequest('/VerifySession', { operator_player_session: TEST_PLAYER, game_id: 35 });
    assert.ok(res.data, 'Expected data object to be returned');
    assert.strictEqual(res.error, null, 'Expected no error');
    assert.strictEqual(res.data.player_name, TEST_PLAYER, 'Returned player should match request');
    console.log('✅ VerifySession passed');

    // 2. Cash/Get Test
    console.log('\n[TEST 2] Get Wallet Balance');
    res = await sendRequest('/Cash/Get', { player_name: TEST_PLAYER });
    assert.ok(res.data, 'Expected data object to be returned');
    assert.ok(res.data.balance_amount !== undefined, 'Expected balance amount');
    console.log(`✅ Get Wallet passed. Current Balance: ${res.data.balance_amount}`);

    const baseBalance = parseFloat(res.data.balance_amount);

    // 3. TransferInOut (Valid Bet + Win)
    console.log('\n[TEST 3] Process Bet & Payout');
    const txId = 'TX-TEST-' + Date.now();
    const betAmt = 1000;
    const winAmt = 5000;

    res = await sendRequest('/Cash/TransferInOut', {
        player_name: TEST_PLAYER,
        transaction_id: txId,
        bet_amount: betAmt,
        win_amount: winAmt,
        transfer_amount: winAmt - betAmt,
        wallet_type: 'C'
    });

    assert.strictEqual(res.error, null, 'Expected successful transaction');
    assert.strictEqual(parseFloat(res.data.balance_amount), baseBalance + (winAmt - betAmt), 'Balance calculation incorrect');
    console.log('✅ Original transaction passed');

    // 4. Idempotency Check (Duplicate Transaction ID)
    console.log('\n[TEST 4] Idempotency Check (Duplicate TX)');
    const resDuplicate = await sendRequest('/Cash/TransferInOut', {
        player_name: TEST_PLAYER,
        transaction_id: txId,
        bet_amount: betAmt,
        win_amount: winAmt,
        transfer_amount: winAmt - betAmt,
        wallet_type: 'C'
    });

    assert.strictEqual(resDuplicate.error, null, 'Idempotency returns successful response');
    assert.strictEqual(resDuplicate.data.balance_amount, res.data.balance_amount, 'Balance should not change on duplicate');
    console.log('✅ Idempotency passed. Duplicate transaction denied dual execution.');

    // 5. Insufficient Balance Check
    console.log('\n[TEST 5] Rejection on Insufficient Balance');
    const impossibleTx = 'TX-IMP-' + Date.now();
    res = await sendRequest('/Cash/TransferInOut', {
        player_name: TEST_PLAYER,
        transaction_id: impossibleTx,
        bet_amount: 9999999999, // Bet too high
        win_amount: 0,
        transfer_amount: -9999999999,
        wallet_type: 'C'
    });

    assert.ok(res.error, 'Expected error response');
    assert.strictEqual(res.error.code, '3202', 'Expected Insufficient Balance code 3202');
    console.log('✅ Insufficient balance properly rejected');

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED!');
}

// Execute tests if running directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const missing = [];
    if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL');
    if (!OPERATOR_TOKEN) missing.push('VITE_PG_OPERATOR_TOKEN');
    if (!SECRET_KEY) missing.push('VITE_PG_SECRET_KEY');
    if (!TEST_PLAYER) missing.push('VITE_SEAMLESS_TEST_PLAYER');
    if (missing.length) {
        console.warn(`⚠️ Missing env: ${missing.join(', ')}`);
        console.warn('Run: node tests/seamless-wallet.test.js (after exporting required vars)');
        process.exit(1);
    }
    runTests().catch(err => {
        console.error('❌ Test Suite Failed:');
        console.error(err);
        process.exit(1);
    });
}

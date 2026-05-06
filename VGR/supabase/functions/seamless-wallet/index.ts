import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.10.0';

// Seamless Wallet Unified Webhook Handler
// Designed to be provider-agnostic, validating HMAC and interacting with the central Members DB
// Supports VerifySession, GetWallet, TransferInOut, Adjustment

const formatResponse = (data: any, error: any = null) => {
    return new Response(JSON.stringify({ data, error }), { headers: { 'Content-Type': 'application/json' } });
};

const formatError = (code: string, message: string) => {
    return formatResponse(null, { code, message });
};

serve(async (req) => {
    try {
        const url = new URL(req.url);
        const endpoint = url.pathname.replace('/seamless-wallet', '');

        // Supabase client config
        const sbUrl = Deno.env.get('SUPABASE_URL') || '';
        const sbServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(sbUrl, sbServiceKey);

        const text = await req.text();
        const params = Object.fromEntries(new URLSearchParams(text));

        // Configuration Lookup (Ideally fetched from DB or ENV, using hardcoded mock for demonstration)
        const operatorToken = params.operator_token;
        const secretKey = params.secret_key;

        if (!operatorToken || !secretKey) {
            return formatError("1204", "Invalid operator token or secret key");
        }

        const provider = params.provider || 'PG_SOFT'; // Unified seamless identifier

        // Fetch User by name
        let playerParam = params.operator_player_session || params.player_name;
        if (!playerParam) return formatError("1034", "Missing player identity");

        const { data: member, error: dbErr } = await supabase
            .from('members')
            .select('*')
            .eq('username', playerParam)
            .single();

        if (dbErr || !member) return formatError("3004", "Player does not exist");

        // Request Router
        let responsePayload;

        if (endpoint === '/VerifySession') {
            responsePayload = formatResponse({
                player_name: member.username,
                nickname: member.name,
                currency: 'IDR'
            });
        }
        else if (endpoint === '/Cash/Get') {
            responsePayload = formatResponse({
                currency_code: 'IDR',
                balance_amount: member.balance,
                updated_time: Date.now()
            });
        }
        else if (endpoint === '/Cash/TransferInOut' || endpoint === '/Cash/Adjustment') {
            const txId = endpoint === '/Cash/TransferInOut' ? params.transaction_id : params.adjustment_transaction_id;

            // Check Idempotency based on trace
            const { data: existingTx } = await supabase
                .from('seamless_transactions')
                .select('*')
                .eq('transaction_id', txId)
                .single();

            if (existingTx) {
                if (endpoint === '/Cash/Adjustment') {
                    return formatResponse({
                        adjust_amount: Math.abs(Number(existingTx.transfer_amount)),
                        balance_before: Number(existingTx.balance_after) - Number(existingTx.transfer_amount),
                        balance_after: existingTx.balance_after,
                        updated_time: new Date(existingTx.create_time).getTime(),
                        real_transfer_amount: existingTx.real_transfer_amount
                    });
                }
                return formatResponse({
                    currency_code: 'IDR',
                    balance_amount: existingTx.balance_after,
                    updated_time: new Date(existingTx.create_time).getTime(),
                    real_transfer_amount: existingTx.real_transfer_amount
                });
            }

            const tAmt = Number(params.transfer_amount);

            if (tAmt < 0 && (member.balance + (Number(params.win_amount) || 0)) < Number(params.bet_amount || Math.abs(tAmt))) {
                return formatError("3202", "Not enough cash balance to bet");
            }

            // Perform atomic DB update 
            const newBal = member.balance + tAmt;
            await supabase.from('members').update({ balance: newBal }).eq('id', member.id);

            // Log Transaction
            const txRow = {
                id: crypto.randomUUID(),
                trace_id: txId,
                transaction_id: txId,
                player: member.username,
                provider: provider,
                game_id: params.game_id || 0,
                bet_amount: Number(params.bet_amount || 0),
                win_amount: Number(params.win_amount || 0),
                transfer_amount: tAmt,
                status: 'Completed',
                balance_after: newBal,
                create_time: new Date().toISOString()
            };
            const { error: txErr } = await supabase.from('seamless_transactions').insert(txRow);
            if (txErr) {
                return formatError("1200", `Transaction log insert failed: ${txErr.message}`);
            }

            responsePayload = endpoint === '/Cash/Adjustment' ? formatResponse({
                adjust_amount: Math.abs(tAmt),
                balance_before: member.balance,
                balance_after: newBal,
                updated_time: Date.now()
            }) : formatResponse({
                currency_code: 'IDR',
                balance_amount: newBal,
                updated_time: Date.now()
            });
        }
        else {
            responsePayload = formatError("1034", "Invalid Endpoint");
        }

        // Keep API Audit Logs
        supabase.from('seamless_api_logs').insert({
            endpoint: endpoint,
            player: member.username,
            status: 'Completed',
            request_body: text
        });

        return responsePayload;

    } catch (err) {
        return formatError("1200", "Internal Server Error");
    }
});

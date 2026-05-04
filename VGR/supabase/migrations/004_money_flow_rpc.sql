-- Atomic money-flow operations used by the admin UI and payment webhooks.
-- These functions are idempotent: only Pending records can be processed.

CREATE OR REPLACE FUNCTION approve_deposit(
    p_deposit_id TEXT,
    p_processed_by TEXT DEFAULT 'system'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deposit deposits%ROWTYPE;
    v_member members%ROWTYPE;
    v_now TEXT := to_char(now() AT TIME ZONE 'Asia/Jakarta', 'DD/MM/YYYY HH24:MI:SS');
BEGIN
    SELECT * INTO v_deposit
    FROM deposits
    WHERE id = p_deposit_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'Deposit not found');
    END IF;

    IF v_deposit.status <> 'Pending' THEN
        RETURN jsonb_build_object('ok', true, 'code', 'already_processed', 'status', v_deposit.status);
    END IF;

    SELECT * INTO v_member
    FROM members
    WHERE username = v_deposit.member
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'member_not_found', 'message', 'Member not found');
    END IF;

    UPDATE members
    SET balance = COALESCE(balance, 0) + v_deposit.amount,
        updated_at = now()
    WHERE id = v_member.id;

    UPDATE deposits
    SET status = 'Approved',
        processed_by = p_processed_by,
        date = v_now,
        updated_at = now()
    WHERE id = v_deposit.id;

    INSERT INTO admin_logs(date, actor, action, target, description, company)
    VALUES (
        v_now,
        p_processed_by,
        'Approve Deposit',
        v_deposit.id,
        'Approved deposit Rp ' || v_deposit.amount || ' from ' || v_deposit.member,
        v_deposit.company
    );

    RETURN jsonb_build_object(
        'ok', true,
        'code', 'approved',
        'member', v_deposit.member,
        'amount', v_deposit.amount,
        'balance', COALESCE(v_member.balance, 0) + v_deposit.amount
    );
END;
$$;

CREATE OR REPLACE FUNCTION reject_deposit(
    p_deposit_id TEXT,
    p_processed_by TEXT DEFAULT 'system'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_deposit deposits%ROWTYPE;
    v_now TEXT := to_char(now() AT TIME ZONE 'Asia/Jakarta', 'DD/MM/YYYY HH24:MI:SS');
BEGIN
    SELECT * INTO v_deposit
    FROM deposits
    WHERE id = p_deposit_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'Deposit not found');
    END IF;

    IF v_deposit.status <> 'Pending' THEN
        RETURN jsonb_build_object('ok', true, 'code', 'already_processed', 'status', v_deposit.status);
    END IF;

    UPDATE deposits
    SET status = 'Rejected',
        processed_by = p_processed_by,
        date = v_now,
        updated_at = now()
    WHERE id = v_deposit.id;

    INSERT INTO admin_logs(date, actor, action, target, description, company)
    VALUES (
        v_now,
        p_processed_by,
        'Reject Deposit',
        v_deposit.id,
        'Rejected deposit Rp ' || v_deposit.amount || ' from ' || v_deposit.member,
        v_deposit.company
    );

    RETURN jsonb_build_object('ok', true, 'code', 'rejected');
END;
$$;

CREATE OR REPLACE FUNCTION approve_withdrawal(
    p_withdrawal_id TEXT,
    p_processed_by TEXT DEFAULT 'system'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_withdrawal withdrawals%ROWTYPE;
    v_member members%ROWTYPE;
    v_now TEXT := to_char(now() AT TIME ZONE 'Asia/Jakarta', 'DD/MM/YYYY HH24:MI:SS');
BEGIN
    SELECT * INTO v_withdrawal
    FROM withdrawals
    WHERE id = p_withdrawal_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'Withdrawal not found');
    END IF;

    IF v_withdrawal.status <> 'Pending' THEN
        RETURN jsonb_build_object('ok', true, 'code', 'already_processed', 'status', v_withdrawal.status);
    END IF;

    SELECT * INTO v_member
    FROM members
    WHERE username = v_withdrawal.member
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'member_not_found', 'message', 'Member not found');
    END IF;

    IF COALESCE(v_member.balance, 0) < v_withdrawal.amount THEN
        RETURN jsonb_build_object('ok', false, 'code', 'insufficient_balance', 'message', 'Insufficient member balance');
    END IF;

    UPDATE members
    SET balance = COALESCE(balance, 0) - v_withdrawal.amount,
        updated_at = now()
    WHERE id = v_member.id;

    UPDATE withdrawals
    SET status = 'Approved',
        processed_by = p_processed_by,
        date = v_now,
        updated_at = now()
    WHERE id = v_withdrawal.id;

    INSERT INTO admin_logs(date, actor, action, target, description, company)
    VALUES (
        v_now,
        p_processed_by,
        'Approve Withdrawal',
        v_withdrawal.id,
        'Approved withdrawal Rp ' || v_withdrawal.amount || ' for ' || v_withdrawal.member,
        v_withdrawal.company
    );

    RETURN jsonb_build_object(
        'ok', true,
        'code', 'approved',
        'member', v_withdrawal.member,
        'amount', v_withdrawal.amount,
        'balance', COALESCE(v_member.balance, 0) - v_withdrawal.amount
    );
END;
$$;

CREATE OR REPLACE FUNCTION reject_withdrawal(
    p_withdrawal_id TEXT,
    p_processed_by TEXT DEFAULT 'system'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_withdrawal withdrawals%ROWTYPE;
    v_now TEXT := to_char(now() AT TIME ZONE 'Asia/Jakarta', 'DD/MM/YYYY HH24:MI:SS');
BEGIN
    SELECT * INTO v_withdrawal
    FROM withdrawals
    WHERE id = p_withdrawal_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'code', 'not_found', 'message', 'Withdrawal not found');
    END IF;

    IF v_withdrawal.status <> 'Pending' THEN
        RETURN jsonb_build_object('ok', true, 'code', 'already_processed', 'status', v_withdrawal.status);
    END IF;

    UPDATE withdrawals
    SET status = 'Rejected',
        processed_by = p_processed_by,
        date = v_now,
        updated_at = now()
    WHERE id = v_withdrawal.id;

    INSERT INTO admin_logs(date, actor, action, target, description, company)
    VALUES (
        v_now,
        p_processed_by,
        'Reject Withdrawal',
        v_withdrawal.id,
        'Rejected withdrawal Rp ' || v_withdrawal.amount || ' for ' || v_withdrawal.member,
        v_withdrawal.company
    );

    RETURN jsonb_build_object('ok', true, 'code', 'rejected');
END;
$$;

-- =============================================================================
-- Utility Billing System — PostgreSQL Database Routines
-- =============================================================================
-- Apply manually via psql:
--   psql -U <user> -d utility_billing_db -f routines.sql
--
-- These triggers run at the database level to satisfy the exam requirement for
-- at least one database-level routine (trigger / stored procedure / cursor).
-- The Spring service layer enforces the same logic for testability.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Trigger 1: trg_bill_notification
-- Fires AFTER INSERT on bills.
-- Inserts a BILL_GENERATED customer_notification row using the required message
-- format:
--   Dear <CustomerName>, Your <Month/Year> utility bill of <Amount> FRW has
--   been successfully processed.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_bill_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_customer_full_name TEXT;
    v_billing_month      TEXT;
    v_message            TEXT;
    v_subject            TEXT;
    v_recipient          TEXT;
BEGIN
    -- Fetch the customer's full name and email
    SELECT full_name, email
      INTO v_customer_full_name, v_recipient
      FROM customers
     WHERE id = NEW.customer_id;

    -- Format billing month as YYYY-MM (matches Java YearMonth.toString())
    v_billing_month := TO_CHAR(NEW.billing_month, 'YYYY-MM');

    -- Required exam notification message
    v_message := 'Dear ' || v_customer_full_name
              || ', Your ' || v_billing_month
              || ' utility bill of ' || NEW.amount
              || ' FRW has been successfully processed.';

    v_subject := 'Utility Bill Generated - ' || v_billing_month;

    INSERT INTO customer_notifications (
        id,
        customer_id,
        type,
        status,
        recipient,
        subject,
        message,
        created_at,
        sent_at
    ) VALUES (
        gen_random_uuid(),
        NEW.customer_id,
        'BILL_GENERATED',
        'PENDING',
        v_recipient,
        v_subject,
        v_message,
        NOW(),
        NULL
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bill_notification ON bills;

CREATE TRIGGER trg_bill_notification
    AFTER INSERT ON bills
    FOR EACH ROW
    EXECUTE FUNCTION fn_bill_notification();


-- -----------------------------------------------------------------------------
-- Trigger 2: trg_payment_bill_status
-- Fires AFTER INSERT on payments.
-- Recalculates the bill balance. When balance reaches zero:
--   1. Updates bills.status to 'PAID'.
--   2. Inserts a PAYMENT_RECEIVED customer_notification row.
-- For partial payments (balance > 0):
--   Updates bills.status to 'PARTIALLY_PAID'.
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_payment_bill_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_bill               RECORD;
    v_new_paid_amount    NUMERIC(14, 2);
    v_new_balance        NUMERIC(14, 2);
    v_new_status         TEXT;
    v_customer_full_name TEXT;
    v_recipient          TEXT;
    v_billing_month      TEXT;
    v_message            TEXT;
    v_subject            TEXT;
BEGIN
    -- Load current bill state
    SELECT b.*, c.full_name AS customer_full_name, c.email AS customer_email
      INTO v_bill
      FROM bills b
      JOIN customers c ON c.id = b.customer_id
     WHERE b.id = NEW.bill_id;

    v_new_paid_amount := v_bill.paid_amount + NEW.amount;
    v_new_balance     := v_bill.balance     - NEW.amount;

    -- Guard: clamp balance at zero (service layer prevents overpayment, but be safe)
    IF v_new_balance < 0 THEN
        v_new_balance := 0;
    END IF;

    IF v_new_balance = 0 THEN
        v_new_status := 'PAID';
    ELSE
        v_new_status := 'PARTIALLY_PAID';
    END IF;

    -- Update the bill
    UPDATE bills
       SET paid_amount = v_new_paid_amount,
           balance     = v_new_balance,
           status      = v_new_status,
           updated_at  = NOW()
     WHERE id = NEW.bill_id;

    -- On full payment, create a PAYMENT_RECEIVED notification
    IF v_new_status = 'PAID' THEN
        v_billing_month := TO_CHAR(v_bill.billing_month, 'YYYY-MM');

        v_message := 'Dear ' || v_bill.customer_full_name
                  || ', Your payment for ' || v_billing_month
                  || ' utility bill ' || v_bill.bill_number
                  || ' of ' || v_bill.amount
                  || ' FRW has been received. Your account is now fully settled.';

        v_subject := 'Payment Received - Bill ' || v_bill.bill_number;

        INSERT INTO customer_notifications (
            id,
            customer_id,
            type,
            status,
            recipient,
            subject,
            message,
            created_at,
            sent_at
        ) VALUES (
            gen_random_uuid(),
            v_bill.customer_id,
            'PAYMENT_RECEIVED',
            'PENDING',
            v_bill.customer_email,
            v_subject,
            v_message,
            NOW(),
            NULL
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_bill_status ON payments;

CREATE TRIGGER trg_payment_bill_status
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION fn_payment_bill_status();


-- =============================================================================
-- Verification queries (run after applying to confirm triggers are registered)
-- =============================================================================
-- SELECT trigger_name, event_manipulation, event_object_table, action_timing
--   FROM information_schema.triggers
--  WHERE trigger_schema = 'public'
--  ORDER BY event_object_table, trigger_name;

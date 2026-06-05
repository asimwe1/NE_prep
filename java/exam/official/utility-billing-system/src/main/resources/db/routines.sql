-- Utility Billing System - PostgreSQL database routines
--
-- Apply manually with:
--   psql -U <user> -d utility_billing_db -f src/main/resources/db/routines.sql
--
-- These triggers satisfy the exam requirement for database-level routines.
-- The service layer keeps the same rules explicit and testable in Java.

-- Trigger 1: create a BILL_GENERATED notification whenever a bill is inserted.
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
    SELECT full_name, email
      INTO v_customer_full_name, v_recipient
      FROM customers
     WHERE id = NEW.customer_id;

    v_billing_month := TO_CHAR(NEW.billing_month, 'YYYY-MM');

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

-- Trigger 2: update bill balance/status and notify when a payment fully settles a bill.
CREATE OR REPLACE FUNCTION fn_payment_bill_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_bill            RECORD;
    v_new_paid_amount NUMERIC(14, 2);
    v_new_balance     NUMERIC(14, 2);
    v_new_status      TEXT;
    v_billing_month   TEXT;
    v_message         TEXT;
    v_subject         TEXT;
BEGIN
    SELECT b.*, c.full_name AS customer_full_name, c.email AS customer_email
      INTO v_bill
      FROM bills b
      JOIN customers c ON c.id = b.customer_id
     WHERE b.id = NEW.bill_id;

    v_new_paid_amount := v_bill.paid_amount + NEW.amount;
    v_new_balance := v_bill.balance - NEW.amount;

    -- Service code rejects overpayments; this clamp protects direct DB inserts.
    IF v_new_balance < 0 THEN
        v_new_balance := 0;
    END IF;

    IF v_new_balance = 0 THEN
        v_new_status := 'PAID';
    ELSE
        v_new_status := 'PARTIALLY_PAID';
    END IF;

    UPDATE bills
       SET paid_amount = v_new_paid_amount,
           balance = v_new_balance,
           status = v_new_status,
           updated_at = NOW()
     WHERE id = NEW.bill_id;

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

-- Verification query:
-- SELECT trigger_name, event_manipulation, event_object_table, action_timing
--   FROM information_schema.triggers
--  WHERE trigger_schema = 'public'
--  ORDER BY event_object_table, trigger_name;

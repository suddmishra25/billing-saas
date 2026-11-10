-- Run against database: billing_software
-- Fixes schema after migrating JPA from customer_id -> client_id on items and invoices.
-- Hibernate ddl-auto=update does not remove old NOT NULL customer_id columns.

BEGIN;

-- ========== items ==========
ALTER TABLE items DROP CONSTRAINT IF EXISTS fk_item_customer;
ALTER TABLE items DROP CONSTRAINT IF EXISTS fki0rd2owg73noxmjm0ydp4tl1d;
ALTER TABLE items DROP CONSTRAINT IF EXISTS fk_items_customer_id;
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_customer_id_fkey;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
        WHERE rel.relname = 'items'
          AND att.attname = 'customer_id'
          AND con.contype = 'f'
    ) LOOP
        EXECUTE format('ALTER TABLE items DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;
END $$;

ALTER TABLE items DROP COLUMN IF EXISTS customer_id;

-- ========== invoices ==========
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk_invoice_customer;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS fk9ioqm804urbgy986pdtwqtl0x;
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_customer_id_fkey;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY (con.conkey)
        WHERE rel.relname = 'invoices'
          AND att.attname = 'customer_id'
          AND con.contype = 'f'
    ) LOOP
        EXECUTE format('ALTER TABLE invoices DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;
END $$;

ALTER TABLE invoices DROP COLUMN IF EXISTS customer_id;

COMMIT;

-- Verify (run separately in psql):
-- \d items
-- \d invoices
-- Expected: client_id present, customer_id absent

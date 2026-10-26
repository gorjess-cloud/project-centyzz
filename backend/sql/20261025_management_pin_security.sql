-- REQUIRED: review and execute once against the intended Neon database BEFORE deploying the server.
-- Does not alter or delete customer/appointment records.
BEGIN;
CREATE TABLE IF NOT EXISTS public.management_security (
  user_id INTEGER PRIMARY KEY REFERENCES public."user"(id) ON DELETE CASCADE,
  pin_hash TEXT NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  needs_setup BOOLEAN NOT NULL DEFAULT TRUE,
  phone_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMIT;
-- Existing management accounts have NO PIN until provisioned separately.
-- This intentional fail-closed behavior prevents arbitrary PINs from working.

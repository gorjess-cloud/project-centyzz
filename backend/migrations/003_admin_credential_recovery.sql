ALTER TABLE public.management_security ADD COLUMN IF NOT EXISTS credential_version integer NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS public.admin_credential_recovery (
  token_hash char(64) PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  issued_by integer NOT NULL REFERENCES public."user"(id),
  kind varchar(10) NOT NULL CHECK (kind IN ('password','pin')),
  email_snapshot text NOT NULL,
  credential_snapshot text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '15 minutes',
  used_at timestamptz
);
CREATE INDEX IF NOT EXISTS admin_credential_recovery_account_idx
  ON public.admin_credential_recovery(user_id,kind,created_at DESC);

-- Existing events remain intact. Only a one-way session fingerprint is stored.
ALTER TABLE public.operational_logs ADD COLUMN IF NOT EXISTS session_event_key varchar(64);
CREATE UNIQUE INDEX IF NOT EXISTS operational_logs_session_event_key_idx
  ON public.operational_logs(session_event_key);

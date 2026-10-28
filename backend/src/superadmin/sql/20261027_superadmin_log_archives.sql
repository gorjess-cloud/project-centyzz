-- Run once using the Neon SQL Editor before installing the Operational Logs UI.
-- Additive migration. No Admin/Staff source, business table, or existing log is modified.
-- Archiving only changes the Superadmin view; original audit evidence stays intact.
BEGIN;
CREATE TABLE IF NOT EXISTS public.superadmin_log_archives (
    source varchar(20) NOT NULL CHECK (source IN ('audit', 'inventory')),
    source_id bigint NOT NULL,
    archived_by integer NOT NULL,
    archived_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (source, source_id)
);
CREATE INDEX IF NOT EXISTS idx_superadmin_log_archives_archived_at
    ON public.superadmin_log_archives (archived_at DESC);
COMMIT;

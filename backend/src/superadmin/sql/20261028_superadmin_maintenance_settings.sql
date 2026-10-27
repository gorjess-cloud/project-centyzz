-- Apply only after checking the live Neon schema and making a database backup.
-- Stores Superadmin maintenance CONFIGURATION; it does not block other users.
CREATE TABLE IF NOT EXISTS public.superadmin_maintenance_settings (
    id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    enabled boolean NOT NULL DEFAULT false,
    message varchar(200) NOT NULL DEFAULT 'We are making a few improvements. Please check back shortly.',
    duration varchar(20) NOT NULL DEFAULT '1 hour'
       CHECK (duration IN ('30 minutes', '1 hour', '2 hours', '4 hours')),
    updated_at timestamptz,
    updated_by integer
);
INSERT INTO public.superadmin_maintenance_settings (id)
VALUES (1) ON CONFLICT (id) DO NOTHING;

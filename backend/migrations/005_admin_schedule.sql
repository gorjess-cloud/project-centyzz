-- Reuse the existing user -> staff -> staff_schedules relationship.
-- No accounts, appointments, existing schedules, or login roles are changed.
BEGIN;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS employment_type varchar(20) NOT NULL DEFAULT 'Full-time'
  CHECK (employment_type IN ('Full-time','Part-time'));
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS on_leave boolean NOT NULL DEFAULT false;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS leave_previous_active boolean;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS roster_hidden_at timestamptz;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS roster_hidden_by integer REFERENCES public."user"(id);
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS roster_previous_active boolean;
CREATE INDEX IF NOT EXISTS staff_schedules_staff_start_idx ON public.staff_schedules(staff_id,starts_at) WHERE archived_at IS NULL;
COMMIT;

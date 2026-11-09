-- Appointment archives retain the original assigned staff_id and booking/payment history.
-- Existing columns are reused where already present. No appointments are deleted.
BEGIN;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS archived_by integer REFERENCES public."user"(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS archive_reason text;

CREATE OR REPLACE FUNCTION public.archive_cancelled_appointment()
RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN
  IF NEW.status='CANCELLED' THEN
    NEW.archived_at=coalesce(NEW.archived_at,now());
    NEW.archive_reason=coalesce(nullif(btrim(NEW.archive_reason),''),'Cancelled appointment');
    NEW.reservation_expires_at=NULL;
  END IF;
  RETURN NEW;
END
$function$;
DROP TRIGGER IF EXISTS archive_cancelled_appointment ON public.appointments;
CREATE TRIGGER archive_cancelled_appointment
BEFORE INSERT OR UPDATE OF status ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.archive_cancelled_appointment();

-- Older cancelled records also belong in the archive. Unknown actors remain NULL.
UPDATE public.appointments SET archived_at=coalesce(updated_at,created_at,now()),
  archive_reason=coalesce(nullif(btrim(archive_reason),''),'Previously cancelled appointment'),reservation_expires_at=NULL
WHERE status='CANCELLED' AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS appointments_staff_archive_date_idx
  ON public.appointments(staff_id,appointment_date DESC,start_time DESC) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS appointments_staff_active_date_idx
  ON public.appointments(staff_id,appointment_date DESC,start_time DESC) WHERE archived_at IS NULL;
COMMIT;

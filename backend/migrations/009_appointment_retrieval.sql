-- Preserve the pre-cancellation status for safe retrieval.
-- Existing cancelled records without this field are retrieved as PENDING for review.
BEGIN;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS status_before_archive varchar(30);
CREATE OR REPLACE FUNCTION public.archive_cancelled_appointment()
RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN
  IF NEW.status='CANCELLED' THEN
    IF TG_OP='UPDATE' THEN
      IF OLD.status<>'CANCELLED' THEN
        NEW.status_before_archive=OLD.status;
      END IF;
    END IF;
    NEW.archived_at=coalesce(NEW.archived_at,now());
    NEW.archive_reason=coalesce(nullif(btrim(NEW.archive_reason),''),'Cancelled appointment');
    NEW.reservation_expires_at=NULL;
  END IF;
  RETURN NEW;
END
$function$;
COMMIT;

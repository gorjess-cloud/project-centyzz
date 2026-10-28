-- Centyzz: connect all STAFF user accounts to exactly one staff profile.
-- Names continue to come from public."user" through staff.user_id.
-- Existing staff UUIDs, accounts, schedules and appointments are preserved.
-- Run the entire script in Neon SQL Editor. Safe to run again.
BEGIN;

ALTER TABLE public.staff ALTER COLUMN job_title SET DEFAULT 'Unassigned';

UPDATE public.staff SET job_title=CASE btrim(coalesce(job_title,''))
  WHEN 'Stylist' THEN 'Hair Stylist'
  WHEN 'Therapist' THEN 'Beauty Therapist'
  WHEN 'Nail Tech' THEN 'Nail Technician'
  WHEN 'Staff' THEN 'Unassigned'
  WHEN '' THEN 'Unassigned'
  ELSE btrim(job_title) END
WHERE job_title IS NULL OR job_title IN ('Stylist','Therapist','Nail Tech','Staff','') OR job_title<>btrim(job_title);

-- Backfill profiles for Staff accounts missing from the staff table.
-- Unknown job assignments remain Unassigned rather than being guessed.
INSERT INTO public.staff(user_id,employee_code,job_title)
SELECT u.id,'CNTZ-USER-'||u.id,'Unassigned'
FROM public."user" u
WHERE u.role='STAFF'
ON CONFLICT(user_id) DO NOTHING;

-- Confirm the known assignment. The ID and name check prevent assigning a different person.
UPDATE public.staff s SET job_title='Hair Stylist',updated_at=now()
FROM public."user" u
WHERE s.user_id=u.id AND u.id=10 AND u.role='STAFF'
  AND btrim(concat_ws(' ',u."firstName",u."lastName"))='Karl Maverick Anonuevo'
  AND s.job_title IS DISTINCT FROM 'Hair Stylist';

ALTER TABLE public.staff ALTER COLUMN job_title SET NOT NULL;
DO $constraint$
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conrelid='public.staff'::regclass AND conname='staff_job_title_allowed') THEN
    ALTER TABLE public.staff ADD CONSTRAINT staff_job_title_allowed CHECK(job_title IN (
      'Hair Stylist','Nail Technician','Beauty Therapist','Lash/Brow Technician','Receptionist','Cashier','Unassigned'
    )) NOT VALID;
  END IF;
END
$constraint$;
ALTER TABLE public.staff VALIDATE CONSTRAINT staff_job_title_allowed;

-- Enforce future user -> staff integration even for direct SQL imports.
-- Existing job assignments are never overwritten by this trigger.
CREATE OR REPLACE FUNCTION public.ensure_staff_user_profile()
RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN
  IF NEW.role='STAFF' THEN
    INSERT INTO public.staff(user_id,employee_code,job_title)
    VALUES(NEW.id,'CNTZ-USER-'||NEW.id,'Unassigned')
    ON CONFLICT(user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END
$function$;
DROP TRIGGER IF EXISTS ensure_staff_user_profile ON public."user";
CREATE TRIGGER ensure_staff_user_profile
AFTER INSERT OR UPDATE OF role ON public."user"
FOR EACH ROW EXECUTE FUNCTION public.ensure_staff_user_profile();

COMMIT;

SELECT u.id AS user_id,concat_ws(' ',u."firstName",u."lastName") AS staff_name,
       u.role AS account_role,s.id AS staff_id,s.employee_code,s.job_title
FROM public."user" u JOIN public.staff s ON s.user_id=u.id
WHERE u.role='STAFF' ORDER BY u.id;

-- Centyzz: readable account names directly in the staff table.
-- Uses staff.user_id -> public."user".id; never replaces a UUID with a name.
-- Existing assigned roles, schedules and appointment links are preserved.
-- Run this entire script in Neon SQL Editor. Safe to run again.
BEGIN;

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS staff_name text;

CREATE OR REPLACE FUNCTION public.set_staff_account_name()
RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN
  SELECT coalesce(nullif(btrim(concat_ws(' ',u."firstName",u."lastName")),''),
                  'Staff user #' || u.id)
    INTO NEW.staff_name
  FROM public."user" u WHERE u.id=NEW.user_id;
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS set_staff_account_name ON public.staff;
CREATE TRIGGER set_staff_account_name
BEFORE INSERT OR UPDATE OF user_id,staff_name ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.set_staff_account_name();

CREATE OR REPLACE FUNCTION public.sync_staff_account_name()
RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN
  UPDATE public.staff
  SET staff_name=coalesce(nullif(btrim(concat_ws(' ',NEW."firstName",NEW."lastName")),''),
                          'Staff user #' || NEW.id)
  WHERE user_id=NEW.id
    AND staff_name IS DISTINCT FROM coalesce(nullif(btrim(concat_ws(' ',NEW."firstName",NEW."lastName")),''),
                                             'Staff user #' || NEW.id);
  RETURN NEW;
END
$function$;

DROP TRIGGER IF EXISTS sync_staff_account_name ON public."user";
CREATE TRIGGER sync_staff_account_name
AFTER UPDATE OF "firstName","lastName" ON public."user"
FOR EACH ROW EXECUTE FUNCTION public.sync_staff_account_name();

-- Fill missing Staff profiles without overwriting known job assignments.
INSERT INTO public.staff(user_id,employee_code,job_title)
SELECT u.id,'CNTZ-USER-' || u.id,'Unassigned'
FROM public."user" u WHERE u.role='STAFF'
ON CONFLICT(user_id) DO NOTHING;

UPDATE public.staff s
SET staff_name=coalesce(nullif(btrim(concat_ws(' ',u."firstName",u."lastName")),''),
                        'Staff user #' || u.id)
FROM public."user" u
WHERE u.id=s.user_id
  AND s.staff_name IS DISTINCT FROM coalesce(nullif(btrim(concat_ws(' ',u."firstName",u."lastName")),''),
                                            'Staff user #' || u.id);

COMMIT;

SELECT user_id,staff_name,job_title,employee_code,id AS staff_id
FROM public.staff ORDER BY staff_name,user_id;

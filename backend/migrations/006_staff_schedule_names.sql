-- Displays staff names alongside the existing schedule IDs.
-- The original staff_schedules table and its foreign keys remain unchanged.
-- Names stay current automatically through staff.user_id -> user.id.
-- Run this in Neon's SQL Editor, then query the view below.

CREATE OR REPLACE VIEW public.staff_schedules_with_names AS
SELECT
  schedule.id AS schedule_id,
  schedule.staff_id,
  staff.user_id AS staff_user_id,
  coalesce(nullif(btrim(concat_ws(' ', staff_user."firstName", staff_user."lastName")), ''),
           'Staff user #' || staff.user_id) AS staff_name,
  staff.employee_code,
  staff.job_title,
  schedule.starts_at,
  schedule.ends_at,
  schedule.starts_at AT TIME ZONE 'Asia/Manila' AS starts_at_manila,
  schedule.ends_at AT TIME ZONE 'Asia/Manila' AS ends_at_manila,
  schedule.status,
  schedule.notes,
  schedule.assigned_by,
  nullif(btrim(concat_ws(' ', assigned_user."firstName", assigned_user."lastName")), '') AS assigned_by_name,
  schedule.created_at,
  schedule.archived_at,
  schedule.archived_by,
  schedule.archive_reason
FROM public.staff_schedules schedule
JOIN public.staff staff ON staff.id = schedule.staff_id
JOIN public."user" staff_user ON staff_user.id = staff.user_id
LEFT JOIN public."user" assigned_user ON assigned_user.id = schedule.assigned_by;

-- Read the schedules with names and local salon times.
SELECT schedule_id, staff_name, employee_code, job_title,
       starts_at_manila, ends_at_manila, status, assigned_by_name
FROM public.staff_schedules_with_names
WHERE archived_at IS NULL
ORDER BY starts_at_manila, staff_name, schedule_id;

BEGIN;
-- The old date-only constraint prevents two cashiers closing on the same day.
-- The replacement index already enforces one active closeout per date and cashier scope.
ALTER TABLE public.closeout_reports DROP CONSTRAINT IF EXISTS closeout_reports_report_date_key;
COMMIT;

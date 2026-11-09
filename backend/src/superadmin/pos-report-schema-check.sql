-- READ-ONLY Neon SQL Editor checks for Superadmin POS Reports.
-- Running these statements does NOT change any tables or data.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name IN ('pos_transactions', 'closeout_reports')
ORDER BY table_name;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name IN ('pos_transactions', 'closeout_reports')
ORDER BY table_name, ordinal_position;

-- Run these independently AFTER both tables exist:
SELECT COUNT(*) AS total_transactions FROM public.pos_transactions;
SELECT COUNT(*) AS total_closeouts FROM public.closeout_reports;
SELECT report_date, COUNT(*) AS transactions_for_day
FROM public.pos_transactions GROUP BY report_date ORDER BY report_date DESC LIMIT 20;
SELECT report_date, is_closed, created_at
FROM public.closeout_reports ORDER BY id DESC LIMIT 20;

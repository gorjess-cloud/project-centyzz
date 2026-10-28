BEGIN;
CREATE OR REPLACE FUNCTION public.admin_report_day(value text) RETURNS date LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE result date; cleaned text:=btrim(value);
BEGIN
 IF cleaned ~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}$' THEN result:=cleaned::date;
 ELSIF cleaned ~* '^[A-Z]{3,9} [0-9]{1,2}, 20[0-9]{2}$' THEN
  result:=to_date(cleaned,'Month DD, YYYY');
  IF lower(to_char(result,'FMMonth FMDD, YYYY'))<>lower(cleaned) AND lower(to_char(result,'Mon FMDD, YYYY'))<>lower(cleaned) THEN RETURN NULL; END IF;
 ELSE RETURN NULL; END IF;
 RETURN result;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END $$;
ALTER TABLE public.pos_transactions ADD COLUMN IF NOT EXISTS service_id integer REFERENCES public.services(id);
ALTER TABLE public.pos_transactions ADD COLUMN IF NOT EXISTS product_id integer REFERENCES public.products(id);
ALTER TABLE public.pos_transactions ADD COLUMN IF NOT EXISTS cashier_id integer REFERENCES public."user"(id);
ALTER TABLE public.pos_transactions ADD COLUMN IF NOT EXISTS transaction_id bigint REFERENCES public.transactions(id);
CREATE INDEX IF NOT EXISTS pos_report_day_idx ON public.pos_transactions(public.admin_report_day(report_date));
CREATE INDEX IF NOT EXISTS pos_canonical_link_idx ON public.pos_transactions(transaction_id);
-- Link only unique exact matches. Never guess a historical cashier or reprice a sale.
UPDATE public.pos_transactions p SET service_id=s.id FROM (SELECT lower(btrim(name)) AS name,min(id) AS id FROM public.services GROUP BY lower(btrim(name)) HAVING count(*)=1) s WHERE p.service_id IS NULL AND p.product_id IS NULL AND lower(btrim(p.service))=s.name;
UPDATE public.pos_transactions p SET cashier_id=u.id FROM (SELECT lower(btrim(concat_ws(' ',"firstName","lastName"))) AS name,min(id) AS id FROM public."user" WHERE role='STAFF' GROUP BY lower(btrim(concat_ws(' ',"firstName","lastName"))) HAVING count(*)=1) u WHERE p.cashier_id IS NULL AND lower(btrim(p.cashier))=u.name;
ALTER TABLE public.closeout_reports ADD COLUMN IF NOT EXISTS cashier_id integer REFERENCES public."user"(id);
ALTER TABLE public.closeout_reports ADD COLUMN IF NOT EXISTS closed_by integer REFERENCES public."user"(id);
ALTER TABLE public.closeout_reports ADD COLUMN IF NOT EXISTS report_snapshot jsonb;
ALTER TABLE public.closeout_reports ADD COLUMN IF NOT EXISTS source_signature varchar(64);
ALTER TABLE public.closeout_reports ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE public.closeout_reports ADD COLUMN IF NOT EXISTS archived_by integer REFERENCES public."user"(id);
CREATE INDEX IF NOT EXISTS closeout_report_day_idx ON public.closeout_reports(public.admin_report_day(report_date));
CREATE TABLE IF NOT EXISTS public.admin_notification_reads (
 user_id integer NOT NULL REFERENCES public."user"(id),
 notification_key varchar(180) NOT NULL,
 read_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,notification_key)
);
COMMIT;

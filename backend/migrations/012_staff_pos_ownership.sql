BEGIN;
ALTER TABLE public.pos_transactions ADD COLUMN IF NOT EXISTS cashier_staff_id uuid REFERENCES public.staff(id);
ALTER TABLE public.pos_transactions ADD COLUMN IF NOT EXISTS original_cashier text;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS cashier_staff_id uuid REFERENCES public.staff(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS checkout_request_hash varchar(64);
ALTER TABLE public.closeout_reports ADD COLUMN IF NOT EXISTS cashier_staff_id uuid REFERENCES public.staff(id);
ALTER TABLE public.closeout_reports ADD COLUMN IF NOT EXISTS original_cashier text;
CREATE INDEX IF NOT EXISTS pos_cashier_staff_idx ON public.pos_transactions(cashier_staff_id);
CREATE INDEX IF NOT EXISTS transactions_cashier_staff_idx ON public.transactions(cashier_staff_id);
UPDATE public.pos_transactions p SET cashier_staff_id=s.id FROM public.staff s WHERE s.user_id=p.cashier_id AND p.cashier_staff_id IS NULL;
UPDATE public.transactions t SET cashier_staff_id=s.id FROM public.staff s WHERE s.user_id=t.cashier_id AND t.cashier_staff_id IS NULL;
UPDATE public.closeout_reports r SET cashier_staff_id=s.id FROM public.staff s WHERE s.user_id=r.cashier_id AND r.cashier_staff_id IS NULL;
-- Explicit user-requested correction of the embedded demo alias. Preserve its original label.
DO $$ DECLARE person record; matches integer; changed integer:=0; n integer;
BEGIN
 IF EXISTS(SELECT 1 FROM public.pos_transactions WHERE lower(btrim(cashier))='mochakoi') OR EXISTS(SELECT 1 FROM public.closeout_reports WHERE lower(btrim(cashier))='mochakoi') THEN
  SELECT count(*) INTO matches FROM public.staff s JOIN public."user" u ON u.id=s.user_id WHERE u.role='STAFF' AND lower(btrim(concat_ws(' ',u."firstName",u."lastName")))='karl maverick anonuevo';
  IF matches<>1 THEN RAISE EXCEPTION 'Karl must have one unambiguous Staff profile before mapping the mochakoi alias'; END IF;
  SELECT s.id AS staff_id,u.id AS user_id,concat_ws(' ',u."firstName",u."lastName") AS name INTO person FROM public.staff s JOIN public."user" u ON u.id=s.user_id WHERE u.role='STAFF' AND lower(btrim(concat_ws(' ',u."firstName",u."lastName")))='karl maverick anonuevo';
  UPDATE public.pos_transactions SET original_cashier=coalesce(original_cashier,cashier),cashier=person.name,cashier_id=person.user_id,cashier_staff_id=person.staff_id WHERE lower(btrim(cashier))='mochakoi';GET DIAGNOSTICS n=ROW_COUNT;changed:=changed+n;
  UPDATE public.closeout_reports SET original_cashier=coalesce(original_cashier,cashier),cashier=person.name,cashier_id=person.user_id,cashier_staff_id=person.staff_id,closed_by=coalesce(closed_by,person.user_id) WHERE lower(btrim(cashier))='mochakoi';GET DIAGNOSTICS n=ROW_COUNT;changed:=changed+n;
  IF changed>0 THEN INSERT INTO public.operational_logs(module,event,user_name,user_role,details,status) VALUES('POS Reports','Cashier References Corrected','Local development migration','SYSTEM','Mapped the embedded mochakoi alias to Karl''s linked Staff profile at the user''s request; original labels and all monetary amounts retained.','Logged');END IF;
 END IF;
END $$;
CREATE OR REPLACE FUNCTION public.pos_cashier_staff_link() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE owner_id integer; profile uuid;
BEGIN
 IF NEW.cashier_staff_id IS NOT NULL THEN
  SELECT user_id INTO owner_id FROM public.staff WHERE id=NEW.cashier_staff_id;
  IF owner_id IS NULL OR (NEW.cashier_id IS NOT NULL AND NEW.cashier_id<>owner_id) THEN RAISE EXCEPTION 'Cashier account does not match Staff profile' USING ERRCODE='23514';END IF;
  NEW.cashier_id:=owner_id;
 ELSIF NEW.cashier_id IS NOT NULL THEN
  SELECT id INTO profile FROM public.staff WHERE user_id=NEW.cashier_id;NEW.cashier_staff_id:=profile;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS pos_cashier_staff_link ON public.pos_transactions;
CREATE TRIGGER pos_cashier_staff_link BEFORE INSERT OR UPDATE OF cashier_id,cashier_staff_id ON public.pos_transactions FOR EACH ROW EXECUTE FUNCTION public.pos_cashier_staff_link();
DROP TRIGGER IF EXISTS canonical_cashier_staff_link ON public.transactions;
CREATE TRIGGER canonical_cashier_staff_link BEFORE INSERT OR UPDATE OF cashier_id,cashier_staff_id ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.pos_cashier_staff_link();
DROP TRIGGER IF EXISTS closeout_cashier_staff_link ON public.closeout_reports;
CREATE TRIGGER closeout_cashier_staff_link BEFORE INSERT OR UPDATE OF cashier_id,cashier_staff_id ON public.closeout_reports FOR EACH ROW EXECUTE FUNCTION public.pos_cashier_staff_link();
DROP INDEX IF EXISTS public.closeout_active_day_unique;
CREATE UNIQUE INDEX IF NOT EXISTS closeout_active_scope_unique ON public.closeout_reports(public.admin_report_day(report_date),coalesce(cashier_staff_id,'00000000-0000-0000-0000-000000000000'::uuid)) WHERE archived_at IS NULL AND is_closed;
-- QR Ph is recorded honestly as a manually confirmed external payment, never mislabeled as GCash.
DO $$ DECLARE rule record;BEGIN
 FOR rule IN SELECT conname FROM pg_constraint WHERE conrelid='public.payments'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%method%' AND pg_get_constraintdef(oid) LIKE '%ANY%' LOOP EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I',rule.conname);END LOOP;
END $$;
ALTER TABLE public.payments ADD CONSTRAINT payments_method_supported CHECK(method IN('CASH','GCASH','MAYA','CARD','QRPH','BANK_TRANSFER'));
COMMIT;

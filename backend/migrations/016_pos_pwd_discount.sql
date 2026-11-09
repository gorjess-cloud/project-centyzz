BEGIN;
-- Extend only the two discount-source checks; preserve their reference/approval rules.
DO $block$ DECLARE rule record; BEGIN
 FOR rule IN SELECT conname FROM pg_constraint
  WHERE conrelid='public.transaction_discounts'::regclass AND contype='c'
    AND pg_get_constraintdef(oid) LIKE '%source%'
 LOOP EXECUTE format('ALTER TABLE public.transaction_discounts DROP CONSTRAINT %I',rule.conname); END LOOP;
END $block$;
ALTER TABLE public.transaction_discounts ADD CONSTRAINT transaction_discounts_source_allowed
 CHECK(source IN ('TIER','PROMO','MANUAL','SENIOR','PWD'));
ALTER TABLE public.transaction_discounts ADD CONSTRAINT transaction_discounts_source_references
 CHECK((source='TIER' AND tier_id IS NOT NULL AND promo_id IS NULL)
 OR (source='PROMO' AND promo_id IS NOT NULL AND tier_id IS NULL)
 OR (source IN ('MANUAL','SENIOR','PWD') AND tier_id IS NULL AND promo_id IS NULL AND approved_by IS NOT NULL));
COMMIT;

BEGIN;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS tin_number varchar(50);
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS public_description text;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS opening_hours jsonb NOT NULL DEFAULT '[{"day":0,"closed":false,"start":"12:00","end":"21:00"},{"day":1,"closed":false,"start":"12:00","end":"21:00"},{"day":2,"closed":false,"start":"12:00","end":"21:00"},{"day":3,"closed":false,"start":"12:00","end":"21:00"},{"day":4,"closed":false,"start":"12:00","end":"21:00"},{"day":5,"closed":false,"start":"12:00","end":"21:00"},{"day":6,"closed":false,"start":"12:00","end":"21:00"}]'::jsonb;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS booking_slot_minutes integer NOT NULL DEFAULT 30 CHECK(booking_slot_minutes IN(15,30,60));
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS default_low_stock_threshold integer NOT NULL DEFAULT 5 CHECK(default_low_stock_threshold>=0);
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS inventory_alerts_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE public.management_security ADD COLUMN IF NOT EXISTS avatar_data_url text;
INSERT INTO public.system_settings(id,salon_name,address,contact_phone,timezone,currency)
VALUES(1,'Centyzz Hair & Beauty','Unit A, Block 15 Lot 2, Bagumbong, Caloocan City','0976 187 2638','Asia/Manila','PHP') ON CONFLICT(id) DO NOTHING;
COMMIT;

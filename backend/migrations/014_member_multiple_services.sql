BEGIN;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS booking_request_key uuid;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS booking_request_hash varchar(64);
CREATE UNIQUE INDEX IF NOT EXISTS appointment_member_request_unique
 ON public.appointments(user_id,booking_request_key) WHERE booking_request_key IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.appointment_services (
 appointment_id integer NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
 service_id integer NOT NULL REFERENCES public.services(id),
 position smallint NOT NULL CHECK(position BETWEEN 0 AND 19),
 service_name varchar(200) NOT NULL,
 unit_price numeric(12,2) NOT NULL CHECK(unit_price>=0),
 duration_minutes integer NOT NULL CHECK(duration_minutes>0),
 PRIMARY KEY(appointment_id,service_id),
 UNIQUE(appointment_id,position)
);
CREATE OR REPLACE VIEW public.appointment_service_summary AS
 SELECT appointment_id,string_agg(service_name,', ' ORDER BY position) AS names,
 sum(unit_price) AS price,sum(duration_minutes)::integer AS duration_minutes,
 jsonb_agg(jsonb_build_object('id',service_id,'name',service_name,'price',unit_price,
 'durationMinutes',duration_minutes) ORDER BY position) AS services
 FROM public.appointment_services GROUP BY appointment_id;
COMMIT;

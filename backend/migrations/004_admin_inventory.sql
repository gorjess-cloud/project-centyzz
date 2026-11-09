-- Admin inventory: reuse products, inventory, and inventory_movements.
-- Additive only; no sample products and no changes to existing balances.
BEGIN;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock_unit varchar(40) NOT NULL DEFAULT 'Pieces';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS supplier_name varchar(150);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS inventory_hidden_at timestamptz;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS inventory_hidden_by integer REFERENCES public."user"(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS inventory_previous_active boolean;

CREATE TABLE IF NOT EXISTS public.inventory_requests (
  request_key uuid PRIMARY KEY,
  actor_user_id integer NOT NULL REFERENCES public."user"(id),
  operation text NOT NULL,
  payload_hash text NOT NULL,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.inventory_purchase_orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  requested_by integer NOT NULL REFERENCES public."user"(id),
  requested_by_name text NOT NULL,
  items jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array'),
  total numeric(18,2) NOT NULL CHECK (total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_purchase_orders_created_idx ON public.inventory_purchase_orders(created_at DESC);
COMMIT;

-- Add shipping/logistics fields to return_requests table
ALTER TABLE public.return_requests 
ADD COLUMN IF NOT EXISTS shipping_provider text,
ADD COLUMN IF NOT EXISTS shipping_id text,
ADD COLUMN IF NOT EXISTS tracking_code text,
ADD COLUMN IF NOT EXISTS label_url text,
ADD COLUMN IF NOT EXISTS shipping_cost numeric DEFAULT 0;

-- Add store address fields to stores table for reverse logistics origin
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS address_street text,
ADD COLUMN IF NOT EXISTS address_number text,
ADD COLUMN IF NOT EXISTS address_complement text,
ADD COLUMN IF NOT EXISTS address_district text,
ADD COLUMN IF NOT EXISTS address_city text,
ADD COLUMN IF NOT EXISTS address_state text,
ADD COLUMN IF NOT EXISTS address_postal_code text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS document text;

-- Add customer address fields to return_requests for shipping destination
ALTER TABLE public.return_requests
ADD COLUMN IF NOT EXISTS customer_phone text,
ADD COLUMN IF NOT EXISTS customer_postal_code text,
ADD COLUMN IF NOT EXISTS customer_address text,
ADD COLUMN IF NOT EXISTS customer_address_number text,
ADD COLUMN IF NOT EXISTS customer_district text,
ADD COLUMN IF NOT EXISTS customer_city text,
ADD COLUMN IF NOT EXISTS customer_state text;

COMMENT ON COLUMN public.return_requests.shipping_provider IS 'Shipping provider: melhor_envio, correios, etc';
COMMENT ON COLUMN public.return_requests.shipping_id IS 'External shipping ID from provider';
COMMENT ON COLUMN public.return_requests.tracking_code IS 'Tracking code for the shipment';
COMMENT ON COLUMN public.return_requests.label_url IS 'URL to download/print shipping label';
COMMENT ON COLUMN public.return_requests.shipping_cost IS 'Cost of shipping paid by store';
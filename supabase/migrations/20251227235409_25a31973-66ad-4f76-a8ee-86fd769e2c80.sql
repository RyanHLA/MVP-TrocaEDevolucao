-- Create stores table to persist connected stores
CREATE TABLE public.stores (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    api_key TEXT NOT NULL,
    api_url TEXT NOT NULL,
    nuvemshop_store_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create store_settings table for configuration
CREATE TABLE public.store_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    return_window_days INTEGER NOT NULL DEFAULT 7,
    allow_refund BOOLEAN NOT NULL DEFAULT true,
    allow_store_credit BOOLEAN NOT NULL DEFAULT true,
    store_credit_bonus INTEGER NOT NULL DEFAULT 5,
    credit_format TEXT NOT NULL DEFAULT 'coupon',
    requires_reason BOOLEAN NOT NULL DEFAULT true,
    allow_partial_returns BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create return_requests table
CREATE TABLE public.return_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL,
    order_number TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    resolution_type TEXT,
    reason TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    credit_value DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table for merchant accounts
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stores
CREATE POLICY "Users can view their own stores" 
ON public.stores FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stores" 
ON public.stores FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stores" 
ON public.stores FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stores" 
ON public.stores FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for store_settings (via store ownership)
CREATE POLICY "Users can view settings for their stores" 
ON public.store_settings FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_settings.store_id AND stores.user_id = auth.uid()));

CREATE POLICY "Users can create settings for their stores" 
ON public.store_settings FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_settings.store_id AND stores.user_id = auth.uid()));

CREATE POLICY "Users can update settings for their stores" 
ON public.store_settings FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = store_settings.store_id AND stores.user_id = auth.uid()));

-- RLS Policies for return_requests (via store ownership)
CREATE POLICY "Users can view requests for their stores" 
ON public.return_requests FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = return_requests.store_id AND stores.user_id = auth.uid()));

CREATE POLICY "Users can update requests for their stores" 
ON public.return_requests FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.stores WHERE stores.id = return_requests.store_id AND stores.user_id = auth.uid()));

-- Allow public insert for customer portal submissions
CREATE POLICY "Anyone can create return requests" 
ON public.return_requests FOR INSERT 
WITH CHECK (true);

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_settings_updated_at BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_return_requests_updated_at BEFORE UPDATE ON public.return_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
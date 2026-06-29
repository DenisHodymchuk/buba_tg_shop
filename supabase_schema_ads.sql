-- Create advertisements table
CREATE TABLE IF NOT EXISTS public.advertisements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    platform TEXT NOT NULL, -- Instagram, Facebook, Telegram, TikTok, Google, etc.
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT, -- Cached product name if product is deleted
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    revenue NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    ad_date DATE DEFAULT CURRENT_DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Create policy for all access (for admin usage)
CREATE POLICY "Allow all access to advertisements" ON public.advertisements
    FOR ALL USING (true) WITH CHECK (true);

-- Supabase Schema for Lamp Production Studio & BOM Cost Calculator

-- 1. Hardware & Electrical Components Library
CREATE TABLE IF NOT EXISTS public.lamp_components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Різне',
    supplier TEXT,
    unit TEXT DEFAULT 'шт',
    purchase_price NUMERIC NOT NULL DEFAULT 0,
    stock_qty NUMERIC NOT NULL DEFAULT 0,
    min_stock_alert NUMERIC DEFAULT 5,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.lamp_components ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to lamp_components" ON public.lamp_components
    FOR ALL USING (true) WITH CHECK (true);

-- 2. Lamp Models (Saved Recipes)
CREATE TABLE IF NOT EXISTS public.lamp_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    image_url TEXT,
    target_margin NUMERIC DEFAULT 50,
    sale_price NUMERIC DEFAULT 0,
    defect_margin_percent NUMERIC DEFAULT 5,
    packaging_cost NUMERIC DEFAULT 0,
    electricity_cost_kwh NUMERIC DEFAULT 4.32,
    printer_wattage NUMERIC DEFAULT 120,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lamp_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to lamp_models" ON public.lamp_models
    FOR ALL USING (true) WITH CHECK (true);

-- 3. Bill of Materials (BOM) Items per Lamp Model
CREATE TABLE IF NOT EXISTS public.lamp_bom_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lamp_model_id UUID REFERENCES public.lamp_models(id) ON DELETE CASCADE,
    component_id UUID REFERENCES public.lamp_components(id) ON DELETE SET NULL,
    component_name TEXT NOT NULL,
    quantity NUMERIC NOT NULL DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lamp_bom_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to lamp_bom_items" ON public.lamp_bom_items
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Multi-stage Labor for Lamp Model
CREATE TABLE IF NOT EXISTS public.lamp_labor_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lamp_model_id UUID REFERENCES public.lamp_models(id) ON DELETE CASCADE,
    stage_name TEXT NOT NULL,
    duration_hours NUMERIC DEFAULT 0,
    hourly_rate NUMERIC DEFAULT 150,
    fixed_cost NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lamp_labor_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to lamp_labor_stages" ON public.lamp_labor_stages
    FOR ALL USING (true) WITH CHECK (true);

-- 5. 3D Print Parts per Lamp Model
CREATE TABLE IF NOT EXISTS public.lamp_print_parts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lamp_model_id UUID REFERENCES public.lamp_models(id) ON DELETE CASCADE,
    part_name TEXT NOT NULL,
    material_type TEXT DEFAULT 'PLA',
    cost_per_kg NUMERIC DEFAULT 750,
    weight_g NUMERIC DEFAULT 0,
    print_time_h NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.lamp_print_parts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to lamp_print_parts" ON public.lamp_print_parts
    FOR ALL USING (true) WITH CHECK (true);

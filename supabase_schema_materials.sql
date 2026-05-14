-- Create material library table
CREATE TABLE IF NOT EXISTS public.material_library (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    manufacturer TEXT,
    color TEXT,
    cost_per_kg NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.material_library ENABLE ROW LEVEL SECURITY;

-- Create policy for all access (since it's an admin-only feature in practice)
CREATE POLICY "Allow all access to material_library" ON public.material_library
    FOR ALL USING (true) WITH CHECK (true);

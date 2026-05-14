-- Table to store 3D printing cost calculations
CREATE TABLE IF NOT EXISTS calculations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    model_name TEXT,
    
    -- Inputs
    weight_g NUMERIC DEFAULT 0,
    time_h NUMERIC DEFAULT 0,
    plastic_cost_roll NUMERIC DEFAULT 0, -- Cost per 1kg roll
    plastic_type TEXT DEFAULT 'PLA',
    electricity_cost_kwh NUMERIC DEFAULT 0,
    printer_wattage NUMERIC DEFAULT 0,
    wear_cost_h NUMERIC DEFAULT 0,
    failure_margin NUMERIC DEFAULT 0, -- percentage
    
    -- AMS
    ams_swaps INTEGER DEFAULT 0,
    purge_g NUMERIC DEFAULT 0,
    
    -- Labor & Profit
    labor_cost_h NUMERIC DEFAULT 0,
    profit_margin NUMERIC DEFAULT 0, -- percentage
    
    -- Results
    total_prime_cost NUMERIC DEFAULT 0,
    suggested_price NUMERIC DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

-- Simple policy for admin access (assuming authenticated users are admins for this simple shop)
CREATE POLICY "Enable all for authenticated users" ON calculations
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

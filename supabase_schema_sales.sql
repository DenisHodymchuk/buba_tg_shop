-- Add source column to orders table to support manual sales tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website' CHECK (source IN ('website', 'olx', 'instagram', 'facebook', 'telegram', 'offline', 'other', 'tiktok'));

-- Update orders status check constraint to support the new 'shipped' status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('new', 'preparing', 'printing', 'shipping', 'shipped', 'completed', 'cancelled'));

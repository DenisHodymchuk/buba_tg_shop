-- Add source column to orders table to support manual sales tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';

-- Recreate the source CHECK constraint to include 'threads'
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_source_check;
ALTER TABLE orders ADD CONSTRAINT orders_source_check CHECK (source IN ('website', 'olx', 'instagram', 'facebook', 'telegram', 'offline', 'other', 'tiktok', 'threads'));

-- Update orders status check constraint to support the new 'shipped' status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('new', 'preparing', 'printing', 'shipping', 'shipped', 'completed', 'cancelled'));

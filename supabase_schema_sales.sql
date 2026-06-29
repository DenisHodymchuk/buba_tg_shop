-- Add source column to orders table to support manual sales tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website' CHECK (source IN ('website', 'olx', 'instagram', 'facebook', 'telegram', 'offline', 'other'));

-- Table for tracking page views on `/links`
CREATE TABLE IF NOT EXISTS bio_links_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT
);

-- Table for tracking clicks on specific links
CREATE TABLE IF NOT EXISTS bio_links_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  link_id TEXT NOT NULL,
  link_title TEXT,
  url TEXT
);

-- Disable Row Level Security (RLS) so client-side anonymous logs can write directly
ALTER TABLE bio_links_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE bio_links_clicks DISABLE ROW LEVEL SECURITY;

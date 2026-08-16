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

-- Enable Row Level Security (RLS) and allow public/anon inserts & selects
ALTER TABLE bio_links_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE bio_links_clicks ENABLE ROW LEVEL SECURITY;

-- Policies for bio_links_views
DROP POLICY IF EXISTS "Allow public insert on views" ON bio_links_views;
CREATE POLICY "Allow public insert on views" ON bio_links_views FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on views" ON bio_links_views;
CREATE POLICY "Allow public select on views" ON bio_links_views FOR SELECT TO anon USING (true);

-- Policies for bio_links_clicks
DROP POLICY IF EXISTS "Allow public insert on clicks" ON bio_links_clicks;
CREATE POLICY "Allow public insert on clicks" ON bio_links_clicks FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on clicks" ON bio_links_clicks;
CREATE POLICY "Allow public select on clicks" ON bio_links_clicks FOR SELECT TO anon USING (true);

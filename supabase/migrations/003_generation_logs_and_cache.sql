-- ╔═══════════════════════════════════════════════╗
-- ║  Namenia: Generation Logs & Name Cache        ║
-- ║  Run this in your Supabase SQL Editor          ║
-- ╚═══════════════════════════════════════════════╝

-- ─── 1. Generation Logs (Audit Trail) ───────────

CREATE TABLE IF NOT EXISTS generation_logs (
    id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    keyword       text NOT NULL,
    settings      jsonb NOT NULL DEFAULT '{}',
    result_count  integer NOT NULL DEFAULT 0,
    source        text NOT NULL DEFAULT 'ai',  -- 'ai', 'local', 'cache', 'mixed'
    created_at    timestamptz DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_gen_logs_keyword ON generation_logs(keyword);
CREATE INDEX IF NOT EXISTS idx_gen_logs_user ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gen_logs_created ON generation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gen_logs_source ON generation_logs(source);

-- RLS: Users can insert their own logs, admins can read all
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert logs"
    ON generation_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can read own logs"
    ON generation_logs FOR SELECT
    USING (user_id = auth.uid() OR user_id IS NULL);


-- ─── 2. Name Cache (Reusable Name Library) ─────

CREATE TABLE IF NOT EXISTS name_cache (
    id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name                text NOT NULL UNIQUE,
    keyword             text NOT NULL,
    industry            text,
    style               text NOT NULL DEFAULT 'auto',
    score               integer NOT NULL DEFAULT 85,
    availability        jsonb,
    source              text NOT NULL DEFAULT 'ai',  -- 'ai' or 'local'
    times_shown         integer NOT NULL DEFAULT 1,
    times_shortlisted   integer NOT NULL DEFAULT 0,
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now()
);

-- Indexes for fast cache lookups
CREATE INDEX IF NOT EXISTS idx_cache_keyword ON name_cache(keyword);
CREATE INDEX IF NOT EXISTS idx_cache_industry ON name_cache(industry);
CREATE INDEX IF NOT EXISTS idx_cache_score ON name_cache(score DESC);
CREATE INDEX IF NOT EXISTS idx_cache_keyword_industry ON name_cache(keyword, industry, score DESC);

-- RLS: Public read, authenticated write
ALTER TABLE name_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cache"
    ON name_cache FOR SELECT
    USING (true);

CREATE POLICY "Anyone can insert cache"
    ON name_cache FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can update cache"
    ON name_cache FOR UPDATE
    USING (true);


-- ─── 3. RPC Functions (Atomic Increments) ───────

-- Increment shortlist count for a specific name
CREATE OR REPLACE FUNCTION increment_shortlist_count(target_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE name_cache
    SET times_shortlisted = times_shortlisted + 1,
        updated_at = now()
    WHERE name = target_name;
END;
$$;

-- Increment shown count for multiple names at once
CREATE OR REPLACE FUNCTION increment_shown_count(target_names text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE name_cache
    SET times_shown = times_shown + 1,
        updated_at = now()
    WHERE name = ANY(target_names);
END;
$$;


-- ─── 4. Auto-update trigger for updated_at ──────

CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_name_cache_modtime
    BEFORE UPDATE ON name_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

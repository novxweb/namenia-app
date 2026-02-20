-- ╔═══════════════════════════════════════════════╗
-- ║  Security Fix: Secure Name Cache RLS          ║
-- ║  Run this in your Supabase SQL Editor          ║
-- ╚═══════════════════════════════════════════════╝

-- 1. Drop insecure permissive policies
DROP POLICY IF EXISTS "Anyone can update cache" ON name_cache;
DROP POLICY IF EXISTS "Anyone can insert cache" ON name_cache;

-- 2. Restrict INSERT to authenticated/anon
DROP POLICY IF EXISTS "Authenticated users can insert cache" ON name_cache;

CREATE POLICY "Authenticated users can insert cache"
    ON name_cache FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon'); 

-- 3. DISABLE UPDATE via direct API
--    No update policy means direct UPDATEs are denied.
--    Updates must now go through `increment_shortlist_count` or `increment_shown_count` RPC.

-- 4. Fix generation_logs read access
DROP POLICY IF EXISTS "Users can read own logs" ON generation_logs;

CREATE POLICY "Users can read own logs"
    ON generation_logs FOR SELECT
    USING (auth.uid() = user_id);

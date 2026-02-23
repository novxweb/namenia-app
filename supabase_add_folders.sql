-- Run this in your Supabase SQL Editor to add folder support to your shortlists
ALTER TABLE shortlists ADD COLUMN IF NOT EXISTS folder_data jsonb DEFAULT '[]'::jsonb;

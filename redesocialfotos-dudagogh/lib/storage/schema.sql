-- ==============================================================================
-- DATABASE & STORAGE SCHEMA FOR EDUARDA'S 15TH BIRTHDAY PARTY PHOTO APP
-- Run this script in the Supabase SQL Editor (https://app.supabase.com)
-- ==============================================================================

-- 1. Create Photos Table
CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'Convidado Especial',
    caption TEXT DEFAULT '',
    likes_count INT NOT NULL DEFAULT 0,
    liked_by JSONB NOT NULL DEFAULT '[]'::jsonb,
    session_id TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indexes for High Performance Queries
CREATE INDEX IF NOT EXISTS photos_created_at_idx ON public.photos (created_at DESC);
CREATE INDEX IF NOT EXISTS photos_likes_count_idx ON public.photos (likes_count DESC, created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow anyone to read all photos
CREATE POLICY "Allow public read access to photos"
ON public.photos FOR SELECT
USING (true);

-- Allow anyone to insert new photos
CREATE POLICY "Allow public insert to photos"
ON public.photos FOR INSERT
WITH CHECK (true);

-- Allow anyone to update likes
CREATE POLICY "Allow public update to photos"
ON public.photos FOR UPDATE
USING (true);

-- Allow deletion of photos
CREATE POLICY "Allow photo deletion"
ON public.photos FOR DELETE
USING (true);

-- 5. Create Storage Bucket for Photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('memories', 'memories', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage Security Policies
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'memories');

CREATE POLICY "Public Upload Access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'memories');

CREATE POLICY "Public Delete Access"
ON storage.objects FOR DELETE
USING (bucket_id = 'memories');

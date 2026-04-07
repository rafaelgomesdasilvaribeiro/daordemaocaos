-- SQL MIGRATION: Add Daily Progress to Challenges
-- Execute this script in the Supabase Dashboard SQL Editor

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'challenges' AND column_name = 'daily_progress') THEN
    ALTER TABLE public.challenges ADD COLUMN daily_progress jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

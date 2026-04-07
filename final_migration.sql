-- FINAL COMPREHENSIVE MIGRATION
-- This script ensures all tables, columns, and RLS policies are correctly set up.
-- Please execute this in the Supabase SQL Editor.

-- 1. Create calendar_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users DEFAULT auth.uid() NOT NULL,
  title text NOT NULL,
  description text,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  color text,
  notification text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Add missing columns to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS subtasks jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS calendar_event_id uuid;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users DEFAULT auth.uid();

-- 3. Enable RLS on all relevant tables
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies (Owner access only)
DO $$ 
BEGIN 
  -- Tasks
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own tasks') THEN
    CREATE POLICY "Users can only access their own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Calendar Events
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own events') THEN
    CREATE POLICY "Users can only access their own events" ON calendar_events FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Projects
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own projects') THEN
    CREATE POLICY "Users can only access their own projects" ON projects FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Note Folders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own folders') THEN
    CREATE POLICY "Users can only access their own folders" ON note_folders FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Notes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own notes') THEN
    CREATE POLICY "Users can only access their own notes" ON notes FOR ALL USING (auth.uid() = user_id);
  END IF;

  -- Knowledge Sources
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own sources') THEN
    CREATE POLICY "Users can only access their own sources" ON knowledge_sources FOR ALL USING (auth.uid() = user_id);
  END IF;
  
  -- Columns
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own columns') THEN
    CREATE POLICY "Users can only access their own columns" ON public.columns FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

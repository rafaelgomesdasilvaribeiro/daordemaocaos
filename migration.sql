-- SQL MIGRATION FOR MULTI-USER SUPPORT
-- Execute this script in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard/project/vozxmxenpnnlfwvkkdew/sql/new)

-- 1. Add user_id column to existing tables
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'user_id') THEN
    ALTER TABLE tasks ADD COLUMN user_id uuid REFERENCES auth.users DEFAULT auth.uid();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'columns' AND column_name = 'user_id') THEN
    ALTER TABLE public.columns ADD COLUMN user_id uuid REFERENCES auth.users DEFAULT auth.uid();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'user_id') THEN
    ALTER TABLE projects ADD COLUMN user_id uuid REFERENCES auth.users DEFAULT auth.uid();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'note_folders' AND column_name = 'user_id') THEN
    ALTER TABLE note_folders ADD COLUMN user_id uuid REFERENCES auth.users DEFAULT auth.uid();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notes' AND column_name = 'user_id') THEN
    ALTER TABLE notes ADD COLUMN user_id uuid REFERENCES auth.users DEFAULT auth.uid();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'knowledge_sources' AND column_name = 'user_id') THEN
    ALTER TABLE knowledge_sources ADD COLUMN user_id uuid REFERENCES auth.users DEFAULT auth.uid();
  END IF;
END $$;

-- 2. Create calendar_events table
CREATE TABLE IF NOT EXISTS calendar_events (
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

-- 3. Enable RLS on all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies (Owner access only)
-- Drop existing policies to avoid duplicates
DROP POLICY IF EXISTS "Users can only access their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can only access their own columns" ON public.columns;
DROP POLICY IF EXISTS "Users can only access their own projects" ON projects;
DROP POLICY IF EXISTS "Users can only access their own folders" ON note_folders;
DROP POLICY IF EXISTS "Users can only access their own notes" ON notes;
DROP POLICY IF EXISTS "Users can only access their own sources" ON knowledge_sources;
DROP POLICY IF EXISTS "Users can only access their own events" ON calendar_events;

CREATE POLICY "Users can only access their own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own columns" ON public.columns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own projects" ON projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own folders" ON note_folders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own notes" ON notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own sources" ON knowledge_sources FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own events" ON calendar_events FOR ALL USING (auth.uid() = user_id);

-- SQL MIGRATION V3: Advanced Task Features
-- Execute this in the Supabase Dashboard SQL Editor

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'description') THEN
    ALTER TABLE tasks ADD COLUMN description text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'subtasks') THEN
    ALTER TABLE tasks ADD COLUMN subtasks jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'attachments') THEN
    ALTER TABLE tasks ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'calendar_event_id') THEN
    ALTER TABLE tasks ADD COLUMN calendar_event_id uuid;
  END IF;
END $$;

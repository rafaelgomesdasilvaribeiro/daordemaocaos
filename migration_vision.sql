-- Create vision board items table
CREATE TABLE IF NOT EXISTS public.vision_board_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users DEFAULT auth.uid() NOT NULL,
  image_url text NOT NULL,
  position_x numeric DEFAULT 0,
  position_y numeric DEFAULT 0,
  z_index integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vision_board_items ENABLE ROW LEVEL SECURITY;

-- Add Policy
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can only access their own vision board items') THEN
    CREATE POLICY "Users can only access their own vision board items" ON vision_board_items FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

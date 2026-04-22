-- Migration for Mental Maps Feature

-- Table: mind_maps
CREATE TABLE IF NOT EXISTS public.mind_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: mind_map_nodes
CREATE TABLE IF NOT EXISTS public.mind_map_nodes (
    id TEXT PRIMARY KEY, -- We use text for easy client-side generation, or UUID
    map_id UUID NOT NULL REFERENCES public.mind_maps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0}'::jsonb,
    type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: mind_map_edges
CREATE TABLE IF NOT EXISTS public.mind_map_edges (
    id TEXT PRIMARY KEY,
    map_id UUID NOT NULL REFERENCES public.mind_maps(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE,
    target TEXT NOT NULL REFERENCES public.mind_map_nodes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.mind_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mind_map_edges ENABLE ROW LEVEL SECURITY;

-- Policies for mind_maps
CREATE POLICY "Users can create their own mind maps" ON public.mind_maps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own mind maps" ON public.mind_maps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own mind maps" ON public.mind_maps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mind maps" ON public.mind_maps FOR DELETE USING (auth.uid() = user_id);

-- Policies for mind_map_nodes
CREATE POLICY "Users can create their own mind map nodes" ON public.mind_map_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own mind map nodes" ON public.mind_map_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own mind map nodes" ON public.mind_map_nodes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mind map nodes" ON public.mind_map_nodes FOR DELETE USING (auth.uid() = user_id);

-- Policies for mind_map_edges
CREATE POLICY "Users can create their own mind map edges" ON public.mind_map_edges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own mind map edges" ON public.mind_map_edges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own mind map edges" ON public.mind_map_edges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own mind map edges" ON public.mind_map_edges FOR DELETE USING (auth.uid() = user_id);

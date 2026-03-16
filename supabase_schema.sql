-- Run this entire script in the Supabase SQL Editor

-- 1. Create the 'services' table
CREATE TABLE IF NOT EXISTS public.services (
  id text NOT NULL, -- e.g., 'stripe', 'github'
  user_id text NOT NULL, -- Clerk user ID
  name text NOT NULL,
  api_key text,
  connected boolean DEFAULT false NOT NULL,
  last_polled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Composite primary key so each user can have one row per service type
  PRIMARY KEY (id, user_id)
);

-- 2. Create the 'changes' table
CREATE TABLE IF NOT EXISTS public.changes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  service_id text NOT NULL,
  diff text NOT NULL, -- Stores JSON string of the diff
  acknowledged integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Set up Row Level Security (RLS) policies
-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changes ENABLE ROW LEVEL SECURITY;

-- Create policies so the Next.js backend (using the service key / authenticated anon) 
-- can read/write. Since you are likely using the Supabase Anon Key with custom backend logic 
-- or a Service Role Key, we'll make it completely open for now to prevent RLS blocks 
-- while you're prototyping setup.
-- (In production, you'd lock this down based on Clerk JWTs)

CREATE POLICY "Allow all operations for services" ON public.services
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for changes" ON public.changes
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Create the 'team_members' table
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id text NOT NULL, -- The user who owns the account
  user_email text NOT NULL, -- Invited user email
  role text DEFAULT 'member' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  
  -- Prevent duplicate invites
  UNIQUE (owner_id, user_email)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for team_members" ON public.team_members
  FOR ALL USING (true) WITH CHECK (true);
-- 5. Create the 'projects' table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for projects" ON public.projects
  FOR ALL USING (true) WITH CHECK (true);

-- 6. Add project_id to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

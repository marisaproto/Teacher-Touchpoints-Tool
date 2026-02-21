-- ============================================================
-- Teacher Touchpoints Tool — Supabase Setup
-- Run this entire file in: Supabase Dashboard > SQL Editor
-- ============================================================

-- ── Profiles (extends auth.users) ───────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username     TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  is_admin     BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Schools ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schools (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── People ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS people (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  school_id    UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL,
  department   TEXT,
  grade_level  TEXT,
  goal         TEXT
);

-- ── Touchpoints ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS touchpoints (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  person_id  UUID REFERENCES people(id) ON DELETE CASCADE NOT NULL,
  school_id  UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  date       DATE NOT NULL,
  type       TEXT NOT NULL,
  data       JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Enable Row Level Security ────────────────────────────────
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools     ENABLE ROW LEVEL SECURITY;
ALTER TABLE people      ENABLE ROW LEVEL SECURITY;
ALTER TABLE touchpoints ENABLE ROW LEVEL SECURITY;

-- ── Helper: check if current user is admin ───────────────────
-- SECURITY DEFINER bypasses RLS so this never recurses
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = auth.uid()),
    false
  )
$$;

-- ── Profiles policies ────────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

-- ── Schools policies ─────────────────────────────────────────
-- Schools are shared: all authenticated users can see and add schools.
-- Only the creator (or an admin) can update or delete a school.
CREATE POLICY "All users can view schools"
  ON schools FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can add schools"
  ON schools FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators and admins can update schools"
  ON schools FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Creators and admins can delete schools"
  ON schools FOR DELETE
  USING (auth.uid() = user_id OR is_admin());

-- ── People policies ──────────────────────────────────────────
-- People are shared: all authenticated users can view and add people so that
-- profiles (teachers, teams, administrators) created by one user are available
-- for any other user to log touchpoints against.
-- Only the creator (or an admin) can update or delete a person.
CREATE POLICY "All users can view people"
  ON people FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can add people"
  ON people FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators and admins can update people"
  ON people FOR UPDATE
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Creators and admins can delete people"
  ON people FOR DELETE
  USING (auth.uid() = user_id OR is_admin());

-- ── Touchpoints policies ─────────────────────────────────────
-- Touchpoints remain private: each user only sees their own.
CREATE POLICY "Users manage own touchpoints"
  ON touchpoints FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all touchpoints"
  ON touchpoints FOR SELECT
  USING (is_admin());

-- ============================================================
-- MIGRATION: Switch schools & people to shared access
-- Run this block in the SQL Editor if you set up the database
-- BEFORE this shared-profiles update.
-- ============================================================
-- DROP POLICY IF EXISTS "Users manage own schools"   ON schools;
-- DROP POLICY IF EXISTS "Admins can view all schools" ON schools;
-- DROP POLICY IF EXISTS "Users manage own people"    ON people;
-- DROP POLICY IF EXISTS "Admins can view all people" ON people;
--
-- Then re-run the "Schools policies" and "People policies"
-- blocks above to create the new shared-access policies.

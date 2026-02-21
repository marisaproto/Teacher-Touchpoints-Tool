-- Migration: add get_school_coach_counts() RPC function
-- Run this in your Supabase SQL editor to enable per-school coach counts.
--
-- This function uses SECURITY DEFINER so it can count distinct coaches
-- across all users' touchpoints without exposing private touchpoint data.

CREATE OR REPLACE FUNCTION get_school_coach_counts()
RETURNS TABLE(school_id UUID, coach_count BIGINT)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT school_id, COUNT(DISTINCT user_id)::BIGINT AS coach_count
  FROM touchpoints
  GROUP BY school_id;
$$;

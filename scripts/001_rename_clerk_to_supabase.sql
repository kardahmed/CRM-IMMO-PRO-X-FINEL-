-- ============================================================================
-- Migration: Rename clerk_id → supabase_id
--
-- Context: Migrated from Clerk to Supabase Auth.
-- The Prisma schema now maps User.supabaseId to column "supabase_id".
-- This migration renames the actual DB column to match.
--
-- SAFE: Uses IF EXISTS checks — can be run multiple times.
-- RUN THIS IN: Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. Rename the column (only if clerk_id still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'clerk_id'
  ) THEN
    ALTER TABLE users RENAME COLUMN clerk_id TO supabase_id;
    RAISE NOTICE 'Column renamed: clerk_id → supabase_id';
  ELSE
    RAISE NOTICE 'Column supabase_id already exists — skipping rename';
  END IF;
END $$;

-- 2. Rename the unique index (if old name exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'users_clerk_id_key'
  ) THEN
    ALTER INDEX users_clerk_id_key RENAME TO users_supabase_id_key;
    RAISE NOTICE 'Index renamed: users_clerk_id_key → users_supabase_id_key';
  END IF;
END $$;

-- 3. Rename the regular index (if old name exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'users' AND indexname = 'users_clerk_id_idx'
  ) THEN
    ALTER INDEX users_clerk_id_idx RENAME TO users_supabase_id_idx;
    RAISE NOTICE 'Index renamed: users_clerk_id_idx → users_supabase_id_idx';
  END IF;
END $$;

-- 4. Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

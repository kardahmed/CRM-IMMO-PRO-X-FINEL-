-- ============================================================================
-- Migration: Sync your Supabase Auth user into the users table
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Copy your User UID (UUID format like "abc12345-...")
-- 3. Replace the placeholders below with your real values
-- 4. Run in Supabase Dashboard → SQL Editor
-- ============================================================================

-- Option A: UPDATE existing user (if you already have a row in users table)
-- Uncomment and fill in:
/*
UPDATE users
SET supabase_id = 'YOUR_SUPABASE_AUTH_UUID_HERE'
WHERE email = 'YOUR_EMAIL_HERE';
*/

-- Option B: INSERT new user + tenant (fresh start)
-- Uncomment and fill in:
/*
-- Create your tenant (workspace)
INSERT INTO tenants (id, name, type, plan, status)
VALUES (
  gen_random_uuid(),
  'Mon Agence',        -- Your workspace name
  'AGENCY',            -- or 'PROMOTION'
  'PRO',
  'ACTIVE'
)
ON CONFLICT DO NOTHING
RETURNING id;

-- Then create your user (use the tenant id from above)
INSERT INTO users (id, supabase_id, tenant_id, first_name, last_name, email, role, is_active)
VALUES (
  gen_random_uuid(),
  'YOUR_SUPABASE_AUTH_UUID_HERE',
  'TENANT_ID_FROM_ABOVE',
  'Prenom',
  'Nom',
  'YOUR_EMAIL_HERE',
  'CEO',
  true
);
*/

-- Diagnostic: Check current state of users table
SELECT id, supabase_id, email, role, is_active, tenant_id
FROM users
ORDER BY created_at DESC
LIMIT 10;

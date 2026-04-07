-- ============================================================================
-- CRM IMMO PRO X — Diagnostic d'authentification
--
-- Copier/coller ce script dans Supabase Dashboard → SQL Editor
-- Il va diagnostiquer tous les problèmes de connexion courants.
-- ============================================================================

-- 1. Vérifier si la colonne s'appelle clerk_id ou supabase_id
SELECT '=== STRUCTURE TABLE USERS ===' AS diagnostic;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('clerk_id', 'supabase_id')
ORDER BY column_name;

-- 2. Lister les utilisateurs en base
SELECT '=== UTILISATEURS EN BASE ===' AS diagnostic;
SELECT
  id,
  COALESCE(supabase_id, '(NULL)') AS supabase_id,
  email,
  role,
  is_active,
  tenant_id
FROM users
ORDER BY created_at DESC
LIMIT 20;

-- 3. Lister les utilisateurs Supabase Auth
SELECT '=== UTILISATEURS SUPABASE AUTH ===' AS diagnostic;
SELECT
  id AS auth_uid,
  email,
  created_at,
  last_sign_in_at,
  raw_user_meta_data->>'tenantId' AS metadata_tenant_id,
  raw_user_meta_data->>'role' AS metadata_role
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- 4. Trouver les utilisateurs Auth qui N'ONT PAS de correspondance dans la table users
SELECT '=== AUTH USERS SANS CORRESPONDANCE DB ===' AS diagnostic;
SELECT
  au.id AS auth_uid,
  au.email AS auth_email,
  au.created_at
FROM auth.users au
LEFT JOIN users u ON u.supabase_id = au.id::text
WHERE u.id IS NULL;

-- 5. Vérifier les tenants actifs
SELECT '=== TENANTS ===' AS diagnostic;
SELECT id, name, type, plan, status
FROM tenants
ORDER BY created_at DESC
LIMIT 10;

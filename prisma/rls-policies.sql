-- ============================================================================
-- CRM IMMO PRO X — Row-Level Security (RLS) Policies
-- Supabase PostgreSQL
--
-- Chaque table (sauf tenants) est protégée par RLS.
-- Le tenant_id est extrait du JWT Clerk via : auth.jwt()->>'tenant_id'
-- ============================================================================

-- ============================================================================
-- 1. Activer RLS sur toutes les tables
-- ============================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadastral_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. Policy Tenant — un tenant ne voit que lui-même
-- ============================================================================

CREATE POLICY "tenant_isolation" ON tenants
  FOR ALL
  USING (id = (auth.jwt()->>'tenant_id')::uuid);

-- ============================================================================
-- 3. Policies tenant_id — chaque table filtre par tenant_id
-- ============================================================================

CREATE POLICY "tenant_isolation" ON users
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON projects
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON properties
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON clients
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON tasks
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON visits
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON interactions
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON payments
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON objectives
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON activity_logs
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON notifications
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON owner_mandates
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON mandates
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON cadastral_data
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON automation_configs
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON ai_generations
  FOR ALL
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- ============================================================================
-- 4. Policy INSERT — forcer le tenant_id au INSERT
-- ============================================================================

CREATE POLICY "tenant_insert" ON users
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON projects
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON properties
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON clients
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON tasks
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON visits
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON interactions
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON payments
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON objectives
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON activity_logs
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON notifications
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON owner_mandates
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON mandates
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON cadastral_data
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON automation_configs
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

CREATE POLICY "tenant_insert" ON ai_generations
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt()->>'tenant_id')::uuid);

-- ============================================================================
-- 5. Bypass pour le service_role (migrations, admin, cron)
-- ============================================================================

ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;
ALTER TABLE properties FORCE ROW LEVEL SECURITY;
ALTER TABLE clients FORCE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;
ALTER TABLE visits FORCE ROW LEVEL SECURITY;
ALTER TABLE interactions FORCE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;
ALTER TABLE objectives FORCE ROW LEVEL SECURITY;
ALTER TABLE activity_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE owner_mandates FORCE ROW LEVEL SECURITY;
ALTER TABLE mandates FORCE ROW LEVEL SECURITY;
ALTER TABLE cadastral_data FORCE ROW LEVEL SECURITY;
ALTER TABLE automation_configs FORCE ROW LEVEL SECURITY;
ALTER TABLE ai_generations FORCE ROW LEVEL SECURITY;

-- Le service_role bypass automatiquement RLS sur Supabase.
-- Pour un rôle custom admin :
-- CREATE ROLE crm_admin BYPASSRLS;

-- Migration 003: Marketing budget columns on projects + selected_property_id on clients
-- Applied via Supabase MCP execute_sql on 2026-04-08
-- Run `npx prisma generate` after applying this migration to sync the Prisma client.

-- ============================================================================
-- 1. Projects — marketing budget & metadata columns
-- ============================================================================

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS marketing_budget_ads   DECIMAL,
  ADD COLUMN IF NOT EXISTS marketing_budget_events DECIMAL,
  ADD COLUMN IF NOT EXISTS marketing_budget_print  DECIMAL,
  ADD COLUMN IF NOT EXISTS description            TEXT,
  ADD COLUMN IF NOT EXISTS total_lots             INTEGER,
  ADD COLUMN IF NOT EXISTS images                 JSONB NOT NULL DEFAULT '[]';

-- ============================================================================
-- 2. Clients — link to selected property (Stock Sync)
-- ============================================================================

-- NOTE: properties.id is TEXT (not UUID), so FK must be TEXT
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS selected_property_id TEXT
    REFERENCES properties(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_tenant_selected_property
  ON clients (tenant_id, selected_property_id);

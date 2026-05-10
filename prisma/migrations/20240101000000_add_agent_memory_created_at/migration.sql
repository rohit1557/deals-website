-- Migration: add created_at to agent_memory
-- Blocking Finn's Claude API cost estimator — this column is required for
-- time-series cost queries. DEFAULT NOW() backfills existing rows so the
-- column is immediately NOT NULL-safe without a data migration step.

ALTER TABLE agent_memory
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Migration: add created_at to agent_memory
-- Required by Finn finance agent for time-series Claude API cost queries.
-- DEFAULT NOW() backfills existing rows so the column is immediately NOT NULL-safe.

ALTER TABLE agent_memory
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Migration: add_agent_memory_created_at
-- Timestamp updated to 20250721120000 (was backdated 20240101000000 — Tess's QA flag).
-- Prisma applies migrations in lexicographic order by folder name, so a backdated
-- timestamp risks being skipped or mis-ordered relative to already-applied migrations.
--
-- IF NOT EXISTS guard makes this safe to re-run (idempotent).

ALTER TABLE agent_memory
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

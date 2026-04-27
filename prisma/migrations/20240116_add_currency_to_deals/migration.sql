-- Add currency column to deals table.
-- Defaulting existing rows to 'USD' — Scout needs to include currency in
-- the scraper payload going forward so we can store the real merchant currency.
ALTER TABLE "deals"
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';

-- Remove the default after backfill so new rows must be explicit.
-- (Keep the default for now until scraper is updated — remove in a follow-up migration.)

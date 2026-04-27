-- Migration: add currency column to deals
-- Zara's frontend Deal interface now requires currency as non-nullable.
-- Defaulting to 'USD' for existing rows — scraped data is predominantly US pricing.
-- If/when we ingest AUD or other sources, the scraper sets this explicitly on insert.

ALTER TABLE deals
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

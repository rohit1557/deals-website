import { Client } from "pg";

// Tracks which ASINs have been posted to Instagram so we never repeat them.
// Uses the same Neon Postgres DB as the main website.
// Table is created on first use if it doesn't exist.

async function getClient(): Promise<Client | null> {
  if (!process.env.DATABASE_URL) return null;
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  return client;
}

async function ensureTable(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS instagram_posted (
      asin       TEXT PRIMARY KEY,
      posted_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function filterUnposted(asins: string[]): Promise<Set<string>> {
  const client = await getClient();
  if (!client) {
    console.warn("[posted-deals] No DATABASE_URL — skipping dedup check");
    return new Set(asins);
  }

  try {
    await ensureTable(client);
    // Keep only ASINs posted in the last 30 days to allow reprints of evergreen deals
    const res = await client.query<{ asin: string }>(
      `SELECT asin FROM instagram_posted
       WHERE asin = ANY($1)
         AND posted_at > NOW() - INTERVAL '30 days'`,
      [asins],
    );
    const alreadyPosted = new Set(res.rows.map(r => r.asin));
    const fresh = new Set(asins.filter(a => !alreadyPosted.has(a)));
    console.log(`[posted-deals] ${alreadyPosted.size} already posted in last 30d, ${fresh.size} fresh`);
    return fresh;
  } finally {
    await client.end();
  }
}

export async function markPosted(asins: string[]): Promise<void> {
  const client = await getClient();
  if (!client) return;

  try {
    await ensureTable(client);
    for (const asin of asins) {
      await client.query(
        `INSERT INTO instagram_posted (asin) VALUES ($1) ON CONFLICT (asin) DO UPDATE SET posted_at = NOW()`,
        [asin],
      );
    }
    console.log(`[posted-deals] Marked ${asins.length} ASIN(s) as posted`);
  } finally {
    await client.end();
  }
}

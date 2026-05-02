import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

// Route Pool queries over HTTP fetch instead of WebSockets — no ws dependency,
// eliminates cold-start TCP latency in Vercel serverless functions.
neonConfig.poolQueryViaFetch = true;

function createClient() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

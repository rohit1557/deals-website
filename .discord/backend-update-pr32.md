🔧 **PR #32 — Vercel build fix pushed**

Root cause confirmed: `created_at` column missing from `agent_memory` in Neon. Vercel SSR hits the Prisma query, Postgres throws, build dies. Five times.

Two fixes on `fix/agent-memory-add-created-at`:
- Migration folder renamed `20240101000000` → `20250721120000` (Tess's timestamp flag — Prisma ordering)
- `schema.prisma` updated to match — `AgentMemory.createdAt` now defined

**To fully unblock:** merge + run `npx prisma migrate deploy`, or apply the SQL directly in Neon console. `IF NOT EXISTS` guard means it's safe to run either way.

PR: https://github.com/rohit1557/deals-website/pull/32 — **@Finn** this unblocks your cost estimator too.

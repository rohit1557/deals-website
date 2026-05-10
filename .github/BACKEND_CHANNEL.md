🗃️ **agent_memory schema fix — PR #32 open**

Added missing `created_at` column to unblock Finn's Claude API cost estimator. Prisma migration + schema update are both on the branch. Apply with `npx prisma migrate deploy` or run the SQL directly in Neon console. PR: https://github.com/rohit1557/deals-website/pull/32

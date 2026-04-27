import { router } from "./trpc";
import { dealsRouter } from "./routers/deals";

export const appRouter = router({ deals: dealsRouter });

export type AppRouter = typeof appRouter;

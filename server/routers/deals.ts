import { z } from "zod";
import { router, procedure } from "../trpc";
import { db } from "@/lib/db";

export const dealsRouter = router({
  list: procedure
    .input(
      z.object({
        category: z.string().optional(),
        search:   z.string().optional(),
        limit:    z.number().min(1).max(100).default(48),
        cursor:   z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const { category, search, limit, cursor } = input;

      const deals = await db.deal.findMany({
        where: {
          isActive: true,
          ...(category ? { category } : {}),
          ...(search
            ? {
                OR: [
                  { title:       { contains: search, mode: "insensitive" } },
                  { description: { contains: search, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take:    limit + 1,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      });

      let nextCursor: string | undefined;
      if (deals.length > limit) {
        nextCursor = deals.pop()!.id;
      }

      return { deals, nextCursor };
    }),

  byId: procedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      return db.deal.findUnique({ where: { id: input.id } });
    }),

  categories: procedure.query(async () => {
    const rows = await db.deal.groupBy({
      by: ["category"],
      where: { isActive: true, category: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { category: "desc" } },
    });
    return rows.map((r) => ({ category: r.category!, count: r._count._all }));
  }),

  stats: procedure.query(async () => {
    const [total, active] = await Promise.all([
      db.deal.count(),
      db.deal.count({ where: { isActive: true } }),
    ]);
    return { total, active };
  }),
});

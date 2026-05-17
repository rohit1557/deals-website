import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function Page() {
  const rows = await db.$queryRaw<Array<{ date: string }>>`
    SELECT to_char(date, 'YYYY-MM-DD') AS date FROM reel_posts ORDER BY date DESC LIMIT 1
  `;
  if (!rows.length) redirect("/");
  redirect(`/reel/${rows[0].date}`);
}

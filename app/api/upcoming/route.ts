import { NextResponse } from "next/server";
import { getUpcomingGames } from "@/lib/providers/upcoming";

export const dynamic = "force-dynamic";

export async function GET() {
  const feed = await getUpcomingGames();
  return NextResponse.json(feed, {
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

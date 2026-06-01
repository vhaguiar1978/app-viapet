import { NextResponse } from "next/server";
import { getWorldCupGames } from "@/lib/providers/worldcup";

export const dynamic = "force-dynamic";

export async function GET() {
  const feed = await getWorldCupGames();
  return NextResponse.json(feed, {
    headers: { "Cache-Control": "no-store" }
  });
}

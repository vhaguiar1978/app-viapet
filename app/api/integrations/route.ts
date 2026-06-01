import { NextResponse } from "next/server";
import { getProviderDiagnostics } from "@/lib/providers/upcoming";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    diagnostics: getProviderDiagnostics()
  });
}

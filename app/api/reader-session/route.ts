import { NextResponse } from "next/server";
import { hasReaderSessionCookie, readerAuth } from "@/lib/reader-auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await hasReaderSessionCookie())) {
    return NextResponse.json(
      { signedIn: false },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { data: session } = await readerAuth.getSession();
  return NextResponse.json(
    { signedIn: Boolean(session?.user) },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/identity/safe-next-path";
import { createClient } from "@/lib/supabase/server";

// Target of the e-mailed link: trade the one-time code for a session cookie.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safeNextPath(searchParams.get("next")), request.url));
  }
  return NextResponse.redirect(new URL("/sign-in?error=link", request.url));
}

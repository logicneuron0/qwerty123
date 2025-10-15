import { NextResponse } from "next/server";
import { clearTokenCookie } from "@/lib/utils/auth-server";

export async function POST(request) {
  const origin = request.nextUrl.origin;
  const res = NextResponse.redirect(`${origin}`);
  clearTokenCookie(res);
  return res;
}
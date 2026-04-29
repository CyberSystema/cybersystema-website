import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionCookieName } from "@/lib/security/session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  (await cookies()).set(getSessionCookieName(), "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}

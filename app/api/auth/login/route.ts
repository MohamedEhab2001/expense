import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { passcode } = await req.json().catch(() => ({ passcode: "" }));

  const hash = process.env.APP_PASSCODE_HASH;
  if (!hash) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (typeof passcode !== "string" || !passcode) {
    return NextResponse.json({ error: "Passcode required" }, { status: 400 });
  }

  const valid = await bcrypt.compare(passcode, hash);
  if (!valid) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  const token = await signSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

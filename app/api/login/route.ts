import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    return NextResponse.json(
      { error: "Server chưa cấu hình APP_PASSWORD. Xem README.md." },
      { status: 500 }
    );
  }

  const { password: submitted } = await req.json().catch(() => ({ password: "" }));

  if (submitted !== password) {
    return NextResponse.json({ error: "Sai mật khẩu" }, { status: 401 });
  }

  const token = await createSessionToken(password);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 ngày
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE_NAME);
  return res;
}

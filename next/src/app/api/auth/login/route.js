import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { signToken, setTokenCookie } from "@/lib/utils/auth-server";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password)
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });

    await connectDB();
    const user = await User.findOne({ username });
    if (!user)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = signToken({ userId: user._id, username: user.username });
    
    const res = NextResponse.json({
      ok: true,
      user: { username: user.username, score: user.score, faction: user.faction },
    });

    setTokenCookie(res, token);
    return res;

  } catch (err) {
    console.error("❌ Login route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

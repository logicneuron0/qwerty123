import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import { getSession } from "@/lib/utils/auth-server";

export async function POST(req) {
  try {
    await connectDB();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { scoreToAdd=0, nextStage=null } = await req.json();
    const user = await User.findById(session.userId);

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    user.score += scoreToAdd;
    user.scoreUpdatedAt = Date.now();
    if (nextStage !== null) user.stage = nextStage;

    await user.save();

    return NextResponse.json({ ok: true, newScore: user.score, stage: user.stage });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/utils/auth-server";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";

export async function GET() {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ loggedIn: false }, { status: 401 });

  await connectDB();

  const user = await User.findById(session.userId).select("username score faction stage");
  
  if (!user)
    return NextResponse.json({ loggedIn: false }, { status: 401 });

  return NextResponse.json({ loggedIn: true, 
    user: {
      id: user._id,
      username: user.username,
      score: user.score,
      faction: user.faction,
      stage: user.stage,
    } });
}

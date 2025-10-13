import { NextResponse } from 'next/server';
import User from '@/lib/models/User';
import { connectDB } from '@/lib/db';
export async function GET() {
  try {
    await connectDB();

    // Get Individual Leaderboard (Top 10 players)
    const individualLeaderboard = await User.find()
      .select('username faction score')
      .sort({ score: -1 })
      .limit(10)
      .lean();

    // Get Faction Leaderboard
    const factionLeaderboard = await User.aggregate([
      {
        $group: {
          _id: '$faction',
          totalScore: { $sum: '$score' },
          memberCount: { $sum: 1 },
          averageScore: { $avg: '$score' }
        }
      },
      {
        $sort: { totalScore: -1 }
      }
    ]);

    return NextResponse.json({
      success: true,
      individualLeaderboard,
      factionLeaderboard
    });

  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch leaderboard data'
    }, { status: 500 });
  }
}
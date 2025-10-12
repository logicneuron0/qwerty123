import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/db";
import User from '@/lib/models/User';

export async function POST(request) {
  try {
    const { userId, score, gameType } = await request.json();

    if (!userId || score === undefined) {
      return NextResponse.json(
        { error: 'Missing userId or score' },
        { status: 400 }
      );
    }

    await connectDB();
    
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Add the score to existing score
    user.score += score;
    user.scoreUpdatedAt = new Date();
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Score updated successfully',
      newTotalScore: user.score,
      scoreAdded: score
    });

  } catch (error) {
    console.error('Error updating score:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
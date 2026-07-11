import { NextResponse } from 'next/server';
import { getStats, getRegisteredUsers, getAssessments } from '@/lib/db/database';

export async function GET() {
  try {
    const stats = getStats();
    const registeredUsers = getRegisteredUsers();
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        registeredUsers,
      },
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}

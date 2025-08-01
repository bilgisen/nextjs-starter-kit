import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const GET = async (request: Request) => {
  try {
    // This will verify the JWT token from the Authorization header
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return the user data from the JWT token
    return NextResponse.json({
      user: session.user,
      message: 'JWT verification successful!',
    });
  } catch (error) {
    console.error('JWT verification error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
};

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { cookies } from 'next/headers';
import { eq, and, gt } from 'drizzle-orm';
import { db } from "@/db/drizzle";
import { session, user } from "@/db/schema";
import { SignJWT } from 'jose';
import { getJwtSecretKey } from '@/lib/auth/jwt';

// JWT token expiration time (1 hour)
const JWT_EXPIRATION = '1h';

// Helper to create a JWT token
async function createJwtToken(payload: Record<string, any>) {
  const secretKey = getJwtSecretKey();
  const alg = 'HS256';
  
  return await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(secretKey);
}

// Define the JWT payload type
type JwtPayload = {
  sub: string;
  email: string;
  name?: string;
  role?: string;
  iat: number;
  exp: number;
};

export async function POST(request: Request) {
  console.log('JWT Token endpoint called');
  
  try {
    // Get the session token from cookies
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('better-auth.session_token')?.value;
    
    if (!sessionToken) {
      console.error('No session token found in cookies');
      return NextResponse.json(
        { error: "Unauthorized - No session token found" },
        { status: 401 }
      );
    }
    
    // Get the session from the database
    const sessionRecord = await db.query.session.findFirst({
      where: (s, { eq, and, gt }) => and(
        eq(s.token, sessionToken.split('.')[0]),
        gt(s.expiresAt, new Date())
      ),
      with: {
        user: true
      }
    });
    
    if (!sessionRecord || !sessionRecord.user) {
      console.error('No valid session found in database');
      return NextResponse.json(
        { error: "Unauthorized - Invalid session" },
        { status: 401 }
      );
    }
    
    // Check if session is expired
    const now = new Date();
    const expiresAt = new Date(sessionRecord.expiresAt);
    
    if (now > expiresAt) {
      console.error('Session has expired');
      return NextResponse.json(
        { error: "Unauthorized - Session expired" },
        { status: 401 }
      );
    }

    // Create JWT payload
    const payload = {
      sub: sessionRecord.user.id,
      email: sessionRecord.user.email || '',
      name: sessionRecord.user.name || undefined,
      role: sessionRecord.user.role || 'user',
      // Add any additional claims from the request body
      ...(await request.json()?.claims || {})
    };

    try {
      // Generate JWT token
      console.log('Generating JWT token...');
      const token = await createJwtToken(payload);
      
      if (!token) {
        throw new Error('Failed to generate JWT token');
      }

      console.log('JWT token generated successfully');
      return NextResponse.json({ 
        token,
        expiresIn: 3600, // 1 hour in seconds
        tokenType: 'Bearer'
      });
      
    } catch (error) {
      console.error('Error generating JWT token:', error);
      return NextResponse.json(
        { 
          error: "Failed to generate JWT token",
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error("Error in JWT token endpoint:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' && error instanceof Error 
          ? error.stack 
          : undefined
      },
      { status: 500 }
    );
  }
}

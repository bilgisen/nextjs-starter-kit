import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: Object.fromEntries(new Headers(request.headers).entries())
    });
    
    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Log the hook call for debugging
    console.log('🔵 [auth/hook/after] Received after hook call:', {
      url: request.url,
      method: request.method,
      body: body,
    });

    // Process the after hook
    const result = await auth.hooks.after({
      request,
      response: new Response(),
      user: body.user,
      session: body.session,
      event: body.event,
    });

    // Return the result
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ [auth/hook/after] Error in after hook:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

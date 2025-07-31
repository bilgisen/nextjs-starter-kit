import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Get the request body
    const body = await request.json();
    
    // Log the error for debugging
    console.error('🔴 [auth/hook/error] Auth error hook triggered:', {
      url: request.url,
      method: request.method,
      error: body.error,
      details: body.details,
    });

    // Process the error hook
    const result = await auth.hooks.error({
      request,
      response: new Response(),
      error: body.error,
      details: body.details,
    });

    // Return the result
    return NextResponse.json({ 
      success: true, 
      handled: result.handled,
      response: result.response 
    });
  } catch (error) {
    console.error('❌ [auth/hook/error] Error in error hook:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error processing error hook',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

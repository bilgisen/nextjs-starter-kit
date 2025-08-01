// app/api/books/[slug]/publish/epub/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/actions/auth/get-session';
import { verifyWorkflowToken } from '@/lib/jwt/workflow-token';
import { getBookBySlug } from '@/actions/books/get-book-by-slug';

// Main route handler
export async function POST(
  request: NextRequest,
  context: { params: { slug?: string } }
) {
  // 1. Slug kontrolü
  const slug = context.params.slug;
  if (!slug || typeof slug !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Invalid slug' },
      { status: 400 }
    );
  }

  // 2. Body parse ve validation
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON' },
      { status: 400 }
    );
  }

  // 3. JWT doğrulama
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
      { status: 401 }
    );
  }
  const token = authHeader.split(' ')[1];
  const jwtResult = await verifyWorkflowToken(token);
  if (!jwtResult.isValid || !jwtResult.payload) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // 4. Session kontrolü
  const session = await getSession(request);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 5. Kullanıcıya ait kitap kontrolü
  const book = await getBookBySlug(slug);
  if (!book || book.userId !== session.user.id) {
    return NextResponse.json(
      { success: false, error: 'Book not found or forbidden' },
      { status: 404 }
    );
  }

  // 6. Başarılı cevap
  return NextResponse.json({
    success: true,
    message: 'JWT and session verified, book found',
    book
  });
}

// GET endpoint to serve the payload.json file for GitHub Actions
export async function GET(
  request: NextRequest,
  context: { params: { slug?: string } }
) {
  try {
    const params = await context.params;
    const slug = params?.slug;
    
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid slug' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for a valid session using Better Auth
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No authorization token found');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the session using the working getSession function
    console.log('Validating session with getSession function (GET)...');
    let validatedSession: { user: { id: string } } | null = null;
    
    try {
      const session = await getSession(request);
      console.log('GET Session validation result:', session);
      
      if (!session?.user) {
        console.error('No valid session found (GET)');
        throw new Error('Invalid session');
      }
      
      // Store the session in a variable that's accessible in the outer scope
      validatedSession = session as { user: { id: string } };
    } catch (error) {
      console.error('Error validating session:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // This check is already done in the try-catch block above
    // The session is guaranteed to have a user at this point
    
    // Verify the user has access to this book
    const book = await getBookBySlug(slug);
    if (!book) {
      console.error('Book not found');
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    if (!validatedSession || book.userId !== validatedSession.user.id) {
      console.error('User does not have permission to publish this book');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // In a real implementation, this would fetch the actual payload
    const payload = {
      slug: params.slug,
      status: 'pending',
      timestamp: new Date().toISOString(),
      message: 'This is a test payload. In a real implementation, this would contain the EPUB generation status.'
    };
    
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${params.slug}-payload.json"`,
      },
    });
    
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

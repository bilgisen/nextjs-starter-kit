// app/api/books/[slug]/publish/epub/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/actions/auth/get-session';
import { verifyWorkflowToken } from '@/lib/jwt/workflow-token';
import { getBookBySlug } from '@/actions/books/get-book-by-slug';

export async function POST(
  request: NextRequest,
  context: { params: { slug?: string } }
) {
  try {
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
    let jwtResult;
    try {
      jwtResult = await verifyWorkflowToken(token);
    } catch {
      return NextResponse.json(
        { success: false, error: 'JWT verification failed' },
        { status: 401 }
      );
    }
    if (!jwtResult || !jwtResult.isValid || !jwtResult.payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // 4. Session kontrolü
    let session;
    try {
      session = await getSession(request);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Session error' },
        { status: 401 }
      );
    }
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 5. Kullanıcıya ait kitap kontrolü
    let book;
    try {
      book = await getBookBySlug(slug);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Book fetch error' },
        { status: 404 }
      );
    }
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
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to serve the payload.json file for GitHub Actions
export async function GET(
  request: NextRequest,
  context: { params: { slug?: string } }
) {
  try {
    const slug = context.params.slug;
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid slug' }, { status: 400 });
    }
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }
    let session;
    try {
      session = await getSession(request);
    } catch {
      return NextResponse.json({ success: false, error: 'Session error' }, { status: 401 });
    }
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    let book;
    try {
      book = await getBookBySlug(slug);
    } catch {
      return NextResponse.json({ success: false, error: 'Book fetch error' }, { status: 404 });
    }
    if (!book || book.userId !== session.user.id) {
      return NextResponse.json({ success: false, error: 'Book not found or forbidden' }, { status: 404 });
    }
    // EPUB options - bunları frontend veya db'den almak gerekebilir, örnek olarak defaultlar verildi
    const options = {
      generate_toc: true,
      toc_depth: 3,
      cover: true,
      // diğer seçenekler...
    };
    const payload = {
      book: {
        title: book.title,
        author: book.author,
        chapters: book.chapters, // [{ order, url, ... }]
        cover_url: book.coverImageUrl || book.cover_image_url || null,
        stylesheet_url: book.stylesheet_url || null,
        imprint: book.imprint || null,
        language: book.language || 'en',
        // diğer alanlar...
      },
      options,
      status: 'pending',
      timestamp: new Date().toISOString(),
      message: 'Payload ready for EPUB generation.'
    };
    return NextResponse.json(payload, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

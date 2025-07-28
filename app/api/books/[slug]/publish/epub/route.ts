// app/api/books/[slug]/publish/epub/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/actions/auth/get-session';
import { z } from 'zod';
import { getBookBySlug } from '@/actions/books/get-book-by-slug';
import { isGitHubActionRequest, validateGitHubActionRequest } from '@/lib/github-actions';
import { triggerGitHubWorkflow } from '@/lib/github-workflow';

// Enhanced logging helper
async function logRequestInfo(request: NextRequest, slug: string) {
  console.log('=== EPUB Publish API Request ===');
  console.log('URL:', request.url);
  console.log('Method:', request.method);
  
  // Safely log slug
  console.log('Slug:', slug);
  
  // Log headers (safely)
  console.log('Headers:');
  const headers = request.headers;
  headers.forEach((value, key) => {
    // Redact sensitive headers
    const redactedValue = ['authorization', 'cookie'].includes(key.toLowerCase()) 
      ? '[REDACTED]' 
      : value;
    console.log(`  ${key}: ${redactedValue}`);
  });
  
  console.log('=======================');
}

// Helper to generate the public URL for the payload
function getPayloadUrl(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/books/${slug}/publish/epub/payload`;
}

// Main route handler
// Validation schema
const epubOptionsSchema = z.object({
  generate_toc: z.boolean().default(true),
  include_imprint: z.boolean().default(true),
  toc_depth: z.number().int().min(1).max(6).default(3),
  output_format: z.literal('epub'),
  embed_metadata: z.boolean().default(true),
  cover: z.boolean().default(true),
  theme: z.string().default('default'),
  metadata: z.object({
    title: z.string(),
    author: z.string(),
    language: z.string()
  }).optional()
});

export async function POST(
  request: NextRequest,
  context: { params: { slug: string } }
) {
  try {
    const { slug } = context.params;
    
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid slug' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Log request info
    await logRequestInfo(request, slug);
    
    // Parse and validate request body
    let body;
    try {
      body = await request.json();
      
      // Validate request body against schema
      const validation = epubOptionsSchema.safeParse(body.options);
      if (!validation.success) {
        console.error('Request validation failed:', validation.error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid request data',
            details: validation.error.format()
          },
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if this is a GitHub Action request
    const isGitHubAction = await isGitHubActionRequest();
    
    try {
      // For GitHub Actions, validate the request
      if (isGitHubAction) {
        const isValid = await validateGitHubActionRequest(request);
        if (!isValid) {
          console.error('Invalid GitHub Action request');
          return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else {
        // For regular requests, check for a valid session using Better Auth
        const session = await getSession();
        if (!session?.user) {
          console.error('No valid session found');
          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        // Verify the user has access to this book
        const book = await getBookBySlug(slug);
        if (!book) {
          console.error('Book not found');
          return NextResponse.json(
            { success: false, error: 'Book not found' },
            { status: 404, headers: { 'Content-Type': 'application/json' } }
          );
        }
        
        if (book.userId !== session.user.id) {
          console.error('User does not have permission to publish this book');
          return NextResponse.json(
            { success: false, error: 'Unauthorized' },
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (error) {
      console.error('Error during authentication:', error);
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Log successful GitHub Action request if applicable
    if (isGitHubAction) {
      const book = await getBookBySlug(slug);
      if (book) {
        console.log('GitHub Action request for book:', { bookId: book.id, slug });
      } else {
        console.log('GitHub Action request for unknown book:', slug);
      }
    }
    
    // If we get here, the request is valid and authorized
    console.log('Request validated and authorized');
    
    // For GitHub Actions, trigger the workflow
    if (isGitHubAction) {
      try {
        console.log('Triggering GitHub Workflow for book:', slug);
        const workflowResponse = await triggerGitHubWorkflow(slug);
        console.log('GitHub Workflow triggered:', workflowResponse);
        
        return NextResponse.json(
          { 
            success: true, 
            message: 'GitHub Workflow triggered',
            workflowId: workflowResponse.id,
            statusUrl: workflowResponse.html_url,
            payloadUrl: getPayloadUrl(slug)
          },
          { status: 202, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error triggering GitHub Workflow:', error);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to trigger GitHub Workflow',
            message: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // For regular users, handle the request directly
    // TODO: Implement actual EPUB generation logic here
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'EPUB generation started',
        payloadUrl: getPayloadUrl(slug)
      },
      { status: 202, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error in EPUB generation endpoint:', error);
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

// GET endpoint to serve the payload.json file for GitHub Actions
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    console.log('GET request received for slug:', params.slug);
    
    if (!params.slug) {
      return NextResponse.json(
        { success: false, error: 'Book slug is required' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
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

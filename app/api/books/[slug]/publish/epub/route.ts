import { NextResponse } from 'next/server';
import { z } from 'zod';
// withApiAuth import removed as it's not being used
import { getChaptersByBook } from '@/actions/books/get-chapters-by-book';
import { getBookBySlug } from '@/actions/books/get-book-by-slug';
import { buildBasePayload } from '@/lib/publish/buildPayload';

const epubGenerationSchema = z.object({
  options: z.object({
    generate_toc: z.boolean().default(true),
    include_imprint: z.boolean().default(true),
    toc_depth: z.number().int().min(1).max(6).optional(),
    output_format: z.literal('epub'),
    embed_metadata: z.boolean().default(true),
    cover: z.boolean().default(true),
  }),
});

async function handleEpubGeneration(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const book = await getBookBySlug(slug);
    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = epubGenerationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { options } = validation.data;

    try {
      // Fetch chapters to ensure they exist, but we don't need the result here
      // as buildBasePayload will fetch them again with the correct structure
      await getChaptersByBook(book.id);
      const basePayload = await buildBasePayload(slug);

      const payload = {
        ...basePayload,
        options: {
          ...options,
          output_format: 'epub',
          cover: options.cover && !!(book.cover_image_url || book.coverImageUrl),
        },
      };

      if (!options.generate_toc && 'toc_depth' in payload.options) {
        delete payload.options.toc_depth;
      }

      return NextResponse.json({
        success: true,
        data: payload,
        timestamp: new Date().toISOString(),
      });
    } catch {
      console.error('Error generating payload:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to generate payload',
          message: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in EPUB generation:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate EPUB',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

// Helper to generate the public URL for the payload
function getPayloadUrl(slug: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/books/${slug}/payload.json`;
}

// 🔐 Route entrypoint: handles both user and GitHub Actions requests
export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const authHeader = request.headers.get('authorization');
  const isGitHubAction = authHeader === `Bearer ${process.env.NEXT_EPUB_SECRET}`;
  const { slug } = params;

  // For GitHub Actions, return the public URL where the payload can be downloaded
  if (isGitHubAction) {
    const payload = await handleEpubGeneration(request, { params });
    const json = await payload.json();
    
    if (json.success) {
      return NextResponse.json({
        success: true,
        payload_url: getPayloadUrl(params.slug),
        timestamp: new Date().toISOString()
      });
    }
    return payload; // Return error response if generation failed
  }

  // For regular API users, trigger GitHub Actions workflow
  try {
    const GITHUB_TOKEN = process.env.GITHUB_PAT;
    const REPO = process.env.GITHUB_REPO;
    const WORKFLOW = process.env.GITHUB_WORKFLOW;

    if (!GITHUB_TOKEN || !REPO || !WORKFLOW) {
      return NextResponse.json(
        { success: false, error: 'GitHub configuration is missing' },
        { status: 500 }
      );
    }

    // Get the payload from the request
    let payload;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Trigger GitHub Actions workflow
    const url = `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          slug,
          payload: JSON.stringify(payload),
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('GitHub Actions trigger failed:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to trigger GitHub Actions',
          details: error 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ePub generation started',
      workflow_dispatch: {
        status: 'queued',
        repo: REPO,
        workflow: WORKFLOW,
        slug,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error triggering GitHub Actions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to trigger build process',
        message: errorMessage 
      },
      { status: 500 }
    );
  }
}

// New GET endpoint to serve the payload.json file
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const authHeader = request.headers.get('authorization');
  const isGitHubAction = authHeader === `Bearer ${process.env.NEXT_EPUB_SECRET}`;

  if (!isGitHubAction) {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const response = await handleEpubGeneration(request, { params });
    const json = await response.json();
    
    if (!json.success) {
      return NextResponse.json(
        { error: json.error || 'Failed to generate payload' },
        { status: 500 }
      );
    }

    // Set headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Content-Disposition', `attachment; filename="${params.slug}-payload.json"`);
    
    return new NextResponse(JSON.stringify(json.data, null, 2), {
      headers,
    });
  } catch (error) {
    console.error('Error serving payload.json:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

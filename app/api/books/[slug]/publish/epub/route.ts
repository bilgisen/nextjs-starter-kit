import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/actions/auth/get-session';
import { getBookBySlug } from '@/actions/books/get-book-by-slug';
import { generateEpub } from '@/actions/books/publish/epub-actions/generateEpub';
import { headers } from 'next/headers';
// Helper to get the base URL
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = headers().get('host');
  return `${protocol}://${host}`;
}

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

type WorkflowDispatchResponse = {
  id: string;
  workflow_id: number;
  node_id: string;
  url: string;
  html_url: string;
  status: string;
  created_at: string;
  updated_at: string;
};

async function triggerGitHubWorkflow(
  bookSlug: string,
  options: z.infer<typeof epubGenerationSchema>['options']
): Promise<WorkflowDispatchResponse> {
  const GITHUB_TOKEN = process.env.GITHUB_PAT;
  const REPO = process.env.GITHUB_REPO;
  const WORKFLOW = process.env.GITHUB_WORKFLOW || 'build-epub.yaml';
  const baseUrl = getBaseUrl();
  const payloadUrl = `${baseUrl}/api/books/${bookSlug}/publish/epub/payload`;

  if (!GITHUB_TOKEN || !REPO) {
    throw new Error('GitHub integration is not properly configured');
  }

  // Trigger the workflow
  const response = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
    {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main', // or your default branch
        inputs: {
          book_slug: bookSlug,
          payload_url: payloadUrl,
          token: process.env.NEXT_EPUB_SECRET,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }

  // Get the workflow run details
  const workflowRuns = await fetch(
    `https://api.github.com/repos/${REPO}/actions/runs?event=workflow_dispatch&status=queued&per_page=1`,
    {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    }
  ).then(res => res.json());

  if (!workflowRuns.workflow_runs?.length) {
    throw new Error('Failed to retrieve workflow run details');
  }

  return workflowRuns.workflow_runs[0];
}

async function handleEpubGeneration(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { slug } = params;
    const book = await getBookBySlug(slug);
    
    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      );
    }

    // Verify the book belongs to the current user
    if (book.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
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
      // Generate the EPUB using our action
      const result = await generateEpub(slug, options);
      
      // If we're in development or testing, return the result directly
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({
          success: true,
          message: 'EPUB generated successfully',
          data: result,
        });
      }

      // In production, trigger GitHub Actions workflow
      const workflow = await triggerGitHubWorkflow(slug, options);
      
      return NextResponse.json({
        success: true,
        message: 'EPUB generation started',
        workflow_dispatch: {
          id: workflow.id,
          workflow: `build-epub.yaml`,
          status: workflow.status,
          created_at: workflow.created_at,
          html_url: workflow.html_url,
          check_run_url: `${workflow.html_url}/check`,
        },
      });
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
  } catch (error) {
    console.error('Error in handleEpubGeneration:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
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

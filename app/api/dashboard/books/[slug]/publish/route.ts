import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSession } from '@/actions/auth/get-session';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per minute
});

// Disable caching for this route
export const dynamic = 'force-dynamic';

// Validate book slug format
const isValidSlug = (slug: string): boolean => {
  return /^[a-z0-9-]+$/.test(slug);
};

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 10);
  const ip = headers().get('x-forwarded-for') || 'unknown';
  
  try {
    // Rate limiting
    const identifier = ip;
    await limiter.check(10, identifier); // 10 requests per minute
    // Log request
    logger.info(`[${requestId}] [${ip}] Starting request for book: ${params.slug}`, {
      slug: params.slug,
      url: request.url,
      method: request.method,
    });

    // Rate limiting
    await limiter.check(10, ip);
    
    // Validate slug format
    if (!isValidSlug(params.slug)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid book slug format' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Get and validate session
    const session = await getSession(request);
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Please sign in' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const filename = searchParams.get('filename') || `${params.slug}.${format}`;

    // Validate format
    if (!format) {
      logger.warn(`[${requestId}] [${ip}] Missing format parameter`, { slug: params.slug });
      return new NextResponse(JSON.stringify({ error: 'Format parameter is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const validFormats = ['pdf', 'epub', 'mobi', 'docx', 'html'];
    if (!validFormats.includes(format)) {
      logger.warn(`[${requestId}] [${ip}] Invalid format requested`, { 
        slug: params.slug, 
        format 
      });
      return new NextResponse(JSON.stringify({ 
        error: `Invalid format. Must be one of: ${validFormats.join(', ')}` 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Construct the file path
    const tempDir = path.join(process.cwd(), 'tmp');
    const filePath = path.join(tempDir, `${params.slug}.${format}`);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return new NextResponse(
        JSON.stringify({ error: 'File not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Read the file
      const fileBuffer = await fs.readFile(filePath);
      
      // Get file stats for content length and last modified
      const stats = await fs.stat(filePath);
      
      // Set up response headers
      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', getMimeType(format));
      responseHeaders.set('Content-Length', stats.size.toString());
      responseHeaders.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename || `${params.slug}.${format}`)}"`);
      responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      responseHeaders.set('Pragma', 'no-cache');
      responseHeaders.set('X-Request-Id', requestId);
      
      // Log successful response
      logger.info(`[${requestId}] [${ip}] File served successfully`, {
        slug: params.slug,
        format,
        fileSize: stats.size,
        duration: Date.now() - startTime,
      });
      
      // Return the file
      const response = new NextResponse(fileBuffer, {
        status: 200,
        headers: responseHeaders,
      });
      
      // Schedule file deletion after a short delay (5 seconds)
      setTimeout(async () => {
        try {
          await fs.unlink(filePath);
          console.log(`Temporary file deleted: ${filePath}`);
        } catch (err) {
          console.error(`Error deleting temporary file ${filePath}:`, err);
        }
      }, 5000);
      
      return response;
      
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${requestId}] Error in publish route:`, errorMessage);
    
    // Handle rate limiting specifically
    if (errorMessage.includes('rate limit')) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests, please try again later',
          retryAfter: 60 // 1 minute
        }), 
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }
    
    // Handle other errors
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        requestId,
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  }
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'epub': 'application/epub+zip',
    'mobi': 'application/x-mobipocket-ebook',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'html': 'text/html',
    'txt': 'text/plain',
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}

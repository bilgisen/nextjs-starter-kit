import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getAuthUser } from '@/lib/with-auth';

// Disable caching for this route
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Verify authentication
    const user = await getAuthUser();
    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const filename = searchParams.get('filename') || `${params.slug}.${format}`;

    if (!format) {
      return new NextResponse('Format parameter is required', { status: 400 });
    }

    // Validate format
    const validFormats = ['pdf', 'epub', 'mobi', 'docx', 'html'];
    if (!validFormats.includes(format)) {
      return new NextResponse('Invalid format', { status: 400 });
    }

    // Construct the file path
    const tempDir = path.join(process.cwd(), 'tmp');
    const filePath = path.join(tempDir, `${params.slug}.${format}`);

    try {
      // Check if file exists
      await fs.access(filePath);
      
      // Read the file
      const fileBuffer = await fs.readFile(filePath);
      
      // Get file stats for content length
      const stats = await fs.stat(filePath);
      
      // Set up response headers
      const headers = new Headers();
      headers.set('Content-Type', getMimeType(format));
      headers.set('Content-Length', stats.size.toString());
      headers.set('Content-Disposition', `attachment; filename="${filename}"`);
      headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      
      // Schedule file deletion after a short delay (5 seconds)
      setTimeout(async () => {
        try {
          await fs.unlink(filePath);
          console.log(`Temporary file deleted: ${filePath}`);
        } catch (err) {
          console.error(`Error deleting temporary file ${filePath}:`, err);
        }
      }, 5000);
      
      // Return the file
      return new NextResponse(fileBuffer, {
        status: 200,
        headers,
      });
      
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return new NextResponse('File not found', { status: 404 });
      }
      console.error('Error reading file:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Error in publish download route:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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

// app/api/books/[slug]/publish/epub/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getBookBySlug } from '@/actions/books/get-book-by-slug';
import { isGitHubActionRequest, validateGitHubActionRequest } from '@/lib/github-actions';
import { triggerGitHubWorkflow } from '@/lib/github-workflow';
import { getSession } from '@/actions/auth/get-session';

// Enhanced logging helper
async function logRequestInfo(request: NextRequest, slug: string) {
  console.log('\n📄 === EPUB Publish API Request ===');
  console.log('🌐 URL:', request.url);
  console.log('🔧 Method:', request.method);
  
  // Safely log slug
  console.log('📖 Slug:', slug);
  
  // Log headers (safely)
  console.log('📋 Headers:');
  const headers = request.headers;
  headers.forEach((value, key) => {
    // Always log header names, but redact sensitive values
    const isSensitive = ['authorization', 'cookie', 'set-cookie'].includes(key.toLowerCase());
    const displayValue = isSensitive ? '[REDACTED]' : value;
    const hasAuthHeader = key.toLowerCase() === 'authorization';
    
    console.log(`  ${key}: ${displayValue}`);
    
    // Log additional debug info for auth header
    if (hasAuthHeader) {
      console.log('  🔍 Auth header detected');
      if (value) {
        const isBearer = value.toLowerCase().startsWith('bearer ');
        console.log(`  🔑 Bearer token present: ${isBearer}`);
        console.log(`  📏 Token length: ${value.length} characters`);
      }
    }
  });
  
  console.log('\n🔍 Request details:');
  console.log(`  - URL: ${request.url}`);
  console.log(`  - Method: ${request.method}`);
  console.log(`  - Cache: ${request.cache}`);
  console.log(`  - Credentials: ${request.credentials}`);
  console.log(`  - Mode: ${request.mode}`);
  
  console.log('=======================\n');
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
        console.log('🤖 GitHub Action request detected');
        const isValid = await validateGitHubActionRequest(request);
        if (!isValid) {
          console.error('❌ Invalid GitHub Action request');
          return NextResponse.json(
            { 
              success: false, 
              error: 'Unauthorized',
              message: 'Invalid GitHub Action request',
              requiresAuth: true
            },
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } else {
        console.log('👤 Regular API request - validating session');
        
        // Check for Authorization header
        const authHeader = request.headers.get('authorization');
        console.log('🔍 Authorization header present:', !!authHeader);
        
        if (!authHeader) {
          console.error('❌ No Authorization header found');
          return NextResponse.json(
            { 
              success: false, 
              error: 'Authentication required',
              message: 'No authorization token provided',
              requiresAuth: true
            },
            { 
              status: 401, 
              headers: { 
                'Content-Type': 'application/json',
                'WWW-Authenticate': 'Bearer realm="epub_generation", error="missing_token"'
              } 
            }
          );
        }
        
        // Validate Bearer token format
        if (!authHeader.startsWith('Bearer ')) {
          console.error('❌ Invalid Authorization header format. Expected: Bearer <token>');
          return NextResponse.json(
            { 
              success: false, 
              error: 'Invalid token format',
              message: 'Authorization header must start with Bearer',
              requiresAuth: true
            },
            { 
              status: 401, 
              headers: { 
                'Content-Type': 'application/json',
                'WWW-Authenticate': 'Bearer realm="epub_generation", error="invalid_token"'
              } 
            }
          );
        }
        
        // Get the session using the working getSession function
        console.log('🔐 Validating session with getSession function...');
        let validatedSession: { user: { id: string } } | null = null;
        
        try {
          // Log the authorization header for debugging
          const authHeader = request.headers.get('authorization');
          const token = authHeader?.replace(/^Bearer\s+/i, '');
          
          console.log('🔍 Auth details:', {
            hasAuthHeader: !!authHeader,
            hasBearerPrefix: authHeader ? authHeader.toLowerCase().startsWith('bearer ') : false,
            tokenLength: token?.length || 0,
            tokenPrefix: token ? `${token.substring(0, 5)}...` : 'N/A',
            hasDot: token ? token.includes('.') : false
          });
          
          // Create a timestamp for tracking session validation duration
          const validationStart = Date.now();
          
          // Create a new Request with the necessary headers
          const headers = new Headers();
          
          // Copy all headers from the original request
          request.headers.forEach((value, key) => {
            headers.set(key, value);
          });
          
          // If we have a Bearer token, ensure it's properly formatted for the auth API
          if (token) {
            // Log the token prefix for debugging (without exposing the full token)
            console.log('🔑 Token details:', {
              tokenPrefix: token.substring(0, 5) + '...',
              tokenLength: token.length,
              hasDot: token.includes('.')
            });
            
            // Set the Authorization header with the Bearer token
            headers.set('authorization', `Bearer ${token}`);
          }
          
          // Create a new request with the updated headers
          const authRequest = new Request(request.url, {
            method: request.method,
            headers: headers,
            body: request.body,
            // @ts-ignore - TypeScript doesn't know about these properties
            duplex: 'half',
            // @ts-ignore
            signal: request.signal,
            // @ts-ignore
            credentials: request.credentials,
            // @ts-ignore
            cache: request.cache,
            // @ts-ignore
            redirect: request.redirect,
            // @ts-ignore
            referrer: request.referrer,
            // @ts-ignore
            referrerPolicy: request.referrerPolicy,
            // @ts-ignore
            integrity: request.integrity,
            // @ts-ignore
            keepalive: request.keepalive,
            // @ts-ignore
            mode: request.mode,
          });
          
          // Get the session with the properly formatted request
          validatedSession = await getSession(authRequest);
          
          const validationDuration = Date.now() - validationStart;
          const sessionResult = { 
            hasSession: !!validatedSession, 
            hasUser: !!(validatedSession?.user),
            userId: validatedSession?.user?.id || 'N/A',
            duration: `${validationDuration}ms`
          };
          
          console.log('✅ Session validation result:', sessionResult);
          
          if (!validatedSession?.user) {
            console.error('❌ No valid session found - user not authenticated');
            
            // If we have an auth header but still no session, log more details
            if (authHeader) {
              console.warn('⚠️ Auth header exists but session validation still failed. Possible issues:');
              console.warn('   - Token might be expired');
              console.warn('   - Token might be malformed');
              console.warn('   - Token might not match any valid session');
              console.warn('   - Server might not be properly configured for Bearer auth');
              
              // Log token details (redacted)
              const token = authHeader.replace(/^Bearer\s+/i, '');
              console.log('🔑 Token details (redacted):', {
                tokenType: 'Bearer',
                tokenLength: token.length,
                tokenPrefix: `${token.substring(0, 5)}...`,
                hasDot: token.includes('.')
              });
            }
            
            return NextResponse.json(
              { 
                success: false, 
                error: 'Authentication required',
                message: 'No valid session found',
                requiresAuth: true
              },
              { 
                status: 401, 
                headers: { 
                  'Content-Type': 'application/json',
                  'WWW-Authenticate': 'Bearer realm="epub_generation", error="invalid_token"'
                } 
              }
            );
          }
          
          // Store the session in a variable that's accessible in the outer scope
          validatedSession = session as { user: { id: string } };
          
          console.log('✅ Session validation successful:', {
            userId: validatedSession.user.id,
            sessionKeys: Object.keys(session).filter(k => k !== 'user'),
            userKeys: Object.keys(validatedSession.user)
          });
          
        } catch (error) {
          // Enhanced error logging
          console.error('❌ Error during session validation:', {
            error: error instanceof Error ? {
              name: error.name,
              message: error.message,
              stack: error.stack?.split('\n').slice(0, 3).join('\n') + '...'
            } : 'Unknown error',
            request: {
              method: request.method,
              url: request.url,
              headers: Object.fromEntries(
                Array.from(request.headers.entries())
                  .filter(([key]) => !['authorization', 'cookie'].includes(key.toLowerCase()))
              )
            }
          });
          
          // Determine error type
          const errorMessage = error instanceof Error ? error.message : 'Unknown error during session validation';
          const isAuthError = errorMessage.toLowerCase().includes('auth') || 
                            errorMessage.toLowerCase().includes('token') ||
                            errorMessage.toLowerCase().includes('session');
          
          return NextResponse.json(
            { 
              success: false, 
              error: isAuthError ? 'Authentication failed' : 'Internal server error',
              message: isAuthError ? 'Invalid or expired session' : 'An error occurred while validating your session',
              details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
              requiresAuth: true
            },
            { 
              status: isAuthError ? 401 : 500, 
              headers: { 
                'Content-Type': 'application/json',
                ...(isAuthError ? { 'WWW-Authenticate': 'Bearer realm="epub_generation", error="invalid_token"' } : {})
              } 
            }
          );
        }
        
        // Verify the user has access to this book
        console.log('📚 Fetching book with slug:', slug);
        const book = await getBookBySlug(slug);
        
        if (!book) {
          console.error('❌ Book not found with slug:', slug);
          return NextResponse.json(
            { 
              success: false, 
              error: 'Book not found',
              message: `No book found with the slug: ${slug}`
            },
            { 
              status: 404, 
              headers: { 
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
        
        console.log('🔍 Book found:', {
          bookId: book.id,
          bookTitle: book.title,
          ownerId: book.userId,
          requestingUserId: validatedSession?.user?.id
        });
        
        if (!validatedSession || book.userId !== validatedSession.user.id) {
          console.error('❌ Permission denied:', {
            reason: 'User does not own this book',
            bookOwnerId: book.userId,
            requestingUserId: validatedSession?.user?.id
          });
          
          return NextResponse.json(
            { 
              success: false, 
              error: 'Permission denied',
              message: 'You do not have permission to publish this book',
              requiresAuth: true
            },
            { 
              status: 403, 
              headers: { 
                'Content-Type': 'application/json' 
              } 
            }
          );
        }
      }
    } catch (error) {
      console.error('❌ Error during authentication:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') + '...' : undefined
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Authentication failed',
          message: 'Failed to authenticate the request',
          requiresAuth: true
        },
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            'WWW-Authenticate': 'Bearer realm="epub_generation", error="authentication_failed"'
          } 
        }
      );
    }
    
    // Log successful GitHub Action request if applicable
    if (isGitHubAction) {
      console.log('🤖 GitHub Action request for book:', { 
        slug,
        options: body.options
      });
    }
    
    try {
      // Generate payload URL
      const payloadUrl = getPayloadUrl(slug);
      console.log('🔗 Generated payload URL:', {
        url: payloadUrl,
        baseUrl: process.env.NEXT_PUBLIC_APP_URL,
        slug
      });
      
      // Trigger GitHub Actions workflow
      console.log('🚀 Triggering GitHub Actions workflow...');
      
      try {
        const workflowResult = await triggerGitHubWorkflow(slug);
        
        console.log('✅ GitHub Actions workflow triggered successfully:', {
          workflowRunId: workflowResult.id,
          statusUrl: workflowResult.html_url,
          status: workflowResult.status
        });
        
        return NextResponse.json({
          success: true,
          message: 'EPUB generation started',
          workflowRunId: workflowResult.id,
          statusUrl: workflowResult.html_url,
          status: workflowResult.status,
          timestamp: new Date().toISOString()
        }, {
          status: 202, // Accepted
          headers: { 
            'Content-Type': 'application/json',
            'X-Workflow-Run-Id': workflowResult.id.toString(),
            'X-Workflow-Status-Url': workflowResult.html_url
          }
        });
        
      } catch (error) {
        console.error('❌ Failed to trigger GitHub Actions workflow:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          slug,
          payloadUrl
        });
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to start EPUB generation',
            message: 'Could not initiate the EPUB generation process',
            details: process.env.NODE_ENV === 'development' 
              ? error instanceof Error ? error.message : String(error)
              : undefined
          },
          { 
            status: 500, 
            headers: { 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
    } catch (error) {
      console.error('❌ Unexpected error during EPUB generation:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') + '...' : undefined
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Internal server error',
          message: 'An unexpected error occurred while starting EPUB generation',
          details: process.env.NODE_ENV === 'development' 
            ? error instanceof Error ? error.message : String(error)
            : undefined
        },
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
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

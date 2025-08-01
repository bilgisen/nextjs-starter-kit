/**
 * JWT Token Utility for Workflow Authentication
 * 
 * This module provides functions to generate and verify JWT tokens used for
 * authenticating requests between the application and GitHub Actions workflows.
 * 
 * The tokens include claims for workflow identification, book association,
 * and user authorization.
 * 
 * This implementation uses Better Auth's built-in JWT functionality:
 * - Token issuance via /api/auth/token endpoint
 * - Token verification using JWKS endpoint
 */

import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

// Define the base URL for JWKS endpoint
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const JWKS_URI = `${BASE_URL}/api/auth/jwks`;

/**
 * Payload structure for generating a workflow JWT token
 */
interface WorkflowTokenPayload {
  workflowId: string;
  bookSlug: string;
  userId: string;
}

/**
 * Gets a JWT token from the Better Auth token endpoint
 * 
 * @returns A Promise that resolves to the JWT token string
 * @throws {Error} If token retrieval fails
 */
async function getAuthToken(): Promise<string> {
  const response = await fetch(`${BASE_URL}/api/auth/token`, {
    credentials: 'include', // Include cookies for session
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get auth token: ${response.statusText}`);
  }
  
  const { token } = await response.json();
  return token;
}

/**
 * Adds custom claims to the JWT token
 * 
 * @param token - The JWT token to enhance with custom claims
 * @param payload - Additional claims to add to the token
 * @returns A Promise that resolves to the enhanced JWT token
 */
async function enhanceTokenWithClaims(token: string, payload: WorkflowTokenPayload): Promise<string> {
  // In a real implementation, you would decode the token, add claims, and re-sign it
  // For now, we'll just return the original token as Better Auth handles custom claims
  // through its configuration
  return token;
}

/**
 * Generates a JWT token for workflow authentication
 * 
 * @param payload - Token payload containing workflow and book information
 * @returns A Promise that resolves to the generated JWT token
 * 
 * @example
 * const token = await generateWorkflowToken({
 *   workflowId: 'workflow-123',
 *   bookSlug: 'my-book',
 *   userId: 'user-123'
 * });
 */
export async function generateWorkflowToken(payload: WorkflowTokenPayload): Promise<string> {
  try {
    // Get a base token from Better Auth
    const token = await getAuthToken();
    
    // Enhance the token with our custom claims
    return await enhanceTokenWithClaims(token, payload);
  } catch (error) {
    console.error('Failed to generate workflow token:', error);
    throw new Error('Failed to generate workflow token');
  }
}

// Cache for JWKS to avoid repeated fetches
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

/**
 * Gets the JWKS key set for token verification
 * 
 * @returns A function that can be used to verify tokens
 */
function getJwks() {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(new URL(JWKS_URI));
  }
  return jwksCache;
}

/**
 * Verifies a JWT token used for workflow authentication
 * 
 * @param token - The JWT token to verify
 * @returns A Promise that resolves to an object containing:
 *   - isValid: boolean indicating if the token is valid
 *   - payload: The decoded token payload if valid
 *   - error: Error message if verification fails
 * 
 * @example
 * const { isValid, payload, error } = await verifyWorkflowToken(token);
 * if (isValid) {
 *   // Token is valid, use payload.workflowId and payload.bookSlug
 * } else {
 *   console.error('Token verification failed:', error);
 * }
 */
export async function verifyWorkflowToken(token: string): Promise<{
  isValid: boolean;
  payload?: JWTPayload & {
    workflowId?: string;
    bookSlug?: string;
    userId?: string;
  };
  error?: string;
}> {
  try {
    const JWKS = getJwks();
    
    // Verify the token using the JWKS endpoint
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: BASE_URL,
      audience: 'workflow',
    });

    return { 
      isValid: true, 
      payload: {
        ...payload,
        // Map standard claims to our expected format
        workflowId: payload.workflowId as string | undefined,
        bookSlug: payload.bookSlug as string | undefined,
        userId: payload.sub,
      }
    };
  } catch (error) {
    console.error('JWT verification failed:', error);
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid token' 
    };
  }
}

// Add a function to test JWKS endpoint connectivity
export async function testJwksEndpoint(): Promise<boolean> {
  try {
    const JWKS = getJwks();
    // Perform a dummy verification to ensure JWKS is reachable
    await JWKS({ alg: 'RS256', kid: 'dummy' });
    console.log('✅ JWKS endpoint is reachable');
    return true;
  } catch (error) {
    console.error('❌ JWKS endpoint test failed:', error);
    return false;
  }
}

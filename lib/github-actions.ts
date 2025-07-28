'server';

import { headers } from 'next/headers';
import { webcrypto } from 'crypto';

/**
 * Checks if the current request is from a GitHub Action
 */
export async function isGitHubActionRequest(): Promise<boolean> {
  try {
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    return userAgent.includes('GitHub-Hookshot');
  } catch (error) {
    console.error('Error checking GitHub Action request:', error);
    return false;
  }
}

/**
 * Validates the GitHub Action request using a shared secret
 */
export async function validateGitHubActionRequest(request: Request): Promise<boolean> {
  try {
    // Get the token from the Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header');
      return false;
    }

    const token = authHeader.split(' ')[1];
    const expectedToken = process.env.GITHUB_ACTIONS_TOKEN;
    
    if (!expectedToken) {
      console.error('GITHUB_ACTIONS_TOKEN is not configured');
      return false;
    }
    
    // Compare tokens in constant time to prevent timing attacks
    
    // Convert strings to buffers for comparison
    const tokenBuffer = Buffer.from(token);
    const expectedBuffer = Buffer.from(expectedToken);
    
    // Buffers must be the same length for timingSafeEqual
    if (tokenBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    // Use Node.js built-in timingSafeEqual
    return webcrypto.timingSafeEqual(tokenBuffer, expectedBuffer);
  } catch (error) {
    console.error('Error validating GitHub Action request:', error);
    return false;
  }
}

/**
 * Middleware for GitHub Actions authentication
 */
export async function withGitHubAction<T>(
  request: Request,
  handler: () => Promise<T>
): Promise<T> {
  if (!isGitHubActionRequest()) {
    throw new Error('Not a GitHub Action request');
  }

  if (!validateGitHubActionRequest(request)) {
    throw new Error('Invalid GitHub Action token');
  }

  return handler();
}

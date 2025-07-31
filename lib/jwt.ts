// lib/jwt.ts
import { jwtVerify, createRemoteJWKSet } from 'jose';

const JWKS_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/jwks`;

/**
 * Validates a JWT token using the JWKS endpoint
 * @param token The JWT token to validate
 * @returns The decoded token payload if valid
 */
export async function validateToken(token: string) {
  try {
    const JWKS = createRemoteJWKSet(new URL(JWKS_URL));
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.NEXT_PUBLIC_APP_URL,
      audience: process.env.NEXT_PUBLIC_APP_URL,
    });
    return payload;
  } catch (error) {
    console.error('Token validation failed:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Fetches a new JWT token using the current session
 * @param baseUrl Optional base URL for server-side requests
 * @returns A promise that resolves to the JWT token
 */
export async function getJwtToken(baseUrl: string = ''): Promise<string> {
  // Use the provided base URL or default to empty string (client-side)
  const apiUrl = `${baseUrl}/api/auth/token`.replace(/([^:]\/)\/+/g, '$1');
  
  const response = await fetch(apiUrl, {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to get JWT token:', response.status, errorData);
    throw new Error(`Failed to get JWT token: ${response.status} ${response.statusText}`);
  }

  const { token } = await response.json();
  if (!token) {
    throw new Error('No token received in response');
  }
  
  return token;
}

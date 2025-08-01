import { jwtVerify } from 'jose';
import { SignJWT } from 'jose';

// Get the JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Get the JWT secret key as a Uint8Array
export function getJwtSecretKey(): Uint8Array {
  // Convert the secret key to a Uint8Array
  return new TextEncoder().encode(JWT_SECRET);
}

// Verify a JWT token
export async function verifyJwtToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return payload;
  } catch (error) {
    if (error instanceof Error) {
      console.error('JWT verification failed:', error.message);
      if ((error as any).code === 'ERR_JWT_EXPIRED') {
        console.error('Token has expired');
      } else if ((error as any).code === 'ERR_JWT_INVALID') {
        console.error('Token is invalid');
      }
    } else {
      console.error('JWT verification failed:', String(error));
    }
    return null;
  }
}

// Create a JWT token
export async function createJwtToken(payload: any, expiresIn: string | number = '1h') {
  const secretKey = getJwtSecretKey();
  const alg = 'HS256';

  return await new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secretKey);
}

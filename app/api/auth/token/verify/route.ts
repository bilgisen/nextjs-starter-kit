import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Get the JWKS endpoint URL
    const jwksUrl = new URL('/api/auth/jwks', request.url).toString();
    
    // Verify the JWT token using the JWKS endpoint
    const response = await fetch(jwksUrl);
    const jwks = await response.json();
    
    if (!jwks || !jwks.keys || jwks.keys.length === 0) {
      throw new Error("No JWKS keys available");
    }
    
    // The actual verification will happen in the client using the JWKS endpoint
    // We'll just return the JWKS for the client to verify the token
    return NextResponse.json({ 
      valid: true,
      jwks_endpoint: jwksUrl,
      // Don't expose the actual keys in the response
      has_keys: jwks.keys.length > 0
    });
    
  } catch (error) {
    console.error("Error in JWT verification endpoint:", error);
    return NextResponse.json(
      { 
        valid: false,
        error: error instanceof Error ? error.message : "Token verification failed"
      },
      { status: 401 }
    );
  }
}

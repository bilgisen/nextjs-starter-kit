import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";
import { polarClient } from "@polar-sh/better-auth";

console.log('Initializing auth client...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 
  (process.env.NODE_ENV === "production" 
    ? process.env.NEXT_PUBLIC_VERCEL_URL 
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
      : 'https://your-production-url.com'
    : 'http://localhost:3000');

console.log('Using baseURL:', baseURL);

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    organizationClient(), 
    polarClient()
  ],
});

// Add debug logging
authClient.hook.after('request', (request, response) => {
  console.log('Auth Client Request:', {
    url: request.url,
    method: request.method,
    status: response?.status,
    data: response?.data
  });  
  return response;
});

authClient.hook.error('request', (error) => {
  console.error('Auth Client Error:', error);
  throw error;
});

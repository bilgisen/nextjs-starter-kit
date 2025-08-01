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
      : 'https://bookedit.vercel.app'
    : 'http://localhost:3000');

console.log('Using baseURL:', baseURL);

// Function to get the auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bearer_token');
    console.log('🔑 [getAuthToken] Retrieved token from localStorage:', token ? '[REDACTED]' : 'No token found');
    return token;
  }
  console.log('🌐 [getAuthToken] Running on server, no localStorage available');
  return null;
};

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    auth: {
      type: 'Bearer',
      getToken: () => {
        try {
          const token = getAuthToken();
          console.log('🔑 [authClient] Using token for request:', token ? '[REDACTED]' : 'No token available');
          return token || '';
        } catch (error) {
          console.error('❌ [authClient] Error getting auth token:', error);
          return '';
        }
      }
    },
    onSuccess: (ctx) => {
      try {
        // Store the token from the response headers
        const authToken = ctx.response.headers.get('set-auth-token');
        console.log('🔑 [authClient] Response headers:', {
          hasAuthHeader: ctx.response.headers.has('set-auth-token'),
          authHeaderValue: authToken ? '[REDACTED]' : 'No token in headers'
        });
        
        if (authToken && typeof window !== 'undefined') {
          console.log('💾 [authClient] Storing new auth token in localStorage');
          localStorage.setItem('bearer_token', authToken);
          
          // Also update the token in the auth client
          authClient.setOptions({
            fetchOptions: {
              auth: {
                type: 'Bearer',
                token: authToken
              }
            }
          });
        }
      } catch (error) {
        console.error('❌ [authClient] Error in onSuccess handler:', error);
      }
    },
    onError: (error) => {
      console.error('❌ [authClient] Request error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers ? Object.keys(error.config.headers) : 'No headers'
      });
      
      // If we get a 401, clear the invalid token
      if (error.response?.status === 401) {
        console.log('🔒 [authClient] 401 Unauthorized - clearing invalid token');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('bearer_token');
          // Force a page reload to reset auth state
          window.location.href = '/';
        }
      }
      
      // Don't throw the error to prevent unhandled promise rejections
      return Promise.reject(error);
    }
  },
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

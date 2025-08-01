# EPUB Generation JWT Authentication Flow

This document outlines the JWT-based authentication flow for the EPUB generation process, which involves communication between the Next.js application and GitHub Actions.

## Overview

The EPUB generation process uses JWT (JSON Web Tokens) for secure authentication between the Next.js application and GitHub Actions. This replaces the previous session-based authentication, which was not suitable for server-to-server communication.

## Authentication Flow

1. **Token Generation**
   - When a user initiates EPUB generation, the frontend requests a JWT token from the backend
   - The backend generates a JWT token with the following claims:
     - `sub`: User ID
     - `workflowId`: Unique ID for the generation workflow
     - `bookSlug`: The slug of the book being processed
     - `iss`: Issuer (the application's base URL)
     - `aud`: Audience (set to 'workflow' for GitHub Actions)
     - `exp`: Expiration time (1 hour)

2. **GitHub Actions Workflow**
   - The GitHub Actions workflow starts and generates its own JWT token using the workflow's secret
   - This token is included in the `Authorization` header of all requests to the Next.js API
   - The token is valid for 1 hour and can only be used for the specific book and workflow

3. **Token Verification**
   - The Next.js API verifies the JWT token on each request
   - It checks:
     - The token signature is valid
     - The token has not expired
     - The `bookSlug` in the token matches the requested book
     - The token has the correct audience (`workflow`)

## Configuration

### Required Environment Variables

```env
# In your Next.js application
JWT_SECRET=your-secret-key
NEXT_PUBLIC_APP_URL=https://your-app-url.com

# In your GitHub repository secrets
JWT_SECRET=your-secret-key
WORKFLOW_USER_ID=github-action
```

### GitHub Actions Workflow

The GitHub workflow has been updated to:
1. Install required tools for JWT generation
2. Generate a JWT token with the correct claims
3. Include the token in the `Authorization` header of all API requests

## Error Handling

### Common Issues

1. **Invalid Token**
   - **Cause**: The token is malformed or has an invalid signature
   - **Solution**: Ensure the `JWT_SECRET` is the same in both the Next.js app and GitHub Actions

2. **Token Expired**
   - **Cause**: The token has exceeded its expiration time (1 hour)
   - **Solution**: The workflow should generate a new token if the process takes longer than 1 hour

3. **Invalid Book Slug**
   - **Cause**: The token's `bookSlug` doesn't match the requested book
   - **Solution**: Ensure the workflow is using the correct book slug when generating the token

## Security Considerations

1. **Secret Management**
   - The `JWT_SECRET` should be stored securely and never committed to version control
   - Use GitHub Secrets for storing sensitive values in the workflow

2. **Token Lifetime**
   - Tokens are valid for 1 hour to balance security and usability
   - For longer-running workflows, implement token refresh logic

3. **Audience Validation**
   - The API verifies that tokens are intended for the 'workflow' audience
   - This prevents tokens from being used for other purposes

## Testing

To test the JWT authentication flow:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Generate a test token:
   ```typescript
   // In your browser's developer console
   const response = await fetch('/api/auth/token');
   const { token } = await response.json();
   console.log('JWT Token:', token);
   ```

3. Test the EPUB generation endpoint with the token:
   ```bash
   curl -X POST \
     http://localhost:3000/api/books/your-book-slug/publish/epub \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"options":{"generate_toc":true,"include_imprint":true}}'
   ```

## Troubleshooting

### Debugging JWT Issues

1. **Check the token**
   - Decode the JWT using a tool like [jwt.io](https://jwt.io/)
   - Verify the claims match what's expected

2. **Check server logs**
   - The API logs detailed error messages for JWT verification failures
   - Look for messages starting with `JWT verification failed:`

3. **Verify environment variables**
   - Ensure `JWT_SECRET` is set correctly in both the Next.js app and GitHub Actions
   - Check that `NEXT_PUBLIC_APP_URL` matches the expected issuer

## Related Files

- `/app/api/books/[slug]/publish/epub/route.ts` - API endpoint for EPUB generation
- `/.github/workflows/build-epub.yaml` - GitHub Actions workflow
- `/lib/jwt/workflow-token.ts` - JWT token generation and verification utilities

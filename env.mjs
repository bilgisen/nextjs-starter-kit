// Environment configuration for better-auth
const env = {
  // Required for better-auth
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET || 'your-secret-key',
  
  // Polar.sh configuration
  POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
  
  // Application URLs
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  
  // JWT configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
};

export default env;

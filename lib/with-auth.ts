// lib/with-auth.ts
'use server';

import { getSession } from "@/actions/auth/get-session";

export type User = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

// For API routes
export async function withApiAuth<T>(
  request: Request,
  handler: (user: User) => Promise<T>
): Promise<T> {
  const session = await getSession(request);
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return handler(session.user as User);
}

// For server actions
export async function getAuthUser(): Promise<User> {
  'use server';
  
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session.user as User;
}

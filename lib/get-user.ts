// lib/get-user.ts
'use client';

import { cache } from 'react';
import { getSession } from '@/actions/auth/get-session';

/**
 * Get the current user from the session
 * @returns The user object or null if not authenticated
 */
export const getUser = cache(async () => {
  try {
    const session = await getSession();
    return session?.user ?? null;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
});

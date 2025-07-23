'use server';

import { auth } from './auth';

export type User = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
};

// Helper to remove first argument (User) from tuple
// @ts-expect-error - _ is a placeholder for the first type parameter
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Tail<T extends unknown[]> = T extends [infer _, ...infer Rest] ? Rest : [];

export async function withServerAuth<
  Args extends [User, ...unknown[]],
  Return
>(
  handler: (...args: Args) => Promise<Return>
): Promise<(...args: Tail<Args>) => Promise<Return>> {
  'use server';

  const serverAction = async (...args: Tail<Args>): Promise<Return> => {
    const session = await auth.getSession();
    if (!session?.user) {
      throw new Error('Unauthorized');
    }

    return handler(session.user as User, ...args);
  };

  return serverAction;
}

export async function getAuthUser(): Promise<User> {
  'use server';

  const session = await auth.getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  return session.user as User;
}

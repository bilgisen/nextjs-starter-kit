'use server';

import { getSession } from '@/actions/auth/get-session';

export type User = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

// ✅ Server Action içinde kullanıcıyı almak
export async function getAuthUser(): Promise<User> {
  const session = await getSession();
  if (!session?.user) {
    console.error('❌ getAuthUser: Kullanıcı bulunamadı');
    throw new Error('Unauthorized - Please sign in');
  }
  return session.user as User;
}

// ✅ Her server action'da tekrar auth kodu yazmamak için reusable wrapper
export async function runWithAuth<Fn extends (user: User, ...args: unknown[]) => Promise<unknown>>(
  handler: Fn,
  ...args: TailParameters<Fn>
): Promise<Awaited<ReturnType<Fn>>> {
  const user = await getAuthUser();
  return handler(user, ...args);
}

// ✅ Yardımcı generic tipler
type TailParameters<T> = T extends (first: unknown, ...rest: infer R) => unknown ? R : never;

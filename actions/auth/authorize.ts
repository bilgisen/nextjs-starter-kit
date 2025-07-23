'use server';

import { getSession } from "./get-session";

type User = {
  id: string;
  email: string;
  name?: string;
  image?: string;
};

export async function authorize(): Promise<User> {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user as User;
}

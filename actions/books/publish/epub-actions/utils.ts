import { getSession } from '@/actions/auth/get-session';

export async function getAuthHeaders() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NEXT_EPUB_SECRET || ''}`
  };
}

export function getApiUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}${path}`;
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
}

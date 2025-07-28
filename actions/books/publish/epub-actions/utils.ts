/**
 * Constructs a full API URL from a path
 * @param path The API endpoint path
 * @returns The full URL
 */
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

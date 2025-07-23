export type BookStatus = 'draft' | 'published' | 'archived';

export type Book = {
  id: string;
  slug: string;
  title: string;
  author: string;
  publisher: string;
  description?: string | null;
  isbn?: string | null;
  publish_year?: number | null;
  language?: string | null;
  cover_image_url?: string | null;
  status?: BookStatus;
  // Database fields
  user_id: string;
  created_at: string;
  updated_at: string;
  // Alias for user_id that matches the frontend expectations
  userId: string;
};

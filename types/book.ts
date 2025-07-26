// types/book.ts
// Core Book type
export type Book = {
  // Core fields
  id: string;
  userId: string; // Alias for user_id to match frontend expectations
  title: string;
  slug: string;
  author: string;
  publisher: string;
  
  // Optional fields
  description?: string | null;
  isbn?: string | null;
  publish_year?: number | null;
  language?: string | null;
  cover_image_url?: string | null;
  
  // Database metadata
  user_id: string; // Keep for backward compatibility
  created_at: string;
  updated_at: string;
};

// Chapter type
export type Chapter = {
  id: string;
  title: string;
  content: string;
  order: number;
  level: number;
  parentId: string | null;
  bookId: string;
  createdAt: string;
  updatedAt: string;
  // Backward compatibility with snake_case fields
  book_id?: string;
  parent_id?: string | null;
  created_at?: string;
  updated_at?: string;
};

// Book with chapters type
type BookWithChapters = Omit<Book, 'created_at' | 'updated_at'> & {
  chapters: Chapter[];
  // Keep both camelCase and snake_case for backward compatibility
  createdAt: string;
  updatedAt: string;
  created_at?: string;
  updated_at?: string;
  // Alias for cover_image_url
  coverImage?: string | null;
};

export default BookWithChapters;

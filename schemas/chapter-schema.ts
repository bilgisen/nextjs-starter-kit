import { z } from 'zod';

export const chapterFormSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  content: z.string().min(1, { message: 'Content is required' }),
  parent_chapter_id: z.string().nullable().optional(),
});

export type ChapterFormData = z.infer<typeof chapterFormSchema>;

// Schema for creating a new chapter
export const createChapterSchema = chapterFormSchema.extend({
  book_id: z.string().min(1, { message: 'Book ID is required' }),
  order: z.number().int().min(0).optional().default(0),
  level: z.number().int().min(0).optional().default(0),
});

export type CreateChapterData = z.infer<typeof createChapterSchema>;

// Schema for updating an existing chapter
export const updateChapterSchema = chapterFormSchema.extend({
  id: z.string().min(1, { message: 'Chapter ID is required' }),
  book_id: z.string().min(1, { message: 'Book ID is required' }),
  order: z.number().int().min(0),
  level: z.number().int().min(0),
  user_id: z.string().min(1, { message: 'User ID is required' }).optional(),
});

export type UpdateChapterData = z.infer<typeof updateChapterSchema>;

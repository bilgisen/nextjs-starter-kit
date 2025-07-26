'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * Fetches book data and prepares it for EPUB generation
 */
export default async function prepareEpubGeneration(bookSlug: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Fetch the book with its chapters
  const book = await prisma.book.findUnique({
    where: { 
      slug: bookSlug,
      userId: session.user.id,
    },
    include: {
      chapters: {
        where: { deletedAt: null },
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          content: true,
          order: true,
          slug: true,
          wordCount: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      author: {
        select: {
          name: true,
          bio: true,
        },
      },
    },
  });

  if (!book) {
    throw new Error('Book not found');
  }

  // Prepare metadata
  const metadata = {
    title: book.title,
    author: book.author?.name || 'Unknown Author',
    description: book.description || undefined,
    language: book.language || 'en',
    publishedDate: book.publishedAt?.toISOString().split('T')[0],
    rights: 'All rights reserved',
  };

  return {
    bookId: book.id,
    bookSlug: book.slug,
    chapters: book.chapters,
    metadata,
    defaultOptions: {
      includeToc: true,
      includeImprint: true,
      includeCover: true,
      includeMetadata: true,
      splitChapters: true,
      format: 'epub3' as const,
      theme: 'light' as const,
      fontSize: 16,
      lineHeight: 1.6,
      margins: {
        top: 72,
        bottom: 72,
        left: 72,
        right: 72,
      },
    },
  };
}

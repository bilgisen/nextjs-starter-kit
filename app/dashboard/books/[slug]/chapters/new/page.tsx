"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetChapters } from "@/queries/books/chapters/get-chapters";
import { createChapter } from "@/actions/books/chapters/create-chapter";
import { getAuthUser } from "@/lib/with-auth";
import { ChapterContentForm } from "@/components/books/chapters/chapter-content-form";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useGetBook } from "@/queries/books/get-book";
import { BooksMenu } from "@/components/books/books-menu";

export default function NewChapterPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  // Get the book to ensure it exists and get its ID
  const { data: book, isLoading: isBookLoading, error: bookError } = useGetBook(slug);
  const { data: chapters = [], isLoading, error } = useGetChapters(book?.id || "");
  
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  type ChapterFormValues = {
    title: string;
    content: string;
    parent_chapter_id?: string | null;
  };

  const handleSubmit = async (data: ChapterFormValues): Promise<{ success: boolean; redirectUrl?: string }> => {
    if (!book) {
      return { success: false };
    }
    
    setFormError(null);
    setSuccess(false);
    setIsSubmitting(true);
    
    try {
      const user = await getAuthUser();
      
      if (!user?.id) {
        throw new Error("You must be logged in to create a chapter");
      }
      
      const nextOrder = chapters.length > 0 
        ? Math.max(...chapters.map((ch: { order: number }) => ch.order)) + 1 
        : 0;
      
      const parentChapter = data.parent_chapter_id 
        ? chapters.find((ch: { id: string }) => ch.id === data.parent_chapter_id)
        : null;
      const level = parentChapter ? (parentChapter.level || 0) + 1 : 0;
      
      await createChapter({
        ...data,
        bookId: book.id,
        order: nextOrder,
        userId: user.id,
        parentId: data.parent_chapter_id || null,
        level
      });
      
      setSuccess(true);
      router.refresh();
      return { 
        success: true, 
        redirectUrl: `/dashboard/books/${slug}/chapters`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create chapter';
      setFormError(errorMessage);
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBookLoading || isLoading) {
    return <div>Loading...</div>;
  }
  
  if (bookError || !book) {
    return <div className="text-red-500 p-4">Book not found.</div>;
  }
  
  if (error) {
    return <div className="text-red-500 p-4">Failed to load chapters.</div>;
  }

  return (
    <div className="w-full max-w-full mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold">New Chapter</h1>
          <p className="text-muted-foreground">for {book.title}</p>
        </div>
        <BooksMenu slug={slug} />
      </div>
      <Separator className="mb-6" />
      
      <ChapterContentForm 
        onSubmit={handleSubmit} 
        parentChapters={chapters}
        loading={isSubmitting}
        bookSlug={slug}
      />
      
      {formError && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
          {formError}
        </div>
      )}
      
      {success && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-md">
          Chapter created successfully! Redirecting...
        </div>
      )}
    </div>
  );
}

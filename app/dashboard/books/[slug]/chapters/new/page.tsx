"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetChapters } from "@/queries/books/chapters/get-chapters";
import { createChapter } from "@/actions/books/chapters/create-chapter";
import { getAuthUser } from "@/lib/with-auth";
import { ChapterContentForm } from "@/components/books/chapters/chapter-content-form";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useGetBook } from "@/queries/books/get-book";

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

  const handleSubmit = async (data: ChapterFormValues) => {
    if (!book) return;
    
    setFormError(null);
    setSuccess(false);
    setIsSubmitting(true);
    
    try {
      // Get the current user
      const user = await getAuthUser();
      console.log("Current user:", user);
      
      if (!user?.id) {
        throw new Error("You must be logged in to create a chapter");
      }
      
      console.log("User ID:", user.id, "Type:", typeof user.id);
      
      // Calculate the next order number (max existing order + 1, or 0 if no chapters)
      const nextOrder = chapters.length > 0 
        ? Math.max(...chapters.map((c: { order?: number }) => c.order || 0)) + 1 
        : 0;
      
      // Calculate the correct level based on parent
      const parentChapter = data.parent_chapter_id 
        ? chapters.find((c: { id: string }) => c.id === data.parent_chapter_id)
        : null;
      
      const level = parentChapter ? (parentChapter.level || 0) + 1 : 0;
      
      // Create the chapter data with all required fields
      const chapterData = {
        title: data.title,
        content: data.content,
        order: nextOrder,
        bookId: book.id,
        userId: user.id,
        level: level,
        parentId: data.parent_chapter_id || null,
      };
      
      console.log("Submitting chapter:", chapterData);
      
      // Pass the data directly to createChapter
      const createdChapter = await createChapter(chapterData);
      console.log("Created chapter:", createdChapter);
      
      // Invalidate the chapters query to refetch the list
      router.refresh();
      
      setSuccess(true);
      setTimeout(() => router.push(`/dashboard/books/${slug}/chapters`), 1200);
    } catch (e: unknown) {
      console.error("Error creating chapter:", e);
      const errorMessage = e instanceof Error ? e.message : "Failed to create chapter.";
      setFormError(errorMessage);
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
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-2">New Chapter</h1>
      <p className="text-muted-foreground mb-6">for {book.title}</p>
      <Separator className="mb-6" />
      
      <ChapterContentForm 
        onSubmit={handleSubmit} 
        parentChapters={chapters} 
        loading={isSubmitting}
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

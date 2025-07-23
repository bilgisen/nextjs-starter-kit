"use client";

import React, { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Eye, Trash } from "lucide-react";

import { ChapterContentForm } from "@/components/books/chapters/chapter-content-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useGetChapter } from "@/queries/books/chapters/get-chapter";
import { useGetChapters } from "@/queries/books/chapters/get-chapters";
import { updateChapter } from "@/actions/books/chapters/update-chapter";
import { ChapterUpdateData } from "@/types/chapter";
import type { ChapterFormData } from "@/schemas/chapter-schema";
import type { Chapter } from "@/types/chapter";

interface PageParams {
  slug: string;
  chapterId: string;
}

interface PageProps {
  params: PageParams;
}

export default function EditChapterPage({ params }: PageProps) {
  const router = useRouter();
  const { slug: bookSlug, chapterId } = params;

  const { data: chapter, isLoading, error } = useGetChapter(bookSlug, chapterId);
  const { data: chapters = [] } = useGetChapters(bookSlug);

  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const updateChapterMutation = useMutation({
    mutationFn: updateChapter,
    onSuccess: () => {
      toast.success("Chapter updated successfully");
      router.push(`/dashboard/books/${bookSlug}/chapters`);
    },
    onError: (error: Error) => {
      setFormError(error.message);
      toast.error("Failed to update chapter");
    },
  });

  const childrenMap = useMemo(() => {
    const map = new Map<string, string[]>();
    chapters.forEach((ch: Chapter) => {
      if (ch.parent_chapter_id) {
        map.set(ch.parent_chapter_id, [...(map.get(ch.parent_chapter_id) || []), ch.id]);
      }
    });
    return map;
  }, [chapters]);

  const descendants = useMemo(() => {
    const result = new Set<string>();
    if (!chapter) return result;

    const stack = [chapter.id];
    while (stack.length) {
      const current = stack.pop();
      if (!current) continue;
      const children = childrenMap.get(current) || [];
      children.forEach((child) => {
        if (!result.has(child)) {
          result.add(child);
          stack.push(child);
        }
      });
    }
    return result;
  }, [chapter, childrenMap]);

  const parentChapters = useMemo(() => {
    if (!chapter) return [];
    return chapters.filter((c: Chapter) => c.id !== chapter.id && !descendants.has(c.id));
  }, [chapters, chapter, descendants]);

  const handleSubmit = async (data: ChapterFormData): Promise<{ success: boolean; redirectUrl?: string }> => {
    if (!chapter) {
      setFormError("Chapter not found");
      return { success: false };
    }
    setFormError(null);

    const parentId = data.parent_chapter_id || null;
    const parent = parentId ? chapters.find((c: Chapter) => c.id === parentId) : null;
    const level = parent ? (parent.level || 0) + 1 : 0;

    const updateData: ChapterUpdateData = {
      id: chapter.id,
      bookId: chapter.book_id,
      userId: chapter.user_id || "",
      title: data.title,
      content: data.content,
      book_id: chapter.book_id,
      user_id: chapter.user_id || "",
      parent_chapter_id: parentId,
      parentId: parentId, // Include both for backward compatibility
      order: chapter.order || 0,
      level,
      updated_at: new Date(),
    };

    console.log('Submitting chapter update:', updateData);
    try {
      await updateChapterMutation.mutateAsync(updateData);
      return { success: true, redirectUrl: `/dashboard/books/${bookSlug}/chapters` };
    } catch (error) {
      console.error('Error updating chapter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update chapter. Please try again.';
      setFormError(errorMessage);
      return { success: false };
    }
  };

  if (isLoading) return <div>Loading chapter...</div>;
  if (error || !chapter) return <div className="text-red-500">Chapter not found.</div>;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Edit Chapter</h1>
            <p className="text-sm text-muted-foreground">{chapter.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/books/${bookSlug}/chapters/${chapterId}`}>
                <Eye className="mr-2 h-4 w-4" /> View
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => console.log("Delete", chapterId)}>
              <Trash className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        <Separator />

        <ChapterContentForm
          ref={formRef}
          onSubmit={handleSubmit}
          initialData={{
            title: chapter.title,
            content: chapter.content,
            parent_chapter_id: chapter.parent_chapter_id || null,
          }}
          parentChapters={parentChapters}
          loading={updateChapterMutation.isPending}
          bookSlug={bookSlug}
        />

        {formError && (
          <div className="mt-4 p-4 text-sm text-destructive bg-destructive/10 rounded-md">
            {formError}
          </div>
        )}
      </div>
    </div>
  );
}

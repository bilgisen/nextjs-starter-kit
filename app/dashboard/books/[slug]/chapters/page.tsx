"use client";

import React, { useCallback, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useGetChapters } from "@/queries/books/chapters/get-chapters";
import { useGetBook } from "@/queries/books/get-book";
import { toast } from "sonner";
import { RstChapterTree } from "@/components/books/chapters/rst-chapter-tree";
import { ChapterNode } from '@/types/dnd';
import { updateChapterOrder } from '@/actions/books/chapters/update-chapter-order';
import { Separator } from "@/components/ui/separator";

export default function ChaptersPage() {
  const params = useParams();
  const router = useRouter();
  const bookSlug = typeof params?.slug === "string" ? params.slug : "";
  
  // Get book data
  const { data: book, isLoading: isLoadingBook } = useGetBook(bookSlug);
  const bookId = book?.id || "";
  
  // Get chapters
  const { 
    data: chapters = [], 
    isLoading: isLoadingChapters, 
    refetch: refetchChapters
  } = useGetChapters(bookId);
  
  console.log('ChaptersPage - Fetched chapters:', chapters);
  console.log('ChaptersPage - Book ID:', bookId);
  
  const isLoading = isLoadingBook || isLoadingChapters;
  const [isSaving, setIsSaving] = useState(false);

  // Handle chapter order updates
  const handleSave = useCallback(async (updatedChapters: ChapterNode[]) => {
    if (!bookSlug) return;
    
    setIsSaving(true);
    try {
      // Convert ChapterNode[] to the expected format
      const chaptersToSave = updatedChapters.map(chapter => ({
        id: chapter.id,
        level: chapter.level || 0,
        order: chapter.order || 0,
        parent_chapter_id: chapter.parent_chapter_id || null
      }));
      
      const result = await updateChapterOrder(bookSlug, chaptersToSave);
      if (result.success) {
        toast.success('Chapter order updated successfully');
        refetchChapters();
      } else {
        toast.error(result.error || 'Failed to update chapter order');
      }
    } catch (error) {
      console.error('Error updating chapter order:', error);
      toast.error('An error occurred while updating chapter order');
    } finally {
      setIsSaving(false);
    }
  }, [bookSlug, refetchChapters]);

  // Handle chapter actions
  const handleAddChapter = () => {
    router.push(`/dashboard/books/${bookSlug}/chapters/new`);
  };

  const handleEdit = useCallback((chapterId: string) => {
    router.push(`/dashboard/books/${bookSlug}/chapters/${chapterId}/edit`);
  }, [bookSlug, router]);

  const handleView = useCallback((chapterId: string) => {
    router.push(`/dashboard/books/${bookSlug}/chapters/${chapterId}`);
  }, [bookSlug, router]);

  const handleDelete = useCallback(async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/books/${bookId}/chapters/${chapterId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chapter');
      }

      toast.success('Chapter deleted successfully');
      refetchChapters();
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast.error('Failed to delete chapter');
    }
  }, [bookId, refetchChapters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading chapters...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Chapters</h1>
          <p className="text-muted-foreground">
            Organize and manage your book's chapters
          </p>
        </div>
        <Button onClick={handleAddChapter} disabled={isSaving}>
          <Plus className="mr-2 h-4 w-4" /> Add Chapter
        </Button>
      </div>
      <Separator className="my-6" />
      <div className="p-0">
        {chapters.length > 0 ? (
          <RstChapterTree 
            chapters={chapters}
            onSave={handleSave}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={handleDelete}
            className="p-4"
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No chapters found</p>
            <Button onClick={handleAddChapter}>
              <Plus className="mr-2 h-4 w-4" /> Create your first chapter
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
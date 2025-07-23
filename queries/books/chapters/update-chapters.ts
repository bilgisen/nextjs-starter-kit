import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ChapterUpdateData } from "@/types/chapter";

export function useUpdateChapter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updateData: ChapterUpdateData) => {
      const { id, bookId, title, content, parentId, level, order } = updateData;
      
      const res = await fetch(`/api/books/${bookId}/chapters/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          bookId,
          userId: updateData.userId,
          title,
          content,
          parentId,
          level,
          order,
          book_id: bookId,
          user_id: updateData.userId,
          parent_chapter_id: parentId,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update chapter');
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate and refetch chapters list and the specific chapter
      queryClient.invalidateQueries({ queryKey: ['chapters', variables.bookId] });
      queryClient.invalidateQueries({ queryKey: ['chapter', variables.bookId, variables.id] });
      
      // Also invalidate any parent chapter queries if the parent changed
      if (variables.parentId) {
        queryClient.invalidateQueries({ queryKey: ['chapter', variables.bookId, variables.parentId] });
      }
    },
    onError: (error: Error) => {
      console.error('Error updating chapter:', error);
      toast.error(error.message || 'Failed to update chapter');
    },
  });
}

export function useUpdateChapters() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (chaptersData: ChapterUpdateData[]) => {
      if (!chaptersData.length) return [];
      
      const bookId = chaptersData[0]?.bookId;
      if (!bookId) throw new Error('Book ID is required');
      
      const res = await fetch(`/api/books/${bookId}/chapters/bulk-update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chapters: chaptersData }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to update chapters');
      }

      return res.json();
    },
    onSuccess: (_, variables) => {
      if (!variables.length) return;
      
      const bookId = variables[0].bookId;
      // Invalidate all chapter-related queries
      queryClient.invalidateQueries({ queryKey: ['chapters', bookId] });
      
      // Invalidate individual chapter queries
      variables.forEach(chapter => {
        queryClient.invalidateQueries({ queryKey: ['chapter', bookId, chapter.id] });
      });
    },
    onError: (error: Error) => {
      console.error('Error updating chapters:', error);
      toast.error(error.message || 'Failed to update chapters');
    },
  });
}

"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetChapter } from "@/queries/books/chapters/get-chapter";
import { useGetChapters } from "@/queries/books/chapters/get-chapters";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MoreVertical, Plus, Trash2, Loader2, GripVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUpdateChapter, useUpdateChapters } from "../../../../../../queries/books/chapters/update-chapters";
import { ChapterContentForm } from "@/components/books/chapters/chapter-content-form";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

// Import the Chapter type from the shared types file
import type { Chapter } from "@/types/chapter";

type ChapterWithChildren = Chapter & {
  children?: ChapterWithChildren[];
};

export default function ChapterDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookSlug = params?.slug as string;
  const chapterId = params?.chapterId as string;
  const { data: chapter, isLoading, error } = useGetChapter(bookSlug, chapterId);
  const { data: chaptersData = [] } = useGetChapters(bookSlug) as { data: ChapterWithChildren[] };
  const updateChapter = useUpdateChapter();
  const updateChapters = useUpdateChapters();

  const [chapters, setChapters] = useState<ChapterWithChildren[]>(() => {
    // Build tree structure
    const map: Record<string, ChapterWithChildren> = {};
    const roots: ChapterWithChildren[] = [];

    // Create a map of all chapters by ID
    chaptersData.forEach((chapter) => {
      map[chapter.id] = { ...chapter, children: [] };
    });

    // Build the tree structure
    chaptersData.forEach((chapter) => {
      if (chapter.parent_chapter_id && map[chapter.parent_chapter_id]) {
        map[chapter.parent_chapter_id].children?.push(map[chapter.id]);
      } else {
        roots.push(map[chapter.id]);
      }
    });

    return roots;
  });

  const parentTitle = useMemo(() => {
    if (!chapter?.parent_chapter_id) return "-";
    const parentChapter = (chaptersData as ChapterWithChildren[]).find((c) => c.id === chapter.parent_chapter_id);
    return parentChapter?.title || "-";
  }, [chapter?.parent_chapter_id, chaptersData]);

  const onSubmit = async (values: { title: string; content: string; parent_chapter_id?: string | null }): Promise<{ success: boolean; redirectUrl?: string }> => {
    if (!chapter) return { success: false };
    
    try {
      const parentId = values.parent_chapter_id || null;
      const parent = parentId ? (chaptersData as ChapterWithChildren[]).find(c => c.id === parentId) : null;
      const level = parent ? (parent.level || 0) + 1 : 0;

      await updateChapter.mutateAsync({
        id: chapter.id,
        bookId: chapter.book_id,
        userId: chapter.user_id || "",
        title: values.title,
        content: values.content,
        parentId: parentId,
        parent_chapter_id: parentId,
        book_id: chapter.book_id,
        user_id: chapter.user_id || "",
        order: chapter.order || 0,
        level: level,
        updated_at: new Date()
      });
      
      return {
        success: true,
        redirectUrl: `/dashboard/books/${bookSlug}/chapters`
      };
    } catch (error) {
      console.error("Error updating chapter:", error);
      throw new Error("Failed to update chapter. Please try again.");
    }
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log('Delete chapter', chapterId);
  };

  const handleAddChapter = () => {
    router.push(`/dashboard/books/${bookSlug}/chapters/new`);
  };

  // Flatten tree back to list with updated order and level
  const flattenTree = (nodes: ChapterWithChildren[]): ChapterWithChildren[] => {
    return nodes.flatMap((node, index) => [
      { ...node, level: index, order: index },
      ...flattenTree(node.children || [])
    ]);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination } = result;

    if (!destination) return;

    // Flatten current tree
    const flatList = flattenTree(chapters);
    
    // Find moved item
    const movedItem = flatList.find(item => item.id === result.draggableId);
    if (!movedItem) return;

    // Remove dragged item
    const newFlatList = flatList.filter(item => item.id !== result.draggableId);
    
    // Insert at new position
    newFlatList.splice(destination.index, 0, movedItem);

    // Rebuild tree structure
    const map: Record<string, ChapterWithChildren> = {};
    const roots: ChapterWithChildren[] = [];

    newFlatList.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });

    newFlatList.forEach((item) => {
      const node = map[item.id];
      if (item.parent_chapter_id && map[item.parent_chapter_id]) {
        map[item.parent_chapter_id].children?.push(node);
      } else {
        roots.push(node);
      }
    });

    setChapters(roots);

    // Update all chapters with new order and levels
    try {
      const updatedFlatList = flattenTree(roots);
      await updateChapters.mutateAsync(updatedFlatList.map(chap => ({
        id: chap.id,
        bookId: chap.book_id,
        userId: chap.user_id || "",
        title: chap.title,
        content: chap.content,
        parentId: chap.parent_chapter_id,
        parent_chapter_id: chap.parent_chapter_id,
        book_id: chap.book_id,
        user_id: chap.user_id || "",
        order: chap.order || 0,
        level: chap.level || 0,
        updated_at: new Date()
      })));
    } catch (error) {
      console.error("Error updating chapter order:", error);
    }
  };

  const renderChapterTree = (nodes: ChapterWithChildren[], level = 0) => {
    return nodes.map((node, index) => (
      <Draggable key={node.id} draggableId={node.id} index={index}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="mb-2"
            style={{ ...provided.draggableProps.style }}
          >
            <div 
              className="flex items-center p-3 border rounded bg-card text-card-foreground hover:bg-accent"
              style={{ marginLeft: level * 20 }}
            >
              <div {...provided.dragHandleProps} className="mr-2 cursor-grab">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <span className="font-medium">{node.title}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push(`/dashboard/books/${bookSlug}/chapters/${node.id}`)}
              >
                Edit
              </Button>
            </div>
            {node.children && node.children.length > 0 && (
              <div className="mt-1">
                {renderChapterTree(node.children, level + 1)}
              </div>
            )}
          </div>
        )}
      </Draggable>
    ));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading chapter...</span>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="p-8 text-red-500">
        Error loading chapter. Please try again.
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Edit Chapter</h1>
          <p className="text-sm text-muted-foreground">
            {chapter.title}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back to Chapters
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleAddChapter}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Add Sub-Chapter</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Chapter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator />

      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Chapter Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Parent Chapter</p>
              <p>{parentTitle}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p>{new Date(chapter.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <ChapterContentForm
          initialData={{
            title: chapter.title,
            content: chapter.content,
            parent_chapter_id: chapter.parent_chapter_id
          }}
          parentChapters={chaptersData.filter(c => c.id !== chapterId)}
          currentChapterId={chapterId}
          onSubmit={onSubmit}
          bookSlug={bookSlug}
          submitButtonText={updateChapter.isPending ? 'Saving...' : 'Save Changes'}
          disabled={updateChapter.isPending}
        />

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Chapter Hierarchy</h2>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="chapters">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="space-y-2"
                >
                  {renderChapterTree(chapters)}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}
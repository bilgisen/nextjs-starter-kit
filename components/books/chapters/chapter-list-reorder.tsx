"use client";
import * as React from "react";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  Row,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Chapter } from "@/types/chapter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertModal } from "../../ui/alert-modal";

// Table row type


interface ChapterListReorderProps {
  chapters: Chapter[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  parentChaptersMap?: Record<string, string>;
}

export function ChapterListReorder({
  chapters,
  onEdit,
  onDelete,
  onView,
  parentChaptersMap = {},
}: ChapterListReorderProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  // Create a map of chapters by parent_id for hierarchical display
  const chaptersByParent = React.useMemo(() => {
    const map: Record<string, Chapter[]> = {};
    chapters.forEach((chapter) => {
      const parentId = chapter.parent_chapter_id || "root";
      if (!map[parentId]) {
        map[parentId] = [];
      }
      map[parentId].push(chapter);
    });
    return map;
  }, [chapters]);

  // Create a flattened list of chapters with depth information
  const flattenedChapters = React.useMemo(() => {
    const result: (Chapter & { depth: number })[] = [];

    const processChapter = (chapter: Chapter, depth: number = 0) => {
      result.push({ ...chapter, depth });
      if (chapter.id && chaptersByParent[chapter.id]) {
        chaptersByParent[chapter.id].forEach((child) => {
          processChapter(child, depth + 1);
        });
      }
    };

    // Start with root chapters
    chaptersByParent["root"]?.forEach((chapter) => {
      processChapter(chapter);
    });

    return result;
  }, [chaptersByParent]);



  // Create table columns
  const columns = React.useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }: { row: Row<Chapter & { depth: number }> }) => {
          const chapter = row.original;
          const depth = chapter.depth || 0;
          return (
            <div
              style={{
                paddingLeft: `${depth * 20}px`,
                display: "flex",
                alignItems: "center",
              }}
            >
              <span>{chapter.title}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "parent_chapter_id",
        header: "Parent Chapter",
        cell: ({ row }: { row: Row<Chapter & { depth: number }> }) => {
          const chapter = row.original;
          return chapter.parent_chapter_id
            ? parentChaptersMap[chapter.parent_chapter_id] || "-"
            : "-";
        },
      },
      {
        accessorKey: "order",
        header: "Order",
        cell: ({ row }: { row: Row<Chapter & { depth: number }> }) => row.original.order?.toString() || "-",
      },
      {
        id: "actions",
        cell: ({ row }: { row: Row<Chapter & { depth: number }> }) => {
          const chapter = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(chapter.id)}>View</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(chapter.id)}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(chapter.id)}>Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [parentChaptersMap, onView, onEdit, onDelete]
  );

  const table = useReactTable<Chapter & { depth: number }>({
    data: flattenedChapters,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });
      
  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      )}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row: Row<Chapter & { depth: number }>) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <AlertModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            try {
              setIsLoading(true);
              onDelete(deleteId);
            } catch (error) {
              console.error("Error deleting chapter:", error);
              // TODO: Add error toast notification
            } finally {
              setIsLoading(false);
              setDeleteId(null);
            }
          }
        }}
        title="Delete Chapter"
        description="Are you sure you want to delete this chapter? This action cannot be undone."
      />
    </div>
  );
}

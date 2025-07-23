// components/book-table/table-toolbar.tsx
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FiPlus } from "react-icons/fi";
import { type Table as TableType } from "@tanstack/react-table";
import type { Book } from "@/types/book";

interface TableToolbarProps {
  table: TableType<Book>;
  onView?: (slug: string) => void;
  onEdit?: (slug: string) => void;
  onDelete?: (slug: string) => void;
  onAddChapter?: (slug: string) => void;
}

export function TableToolbar({
  table,
  onView,
  onEdit,
  onDelete,
  onAddChapter,
}: TableToolbarProps) {
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelections = selectedRows.length > 0;
  const hasSingleSelection = selectedRows.length === 1;
  const selectedBook = hasSingleSelection ? selectedRows[0].original : null;

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1">
        <Input
          placeholder="Search books..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(e) =>
            table.getColumn("title")?.setFilterValue(e.target.value)
          }
          className="max-w-sm"
        />
      </div>
      <div className="flex items-center space-x-2">
        {hasSelections && (
          <div className="text-sm text-muted-foreground">
            {selectedRows.length} selected
          </div>
        )}
        {hasSingleSelection && onView && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(selectedBook!.slug)}
          >
            View
          </Button>
        )}
        {hasSingleSelection && onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(selectedBook!.slug)}
          >
            Edit
          </Button>
        )}
        {hasSelections && onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const slugs = selectedRows.map((row) => row.original.slug);
              // Handle multiple deletions
              console.log("Delete books:", slugs);
            }}
          >
            Delete
          </Button>
        )}
        {onAddChapter && hasSingleSelection && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onAddChapter(selectedBook!.slug)}
          >
            <FiPlus className="mr-2 h-4 w-4" />
            Add Chapter
          </Button>
        )}
      </div>
    </div>
  );
}

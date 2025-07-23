import type { ColumnDef } from "@tanstack/react-table";
import type { Book } from "@/types/book";
import { Badge } from "@/components/ui/badge";
import { ActionsCell } from "./actions-cell";

type ColumnConfig = {
  onView?: (slug: string) => void;
  onEdit?: (slug: string) => void;
  onDelete?: (slug: string) => void;
  onAddChapter?: (slug: string) => void;
};

export function getColumns<TData extends Book>({
  onView,
  onEdit,
  onDelete,
  onAddChapter,
}: ColumnConfig): ColumnDef<TData>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const book = row.original as Book;
        return (
          <div className="font-medium">
            {book.title || "Untitled"}
          </div>
        );
      },
    },
    {
      accessorKey: "author",
      header: "Author",
      cell: ({ row }) => {
        const book = row.original as Book;
        return book.author || "-";
      },
    },
    {
      accessorKey: "publisher",
      header: "Publisher",
      cell: ({ row }) => {
        const book = row.original as Book;
        return book.publisher || "-";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const book = row.original as Book;
        const variant = {
          draft: "outline",
          published: "default",
          archived: "secondary",
        }[book.status] as "outline" | "default" | "secondary";

        return <Badge variant={variant}>{book.status}</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const book = row.original as Book;
        return (
          <ActionsCell
            slug={book.slug}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChapter={onAddChapter}
          />
        );
      },
    },
  ];
}

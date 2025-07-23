import { ColumnDef } from "@tanstack/react-table";
import { Book } from "../book-card";

export const columns: ColumnDef<Book>[] = [
  {
    accessorKey: "title",
    header: "Title",
    enableSorting: true,
    cell: ({ row }) => row.original.title,
  },
  {
    accessorKey: "author",
    header: "Author",
    enableSorting: true,
    cell: ({ row }) => row.original.author,
  },
];

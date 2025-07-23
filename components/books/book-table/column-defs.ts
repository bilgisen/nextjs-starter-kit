import { ColumnDef } from "@tanstack/react-table";
import { Book } from "@/types/book";

// Title column definition
export const titleColumn: ColumnDef<Book> = {
  accessorKey: "title",
  header: "Title",
  enableSorting: true,
  cell: (info) => ({
    props: {
      className: "font-medium"
    },
    children: info.row.original.title || "Untitled"
  })
};

// Author column definition
export const authorColumn: ColumnDef<Book> = {
  accessorKey: "author",
  header: "Author",
  enableSorting: true,
  cell: (info) => info.row.original.author || "N/A"
};

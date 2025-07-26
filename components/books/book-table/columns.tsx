import type { ColumnDef } from "@tanstack/react-table";
import type { Book } from "@/types/book";
import { BooksMenu } from "../books-menu";
import React from "react";

export type ColumnConfig = {
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
        return <div className="font-medium">{book.title || "Untitled"}</div>;
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
      accessorKey: "language",
      header: "Language",
      cell: ({ row }) => {
        const book = row.original as Book;
        return book.language || "-";
      },
    },
    {
      accessorKey: "publish_year",
      header: "Year",
      cell: ({ row }) => {
        const book = row.original as Book;
        return book.publish_year || "-";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const book = row.original as Book;
        
        if (!book.slug) {
          console.error('Book is missing slug:', book);
          return null; // Don't render the menu if there's no slug
        }

        return (
          <div className="flex justify-end pr-4">
            <BooksMenu
              slug={book.slug}
              onView={onView ? () => onView(book.slug) : undefined}
              onEdit={onEdit ? () => onEdit(book.slug) : undefined}
              onDelete={onDelete ? () => onDelete(book.slug) : undefined}
              onAddChapter={onAddChapter ? () => onAddChapter(book.slug) : undefined}
            />
          </div>
        );
      },
    },
  ];
}
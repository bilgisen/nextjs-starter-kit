"use client";

import * as React from "react";
import type { Book } from "@/types/book";
import { BookDataTable } from "./book-table/data-table";
import { getColumns } from "./book-table/columns";

export type BookListProps = {
  books: Book[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChapter?: (id: string) => void;
};

export function BookList({
  books,
  onView,
  onEdit,
  onDelete,
  onAddChapter,
}: BookListProps) {
  const columns = React.useMemo(() => 
    getColumns({ onView, onEdit, onDelete, onAddChapter })
  , [onView, onEdit, onDelete, onAddChapter]);

  if (!books.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">No books found</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <BookDataTable
        data={books}
        columns={columns}
      />
    </div>
  );
}

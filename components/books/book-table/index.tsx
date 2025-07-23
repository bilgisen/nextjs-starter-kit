"use client";

import { Book } from "../book-card";
import { BookDataTable } from "./data-table";
import { getColumns } from "./columns";

export type BookTableProps = {
  books: Book[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChapter?: (id: string) => void;
};

export function BookTable({
  books,
  onView,
  onEdit,
  onDelete,
  onAddChapter,
}: BookTableProps) {
  const columns = getColumns({
    onView,
    onEdit,
    onDelete,
    onAddChapter,
  });

  return <BookDataTable columns={columns} data={books} />;
}

import { ColumnDef } from "@tanstack/react-table";
import type { Book } from "@/types/book";

export interface Handlers {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChapter?: (id: string) => void;
}

export type BookColumn = ColumnDef<Book>;

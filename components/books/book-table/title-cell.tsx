import { Row } from "@tanstack/react-table";
import { Book } from "../book-card";

interface TitleCellProps {
  row: Row<Book>;
}

export function TitleCell({ row }: TitleCellProps) {
  return <div className="font-medium">{row.original.title}</div>;
}

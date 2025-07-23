import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Book } from "../book-card";
import { Button } from "@/components/ui/button";

interface GetColumnsProps {
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onAddChapter?: (id: string) => void;
}

export function getColumns({
  onView,
  onEdit,
  onDelete,
  onAddChapter,
}: GetColumnsProps): ColumnDef<Book>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const title = row.getValue("title") as string;
        return React.createElement("div", { className: "font-medium" }, title);
      },
    },
    {
      accessorKey: "author",
      header: "Author",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string | undefined | null;
        const displayStatus = status || 'unknown';
        return React.createElement(
          "div",
          { className: "capitalize" },
          displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const book = row.original;
        const buttons = [
          React.createElement(
            Button,
            {
              key: "view",
              variant: "ghost",
              size: "sm",
              className: "",
              onClick: () => onView(book.id),
              children: "View"
            } as React.ComponentProps<typeof Button>
          ),
          React.createElement(
            Button,
            {
              key: "edit",
              variant: "ghost",
              size: "sm",
              className: "",
              onClick: () => onEdit(book.id),
              children: "Edit"
            } as React.ComponentProps<typeof Button>
          ),
        ];

        if (onAddChapter) {
          buttons.push(
            React.createElement(
              Button,
              {
                key: "add-chapter",
                variant: "ghost",
                size: "sm",
                className: "",
                onClick: () => onAddChapter(book.id),
                children: "Add Chapter"
              } as React.ComponentProps<typeof Button>
            )
          );
        }

        buttons.push(
          React.createElement(
            Button,
            {
              key: "delete",
              variant: "ghost",
              size: "sm",
              className: "text-destructive hover:text-destructive/90",
              onClick: () => onDelete(book.id),
              children: "Delete"
            } as React.ComponentProps<typeof Button>
          )
        );

        return React.createElement(
          "div",
          { className: "flex items-center space-x-2" },
          ...buttons
        );
      },
    },
  ];
}

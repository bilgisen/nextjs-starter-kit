import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface ActionsCellProps {
  slug: string;
  onView?: (slug: string) => void;
  onEdit?: (slug: string) => void;
  onDelete?: (slug: string) => void;
  onAddChapter?: (slug: string) => void;
}

export function ActionsCell({
  slug,
  onView,
  onEdit,
  onDelete,
  onAddChapter,
}: ActionsCellProps) {
  return (
    <div className="flex justify-end">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {onView && (
            <DropdownMenuItem onClick={() => onView(slug)}>
              View Details
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(slug)}>
              Edit Book
            </DropdownMenuItem>
          )}
          {onAddChapter && (
            <DropdownMenuItem onClick={() => onAddChapter(slug)}>
              Add Chapter
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem
              onClick={() => onDelete(slug)}
              className="text-red-600 focus:bg-red-50 focus:text-red-700"
            >
              Delete Book
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

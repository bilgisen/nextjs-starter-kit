'use client';

import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type BooksMenuProps = {
  slug?: string;
  className?: string;
};

export function BooksMenu({ slug, className = "" }: BooksMenuProps) {
  const pathname = usePathname();
  const isBookPage = slug && pathname.includes(slug);
  const isChaptersPage = pathname.includes("/chapters");
  const isEditPage = pathname.endsWith("/edit");
  const isPublishPage = pathname.endsWith("/publish");

  const menuItems = [
    {
      label: "Book Library",
      href: "/dashboard/books",
      active: pathname === "/dashboard/books",
      show: true,
    },
    {
      label: "Add Book",
      href: "/dashboard/books/new",
      active: pathname === "/dashboard/books/new",
      show: true,
    },
    {
      label: "View Book",
      href: slug ? `/dashboard/books/${slug}` : "#",
      active: isBookPage && !isChaptersPage && !isEditPage && !isPublishPage,
      show: !!slug,
    },
    {
      label: "Edit Book",
      href: slug ? `/dashboard/books/${slug}/edit` : "#",
      active: isEditPage,
      show: !!slug,
    },
    {
      label: "Delete Book",
      href: "#",
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        // Handle delete with confirmation
        if (slug) {
          if (confirm('Are you sure you want to delete this book? This action cannot be undone.')) {
            // Call delete action
            console.log('Deleting book:', slug);
            // You'll need to implement the actual delete logic
          }
        }
      },
      variant: "destructive" as const,
      show: !!slug,
    },
    {
      type: "separator" as const,
      show: !!slug,
    },
    {
      label: "Add Chapter",
      href: slug ? `/dashboard/books/${slug}/chapters/new` : "#",
      active: pathname.endsWith("/chapters/new"),
      show: !!slug,
    },
    {
      label: "View Chapters",
      href: slug ? `/dashboard/books/${slug}/chapters` : "#",
      active: isChaptersPage && !pathname.endsWith("/new"),
      show: !!slug,
    },
    {
      type: "separator" as const,
      show: !!slug,
    },
    {
      label: "Publish Book",
      href: slug ? `/dashboard/books/${slug}/publish` : "#",
      active: isPublishPage,
      show: !!slug,
    },
  ];

  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Books menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {menuItems
            .filter((item) => item.show)
            .map((item, index) => {
              if (item.type === "separator") {
                return <DropdownMenuSeparator key={`separator-${index}`} />;
              }

              return (
                <DropdownMenuItem
                  key={item.href}
                  asChild
                  variant={item.variant}
                  className={item.active ? "bg-muted" : ""}
                >
                  {item.onClick ? (
                    <button
                      onClick={item.onClick}
                      className={`w-full text-left ${
                        item.variant === "destructive"
                          ? "text-destructive"
                          : ""
                      }`}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <Link href={item.href}>{item.label}</Link>
                  )}
                </DropdownMenuItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

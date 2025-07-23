"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  {
    name: "Chapters",
    href: (slug: string) => `/dashboard/books/${slug}/chapters`,
  },
  {
    name: "Settings",
    href: (slug: string) => `/dashboard/books/${slug}/settings`,
  },
  {
    name: "Analytics",
    href: (slug: string) => `/dashboard/books/${slug}/analytics`,
  },
];

export function BookTabs({ bookSlug }: { bookSlug: string; bookId: string }) {
  const pathname = usePathname();

  return (
    <div className="border-b">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href(bookSlug).split("?")[0]);
          return (
            <Link
              key={tab.name}
              href={tab.href(bookSlug)}
              className={cn(
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground/80",
                "whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

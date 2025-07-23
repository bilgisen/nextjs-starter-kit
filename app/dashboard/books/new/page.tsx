// app/dashboard/books/new/page.tsx
import { createBook } from "@/actions/books/create-book";
import { BookInfoForm } from "@/components/books/book-info-form";
import Link from "next/link";

export default function NewBookPage() {
  return (
    <div className="p-8 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Create New Book</h1>
        <Link
          href="/dashboard/books"
          className="px-4 py-2 rounded bg-foreground text-background hover:bg-foreground/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Books"
        >
          Books
        </Link>
      </div>
      <hr className="mb-6 border-gray-200 dark:border-gray-900" />
      <BookInfoForm onSubmit={createBook} />
    </div>
  );
}

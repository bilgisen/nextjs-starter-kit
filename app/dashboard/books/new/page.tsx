// app/dashboard/books/new/page.tsx
"use client";

import { createBook } from "@/actions/books/create-book";
import { BookInfoForm } from "@/components/books/book-info-form";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { BookFormValues } from "@/components/books/book-info-form";

export default function NewBookPage() {
  const handleSubmit = async (data: BookFormValues) => {
    const formData = new FormData();
    
    // Append all form fields to FormData
    Object.entries(data).forEach(([key, value]) => {
      // Only append if the value is not undefined or null
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    return createBook(formData);
  };

  return (
    <div className="p-8 w-full mx-auto">
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
      <Separator className="mb-6" />
      <BookInfoForm onSubmit={handleSubmit} />
    </div>
  );
}

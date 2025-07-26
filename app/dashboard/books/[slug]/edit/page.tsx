"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { BookInfoForm, type BookFormValues } from "@/components/books/book-info-form";
import { updateBook } from "@/actions/books/update-book";
import { Loader2 } from "lucide-react";
import { BooksMenu } from "@/components/books/books-menu";
import { useGetBookBySlug } from "@/queries/books/get-book-by-slug";
import { Separator } from "@/components/ui/separator";

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const [saveStatus, setSaveStatus] = useState<{success: boolean; message: string} | null>(null);
  
  // Fetch book data
  const { 
    data: bookWithChapters, 
    isLoading, 
    error 
  } = useGetBookBySlug(slug);
  const handleSubmit = async (data: BookFormValues) => {
    if (!bookWithChapters) return;
    setSaveStatus(null);
    
    try {
      const result = await updateBook({
        id: bookWithChapters.id,
        ...data,
        // Ensure publish_year is a number
        publish_year: data.publish_year ? Number(data.publish_year) : undefined,
      });
      
      if (result?.success) {
        setSaveStatus({ success: true, message: 'Book updated successfully!' });
        // Redirect to the book's page after a short delay
        setTimeout(() => {
          router.push(`/dashboard/books/${result.book.slug}`);
        }, 1500);
      }
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unknown error occurred';
      setSaveStatus({ success: false, message: errorMessage });
      // Auto-hide error after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this book?")) {
      // Handle delete
    }
  };

  if (!bookWithChapters) {
    return <div>Book not found</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div>Error loading book: {error.message}</div>;
  }

  return (
    <div className="p-8 w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Edit Book</h1>
          {saveStatus && (
            <span className={`text-sm px-3 py-1 rounded-full ${
              saveStatus.success 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {saveStatus.message}
            </span>
          )}
        </div>
        <BooksMenu 
          slug={bookWithChapters.slug} 
          onView={() => window.open(`/books/${bookWithChapters.slug}`, '_blank')}
          onDelete={handleDelete}
          hideEdit={true}
        />
      </div>
      <Separator className="mb-6" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <BookInfoForm
            onSubmit={handleSubmit}
            defaultValues={{
              title: bookWithChapters.title,
              slug: bookWithChapters.slug,
              author: bookWithChapters.author,
              publisher: bookWithChapters.publisher,
              description: bookWithChapters.description || "",
              isbn: bookWithChapters.isbn || "",
              publish_year: bookWithChapters.publish_year,
              language: bookWithChapters.language || "",
              cover_image_url: bookWithChapters.cover_image_url || "",
            }}
          />
        </div>
      </div>
    </div>
  );
}

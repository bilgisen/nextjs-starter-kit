"use client";

import { useParams, useRouter } from "next/navigation";
import { BookInfoForm, type BookFormValues } from "@/components/books/book-info-form";
import { updateBook } from "@/actions/books/update-book";
import { Loader2, ArrowLeft, Eye, Trash, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGetBookBySlug } from "@/queries/books/get-book-by-slug";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EditBookPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  
  // Fetch book data with chapters
  const { 
    data: bookWithChapters, 
    isLoading, 
    error 
  } = useGetBookBySlug(slug);
  
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin h-6 w-6" />
      </div>
    );
  }

  if (error || !bookWithChapters) {
    return (
      <div className="p-4 text-red-500">
        {error?.message || 'Book not found'}
      </div>
    );
  }

  const handleSubmit = async (data: BookFormValues) => {
    if (!bookWithChapters) return;
    
    setFormError(null);
    setSuccess(false);
    
    try {
      const result = await updateBook({
        ...data,
        id: bookWithChapters.id,
      });
      
      if (result?.success && result.book) {
        setSuccess(true);
        
        // If we have a redirect URL from the server, use it
        if (result.redirectUrl) {
          router.push(result.redirectUrl);
        } else {
          // Otherwise, refresh the page to show updated data
          router.refresh();
        }
      } else {
        throw new Error('Failed to update book');
      }
    } catch (error) {
      console.error('Error updating book:', error);
      setFormError(
        error instanceof Error 
          ? error.message 
          : 'An error occurred while updating the book. Please try again.'
      );
    }
  };

  return (
    <div className="p-8 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold">Edit Book</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/books/${bookWithChapters.slug}`} target="_blank">
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 dark:text-red-400"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this book?")) {
                    // Handle delete
                  }
                }}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete Book
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Separator className="mb-6" />
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
          Book updated successfully!
        </div>
      )}
      
      {formError && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
          {formError}
        </div>
      )}
      
      <BookInfoForm 
        defaultValues={{
          title: bookWithChapters.title,
          slug: bookWithChapters.slug,
          author: bookWithChapters.author,
          publisher: bookWithChapters.publisher,
          description: bookWithChapters.description || undefined,
          isbn: bookWithChapters.isbn || undefined,
          publish_year: bookWithChapters.publish_year,
          language: bookWithChapters.language || undefined,
          cover_image_url: bookWithChapters.cover_image_url || undefined,
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

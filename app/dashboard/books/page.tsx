"use client";

import React, { useCallback, useMemo } from "react";
import { useGetBooks } from "@/queries/books/get-books";
import { useRouter } from "next/navigation";
import { BookDataTable } from "@/components/books/book-table/data-table";
import { Separator } from "@/components/ui/separator";
import { getColumns } from "@/components/books/book-table/columns";

export default function BooksDashboardPage() {
  const router = useRouter();
  const { data: books, isLoading, isError, error } = useGetBooks();

  const handleView = useCallback((slug: string) => {
    router.push(`/dashboard/books/${slug}`);
  }, [router]);

  const handleEdit = useCallback((slug: string) => {
    router.push(`/dashboard/books/${slug}/edit`);
  }, [router]);

  const handleDelete = useCallback((slug: string) => {
    router.push(`/dashboard/books/${slug}/delete`);
  }, [router]);

  const handleAddChapter = useCallback((slug: string) => {
    router.push(`/dashboard/books/${slug}/chapters/new`);
  }, [router]);

  const columns = useMemo(
    () =>
      getColumns({
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onAddChapter: handleAddChapter,
      }),
    [handleView, handleEdit, handleDelete, handleAddChapter]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-3">Loading books...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-12">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error?.message || "Failed to load books. Please try again later."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-12">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Books</h1>
        <button
          onClick={() => router.push("/dashboard/books/new")}
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
        >
          Add New Book
        </button>
      </div>
      <Separator className="my-4" />
      <BookDataTable
        data={books || []}
        columns={columns}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddChapter={handleAddChapter}
      />
    </div>
  );
}

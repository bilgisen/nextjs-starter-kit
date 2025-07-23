import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";
import type { Book } from "@/types/book";

type BookCardProps = {
  book: Book;
  onEdit: () => void;
  onDelete: () => void;
};

export function BookCard({ book, onEdit, onDelete }: BookCardProps) {
  return (
    <Card className="flex flex-col items-center p-4 gap-2 group">
      <Link 
        href={`/dashboard/books/${book.slug}`}
        className="w-full flex flex-col items-center gap-2"
      >
        <div className="w-full flex justify-center mb-2">
          <div className="relative w-24 h-32 rounded-md border overflow-hidden group-hover:shadow-md transition-shadow">
            <Image
              src={book.cover_image_url || "/placeholder-book.png"}
              alt={book.title}
              fill
              className="object-cover"
              sizes="96px 128px"
            />
          </div>
        </div>
        <CardContent className="flex flex-col items-center p-0 w-full">
          <h3 className="text-lg font-semibold text-center line-clamp-2 group-hover:text-primary">
            {book.title}
          </h3>
          <p className="text-gray-500 text-sm text-center line-clamp-1">
            {book.author}
          </p>
        </CardContent>
      </Link>
      
      <div className="flex gap-3 mt-2">
        <Link 
          href={`/books/${book.slug}`} 
          target="_blank"
          className="text-blue-600 hover:text-blue-800"
          title="View"
          onClick={(e) => e.stopPropagation()}
        >
          <FiEye size={18} />
        </Link>
        <Link 
          href={`/dashboard/books/${book.slug}/edit`}
          className="text-green-600 hover:text-green-800"
          title="Edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
        >
          <FiEdit2 size={18} />
        </Link>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete?.();
          }} 
          title="Delete" 
          className="text-red-600 hover:text-red-800"
        >
          <FiTrash2 size={18} />
        </button>
      </div>
    </Card>
  );
}

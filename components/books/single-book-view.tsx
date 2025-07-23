import Image from "next/image";
import { Book } from "@/types/book";

type SingleBookViewProps = {
  book: Book;
  className?: string;
};

export function SingleBookView({ book, className = "" }: SingleBookViewProps) {
  return (
    <div className={`p-0 ${className}`}>
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left Column - Book Cover */}
        <div className="md:w-1/4">
          {book.cover_image_url ? (
            <div className="relative aspect-[2/3] w-full rounded-lg overflow-hidden shadow-md">
              <Image
                src={book.cover_image_url}
                alt={`Cover of ${book.title}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
                priority
              />
            </div>
          ) : (
            <div className="flex items-center justify-center aspect-[3/4] w-full bg-muted rounded-lg">
              <span className="text-muted-foreground">No cover image</span>
            </div>
          )}
        </div>

        {/* Right Column - Book Info */}
        <div className="md:w-2/3 space-y-4">
          {/* Title */}
          <h3 className="text-2xl font-bold text-foreground">{book.title}</h3>

          {/* Author and Publisher */}
          <div className="flex items-center text-muted-foreground text-sm">
            <span>{book.author}</span>
            <span className="mx-2">|</span>
            <span>{book.publisher}</span>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {book.isbn && (
              <div>
                <span className="font-medium">ISBN:</span> {book.isbn}
              </div>
            )}
            {book.publish_year && (
              <div>
                <span className="font-medium">Year:</span> {book.publish_year}
              </div>
            )}
            {book.language && (
              <div>
                <span className="font-medium">Language:</span> {book.language.toUpperCase()}
              </div>
            )}
          </div>

          {/* Book Description */}
          <div>
            {book.description ? (
              <div className="prose prose-sm max-w-none text-foreground/90">
                <p className="whitespace-pre-line">{book.description}</p>
              </div>
            ) : (
              <p className="text-muted-foreground italic">No description available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

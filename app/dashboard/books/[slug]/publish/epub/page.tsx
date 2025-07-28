'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// UI Components
import { BooksMenu } from '@/components/books/books-menu';
import { Separator } from '@/components/ui/separator';

// Custom Components
import { EpubGenerationForm } from '@/components/books/publish/epub/EpubGenerationForm';

export default function PublishEpubPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { slug } = params;
  
  // State
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load book data
  useEffect(() => {
    if (!slug) {
      router.push('/dashboard/books');
      return;
    }

    const loadBookData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/books/${slug}`);
        if (!response.ok) {
          throw new Error('Failed to load book data');
        }
        const bookData = await response.json();
        setBook(bookData);
      } catch (err) {
        console.error('Error loading book:', err);
        toast.error('Failed to load book data');
      } finally {
        setIsLoading(false);
      }
    };

    loadBookData();
  }, [slug, router]);

  // Show loading state
  if (isLoading || !book) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading book data...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Publish EPUB</h1>
            <p className="text-muted-foreground">
              Generate and download your book as an EPUB file
            </p>
          </div>
          <BooksMenu slug={slug} activeTab="epub" />
        </div>

        <Separator />

        <EpubGenerationForm 
          bookSlug={slug}
          book={{
            title: book.title,
            coverImageUrl: book.coverImageUrl || book.cover_image_url,
            userId: book.userId || book.user_id
          }}
        />
      </div>
    </div>
  );
}

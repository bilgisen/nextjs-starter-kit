'use client';

import { useGetBookBySlug } from '@/queries/books/get-book-by-slug';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SingleBookView } from '@/components/books/single-book-view';
import { ChapterListReorder } from '@/components/books/chapters/chapter-list-reorder';
import { EpubOptions } from '@/components/books/publish/epub/epub-options';

import type { BookWithChapters } from '@/queries/books/get-book-by-slug';

// Dynamically import components with code splitting
const EpubPublishPreview = dynamic(
  () => import('@/components/books/publish/epub/epub-publish-preview'),
  { 
    ssr: false, 
    loading: () => <div>Loading preview...</div>
  }
);

const EpubPublishExport = dynamic(
  () => import('@/components/books/publish/epub/epub-publish-export'),
  { 
    ssr: false, 
    loading: () => <div>Preparing export...</div>
  }
);

// Loading state component
const LoadingState = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Error state component
const ErrorState = ({ error }: { error?: Error | null }) => (
  <div className="p-6 max-w-4xl mx-auto">
    <div className="text-red-600">
      {error?.message || 'Book not found'}
    </div>
  </div>
);

// Header component
const PageHeader = () => (
  <div>
    <h1 className="text-3xl font-bold mb-2">Publish as EPUB</h1>
    <p className="text-muted-foreground">
      Configure the settings for your EPUB export
    </p>
  </div>
);

// Chapter list with selection
const ChapterSelection = ({ book }: { book: BookWithChapters }) => (
  <div className="space-y-4">
    <h3 className="font-medium">Chapters to Include</h3>
    <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
      <ChapterListReorder   
        chapters={book.chapters} 
        onView={() => {}}
        onEdit={() => {}}
        onDelete={() => {}}
      />
    </div>
  </div>
);

// Action buttons component
const ActionButtons = ({
  isExporting,
  onGeneratePreview,
  book,
  exportUrl,
}: {
  isExporting: boolean;
  onGeneratePreview: () => void;
  book: BookWithChapters;
  exportUrl: string | null;
}) => (
  <div className="flex justify-end space-x-4 pt-4 border-t">
    <Button 
      variant="outline" 
      onClick={onGeneratePreview}
      disabled={isExporting}
    >
      {isExporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : 'Generate Preview'}
    </Button>
    
    <EpubPublishExport 
      book={book} 
      isReady={!!exportUrl && !isExporting}
      exportUrl={exportUrl}
    />
  </div>
);

export default function EpubPublishPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug || '';
  const { data: book, isLoading, error } = useGetBookBySlug(slug || '');
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [epubOptions, setEpubOptions] = useState({
    includeToc: true,
    includeImprint: true,
    style: 'default' as 'default' | 'modern',
  });

  const handleGeneratePreview = useCallback(async () => {
    if (!slug) return;
    
    setIsExporting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExportUrl(`/api/books/${slug}/export/epub`);
    } finally {
      setIsExporting(false);
    }
  }, [slug]);

  // Handle loading and error states
  if (isLoading) return <LoadingState />;
  if (error || !book) return <ErrorState error={error || undefined} />;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <PageHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4">Book Information</h2>
              <SingleBookView book={book} />
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-lg font-semibold mb-4">ePub Options</h2>
              <EpubOptions 
                includeToc={epubOptions.includeToc}
                includeImprint={epubOptions.includeImprint}
                style={epubOptions.style}
                onTocChange={(includeToc) => setEpubOptions(prev => ({ ...prev, includeToc }))}
                onImprintChange={(includeImprint) => setEpubOptions(prev => ({ ...prev, includeImprint }))}
                onStyleChange={(style) => setEpubOptions(prev => ({ ...prev, style }))}
              />
            </div>

            <div className="bg-card p-6 rounded-lg border">
              <ChapterSelection book={book} />
            </div>
          </div>

          <ActionButtons 
            isExporting={isExporting}
            onGeneratePreview={handleGeneratePreview}
            book={book}
            exportUrl={exportUrl}
          />
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Preview</h2>
            <EpubPublishPreview book={book} />
          </div>
        </div>
      </div>
    </div>
  );
}
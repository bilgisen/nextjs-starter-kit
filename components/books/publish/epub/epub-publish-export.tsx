'use client';

import { useState } from 'react';
import type { Book } from '@/types/book';
import type { BookWithChapters } from '@/queries/books/get-book-by-slug';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

type EpubPublishExportProps = {
  book: Book | BookWithChapters;
  isReady: boolean;
  exportUrl: string | null;
};

export default function EpubPublishExport({ book, isReady, exportUrl }: EpubPublishExportProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!exportUrl) return;
    
    setIsDownloading(true);
    try {
      // In a real implementation, this would trigger the actual download
      // For now, we'll simulate a download with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create a temporary link to trigger the download
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = `${book.title.toLowerCase().replace(/\s+/g, '-')}.epub`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      // You might want to show an error toast here
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button 
      onClick={handleDownload}
      disabled={!isReady || isDownloading}
      className="min-w-[180px]"
    >
      {isDownloading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Preparing...
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          Download EPUB
        </>
      )}
    </Button>
  );
}
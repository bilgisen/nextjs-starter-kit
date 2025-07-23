'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookWithChapters } from '@/queries/books/get-book-by-slug';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, RefreshCw, X } from 'lucide-react';


type EpubPublishPreviewProps = {
  book: BookWithChapters;
};

export default function EpubPublishPreview({ book }: EpubPublishPreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  
  const handleRefreshPreview = () => {
    setIsGenerating(true);
    // Generate preview content with a small delay
    setTimeout(() => {
      setPreviewContent(generatePreviewContent());
      setIsGenerating(false);
    }, 300);
  };

  const generatePreviewContent = () => {
    // Format the publication date
    const pubDate = book.publish_year ? new Date(book.publish_year, 0, 1).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    
    // Generate chapters HTML
    const chaptersHtml = book.chapters?.map((chapter, index) => {
      return `
        <h2 id="chapter-${index + 1}">${chapter.title}</h2>
        <div class="chapter-content">
          ${chapter.content.split('\n').map(para => `<p>${para}</p>`).join('\n')}
        </div>
      `;
    }).join('\n');

    return `
      <!DOCTYPE html>
      <html lang="${book.language || 'en'}">
      <head>
        <meta charset="UTF-8">
        <title>${book.title}</title>
        <meta name="author" content="${book.author || 'Unknown Author'}">
        <meta name="language" content="${book.language || 'en'}">
        ${book.publisher ? `<meta name="publisher" content="${book.publisher}">` : ''}
        ${book.isbn ? `<meta name="isbn" content="${book.isbn}">` : ''}
        ${book.description ? `<meta name="description" content="${book.description}">` : ''}
        <meta name="date" content="${pubDate}">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 2rem; }
          h1 { color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
          h2 { color: #2c5282; margin-top: 2rem; }
          .chapter-content { margin: 1rem 0; }
          blockquote { border-left: 4px solid #cbd5e0; padding-left: 1rem; margin: 1.5rem 0; color: #4a5568; }
          em { font-style: italic; }
          strong { font-weight: 600; }
          img { max-width: 100%; height: auto; border-radius: 0.25rem; }
        </style>
      </head>
      <body>
        <h1>${book.title}</h1>
        ${book.author ? `<h2>By ${book.author}</h2>` : ''}
        ${book.description ? `<p><em>${book.description}</em></p>` : ''}
        
        <hr>
        
        ${chaptersHtml}
      </body>
      </html>
    `;
  };

  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Preview</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRefreshPreview}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-1.5" />
            )}
            {isGenerating ? 'Generating...' : 'Preview'}
          </Button>
        </div>
      </CardHeader>
      

      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshPreview}
              disabled={isGenerating}
              className="mb-4"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Generate Preview
                </>
              )}
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <div className="pt-[150%] relative bg-muted/50">
              <div className="absolute inset-0 flex items-center justify-center">
                {book.cover_image_url ? (
                  <Image 
                    src={book.cover_image_url} 
                    alt={`Cover for ${book.title}`}
                    className="object-cover w-full h-full"
                    width={300}
                    height={450}
                    priority
                  />
                ) : (
                  <div className="text-muted-foreground text-sm text-center p-4">
                    No cover image
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">{book.title}</h3>
            {book.author && (
              <p className="text-sm text-muted-foreground">By {book.author}</p>
            )}
            {book.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {book.description}
              </p>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Format:</span>
              <span className="font-medium">EPUB 3.0</span>
            </div>
            <div className="flex justify-between">
              <span>Chapters:</span>
              <span className="font-medium">{book.chapters?.length || 0}</span>
            </div>
          </div>
          
          {previewContent && (
            <div className="mt-6 border rounded-lg overflow-hidden">
              <div className="bg-muted/50 p-3 border-b flex justify-between items-center">
                <h3 className="font-medium">Preview</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setPreviewContent(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close preview</span>
                </Button>
              </div>
              <div className="h-[600px] overflow-auto">
                <iframe 
                  srcDoc={previewContent} 
                  className="w-full h-full border-0"
                  title="Book Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
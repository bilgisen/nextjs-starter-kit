'use client';

import { useState, useEffect } from 'react';
// Removed unused useRouter import
import { toast } from 'sonner';
import { notFound, redirect } from 'next/navigation';
import { getBookBySlug } from "@/actions/books/get-book-by-slug";
import { buildBasePayload } from '@/lib/publish/buildPayload';
import { BooksMenu } from "@/components/books/books-menu";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { List, BookOpenText, Loader2 } from "lucide-react";
import type { Book } from "@/types/book";
import type { BookPayload } from '@/lib/publish/buildPayload';
import Image from 'next/image';

interface PublishOptions {
  generate_toc: boolean;
  include_imprint: boolean;
  toc_depth?: number;
}

export default function PublishEpubPage({ params }: { params: { slug: string } }) {
  // State management
  // Router removed as it's not being used
  const { slug } = params;
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [basePayload, setBasePayload] = useState<BookPayload | null>(null);
  const [options, setOptions] = useState<PublishOptions>({
    generate_toc: true,
    include_imprint: true,
    toc_depth: 3
  });

  // Load book data and build base payload
  useEffect(() => {
    if (!slug) {
      redirect('/dashboard/books');
      return;
    }

    const loadBookData = async () => {
      setIsLoading(true);
      try {
        const bookData = await getBookBySlug(slug);

        if (!bookData) {
          notFound();
          return;
        }

        const payload = await buildBasePayload(slug);
        setBasePayload(payload);
        setBook(bookData);
      } catch (error) {
        console.error('Error loading book data:', error);
        toast.error('Failed to load book data');
      } finally {
        setIsLoading(false);
      }
    };

    loadBookData();
  }, [slug]);

  const handleOptionChange = (key: keyof PublishOptions, value: boolean) => {
    setOptions(prev => {
      const newOptions = { ...prev, [key]: value };
      
      // If TOC is disabled, remove toc_depth
      if (key === 'generate_toc' && !value) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { toc_depth, ...rest } = newOptions;
        return rest as PublishOptions;
      }
      
      // If TOC is enabled, ensure toc_depth is set
      if (key === 'generate_toc' && value) {
        return { ...newOptions, toc_depth: 3 };
      }
      
      return newOptions;
    });
  };

  const handlePublish = async () => {
    if (!book || !basePayload) {
      toast.error('Book data not loaded');
      return;
    }
    
    setIsPublishing(true);
    
    try {
      // Create the final payload with options
      const payload = {
        options: {
          ...options,
          output_format: 'epub',
          embed_metadata: true,
          cover: !!(book.cover_image_url || book.coverImageUrl),
        }
      };

      console.log('Sending payload to API:', payload);
      
      // Call our API endpoint to trigger GitHub Actions workflow
      const response = await fetch(`/api/books/${slug}/publish/epub`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to start EPUB generation');
      }

      // Log the workflow details for debugging
      console.log('GitHub Actions workflow triggered:', result.workflow_dispatch);
      
      // Show success message with workflow details
      toast.success('ePub generation started!', {
        description: `Workflow ${result.workflow_dispatch.workflow} has been queued.`
      });
      
      // You can add a link to view the workflow run in GitHub
      // For example: `https://github.com/${process.env.NEXT_PUBLIC_GITHUB_REPO}/actions`
      
    } catch (error) {
      console.error('Error triggering EPUB generation:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to start EPUB generation',
        {
          description: 'Please check the console for more details.'
        }
      );
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-red-600">
          Failed to load book data. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-muted-foreground">Publish EPUB:</span> {book.title}
          </h1>
          <p className="text-muted-foreground">
            Configure and generate your EPUB file
          </p>
        </div>
        <BooksMenu slug={slug} />
      </div>
      
      <Separator className="my-6" />
      
      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Main Area (2/3) */}
        <div className="md:w-2/3 space-y-6">
          {/* Book Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>Book Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-6">
                {/* Book Cover */}
                <div className="flex flex-col md:flex-row gap-6">
                  {(book.coverImageUrl || book.cover_image_url) && (
                    <div className="w-48 h-64 bg-muted rounded-md overflow-hidden flex-shrink-0 relative">
                      <Image
                        src={book.coverImageUrl || book.cover_image_url || ''}
                        alt={`${book.title} cover`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  )}
                    
                    {/* Book Details */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Title</h3>
                        <p className="mt-1">{book.title}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Author</h3>
                        <p className="mt-1">{book.author || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Publisher</h3>
                        <p className="mt-1">{book.publisher || 'Not specified'}</p>
                      </div>
                      
                      {book.isbn && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">ISBN</h3>
                          <p className="mt-1">{book.isbn}</p>
                        </div>
                      )}
                      
                      {(book.publish_year || book.published_date) && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Publish Year</h3>
                          <p className="mt-1">{book.publish_year || new Date(book.published_date || '').getFullYear() || 'Not specified'}</p>
                        </div>
                      )}
                      
                      {book.language && (
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground">Language</h3>
                          <p className="mt-1">{book.language}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Description */}
                  {book.description && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                      <div className="prose prose-sm max-w-none text-foreground">
                        {book.description}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payload Preview */}
            {basePayload && (
              <Card>
                <CardHeader>
                  <CardTitle>Payload Preview</CardTitle>
                  <CardDescription>
                    This is the data that will be sent to generate your EPUB
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="mt-2 p-4 bg-muted/50 dark:bg-muted/10 text-xs overflow-auto rounded-md max-h-96">
                    {JSON.stringify(
                      {
                        ...basePayload,
                        options: {
                          generate_toc: options.generate_toc,
                          include_imprint: options.include_imprint,
                          toc_depth: options.toc_depth,
                          output_format: 'epub',
                          embed_metadata: true,
                          cover: !!(book.cover_image_url || book.coverImageUrl),
                        },
                      },
                      null,
                      2
                    )}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Sidebar (1/3) */}
          <div className="md:w-1/3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>EPUB Publishing Options</CardTitle>
                <CardDescription>
                  Configure your EPUB export settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="generate_toc" 
                      name="generate_toc"
                      checked={options.generate_toc}
                      onCheckedChange={(checked) => handleOptionChange('generate_toc', checked as boolean)}
                      disabled={isPublishing}
                    />
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="generate_toc" className="font-medium">
                        Add Table of Contents
                      </Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="include_imprint" 
                      name="include_imprint"
                      checked={options.include_imprint}
                      onCheckedChange={(checked) => handleOptionChange('include_imprint', checked as boolean)}
                      disabled={isPublishing}
                    />
                    <div className="flex items-center gap-2">
                      <BookOpenText className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="include_imprint" className="font-medium">
                        Add Imprint Page
                      </Label>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-4">
                  <Button 
                    className="w-full" 
                    onClick={handlePublish}
                    disabled={isPublishing}
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      'Generate EPUB'
                    )}
                  </Button>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>These options will be included in your EPUB export.</p>
                    {!options.generate_toc && (
                      <p className="text-amber-600 dark:text-amber-400">
                        Note: Table of Contents is disabled
                      </p>
                    )}
                    {!options.include_imprint && (
                      <p className="text-amber-600 dark:text-amber-400">
                        Note: Imprint page is disabled
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
}

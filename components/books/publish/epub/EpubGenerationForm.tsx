'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { BookOpenText, RefreshCw } from 'lucide-react';
import Image from 'next/image';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Custom Components
import { PublishEpubButton } from './PublishEpubButton';
import { EpubGenerationStatus } from './EpubGenerationStatus';
import { ImprintPreview } from './ImprintPreview';

// Hooks
import { useEpubGeneration } from '@/queries/books/useEpubGeneration';

interface EpubGenerationFormProps {
  bookSlug: string;
  book: {
    title: string;
    coverImageUrl?: string | null;
    userId: string;
  };
  className?: string;
}

export function EpubGenerationForm({ bookSlug, book, className }: EpubGenerationFormProps) {
  // EPUB Generation Hook
  const {
    generateEpub,
    status,
    isGenerating,
    error,
  } = useEpubGeneration(bookSlug);

  // Form State
  const [options, setOptions] = useState({
    generate_toc: true,
    include_imprint: true,
    toc_depth: 3,
    output_format: 'epub' as const,
    embed_metadata: true,
    cover: !!book.coverImageUrl,
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await generateEpub(options);
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Failed to start EPUB generation');
    }
  };

  // Handle reset
  const handleReset = () => {
    // Reset the form state
    setOptions({
      generate_toc: true,
      include_imprint: true,
      toc_depth: 3,
      output_format: 'epub',
      embed_metadata: true,
      cover: !!book.coverImageUrl,
    });
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Options Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>EPUB Options</CardTitle>
              <CardDescription>
                Customize how your EPUB will be generated
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="generate_toc"
                      checked={options.generate_toc}
                      onCheckedChange={(checked) =>
                        setOptions({
                          ...options,
                          generate_toc: checked === true,
                        })
                      }
                      disabled={isGenerating}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="generate_toc" className="font-medium">
                        Generate Table of Contents
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically generate a table of contents from headings
                      </p>
                    </div>
                  </div>

                  {options.generate_toc && (
                    <div className="pl-8 space-y-2">
                      <Label htmlFor="toc_depth" className="text-sm font-medium">
                        TOC Depth: {options.toc_depth}
                      </Label>
                      <input
                        id="toc_depth"
                        type="range"
                        min="1"
                        max="6"
                        value={options.toc_depth}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            toc_depth: parseInt(e.target.value),
                          })
                        }
                        className="w-full"
                        disabled={isGenerating}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>H1 Only</span>
                        <span>H1-H6</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="include_imprint"
                      checked={options.include_imprint}
                      onCheckedChange={(checked) =>
                        setOptions({
                          ...options,
                          include_imprint: checked === true,
                        })
                      }
                      disabled={isGenerating}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="include_imprint" className="font-medium">
                        Include Imprint Page
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Add a page with book metadata and copyright information
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="embed_metadata"
                      checked={options.embed_metadata}
                      onCheckedChange={(checked) =>
                        setOptions({
                          ...options,
                          embed_metadata: checked === true,
                        })
                      }
                      disabled={isGenerating}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="embed_metadata" className="font-medium">
                        Embed Metadata
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Include book metadata in the EPUB file
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2 pt-2">
                    <Checkbox
                      id="cover"
                      checked={options.cover}
                      onCheckedChange={(checked) =>
                        setOptions({
                          ...options,
                          cover: checked === true,
                        })
                      }
                      disabled={status === 'generating' || !book.coverImageUrl}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="cover" className="font-medium">
                        Include Cover Image
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {book.coverImageUrl
                          ? 'Use the uploaded cover image'
                          : 'No cover image available. Upload a cover in the Book Settings.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <PublishEpubButton
                    bookSlug={bookSlug}
                    options={options}
                    className="w-full"
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Book Preview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Book Preview</CardTitle>
                  <CardDescription>{book.title}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    disabled={isGenerating}
                  >
                    <RefreshCw
                      className={cn(
                        'mr-2 h-4 w-4',
                        isGenerating && 'animate-spin'
                      )}
                    />
                    Reset
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md bg-muted/50 p-6 min-h-[400px] flex items-center justify-center">
                {book.coverImageUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={book.coverImageUrl}
                      alt={`Cover of ${book.title}`}
                      className="object-contain w-full h-full"
                      width={400}
                      height={600}
                      priority
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-2 text-muted-foreground">
                    <BookOpenText className="mx-auto h-12 w-12" />
                    <p>No cover image available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Generation Status */}
          <EpubGenerationStatus
            status={isGenerating ? 'generating' : error ? 'error' : 'idle'}
            progress={isGenerating ? 50 : 100}
            error={error?.message || null}
          />
        </div>
      </div>

      {/* Imprint Preview */}
      {options.include_imprint && (
        <div className="mt-6">
          <ImprintPreview
            includeImprint={options.include_imprint}
            onIncludeImprintChange={(include) =>
              setOptions({ ...options, include_imprint: include })
            }
          />
        </div>
      )}
    </div>
  );
}

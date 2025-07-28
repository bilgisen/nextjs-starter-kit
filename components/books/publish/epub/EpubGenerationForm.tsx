'use client';

import { useState } from 'react';
import { toast } from 'sonner';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// Book Components
import { SingleBookView } from '@/components/books/single-book-view';

// Custom Components
import { PublishEpubButton } from './PublishEpubButton';
import { EpubGenerationStatus } from './EpubGenerationStatus';
import { ImprintPreview } from './ImprintPreview';

// Hooks
import { useEpubGeneration } from '@/queries/books/useEpubGeneration';

import type { Book } from '@/types/book';

interface EpubGenerationFormProps {
  bookSlug: string;
  book: Book & {
    coverImageUrl?: string | null;
  };
  className?: string;
}

export function EpubGenerationForm({ bookSlug, book: propBook, className }: EpubGenerationFormProps) {
  // Log book data for debugging
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('Book data in EpubGenerationForm:', propBook);
  }
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
    // Use the cover image URL if available, otherwise use an empty string
    cover: propBook.coverImageUrl || propBook.cover_image_url || propBook.coverImage || '',
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare the options object with all required fields
    const submissionOptions = {
      generate_toc: Boolean(options.generate_toc),
      include_imprint: Boolean(options.include_imprint),
      toc_depth: Number(options.toc_depth) || 3,
      output_format: 'epub' as const,
      embed_metadata: Boolean(options.embed_metadata),
      cover: Boolean(options.cover), // Convert to boolean as expected by the type
      // Include metadata directly in the options
      metadata: {
        title: propBook.title,
        author: propBook.author,
        language: propBook.language || 'en',
      },
    };

    console.log('Submitting EPUB generation with options:', JSON.stringify(submissionOptions, null, 2));
    
    try {
      await generateEpub(submissionOptions);
    } catch (err) {
      console.error('Generation error:', err);
      toast.error('Failed to start EPUB generation');
    }
  };

  // Handle reset functionality has been removed as it's no longer used in the UI

  return (
    <div className={cn('space-y-6', className)}>
      {/* Top Section: Book Info and EPUB Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Book Info (2/3) */}
        <div className="lg:col-span-2">

              <SingleBookView 
                book={{
                  id: propBook.id,
                  userId: propBook.user_id || propBook.userId || '',
                  user_id: propBook.user_id || propBook.userId || '',
                  title: propBook.title || '',
                  slug: propBook.slug || '',
                  author: propBook.author || '',
                  publisher: propBook.publisher || '',
                  description: propBook.description || null,
                  isbn: propBook.isbn || null,
                  publish_year: propBook.publish_year || null,
                  language: propBook.language || null,
                  cover_image_url: propBook.coverImageUrl || propBook.cover_image_url || propBook.coverImage || null,
                  created_at: propBook.created_at || new Date().toISOString(),
                  updated_at: propBook.updated_at || new Date().toISOString()
                }} 
              />
          <br/>

              {options.include_imprint ? (
                <div className="prose max-w-none">
                  <ImprintPreview 
                    includeImprint={options.include_imprint}
                    onIncludeImprintChange={(include) =>
                      setOptions({ ...options, include_imprint: include })
                    }
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Imprint preview is disabled</p>
                  <p className="text-sm">Enable the imprint option to see the preview</p>
                </div>
              )}

        </div>

        {/* Right Column: EPUB Options (1/3) */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>EPUB Options</CardTitle>
              <CardDescription>
                Customize your EPUB settings
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
                      checked={!!options.cover}
                      onCheckedChange={(checked) => {
                        const hasCover = propBook.coverImageUrl || propBook.cover_image_url || propBook.coverImage;
                        setOptions({
                          ...options,
                          cover: checked && hasCover ? (propBook.coverImageUrl || propBook.cover_image_url || propBook.coverImage || '') : '',
                        });
                      }}
                      disabled={status === 'generating' || !(propBook.coverImageUrl || propBook.cover_image_url || propBook.coverImage)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="cover" className="font-medium">
                        Include Cover Image
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {(propBook.coverImageUrl || propBook.cover_image_url || propBook.coverImage)
                          ? 'Use the uploaded cover image'
                          : 'No cover image available. Upload a cover in the Book Settings.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <PublishEpubButton
                    bookSlug={propBook.slug}
                    options={options}
                    className="w-full"
                  />
                </div>
              </form>
            </CardContent>
          </Card>
          <EpubGenerationStatus
            status={isGenerating ? 'generating' : error ? 'error' : 'idle'}
            progress={isGenerating ? 50 : 100}
            error={error?.message || null}
          />
        </div>
      </div>
    </div>
  );
};

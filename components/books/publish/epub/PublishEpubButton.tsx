'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Download, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEpubGeneration } from '@/queries/books/useEpubGeneration';

interface PublishEpubButtonProps {
  bookSlug: string;
  options: {
    generate_toc: boolean;
    include_imprint: boolean;
    toc_depth?: number;
    embed_metadata: boolean;
    cover: boolean;
  };
  className?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
}

export function PublishEpubButton({
  bookSlug,
  options,
  className,
  variant = 'default',
  size = 'default',
  showIcon = true,
}: PublishEpubButtonProps) {
  const { generateEpub, downloadEpub, status, progress, error, downloadUrl } =
    useEpubGeneration(bookSlug);

  const handleClick = async () => {
    if (status === 'success' && downloadUrl) {
      downloadEpub(`${bookSlug}.epub`);
    } else {
      await generateEpub(options);
    }
  };

  const getButtonText = () => {
    if (status === 'generating') return `Generating${progress ? ` (${progress}%)` : ''}`;
    if (status === 'success') return 'Download EPUB';
    if (status === 'error') return 'Try Again';
    return 'Generate EPUB';
  };

  const getButtonIcon = () => {
    if (status === 'generating') {
      return <Loader2 className={cn('h-4 w-4 animate-spin', size === 'sm' ? 'mr-1' : 'mr-2')} />;
    }
    if (status === 'success') {
      return <Download className={cn('h-4 w-4', size === 'sm' ? 'mr-1' : 'mr-2')} />;
    }
    if (status === 'error') {
      return <RefreshCw className={cn('h-4 w-4', size === 'sm' ? 'mr-1' : 'mr-2')} />;
    }
    return showIcon ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(size === 'sm' ? 'mr-1' : 'mr-2')}
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ) : null;
  };

  return (
    <Button
      onClick={handleClick}
      disabled={status === 'generating'}
      variant={variant}
      size={size}
      className={cn('transition-all', className)}
    >
      {getButtonIcon()}
      {getButtonText()}
    </Button>
  );
}
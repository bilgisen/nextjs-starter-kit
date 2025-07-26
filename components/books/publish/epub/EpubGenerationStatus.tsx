'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EpubGenerationStatusProps {
  status: 'idle' | 'generating' | 'success' | 'error';
  progress: number | null;
  error: string | null;
  className?: string;
}

export function EpubGenerationStatus({
  status,
  progress,
  error,
  className,
}: EpubGenerationStatusProps) {
  if (status === 'idle') return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'generating':
        return {
          title: 'Generating EPUB',
          description: 'Your EPUB is being generated. This may take a moment...',
          icon: (
            <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
          ),
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
        };
      case 'success':
        return {
          title: 'Ready to Download',
          description: 'Your EPUB has been generated successfully!',
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
        };
      case 'error':
        return {
          title: 'Generation Failed',
          description: 'An error occurred while generating your EPUB.',
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <div
            className={cn(
              'rounded-full p-1.5',
              config.bgColor,
              config.color
            )}
          >
            {config.icon}
          </div>
          <CardTitle className={cn('text-lg', config.color)}>
            {config.title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-4">
          {config.description}
        </p>
        
        {status === 'generating' && progress !== null && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {status === 'error' && error && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

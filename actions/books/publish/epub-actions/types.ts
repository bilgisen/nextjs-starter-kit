import type { EpubGenerationRequest, EpubBuildStatus } from '@/types/epub';

export type { EpubGenerationRequest, EpubBuildStatus };

export interface PrepareEpubGenerationResult {
  bookId: string;
  bookSlug: string;
  chapters: any[]; // Replace with proper chapter type
  metadata: {
    title: string;
    author: string;
    description?: string;
    language: string;
    publishedDate?: string;
    rights: string;
  };
  defaultOptions: EpubGenerationRequest['options'];
}

export interface GenerateEpubResult {
  success: boolean;
  requestId: string;
  message: string;
}

export interface DownloadEpubResult {
  downloadUrl: string;
  filename: string;
}

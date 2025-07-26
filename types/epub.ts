// Types for EPUB generation and publishing

export interface EpubChapter {
  id: string;
  title: string;
  content: string;
  order: number;
  slug: string;
  wordCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface EpubMetadata {
  title: string;
  author: string;
  language: string;
  publisher?: string;
  description?: string;
  isbn?: string;
  coverImageUrl?: string;
  publishedDate?: string;
  rights?: string;
  tags?: string[];
}

export interface EpubOptions {
  includeToc: boolean;
  includeImprint: boolean;
  includeCover: boolean;
  includeMetadata: boolean;
  splitChapters: boolean;
  format: 'epub2' | 'epub3';
  theme: 'light' | 'dark' | 'sepia';
  fontSize: number;
  lineHeight: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface EpubGenerationRequest {
  bookId: string;
  bookSlug: string;
  chapters: EpubChapter[];
  metadata: EpubMetadata;
  options: Partial<EpubOptions>;
}

export interface EpubGenerationResponse {
  success: boolean;
  message?: string;
  downloadUrl?: string;
  fileSize?: number;
  error?: string;
  requestId?: string;
  timestamp?: string;
}

export interface EpubBuildStatus {
  status: 'idle' | 'building' | 'success' | 'error';
  progress?: number;
  message?: string;
  error?: string;
  downloadUrl?: string;
  timestamp?: string;
}

export interface EpubPreviewProps {
  bookTitle: string;
  chapters: EpubChapter[];
  metadata: EpubMetadata;
  options: EpubOptions;
  className?: string;
}

export interface EpubOptionsFormProps {
  defaultValues?: Partial<EpubOptions>;
  onSubmit: (options: EpubOptions) => void;
  isGenerating?: boolean;
  className?: string;
}

export interface EpubStatusToastProps {
  status: EpubBuildStatus;
  onDismiss: () => void;
}

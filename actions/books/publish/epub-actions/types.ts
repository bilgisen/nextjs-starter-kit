import type { Book } from '@/types/book';

export interface PublishOptions {
  generate_toc: boolean;
  include_imprint: boolean;
  toc_depth?: number;
  output_format: 'epub';
  embed_metadata: boolean;
  cover: boolean;
}

export interface GenerationResponse {
  success: boolean;
  workflow_dispatch?: {
    id: string;
    workflow: string;
    status: string;
    created_at: string;
    html_url: string;
  };
  error?: string;
  details?: any;
}

export interface GenerationStatus {
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  conclusion?: 'success' | 'failure' | 'cancelled' | 'skipped';
  created_at: string;
  updated_at: string;
  html_url: string;
  workflow_name: string;
  logs_url?: string;
  artifacts?: Array<{
    id: number;
    name: string;
    size_in_bytes: number;
    url: string;
    archive_download_url: string;
    expired: boolean;
    created_at: string;
    updated_at: string;
  }>;
}

export interface DownloadResult {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  error?: string;
}

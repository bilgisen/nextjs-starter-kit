import { JSONContent } from '@tiptap/core';
import { generateHTML } from '@tiptap/html';
import { extensions } from './extensions';

/**
 * Processes TipTap JSON content into clean markdown for publishing
 */
export function processTiptapContent(content: JSONContent | string): string {
  try {
    // If content is already a string, return as is
    if (typeof content === 'string') {
      return content.trim();
    }

    // If content is empty or invalid, return empty string
    if (!content || (Array.isArray(content.content) && content.content.length === 0)) {
      return '';
    }

    // Convert TipTap JSON to HTML
    const html = generateHTML(content, extensions);
    
    // Clean up HTML before converting to markdown
    // (Pandoc will handle the HTML to markdown conversion)
    return html.trim();
  } catch (error) {
    console.error('Error processing TipTap content:', error);
    return '';
  }
}

/**
 * Validates TipTap content structure
 */
export function isValidTiptapContent(content: unknown): content is JSONContent {
  if (!content || typeof content !== 'object') return false;
  
  const obj = content as Record<string, unknown>;
  return (
    (obj.type === 'doc' || obj.type === undefined) &&
    (obj.content === undefined || Array.isArray(obj.content))
  );
}

/**
 * Processes chapters content before publishing
 */
export function processChaptersContent(chapters: Array<{
  id: string;
  title: string;
  content: unknown;
  order: number;
}>): Array<{
  id: string;
  title: string;
  content: string;
  order: number;
}> {
  return chapters
    .sort((a, b) => a.order - b.order)
    .map(chapter => ({
      ...chapter,
      content: isValidTiptapContent(chapter.content) 
        ? processTiptapContent(chapter.content)
        : String(chapter.content || '').trim()
    }));
}

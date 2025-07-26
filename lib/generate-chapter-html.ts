// lib/generate-chapter-html.ts
import { ChapterWithChildren } from "@/types/chapter";

interface ChapterWithFootnotes extends ChapterWithChildren {
  footnotes?: Record<string, string>;
}

interface GenerateChapterHtmlOptions {
  chapter: ChapterWithChildren;
  bookTitle: string;
  bookSlug: string;
  baseImageUrl?: string;
  baseUrl?: string;
}

export function generateChapterHtml(options: GenerateChapterHtmlOptions): string {
  const { 
    chapter, 
    bookTitle, 
    bookSlug, 
    baseImageUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '',
    baseUrl = "/api/books"
  } = options;
  
  const headingLevel = Math.min(6, Math.max(2, (chapter.level || 1) + 1));
  const headingTag = `h${headingLevel}`;

  // Process content
  let processedContent = chapter.content || '';
  
  // Process images
  processedContent = processedContent.replace(
    /<img([^>]+)alt="([^"]*)"([^>]*)>/g,
    (match, p1, alt, p2) => {
      const srcMatch = match.match(/src="([^"]*)"/);
      const src = srcMatch ? srcMatch[1] : '';
      const finalSrc = src.startsWith('/') ? `${baseImageUrl}${src}` : src;
      
      return `
        <figure>
          <img src="${finalSrc}" alt="${alt}" ${p1} ${p2}>
          ${alt ? `<figcaption>${alt}</figcaption>` : ''}
        </figure>
      `;
    }
  );
  
  // Process footnotes
  const footnoteRefs: string[] = [];
  processedContent = processedContent.replace(
    /\[\^(\d+)\]/g,
    (match, id) => {
      footnoteRefs.push(id);
      return `<sup><a href="#fn${id}" class="footnote-ref" id="ref${id}">${id}</a></sup>`;
    }
  );
  
  // Generate footnotes section
  let footnotesSection = '';
  if (footnoteRefs.length > 0) {
    const footnotesList = [...new Set(footnoteRefs)]
      .map(id => `
        <li id="fn${id}">
          ${(chapter as ChapterWithFootnotes).footnotes?.[id] || `Footnote ${id}`}
          <a href="#ref${id}" title="Back to content" class="footnote-back">↩</a>
        </li>
      `)
      .join('\n');
    
    footnotesSection = `
      <section class="footnotes" id="footnotes">
        <h4>Footnotes</h4>
        <ol>${footnotesList}</ol>
      </section>
    `;
  }

  // Generate navigation
  let navigation = '';
  if (chapter.parent_chapter_id) {
    const parentFilename = `${chapter.parent_chapter_id}-${String(chapter.parent_chapter?.order || 0).padStart(3, '0')}.html`;
    navigation += `<a href="${baseUrl}/${bookSlug}/chapters/${parentFilename}" class="nav-link">↑ Parent Chapter</a> | `;
  }
  
  if (chapter.children_chapters?.length) {
    const firstChild = chapter.children_chapters[0];
    const childFilename = `${firstChild.id}-${String(firstChild.order || 0).padStart(3, '0')}.html`;
    navigation += `<a href="${baseUrl}/${bookSlug}/chapters/${childFilename}" class="nav-link">Next: ${firstChild.title} →</a>`;
  }

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="book" content="${bookSlug}" />
    <meta name="chapter_id" content="${chapter.id}" />
    <meta name="parent_chapter" content="${chapter.parent_chapter_id || ''}" />
    <meta name="order" content="${chapter.order || 0}" />
    <meta name="level" content="${chapter.level || 1}" />
    <meta name="title_tag" content="${headingTag}" />
    <meta name="title" content="${chapter.title}" />
    <title>${chapter.title} | ${bookTitle}</title>
    <style>
      body {
        font-family: serif;
        font-size: 1rem;
        line-height: 1.6;
        margin: 2em auto;
        max-width: 800px;
        padding: 0 1em;
      }
      .chapter-navigation {
        margin-bottom: 2em;
        padding-bottom: 1em;
        border-bottom: 1px solid #eee;
        font-size: 0.9em;
      }
      .nav-link {
        color: #3b82f6;
        text-decoration: none;
        margin-right: 1em;
      }
      .nav-link:hover { text-decoration: underline; }
      ${headingTag} {
        border-bottom: 1px solid #eee;
        padding-bottom: 0.3em;
      }
      figure { margin: 2em 0; text-align: center; }
      img { max-width: 100%; height: auto; border-radius: 4px; }
      figcaption { font-size: 0.9em; color: #666; margin-top: 0.5em; }
      .footnotes {
        margin-top: 3em;
        font-size: 0.9em;
        border-top: 1px solid #eee;
        padding-top: 1em;
        color: #666;
      }
      .footnotes ol { padding-left: 1.5em; }
      .footnotes li { margin-bottom: 0.5em; position: relative; }
      .footnote-ref {
        vertical-align: super;
        font-size: 0.8em;
        text-decoration: none;
        color: #3b82f6;
        margin: 0 1px;
      }
      .footnote-back {
        margin-left: 0.5em;
        text-decoration: none;
        color: #666;
        font-size: 0.9em;
      }
      @media (max-width: 640px) {
        body { margin: 1em; font-size: 0.95rem; }
        figure { margin: 1.5em -1em; }
      }
    </style>
  </head>
  <body>
    ${navigation ? `<nav class="chapter-navigation">${navigation}</nav>` : ''}
    
    <${headingTag} id="${chapter.id}">${chapter.title}</${headingTag}>

    <div class="content">
      ${processedContent}
    </div>

    ${footnotesSection}
  </body>
</html>`;
}
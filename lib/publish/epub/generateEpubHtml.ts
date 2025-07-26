import { EpubChapter, EpubOptions, EpubMetadata } from '@/types/epub';

/**
 * Escapes HTML special characters to prevent XSS and ensure valid HTML
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates the main HTML content for the EPUB following the provided template
 * @param chapters Array of book chapters
 * @param metadata Book metadata
 * @param options EPUB generation options
 * @returns HTML string with the complete book content
 */
export function generateEpubHtml(
  chapters: EpubChapter[],
  metadata: EpubMetadata,
  options: Pick<EpubOptions, 'includeToc' | 'includeImprint' | 'includeCover' | 'theme' | 'format'>
): string {
  const { includeToc, includeImprint, includeCover, theme = 'light', format = 'epub3' } = options;
  const isEpub3 = format === 'epub3';
  const lang = metadata.language || 'en';
  
  const htmlParts: string[] = [
    `<!DOCTYPE html>`,
    `<html lang="${lang}"${isEpub3 ? ' epub:prefix="z3998: http://www.daisy.org/z3998/2012/vocab/structure/#"' : ''}${isEpub3 ? ' xml:lang="' + lang + '"' : ''}>`,
    `<head>`,
    `  <meta charset="UTF-8" />`,
    `  <title>${escapeHtml(metadata.title || 'Untitled')}</title>`,
    `  <meta name="title" content="${escapeHtml(metadata.title || 'Untitled')}" />`,
    `  <meta name="author" content="${escapeHtml(metadata.author || 'Unknown Author')}" />`,
    `  <meta name="publisher" content="${escapeHtml(metadata.publisher || '')}" />`,
    `  <meta name="language" content="${lang}" />`,
    `  <meta name="description" content="${escapeHtml(metadata.description || '')}" />`,
  ];

  // Add additional metadata if available
  if (metadata.isbn) {
    htmlParts.push(`  <meta name="identifier" content="urn:isbn:${escapeHtml(metadata.isbn)}" />`);
  }
  
  if (metadata.rights) {
    htmlParts.push(`  <meta name="rights" content="${escapeHtml(metadata.rights)}" />`);
  }
  
  if (metadata.publishedDate) {
    htmlParts.push(`  <meta name="date" content="${escapeHtml(metadata.publishedDate)}" />`);
  }
  
  if (metadata.coverImageUrl) {
    htmlParts.push(`  <meta property="og:image" content="${escapeHtml(metadata.coverImageUrl)}" />`);
  }

  // Add CSS link and close head
  htmlParts.push(
    `  <link rel="stylesheet" type="text/css" href="styles/epub.css" />`,
    `</head>`,
    `<body data-theme="${theme}" ${includeToc ? 'data-include-toc="true"' : ''} ${includeImprint ? 'data-include-imprint="true"' : ''}>`
  );

  // Add cover page if enabled
  if (includeCover && metadata.coverImageUrl) {
    htmlParts.push(
      `  <!-- COVER -->`,
      `  <section id="cover" ${isEpub3 ? 'epub:type="cover"' : ''} style="text-align:center; margin-bottom: 2em;">`,
      `    <img src="${escapeHtml(metadata.coverImageUrl)}" alt="${escapeHtml(metadata.title || 'Cover')}" style="max-width: 100%; height: auto;" />`,
      `  </section>`
    );
  }

  // Add imprint if enabled
  if (includeImprint) {
    const isTurkish = lang.startsWith('tr');
    htmlParts.push(
      `  <!-- IMPRINT -->`,
      `  <section id="imprint" ${isEpub3 ? 'epub:type="imprint"' : ''}>`,
      `    <h1>${escapeHtml(metadata.title || 'Untitled')}</h1>`,
      `    <p><strong>${isTurkish ? 'Yazar:' : 'Author:'}</strong> ${escapeHtml(metadata.author || '')}</p>`
    );
    
    if (metadata.isbn) {
      htmlParts.push(`    <p><strong>ISBN:</strong> ${escapeHtml(metadata.isbn)}</p>`);
    }
    
    if (metadata.publisher) {
      htmlParts.push(`    <p><strong>${isTurkish ? 'Yayınevi:' : 'Publisher:'}</strong> ${escapeHtml(metadata.publisher)}</p>`);
    }
    
    if (metadata.publishedDate) {
      const year = new Date(metadata.publishedDate).getFullYear() || metadata.publishedDate;
      htmlParts.push(`    <p><strong>${isTurkish ? 'Yayın Yılı:' : 'Publication Year:'}</strong> ${year}</p>`);
    }
    
    htmlParts.push(
      `    <p><strong>${isTurkish ? 'Dil:' : 'Language:'}</strong> ${lang}</p>`
    );
    
    if (metadata.description) {
      htmlParts.push(
        `    <p><strong>${isTurkish ? 'Açıklama:' : 'Description:'}</strong> ${escapeHtml(metadata.description)}</p>`
      );
    }
    
    htmlParts.push(`  </section>`);
  }

  // Add table of contents if enabled and there are chapters
  if (includeToc && chapters.length > 0) {
    const isTurkish = lang.startsWith('tr');
    htmlParts.push(
      `  <!-- TABLE OF CONTENTS -->`,
      `  <nav id="toc" ${isEpub3 ? 'epub:type="toc"' : ''}>`,
      `    <h2>${isTurkish ? 'İçindekiler' : 'Table of Contents'}</h2>`,
      `    <ol>`
    );

    chapters.forEach((chapter, index) => {
      htmlParts.push(
        `      <li><a href="#chapter-${index + 1}">${escapeHtml(chapter.title || `Chapter ${index + 1}`)}</a></li>`
      );
    });

    htmlParts.push(
      `    </ol>`,
      `  </nav>`
    );
  }

  // Add chapters content
  chapters.forEach((chapter, index) => {
    const chapterId = `chapter-${index + 1}`;
    htmlParts.push(
      `  <!-- CHAPTER ${index + 1} -->`,
      `  <section id="${chapterId}" ${isEpub3 ? 'epub:type="chapter"' : ''}>`,
      `    <h2>${escapeHtml(chapter.title || `Chapter ${index + 1}`)}</h2>`,
      `    <div class="content">`,
      `      ${chapter.content}`,
      `    </div>`
    );

    // Add footnotes section if present
    if (chapter.footnotes && chapter.footnotes.length > 0) {
      htmlParts.push(
        `    <!-- FOOTNOTES FOR CHAPTER ${index + 1} -->`,
        `    <section id="footnotes-${index + 1}" ${isEpub3 ? 'epub:type="footnotes"' : ''}>`,
        `      <hr />`,
        `      <ol>`
      );
      
      chapter.footnotes.forEach((note, noteIndex) => {
        htmlParts.push(
          `        <li id="fn-${index + 1}-${noteIndex + 1}">`,
          `          ${note.content} <a href="#fnref-${index + 1}-${noteIndex + 1}" class="footnote-backref">↩</a>`,
          `        </li>`
        );
      });
      
      htmlParts.push(
        `      </ol>`,
        `    </section>`
      );
    }
    
    htmlParts.push(`  </section>`);
  });

  // Close HTML
  htmlParts.push(
    `</body>`,
    `</html>`
  );

  return htmlParts.join('\n');
}

/**
 * Generates CSS for the EPUB
 * @param options Styling options
 * @returns CSS string
 */
export function generateEpubCss(
  options: Pick<EpubOptions, 'fontSize' | 'lineHeight' | 'margins' | 'theme'>
): string {
  const baseFontSize = options.fontSize || 16;
  const lineHeight = options.lineHeight || 1.6;
  const { top = 72, right = 72, bottom = 72, left = 72 } = options.margins || {};

  return `
    /* Base styles */
    body {
      font-family: serif;
      font-size: ${baseFontSize}px;
      line-height: ${lineHeight};
      margin: 0;
      padding: 0;
      text-align: justify;
      -epub-hyphens: auto;
      -webkit-hyphens: auto;
      hyphens: auto;
    }

    /* Page margins */
    @page {
      margin: ${top}pt ${right}pt ${bottom}pt ${left}pt;
    }

    /* Theme variations */
    body.light {
      background-color: #ffffff;
      color: #333333;
    }

    body.dark {
      background-color: #1a1a1a;
      color: #e0e0e0;
    }

    body.sepia {
      background-color: #f4ecd8;
      color: #5b4636;
    }

    /* Headings */
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      text-align: left;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }

    h1 { font-size: 1.8em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.3em; }

    /* Links */
    a {
      color: inherit;
      text-decoration: none;
    }

    /* Cover page */
    .cover-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
    }

    .cover-page h1 {
      font-size: 2.5em;
      margin-bottom: 0.5em;
    }

    .cover-page .author {
      font-size: 1.5em;
      font-style: italic;
    }

    /* Table of contents */
    #toc {
      page-break-after: always;
    }

    #toc ol {
      list-style-type: none;
      padding-left: 1em;
    }

    #toc li {
      margin: 0.5em 0;
    }

    /* Chapter styling */
    .chapter {
      page-break-before: always;
    }

    .chapter .content {
      margin-top: 1em;
    }

    /* Imprint */
    .imprint {
      page-break-before: always;
      font-size: 0.9em;
      text-align: center;
      margin-top: 3em;
    }

    /* Utility classes */
    .center {
      text-align: center;
    }

    .right {
      text-align: right;
    }

    .page-break {
      page-break-before: always;
    }
  `;
}

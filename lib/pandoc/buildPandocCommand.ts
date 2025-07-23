import path from 'path';

type PandocFormat = 'epub' | 'pdf' | 'docx' | 'html' | 'mobi';

interface BookMetadata {
  title: string;
  author: string;
  language: string;
  coverImage?: string;
}

interface PandocOptions {
  format: PandocFormat;
  includeToc: boolean;
  includeImprint: boolean;
  splitByChapters: boolean;
  applyStyles: boolean;
  theme: string;
  pageSize?: string;
  margins?: string;
  embedFonts?: boolean;
  includeCss?: string;
  [key: string]: string | boolean | undefined;
}

/**
 * Builds a Pandoc command string based on the provided options
 */
export function buildPandocCommand(
  inputFiles: string[],
  outputPath: string,
  book: BookMetadata,
  options: PandocOptions
): string {
  // Start with the basic command
  let cmd = 'pandoc';
  
  // Add input files
  cmd += ` ${inputFiles.map(f => `"${f}"`).join(' ')}`;
  
  // Set output file
  cmd += ` -o "${outputPath}"`;
  
  // Add metadata
  cmd += ` --metadata title="${escapeShellArg(book.title)}"`;
  cmd += ` --metadata author="${escapeShellArg(book.author)}"`;
  cmd += ` --metadata lang="${book.language || 'en'}"`;
  
  // Add table of contents if requested
  if (options.includeToc) {
    cmd += ' --toc --toc-depth=2';
  }
  
  // Set the output format based on the selected format
  switch (options.format) {
    case 'pdf':
      cmd += ' --pdf-engine=xelatex';
      
      // PDF specific options
      if (options.pageSize) {
        cmd += ` -V papersize=${options.pageSize}`;
      }
      
      // Set margins if specified
      if (options.margins) {
        const marginMap: Record<string, string> = {
          'Small': '0.5in',
          'Medium': '1in',
          'Large': '1.5in'
        };
        const margin = marginMap[options.margins] || '1in';
        cmd += ` -V geometry:margin=${margin}`;
      }
      
      // Add custom header/footer if needed
      if (options.includeHeader) {
        cmd += ' -V header-includes=\"\\usepackage{fancyhdr}\\pagestyle{fancy}\\fancyhf{}\\fancyhead[L]{\\leftmark}\\fancyfoot[C]{\\thepage}\\renewcommand{\\headrulewidth}{0.4pt}\\renewcommand{\\footrulewidth}{0.4pt}"';
      }
      
      break;
      
    case 'epub':
    case 'mobi':
      // Add cover image if available
      if (book.coverImage) {
        cmd += ` --epub-cover-image="${book.coverImage}"`;
      }
      
      // Add CSS if theming is enabled
      if (options.applyStyles && options.theme) {
        const cssPath = path.resolve(process.cwd(), 'public', 'styles', `${options.theme}.css`);
        cmd += ` --css="${cssPath}"`;
      }
      
      // Embed fonts if requested
      if (options.embedFonts) {
        cmd += ' --epub-embed-font="/usr/share/fonts/**/*.ttf"';
      }
      
      break;
      
    case 'docx':
      // Use a reference document if theming is enabled
      if (options.applyStyles && options.theme) {
        const docxTemplate = path.resolve(process.cwd(), 'public', 'templates', `${options.theme}.docx`);
        cmd += ` --reference-doc="${docxTemplate}"`;
      }
      break;
      
    case 'html':
      cmd += ' --standalone';
      
      // Add CSS if theming is enabled
      if (options.applyStyles && options.theme) {
        const cssPath = `/styles/${options.theme}.css`;
        if (options.includeCss === 'inline') {
          cmd += ' --self-contained';
        }
        cmd += ` --css="${cssPath}"`;
      }
      
      // Add responsive viewport
      cmd += ' -V include-before="<meta name=\\\"viewport\\\" content=\\\"width=device-width, initial-scale=1.0\\\">"';
      
      break;
  }
  
  // Add custom CSS if theming is enabled and format supports it
  if (options.applyStyles && options.theme && ['epub', 'html', 'pdf'].includes(options.format)) {
    const cssPath = path.resolve(process.cwd(), 'public', 'styles', `${options.theme}.css`);
    cmd += ` --css="${cssPath}"`;
  }
  
  // Add custom header for imprint if requested
  if (options.includeImprint) {
    const imprint = `
      <div class="imprint">
        <h1>${escapeHtml(book.title)}</h1>
        <p>By ${escapeHtml(book.author)}</p>
        <p>Published on ${new Date().toLocaleDateString()}</p>
        <p>© ${new Date().getFullYear()} ${escapeHtml(book.author)}. All rights reserved.</p>
      </div>
    `;
    cmd += ` --include-before-body="${escapeShellArg(imprint)}"`;
  }
  
  // Enable smart typography
  cmd += ' --smart';
  
  // Set the output format
  cmd += ` --to=${options.format}`;
  
  // Add verbose output for debugging
  cmd += ' --verbose';
  
  return cmd;
}

/**
 * Escapes a string for use in a shell command
 */
function escapeShellArg(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

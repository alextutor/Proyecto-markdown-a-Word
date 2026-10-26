import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

export interface WordToMarkdownResult {
  markdown: string;
  messages: string[];
}

/**
 * Converts a Microsoft Word (.docx) File or ArrayBuffer into clean GFM Markdown.
 * Preserves headings, bold, italics, strikethrough, tables, lists, blockquotes, links, and code.
 */
export async function convertDocxToMarkdown(file: File): Promise<WordToMarkdownResult> {
  const arrayBuffer = await file.arrayBuffer();

  // Map common Word styles to semantic HTML tags
  const styleMap = [
    "p[style-name='Title'] => h1:fresh",
    "p[style-name='Subtitle'] => h2:fresh",
    "p[style-name='Heading 1'] => h1:fresh",
    "p[style-name='Heading 2'] => h2:fresh",
    "p[style-name='Heading 3'] => h3:fresh",
    "p[style-name='Heading 4'] => h4:fresh",
    "p[style-name='Heading 5'] => h5:fresh",
    "p[style-name='Heading 6'] => h6:fresh",
    "p[style-name='Título 1'] => h1:fresh",
    "p[style-name='Título 2'] => h2:fresh",
    "p[style-name='Título 3'] => h3:fresh",
    "p[style-name='Título 4'] => h4:fresh",
    "p[style-name='Quote'] => blockquote > p:fresh",
    "p[style-name='Intense Quote'] => blockquote > p:fresh",
    "p[style-name='Cita'] => blockquote > p:fresh",
    "p[style-name='Cita destacada'] => blockquote > p:fresh",
    "p[style-name='Code'] => pre:separator('\\n')",
    "r[style-name='Code Char'] => code",
    "b => strong",
    "i => em",
    "strike => del",
  ];

  // Convert .docx to clean HTML using Mammoth
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap,
      // Avoid dumping enormous base64 image strings into the Markdown editor text;
      // replace embedded images with a clean descriptive Markdown image placeholder
      convertImage: mammoth.images.imgElement(async (image) => {
        const contentType = image.contentType || 'image/png';
        return {
          src: `imagen-extraida.${contentType.split('/')[1] || 'png'}`,
        };
      }),
    }
  );

  // Configure Turndown for clean GitHub Flavored Markdown (GFM)
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
  });

  // Enable GFM plugin (tables, strikethrough, taskListItems)
  turndownService.use(gfm);

  // Ensure tables from Word without explicit <thead> are converted properly into Markdown tables
  turndownService.addRule('wordTablesWithoutThead', {
    filter: (node) => {
      return (
        node.nodeName === 'TABLE' &&
        !node.querySelector('thead') &&
        Boolean(node.querySelector('tr'))
      );
    },
    replacement: (_content, node) => {
      const table = node as HTMLTableElement;
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length === 0) return '';

      const matrix: string[][] = rows.map((row) =>
        Array.from(row.querySelectorAll('th, td')).map((cell) => {
          const cellMarkdown = turndownService
            .turndown(cell.innerHTML)
            .replace(/\n+/g, ' ')
            .replace(/\|/g, '\\|')
            .trim();
          return cellMarkdown || ' ';
        })
      );

      const maxCols = Math.max(...matrix.map((r) => r.length), 1);
      const normalized = matrix.map((r) => {
        const copy = [...r];
        while (copy.length < maxCols) copy.push(' ');
        return copy;
      });

      const headerRow = normalized[0];
      const separatorRow = headerRow.map(() => '---');
      const bodyRows = normalized.slice(1);

      const formatRow = (r: string[]) => `| ${r.join(' | ')} |`;
      const lines = [
        formatRow(headerRow),
        formatRow(separatorRow),
        ...bodyRows.map(formatRow),
      ];

      return `\n\n${lines.join('\n')}\n\n`;
    },
  });

  let markdown = turndownService.turndown(result.value || '');

  // Clean up excessive blank lines
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  const messages = result.messages
    .filter((m) => m.type === 'warning')
    .map((m) => m.message);

  return {
    markdown,
    messages,
  };
}

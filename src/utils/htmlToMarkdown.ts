import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

let turndownInstance: TurndownService | null = null;

function getTurndownService(): TurndownService {
  if (turndownInstance) return turndownInstance;

  turndownInstance = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
  });

  // Enable GFM plugin (tables, strikethrough, taskListItems)
  turndownInstance.use(gfm);

  // Custom table rule for tables without thead (e.g., from Word, Google Docs, or AI chat responses)
  turndownInstance.addRule('tablesWithoutThead', {
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
          const cellMarkdown = (turndownInstance || new TurndownService())
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

  return turndownInstance;
}

/**
 * Normalizes rich HTML pasted from Web, Word, Google Docs, or AI chats
 * converts inline styled spans (font-weight: 700, font-style: italic) into semantic HTML tags.
 */
function normalizeHtmlForConversion(rawHtml: string): string {
  if (!rawHtml) return '';

  let htmlToParse = rawHtml;

  // Extract content inside <!--StartFragment--> ... <!--EndFragment--> if present
  const fragmentMatch = rawHtml.match(/<!--StartFragment-->([\s\S]*?)<!--EndFragment-->/i);
  if (fragmentMatch && fragmentMatch[1]) {
    htmlToParse = fragmentMatch[1];
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlToParse, 'text/html');

    // Remove unwanted scripts, styles, XML, and metadata elements
    doc.querySelectorAll('style, script, meta, link, xml, noscript').forEach((el) => el.remove());

    // Normalize inline CSS styles commonly used by Google Docs and web chats
    const styledElements = Array.from(doc.body.querySelectorAll('[style]'));
    for (const el of styledElements) {
      const styleAttr = el.getAttribute('style')?.toLowerCase() || '';

      // Bold detection (font-weight >= 700 or bold)
      if (
        (styleAttr.includes('font-weight: bold') ||
          styleAttr.includes('font-weight: 700') ||
          styleAttr.includes('font-weight: 800') ||
          styleAttr.includes('font-weight: 900')) &&
        el.tagName !== 'STRONG' &&
        el.tagName !== 'B'
      ) {
        const strong = doc.createElement('strong');
        strong.innerHTML = el.innerHTML;
        el.innerHTML = '';
        el.appendChild(strong);
      }

      // Italic detection
      if (
        styleAttr.includes('font-style: italic') &&
        el.tagName !== 'EM' &&
        el.tagName !== 'I'
      ) {
        const em = doc.createElement('em');
        em.innerHTML = el.innerHTML;
        el.innerHTML = '';
        el.appendChild(em);
      }

      // Strikethrough detection
      if (
        styleAttr.includes('text-decoration: line-through') &&
        el.tagName !== 'DEL' &&
        el.tagName !== 'S'
      ) {
        const del = doc.createElement('del');
        del.innerHTML = el.innerHTML;
        el.innerHTML = '';
        el.appendChild(del);
      }
    }

    return doc.body.innerHTML;
  } catch {
    return htmlToParse;
  }
}

/**
 * Checks if the HTML from the clipboard actually contains rich formatting
 * (headings, bold, italics, lists, tables, code, quotes, links).
 */
export function isRichHtml(html: string): boolean {
  if (!html || !html.trim()) return false;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove unwanted elements
    doc.querySelectorAll('style, script, meta, link, xml').forEach((el) => el.remove());

    // Check for rich semantic tags
    const richSelector =
      'b, strong, i, em, u, s, strike, del, h1, h2, h3, h4, h5, h6, ul, ol, li, table, pre, code, blockquote, a[href], hr, th, td';
    if (doc.body.querySelector(richSelector) !== null) {
      return true;
    }

    // Check for styled spans or divs
    const styledElements = doc.body.querySelectorAll('[style]');
    for (let i = 0; i < styledElements.length; i++) {
      const style = styledElements[i].getAttribute('style')?.toLowerCase() || '';
      if (
        style.includes('font-weight: bold') ||
        style.includes('font-weight: 700') ||
        style.includes('font-weight: 800') ||
        style.includes('font-weight: 900') ||
        style.includes('font-style: italic') ||
        style.includes('text-decoration: line-through')
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Converts rich HTML into clean GitHub Flavored Markdown (GFM).
 */
export function convertHtmlToMarkdown(rawHtml: string): string {
  const normalizedHtml = normalizeHtmlForConversion(rawHtml);
  const service = getTurndownService();
  const markdown = service.turndown(normalizedHtml);

  // Clean excessive blank lines
  return markdown.replace(/\n{3,}/g, '\n\n').trim();
}

export interface ClipboardMarkdownResult {
  markdown: string;
  isRichText: boolean;
  hasFormatting: boolean;
}

/**
 * Analyzes clipboard data and extracts Markdown, converting rich HTML if present.
 */
export function extractMarkdownFromClipboard(clipboardData: DataTransfer): ClipboardMarkdownResult {
  const html = clipboardData.getData('text/html');
  const plainText = clipboardData.getData('text/plain');

  if (html && isRichHtml(html)) {
    try {
      const converted = convertHtmlToMarkdown(html);
      if (converted.trim()) {
        return {
          markdown: converted,
          isRichText: true,
          hasFormatting: true,
        };
      }
    } catch (err) {
      console.warn('Error converting clipboard HTML to Markdown:', err);
    }
  }

  return {
    markdown: plainText || '',
    isRichText: false,
    hasFormatting: false,
  };
}

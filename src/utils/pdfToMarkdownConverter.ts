/**
 * PDF to Markdown Converter
 * Extracts text, layout, headings, lists, tables, and formatting from PDF documents
 * and converts them into structured GitHub-Flavored Markdown (GFM).
 */

import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { normalizeAllTables } from './tableNormalizer';

// Set up worker for pdfjs-dist using local Vite-bundled worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
  } catch (e) {
    console.warn('Could not set pdfjs workerSrc:', e);
  }
}

interface TextItemInfo {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  hasEOL?: boolean;
}

interface LineGroup {
  y: number;
  height: number;
  items: TextItemInfo[];
  text: string;
  avgFontSize: number;
  isBold?: boolean;
}

export interface PdfConversionOptions {
  includePageBreaks?: boolean;
  detectHeadings?: boolean;
  detectTables?: boolean;
  onProgress?: (current: number, total: number) => void;
}

export interface PdfConversionResult {
  markdown: string;
  pageCount: number;
  title?: string;
  metadata?: Record<string, any>;
}

/**
 * Converts a PDF File or ArrayBuffer into structured Markdown.
 */
export async function convertPdfToMarkdown(
  fileOrBuffer: File | ArrayBuffer | Uint8Array,
  options: PdfConversionOptions = {}
): Promise<PdfConversionResult> {
  let arrayBuffer: ArrayBuffer;
  if (fileOrBuffer instanceof File) {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  } else if (fileOrBuffer instanceof Uint8Array) {
    arrayBuffer = fileOrBuffer.buffer.slice(
      fileOrBuffer.byteOffset,
      fileOrBuffer.byteOffset + fileOrBuffer.byteLength
    ) as ArrayBuffer;
  } else {
    arrayBuffer = fileOrBuffer;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  let docTitle = '';
  try {
    const meta = await pdfDoc.getMetadata();
    if (meta && (meta.info as any)?.Title) {
      docTitle = ((meta.info as any).Title || '').trim();
    }
  } catch {
    // ignore
  }

  const pageMarkdowns: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (options.onProgress) {
      options.onProgress(pageNum, numPages);
    }

    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageMd = processPageTextContent(textContent.items, page.view);

    if (pageMd.trim()) {
      pageMarkdowns.push(pageMd.trim());
    }
  }

  // Combine pages
  const separator = options.includePageBreaks !== false ? '\n\n<!-- pagebreak -->\n\n' : '\n\n';
  let fullMarkdown = pageMarkdowns.join(separator);

  // If title was found and not already an H1 at start
  if (docTitle && !fullMarkdown.startsWith('# ')) {
    fullMarkdown = `# ${docTitle}\n\n${fullMarkdown}`;
  }

  // Post-process with normalizeAllTables to detect and format any ASCII / Unicode box tables
  const { markdown: normalized } = normalizeAllTables(fullMarkdown);

  return {
    markdown: normalized,
    pageCount: numPages,
    title: docTitle || undefined,
  };
}

/**
 * Parses text items from a PDF page and transforms them into Markdown
 */
function processPageTextContent(items: any[], viewPortBounds?: number[]): string {
  if (!items || items.length === 0) return '';

  const rawItems: TextItemInfo[] = [];

  for (const item of items) {
    if (!('str' in item) || !item.str || item.str.trim() === '') continue;

    // transform: [scaleX, skewY, skewX, scaleY, transX, transY]
    const transform = item.transform || [1, 0, 0, 1, 0, 0];
    const fontSize = Math.abs(transform[0] || transform[3] || item.height || 12);
    const x = transform[4] || 0;
    const y = transform[5] || 0; // Note: PDF coordinate system has y=0 at bottom

    rawItems.push({
      str: item.str,
      x,
      y,
      width: item.width || 0,
      height: item.height || fontSize,
      fontSize,
      fontName: item.fontName || '',
      hasEOL: item.hasEOL,
    });
  }

  if (rawItems.length === 0) return '';

  // Calculate median body font size to detect headings accurately
  const fontSizes = rawItems.map((i) => i.fontSize).sort((a, b) => a - b);
  const medianFontSize = fontSizes[Math.floor(fontSizes.length / 2)] || 12;

  // Group text items into lines based on vertical proximity (PDF y is inverted)
  // Sort primarily by Y descending (top to bottom), then by X ascending (left to right)
  const lineTolerance = 4; // pt tolerance for same line
  const lines: LineGroup[] = [];

  // Sort by Y descending
  const sortedItems = [...rawItems].sort((a, b) => {
    if (Math.abs(b.y - a.y) > lineTolerance) {
      return b.y - a.y; // Higher Y first (top of page)
    }
    return a.x - b.x; // Left to right
  });

  let currentLine: TextItemInfo[] = [];
  let currentY = sortedItems[0]?.y ?? 0;

  for (const item of sortedItems) {
    if (Math.abs(item.y - currentY) <= lineTolerance) {
      currentLine.push(item);
    } else {
      if (currentLine.length > 0) {
        lines.push(buildLineGroup(currentLine));
      }
      currentLine = [item];
      currentY = item.y;
    }
  }
  if (currentLine.length > 0) {
    lines.push(buildLineGroup(currentLine));
  }

  // Now process lines into Markdown blocks
  return formatLinesToMarkdown(lines, medianFontSize);
}

function buildLineGroup(items: TextItemInfo[]): LineGroup {
  // Sort items left-to-right
  items.sort((a, b) => a.x - b.x);

  let combinedText = '';
  let totalFontSize = 0;
  let isBold = false;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    totalFontSize += item.fontSize;

    if (/bold|black|heavy|medium/i.test(item.fontName)) {
      isBold = true;
    }

    if (i > 0) {
      const prev = items[i - 1];
      const gap = item.x - (prev.x + prev.width);
      // If there is significant horizontal gap, add spaces
      if (gap > 3 && !combinedText.endsWith(' ') && !item.str.startsWith(' ')) {
        combinedText += ' ';
      }
    }
    combinedText += item.str;
  }

  return {
    y: items[0].y,
    height: Math.max(...items.map((i) => i.height)),
    items,
    text: combinedText.trim(),
    avgFontSize: totalFontSize / items.length,
    isBold,
  };
}

/**
 * Formats grouped lines into paragraphs, headings, bullet lists, and tables
 */
function formatLinesToMarkdown(lines: LineGroup[], bodyFontSize: number): string {
  const result: string[] = [];
  let inList = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const text = line.text;

    if (!text) {
      i++;
      continue;
    }

    // Check if this could be part of a multi-column table
    // A table line typically has multiple distinct items with noticeable gaps or pipe characters
    if (isTableCandidate(lines, i)) {
      const { tableMarkdown, linesConsumed } = extractTableFromLines(lines, i);
      if (tableMarkdown) {
        result.push(tableMarkdown);
        i += linesConsumed;
        continue;
      }
    }

    // Heading detection based on font size and bold
    const ratio = line.avgFontSize / (bodyFontSize || 12);
    const isHeading1 = ratio >= 1.6 || (ratio >= 1.4 && line.isBold);
    const isHeading2 = ratio >= 1.3 && ratio < 1.6;
    const isHeading3 = ratio >= 1.15 && ratio < 1.3 && line.isBold;

    // Bullet / List item detection
    const isBullet = /^[\u2022\u25E6\u2023\u25AA\u2013\u2014\-*]\s+/.test(text) || /^[•\-\*]\s/.test(text);
    const isNumbered = /^\d+[\.\)]\s+/.test(text);

    if (isHeading1 && text.length < 120 && !isBullet && !isNumbered) {
      result.push(`\n# ${cleanHeadingText(text)}\n`);
      inList = false;
      i++;
      continue;
    }

    if (isHeading2 && text.length < 150 && !isBullet && !isNumbered) {
      result.push(`\n## ${cleanHeadingText(text)}\n`);
      inList = false;
      i++;
      continue;
    }

    if (isHeading3 && text.length < 180 && !isBullet && !isNumbered) {
      result.push(`\n### ${cleanHeadingText(text)}\n`);
      inList = false;
      i++;
      continue;
    }

    if (isBullet) {
      const cleaned = text.replace(/^[\u2022\u25E6\u2023\u25AA\u2013\u2014\-*•]\s*/, '').trim();
      result.push(`- ${cleaned}`);
      inList = true;
      i++;
      continue;
    }

    if (isNumbered) {
      result.push(text);
      inList = true;
      i++;
      continue;
    }

    // Normal paragraph line
    // Check if subsequent lines should be joined into this paragraph
    let para = text;
    let nextIdx = i + 1;

    while (nextIdx < lines.length) {
      const nextLine = lines[nextIdx];
      const nextText = nextLine.text;
      const nextRatio = nextLine.avgFontSize / (bodyFontSize || 12);
      const isNextHeading = nextRatio >= 1.25 || (nextRatio >= 1.15 && nextLine.isBold);
      const isNextBullet = /^[\u2022\u25E6\u2023\u25AA\u2013\u2014\-*•]\s+/.test(nextText);
      const isNextNumbered = /^\d+[\.\)]\s+/.test(nextText);

      // Check distance between lines
      const yDiff = Math.abs(lines[nextIdx - 1].y - nextLine.y);
      const isCloseY = yDiff <= (nextLine.height * 2.2);

      if (isNextHeading || isNextBullet || isNextNumbered || !isCloseY || isTableCandidate(lines, nextIdx)) {
        break;
      }

      // Join line
      if (para.endsWith('-')) {
        // Hyphenated word break at end of line: "conduc- \n ción" -> "conducción"
        para = para.slice(0, -1) + nextText;
      } else {
        para += ' ' + nextText;
      }
      nextIdx++;
    }

    result.push(para);
    result.push(''); // blank line after paragraph
    i = nextIdx;
  }

  return result.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function cleanHeadingText(text: string): string {
  return text.replace(/^[#\s]+/, '').trim();
}

/**
 * Checks if lines starting at index `startIndex` resemble a table
 */
function isTableCandidate(lines: LineGroup[], startIndex: number): boolean {
  if (startIndex + 1 >= lines.length) return false;
  const line = lines[startIndex];

  // If text already has pipes or tabs
  if (line.text.includes('|') && line.text.split('|').length >= 3) return true;

  // Check if line has multiple spaced items aligned in columns
  if (line.items.length >= 2) {
    const nextLine = lines[startIndex + 1];
    if (nextLine.items.length >= 2) {
      // Check column overlap
      let overlaps = 0;
      for (const item1 of line.items) {
        for (const item2 of nextLine.items) {
          if (Math.abs(item1.x - item2.x) < 25) {
            overlaps++;
            break;
          }
        }
      }
      return overlaps >= 2;
    }
  }

  return false;
}

/**
 * Extracts a table structure from candidate lines
 */
function extractTableFromLines(
  lines: LineGroup[],
  startIndex: number
): { tableMarkdown: string; linesConsumed: number } {
  const tableRows: string[][] = [];
  let currentIndex = startIndex;

  while (currentIndex < lines.length) {
    const line = lines[currentIndex];

    // If explicit pipes are present
    if (line.text.includes('|')) {
      const cells = line.text
        .split('|')
        .map((c) => c.trim())
        .filter((c, idx, arr) => !(idx === 0 && c === '') && !(idx === arr.length - 1 && c === ''));
      if (cells.length >= 2) {
        tableRows.push(cells);
        currentIndex++;
        continue;
      }
    }

    // Column positioning extraction
    if (line.items.length >= 2) {
      const cells: string[] = [];
      let currentCell = '';
      let lastX = line.items[0].x;

      for (let k = 0; k < line.items.length; k++) {
        const item = line.items[k];
        const gap = item.x - lastX;
        if (gap > 40 && currentCell.trim()) {
          cells.push(currentCell.trim());
          currentCell = item.str;
        } else {
          currentCell += (currentCell && !currentCell.endsWith(' ') ? ' ' : '') + item.str;
        }
        lastX = item.x + item.width;
      }
      if (currentCell.trim()) {
        cells.push(currentCell.trim());
      }

      if (cells.length >= 2) {
        tableRows.push(cells);
        currentIndex++;
        continue;
      }
    }

    break;
  }

  const linesConsumed = currentIndex - startIndex;
  if (tableRows.length < 2 || linesConsumed < 2) {
    return { tableMarkdown: '', linesConsumed: 0 };
  }

  // Normalize column count
  const maxCols = Math.max(...tableRows.map((r) => r.length));
  if (maxCols < 2) return { tableMarkdown: '', linesConsumed: 0 };

  const paddedRows = tableRows.map((r) => {
    while (r.length < maxCols) r.push('');
    return r;
  });

  const header = paddedRows[0];
  const body = paddedRows.slice(1);

  const headerRow = `| ${header.join(' | ')} |`;
  const separatorRow = `| ${header.map(() => '---').join(' | ')} |`;
  const bodyRows = body.map((r) => `| ${r.join(' | ')} |`).join('\n');

  return {
    tableMarkdown: `\n${headerRow}\n${separatorRow}\n${bodyRows}\n`,
    linesConsumed,
  };
}

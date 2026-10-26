/**
 * Utilities to detect, parse, and normalize various table formats in Markdown
 * (Unicode box-drawing tables, ASCII tables, code-block wrapped tables, and indented tables)
 * into standard GitHub-Flavored Markdown (GFM) tables and structured data.
 */

export interface ParsedTableData {
  headers: string[];
  alignments: ('left' | 'center' | 'right')[];
  rows: string[][];
}

// Regex patterns for detecting table borders
const UNICODE_BOX_CHARS = /[┌┐└┘├┤┬┴┼─│╔╗╚╝╠╣╦╩╬═║╒╕╘╛╞╡╤╧╪╓╖╙╜╟╢┬┴┼]/;
const UNICODE_HORIZONTAL_SPLIT = /^[┌├└╔╠╚╒╞╘╓╟╙][─═┬┴┼╤╧╪╦╩╬─═\-+]+[┐┤┘╗╣╝╕╡╛╖╢╜]?\s*$/;
const UNICODE_ROW_PATTERN = /^[│║|].*[│║|]\s*$/;

const ASCII_HORIZONTAL_SPLIT = /^\+[-=+]+\+\s*$/;
const ASCII_ROW_PATTERN = /^\|.*\|\s*$/;

/**
 * Checks if a block of lines represents a Unicode box-drawing table
 */
export function isUnicodeBoxTable(text: string): boolean {
  const lines = text.trim().split('\n').map((l) => l.trim());
  if (lines.length < 2) return false;

  const hasUnicodeBorder = lines.some((l) => UNICODE_HORIZONTAL_SPLIT.test(l) || UNICODE_BOX_CHARS.test(l));
  const hasRows = lines.some((l) => UNICODE_ROW_PATTERN.test(l) || (l.includes('│') || l.includes('║')));

  return hasUnicodeBorder && hasRows;
}

/**
 * Checks if a block of lines represents an ASCII table (e.g. +---+---+ and | col | col |)
 */
export function isAsciiTable(text: string): boolean {
  const lines = text.trim().split('\n').map((l) => l.trim());
  if (lines.length < 2) return false;

  const hasBorder = lines.some((l) => ASCII_HORIZONTAL_SPLIT.test(l));
  const hasRows = lines.some((l) => ASCII_ROW_PATTERN.test(l));

  return hasBorder && hasRows;
}

/**
 * Checks if a block of text is already a standard Markdown pipe table
 */
export function isMarkdownPipeTable(text: string): boolean {
  const lines = text.trim().split('\n').map((l) => l.trim());
  if (lines.length < 2) return false;

  const separatorIndex = lines.findIndex((l) => /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(l));
  return separatorIndex > 0;
}

/**
 * Parses a Unicode box-drawing table into rows of cell strings
 */
export function parseUnicodeBoxTable(text: string): ParsedTableData | null {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter((l) => Boolean(l));
  if (lines.length < 2) return null;

  const dataRows: string[][] = [];

  for (const line of lines) {
    // Skip purely decorative horizontal separator lines
    if (UNICODE_HORIZONTAL_SPLIT.test(line) || /^[─═┌┐└┘├┤┬┴┼╔╗╚╝╠╣╦╩╬\s-]+$/.test(line)) {
      continue;
    }

    // Row line with vertical bars: │ cell 1 │ cell 2 │
    if (line.includes('│') || line.includes('║') || line.includes('|')) {
      const parts = line.split(/[│║|]/);
      // Remove first and last empty elements caused by outer vertical borders
      if (parts.length > 2) {
        if (parts[0].trim() === '') parts.shift();
        if (parts.length > 0 && parts[parts.length - 1].trim() === '') parts.pop();
      }
      const cells = parts.map((c) => c.trim());
      if (cells.length > 0 && cells.some((c) => c.length > 0)) {
        dataRows.push(cells);
      }
    }
  }

  if (dataRows.length === 0) return null;

  const headers = dataRows[0];
  const maxCols = Math.max(...dataRows.map((r) => r.length), 1);

  // Normalize all rows to maxCols
  const normalizedRows = dataRows.map((row) => {
    const copy = [...row];
    while (copy.length < maxCols) copy.push('');
    return copy;
  });

  const bodyRows = normalizedRows.slice(1);
  const alignments: ('left' | 'center' | 'right')[] = headers.map(() => 'left');

  return {
    headers: normalizedRows[0],
    alignments,
    rows: bodyRows.length > 0 ? bodyRows : [],
  };
}

/**
 * Parses an ASCII table (+---+ and | cell |) into rows
 */
export function parseAsciiTable(text: string): ParsedTableData | null {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter((l) => Boolean(l));
  if (lines.length < 2) return null;

  const dataRows: string[][] = [];

  for (const line of lines) {
    // Skip separator lines like +-------+-------+
    if (/^\+[-=+]+\+?$/.test(line)) {
      continue;
    }

    if (line.includes('|')) {
      const parts = line.split('|');
      if (parts.length > 2) {
        if (parts[0].trim() === '') parts.shift();
        if (parts.length > 0 && parts[parts.length - 1].trim() === '') parts.pop();
      }
      const cells = parts.map((c) => c.trim());
      if (cells.length > 0 && cells.some((c) => c.length > 0)) {
        dataRows.push(cells);
      }
    }
  }

  if (dataRows.length === 0) return null;

  const maxCols = Math.max(...dataRows.map((r) => r.length), 1);
  const normalizedRows = dataRows.map((row) => {
    const copy = [...row];
    while (copy.length < maxCols) copy.push('');
    return copy;
  });

  return {
    headers: normalizedRows[0],
    alignments: normalizedRows[0].map(() => 'left'),
    rows: normalizedRows.slice(1),
  };
}

/**
 * Formats a ParsedTableData object into a clean standard GFM Markdown table
 */
export function formatToMarkdownTable(data: ParsedTableData): string {
  const { headers, alignments, rows } = data;
  if (!headers || headers.length === 0) return '';

  const formatCell = (val: string) => {
    const sanitized = (val || '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim();
    return sanitized || ' ';
  };

  const headerRowStr = `| ${headers.map(formatCell).join(' | ')} |`;

  const separatorRowStr = `| ${headers
    .map((_, idx) => {
      const align = alignments[idx] || 'left';
      if (align === 'center') return ':---:';
      if (align === 'right') return '---:';
      return '---';
    })
    .join(' | ')} |`;

  const bodyRowStrs = rows.map((row) => {
    const padded = [...row];
    while (padded.length < headers.length) padded.push(' ');
    return `| ${padded.slice(0, headers.length).map(formatCell).join(' | ')} |`;
  });

  return [headerRowStr, separatorRowStr, ...bodyRowStrs].join('\n');
}

/**
 * Converts any code block that contains a table (Markdown pipe table, Unicode box table,
 * or ASCII border table) into a standard Markdown table instead of a code block.
 */
function unwrapCodeBlockTables(markdown: string): { text: string; convertedCount: number } {
  let convertedCount = 0;

  // Match fenced code blocks ```[lang]\n...\n```
  const transformed = markdown.replace(/```(?:[a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g, (match, innerCode) => {
    const trimmed = innerCode.trim();

    // 1. Is it a Markdown pipe table inside a code block?
    if (isMarkdownPipeTable(trimmed)) {
      convertedCount++;
      return `\n\n${trimmed}\n\n`;
    }

    // 2. Is it a Unicode box-drawing table inside a code block?
    if (isUnicodeBoxTable(trimmed)) {
      const parsed = parseUnicodeBoxTable(trimmed);
      if (parsed) {
        convertedCount++;
        return `\n\n${formatToMarkdownTable(parsed)}\n\n`;
      }
    }

    // 3. Is it an ASCII border table inside a code block?
    if (isAsciiTable(trimmed)) {
      const parsed = parseAsciiTable(trimmed);
      if (parsed) {
        convertedCount++;
        return `\n\n${formatToMarkdownTable(parsed)}\n\n`;
      }
    }

    // Not a table, preserve original code block
    return match;
  });

  return { text: transformed, convertedCount };
}

/**
 * Scans markdown text and converts standalone Unicode box tables or ASCII tables into standard Markdown tables.
 */
function convertStandaloneBoxTables(markdown: string): { text: string; convertedCount: number } {
  let convertedCount = 0;
  const lines = markdown.split(/\r?\n/);
  const resultLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Check if line looks like the start of a Unicode box table or ASCII table
    const isUnicodeStart = UNICODE_HORIZONTAL_SPLIT.test(line.trim()) || (line.trim().startsWith('┌') || line.trim().startsWith('╔'));
    const isAsciiStart = ASCII_HORIZONTAL_SPLIT.test(line.trim());

    if (isUnicodeStart || isAsciiStart) {
      // Gather continuous table lines
      const tableLines: string[] = [];
      let j = i;
      while (j < lines.length) {
        const currentLine = lines[j].trim();
        if (currentLine === '') break;
        if (
          UNICODE_BOX_CHARS.test(currentLine) ||
          ASCII_HORIZONTAL_SPLIT.test(currentLine) ||
          currentLine.includes('|') ||
          currentLine.includes('│') ||
          currentLine.includes('║')
        ) {
          tableLines.push(lines[j]);
          j++;
        } else {
          break;
        }
      }

      if (tableLines.length >= 2) {
        const blockText = tableLines.join('\n');
        let parsed: ParsedTableData | null = null;

        if (isUnicodeBoxTable(blockText)) {
          parsed = parseUnicodeBoxTable(blockText);
        } else if (isAsciiTable(blockText)) {
          parsed = parseAsciiTable(blockText);
        }

        if (parsed && parsed.headers.length > 0) {
          const mdTable = formatToMarkdownTable(parsed);
          resultLines.push('');
          resultLines.push(mdTable);
          resultLines.push('');
          convertedCount++;
          i = j;
          continue;
        }
      }
    }

    resultLines.push(line);
    i++;
  }

  return { text: resultLines.join('\n'), convertedCount };
}

/**
 * Normalizes indented Markdown tables so that marked doesn't misinterpret them
 * as indented code blocks (which happens when 4+ spaces precede the table).
 */
function normalizeIndentedTables(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const output: string[] = [];
  let inIndentedTable = false;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();

    // Check if this line is part of a markdown table indented by 4 spaces
    if (
      line.startsWith('    ') &&
      trimmed.startsWith('|') &&
      trimmed.endsWith('|') &&
      (trimmed.includes('---') || (idx + 1 < lines.length && lines[idx + 1].trim().includes('---')) || inIndentedTable)
    ) {
      inIndentedTable = true;
      output.push(trimmed);
      continue;
    } else if (inIndentedTable && trimmed.startsWith('|') && trimmed.endsWith('|')) {
      output.push(trimmed);
      continue;
    } else {
      inIndentedTable = false;
      output.push(line);
    }
  }

  return output.join('\n');
}

/**
 * Full normalizer pipeline:
 * Converts Unicode tables, ASCII tables, code-fenced tables, and indented tables
 * into pristine standard GitHub-Flavored Markdown tables.
 */
export function normalizeAllTables(markdown: string): { markdown: string; convertedCount: number } {
  if (!markdown || !markdown.trim()) {
    return { markdown, convertedCount: 0 };
  }

  // 1. Unwrap tables trapped in code blocks
  const unwrapResult = unwrapCodeBlockTables(markdown);

  // 2. Normalize indented tables (remove excessive leading indentation)
  const deindented = normalizeIndentedTables(unwrapResult.text);

  // 3. Convert standalone Unicode/ASCII tables
  const standaloneResult = convertStandaloneBoxTables(deindented);

  const totalCount = unwrapResult.convertedCount + standaloneResult.convertedCount;
  return {
    markdown: standaloneResult.text,
    convertedCount: totalCount,
  };
}

/**
 * Calculates optimal column widths in DXA (twips) for Word tables.
 * Total printable width for standard 8.5x11 page with 1in margins is ~9360 twips.
 */
export function calculateColumnWidthsTwips(
  headers: string[],
  rows: string[][],
  totalTableWidthTwips: number = 9360
): number[] {
  const colCount = Math.max(headers.length, 1);
  if (colCount === 1) return [totalTableWidthTwips];

  // Calculate length weights based on content
  const maxLens: number[] = headers.map((h) => Math.max(h.length, 3));

  for (const row of rows) {
    for (let c = 0; c < colCount; c++) {
      const cellLen = (row[c] || '').length;
      if (cellLen > maxLens[c]) {
        maxLens[c] = cellLen;
      }
    }
  }

  // Use square root scaling so large columns don't dominate completely
  const weights = maxLens.map((len) => Math.pow(Math.min(len, 60), 0.75));
  const sumWeights = weights.reduce((a, b) => a + b, 0);

  // Assign proportional twips with minimum threshold
  const minColWidth = 1000; // minimum ~0.7 inches
  let allocated = 0;
  const widths = weights.map((w, idx) => {
    if (idx === colCount - 1) {
      // Last column gets remaining twips to guarantee exact total
      return Math.max(minColWidth, totalTableWidthTwips - allocated);
    }
    const colTwips = Math.max(minColWidth, Math.round((w / sumWeights) * totalTableWidthTwips));
    allocated += colTwips;
    return colTwips;
  });

  return widths;
}

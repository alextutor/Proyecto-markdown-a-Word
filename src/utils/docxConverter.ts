import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ExternalHyperlink,
  PageBreak,
  Header,
  Footer,
  PageNumber,
  ShadingType,
  LevelFormat,
  convertInchesToTwip,
  ImageRun,
} from 'docx';
import { marked, Tokens } from 'marked';
import { DocumentSettings, DocumentStats, MarginOption, PageSize, PageOrientation } from '../types/converter';
import {
  normalizeAllTables,
  calculateColumnWidthsTwips,
  isUnicodeBoxTable,
  isAsciiTable,
  isMarkdownPipeTable,
  parseUnicodeBoxTable,
  parseAsciiTable,
  ParsedTableData,
} from './tableNormalizer';

// Helper to remove '#' from hex color
function cleanHex(hex: string, fallback = '000000'): string {
  if (!hex) return fallback;
  return hex.replace('#', '').trim();
}

// Convert margin setting to twips
function getMarginTwips(option: MarginOption): { top: number; right: number; bottom: number; left: number } {
  switch (option) {
    case 'narrow':
      return { top: 720, right: 720, bottom: 720, left: 720 }; // 0.5 in
    case 'moderate':
      return { top: 1440, right: 1080, bottom: 1440, left: 1080 }; // 1 in top/bottom, 0.75 in sides
    case 'wide':
      return { top: 1440, right: 2880, bottom: 1440, left: 2880 }; // 1 in top/bottom, 2 in sides
    case 'normal':
    default:
      return { top: 1440, right: 1440, bottom: 1440, left: 1440 }; // 1 in (2.54 cm)
  }
}

// Get page size dimensions in twips
function getPageSizeTwips(size: PageSize, orientation: PageOrientation): { width: number; height: number; orientation: any } {
  let width = 12240; // 8.5 in (Letter)
  let height = 15840; // 11 in (Letter)

  if (size === 'a4') {
    width = 11906; // 210 mm
    height = 16838; // 297 mm
  } else if (size === 'legal') {
    width = 12240;
    height = 20160;
  }

  if (orientation === 'landscape') {
    return {
      width: height,
      height: width,
      orientation: 'landscape' as any,
    };
  }

  return {
    width,
    height,
    orientation: 'portrait' as any,
  };
}

// Map line spacing string to docx line spacing
function getLineSpacingTwips(spacing: string): number {
  switch (spacing) {
    case '1.0':
      return 240;
    case '1.15':
      return 276;
    case '1.5':
      return 360;
    case '2.0':
      return 480;
    default:
      return 276;
  }
}

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  const map: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  };
  return text.replace(/&(?:amp|lt|gt|quot|#39|apos|nbsp);/g, (match) => map[match] || match);
}

// Process inline tokens into TextRun or ExternalHyperlink
function processInlineTokens(
  tokens: any[] | undefined,
  settings: DocumentSettings,
  inheritedFormat: {
    bold?: boolean;
    italics?: boolean;
    strike?: boolean;
    color?: string;
    font?: string;
    size?: number;
  } = {}
): (TextRun | ExternalHyperlink)[] {
  if (!tokens || tokens.length === 0) return [];

  const runs: (TextRun | ExternalHyperlink)[] = [];
  const baseFont = inheritedFormat.font || settings.fontFamily;
  const baseSize = inheritedFormat.size || settings.fontSizePt * 2;
  const baseColor = inheritedFormat.color || cleanHex(settings.textColor);

  for (const token of tokens) {
    switch (token.type) {
      case 'text': {
        const textContent = decodeHtmlEntities(token.text || '');
        if (token.tokens && token.tokens.length > 0) {
          runs.push(...processInlineTokens(token.tokens, settings, inheritedFormat));
        } else if (textContent) {
          runs.push(
            new TextRun({
              text: textContent,
              bold: inheritedFormat.bold,
              italics: inheritedFormat.italics,
              strike: inheritedFormat.strike,
              font: baseFont,
              size: baseSize,
              color: baseColor,
            })
          );
        }
        break;
      }
      case 'strong': {
        runs.push(
          ...processInlineTokens(token.tokens, settings, {
            ...inheritedFormat,
            bold: true,
          })
        );
        break;
      }
      case 'em': {
        runs.push(
          ...processInlineTokens(token.tokens, settings, {
            ...inheritedFormat,
            italics: true,
          })
        );
        break;
      }
      case 'del': {
        runs.push(
          ...processInlineTokens(token.tokens, settings, {
            ...inheritedFormat,
            strike: true,
          })
        );
        break;
      }
      case 'codespan': {
        const codeText = decodeHtmlEntities(token.text || '');
        runs.push(
          new TextRun({
            text: codeText,
            font: 'Consolas',
            size: Math.max(16, baseSize - 2),
            color: cleanHex(settings.primaryAccentColor),
            shading: {
              fill: 'F1F5F9',
              type: ShadingType.CLEAR,
            },
          })
        );
        break;
      }
      case 'link': {
        const linkRuns = processInlineTokens(token.tokens, settings, {
          ...inheritedFormat,
          color: cleanHex(settings.secondaryAccentColor),
        });
        runs.push(
          new ExternalHyperlink({
            children: linkRuns.length > 0 ? linkRuns : [
              new TextRun({
                text: token.text || token.href,
                font: baseFont,
                size: baseSize,
                color: cleanHex(settings.secondaryAccentColor),
                underline: { type: 'single' as any },
              }),
            ],
            link: token.href || '#',
          })
        );
        break;
      }
      case 'escape': {
        runs.push(
          new TextRun({
            text: token.text || '',
            bold: inheritedFormat.bold,
            italics: inheritedFormat.italics,
            font: baseFont,
            size: baseSize,
            color: baseColor,
          })
        );
        break;
      }
      default: {
        if (token.text) {
          runs.push(
            new TextRun({
              text: decodeHtmlEntities(token.text),
              bold: inheritedFormat.bold,
              italics: inheritedFormat.italics,
              strike: inheritedFormat.strike,
              font: baseFont,
              size: baseSize,
              color: baseColor,
            })
          );
        }
        break;
      }
    }
  }

  return runs;
}

// Fetch image buffer for image tokens
async function tryFetchImageBuffer(url: string): Promise<Uint8Array | null> {
  try {
    if (url.startsWith('data:image')) {
      const parts = url.split(',');
      if (parts.length > 1) {
        const binary = atob(parts[1]);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
      }
    }
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch {
    return null;
  }
}

// Helper to construct a native docx Table from structured table data
function createDocxTableFromParsedData(
  parsed: ParsedTableData,
  settings: DocumentSettings,
  headingFont: string,
  baseFont: string,
  baseSize: number,
  textColor: string,
  primaryAccent: string,
  printableWidthTwips: number
): Table {
  const { headers, alignments, rows } = parsed;
  const colWidths = calculateColumnWidthsTwips(headers, rows, printableWidthTwips);

  const headerCells = headers.map((headerText, colIdx) => {
    const align = alignments[colIdx] || 'left';
    let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;
    if (align === 'center') alignment = AlignmentType.CENTER;
    if (align === 'right') alignment = AlignmentType.RIGHT;

    return new TableCell({
      width: { size: colWidths[colIdx] || 2000, type: WidthType.DXA },
      shading: { fill: primaryAccent, type: ShadingType.CLEAR },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 6, color: primaryAccent },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: '94A3B8' },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      },
      margins: { top: 120, bottom: 120, left: 160, right: 160 },
      children: [
        new Paragraph({
          alignment,
          spacing: { before: 80, after: 80, line: 240 },
          children: [
            new TextRun({
              text: decodeHtmlEntities(headerText),
              bold: true,
              color: 'FFFFFF',
              font: headingFont,
              size: Math.max(18, baseSize - 2),
            }),
          ],
        }),
      ],
    });
  });

  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: headerCells,
    }),
  ];

  rows.forEach((row, rowIdx) => {
    const isZebra = settings.tableZebraStriping && rowIdx % 2 === 1;
    const bgFill = isZebra ? 'F8FAFC' : 'FFFFFF';

    const cells = row.map((cellText, colIdx) => {
      const align = alignments[colIdx] || 'left';
      let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;
      if (align === 'center') alignment = AlignmentType.CENTER;
      if (align === 'right') alignment = AlignmentType.RIGHT;

      return new TableCell({
        width: { size: colWidths[colIdx] || 2000, type: WidthType.DXA },
        shading: { fill: bgFill, type: ShadingType.CLEAR },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
          left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
          right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        children: [
          new Paragraph({
            alignment,
            spacing: { before: 80, after: 80, line: 240 },
            children: [
              new TextRun({
                text: decodeHtmlEntities(cellText),
                font: baseFont,
                size: Math.max(18, baseSize - 2),
                color: textColor,
              }),
            ],
          }),
        ],
      });
    });

    tableRows.push(
      new TableRow({
        cantSplit: true,
        children: cells,
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
    },
    rows: tableRows,
    margins: { top: 160, bottom: 240 },
  });
}

// Main conversion function
export async function convertMarkdownToDocxBlob(
  markdownText: string,
  settings: DocumentSettings
): Promise<Blob> {
  // Pre-normalize all table formats (Unicode box drawing, ASCII borders, code-block wrapped, and indented)
  const { markdown: normalizedMarkdown } = normalizeAllTables(markdownText);
  const tokens = marked.lexer(normalizedMarkdown);
  const elements: (Paragraph | Table)[] = [];

  const primaryAccent = cleanHex(settings.primaryAccentColor);
  const secondaryAccent = cleanHex(settings.secondaryAccentColor);
  const textColor = cleanHex(settings.textColor);
  const baseFont = settings.fontFamily;
  const headingFont = settings.headingFontFamily || settings.fontFamily;
  const baseSize = settings.fontSizePt * 2;
  const lineSpacing = getLineSpacingTwips(settings.lineSpacing);

  const pageDimensions = getPageSizeTwips(settings.pageSize, settings.orientation);
  const pageMargins = getMarginTwips(settings.margins);
  const printableWidthTwips = Math.max(2000, pageDimensions.width - pageMargins.left - pageMargins.right);

  // Optional Cover / Title Page
  if (settings.metadata?.includeCoverPage) {
    elements.push(
      new Paragraph({
        spacing: { before: 2400, after: 360 },
        children: [
          new TextRun({
            text: settings.metadata.title || 'Documento',
            bold: true,
            font: headingFont,
            size: 56, // 28pt
            color: primaryAccent,
          }),
        ],
      })
    );

    if (settings.metadata.subtitle) {
      elements.push(
        new Paragraph({
          spacing: { before: 0, after: 1200 },
          children: [
            new TextRun({
              text: settings.metadata.subtitle,
              font: baseFont,
              size: 28, // 14pt
              color: secondaryAccent,
            }),
          ],
        })
      );
    }

    if (settings.metadata.author || settings.metadata.organization || settings.metadata.date) {
      const metaRuns: TextRun[] = [];
      if (settings.metadata.author) {
        metaRuns.push(new TextRun({ text: `Autor: ${settings.metadata.author}\n`, font: baseFont, size: 22, color: textColor }));
      }
      if (settings.metadata.organization) {
        metaRuns.push(new TextRun({ text: `Organización: ${settings.metadata.organization}\n`, font: baseFont, size: 22, color: textColor }));
      }
      if (settings.metadata.date) {
        metaRuns.push(new TextRun({ text: `Fecha: ${settings.metadata.date}`, font: baseFont, size: 20, color: '64748B' }));
      }
      elements.push(
        new Paragraph({
          spacing: { before: 800, after: 600 },
          children: metaRuns,
        })
      );
    }

    // Add page break after cover
    elements.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
  }

  // Iterate over root tokens
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    switch (token.type) {
      case 'heading': {
        const depth = token.depth || 1;
        let headingLevel: any = HeadingLevel.HEADING_1;
        let headingSize = 44; // 22pt
        let spaceBefore = 360;
        let spaceAfter = 140;
        let color = primaryAccent;

        if (depth === 1) {
          headingLevel = HeadingLevel.HEADING_1;
          headingSize = 44; // 22pt
          spaceBefore = 400;
          spaceAfter = 160;
          color = primaryAccent;
        } else if (depth === 2) {
          headingLevel = HeadingLevel.HEADING_2;
          headingSize = 34; // 17pt
          spaceBefore = 320;
          spaceAfter = 120;
          color = primaryAccent;
        } else if (depth === 3) {
          headingLevel = HeadingLevel.HEADING_3;
          headingSize = 28; // 14pt
          spaceBefore = 240;
          spaceAfter = 100;
          color = secondaryAccent;
        } else if (depth === 4) {
          headingLevel = HeadingLevel.HEADING_4;
          headingSize = 24; // 12pt
          spaceBefore = 200;
          spaceAfter = 80;
          color = secondaryAccent;
        } else {
          headingLevel = HeadingLevel.HEADING_5;
          headingSize = 22; // 11pt
          spaceBefore = 160;
          spaceAfter = 60;
          color = textColor;
        }

        const headingRuns = processInlineTokens(token.tokens, settings, {
          bold: true,
          font: headingFont,
          size: headingSize,
          color,
        });

        elements.push(
          new Paragraph({
            heading: headingLevel,
            spacing: { before: spaceBefore, after: spaceAfter, line: lineSpacing },
            children: headingRuns.length > 0 ? headingRuns : [
              new TextRun({
                text: decodeHtmlEntities(token.text || ''),
                bold: true,
                font: headingFont,
                size: headingSize,
                color,
              }),
            ],
          })
        );
        break;
      }

      case 'paragraph': {
        // Check for special page break marker
        const rawText = token.text?.trim() || '';
        if (
          rawText === '\\pagebreak' ||
          rawText === '<!-- pagebreak -->' ||
          rawText === '***pagebreak***' ||
          rawText === '---pagebreak---'
        ) {
          elements.push(new Paragraph({ children: [new PageBreak()] }));
          break;
        }

        // Check if paragraph contains an image token
        if (token.tokens && token.tokens.length === 1 && token.tokens[0].type === 'image') {
          const imgToken = token.tokens[0] as Tokens.Image;
          const imageBuffer = await tryFetchImageBuffer(imgToken.href);
          if (imageBuffer) {
            elements.push(
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 200, after: 80 },
                children: [
                  new ImageRun({
                    type: 'png',
                    data: imageBuffer,
                    transformation: { width: 450, height: 260 },
                  }),
                ],
              })
            );
            if (imgToken.text) {
              elements.push(
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 40, after: 200 },
                  children: [
                    new TextRun({
                      text: `Ilustración: ${imgToken.text}`,
                      italics: true,
                      size: Math.max(16, baseSize - 4),
                      font: baseFont,
                      color: '64748B',
                    }),
                  ],
                })
              );
            }
            break;
          }
        }

        const inlineRuns = processInlineTokens(token.tokens, settings);
        elements.push(
          new Paragraph({
            spacing: { before: 60, after: 140, line: lineSpacing },
            children: inlineRuns.length > 0 ? inlineRuns : [
              new TextRun({
                text: decodeHtmlEntities(token.text || ''),
                font: baseFont,
                size: baseSize,
                color: textColor,
              }),
            ],
          })
        );
        break;
      }

      case 'blockquote': {
        // Process blockquote children
        const quoteTokens = token.tokens || [];
        for (const subToken of quoteTokens) {
          if (subToken.type === 'paragraph') {
            const quoteRuns = processInlineTokens(subToken.tokens, settings, {
              italics: true,
              color: '334155',
            });
            elements.push(
              new Paragraph({
                indent: { left: convertInchesToTwip(0.35) },
                spacing: { before: 120, after: 120, line: lineSpacing },
                border: {
                  left: {
                    color: primaryAccent,
                    size: 24, // ~3pt
                    style: BorderStyle.SINGLE,
                    space: 14,
                  },
                },
                children: quoteRuns.length > 0 ? quoteRuns : [
                  new TextRun({
                    text: decodeHtmlEntities(subToken.text || ''),
                    italics: true,
                    font: baseFont,
                    size: baseSize,
                    color: '334155',
                  }),
                ],
              })
            );
          }
        }
        break;
      }

      case 'code': {
        const rawCode = token.text || '';
        // If this code block contains a table that wasn't unwrapped, render it as a native Word Table
        if (isUnicodeBoxTable(rawCode)) {
          const parsed = parseUnicodeBoxTable(rawCode);
          if (parsed && parsed.headers.length > 0) {
            elements.push(
              createDocxTableFromParsedData(
                parsed,
                settings,
                headingFont,
                baseFont,
                baseSize,
                textColor,
                primaryAccent,
                printableWidthTwips
              )
            );
            break;
          }
        } else if (isAsciiTable(rawCode)) {
          const parsed = parseAsciiTable(rawCode);
          if (parsed && parsed.headers.length > 0) {
            elements.push(
              createDocxTableFromParsedData(
                parsed,
                settings,
                headingFont,
                baseFont,
                baseSize,
                textColor,
                primaryAccent,
                printableWidthTwips
              )
            );
            break;
          }
        }

        const codeLines: string[] = rawCode.split('\n');
        const codeParagraphs = codeLines.map((line: string, idx: number) => {
          return new Paragraph({
            spacing: { before: idx === 0 ? 140 : 0, after: idx === codeLines.length - 1 ? 140 : 0, line: 240 },
            shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
            border: {
              left: { color: primaryAccent, size: 16, style: BorderStyle.SINGLE, space: 10 },
            },
            children: [
              new TextRun({
                text: line || ' ',
                font: 'Consolas',
                size: 19, // 9.5pt
                color: '0F172A',
              }),
            ],
          });
        });
        elements.push(...codeParagraphs);
        break;
      }

      case 'list': {
        const isOrdered = token.ordered;
        const items = token.items || [];

        for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
          const item = items[itemIdx];
          const itemRuns: (TextRun | ExternalHyperlink)[] = [];

          // Checklist support: [x] or [ ]
          if (item.task) {
            const checkSymbol = item.checked ? '☑ ' : '☐ ';
            itemRuns.push(
              new TextRun({
                text: checkSymbol,
                bold: true,
                font: 'Segoe UI Symbol',
                size: baseSize,
                color: item.checked ? primaryAccent : '94A3B8',
              })
            );
          } else if (isOrdered) {
            itemRuns.push(
              new TextRun({
                text: `${itemIdx + 1}. `,
                bold: true,
                font: baseFont,
                size: baseSize,
                color: primaryAccent,
              })
            );
          }

          // Extract text from item tokens
          const itemTokens = item.tokens || [];
          for (const it of itemTokens) {
            if (it.type === 'text' || it.type === 'paragraph') {
              if (it.tokens) {
                itemRuns.push(...processInlineTokens(it.tokens, settings, { strike: item.checked }));
              } else if (it.text) {
                itemRuns.push(
                  new TextRun({
                    text: decodeHtmlEntities(it.text),
                    font: baseFont,
                    size: baseSize,
                    color: textColor,
                    strike: item.checked,
                  })
                );
              }
            }
          }

          elements.push(
            new Paragraph({
              bullet: !isOrdered && !item.task ? { level: 0 } : undefined,
              indent: isOrdered || item.task ? { left: convertInchesToTwip(0.3) } : undefined,
              spacing: { before: 40, after: 60, line: lineSpacing },
              children: itemRuns.length > 0 ? itemRuns : [
                new TextRun({
                  text: decodeHtmlEntities(item.text || ''),
                  font: baseFont,
                  size: baseSize,
                  color: textColor,
                }),
              ],
            })
          );
        }
        break;
      }

      case 'table': {
        const headerRowTokens = token.header || [];
        const rowsTokens = token.rows || [];
        const alignments = token.align || [];

        const headerStrings = headerRowTokens.map((c: any) => c.text || '');
        const rowsStrings = rowsTokens.map((r: any[]) => r.map((c: any) => c.text || ''));
        const colWidths = calculateColumnWidthsTwips(headerStrings, rowsStrings, printableWidthTwips);

        const tableRows: TableRow[] = [];

        // Header Row
        const headerCells = headerRowTokens.map((cell: any, colIdx: number) => {
          const align = alignments[colIdx];
          let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;
          if (align === 'center') alignment = AlignmentType.CENTER;
          if (align === 'right') alignment = AlignmentType.RIGHT;

          const cellRuns = processInlineTokens(cell.tokens, settings, {
            bold: true,
            color: 'FFFFFF',
            font: headingFont,
            size: Math.max(18, baseSize - 2),
          });

          return new TableCell({
            width: { size: colWidths[colIdx] || 2000, type: WidthType.DXA },
            shading: {
              fill: primaryAccent,
              type: ShadingType.CLEAR,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: primaryAccent },
              bottom: { style: BorderStyle.SINGLE, size: 8, color: '94A3B8' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
            },
            margins: {
              top: 120,
              bottom: 120,
              left: 160,
              right: 160,
            },
            children: [
              new Paragraph({
                alignment,
                spacing: { before: 80, after: 80, line: 240 },
                children: cellRuns.length > 0 ? cellRuns : [
                  new TextRun({
                    text: decodeHtmlEntities(cell.text || ''),
                    bold: true,
                    color: 'FFFFFF',
                    font: headingFont,
                    size: Math.max(18, baseSize - 2),
                  }),
                ],
              }),
            ],
          });
        });

        tableRows.push(
          new TableRow({
            tableHeader: true,
            cantSplit: true,
            children: headerCells,
          })
        );

        // Body Rows
        rowsTokens.forEach((row: any[], rowIdx: number) => {
          const isZebra = settings.tableZebraStriping && rowIdx % 2 === 1;
          const bgFill = isZebra ? 'F8FAFC' : 'FFFFFF';

          const cells = row.map((cell: any, colIdx: number) => {
            const align = alignments[colIdx];
            let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT;
            if (align === 'center') alignment = AlignmentType.CENTER;
            if (align === 'right') alignment = AlignmentType.RIGHT;

            const cellRuns = processInlineTokens(cell.tokens, settings, {
              font: baseFont,
              size: Math.max(18, baseSize - 2),
              color: textColor,
            });

            return new TableCell({
              width: { size: colWidths[colIdx] || 2000, type: WidthType.DXA },
              shading: {
                fill: bgFill,
                type: ShadingType.CLEAR,
              },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              },
              margins: {
                top: 100,
                bottom: 100,
                left: 160,
                right: 160,
              },
              children: [
                new Paragraph({
                  alignment,
                  spacing: { before: 80, after: 80, line: 240 },
                  children: cellRuns.length > 0 ? cellRuns : [
                    new TextRun({
                      text: decodeHtmlEntities(cell.text || ''),
                      font: baseFont,
                      size: Math.max(18, baseSize - 2),
                      color: textColor,
                    }),
                  ],
                }),
              ],
            });
          });

          tableRows.push(
            new TableRow({
              cantSplit: true,
              children: cells,
            })
          );
        });

        elements.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
              left: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
              insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
            },
            rows: tableRows,
            margins: {
              top: 160,
              bottom: 240,
            },
          })
        );
        break;
      }

      case 'hr': {
        elements.push(
          new Paragraph({
            spacing: { before: 200, after: 200 },
            border: {
              bottom: {
                color: 'CBD5E1',
                size: 12,
                style: BorderStyle.SINGLE,
                space: 1,
              },
            },
            children: [new TextRun('')],
          })
        );
        break;
      }

      default:
        break;
    }
  }

  // Header & Footer
  const headersConfig: any = {};
  const footersConfig: any = {};

  if (settings.showHeader && settings.headerText) {
    headersConfig.default = new Header({
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          border: { bottom: { color: 'E2E8F0', size: 6, style: BorderStyle.SINGLE, space: 4 } },
          children: [
            new TextRun({
              text: settings.headerText,
              font: baseFont,
              size: 18,
              color: '94A3B8',
            }),
          ],
        }),
      ],
    });
  }

  if (settings.showPageNumbers) {
    let footerAlignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.CENTER;
    if (settings.pageNumberPosition === 'bottom-right') {
      footerAlignment = AlignmentType.RIGHT;
    }

    footersConfig.default = new Footer({
      children: [
        new Paragraph({
          alignment: footerAlignment,
          border: { top: { color: 'E2E8F0', size: 6, style: BorderStyle.SINGLE, space: 4 } },
          children: [
            new TextRun({
              text: 'Página ',
              font: baseFont,
              size: 18,
              color: '64748B',
            }),
            new TextRun({
              children: [PageNumber.CURRENT],
              font: baseFont,
              size: 18,
              color: '64748B',
            }),
            new TextRun({
              text: ' de ',
              font: baseFont,
              size: 18,
              color: '64748B',
            }),
            new TextRun({
              children: [PageNumber.TOTAL_PAGES],
              font: baseFont,
              size: 18,
              color: '64748B',
            }),
          ],
        }),
      ],
    });
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1.',
              alignment: AlignmentType.START,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: pageDimensions,
            margin: pageMargins,
          },
        },
        headers: Object.keys(headersConfig).length > 0 ? headersConfig : undefined,
        footers: Object.keys(footersConfig).length > 0 ? footersConfig : undefined,
        children: elements.length > 0 ? elements : [new Paragraph('Documento vacío')],
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  return buffer;
}

// Calculate statistical metrics from markdown text
export function calculateDocumentStats(text: string): DocumentStats {
  const clean = text.trim();
  if (!clean) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      readingTimeMinutes: 0,
      headingsCount: 0,
      tablesCount: 0,
      codeBlocksCount: 0,
      listsCount: 0,
    };
  }

  const { markdown: normalized } = normalizeAllTables(clean);
  const words = (clean.match(/\b\S+\b/g) || []).length;
  const characters = clean.length;
  const charactersNoSpaces = clean.replace(/\s/g, '').length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  const headingsCount = (normalized.match(/^#{1,6}\s+/gm) || []).length;
  const tablesCount = (normalized.match(/\|[\s\S]*?\|[\s\S]*?\n\|[-:\s|]+\|/g) || []).length;
  const codeBlocksCount = (normalized.match(/```[\s\S]*?```/g) || []).length;
  const listsCount = (normalized.match(/^(\s*[-*+]|\s*\d+\.)\s+/gm) || []).length;

  return {
    words,
    characters,
    charactersNoSpaces,
    readingTimeMinutes,
    headingsCount,
    tablesCount,
    codeBlocksCount,
    listsCount,
  };
}

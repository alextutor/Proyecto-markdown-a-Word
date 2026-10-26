export type FontFamily =
  | 'Calibri'
  | 'Arial'
  | 'Times New Roman'
  | 'Georgia'
  | 'Segoe UI'
  | 'Aptos'
  | 'Garamond';

export type PageSize = 'letter' | 'a4' | 'legal';
export type PageOrientation = 'portrait' | 'landscape';
export type MarginOption = 'normal' | 'narrow' | 'moderate' | 'wide';
export type LineSpacing = '1.0' | '1.15' | '1.5' | '2.0';

export interface DocumentMetadata {
  title: string;
  subtitle?: string;
  author?: string;
  organization?: string;
  date?: string;
  includeCoverPage?: boolean;
}

export interface DocumentSettings {
  fontFamily: FontFamily;
  headingFontFamily?: FontFamily;
  fontSizePt: number;
  primaryAccentColor: string; // Hex e.g. #1E3A8A
  secondaryAccentColor: string; // Hex e.g. #3B82F6
  textColor: string; // Hex e.g. #1F2937
  lineSpacing: LineSpacing;
  pageSize: PageSize;
  orientation: PageOrientation;
  margins: MarginOption;
  showPageNumbers: boolean;
  pageNumberPosition: 'bottom-center' | 'bottom-right' | 'top-right';
  headerText: string;
  showHeader: boolean;
  metadata: DocumentMetadata;
  tableZebraStriping: boolean;
}

export interface PresetTheme {
  id: string;
  name: string;
  description: string;
  settings: Partial<DocumentSettings>;
}

export interface DocumentStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  readingTimeMinutes: number;
  headingsCount: number;
  tablesCount: number;
  codeBlocksCount: number;
  listsCount: number;
}

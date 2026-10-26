import { DocumentSettings, PresetTheme } from '../types/converter';

export const DEFAULT_DOCUMENT_SETTINGS: DocumentSettings = {
  fontFamily: 'Calibri',
  headingFontFamily: 'Calibri',
  fontSizePt: 11,
  primaryAccentColor: '#1E3A8A', // Deep Navy
  secondaryAccentColor: '#2563EB', // Blue
  textColor: '#1F2937', // Charcoal Gray
  lineSpacing: '1.15',
  pageSize: 'letter',
  orientation: 'portrait',
  margins: 'normal',
  showPageNumbers: true,
  pageNumberPosition: 'bottom-center',
  headerText: 'Documento Confidencial',
  showHeader: false,
  metadata: {
    title: 'Documento sin título',
    subtitle: '',
    author: '',
    organization: '',
    date: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
    includeCoverPage: false,
  },
  tableZebraStriping: true,
};

export const PRESET_THEMES: PresetTheme[] = [
  {
    id: 'executive',
    name: 'Ejecutivo Moderno',
    description: 'Tipografía Calibri limpia con elegantes detalles en azul marino y tablas contrastadas.',
    settings: {
      fontFamily: 'Calibri',
      headingFontFamily: 'Calibri',
      primaryAccentColor: '#1E3A8A',
      secondaryAccentColor: '#2563EB',
      textColor: '#1F2937',
      fontSizePt: 11,
      lineSpacing: '1.15',
      margins: 'normal',
    },
  },
  {
    id: 'academic',
    name: 'Académico Clásico',
    description: 'Formato tradicional con Times New Roman, interlineado de 1.5 y tonos neutros sobrios.',
    settings: {
      fontFamily: 'Times New Roman',
      headingFontFamily: 'Times New Roman',
      primaryAccentColor: '#111827',
      secondaryAccentColor: '#4B5563',
      textColor: '#111827',
      fontSizePt: 12,
      lineSpacing: '1.5',
      margins: 'normal',
    },
  },
  {
    id: 'tech',
    name: 'Técnico & Software',
    description: 'Estilo moderno con Segoe UI, acentos verde azulado (Teal) y bloques de código nítidos.',
    settings: {
      fontFamily: 'Segoe UI',
      headingFontFamily: 'Segoe UI',
      primaryAccentColor: '#0F766E',
      secondaryAccentColor: '#0D9488',
      textColor: '#1E293B',
      fontSizePt: 10.5,
      lineSpacing: '1.15',
      margins: 'narrow',
    },
  },
  {
    id: 'editorial',
    name: 'Editorial Elegante',
    description: 'Tipografía serif Georgia refinada con acentos borgoña cálido para artículos y ensayos.',
    settings: {
      fontFamily: 'Georgia',
      headingFontFamily: 'Georgia',
      primaryAccentColor: '#831843',
      secondaryAccentColor: '#BE185D',
      textColor: '#27272A',
      fontSizePt: 11,
      lineSpacing: '1.25' as any,
      margins: 'moderate',
    },
  },
  {
    id: 'emerald',
    name: 'Esmeralda Corporativo',
    description: 'Arial legible y directo con toques verde esmeralda y estructura ágil para proyectos.',
    settings: {
      fontFamily: 'Arial',
      headingFontFamily: 'Arial',
      primaryAccentColor: '#065F46',
      secondaryAccentColor: '#059669',
      textColor: '#1F2937',
      fontSizePt: 11,
      lineSpacing: '1.15',
      margins: 'normal',
    },
  },
];

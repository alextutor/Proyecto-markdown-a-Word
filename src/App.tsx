/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { MarkdownEditor } from './components/MarkdownEditor';
import { WordPreview } from './components/WordPreview';
import { StatsBar, ViewMode } from './components/StatsBar';
import { DocumentSettingsModal } from './components/DocumentSettingsModal';
import { SampleTemplatesModal } from './components/SampleTemplatesModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DEFAULT_DOCUMENT_SETTINGS, PRESET_THEMES } from './utils/themePresets';
import { SAMPLE_DOCUMENTS, SampleDoc } from './utils/sampleDocuments';
import { DocumentSettings } from './types/converter';
import {
  convertMarkdownToDocxBlob,
  calculateDocumentStats,
} from './utils/docxConverter';
import { convertDocxToMarkdown } from './utils/wordToMarkdownConverter';
import { convertPdfToMarkdown } from './utils/pdfToMarkdownConverter';
import { normalizeAllTables } from './utils/tableNormalizer';
import { marked } from 'marked';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const STORAGE_KEY_MARKDOWN = 'md_to_docx_content';
const STORAGE_KEY_SETTINGS = 'md_to_docx_settings';
const STORAGE_KEY_FILENAME = 'md_to_docx_filename';

export default function App() {
  // Document markdown content
  const [markdown, setMarkdown] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MARKDOWN);
      if (saved && saved.trim()) return saved;
    } catch {
      // ignore
    }
    return SAMPLE_DOCUMENTS[0].markdown;
  });

  // Settings & styling
  const [settings, setSettings] = useState<DocumentSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...DEFAULT_DOCUMENT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_DOCUMENT_SETTINGS;
  });

  // File name
  const [fileName, setFileName] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FILENAME);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'informe-ejecutivo';
  });

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [zoom, setZoom] = useState<number>(100);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImportingWord, setIsImportingWord] = useState<boolean>(false);
  const [isImportingPdf, setIsImportingPdf] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Toast notification
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' = 'success') => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((current) => (current?.message === message ? null : current));
      }, 4000);
    },
    []
  );

  // Autosave to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_MARKDOWN, markdown);
    } catch {
      // ignore
    }
  }, [markdown]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FILENAME, fileName);
    } catch {
      // ignore
    }
  }, [fileName]);

  // Statistics calculation
  const stats = useMemo(() => {
    return calculateDocumentStats(markdown);
  }, [markdown]);

  // Handle Preset theme selection
  const handleSelectThemePreset = (themeId: string) => {
    const preset = PRESET_THEMES.find((t) => t.id === themeId);
    if (!preset) return;

    setSettings((prev) => ({
      ...prev,
      ...preset.settings,
    }));
    showToast(`Tema aplicado: ${preset.name}`, 'info');
  };

  // Handle Sample selection
  const handleSelectSample = (sample: SampleDoc) => {
    setMarkdown(sample.markdown);
    setFileName(sample.id);

    const relatedTheme = PRESET_THEMES.find((t) => t.id === sample.themeId);
    if (relatedTheme) {
      setSettings((prev) => ({
        ...prev,
        ...relatedTheme.settings,
        metadata: {
          ...prev.metadata,
          title: sample.name,
        },
      }));
    }
    showToast(`Plantilla cargada: ${sample.name}`, 'success');
  };

  // Export to .docx file
  const handleExportDocx = async () => {
    if (!markdown.trim()) {
      showToast('El documento está vacío. Escribe algo antes de exportar.', 'error');
      return;
    }

    try {
      setIsExporting(true);
      const blob = await convertMarkdownToDocxBlob(markdown, settings);

      // Create download trigger
      const cleanName = (fileName.trim() || 'documento')
        .replace(/[\\/:*?"<>|]/g, '_')
        .replace(/\.docx$/i, '');

      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${cleanName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      showToast(`¡Archivo ${cleanName}.docx descargado exitosamente!`, 'success');
    } catch (err) {
      console.error('Error al exportar DOCX:', err);
      showToast('Ocurrió un error al generar el archivo Word.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy as rich text (HTML) for direct paste into Word or Docs
  const handleCopyRichText = async () => {
    if (!markdown.trim()) return;

    try {
      const htmlContent = marked.parse(markdown, { async: false }) as string;
      const wrappedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: ${settings.fontFamily}, sans-serif; color: ${settings.textColor}; line-height: 1.5; font-size: ${settings.fontSizePt}pt; }
            h1 { color: ${settings.primaryAccentColor}; font-size: 20pt; font-weight: bold; }
            h2 { color: ${settings.primaryAccentColor}; font-size: 16pt; font-weight: bold; }
            h3 { color: ${settings.secondaryAccentColor}; font-size: 13pt; font-weight: bold; }
            table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
            th { background-color: ${settings.primaryAccentColor}; color: #ffffff; padding: 6pt 10pt; border: 1pt solid #cbd5e1; }
            td { padding: 6pt 10pt; border: 1pt solid #cbd5e1; }
            blockquote { border-left: 4pt solid ${settings.primaryAccentColor}; padding-left: 12pt; color: #475569; font-style: italic; }
            pre { background-color: #f1f5f9; padding: 8pt; border-left: 3pt solid ${settings.primaryAccentColor}; font-family: Consolas, monospace; }
            code { font-family: Consolas, monospace; background: #f1f5f9; padding: 2pt 4pt; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;

      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([markdown], { type: 'text/plain' });
        const htmlBlob = new Blob([wrappedHtml], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': textBlob,
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(markdown);
      }

      setIsCopied(true);
      showToast('Formato copiado. Puedes pegarlo (Ctrl+V) directamente en Word.', 'success');
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error('Error al copiar:', err);
      // Fallback
      try {
        await navigator.clipboard.writeText(markdown);
        setIsCopied(true);
        showToast('Texto copiado al portapapeles.', 'info');
        setTimeout(() => setIsCopied(false), 2500);
      } catch {
        showToast('No se pudo acceder al portapapeles.', 'error');
      }
    }
  };

  // Download Markdown backup
  const handleDownloadMarkdown = () => {
    const cleanName = (fileName.trim() || 'documento')
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\.docx$/i, '');

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cleanName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Archivo ${cleanName}.md guardado.`, 'info');
  };

  // Optimize / Normalize tables in current markdown text
  const handleNormalizeTables = () => {
    const { markdown: normalized, convertedCount } = normalizeAllTables(markdown);
    if (convertedCount > 0) {
      setMarkdown(normalized);
      showToast(
        `¡${convertedCount} tabla(s) optimizada(s) con formato nativo de Word!`,
        'success'
      );
    } else {
      showToast(
        'El documento ya cuenta con tablas en formato Markdown estándar.',
        'info'
      );
    }
  };

  // Handle file drop & upload (.docx, .pdf, or .md/.markdown/.txt)
  const handleFileUpload = async (file: File) => {
    const isDocx = /\.docx$/i.test(file.name);
    const isPdf = /\.pdf$/i.test(file.name);
    const isMdOrTxt = /\.(md|markdown|txt)$/i.test(file.name);

    if (!isDocx && !isPdf && !isMdOrTxt) {
      showToast(
        'Por favor selecciona un archivo Word (.docx), PDF (.pdf) o Markdown (.md, .markdown, .txt)',
        'error'
      );
      return;
    }

    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');

    // 1. Handle PDF files
    if (isPdf) {
      try {
        setIsImportingPdf(true);
        const { markdown: convertedMd, pageCount, title } = await convertPdfToMarkdown(file, {
          includePageBreaks: true,
          detectHeadings: true,
          detectTables: true,
        });

        if (!convertedMd.trim()) {
          showToast(
            'El PDF parece estar vacío o compuesto exclusivamente por imágenes escaneadas sin capa de texto.',
            'info'
          );
        } else {
          setMarkdown(convertedMd);
          setFileName(nameWithoutExt);
          showToast(
            `¡PDF "${file.name}" (${pageCount} página${pageCount > 1 ? 's' : ''}) convertido a Markdown con éxito!`,
            'success'
          );
        }
      } catch (err) {
        console.error('Error al convertir PDF a Markdown:', err);
        showToast(
          'No se pudo convertir el archivo PDF. Verifica que el archivo no esté corrupto o protegido con contraseña.',
          'error'
        );
      } finally {
        setIsImportingPdf(false);
      }
      return;
    }

    // 2. Handle Word (.docx) files
    if (isDocx) {
      try {
        setIsImportingWord(true);
        const { markdown: convertedMd } = await convertDocxToMarkdown(file);
        if (!convertedMd.trim()) {
          showToast('El archivo Word parece estar vacío o sin texto extraíble.', 'info');
        } else {
          setMarkdown(convertedMd);
          setFileName(nameWithoutExt);
          showToast(
            `¡Word "${file.name}" convertido a Markdown exitosamente!`,
            'success'
          );
        }
      } catch (err) {
        console.error('Error al convertir DOCX a Markdown:', err);
        showToast(
          'No se pudo convertir el archivo .docx. Verifica que sea un documento Word válido.',
          'error'
        );
      } finally {
        setIsImportingWord(false);
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content !== undefined) {
        // Automatically check and normalize any box-drawing or code-wrapped tables
        const { markdown: normalized, convertedCount } = normalizeAllTables(content);
        setMarkdown(normalized);
        setFileName(nameWithoutExt);
        if (convertedCount > 0) {
          showToast(
            `Archivo "${file.name}" cargado. Se optimizaron automáticamente ${convertedCount} tabla(s) a formato nativo Word.`,
            'success'
          );
        } else {
          showToast(`Archivo "${file.name}" cargado con éxito`, 'success');
        }
      }
    };
    reader.onerror = () => {
      showToast('Error al leer el archivo seleccionado', 'error');
    };
    reader.readAsText(file);
  };

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only disable if leaving the window/pane
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <div
      id="app-root-layout"
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans"
    >
      {/* Top Application Header */}
      <Header
        fileName={fileName}
        onFileNameChange={setFileName}
        settings={settings}
        onSelectThemePreset={handleSelectThemePreset}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onExportDocx={handleExportDocx}
        onDownloadMarkdown={handleDownloadMarkdown}
        onImportFile={handleFileUpload}
        onCopyRichText={handleCopyRichText}
        isExporting={isExporting}
        isImportingWord={isImportingWord}
        isImportingPdf={isImportingPdf}
        isCopied={isCopied}
      />

      {/* Main Workspace Area (Split or Single view) */}
      <main id="app-workspace" className="flex-1 flex overflow-hidden relative">
        {/* Editor Pane */}
        {(viewMode === 'split' || viewMode === 'editor') && (
          <div
            id="editor-container"
            className={`${
              viewMode === 'split' ? 'w-full lg:w-1/2 border-r border-slate-200' : 'w-full'
            } h-full flex flex-col`}
          >
            <MarkdownEditor
              value={markdown}
              onChange={setMarkdown}
              onFileUpload={handleFileUpload}
              onReset={() => {
                if (window.confirm('¿Deseas vaciar el editor? Se perderán los cambios actuales.')) {
                  setMarkdown('');
                  showToast('Editor vaciado', 'info');
                }
              }}
              onLoadSample={() => setIsTemplatesOpen(true)}
              onNormalizeTables={handleNormalizeTables}
              onNotify={showToast}
              isDragging={isDragging}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            />
          </div>
        )}

        {/* Word Document Preview Pane */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div
            id="preview-container"
            className={`${
              viewMode === 'split' ? 'hidden lg:flex lg:w-1/2' : 'flex w-full'
            } h-full flex-col`}
          >
            <WordPreview
              markdown={markdown}
              settings={settings}
              zoom={zoom}
              onZoomChange={setZoom}
              onPasteFormatted={(pastedMd) => {
                setMarkdown((prev) => (prev.trim() ? `${prev}\n\n${pastedMd}` : pastedMd));
              }}
              onNotify={showToast}
            />
          </div>
        )}
      </main>

      {/* Bottom Statistics & Status Footer */}
      <StatsBar
        stats={stats}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDownloadMarkdown={handleDownloadMarkdown}
      />

      {/* Format & Style Settings Modal */}
      <DocumentSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      {/* Pre-made Templates Modal */}
      <SampleTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectSample={handleSelectSample}
      />

      {/* PWA Offline Mode Indicator */}
      <OfflineIndicator />

      {/* Floating Toast Notification */}
      {toast && (
        <div
          id="app-toast-notification"
          className={`fixed bottom-12 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : toast.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 p-0.5 hover:opacity-75 rounded transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useMemo } from 'react';
import { marked } from 'marked';
import { DocumentSettings } from '../types/converter';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  CheckCircle2,
  Circle,
  ClipboardPaste,
} from 'lucide-react';
import { normalizeAllTables } from '../utils/tableNormalizer';
import {
  convertHtmlToMarkdown,
  extractMarkdownFromClipboard,
} from '../utils/htmlToMarkdown';

interface WordPreviewProps {
  markdown: string;
  settings: DocumentSettings;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onPasteFormatted?: (markdownText: string) => void;
  onNotify?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const WordPreview: React.FC<WordPreviewProps> = ({
  markdown,
  settings,
  zoom,
  onZoomChange,
  onPasteFormatted,
  onNotify,
}) => {
  // Parse markdown into HTML for real-time preview
  const parsedHtml = useMemo(() => {
    try {
      // Pre-normalize all table formats (Unicode box drawing, ASCII borders, code-block wrapped, and indented)
      const { markdown: normalized } = normalizeAllTables(markdown);

      // Replace page breaks with a custom tag for preview
      let preprocessed = normalized
        .replace(/\\pagebreak/g, '<div class="page-break-indicator"><span>--- Salto de página ---</span></div>')
        .replace(/<!--\s*pagebreak\s*-->/gi, '<div class="page-break-indicator"><span>--- Salto de página ---</span></div>')
        .replace(/\*\*\*pagebreak\*\*\*/g, '<div class="page-break-indicator"><span>--- Salto de página ---</span></div>');

      // Replace markdown checklists - [x] and - [ ] for nice HTML representation
      preprocessed = preprocessed
        .replace(/^(\s*)-\s+\[x\]\s+(.*)$/gim, '$1- <span class="task-item checked">☑</span> <span class="task-text done">$2</span>')
        .replace(/^(\s*)-\s+\[\s\]\s+(.*)$/gim, '$1- <span class="task-item unchecked">☐</span> <span class="task-text">$2</span>');

      return marked.parse(preprocessed, { async: false }) as string;
    } catch {
      return '<p class="text-rose-500">Error al procesar la vista previa del documento Markdown.</p>';
    }
  }, [markdown]);

  // Margin classes
  const marginStyle = useMemo(() => {
    switch (settings.margins) {
      case 'narrow':
        return { padding: '24px 32px' };
      case 'moderate':
        return { padding: '48px 40px' };
      case 'wide':
        return { padding: '48px 72px' };
      case 'normal':
      default:
        return { padding: '48px 56px' };
    }
  }, [settings.margins]);

  // Line spacing style
  const lineSpacingClass = useMemo(() => {
    switch (settings.lineSpacing) {
      case '1.0':
        return 'leading-normal';
      case '1.5':
        return 'leading-relaxed';
      case '2.0':
        return 'leading-loose';
      case '1.15':
      default:
        return 'leading-normal';
    }
  }, [settings.lineSpacing]);

  // Handle paste directly into the Word Preview panel
  const handlePreviewPaste = (e: React.ClipboardEvent) => {
    const result = extractMarkdownFromClipboard(e.clipboardData);
    if (result.markdown && result.markdown.trim()) {
      e.preventDefault();
      onPasteFormatted?.(result.markdown);
      onNotify?.(
        '✨ Texto con formato pegado en la vista previa y sincronizado con el editor Markdown.',
        'success'
      );
    }
  };

  const handlePasteButtonClick = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes('text/html')) {
            const blob = await item.getType('text/html');
            const html = await blob.text();
            const md = convertHtmlToMarkdown(html);
            if (md && md.trim()) {
              onPasteFormatted?.(md);
              onNotify?.(
                '✨ Texto con formato pegado en la vista previa y sincronizado con el editor Markdown.',
                'success'
              );
              return;
            }
          }
        }
      }
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          onPasteFormatted?.(text);
          onNotify?.('Texto pegado en la vista previa.', 'info');
          return;
        }
      }
    } catch {
      onNotify?.(
        '💡 Presiona Ctrl+V en el panel izquierdo (editor) para pegar directamente tu texto con formato.',
        'info'
      );
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-slate-200/70 select-text overflow-hidden focus:outline-none"
      tabIndex={0}
      onPaste={handlePreviewPaste}
    >
      {/* Top Preview Bar */}
      <div
        id="preview-header-bar"
        className="flex items-center justify-between px-4 py-2 bg-white border-b border-slate-200 text-xs text-slate-600 z-10 gap-2 flex-wrap"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-800">
            <FileText className="w-4 h-4 text-blue-700" />
            <span>Vista de Documento Word (.docx)</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono text-[11px]">
            {settings.fontFamily} {settings.fontSizePt}pt • {settings.pageSize.toUpperCase()} ({settings.orientation === 'portrait' ? 'Vertical' : 'Horizontal'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onPasteFormatted && (
            <button
              id="preview-btn-paste-formatted"
              type="button"
              onClick={handlePasteButtonClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-md font-medium text-xs shadow-xs transition-colors cursor-pointer"
              title="Pegar texto con formato aquí (convierte negritas, viñetas, tablas automáticamente a Markdown)"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pegar con formato</span>
            </button>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              id="preview-zoom-out"
              type="button"
              onClick={() => onZoomChange(Math.max(50, zoom - 10))}
              className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
              title="Reducir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] min-w-10 text-center font-semibold text-slate-700">
              {zoom}%
            </span>
            <button
              id="preview-zoom-in"
              type="button"
              onClick={() => onZoomChange(Math.min(150, zoom + 10))}
              className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              id="preview-zoom-reset"
              type="button"
              onClick={() => onZoomChange(100)}
              className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
              title="Restablecer al 100%"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Document Workspace with Paper Canvas */}
      <div
        id="preview-viewport"
        className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start bg-slate-300/60"
      >
        <div
          id="word-paper-sheet"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            fontFamily: settings.fontFamily,
            color: settings.textColor,
            fontSize: `${settings.fontSizePt * 1.33}px`,
            maxWidth: settings.orientation === 'landscape' ? '1060px' : '820px',
            width: '100%',
            minHeight: settings.orientation === 'landscape' ? '750px' : '1060px',
            ...marginStyle,
          }}
          className={`bg-white shadow-xl rounded-xs transition-transform duration-100 flex flex-col relative ${lineSpacingClass}`}
        >
          {/* Header of Word Document */}
          {settings.showHeader && settings.headerText && (
            <div className="pb-3 mb-6 border-b border-slate-200 text-right text-xs text-slate-400 font-sans tracking-wide">
              {settings.headerText}
            </div>
          )}

          {/* Optional Cover Page */}
          {settings.metadata?.includeCoverPage && (
            <div className="mb-12 pb-12 border-b border-dashed border-slate-300 flex flex-col justify-center min-h-[380px]">
              <div
                className="text-4xl font-bold tracking-tight mb-3"
                style={{ color: settings.primaryAccentColor }}
              >
                {settings.metadata.title || 'Título del Documento'}
              </div>

              {settings.metadata.subtitle && (
                <div
                  className="text-xl mb-8 font-medium"
                  style={{ color: settings.secondaryAccentColor }}
                >
                  {settings.metadata.subtitle}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-slate-200 space-y-1 text-sm text-slate-600">
                {settings.metadata.author && (
                  <div>
                    <span className="font-semibold text-slate-800">Autor:</span> {settings.metadata.author}
                  </div>
                )}
                {settings.metadata.organization && (
                  <div>
                    <span className="font-semibold text-slate-800">Organización:</span> {settings.metadata.organization}
                  </div>
                )}
                {settings.metadata.date && (
                  <div>
                    <span className="font-semibold text-slate-800">Fecha:</span> {settings.metadata.date}
                  </div>
                )}
              </div>

              <div className="mt-8 text-center text-xs text-slate-400 font-mono">
                [ Portada del Documento — Salto de página siguiente ]
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div
            id="word-content-render"
            className="flex-1 word-rendered-body"
            dangerouslySetInnerHTML={{ __html: parsedHtml }}
          />

          {/* Footer with Page Numbers */}
          {settings.showPageNumbers && (
            <div
              className={`pt-4 mt-8 border-t border-slate-200 text-xs text-slate-400 font-sans ${
                settings.pageNumberPosition === 'bottom-right'
                  ? 'text-right'
                  : 'text-center'
              }`}
            >
              Página 1 de 1
            </div>
          )}
        </div>
      </div>

      {/* Scoped CSS for Word Rendering Styles */}
      <style>{`
        .word-rendered-body h1 {
          font-size: 2.1em;
          font-weight: 700;
          color: ${settings.primaryAccentColor};
          margin-top: 1.2em;
          margin-bottom: 0.4em;
          line-height: 1.2;
        }
        .word-rendered-body h2 {
          font-size: 1.6em;
          font-weight: 700;
          color: ${settings.primaryAccentColor};
          margin-top: 1.1em;
          margin-bottom: 0.35em;
          line-height: 1.25;
        }
        .word-rendered-body h3 {
          font-size: 1.25em;
          font-weight: 600;
          color: ${settings.secondaryAccentColor};
          margin-top: 0.9em;
          margin-bottom: 0.3em;
        }
        .word-rendered-body h4 {
          font-size: 1.1em;
          font-weight: 600;
          color: ${settings.secondaryAccentColor};
          margin-top: 0.8em;
          margin-bottom: 0.25em;
        }
        .word-rendered-body p {
          margin-top: 0.3em;
          margin-bottom: 0.8em;
        }
        .word-rendered-body strong {
          font-weight: 700;
        }
        .word-rendered-body em {
          font-style: italic;
        }
        .word-rendered-body a {
          color: ${settings.secondaryAccentColor};
          text-decoration: underline;
        }
        .word-rendered-body blockquote {
          border-left: 4px solid ${settings.primaryAccentColor};
          padding-left: 1rem;
          margin-left: 0;
          margin-right: 0;
          margin-top: 0.8em;
          margin-bottom: 0.8em;
          color: #334155;
          font-style: italic;
        }
        .word-rendered-body code {
          font-family: Consolas, monospace;
          background-color: #f1f5f9;
          color: ${settings.primaryAccentColor};
          padding: 0.15em 0.35em;
          border-radius: 3px;
          font-size: 0.88em;
        }
        .word-rendered-body pre {
          background-color: #f8fafc;
          border-left: 3px solid ${settings.primaryAccentColor};
          padding: 0.75rem 1rem;
          border-radius: 4px;
          overflow-x: auto;
          margin: 0.8em 0;
        }
        .word-rendered-body pre code {
          background-color: transparent;
          color: #0f172a;
          padding: 0;
          font-size: 0.85em;
          line-height: 1.45;
        }
        .word-rendered-body ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.4em 0 0.8em 0;
        }
        .word-rendered-body ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.4em 0 0.8em 0;
        }
        .word-rendered-body li {
          margin-bottom: 0.25em;
        }
        .word-rendered-body hr {
          border: none;
          border-top: 1px solid #cbd5e1;
          margin: 1.4em 0;
        }
        .word-rendered-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 1em 0;
          font-size: 0.95em;
        }
        .word-rendered-body th {
          background-color: ${settings.primaryAccentColor};
          color: #ffffff;
          font-weight: 600;
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          text-align: left;
        }
        .word-rendered-body td {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
        }
        ${settings.tableZebraStriping ? `
        .word-rendered-body tbody tr:nth-child(even) {
          background-color: #f8fafc;
        }
        ` : ''}
        .word-rendered-body img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          margin: 1em auto;
          display: block;
        }
        .task-item {
          font-family: "Segoe UI Symbol", sans-serif;
          font-size: 1.1em;
          margin-right: 0.3em;
        }
        .task-item.checked {
          color: ${settings.primaryAccentColor};
          font-weight: bold;
        }
        .task-item.unchecked {
          color: #94a3b8;
        }
        .task-text.done {
          text-decoration: line-through;
          color: #94a3b8;
        }
        .page-break-indicator {
          border-top: 2px dashed #94a3b8;
          text-align: center;
          margin: 2rem 0;
          position: relative;
        }
        .page-break-indicator span {
          background-color: #f1f5f9;
          color: #475569;
          font-size: 0.75rem;
          font-family: sans-serif;
          padding: 0.2rem 0.6rem;
          border-radius: 9999px;
          position: relative;
          top: -0.75rem;
          border: 1px solid #cbd5e1;
        }
      `}</style>
    </div>
  );
};

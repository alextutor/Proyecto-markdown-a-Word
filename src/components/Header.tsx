import React, { useRef } from 'react';
import { PRESET_THEMES } from '../utils/themePresets';
import { DocumentSettings } from '../types/converter';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Download,
  Copy,
  Check,
  Sliders,
  Sparkles,
  FileText,
  Palette,
  Loader2,
  FileUp,
  FileDown,
  ArrowLeftRight,
} from 'lucide-react';

interface HeaderProps {
  fileName: string;
  onFileNameChange: (name: string) => void;
  settings: DocumentSettings;
  onSelectThemePreset: (themeId: string) => void;
  onOpenSettings: () => void;
  onOpenTemplates: () => void;
  onExportDocx: () => void;
  onDownloadMarkdown: () => void;
  onImportFile: (file: File) => void;
  onCopyRichText: () => void;
  isExporting: boolean;
  isImportingWord: boolean;
  isImportingPdf?: boolean;
  isCopied: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  fileName,
  onFileNameChange,
  onSelectThemePreset,
  onOpenSettings,
  onOpenTemplates,
  onExportDocx,
  onDownloadMarkdown,
  onImportFile,
  onCopyRichText,
  isExporting,
  isImportingWord,
  isImportingPdf = false,
  isCopied,
}) => {
  const wordFileInputRef = useRef<HTMLInputElement>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileInputSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  return (
    <header
      id="app-main-header"
      className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-2xs z-20"
    >
      {/* Brand & File Name */}
      <div className="flex items-center gap-3">
        {/* Bidirectional Word <-> Markdown Icon */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-xs select-none">
            W
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 tracking-tight">
                Markdown
              </span>
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-bold text-sm text-blue-700 tracking-tight">
                Word (.docx)
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium leading-none">
              Conversor Bidireccional Office y MD
            </div>
          </div>
        </div>

        <div className="hidden md:block w-px h-6 bg-slate-200" />

        {/* Editable File Name */}
        <div className="hidden sm:flex items-center bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
          <FileText className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
          <input
            id="input-file-name"
            type="text"
            value={fileName}
            onChange={(e) => onFileNameChange(e.target.value)}
            placeholder="nombre-del-documento"
            className="bg-transparent border-none outline-hidden text-slate-700 font-mono text-xs w-36 sm:w-44 placeholder:text-slate-400"
          />
          <span className="text-slate-400 text-[11px] font-mono select-none">.docx / .pdf / .md</span>
        </div>
      </div>

      {/* Control Actions & Theme selector */}
      <div className="flex items-center flex-wrap gap-2">
        {/* Hidden input for importing Word (.docx) */}
        <input
          ref={wordFileInputRef}
          type="file"
          accept=".docx"
          onChange={handleFileInputSelect}
          className="hidden"
          id="header-word-file-input"
        />

        {/* Hidden input for importing PDF (.pdf) */}
        <input
          ref={pdfFileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputSelect}
          className="hidden"
          id="header-pdf-file-input"
        />

        {/* Import Word (.docx) to Markdown Button */}
        <button
          id="btn-import-docx"
          type="button"
          onClick={() => wordFileInputRef.current?.click()}
          disabled={isImportingWord || isImportingPdf}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
          title="Subir un archivo Microsoft Word (.docx) para convertirlo automáticamente a Markdown"
        >
          {isImportingWord ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Convirtiendo Word...</span>
            </>
          ) : (
            <>
              <FileUp className="w-3.5 h-3.5 text-blue-600" />
              <span>Importar Word (.docx)</span>
            </>
          )}
        </button>

        {/* Import PDF to Markdown Button */}
        <button
          id="btn-import-pdf"
          type="button"
          onClick={() => pdfFileInputRef.current?.click()}
          disabled={isImportingPdf || isImportingWord}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
          title="Subir un archivo PDF para extraer texto, títulos, tablas y convertir a Markdown"
        >
          {isImportingPdf ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-600" />
              <span>Convirtiendo PDF...</span>
            </>
          ) : (
            <>
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Importar PDF (.pdf)</span>
            </>
          )}
        </button>

        {/* Theme Preset Selector */}
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700">
          <Palette className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
          <select
            id="select-theme-preset"
            onChange={(e) => onSelectThemePreset(e.target.value)}
            className="bg-transparent border-none outline-hidden text-xs text-slate-800 font-medium cursor-pointer"
            defaultValue=""
          >
            <option value="" disabled>
              Temas de Estilo
            </option>
            {PRESET_THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
        </div>

        {/* Format Settings Button */}
        <button
          id="btn-open-settings"
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
          title="Configurar tipografía, márgenes, colores y encabezados"
        >
          <Sliders className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden xl:inline">Formato</span>
        </button>

        {/* Templates Button */}
        <button
          id="btn-open-templates"
          type="button"
          onClick={onOpenTemplates}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80 border border-indigo-200/80 rounded-lg transition-colors shadow-2xs"
          title="Ver ejemplos predefinidos"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden xl:inline">Plantillas</span>
        </button>

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Copy HTML Rich Text Button */}
        <button
          id="btn-copy-richtext"
          type="button"
          onClick={onCopyRichText}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs"
          title="Copiar contenido con formato para pegar directamente en Word o Google Docs"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">¡Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline">Copiar</span>
            </>
          )}
        </button>

        {/* Export Markdown (.md) Button */}
        <button
          id="btn-export-md-header"
          type="button"
          onClick={onDownloadMarkdown}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
          title="Descargar como archivo Markdown (.md)"
        >
          <FileDown className="w-3.5 h-3.5 text-slate-600" />
          <span>Descargar .md</span>
        </button>

        {/* Export to Word .docx Button */}
        <button
          id="btn-export-docx"
          type="button"
          onClick={onExportDocx}
          disabled={isExporting}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-60 rounded-lg shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer"
          title="Generar y descargar archivo Microsoft Word .docx"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generando...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Descargar .docx</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

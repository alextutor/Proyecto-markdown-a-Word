import React from 'react';
import { DocumentStats } from '../types/converter';
import {
  Columns2,
  FileEdit,
  Eye,
  FileDown,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export type ViewMode = 'split' | 'editor' | 'preview';

interface StatsBarProps {
  stats: DocumentStats;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onDownloadMarkdown: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  viewMode,
  onViewModeChange,
  onDownloadMarkdown,
}) => {
  return (
    <footer
      id="app-stats-bar"
      className="bg-white border-t border-slate-200 px-4 py-1.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 select-none z-10"
    >
      {/* Metrics & Statistics */}
      <div className="flex items-center flex-wrap gap-3 font-mono text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-600 font-sans text-xs">Autoguardado</span>
        </div>

        <span className="text-slate-300">|</span>

        <div>
          <strong className="text-slate-800 font-semibold">{stats.words}</strong> palabras
        </div>

        <div>
          <strong className="text-slate-800 font-semibold">{stats.characters}</strong> caracteres
        </div>

        <div className="hidden sm:block">
          <strong className="text-slate-800 font-semibold">{stats.headingsCount}</strong> títulos
        </div>

        {stats.tablesCount > 0 && (
          <div className="hidden md:block">
            <strong className="text-slate-800 font-semibold">{stats.tablesCount}</strong> tablas
          </div>
        )}

        {stats.codeBlocksCount > 0 && (
          <div className="hidden md:block">
            <strong className="text-slate-800 font-semibold">{stats.codeBlocksCount}</strong> bloques de código
          </div>
        )}

        <div className="hidden lg:flex items-center gap-1 text-slate-500">
          <BookOpen className="w-3 h-3 text-slate-400" />
          <span>~{stats.readingTimeMinutes} min lectura</span>
        </div>
      </div>

      {/* View Mode Controls & Markdown Backup */}
      <div className="flex items-center gap-2">
        <button
          id="btn-download-md"
          type="button"
          onClick={onDownloadMarkdown}
          className="inline-flex items-center gap-1 px-2 py-0.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-xs transition-colors"
          title="Descargar copia de respaldo en formato .md"
        >
          <FileDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Guardar .md</span>
        </button>

        <div className="w-px h-4 bg-slate-200" />

        {/* View Switchers */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-slate-600">
          <button
            id="view-mode-editor"
            type="button"
            onClick={() => onViewModeChange('editor')}
            className={`p-1 rounded-md transition-colors ${
              viewMode === 'editor'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
            title="Ver solo Editor Markdown"
          >
            <FileEdit className="w-3.5 h-3.5" />
          </button>
          <button
            id="view-mode-split"
            type="button"
            onClick={() => onViewModeChange('split')}
            className={`p-1 rounded-md transition-colors ${
              viewMode === 'split'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
            title="Vista dividida (Editor + Vista Previa)"
          >
            <Columns2 className="w-3.5 h-3.5" />
          </button>
          <button
            id="view-mode-preview"
            type="button"
            onClick={() => onViewModeChange('preview')}
            className={`p-1 rounded-md transition-colors ${
              viewMode === 'preview'
                ? 'bg-white text-blue-700 shadow-xs font-semibold'
                : 'hover:text-slate-900'
            }`}
            title="Ver solo Vista Previa Word"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};

import React, { useRef } from 'react';
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  FileCode,
  FileUp,
  RotateCcw,
  Sparkles,
  Wand2,
  ClipboardPaste,
} from 'lucide-react';

interface ToolbarProps {
  onInsertSyntax: (prefix: string, suffix?: string, defaultPlaceholder?: string) => void;
  onInsertBlock: (blockText: string) => void;
  onFileUpload: (file: File) => void;
  onReset: () => void;
  onLoadSample: () => void;
  onNormalizeTables?: () => void;
  onPasteFormatted?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onInsertSyntax,
  onInsertBlock,
  onFileUpload,
  onReset,
  onLoadSample,
  onNormalizeTables,
  onPasteFormatted,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const insertTable = () => {
    const tableTemplate = `
| Encabezado 1 | Encabezado 2 | Encabezado 3 |
| :--- | :---: | ---: |
| Dato A1 | Dato B1 | $100 |
| Dato A2 | Dato B2 | $250 |
`;
    onInsertBlock(tableTemplate);
  };

  const insertCodeBlock = () => {
    const codeTemplate = `\`\`\`typescript
function ejemplo() {
  console.log("Hola Word!");
}
\`\`\``;
    onInsertBlock(codeTemplate);
  };

  return (
    <div
      id="editor-toolbar"
      className="flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 bg-slate-50 border-b border-slate-200 text-slate-700 select-none text-xs"
    >
      {/* Quick Formatting Buttons */}
      <div className="flex flex-wrap items-center gap-0.5">
        {/* Headings */}
        <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-xs">
          <button
            id="toolbar-btn-h1"
            type="button"
            onClick={() => onInsertSyntax('# ', '', 'Título 1')}
            title="Título 1 (H1)"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-h2"
            type="button"
            onClick={() => onInsertSyntax('## ', '', 'Título 2')}
            title="Título 2 (H2)"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-h3"
            type="button"
            onClick={() => onInsertSyntax('### ', '', 'Título 3')}
            title="Título 3 (H3)"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Inline styles */}
        <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-xs">
          <button
            id="toolbar-btn-bold"
            type="button"
            onClick={() => onInsertSyntax('**', '**', 'texto en negrita')}
            title="Negrita (Ctrl+B)"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-italic"
            type="button"
            onClick={() => onInsertSyntax('*', '*', 'texto en cursiva')}
            title="Cursiva (Ctrl+I)"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-strikethrough"
            type="button"
            onClick={() => onInsertSyntax('~~', '~~', 'texto tachado')}
            title="Tachado"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-inline-code"
            type="button"
            onClick={() => onInsertSyntax('`', '`', 'código')}
            title="Código en línea"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Lists & Checklist */}
        <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-xs">
          <button
            id="toolbar-btn-bullet-list"
            type="button"
            onClick={() => onInsertSyntax('- ', '', 'Elemento de lista')}
            title="Lista con viñetas"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-ordered-list"
            type="button"
            onClick={() => onInsertSyntax('1. ', '', 'Primer elemento')}
            title="Lista numerada"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-checklist"
            type="button"
            onClick={() => onInsertSyntax('- [ ] ', '', 'Tarea pendiente')}
            title="Lista de tareas / checklist"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Blocks & Components */}
        <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-xs">
          <button
            id="toolbar-btn-quote"
            type="button"
            onClick={() => onInsertSyntax('> ', '', 'Cita destacada o nota importante')}
            title="Cita en bloque"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-code-block"
            type="button"
            onClick={insertCodeBlock}
            title="Bloque de código con resaltado"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <FileCode className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-table"
            type="button"
            onClick={insertTable}
            title="Insertar Tabla con formato Word"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          {onNormalizeTables && (
            <button
              id="toolbar-btn-normalize-tables"
              type="button"
              onClick={onNormalizeTables}
              title="Reparar y optimizar tablas (convierte tablas Unicode, ASCII o en bloques de código a tablas estándar de Word)"
              className="p-1.5 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 rounded transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Links, Separators, Page Breaks */}
        <div className="flex items-center bg-white border border-slate-200 rounded-md p-0.5 shadow-xs">
          <button
            id="toolbar-btn-link"
            type="button"
            onClick={() => onInsertSyntax('[', '](https://ejemplo.com)', 'Texto del enlace')}
            title="Hipervínculo"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-image"
            type="button"
            onClick={() => onInsertSyntax('![', '](https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600)', 'Descripción de la imagen')}
            title="Insertar Imagen"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-hr"
            type="button"
            onClick={() => onInsertBlock('\n---\n')}
            title="Línea divisoria horizontal"
            className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            id="toolbar-btn-pagebreak"
            type="button"
            onClick={() => onInsertBlock('\n<!-- pagebreak -->\n')}
            title="Salto de página de Word"
            className="px-1.5 py-1 text-[10px] font-semibold text-blue-700 hover:bg-blue-50 rounded transition-colors flex items-center gap-1"
          >
            <span>📄 Salto</span>
          </button>
        </div>
      </div>

      {/* Right File Action Utilities */}
      <div className="flex items-center gap-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf,.md,.markdown,.txt"
          onChange={handleFileChange}
          className="hidden"
          id="markdown-file-input"
        />

        {onPasteFormatted && (
          <button
            id="toolbar-btn-paste-formatted"
            type="button"
            onClick={onPasteFormatted}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-md font-medium text-xs shadow-xs transition-colors cursor-pointer"
            title="Pegar texto con formato (convierte negrita, viñetas, tablas automáticamente a Markdown)"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pegar con formato</span>
          </button>
        )}

        <button
          id="toolbar-btn-upload"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-md font-medium text-xs shadow-xs transition-colors cursor-pointer"
          title="Cargar archivo Word (.docx), PDF (.pdf) o Markdown (.md, .txt) desde tu computadora"
        >
          <FileUp className="w-3.5 h-3.5 text-blue-600" />
          <span>Subir archivo</span>
        </button>

        <button
          id="toolbar-btn-sample"
          type="button"
          onClick={onLoadSample}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100/80 border border-indigo-200/70 rounded-md font-medium text-xs transition-colors"
          title="Ver ejemplos predefinidos"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Plantillas</span>
        </button>

        <button
          id="toolbar-btn-reset"
          type="button"
          onClick={onReset}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          title="Limpiar editor"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

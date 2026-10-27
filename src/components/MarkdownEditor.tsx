import React, { useRef, useMemo } from 'react';
import { Toolbar } from './Toolbar';
import { UploadCloud } from 'lucide-react';
import {
  extractMarkdownFromClipboard,
  convertHtmlToMarkdown,
} from '../utils/htmlToMarkdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  onFileUpload: (file: File) => void;
  onReset: () => void;
  onLoadSample: () => void;
  onNormalizeTables?: () => void;
  onNotify?: (message: string, type?: 'success' | 'info' | 'error') => void;
  isDragging: boolean;
  onDragEnter: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  onFileUpload,
  onReset,
  onLoadSample,
  onNormalizeTables,
  onNotify,
  isDragging,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Calculate line numbers
  const linesCount = useMemo(() => {
    return Math.max(value.split('\n').length, 1);
  }, [value]);

  const lineNumbers = useMemo(() => {
    return Array.from({ length: linesCount }, (_, i) => i + 1);
  }, [linesCount]);

  // Insert syntax wrapper around selection
  const handleInsertSyntax = (prefix: string, suffix = '', defaultPlaceholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end) || defaultPlaceholder;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newText = text.substring(0, start) + replacement + text.substring(end);
    onChange(newText);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(
        selectedText === defaultPlaceholder ? start + prefix.length : newCursorPos,
        selectedText === defaultPlaceholder ? newCursorPos : newCursorPos
      );
    }, 10);
  };

  // Insert full block
  const handleInsertBlock = (blockText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const newText = text.substring(0, start) + blockText + text.substring(end);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + blockText.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 10);
  };

  // Keyboard shortcut handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab key handling for indent/dedent
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      if (!e.shiftKey) {
        // Indent
        const newText = text.substring(0, start) + '  ' + text.substring(end);
        onChange(newText);
        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2);
        }, 0);
      } else {
        // Dedent if preceding 2 spaces
        if (start >= 2 && text.substring(start - 2, start) === '  ') {
          const newText = text.substring(0, start - 2) + text.substring(start);
          onChange(newText);
          setTimeout(() => {
            textarea.setSelectionRange(start - 2, start - 2);
          }, 0);
        }
      }
      return;
    }

    // Ctrl/Cmd + B: Bold
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      handleInsertSyntax('**', '**', 'negrita');
      return;
    }

    // Ctrl/Cmd + I: Italic
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      handleInsertSyntax('*', '*', 'cursiva');
      return;
    }
  };

  // Intercept paste event to automatically convert rich text (negritas, viñetas, tablas, títulos) to clean Markdown
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const result = extractMarkdownFromClipboard(e.clipboardData);
    if (result.hasFormatting && result.markdown) {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;

      const newText = text.substring(0, start) + result.markdown + text.substring(end);
      onChange(newText);

      setTimeout(() => {
        textarea.focus();
        const newPos = start + result.markdown.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 10);

      onNotify?.(
        '✨ Texto con formato pegado: negritas, viñetas y tablas convertidas a Markdown automáticamente.',
        'success'
      );
    }
  };

  // Handle clicking the "Pegar con formato" toolbar button
  const handlePasteFormatted = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          if (item.types.includes('text/html')) {
            const blob = await item.getType('text/html');
            const html = await blob.text();
            const markdown = convertHtmlToMarkdown(html);
            if (markdown && markdown.trim()) {
              handleInsertBlock(markdown);
              onNotify?.(
                '✨ Texto con formato pegado: negritas, viñetas y tablas convertidas a Markdown.',
                'success'
              );
              return;
            }
          }
        }
      }

      if (navigator.clipboard && navigator.clipboard.readText) {
        const plainText = await navigator.clipboard.readText();
        if (plainText) {
          handleInsertBlock(plainText);
          onNotify?.('Texto pegado desde el portapapeles.', 'info');
          return;
        }
      }
    } catch {
      onNotify?.(
        '💡 Presiona Ctrl+V (o Cmd+V) dentro del editor para pegar directamente tu texto con formato.',
        'info'
      );
    }
  };

  return (
    <div
      id="markdown-editor-pane"
      className="flex flex-col h-full bg-white relative overflow-hidden"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Formatting Toolbar */}
      <Toolbar
        onInsertSyntax={handleInsertSyntax}
        onInsertBlock={handleInsertBlock}
        onFileUpload={onFileUpload}
        onReset={onReset}
        onLoadSample={onLoadSample}
        onNormalizeTables={onNormalizeTables}
        onPasteFormatted={handlePasteFormatted}
      />

      {/* Editor Main Surface with Line Numbers */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers column */}
        <div
          id="editor-line-numbers"
          aria-hidden="true"
          className="w-11 sm:w-12 bg-slate-50 border-r border-slate-200 text-slate-400 select-none py-3 pr-2 text-right font-mono text-xs leading-6 overflow-hidden shrink-0"
        >
          {lineNumbers.map((num) => (
            <div key={num} className="leading-6">
              {num}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          id="markdown-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Escribe o pega aquí tu texto con formato... El editor convertirá automáticamente negritas, viñetas, títulos y tablas a Markdown."
          spellCheck={false}
          className="flex-1 w-full h-full p-3 font-mono text-sm leading-6 text-slate-800 resize-none outline-hidden bg-white selection:bg-blue-100 selection:text-blue-900 border-none placeholder:text-slate-400 overflow-y-auto"
        />

        {/* Drag & Drop Visual Overlay */}
        {isDragging && (
          <div
            id="drag-drop-overlay"
            className="absolute inset-0 bg-blue-50/90 border-2 border-dashed border-blue-500 rounded-lg z-30 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150"
          >
            <div className="p-4 bg-white rounded-full shadow-lg text-blue-600 mb-3">
              <UploadCloud className="w-10 h-10 animate-bounce" />
            </div>
            <p className="text-base font-bold text-blue-900">
              Suelta tu archivo Word (.docx), PDF (.pdf) o Markdown aquí
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Conversión automática multi-formato compatible con: .docx, .pdf, .md, .markdown, .txt
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

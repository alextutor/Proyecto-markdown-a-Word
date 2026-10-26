import React from 'react';
import { SAMPLE_DOCUMENTS, SampleDoc } from '../utils/sampleDocuments';
import { Sparkles, X, FileText, ArrowRight } from 'lucide-react';

interface SampleTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleDoc) => void;
}

export const SampleTemplatesModal: React.FC<SampleTemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="sample-templates-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Plantillas y Documentos de Ejemplo
              </h2>
              <p className="text-xs text-slate-500">
                Selecciona una plantilla predefinida para probar la conversión a Word (.docx)
              </p>
            </div>
          </div>
          <button
            id="close-samples-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal List */}
        <div className="p-6 overflow-y-auto space-y-3">
          {SAMPLE_DOCUMENTS.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                    {doc.badge}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {doc.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {doc.description}
                </p>
              </div>

              <button
                id={`load-sample-${doc.id}`}
                type="button"
                onClick={() => {
                  onSelectSample(doc);
                  onClose();
                }}
                className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold rounded-lg transition-colors group-hover:bg-blue-600 group-hover:text-white"
              >
                <span>Cargar Plantilla</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-right text-xs text-slate-400">
          Puedes editar o reemplazar el contenido en cualquier momento
        </div>
      </div>
    </div>
  );
};

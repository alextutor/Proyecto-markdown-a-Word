import React, { useState } from 'react';
import {
  DocumentSettings,
  FontFamily,
  LineSpacing,
  MarginOption,
  PageOrientation,
  PageSize,
} from '../types/converter';
import { X, Type, Palette, Layout, FileText, Check, Sliders } from 'lucide-react';

interface DocumentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DocumentSettings;
  onUpdateSettings: (newSettings: DocumentSettings) => void;
}

type TabType = 'typography' | 'colors' | 'layout' | 'cover';

const FONT_OPTIONS: { label: string; value: FontFamily }[] = [
  { label: 'Calibri (Estándar Office)', value: 'Calibri' },
  { label: 'Arial (Limpio y Moderno)', value: 'Arial' },
  { label: 'Times New Roman (Académico)', value: 'Times New Roman' },
  { label: 'Georgia (Editorial Serif)', value: 'Georgia' },
  { label: 'Segoe UI (Diseño Fluido)', value: 'Segoe UI' },
  { label: 'Garamond (Clásico Elegante)', value: 'Garamond' },
  { label: 'Aptos (Nuevo Microsoft 365)', value: 'Aptos' },
];

const PRESET_PALETTES = [
  { name: 'Azul Ejecutivo', primary: '#1E3A8A', secondary: '#2563EB' },
  { name: 'Verde Esmeralda', primary: '#065F46', secondary: '#059669' },
  { name: 'Teal Tecnológico', primary: '#0F766E', secondary: '#0D9488' },
  { name: 'Borgoña Editorial', primary: '#831843', secondary: '#BE185D' },
  { name: 'Índigo Profundo', primary: '#312E81', secondary: '#4F46E5' },
  { name: 'Gris Carbón Formal', primary: '#18181B', secondary: '#4B5563' },
];

export const DocumentSettingsModal: React.FC<DocumentSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('typography');

  if (!isOpen) return null;

  const handleChange = <K extends keyof DocumentSettings>(
    key: K,
    value: DocumentSettings[K]
  ) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  const handleMetadataChange = (field: string, value: any) => {
    onUpdateSettings({
      ...settings,
      metadata: {
        ...settings.metadata,
        [field]: value,
      },
    });
  };

  return (
    <div
      id="document-settings-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Opciones de Documento Word (.docx)
              </h2>
              <p className="text-xs text-slate-500">
                Personaliza la tipografía, márgenes, colores y formato del archivo generado
              </p>
            </div>
          </div>
          <button
            id="close-settings-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/40 px-6 gap-2 text-xs font-medium text-slate-600">
          <button
            id="tab-typography"
            type="button"
            onClick={() => setActiveTab('typography')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'typography'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Tipografía</span>
          </button>
          <button
            id="tab-colors"
            type="button"
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'colors'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Colores y Estilo</span>
          </button>
          <button
            id="tab-layout"
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'layout'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Página y Márgenes</span>
          </button>
          <button
            id="tab-cover"
            type="button"
            onClick={() => setActiveTab('cover')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'cover'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Portada y Encabezado</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Tab 1: Typography */}
          {activeTab === 'typography' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Fuente Principal del Documento
                </label>
                <select
                  id="select-font-family"
                  value={settings.fontFamily}
                  onChange={(e) => handleChange('fontFamily', e.target.value as FontFamily)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tamaño de Fuente Base
                  </label>
                  <select
                    id="select-font-size"
                    value={settings.fontSizePt}
                    onChange={(e) => handleChange('fontSizePt', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>10 pt (Compacto)</option>
                    <option value={10.5}>10.5 pt</option>
                    <option value={11}>11 pt (Estándar Office)</option>
                    <option value={12}>12 pt (Formato Académico)</option>
                    <option value={13}>13 pt (Grande / Accesible)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Interlineado
                  </label>
                  <select
                    id="select-line-spacing"
                    value={settings.lineSpacing}
                    onChange={(e) => handleChange('lineSpacing', e.target.value as LineSpacing)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1.0">1.0 (Sencillo)</option>
                    <option value="1.15">1.15 (Predeterminado Word)</option>
                    <option value="1.5">1.5 (Lectura Cómoda)</option>
                    <option value="2.0">2.0 (Doble / Tesis)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Colors & Style */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Paletas Predefinidas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_PALETTES.map((p) => {
                    const isSelected = settings.primaryAccentColor.toLowerCase() === p.primary.toLowerCase();
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          onUpdateSettings({
                            ...settings,
                            primaryAccentColor: p.primary,
                            secondaryAccentColor: p.secondary,
                          });
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-left text-xs transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex gap-1 shrink-0">
                          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.primary }} />
                          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.secondary }} />
                        </div>
                        <span className="font-medium text-slate-700 truncate">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Color de Acento Principal (Títulos y Tablas)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.primaryAccentColor}
                      onChange={(e) => handleChange('primaryAccentColor', e.target.value)}
                      className="w-9 h-9 p-0.5 border border-slate-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.primaryAccentColor}
                      onChange={(e) => handleChange('primaryAccentColor', e.target.value)}
                      className="w-full px-2.5 py-1.5 font-mono text-xs border border-slate-300 rounded-lg uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Color Secundario (Subtítulos y Enlaces)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.secondaryAccentColor}
                      onChange={(e) => handleChange('secondaryAccentColor', e.target.value)}
                      className="w-9 h-9 p-0.5 border border-slate-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.secondaryAccentColor}
                      onChange={(e) => handleChange('secondaryAccentColor', e.target.value)}
                      className="w-full px-2.5 py-1.5 font-mono text-xs border border-slate-300 rounded-lg uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.tableZebraStriping}
                    onChange={(e) => handleChange('tableZebraStriping', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Activar filas alternadas con fondo suave (Zebra Striping) en tablas</span>
                </label>
              </div>
            </div>
          )}

          {/* Tab 3: Page Layout */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Tamaño de Hoja
                  </label>
                  <select
                    id="select-page-size"
                    value={settings.pageSize}
                    onChange={(e) => handleChange('pageSize', e.target.value as PageSize)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="letter">Carta / Letter (8.5 × 11 in)</option>
                    <option value="a4">A4 Internacional (210 × 297 mm)</option>
                    <option value="legal">Oficio / Legal (8.5 × 14 in)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Orientación
                  </label>
                  <select
                    id="select-orientation"
                    value={settings.orientation}
                    onChange={(e) => handleChange('orientation', e.target.value as PageOrientation)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="portrait">Vertical (Estándar)</option>
                    <option value="landscape">Horizontal (Apaisado)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Márgenes de Página
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'normal', name: 'Normal', desc: '2.54 cm' },
                    { id: 'narrow', name: 'Estrecho', desc: '1.27 cm' },
                    { id: 'moderate', name: 'Moderado', desc: '1.9 cm' },
                    { id: 'wide', name: 'Amplio', desc: '3.18 cm' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleChange('margins', m.id as MarginOption)}
                      className={`p-2 rounded-lg border text-center text-xs transition-all ${
                        settings.margins === m.id
                          ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-semibold ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <div className="font-medium">{m.name}</div>
                      <div className="text-[10px] text-slate-400">{m.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Numeración de Páginas en el Pie
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.showPageNumbers}
                    onChange={(e) => handleChange('showPageNumbers', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                </div>

                {settings.showPageNumbers && (
                  <div className="flex items-center gap-3 text-xs text-slate-600 pl-2">
                    <span>Posición:</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="pageNumberPosition"
                        checked={settings.pageNumberPosition === 'bottom-center'}
                        onChange={() => handleChange('pageNumberPosition', 'bottom-center')}
                      />
                      <span>Centrado</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="pageNumberPosition"
                        checked={settings.pageNumberPosition === 'bottom-right'}
                        onChange={() => handleChange('pageNumberPosition', 'bottom-right')}
                      />
                      <span>Derecha</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: Cover & Metadata */}
          {activeTab === 'cover' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-lg">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-blue-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.metadata.includeCoverPage || false}
                    onChange={(e) => handleMetadataChange('includeCoverPage', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>Generar Portada de Título Inicial en el archivo Word</span>
                </label>
                <p className="text-[11px] text-blue-700/80 mt-1 pl-6">
                  Inserta una primera página profesional con título, subtítulo, autor, organización y fecha, seguida de un salto de página.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título del Documento
                  </label>
                  <input
                    type="text"
                    value={settings.metadata.title}
                    onChange={(e) => handleMetadataChange('title', e.target.value)}
                    placeholder="Ej. Plan de Proyecto Anual"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={settings.metadata.subtitle || ''}
                    onChange={(e) => handleMetadataChange('subtitle', e.target.value)}
                    placeholder="Ej. Análisis estratégico y plan de acción"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Autor / Responsable
                    </label>
                    <input
                      type="text"
                      value={settings.metadata.author || ''}
                      onChange={(e) => handleMetadataChange('author', e.target.value)}
                      placeholder="Nombre del autor"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Organización / Empresa
                    </label>
                    <input
                      type="text"
                      value={settings.metadata.organization || ''}
                      onChange={(e) => handleMetadataChange('organization', e.target.value)}
                      placeholder="Nombre de la institución"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha del Documento
                  </label>
                  <input
                    type="text"
                    value={settings.metadata.date || ''}
                    onChange={(e) => handleMetadataChange('date', e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Encabezado Superior Repetido
                    </label>
                    <input
                      type="checkbox"
                      checked={settings.showHeader}
                      onChange={(e) => handleChange('showHeader', e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                    />
                  </div>
                  {settings.showHeader && (
                    <input
                      type="text"
                      value={settings.headerText}
                      onChange={(e) => handleChange('headerText', e.target.value)}
                      placeholder="Texto del encabezado superior (ej. Confidencial)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50/70">
          <div className="text-xs text-slate-500">
            Los cambios se aplican inmediatamente al archivo y la vista previa
          </div>
          <button
            id="save-settings-btn"
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>Listo</span>
          </button>
        </div>
      </div>
    </div>
  );
};

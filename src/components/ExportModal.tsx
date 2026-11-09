import React, { useState } from 'react';
import { X, Download, Sparkles, CheckCircle2, AlertTriangle, FileCode2, Globe } from 'lucide-react';
import { Layer, MarkerConfig } from '../types';
import { generateViewerHTML, downloadFile } from '../utils/exportViewer';
import { compileMarkerToMind } from '../utils/mindCompiler';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  layers: Layer[];
  marker: MarkerConfig;
  onUpdateMarker: (updates: Partial<MarkerConfig>) => void;
  onNotify: (msg: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  layers,
  marker,
  onUpdateMarker,
  onNotify,
}) => {
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    let currentMarker = marker;

    // Si el marcador no está compilado a .mind, compilarlo primero
    if (!currentMarker.isCompiled || !currentMarker.compiledMindBase64) {
      setIsCompiling(true);
      setCompileProgress(10);
      try {
        const { base64 } = await compileMarkerToMind(
          currentMarker.imageUrl,
          (progress) => setCompileProgress(progress)
        );

        currentMarker = {
          ...currentMarker,
          compiledMindBase64: base64,
          isCompiled: true,
        };
        onUpdateMarker(currentMarker);
        onNotify('✅ Marcador compilado a .mind exitosamente');
      } catch (err) {
        console.error('Error al compilar marcador:', err);
        onNotify('⚠️ No se pudo compilar el marcador. Se exportará con visor Parallax y AR Libre.');
      } finally {
        setIsCompiling(false);
      }
    }

    // Generar el archivo HTML autónomo
    const html = generateViewerHTML(layers, currentMarker);
    downloadFile(html, 'visor-capas-ar.html', 'text/html');
    setExportComplete(true);
    onNotify('🎉 ¡Visor autónomo exportado correctamente!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/15 rounded-3xl p-5 max-w-md w-full shadow-2xl relative flex flex-col">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-blue-600/20 text-[#2f6bff] border border-blue-500/20">
            <FileCode2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Exportar Visor Autónomo</h3>
            <p className="text-xs text-slate-400">Archivo HTML único listo para clientes</p>
          </div>
        </div>

        {/* Resumen del paquete */}
        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-2 my-3 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span>Capas 3D incluidas:</span>
            <span className="font-bold text-white">{layers.length} capas</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span>Tipo de marcador:</span>
            <span className="font-semibold text-white">
              {marker.type === 'qr_code' ? 'Código QR' : 'Imagen personalizada'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span>Estado del marcador MindAR:</span>
            {marker.isCompiled ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Compilado .mind
              </span>
            ) : (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Se compilará al exportar
              </span>
            )}
          </div>
        </div>

        {/* Barra de progreso de compilación */}
        {isCompiling && (
          <div className="mb-4 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Compilando características visuales para MindAR...</span>
              <span className="font-mono font-bold text-blue-400">{compileProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#2f6bff] h-full transition-all duration-300 rounded-full"
                style={{ width: `${compileProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Guía rápida de alojamiento */}
        <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-3 mb-4 text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-blue-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>¿Dónde alojar el archivo exportado?</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Sube el archivo descargado (<code className="text-blue-300">visor-capas-ar.html</code> o renómbralo a <code className="text-blue-300">index.html</code>) a <strong>Netlify Drop</strong>, <strong>GitHub Pages</strong> o <strong>Vercel</strong> con HTTPS habilitado para que la cámara y los sensores funcionen en cualquier celular.
          </p>
        </div>

        {/* Botón principal de exportación */}
        <button
          disabled={isCompiling}
          onClick={handleExport}
          className="w-full py-3 px-4 bg-[#2f6bff] hover:bg-[#1f57e7] text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
        >
          {isCompiling ? (
            <>
              <Sparkles className="w-4 h-4 animate-spin text-white" />
              <span>Procesando... {compileProgress}%</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Descargar visor-capas-ar.html</span>
            </>
          )}
        </button>

        {exportComplete && (
          <p className="text-center text-xs text-emerald-400 font-medium mt-2">
            ✓ Archivo generado y guardado en tu carpeta de descargas.
          </p>
        )}
      </div>
    </div>
  );
};

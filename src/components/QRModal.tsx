import React, { useState, useEffect } from 'react';
import { X, Download, Printer, Copy, Check, Sparkles, Link2 } from 'lucide-react';
import { generateQRCodeDataUrl } from '../utils/imageUtils';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
  onUpdateTargetUrl: (url: string) => void;
  onUseAsMarker: (qrDataUrl: string) => void;
  onNotify: (msg: string) => void;
}

export const QRModal: React.FC<QRModalProps> = ({
  isOpen,
  onClose,
  targetUrl,
  onUpdateTargetUrl,
  onUseAsMarker,
  onNotify,
}) => {
  const [urlInput, setUrlInput] = useState(targetUrl);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initial = targetUrl || window.location.href;
      setUrlInput(initial);
      updateQR(initial);
    }
  }, [isOpen, targetUrl]);

  const updateQR = async (url: string) => {
    setGenerating(true);
    try {
      const qr = await generateQRCodeDataUrl(url);
      setQrDataUrl(qr);
      onUpdateTargetUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrlInput(val);
    updateQR(val);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'codigo-qr-capas-ar.png';
    a.click();
    onNotify('📥 Código QR descargado en PNG de alta resolución');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      onNotify('⚠️ No se pudo abrir la ventana de impresión');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Marcador QR - Capas AR</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
            .card { text-align: center; max-width: 500px; padding: 24px; border: 2px dashed #94a3b8; border-radius: 20px; }
            img { width: 340px; height: 340px; margin: 16px 0; }
            h2 { margin: 0; color: #0f172a; }
            p { color: #64748b; font-size: 14px; margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Capas AR - Marcador</h2>
            <p>Escanea este código con la cámara de tu celular para abrir el visor en Realidad Aumentada:</p>
            <img src="${qrDataUrl}" alt="QR">
            <p style="font-family: monospace; font-size: 11px; word-break: break-all;">${urlInput}</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(urlInput);
    setCopied(true);
    onNotify('📋 Enlace copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSetAsMarker = () => {
    if (!qrDataUrl) return;
    onUseAsMarker(qrDataUrl);
    onNotify('🎯 Código QR configurado como marcador AR de la escena');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/15 rounded-3xl p-5 max-w-sm w-full shadow-2xl relative flex flex-col items-center">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Título */}
        <h3 className="text-base font-bold text-white mb-1">Código QR del Visor</h3>
        <p className="text-xs text-slate-400 text-center mb-4">
          URL final donde está alojado tu visor autónomo:
        </p>

        {/* Campo de URL */}
        <div className="w-full flex items-center gap-1.5 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 mb-4">
          <Link2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <input
            type="text"
            value={urlInput}
            onChange={handleUrlChange}
            placeholder="https://mi-visor-ar.netlify.app"
            className="w-full bg-transparent text-xs text-white focus:outline-none placeholder-slate-500 font-mono"
          />
          <button
            onClick={handleCopyLink}
            className="text-slate-400 hover:text-white flex-shrink-0 p-1"
            title="Copiar enlace"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Vista previa del QR (con margen blanco amplio y corrección 'H') */}
        <div className="p-3 bg-white rounded-2xl shadow-xl mb-4 relative flex items-center justify-center">
          {generating ? (
            <div className="w-52 h-52 flex items-center justify-center text-slate-400 text-xs">
              Generando...
            </div>
          ) : (
            <img
              src={qrDataUrl}
              alt="Código QR"
              className="w-52 h-52 object-contain"
            />
          )}
        </div>

        {/* Botón Usar como marcador */}
        <button
          onClick={handleSetAsMarker}
          className="w-full py-2.5 px-4 mb-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4 text-blue-200" />
          <span>Usar este QR como Marcador de la Escena</span>
        </button>

        {/* Acciones de descarga e impresión */}
        <div className="w-full grid grid-cols-2 gap-2">
          <button
            onClick={handleDownload}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 border border-white/5"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Descargar PNG</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 border border-white/5"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

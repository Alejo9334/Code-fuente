import React from 'react';
import { X, Smartphone, Globe, ShieldCheck, QrCode, Layers, CheckCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-white/15 rounded-3xl p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-2xl relative flex flex-col space-y-4">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>🚀</span> Guía de Uso, Alojamiento y Pruebas en Móvil
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cómo desplegar Capas AR y disfrutarlo en cualquier celular con HTTPS.
          </p>
        </div>

        {/* Paso 1: Creación de Capas */}
        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
            <Layers className="w-4 h-4" />
            <span>1. Diseñar y organizar las capas</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Sube imágenes <strong>PNG con fondo transparente</strong> (por ejemplo creadas en Photoshop, Procreate o Canva). La aplicación las optimiza automáticamente a un máximo de 900 px. Usa el deslizador <strong>Profundidad Z</strong> y los gizmos táctiles (Mover, Rotar, Escalar) para acomodar cada capa en 3D.
          </p>
        </div>

        {/* Paso 2: Elección del Marcador */}
        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400">
            <QrCode className="w-4 h-4" />
            <span>2. Configurar el Marcador</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Puedes subir tu propia imagen (póster, tarjeta, portada) o usar el <strong>Código QR</strong> generado con el enlace del visor (con corrección de error alta). La escena muestra la guía semitransparente con ancho = 2 unidades centrada en (0,1,0) para alinear las capas sobre él.
          </p>
        </div>

        {/* Paso 3: Alojamiento Gratuito con HTTPS */}
        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Globe className="w-4 h-4" />
            <span>3. Dónde alojar el visor (100% Gratis en 1 minuto)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Para que la cámara trasera y los sensores funcionen en celulares, el navegador exige <strong>HTTPS</strong>. Pulsa <strong>Exportar</strong> para obtener <code className="text-blue-300">visor-capas-ar.html</code> y súbelo a cualquiera de estos servicios:
          </p>
          <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
            <li>
              <strong className="text-slate-200">Netlify Drop:</strong> Entra en <em>app.netlify.com/drop</em>, arrastra tu carpeta con el archivo renombrado a <code className="text-blue-300">index.html</code> y obtendrás una URL HTTPS al instante.
            </li>
            <li>
              <strong className="text-slate-200">GitHub Pages:</strong> Crea un repositorio público, sube el archivo como <code className="text-blue-300">index.html</code> y activa GitHub Pages en Configuración &gt; Pages.
            </li>
            <li>
              <strong className="text-slate-200">Vercel:</strong> Despliega arrastrando el archivo o enlazando tu repositorio.
            </li>
          </ul>
        </div>

        {/* Paso 4: Pruebas en el Celular */}
        <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
            <Smartphone className="w-4 h-4" />
            <span>4. Probar en iPhone o Android</span>
          </div>
          <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
            <li>
              Abre el botón <strong>QR</strong> en el editor, escribe la URL de tu visor y descarga/imprime el código QR.
            </li>
            <li>
              Abre la cámara nativa de tu celular y escanea el código QR para entrar al visor.
            </li>
            <li>
              <strong>En iPhone (iOS):</strong> Si usas modo Parallax, pulsa el botón <em>"Activar movimiento"</em> para otorgar permiso al giroscopio.
            </li>
            <li>
              <strong>En modo Marcador:</strong> Concede permiso a la cámara trasera y apunta hacia la imagen o QR. Al reconocerlo, el holograma aparecerá fijado exactamente sobre él.
            </li>
          </ol>
        </div>

        {/* Consejos de seguimiento */}
        <div className="p-3 bg-blue-900/20 border border-blue-500/20 rounded-xl text-xs text-blue-200 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Consejo para MindAR:</strong> Las imágenes con buen contraste, esquinas asimétricas y sin reflejos intensos se reconocen al instante y ofrecen el seguimiento 3D más estable.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all"
        >
          ¡Entendido!
        </button>
      </div>
    </div>
  );
};

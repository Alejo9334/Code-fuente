import React from 'react';
import {
  Box,
  Square,
  Sparkles,
  Globe,
  Crosshair,
  Download,
  QrCode,
  HelpCircle,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { AppMode, ViewRole } from '../types';

interface TopBarProps {
  mode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  role: ViewRole;
  onToggleRole: () => void;
  onOpenExport: () => void;
  onOpenQR: () => void;
  onOpenHelp: () => void;
  onExitAR?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  mode,
  onSelectMode,
  role,
  onToggleRole,
  onOpenExport,
  onOpenQR,
  onOpenHelp,
  onExitAR,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 pt-[max(0.5rem,env(safe-area-inset-top))] px-3 pb-2 flex flex-col items-center pointer-events-none select-none">
      <div className="w-full max-w-5xl flex items-center justify-between gap-2">
        {/* Logo / Badge */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2f6bff]" />
            <span className="text-xs font-bold tracking-wide text-white">Capas AR</span>
            <span className="text-[10px] font-medium text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded-md">
              {role === 'editor' ? 'Editor' : 'Visor'}
            </span>
          </div>
        </div>

        {/* Central Mode Selector */}
        <nav className="pointer-events-auto flex items-center bg-slate-900/85 backdrop-blur-lg border border-white/10 p-1 rounded-full shadow-xl">
          {/* 3D Mode (solo en editor) */}
          {role === 'editor' && (
            <button
              onClick={() => onSelectMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                mode === '3d'
                  ? 'bg-[#2f6bff] text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Vista 3D Libre (Cámara Orbital)"
            >
              <Box className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3D</span>
            </button>
          )}

          {/* 2D Mode (solo en editor) */}
          {role === 'editor' && (
            <button
              onClick={() => onSelectMode('2d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                mode === '2d'
                  ? 'bg-[#2f6bff] text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title="Vista 2D de Frente (Cámara Ortográfica)"
            >
              <Square className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">2D</span>
            </button>
          )}

          {/* Parallax */}
          <button
            onClick={() => onSelectMode('parallax')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
              mode === 'parallax'
                ? 'bg-[#2f6bff] text-white shadow-md shadow-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title="Efecto Parallax con sensor de inclinación"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Parallax</span>
          </button>

          {/* AR libre */}
          <button
            onClick={() => onSelectMode('ar_libre')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
              mode === 'ar_libre'
                ? 'bg-[#2f6bff] text-white shadow-md shadow-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title="AR libre: Capas flotando con cámara trasera"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">AR libre</span>
          </button>

          {/* Marcador */}
          <button
            onClick={() => onSelectMode('marcador')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
              mode === 'marcador'
                ? 'bg-[#2f6bff] text-white shadow-md shadow-blue-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title="Reconocimiento de Marcador con MindAR"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Marcador</span>
          </button>
        </nav>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {role === 'editor' ? (
            <>
              {/* Botón QR */}
              <button
                onClick={onOpenQR}
                className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 rounded-full shadow-lg transition-transform active:scale-95"
                title="Generar código QR del visor"
              >
                <QrCode className="w-4 h-4 text-[#2f6bff]" />
              </button>

              {/* Preparar una nueva versión del visor para reemplazar la publicada */}
              <button
                onClick={onOpenExport}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold rounded-full shadow-lg transition-transform active:scale-95"
                title="Generar la versión actualizada del visor. Después debes subir el HTML a GitHub Pages para publicarla."
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Actualizar visor</span>
                <span className="md:hidden">↻</span>
              </button>

              {/* Botón Exportar Visor */}
              <button
                onClick={onOpenExport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2f6bff] hover:bg-[#1f57e7] text-white text-xs font-bold rounded-full shadow-lg transition-transform active:scale-95"
                title="Exportar archivo HTML autónomo para el cliente"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Exportar</span>
              </button>

              {/* Conmutador Modo Visor */}
              <button
                onClick={onToggleRole}
                className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 rounded-full shadow-lg transition-transform active:scale-95"
                title="Previsualizar como cliente (Modo Visor)"
              >
                <Eye className="w-4 h-4 text-emerald-400" />
              </button>

              {/* Ayuda */}
              <button
                onClick={onOpenHelp}
                className="p-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-white/10 rounded-full shadow-lg transition-transform active:scale-95"
                title="Guía de uso y alojamiento en GitHub / Netlify"
              >
                <HelpCircle className="w-4 h-4 text-slate-300" />
              </button>
            </>
          ) : (
            <>
              {/* En modo visor: Salir de AR o Volver a editar */}
              {(mode === 'ar_libre' || mode === 'marcador') && onExitAR && (
                <button
                  onClick={onExitAR}
                  className="px-3 py-1.5 bg-red-500/90 hover:bg-red-600 text-white text-xs font-bold rounded-full shadow-lg"
                >
                  Salir de AR
                </button>
              )}

              <button
                onClick={onToggleRole}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-white text-xs font-semibold rounded-full shadow-lg"
                title="Volver al modo Editor"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#2f6bff]" />
                <span className="hidden sm:inline">Editor</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

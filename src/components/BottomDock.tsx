import React, { useState, useRef } from 'react';
import {
  Layers,
  Crosshair,
  Settings2,
  Move,
  RotateCw,
  Maximize2,
  Hand,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Upload,
  QrCode,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Focus,
} from 'lucide-react';
import { Layer, MarkerConfig, GizmoMode, AppMode, ViewRole } from '../types';
import { resizeImage } from '../utils/imageUtils';

interface BottomDockProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onAddLayer: (newLayer: Layer) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onDuplicateLayer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onReorderLayers: (dragIndex: number, hoverIndex: number) => void;
  depthSeparation: number;
  onChangeDepthSeparation: (depth: number) => void;
  marker: MarkerConfig;
  onUpdateMarker: (updates: Partial<MarkerConfig>) => void;
  onCompileMarker: () => void;
  isCompilingMarker: boolean;
  compileProgress: number;
  gizmoMode: GizmoMode;
  onSelectGizmoMode: (mode: GizmoMode) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  mode: AppMode;
  role: ViewRole;
  onNotify: (msg: string) => void;
  onOpenQR: () => void;
}

type TabType = 'capas' | 'marcador' | 'ajustes';

export const BottomDock: React.FC<BottomDockProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onAddLayer,
  onUpdateLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onReorderLayers,
  depthSeparation,
  onChangeDepthSeparation,
  marker,
  onUpdateMarker,
  onCompileMarker,
  isCompilingMarker,
  compileProgress,
  gizmoMode,
  onSelectGizmoMode,
  showGrid,
  onToggleGrid,
  mode,
  role,
  onNotify,
  onOpenQR,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('capas');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const markerFileInputRef = useRef<HTMLInputElement>(null);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  // Subir imagen para nueva capa (PNG con transparencia, max 900px)
  const handleLayerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const { dataUrl, aspectRatio } = await resizeImage(file, 900);
        const baseWidth = 2.0;
        const baseHeight = baseWidth / aspectRatio;
        const newOrder = layers.length;
        const newZ = (newOrder - (layers.length / 2)) * depthSeparation;

        const newLayer: Layer = {
          id: `layer-${Date.now()}-${i}`,
          name: file.name.replace(/\.[^/.]+$/, '').slice(0, 24) || `Capa ${newOrder + 1}`,
          imageUrl: dataUrl,
          width: baseWidth,
          height: baseHeight,
          aspectRatio,
          position: [0, 1.0, newZ],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          opacity: 1.0,
          visible: true,
          order: newOrder,
        };

        onAddLayer(newLayer);
        onNotify(`✅ Capa "${newLayer.name}" añadida (reducida a máx 900px)`);
      } catch (err) {
        console.error('Error al procesar archivo:', err);
        onNotify('❌ Error al procesar la imagen PNG');
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Subir imagen para el marcador
  const handleMarkerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      const { dataUrl, aspectRatio } = await resizeImage(file, 900);
      onUpdateMarker({
        type: 'custom_image',
        name: file.name.slice(0, 20),
        imageUrl: dataUrl,
        aspectRatio,
        isCompiled: false,
        compiledMindBase64: undefined,
      });
      onNotify('📷 Marcador personalizado cargado. Listo para compilar.');
    } catch (err) {
      console.error(err);
      onNotify('❌ Error al cargar la imagen del marcador');
    }

    if (markerFileInputRef.current) markerFileInputRef.current.value = '';
  };

  // Reset 3D camera trigger
  const handleCenterCamera = () => {
    window.dispatchEvent(new CustomEvent('reset-3d-camera'));
    onNotify('🎯 Vista 3D centrada');
  };

  // En modo Visor, mostramos únicamente la tarjeta de guía inferior
  if (role === 'visor') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 pb-[max(1rem,env(safe-area-inset-bottom))] px-4 flex flex-col items-center pointer-events-none select-none">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-3.5 rounded-2xl shadow-2xl max-w-md w-full flex items-center justify-between gap-3 pointer-events-auto">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">
              {mode === 'parallax' ? '✨' : mode === 'ar_libre' ? '🌐' : '🎯'}
            </span>
            <div className="text-xs text-slate-200">
              {mode === 'parallax' && (
                <p>
                  <strong className="text-white block font-semibold">Modo Parallax</strong>
                  Inclina tu celular o arrastra con el dedo para ver la profundidad.
                </p>
              )}
              {mode === 'ar_libre' && (
                <p>
                  <strong className="text-white block font-semibold">AR Libre</strong>
                  Apunta a tu alrededor para ver las capas suspendidas en el espacio.
                </p>
              )}
              {mode === 'marcador' && (
                <p>
                  <strong className="text-white block font-semibold">Reconocimiento AR</strong>
                  Apunta al marcador para ver las capas fijadas sobre él.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pb-[max(0.5rem,env(safe-area-inset-bottom))] px-3 flex flex-col items-center pointer-events-none select-none">
      {/* Botón para Colapsar / Expandir el dock */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="pointer-events-auto mb-1 flex items-center gap-1.5 px-3 py-1 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-white/10 rounded-full text-[11px] font-medium text-slate-300 hover:text-white shadow-lg transition-all active:scale-95"
      >
        {isCollapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5 text-[#2f6bff]" />
            <span>Mostrar panel del editor</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Ocultar controles</span>
          </>
        )}
      </button>

      {/* Dock Principal Móvil */}
      <div
        className={`pointer-events-auto w-full max-w-2xl bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
          isCollapsed ? 'max-h-0 opacity-0 pointer-events-none p-0 border-0' : 'max-h-[75vh] p-3'
        }`}
      >
        {/* Barra superior de herramientas: Gizmos táctiles y centrado */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10 gap-1 overflow-x-auto">
          {/* Gizmos */}
          <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => onSelectGizmoMode('none')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                gizmoMode === 'none'
                  ? 'bg-[#2f6bff] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Solo selección"
            >
              <Hand className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Selección</span>
            </button>

            <button
              onClick={() => onSelectGizmoMode('translate')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                gizmoMode === 'translate'
                  ? 'bg-[#2f6bff] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Mover capa (X, Y, Z)"
            >
              <Move className="w-3.5 h-3.5" />
              <span>Mover</span>
            </button>

            <button
              onClick={() => onSelectGizmoMode('rotate')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                gizmoMode === 'rotate'
                  ? 'bg-[#2f6bff] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Rotar capa"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Rotar</span>
            </button>

            <button
              onClick={() => onSelectGizmoMode('scale')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                gizmoMode === 'scale'
                  ? 'bg-[#2f6bff] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Escalar capa"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Escalar</span>
            </button>
          </div>

          {/* Botón centrar cámara */}
          <button
            onClick={handleCenterCamera}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-white/5 active:scale-95"
            title="Centrar vista 3D"
          >
            <Focus className="w-3.5 h-3.5 text-[#2f6bff]" />
            <span className="hidden sm:inline">Centrar</span>
          </button>
        </div>

        {/* Selector de pestañas */}
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('capas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'capas'
                  ? 'bg-[#2f6bff] text-white'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Capas ({layers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('marcador')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'marcador'
                  ? 'bg-[#2f6bff] text-white'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>Marcador</span>
              {marker.isCompiled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('ajustes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'ajustes'
                  ? 'bg-[#2f6bff] text-white'
                  : 'bg-slate-800/70 text-slate-400 hover:text-white'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Ajustes</span>
            </button>
          </div>

          {/* Subir capa rápida si está en pestaña Capas */}
          {activeTab === 'capas' && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleLayerFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir PNG</span>
              </button>
            </div>
          )}
        </div>

        {/* Contenido de la pestaña activa */}
        <div className="max-h-[36vh] overflow-y-auto pr-1 space-y-2.5">
          {/* PESTAÑA: CAPAS */}
          {activeTab === 'capas' && (
            <div className="space-y-3">
              {/* Slider de separación Z global */}
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-300">
                    Profundidad Z entre capas:
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Separa las capas según su orden
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                  <input
                    type="range"
                    min="0"
                    max="0.6"
                    step="0.02"
                    value={depthSeparation}
                    onChange={(e) => onChangeDepthSeparation(parseFloat(e.target.value))}
                    className="w-full accent-[#2f6bff] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                  <span className="text-xs font-mono font-semibold text-blue-400 w-10 text-right">
                    {depthSeparation.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Lista de Capas */}
              <div className="space-y-1.5">
                {layers.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 bg-slate-950/30 rounded-xl border border-dashed border-white/10">
                    No hay capas añadidas. Sube una o varias imágenes PNG transparentes.
                  </div>
                ) : (
                  layers.map((layer, index) => {
                    const isSelected = layer.id === selectedLayerId;
                    return (
                      <div
                        key={layer.id}
                        onClick={() => onSelectLayer(layer.id)}
                        className={`group p-2 rounded-xl border transition-all flex items-center gap-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600/20 border-[#2f6bff] shadow-sm'
                            : 'bg-slate-950/40 border-white/5 hover:border-white/15'
                        }`}
                      >
                        {/* Miniatura */}
                        <div className="w-10 h-10 rounded-lg bg-slate-800/80 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
                          <img
                            src={layer.imageUrl}
                            alt={layer.name}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>

                        {/* Nombre y datos */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white truncate">
                              {layer.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              (Z: {layer.position[2].toFixed(2)})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>Opacidad: {Math.round(layer.opacity * 100)}%</span>
                          </div>
                        </div>

                        {/* Acciones de capa */}
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Subir orden */}
                          <button
                            disabled={index === 0}
                            onClick={() => onReorderLayers(index, index - 1)}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                            title="Mover hacia el fondo (Z menor)"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>

                          {/* Bajar orden */}
                          <button
                            disabled={index === layers.length - 1}
                            onClick={() => onReorderLayers(index, index + 1)}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                            title="Mover hacia el frente (Z mayor)"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Mostrar / Ocultar */}
                          <button
                            onClick={() =>
                              onUpdateLayer(layer.id, { visible: !layer.visible })
                            }
                            className="p-1 text-slate-400 hover:text-white"
                            title={layer.visible ? 'Ocultar' : 'Mostrar'}
                          >
                            {layer.visible ? (
                              <Eye className="w-3.5 h-3.5 text-blue-400" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                            )}
                          </button>

                          {/* Duplicar */}
                          <button
                            onClick={() => onDuplicateLayer(layer.id)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Duplicar capa"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Borrar */}
                          <button
                            onClick={() => onDeleteLayer(layer.id)}
                            className="p-1 text-slate-400 hover:text-red-400"
                            title="Eliminar capa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Controles de la Capa Seleccionada */}
              {selectedLayer && (
                <div className="bg-slate-950/70 p-3 rounded-xl border border-blue-500/30 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Editar: {selectedLayer.name}
                    </span>
                    <button
                      onClick={() => onSelectLayer(null)}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      Deseleccionar
                    </button>
                  </div>

                  {/* Slider de Opacidad */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-300">Opacidad:</span>
                    <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={selectedLayer.opacity}
                        onChange={(e) =>
                          onUpdateLayer(selectedLayer.id, {
                            opacity: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-[#2f6bff] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <span className="text-xs font-mono font-semibold text-blue-400 w-10 text-right">
                        {Math.round(selectedLayer.opacity * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PESTAÑA: MARCADOR */}
          {activeTab === 'marcador' && (
            <div className="space-y-3">
              {/* Opciones de tipo de marcador */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => markerFileInputRef.current?.click()}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    marker.type === 'custom_image'
                      ? 'bg-blue-600/20 border-[#2f6bff]'
                      : 'bg-slate-950/40 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Upload className="w-4 h-4 text-[#2f6bff]" />
                    <span>Subir Imagen</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Póster, logo o tarjeta
                  </span>
                </button>

                <button
                  onClick={onOpenQR}
                  className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                    marker.type === 'qr_code'
                      ? 'bg-blue-600/20 border-[#2f6bff]'
                      : 'bg-slate-950/40 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <QrCode className="w-4 h-4 text-[#2f6bff]" />
                    <span>Código QR</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Con enlace final del visor
                  </span>
                </button>
              </div>

              <input
                ref={markerFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleMarkerFileUpload}
              />

              {/* Vista previa del marcador actual */}
              <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl bg-white p-1 flex items-center justify-center flex-shrink-0 border border-white/10 shadow-md">
                  <img
                    src={marker.imageUrl}
                    alt="Marcador"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white truncate">
                      {marker.name}
                    </span>
                    {marker.isCompiled ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Compilado .mind
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    En la escena mide 2 unidades centrado en (0,1,0). En MindAR medirá 1 unidad centrado en (0,0,0).
                  </p>
                </div>

                {/* Botón de compilación manual */}
                <button
                  disabled={isCompilingMarker}
                  onClick={onCompileMarker}
                  className="px-3 py-2 bg-[#2f6bff] hover:bg-[#1f57e7] text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isCompilingMarker ? `${compileProgress}%` : 'Compilar'}</span>
                </button>
              </div>

              {/* Controles de visualización del marcador guía en escena */}
              <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Mostrar guía semitransparente en 3D
                  </span>
                  <input
                    type="checkbox"
                    checked={marker.visible}
                    onChange={(e) => onUpdateMarker({ visible: e.target.checked })}
                    className="accent-[#2f6bff] w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">Opacidad guía:</span>
                  <div className="flex items-center gap-2 flex-1 max-w-[180px]">
                    <input
                      type="range"
                      min="0.05"
                      max="0.9"
                      step="0.05"
                      value={marker.opacity}
                      onChange={(e) =>
                        onUpdateMarker({ opacity: parseFloat(e.target.value) })
                      }
                      className="w-full accent-[#2f6bff] h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-300 w-8 text-right">
                      {Math.round(marker.opacity * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PESTAÑA: AJUSTES 3D */}
          {activeTab === 'ajustes' && (
            <div className="space-y-2.5">
              {/* Rejilla */}
              <div className="bg-slate-950/50 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Rejilla de referencia (Grid)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Muestra el plano del suelo en la escena 3D
                  </span>
                </div>
                <button
                  onClick={onToggleGrid}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    showGrid
                      ? 'bg-[#2f6bff] text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {showGrid ? 'Visible' : 'Oculta'}
                </button>
              </div>

              {/* Botón centrar capa seleccionada */}
              {selectedLayer && (
                <div className="bg-slate-950/50 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Restablecer posición de capa
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Centra la capa seleccionada en X=0, Y=1.0
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      onUpdateLayer(selectedLayer.id, {
                        position: [0, 1.0, selectedLayer.position[2]],
                        rotation: [0, 0, 0],
                        scale: [1, 1, 1],
                      })
                    }
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg"
                  >
                    Centrar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

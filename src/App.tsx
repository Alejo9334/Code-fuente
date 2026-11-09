import React, { useState, useEffect, useCallback } from 'react';
import { Layer, MarkerConfig, AppMode, GizmoMode, ViewRole } from './types';
import { generateDemoLayers, generateDefaultMarkerDataUrl } from './utils/imageUtils';
import { compileMarkerToMind } from './utils/mindCompiler';
import { ThreeCanvas } from './components/ThreeCanvas';
import { TopBar } from './components/TopBar';
import { BottomDock } from './components/BottomDock';
import { QRModal } from './components/QRModal';
import { ExportModal } from './components/ExportModal';
import { HelpModal } from './components/HelpModal';

export default function App() {
  // Estado principal de capas
  const [layers, setLayers] = useState<Layer[]>(() => generateDemoLayers());
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [depthSeparation, setDepthSeparation] = useState<number>(0.2);

  // Estado del marcador
  const [marker, setMarker] = useState<MarkerConfig>(() => {
    const defaultM = generateDefaultMarkerDataUrl();
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    return {
      type: 'custom_image',
      imageUrl: defaultM.dataUrl,
      name: 'Marcador Estándar AR',
      aspectRatio: defaultM.aspectRatio,
      opacity: 0.35,
      visible: true,
      isCompiled: false,
      targetUrl: currentUrl,
    };
  });

  // Modos de la aplicación
  const [mode, setMode] = useState<AppMode>('3d');
  const [role, setRole] = useState<ViewRole>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('mode') === 'visor' || window.location.hash.includes('visor')) {
        return 'visor';
      }
    }
    return 'editor';
  });

  const [gizmoMode, setGizmoMode] = useState<GizmoMode>('translate');
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Modales
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Compilación de MindAR
  const [isCompilingMarker, setIsCompilingMarker] = useState(false);
  const [compileProgress, setCompileProgress] = useState(0);

  // Notificación Toast
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  // Si entra en modo visor directamente, cambiar modo inicial a parallax
  useEffect(() => {
    if (role === 'visor' && (mode === '3d' || mode === '2d')) {
      setMode('parallax');
    }
  }, [role, mode]);

  // Manejo de capas
  const handleAddLayer = (newLayer: Layer) => {
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const handleUpdateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  const handleUpdateLayerTransform = (
    id: string,
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => {
    setLayers((prev) =>
      prev.map((l) =>
        l.id === id ? { ...l, position, rotation, scale } : l
      )
    );
  };

  const handleDuplicateLayer = (id: string) => {
    const src = layers.find((l) => l.id === id);
    if (!src) return;

    const newOrder = layers.length;
    const offsetZ = src.position[2] + 0.05;
    const duplicated: Layer = {
      ...src,
      id: `layer-${Date.now()}`,
      name: `${src.name} (Copia)`,
      position: [src.position[0] + 0.1, src.position[1] + 0.1, offsetZ],
      order: newOrder,
    };

    setLayers((prev) => [...prev, duplicated]);
    setSelectedLayerId(duplicated.id);
    showNotification(`Capa "${duplicated.name}" duplicada`);
  };

  const handleDeleteLayer = (id: string) => {
    setLayers((prev) => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
    showNotification('Capa eliminada');
  };

  // Reordenar capas (cambiando su profundidad Z automáticamente)
  const handleReorderLayers = (currentIndex: number, targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= layers.length) return;

    setLayers((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(currentIndex, 1);
      copy.splice(targetIndex, 0, moved);

      // Recalcular posiciones Z y orden
      const center = (copy.length - 1) / 2;
      return copy.map((layer, idx) => ({
        ...layer,
        order: idx,
        position: [
          layer.position[0],
          layer.position[1],
          (idx - center) * depthSeparation,
        ],
      }));
    });
  };

  // Cambiar separación de profundidad Z global
  const handleChangeDepthSeparation = (newSeparation: number) => {
    setDepthSeparation(newSeparation);
    setLayers((prev) => {
      const center = (prev.length - 1) / 2;
      return prev.map((layer) => ({
        ...layer,
        position: [
          layer.position[0],
          layer.position[1],
          (layer.order - center) * newSeparation,
        ],
      }));
    });
  };

  // Marcador
  const handleUpdateMarker = (updates: Partial<MarkerConfig>) => {
    setMarker((prev) => ({ ...prev, ...updates }));
  };

  const handleCompileMarker = async () => {
    if (isCompilingMarker) return;
    setIsCompilingMarker(true);
    setCompileProgress(10);

    try {
      showNotification('Iniciando compilación de características para MindAR...');
      const { base64 } = await compileMarkerToMind(
        marker.imageUrl,
        (progress) => setCompileProgress(progress)
      );

      setMarker((prev) => ({
        ...prev,
        compiledMindBase64: base64,
        isCompiled: true,
      }));
      showNotification('✅ Marcador compilado a .mind con éxito');
    } catch (err) {
      console.error(err);
      showNotification('⚠️ No se pudo compilar el marcador. Inténtalo de nuevo.');
    } finally {
      setIsCompilingMarker(false);
      setCompileProgress(0);
    }
  };

  const handleUseQRAsMarker = (qrDataUrl: string) => {
    setMarker((prev) => ({
      ...prev,
      type: 'qr_code',
      imageUrl: qrDataUrl,
      name: 'Código QR del Visor',
      aspectRatio: 1.0,
      isCompiled: false,
      compiledMindBase64: undefined,
    }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Viewport 3D a pantalla completa */}
      <ThreeCanvas
        layers={layers}
        selectedLayerId={selectedLayerId}
        onSelectLayer={setSelectedLayerId}
        onUpdateLayerTransform={handleUpdateLayerTransform}
        marker={marker}
        mode={mode}
        gizmoMode={gizmoMode}
        showGrid={showGrid}
        onNotify={showNotification}
      />

      {/* Barra Superior */}
      <TopBar
        mode={mode}
        onSelectMode={setMode}
        role={role}
        onToggleRole={() => {
          const newRole = role === 'editor' ? 'visor' : 'editor';
          setRole(newRole);
          if (newRole === 'visor' && (mode === '3d' || mode === '2d')) {
            setMode('parallax');
          }
          showNotification(
            newRole === 'visor'
              ? '👁️ Modo Visor activo (vista del cliente)'
              : '🛠️ Modo Editor activo'
          );
        }}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenQR={() => setIsQRModalOpen(true)}
        onOpenHelp={() => setIsHelpModalOpen(true)}
        onExitAR={() => setMode('parallax')}
      />

      {/* Dock de herramientas inferior */}
      <BottomDock
        layers={layers}
        selectedLayerId={selectedLayerId}
        onSelectLayer={setSelectedLayerId}
        onAddLayer={handleAddLayer}
        onUpdateLayer={handleUpdateLayer}
        onDuplicateLayer={handleDuplicateLayer}
        onDeleteLayer={handleDeleteLayer}
        onReorderLayers={handleReorderLayers}
        depthSeparation={depthSeparation}
        onChangeDepthSeparation={handleChangeDepthSeparation}
        marker={marker}
        onUpdateMarker={handleUpdateMarker}
        onCompileMarker={handleCompileMarker}
        isCompilingMarker={isCompilingMarker}
        compileProgress={compileProgress}
        gizmoMode={gizmoMode}
        onSelectGizmoMode={setGizmoMode}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        mode={mode}
        role={role}
        onNotify={showNotification}
        onOpenQR={() => setIsQRModalOpen(true)}
      />

      {/* Notificación Flotante (Toast) */}
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-2 bg-slate-900/95 text-white text-xs font-semibold rounded-full shadow-2xl border border-white/20 backdrop-blur-md flex items-center gap-2 max-w-sm text-center">
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* Modal QR */}
      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        targetUrl={marker.targetUrl}
        onUpdateTargetUrl={(url) => setMarker((prev) => ({ ...prev, targetUrl: url }))}
        onUseAsMarker={handleUseQRAsMarker}
        onNotify={showNotification}
      />

      {/* Modal Exportar Visor */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        layers={layers}
        marker={marker}
        onUpdateMarker={handleUpdateMarker}
        onNotify={showNotification}
      />

      {/* Modal Ayuda */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
}

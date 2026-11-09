import { Layer, MarkerConfig } from '../types';

/**
 * Genera el archivo HTML autónomo completo para el visor del cliente.
 */
export function generateViewerHTML(layers: Layer[], marker: MarkerConfig): string {
  const layersJson = JSON.stringify(layers);
  const mindBase64 = marker.compiledMindBase64 || '';
  const markerImage = marker.imageUrl;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>Capas AR - Visor de Realidad Aumentada</title>
  <meta name="description" content="Visualiza esta escena 3D en capas en Realidad Aumentada con Parallax, AR libre o sobre su marcador.">
  
  <!-- Estilos del visor -->
  <style>
    :root {
      --accent: #2f6bff;
      --accent-hover: #1f57e7;
      --bg-glass: rgba(15, 23, 42, 0.75);
      --border-glass: rgba(255, 255, 255, 0.12);
      --text-main: #f8fafc;
      --text-sub: #94a3b8;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg-glass: rgba(255, 255, 255, 0.85);
        --border-glass: rgba(0, 0, 0, 0.1);
        --text-main: #0f172a;
        --text-sub: #475569;
      }
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
    }
    body, html {
      width: 100%;
      height: 100%;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b0f19;
      color: var(--text-main);
    }
    #viewport-container {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #three-canvas-container {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }
    #video-background {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
      display: none;
    }
    #mindar-container {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      display: none;
    }
    /* Barra Superior */
    .top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding-top: max(12px, env(safe-area-inset-top));
      padding-bottom: 12px;
      padding-left: 16px;
      padding-right: 16px;
      z-index: 30;
      display: flex;
      justify-content: center;
      align-items: center;
      pointer-events: none;
    }
    .mode-nav {
      display: flex;
      background: var(--bg-glass);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border-glass);
      border-radius: 9999px;
      padding: 4px;
      gap: 4px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
      pointer-events: auto;
      max-width: 95vw;
    }
    .mode-btn {
      background: transparent;
      border: none;
      color: var(--text-sub);
      font-size: 13px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
      white-space: nowrap;
    }
    .mode-btn.active {
      background: var(--accent);
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(47, 107, 255, 0.4);
    }
    /* Tarjeta Inferior de Guía */
    .bottom-card {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding-bottom: max(16px, env(safe-area-inset-bottom));
      padding-top: 12px;
      padding-left: 16px;
      padding-right: 16px;
      z-index: 30;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      pointer-events: none;
    }
    .guide-banner {
      background: var(--bg-glass);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border-glass);
      border-radius: 20px;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
      pointer-events: auto;
    }
    .guide-icon {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: rgba(47, 107, 255, 0.15);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 18px;
    }
    .guide-text {
      font-size: 13px;
      line-height: 1.35;
      color: var(--text-main);
      flex: 1;
    }
    .action-btn {
      background: var(--accent);
      color: #ffffff;
      border: none;
      padding: 8px 14px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.2s;
    }
    .action-btn:active {
      background: var(--accent-hover);
    }
    .btn-exit-ar {
      background: rgba(239, 68, 68, 0.85);
      color: #fff;
    }
    /* Retícula de escaneo para el marcador */
    .scanning-reticle {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(70vw, 260px);
      height: min(70vw, 260px);
      border: 2px dashed rgba(255, 255, 255, 0.6);
      border-radius: 24px;
      pointer-events: none;
      z-index: 20;
      display: none;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.35);
    }
    .scanning-reticle::after {
      content: "Alinea el marcador o QR aquí";
      position: absolute;
      bottom: -32px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 12px;
      color: #ffffff;
      font-weight: 600;
      white-space: nowrap;
      text-shadow: 0 2px 4px rgba(0,0,0,0.8);
    }
    /* Toast de estado / error */
    .toast-msg {
      position: fixed;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 23, 42, 0.9);
      color: #fff;
      padding: 10px 18px;
      border-radius: 9999px;
      font-size: 13px;
      font-weight: 500;
      z-index: 50;
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      display: none;
      text-align: center;
      max-width: 90vw;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    /* Modal de marcador de referencia */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      z-index: 60;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .modal-content {
      background: #1e293b;
      border-radius: 24px;
      padding: 20px;
      max-width: 320px;
      width: 100%;
      text-align: center;
      border: 1px solid rgba(255,255,255,0.15);
    }
    .modal-content img {
      width: 100%;
      border-radius: 12px;
      margin-top: 12px;
      margin-bottom: 16px;
      background: #ffffff;
      padding: 8px;
      box-sizing: border-box;
    }
  </style>

  <!-- Bibliotecas por CDN fijas -->
  <script src="https://unpkg.com/three@0.150.0/build/three.min.js"></script>
  <script type="module" src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js"></script>
</head>
<body>
  <!-- Contenedor Principal -->
  <div id="viewport-container">
    <video id="video-background" autoplay playsinline muted></video>
    <div id="three-canvas-container"></div>
    <div id="mindar-container"></div>
  </div>

  <!-- Retícula de escaneo para Marcador -->
  <div id="reticle" class="scanning-reticle"></div>

  <!-- Barra Superior de Modos -->
  <div class="top-bar">
    <nav class="mode-nav">
      <button id="btn-parallax" class="mode-btn active" onclick="switchViewerMode('parallax')">
        <span>✨</span> Parallax
      </button>
      <button id="btn-ar-libre" class="mode-btn" onclick="switchViewerMode('ar_libre')">
        <span>🌐</span> AR libre
      </button>
      <button id="btn-marcador" class="mode-btn" onclick="switchViewerMode('marcador')">
        <span>🎯</span> Marcador
      </button>
    </nav>
  </div>

  <!-- Tarjeta Inferior de Guía -->
  <div class="bottom-card">
    <div class="guide-banner">
      <div id="guide-icon" class="guide-icon">✨</div>
      <div id="guide-text" class="guide-text">
        Inclina tu celular para ver la profundidad de las capas (o arrastra con el dedo).
      </div>
      <button id="guide-action-btn" class="action-btn" style="display: none;"></button>
    </div>
  </div>

  <!-- Notificación Toast -->
  <div id="toast" class="toast-msg"></div>

  <!-- Modal para ver el marcador que se debe apuntar -->
  <div id="marker-modal" class="modal-backdrop" onclick="toggleMarkerModal(false)">
    <div class="modal-content" onclick="event.stopPropagation()">
      <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 4px;">Marcador a apuntar</h3>
      <p style="font-size: 12px; color: #94a3b8;">Apunta la cámara a esta imagen o código QR:</p>
      <img id="modal-marker-img" src="" alt="Marcador">
      <button class="action-btn" style="width: 100%;" onclick="toggleMarkerModal(false)">Entendido</button>
    </div>
  </div>

  <!-- Datos incrustados de las capas y marcador -->
  <script type="application/json" id="layers-data">
    ${layersJson}
  </script>
  <script type="application/json" id="marker-meta">
    ${JSON.stringify({ imageUrl: markerImage, hasMind: !!mindBase64 })}
  </script>
  <script type="text/plain" id="mind-base64">
    ${mindBase64}
  </script>

  <!-- Lógica Principal del Visor -->
  <script>
    // Variables globales del visor
    let currentMode = 'parallax';
    let layersData = [];
    let markerMeta = {};
    let mindBase64Data = '';
    
    // Three.js instances
    let scene, camera, renderer;
    let layersGroup;
    let layerMeshes = [];
    let textureLoader;
    let animationFrameId;

    // Control de sensores y gestos
    let orientationPermissionGranted = false;
    let targetCameraPos = { x: 0, y: 1.0, z: 3.2 };
    let currentCameraPos = { x: 0, y: 1.0, z: 3.2 };
    let isPointerDown = false;
    let pointerStart = { x: 0, y: 0 };
    let pointerOffset = { x: 0, y: 0 };
    let deviceOrientation = { beta: 45, gamma: 0 };

    // Elementos de AR Libre y MindAR
    let cameraStream = null;
    let mindarInstance = null;
    let mindarAnchor = null;

    // Toast helper
    function showToast(msg, duration = 3000) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, duration);
    }

    function toggleMarkerModal(show) {
      const modal = document.getElementById('marker-modal');
      modal.style.display = show ? 'flex' : 'none';
    }

    // Inicialización al cargar la página
    window.addEventListener('DOMContentLoaded', () => {
      try {
        layersData = JSON.parse(document.getElementById('layers-data').textContent);
        markerMeta = JSON.parse(document.getElementById('marker-meta').textContent);
        mindBase64Data = document.getElementById('mind-base64').textContent.trim();
        document.getElementById('modal-marker-img').src = markerMeta.imageUrl || '';
      } catch (err) {
        console.error('Error parseando datos incrustados:', err);
      }

      initThree();
      setupPointerEvents();
      setupDeviceOrientation();
      switchViewerMode('parallax');
    });

    // Inicializar Three.js
    function initThree() {
      const container = document.getElementById('three-canvas-container');
      
      scene = new THREE.Scene();
      
      const aspect = container.clientWidth / container.clientHeight;
      camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
      camera.position.set(0, 1.0, 3.2);
      camera.lookAt(0, 1.0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputEncoding = THREE.sRGBEncoding;
      container.appendChild(renderer.domElement);

      // Iluminación suave
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 1.2);
      scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(2, 4, 3);
      scene.add(dirLight);

      // Crear grupo de capas
      textureLoader = new THREE.TextureLoader();
      buildLayersGroup();

      window.addEventListener('resize', onWindowResize);
      renderLoop();
    }

    // Construir la escena con las capas 3D
    function buildLayersGroup() {
      if (layersGroup) scene.remove(layersGroup);
      
      layersGroup = new THREE.Group();
      layersGroup.name = 'layersGroup';
      layerMeshes = [];

      layersData.forEach((layer, idx) => {
        if (!layer.visible) return;

        const texture = textureLoader.load(layer.imageUrl);
        texture.encoding = THREE.sRGBEncoding;

        const w = layer.width || 2;
        const h = layer.height || (w / (layer.aspectRatio || 1));
        const geom = new THREE.PlaneGeometry(w, h);
        
        const mat = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: layer.opacity !== undefined ? layer.opacity : 1.0,
          depthWrite: false,
          side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(layer.position[0], layer.position[1], layer.position[2]);
        mesh.rotation.set(layer.rotation[0], layer.rotation[1], layer.rotation[2]);
        mesh.scale.set(layer.scale[0], layer.scale[1], layer.scale[2]);
        mesh.renderOrder = layer.order !== undefined ? layer.order : idx;

        layersGroup.add(mesh);
        layerMeshes.push(mesh);
      });

      scene.add(layersGroup);
    }

    // Ciclo de animación
    function renderLoop() {
      animationFrameId = requestAnimationFrame(renderLoop);

      if (currentMode === 'parallax') {
        // Suavizado suave (damping) de la cámara hacia targetCameraPos
        currentCameraPos.x += (targetCameraPos.x - currentCameraPos.x) * 0.08;
        currentCameraPos.y += (targetCameraPos.y - currentCameraPos.y) * 0.08;
        currentCameraPos.z += (targetCameraPos.z - currentCameraPos.z) * 0.08;

        camera.position.set(currentCameraPos.x, currentCameraPos.y, currentCameraPos.z);
        camera.lookAt(0, 1.0, 0);
        renderer.render(scene, camera);

      } else if (currentMode === 'ar_libre') {
        // Modo AR Libre: Cámara fija mirando hacia el centro y capas flotando en relación con el móvil
        renderer.render(scene, camera);

      } else if (currentMode === 'marcador') {
        // En modo marcador MindARThree maneja su propio render loop o se actualiza aquí
        if (!mindarInstance) {
          renderer.render(scene, camera);
        }
      }
    }

    function onWindowResize() {
      const container = document.getElementById('three-canvas-container');
      if (!renderer || !camera || !container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    // Configurar control táctil / mouse para Parallax
    function setupPointerEvents() {
      const container = document.getElementById('viewport-container');

      const onPointerDown = (e) => {
        if (currentMode !== 'parallax') return;
        isPointerDown = true;
        pointerStart.x = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        pointerStart.y = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      };

      const onPointerMove = (e) => {
        if (!isPointerDown || currentMode !== 'parallax') return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
        const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
        
        const deltaX = (clientX - pointerStart.x) / window.innerWidth;
        const deltaY = (clientY - pointerStart.y) / window.innerHeight;

        pointerOffset.x = Math.max(-1, Math.min(1, deltaX * 2.5));
        pointerOffset.y = Math.max(-1, Math.min(1, deltaY * 2.5));

        updateParallaxCamera();
      };

      const onPointerUp = () => {
        isPointerDown = false;
        // Regresar lentamente al centro si no hay sensor activo
        if (!orientationPermissionGranted) {
          pointerOffset.x = 0;
          pointerOffset.y = 0;
          updateParallaxCamera();
        }
      };

      container.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);

      container.addEventListener('touchstart', onPointerDown, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp, { passive: true });
    }

    // Configurar sensores de orientación (Giroscopio)
    function setupDeviceOrientation() {
      if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    }

    function handleOrientation(e) {
      if (e.beta === null || e.gamma === null) return;
      orientationPermissionGranted = true;

      // Inclinación suave
      const pitch = (e.beta - 45) * 0.04;  // Inclinación hacia adelante/atrás centrada a 45°
      const roll = e.gamma * 0.04;          // Inclinación izquierda/derecha

      if (currentMode === 'parallax') {
        targetCameraPos.x = Math.max(-1.5, Math.min(1.5, roll * 1.5 + pointerOffset.x * 0.8));
        targetCameraPos.y = Math.max(0.1, Math.min(2.0, 1.0 - pitch * 1.2 - pointerOffset.y * 0.8));
        targetCameraPos.z = 3.2;
      } else if (currentMode === 'ar_libre') {
        // En AR libre ajustamos levemente la rotación de las capas o cámara
        if (layersGroup) {
          layersGroup.rotation.y = THREE.MathUtils.degToRad(-e.gamma * 0.5);
          layersGroup.rotation.x = THREE.MathUtils.degToRad((e.beta - 60) * 0.5);
        }
      }
    }

    function updateParallaxCamera() {
      if (!orientationPermissionGranted) {
        targetCameraPos.x = pointerOffset.x * 1.5;
        targetCameraPos.y = 1.0 - pointerOffset.y * 1.2;
        targetCameraPos.z = 3.2;
      }
    }

    // Solicitar permiso de movimiento en iOS 13+
    async function requestMotionPermission() {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const response = await DeviceOrientationEvent.requestPermission();
          if (response === 'granted') {
            orientationPermissionGranted = true;
            showToast('✅ Sensor de movimiento activado');
            document.getElementById('guide-action-btn').style.display = 'none';
          } else {
            showToast('Permiso de movimiento denegado. Puedes usar tu dedo.');
          }
        } catch (err) {
          console.error(err);
          showToast('No se pudo acceder a los sensores');
        }
      }
    }

    // Conmutador de Modos del Visor
    async function switchViewerMode(newMode) {
      currentMode = newMode;

      // Actualizar botones de navegación
      document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.getElementById('btn-' + newMode.replace('_', '-'));
      if (activeBtn) activeBtn.classList.add('active');

      // Limpiar estados previos
      stopCamera();
      stopMindAR();
      document.getElementById('reticle').style.display = 'none';
      document.getElementById('video-background').style.display = 'none';
      document.getElementById('mindar-container').style.display = 'none';
      document.getElementById('three-canvas-container').style.display = 'block';

      // Resetear transformaciones del grupo
      if (layersGroup) {
        layersGroup.position.set(0, 0, 0);
        layersGroup.rotation.set(0, 0, 0);
        layersGroup.scale.set(1, 1, 1);
        if (scene && !scene.children.includes(layersGroup)) {
          scene.add(layersGroup);
        }
      }

      const iconEl = document.getElementById('guide-icon');
      const textEl = document.getElementById('guide-text');
      const actionBtn = document.getElementById('guide-action-btn');
      actionBtn.style.display = 'none';
      actionBtn.className = 'action-btn';

      if (newMode === 'parallax') {
        iconEl.textContent = '✨';
        textEl.textContent = 'Inclina tu celular para ver la profundidad de las capas (o arrastra con el dedo).';

        // Botón iOS si es necesario
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function' && !orientationPermissionGranted) {
          actionBtn.textContent = 'Activar movimiento';
          actionBtn.onclick = requestMotionPermission;
          actionBtn.style.display = 'inline-block';
        }

        targetCameraPos = { x: 0, y: 1.0, z: 3.2 };
        camera.position.set(0, 1.0, 3.2);
        camera.lookAt(0, 1.0, 0);

      } else if (newMode === 'ar_libre') {
        iconEl.textContent = '🌐';
        textEl.textContent = 'Apunta a tu alrededor para ver las capas flotando en tu espacio real.';
        actionBtn.textContent = 'Salir de AR';
        actionBtn.classList.add('btn-exit-ar');
        actionBtn.onclick = () => switchViewerMode('parallax');
        actionBtn.style.display = 'inline-block';

        camera.position.set(0, 1.0, 2.8);
        camera.lookAt(0, 1.0, 0);
        await startARLibre();

      } else if (newMode === 'marcador') {
        iconEl.textContent = '🎯';
        textEl.textContent = 'Apunta la cámara al marcador o código QR para activar el holograma.';
        
        actionBtn.textContent = 'Ver marcador';
        actionBtn.onclick = () => toggleMarkerModal(true);
        actionBtn.style.display = 'inline-block';

        document.getElementById('reticle').style.display = 'block';
        await startMindAR();
      }
    }

    // Modo AR Libre: Cámara de fondo y capas fijas
    async function startARLibre() {
      const video = document.getElementById('video-background');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        cameraStream = stream;
        video.srcObject = stream;
        video.style.display = 'block';
        await video.play();
      } catch (err) {
        console.error('Error accediendo a la cámara en AR libre:', err);
        showToast('⚠️ No se pudo acceder a la cámara. Revisa los permisos.');
      }
    }

    // Detener la cámara de fondo
    function stopCamera() {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
      }
      const video = document.getElementById('video-background');
      video.srcObject = null;
      video.style.display = 'none';
    }

    // Iniciar MindAR con el .mind incrustado
    async function startMindAR() {
      if (!mindBase64Data) {
        showToast('⚠️ No hay datos .mind incrustados en este visor.');
        return;
      }

      // Convertir base64 a Blob URL
      function b64ToBlobUrl(b64) {
        const bin = atob(b64);
        const len = bin.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
        return URL.createObjectURL(blob);
      }

      const mindBlobUrl = b64ToBlobUrl(mindBase64Data);
      const mindarContainer = document.getElementById('mindar-container');
      mindarContainer.innerHTML = '';
      mindarContainer.style.display = 'block';

      // Ocultar canvas three estándar mientras MindAR Three gestiona la escena
      document.getElementById('three-canvas-container').style.display = 'none';

      try {
        // Verificar disponibilidad de MindARThree
        const MindARThreeClass = window.MINDAR?.IMAGE?.MindARThree;
        if (!MindARThreeClass) {
          throw new Error('MindARThree no está cargado todavía.');
        }

        mindarInstance = new MindARThreeClass({
          container: mindarContainer,
          imageTargetSrc: mindBlobUrl,
          uiLoading: 'yes',
          uiScanning: 'yes',
          uiError: 'yes',
          filterMinCF: 0.0001,
          filterBeta: 0.001
        });

        const { renderer: arRenderer, scene: arScene, camera: arCamera } = mindarInstance;
        const anchor = mindarInstance.addAnchor(0);

        // CONVERSIÓN DE COORDENADAS REQUERIDA:
        // En MindAR el ancho del marcador es 1 unidad y el origen está en su centro (0,0,0).
        // Las capas del editor se meten en un grupo con escala 0.5 y posición (0, -0.5, 0).
        const arLayersGroup = new THREE.Group();
        arLayersGroup.scale.set(0.5, 0.5, 0.5);
        arLayersGroup.position.set(0, -0.5, 0);

        // Añadir las capas al grupo de AR
        layersData.forEach((layer, idx) => {
          if (!layer.visible) return;
          const tex = new THREE.TextureLoader().load(layer.imageUrl);
          tex.encoding = THREE.sRGBEncoding;

          const w = layer.width || 2;
          const h = layer.height || (w / (layer.aspectRatio || 1));
          const geom = new THREE.PlaneGeometry(w, h);
          const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            opacity: layer.opacity !== undefined ? layer.opacity : 1.0,
            depthWrite: false,
            side: THREE.DoubleSide
          });
          const m = new THREE.Mesh(geom, mat);
          m.position.set(layer.position[0], layer.position[1], layer.position[2]);
          m.rotation.set(layer.rotation[0], layer.rotation[1], layer.rotation[2]);
          m.scale.set(layer.scale[0], layer.scale[1], layer.scale[2]);
          m.renderOrder = layer.order !== undefined ? layer.order : idx;
          arLayersGroup.add(m);
        });

        anchor.group.add(arLayersGroup);

        anchor.onTargetFound = () => {
          showToast('🎯 ¡Marcador detectado!', 2000);
          document.getElementById('reticle').style.display = 'none';
        };

        anchor.onTargetLost = () => {
          document.getElementById('reticle').style.display = 'block';
        };

        await mindarInstance.start();

        arRenderer.setAnimationLoop(() => {
          arRenderer.render(arScene, arCamera);
        });

      } catch (err) {
        console.error('Error iniciando MindAR:', err);
        showToast('⚠️ Error al iniciar el reconocimiento AR. Revisa permisos de cámara.');
        // Regresar a canvas normal
        document.getElementById('three-canvas-container').style.display = 'block';
        mindarContainer.style.display = 'none';
      }
    }

    function stopMindAR() {
      if (mindarInstance) {
        try {
          mindarInstance.stop();
        } catch (e) {
          console.warn('Error al detener MindAR:', e);
        }
        mindarInstance = null;
      }
      const mindarContainer = document.getElementById('mindar-container');
      mindarContainer.innerHTML = '';
      mindarContainer.style.display = 'none';
    }
  </script>
</body>
</html>`;
}

/**
 * Descarga el archivo generado directamente en el navegador del usuario.
 */
export function downloadFile(content: string, filename: string, mimeType = 'text/html'): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Layer, MarkerConfig, AppMode, GizmoMode } from '../types';

interface ThreeCanvasProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayerTransform: (
    id: string,
    position: [number, number, number],
    rotation: [number, number, number],
    scale: [number, number, number]
  ) => void;
  marker: MarkerConfig;
  mode: AppMode;
  gizmoMode: GizmoMode;
  showGrid: boolean;
  onNotify: (msg: string) => void;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayerTransform,
  marker,
  mode,
  gizmoMode,
  showGrid,
  onNotify,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mindarContainerRef = useRef<HTMLDivElement>(null);

  // References to Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const perspCameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orthoCameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const orbitControlsRef = useRef<OrbitControls | null>(null);
  const transformControlsRef = useRef<TransformControls | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const markerMeshRef = useRef<THREE.Mesh | null>(null);
  const layersGroupRef = useRef<THREE.Group | null>(null);
  const layerMeshesMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());

  // Parallax & Gestures
  const isPointerDownRef = useRef(false);
  const pointerStartRef = useRef({ x: 0, y: 0 });
  const pointerOffsetRef = useRef({ x: 0, y: 0 });
  const targetCamPosRef = useRef({ x: 0, y: 1.0, z: 3.2 });
  const currentCamPosRef = useRef({ x: 0, y: 1.0, z: 3.2 });
  const orientationEnabledRef = useRef(false);

  // Camera stream for AR Libre
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Tracking status for Marker AR
  const [isMarkerDetected, setIsMarkerDetected] = useState(false);
  const [motionPermNeeded, setMotionPermNeeded] = useState(false);

  // Stop AR video stream safely
  const stopCameraStream = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.style.display = 'none';
    }
  }, []);

  // Initialize Scene, Renderer, Cameras, Lights
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software rendering
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const aspect = width / height;

    // 1. Perspective Camera for 3D, Parallax, AR
    const perspCamera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    perspCamera.position.set(0, 1.2, 3.4);
    perspCamera.lookAt(0, 1.0, 0);
    perspCameraRef.current = perspCamera;

    // 2. Orthographic Camera for 2D Front View
    const frustumSize = 2.8;
    const orthoCamera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    orthoCamera.position.set(0, 1.0, 5);
    orthoCamera.lookAt(0, 1.0, 0);
    orthoCameraRef.current = orthoCamera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Procedural Studio Environment
    try {
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    } catch (e) {
      console.warn('RoomEnvironment fallback:', e);
    }

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 1.1);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(3, 5, 4);
    scene.add(dirLight);

    // Grid Helper (placed at base Y=0)
    const grid = new THREE.GridHelper(10, 20, 0x2f6bff, 0x334155);
    grid.position.y = 0;
    scene.add(grid);
    gridHelperRef.current = grid;

    // Orbit Controls
    const orbit = new OrbitControls(perspCamera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.target.set(0, 1.0, 0);
    orbit.maxDistance = 15;
    orbit.minDistance = 0.5;
    orbitControlsRef.current = orbit;

    // Transform Controls (Gizmo)
    const transform = new TransformControls(perspCamera, renderer.domElement);
    transform.size = 0.85;
    transform.space = 'local';

    transform.addEventListener('dragging-changed', (event) => {
      orbit.enabled = !event.value;
    });

    transform.addEventListener('objectChange', () => {
      const obj = transform.object;
      if (obj && obj.userData.layerId) {
        onUpdateLayerTransform(
          obj.userData.layerId,
          [obj.position.x, obj.position.y, obj.position.z],
          [obj.rotation.x, obj.rotation.y, obj.rotation.z],
          [obj.scale.x, obj.scale.y, obj.scale.z]
        );
      }
    });

    scene.add(transform as unknown as THREE.Object3D);
    transformControlsRef.current = transform;

    // Layers Group
    const layersGroup = new THREE.Group();
    layersGroup.name = 'layersGroup';
    scene.add(layersGroup);
    layersGroupRef.current = layersGroup;

    // Marker Mesh Plane (centered at (0, 1, 0), width = 2)
    const markerGeom = new THREE.PlaneGeometry(2, 2);
    const markerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const markerMesh = new THREE.Mesh(markerGeom, markerMat);
    markerMesh.position.set(0, 1.0, 0);
    markerMesh.name = 'markerMesh';
    scene.add(markerMesh);
    markerMeshRef.current = markerMesh;

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !perspCamera || !orthoCamera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const asp = w / h;

      perspCamera.aspect = asp;
      perspCamera.updateProjectionMatrix();

      orthoCamera.left = (-frustumSize * asp) / 2;
      orthoCamera.right = (frustumSize * asp) / 2;
      orthoCamera.top = frustumSize / 2;
      orthoCamera.bottom = -frustumSize / 2;
      orthoCamera.updateProjectionMatrix();

      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Render loop
    let animId = 0;
    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);

      const activeCamera =
        perspCameraRef.current;

      if (orbitControlsRef.current && orbitControlsRef.current.enabled) {
        orbitControlsRef.current.update();
      }

      // Parallax smooth interpolation
      if (targetCamPosRef.current && currentCamPosRef.current) {
        const cur = currentCamPosRef.current;
        const tgt = targetCamPosRef.current;
        cur.x += (tgt.x - cur.x) * 0.08;
        cur.y += (tgt.y - cur.y) * 0.08;
        cur.z += (tgt.z - cur.z) * 0.08;
      }

      if (renderer && scene && activeCamera) {
        renderer.render(scene, activeCamera);
      }
    };
    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      transform.dispose();
      orbit.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Sync Grid Visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid && (mode === '3d' || mode === '2d');
    }
  }, [showGrid, mode]);

  // Sync Marker Texture & Geometry
  useEffect(() => {
    if (!markerMeshRef.current) return;
    const mesh = markerMeshRef.current;

    mesh.visible = marker.visible && (mode === '3d' || mode === '2d');
    (mesh.material as THREE.MeshBasicMaterial).opacity = marker.opacity;

    // Load / update texture
    if (marker.imageUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(marker.imageUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        (mesh.material as THREE.MeshBasicMaterial).map = tex;
        (mesh.material as THREE.MeshBasicMaterial).needsUpdate = true;

        // Update geometry aspect ratio: width = 2 units, centered at (0, 1, 0)
        const aspect = marker.aspectRatio || 1;
        const height = 2 / aspect;
        mesh.geometry.dispose();
        mesh.geometry = new THREE.PlaneGeometry(2, height);
      });
    }
  }, [marker.imageUrl, marker.aspectRatio, marker.opacity, marker.visible, mode]);

  // Sync Layers in Scene
  useEffect(() => {
    const group = layersGroupRef.current;
    if (!group) return;

    const currentMap = layerMeshesMapRef.current;
    const newMap = new Map<string, THREE.Mesh>();
    const loader = new THREE.TextureLoader();

    layers.forEach((layer, idx) => {
      let mesh = currentMap.get(layer.id);

      if (!mesh) {
        // Create new mesh
        const geom = new THREE.PlaneGeometry(layer.width, layer.height);
        let tex = textureCacheRef.current.get(layer.imageUrl);
        if (!tex) {
          tex = loader.load(layer.imageUrl);
          tex.colorSpace = THREE.SRGBColorSpace;
          textureCacheRef.current.set(layer.imageUrl, tex);
        }

        const mat = new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          opacity: layer.opacity,
          side: THREE.DoubleSide,
          depthWrite: false,
          alphaTest: 0.005,
        });

        mesh = new THREE.Mesh(geom, mat);
        mesh.userData.layerId = layer.id;
        group.add(mesh);
      } else {
        // Update existing mesh properties
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = layer.opacity;

        // If dimensions changed
        const planeGeom = mesh.geometry as THREE.PlaneGeometry;
        const currentW = planeGeom.parameters ? planeGeom.parameters.width : (mesh.userData.width || 0);
        const currentH = planeGeom.parameters ? planeGeom.parameters.height : (mesh.userData.height || 0);
        if (
          Math.abs(currentW - layer.width) > 0.001 ||
          Math.abs(currentH - layer.height) > 0.001
        ) {
          mesh.geometry.dispose();
          mesh.geometry = new THREE.PlaneGeometry(layer.width, layer.height);
          mesh.userData.width = layer.width;
          mesh.userData.height = layer.height;
        }
      }

      mesh.visible = layer.visible;
      mesh.position.set(layer.position[0], layer.position[1], layer.position[2]);
      mesh.rotation.set(layer.rotation[0], layer.rotation[1], layer.rotation[2]);
      mesh.scale.set(layer.scale[0], layer.scale[1], layer.scale[2]);
      mesh.renderOrder = layer.order !== undefined ? layer.order : idx;

      newMap.set(layer.id, mesh);
    });

    // Remove meshes that are no longer in layers
    currentMap.forEach((mesh, id) => {
      if (!newMap.has(id)) {
        group.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    });

    layerMeshesMapRef.current = newMap;
  }, [layers]);

  // Sync Gizmo Attachment & Mode
  useEffect(() => {
    const transform = transformControlsRef.current;
    if (!transform) return;

    if (
      !selectedLayerId ||
      gizmoMode === 'none' ||
      (mode !== '3d' && mode !== '2d')
    ) {
      transform.detach();
      return;
    }

    const mesh = layerMeshesMapRef.current.get(selectedLayerId);
    if (mesh && mesh.visible) {
      transform.attach(mesh);
      transform.setMode(gizmoMode);
      // In 2D mode, restrict translation to X & Y
      if (mode === '2d') {
        transform.showZ = gizmoMode !== 'translate';
      } else {
        transform.showZ = true;
      }
    } else {
      transform.detach();
    }
  }, [selectedLayerId, gizmoMode, mode]);

  // Raycasting for layer selection on tap/click
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only raycast in 3D or 2D editor mode when not dragging gizmo
    if (mode !== '3d' && mode !== '2d') return;
    if (transformControlsRef.current && transformControlsRef.current.dragging) return;

    const container = mountRef.current;
    const camera =
      mode === '2d' ? orthoCameraRef.current : perspCameraRef.current;
    if (!container || !camera || !layersGroupRef.current) return;

    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const meshes = Array.from(layerMeshesMapRef.current.values()).filter(
      (m) => m.visible
    );
    const intersects = raycaster.intersectObjects(meshes, false);

    if (intersects.length > 0) {
      // Pick the closest layer
      const hit = intersects[0].object;
      if (hit.userData.layerId) {
        onSelectLayer(hit.userData.layerId);
      }
    }
  };

  // Parallax touch/mouse fallback gestures
  const handleParallaxPointerDown = (e: React.PointerEvent) => {
    if (mode !== 'parallax') return;
    isPointerDownRef.current = true;
    pointerStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleParallaxPointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current || mode !== 'parallax') return;
    const dx = (e.clientX - pointerStartRef.current.x) / window.innerWidth;
    const dy = (e.clientY - pointerStartRef.current.y) / window.innerHeight;

    pointerOffsetRef.current = {
      x: Math.max(-1, Math.min(1, dx * 2.5)),
      y: Math.max(-1, Math.min(1, dy * 2.5)),
    };

    if (!orientationEnabledRef.current) {
      targetCamPosRef.current.x = pointerOffsetRef.current.x * 1.5;
      targetCamPosRef.current.y = 1.0 - pointerOffsetRef.current.y * 1.2;
      targetCamPosRef.current.z = 3.2;
    }
  };

  const handleParallaxPointerUp = () => {
    if (mode !== 'parallax') return;
    isPointerDownRef.current = false;
    if (!orientationEnabledRef.current) {
      targetCamPosRef.current.x = 0;
      targetCamPosRef.current.y = 1.0;
      targetCamPosRef.current.z = 3.2;
    }
  };

  // Device orientation (Giroscopio) for Parallax & AR Libre
  useEffect(() => {
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null) return;
      orientationEnabledRef.current = true;
      setMotionPermNeeded(false);

      if (mode === 'parallax') {
        const pitch = (e.beta - 45) * 0.04;
        const roll = e.gamma * 0.04;
        targetCamPosRef.current.x = Math.max(-1.5, Math.min(1.5, roll * 1.5));
        targetCamPosRef.current.y = Math.max(0.1, Math.min(2.0, 1.0 - pitch * 1.2));
        targetCamPosRef.current.z = 3.2;
      } else if (mode === 'ar_libre') {
        if (layersGroupRef.current) {
          layersGroupRef.current.rotation.y = THREE.MathUtils.degToRad(-e.gamma * 0.4);
          layersGroupRef.current.rotation.x = THREE.MathUtils.degToRad((e.beta - 60) * 0.4);
        }
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleDeviceOrientation);
      // Check if iOS 13+ permission is required
      if (
        typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
          .requestPermission === 'function' &&
        !orientationEnabledRef.current
      ) {
        setMotionPermNeeded(true);
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [mode]);

  // iOS Sensor permission requester
  const requestMotionPermission = async () => {
    const event = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof event.requestPermission === 'function') {
      try {
        const response = await event.requestPermission();
        if (response === 'granted') {
          orientationEnabledRef.current = true;
          setMotionPermNeeded(false);
          onNotify('✅ Sensor de movimiento activado');
        } else {
          onNotify('Permiso denegado. Puedes usar tu dedo.');
        }
      } catch (err) {
        console.error(err);
        onNotify('No se pudo acceder al sensor');
      }
    }
  };

  // Mode changes (3D, 2D, Parallax, AR Libre, Marcador)
  useEffect(() => {
    const perspCam = perspCameraRef.current;
    const orthoCam = orthoCameraRef.current;
    const orbit = orbitControlsRef.current;
    const transform = transformControlsRef.current;
    const layersGroup = layersGroupRef.current;
    const videoEl = videoRef.current;

    // Reset stream
    stopCameraStream();

    if (!perspCam || !orthoCam || !orbit) return;

    if (mode === '3d') {
      // 3D Orbital Camera
      orbit.enabled = true;
      if (transform) transform.camera = perspCam;
      perspCam.position.set(0, 1.2, 3.4);
      perspCam.lookAt(0, 1.0, 0);
      orbit.target.set(0, 1.0, 0);
      if (layersGroup) {
        layersGroup.position.set(0, 0, 0);
        layersGroup.rotation.set(0, 0, 0);
        layersGroup.scale.set(1, 1, 1);
      }

    } else if (mode === '2d') {
      // 2D Orthographic Camera from Front
      orbit.enabled = false;
      orthoCam.position.set(0, 1.0, 5);
      orthoCam.lookAt(0, 1.0, 0);
      if (transform) transform.camera = orthoCam;
      if (layersGroup) {
        layersGroup.position.set(0, 0, 0);
        layersGroup.rotation.set(0, 0, 0);
        layersGroup.scale.set(1, 1, 1);
      }

    } else if (mode === 'parallax') {
      // Parallax Mode: Smooth floating camera looking at center
      orbit.enabled = false;
      if (transform) transform.detach();
      targetCamPosRef.current = { x: 0, y: 1.0, z: 3.2 };
      currentCamPosRef.current = { x: 0, y: 1.0, z: 3.2 };
      perspCam.position.set(0, 1.0, 3.2);
      perspCam.lookAt(0, 1.0, 0);
      if (layersGroup) {
        layersGroup.position.set(0, 0, 0);
        layersGroup.rotation.set(0, 0, 0);
        layersGroup.scale.set(1, 1, 1);
      }

    } else if (mode === 'ar_libre') {
      // AR Libre: Rear Camera background + Floating layers
      orbit.enabled = false;
      if (transform) transform.detach();
      perspCam.position.set(0, 1.0, 2.8);
      perspCam.lookAt(0, 1.0, 0);
      if (layersGroup) {
        layersGroup.position.set(0, 0, 0);
        layersGroup.scale.set(1, 1, 1);
      }

      // Start camera video
      navigator.mediaDevices
        ?.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        .then((stream) => {
          cameraStreamRef.current = stream;
          if (videoEl) {
            videoEl.srcObject = stream;
            videoEl.style.display = 'block';
            videoEl.play().catch(console.error);
          }
          onNotify('📷 Cámara activa en modo AR libre');
        })
        .catch((err) => {
          console.error(err);
          onNotify('⚠️ No se pudo acceder a la cámara trasera');
        });

    } else if (mode === 'marcador') {
      // Marcador AR
      orbit.enabled = false;
      if (transform) transform.detach();

      // Conversión de coordenadas requerida:
      // "Conversión de coordenadas: el ancho del marcador en MindAR es 1 unidad y el origen está en su centro;
      // las capas del editor se meten en un grupo con escala 0.5 y posición (0,-0.5,0)."
      if (layersGroup) {
        layersGroup.scale.set(0.5, 0.5, 0.5);
        layersGroup.position.set(0, -0.5, 0);
      }

      // Live MindAR tracking in app
      if (marker.isCompiled && marker.compiledMindBase64 && window.MINDAR?.IMAGE?.MindARThree) {
        // We will start MindAR or camera test
        setIsMarkerDetected(false);
      } else {
        onNotify('ℹ️ Compilando marcador o iniciando simulador AR...');
      }

      // Start camera background for marker tracking experience
      navigator.mediaDevices
        ?.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        .then((stream) => {
          cameraStreamRef.current = stream;
          if (videoEl) {
            videoEl.srcObject = stream;
            videoEl.style.display = 'block';
            videoEl.play().catch(console.error);
          }
        })
        .catch(() => {
          onNotify('ℹ️ Modo visualización sin cámara activa.');
        });
    }

    return () => {
      stopCameraStream();
    };
  }, [mode, marker.isCompiled, marker.compiledMindBase64, onNotify, stopCameraStream]);

  // Center / reset camera view helper
  const resetCamera = useCallback(() => {
    if (perspCameraRef.current && orbitControlsRef.current) {
      perspCameraRef.current.position.set(0, 1.2, 3.4);
      perspCameraRef.current.lookAt(0, 1.0, 0);
      orbitControlsRef.current.target.set(0, 1.0, 0);
      orbitControlsRef.current.update();
    }
  }, []);

  // Expose camera reset via window event
  useEffect(() => {
    const handleReset = () => resetCamera();
    window.addEventListener('reset-3d-camera', handleReset);
    return () => window.removeEventListener('reset-3d-camera', handleReset);
  }, [resetCamera]);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none touch-none bg-slate-950"
      onPointerDown={(e) => {
        handlePointerDown(e);
        handleParallaxPointerDown(e);
      }}
      onPointerMove={handleParallaxPointerMove}
      onPointerUp={handleParallaxPointerUp}
    >
      {/* Background Video for AR Libre / Marcador preview */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className="absolute inset-0 w-full h-full object-cover z-0 hidden pointer-events-none"
      />

      {/* Main Three.js WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full z-10" />

      {/* Container for MindAR live tracking overlay */}
      <div
        ref={mindarContainerRef}
        className="absolute inset-0 w-full h-full z-20 pointer-events-none hidden"
      />

      {/* Scanning Reticle Frame in Marcador Mode */}
      {mode === 'marcador' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center">
          <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-dashed border-blue-400/80 rounded-3xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex items-center justify-center animate-pulse">
            <div className="w-12 h-12 border-2 border-blue-400/50 rounded-xl" />
          </div>
          <span className="mt-3 text-xs font-semibold px-3 py-1 bg-slate-900/90 text-white rounded-full shadow-lg border border-white/20">
            Apunta la cámara al marcador o código QR
          </span>
        </div>
      )}

      {/* iOS Gyroscope Permission Prompt */}
      {mode === 'parallax' && motionPermNeeded && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={requestMotionPermission}
            className="px-4 py-2 bg-[#2f6bff] hover:bg-[#1f57e7] text-white text-xs font-bold rounded-full shadow-lg active:scale-95 transition-transform flex items-center gap-2"
          >
            <span>📱</span> Activar movimiento con sensor
          </button>
        </div>
      )}

      {/* Marcador Target Found Badge */}
      {mode === 'marcador' && isMarkerDetected && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40">
          <div className="px-4 py-1.5 bg-emerald-600/90 text-white text-xs font-bold rounded-full shadow-lg border border-emerald-400 flex items-center gap-2">
            <span>🎯</span> Marcador Detectado
          </div>
        </div>
      )}
    </div>
  );
};

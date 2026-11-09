export interface Layer {
  id: string;
  name: string;
  imageUrl: string; // base64 data URL
  width: number;    // 3D units (default base ~2)
  height: number;   // 3D units based on aspect ratio
  aspectRatio: number;
  position: [number, number, number];
  rotation: [number, number, number]; // in radians
  scale: [number, number, number];
  opacity: number;  // 0 to 1
  visible: boolean;
  order: number;    // 0 = background, 1, 2... foreground
}

export type MarkerType = 'custom_image' | 'qr_code';

export interface MarkerConfig {
  type: MarkerType;
  imageUrl: string; // base64 data URL
  name: string;
  aspectRatio: number;
  opacity: number;
  visible: boolean;
  compiledMindBase64?: string;
  isCompiled: boolean;
  targetUrl: string; // URL for QR code
}

export type AppMode = '3d' | '2d' | 'parallax' | 'ar_libre' | 'marcador';

export type GizmoMode = 'translate' | 'rotate' | 'scale' | 'none';

export type ViewRole = 'editor' | 'visor';

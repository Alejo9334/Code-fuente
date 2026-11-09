import QRCode from 'qrcode';
import { Layer, MarkerConfig } from '../types';

/**
 * Redimensiona una imagen subida para que su lado máximo no supere maxSide (por defecto 900 px),
 * manteniendo la transparencia PNG intacta.
 */
export async function resizeImage(
  fileOrBlob: File | Blob,
  maxSide = 900
): Promise<{ dataUrl: string; width: number; height: number; aspectRatio: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let w = img.naturalWidth || img.width;
        let h = img.naturalHeight || img.height;

        if (w > maxSide || h > maxSide) {
          if (w >= h) {
            h = Math.round((h * maxSide) / w);
            w = maxSide;
          } else {
            w = Math.round((w * maxSide) / h);
            h = maxSide;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo obtener el contexto 2D'));
          return;
        }

        // Asegurar fondo transparente limpio
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const dataUrl = canvas.toDataURL('image/png');
        resolve({
          dataUrl,
          width: w,
          height: h,
          aspectRatio: w / h,
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Genera un código QR de alta resolución con corrección de error 'H' (High) y margen blanco.
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text || window.location.href, {
      errorCorrectionLevel: 'H',
      margin: 4,
      width: 800,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Error generando QR:', err);
    // Fallback con canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);
    ctx.fillStyle = '#000000';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code', 256, 256);
    return canvas.toDataURL('image/png');
  }
}

/**
 * Genera un marcador de prueba de alto contraste con patrones geométricos óptimos para MindAR.
 */
export function generateDefaultMarkerDataUrl(): { dataUrl: string; aspectRatio: number } {
  const size = 800;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Fondo blanco con borde grueso
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 28;
  ctx.strokeRect(30, 30, size - 60, size - 60);

  // Marco interno
  ctx.strokeStyle = '#2f6bff';
  ctx.lineWidth = 14;
  ctx.strokeRect(80, 80, size - 160, size - 160);

  // Esquinas asimétricas de alto contraste (ideales para extracción de esquinas y puntos de seguimiento)
  const drawCornerPattern = (x: number, y: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-60, -60, 50, 50);
    ctx.fillStyle = '#2f6bff';
    ctx.beginPath();
    ctx.arc(-20, -20, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  drawCornerPattern(140, 140, 0);
  drawCornerPattern(size - 140, 140, Math.PI / 2);
  drawCornerPattern(size - 140, size - 140, Math.PI);
  drawCornerPattern(140, size - 140, -Math.PI / 2);

  // Emblema central con patrones distintivos
  ctx.save();
  ctx.translate(size / 2, size / 2);

  // Círculo central oscuro
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, 180, 0, Math.PI * 2);
  ctx.fill();

  // Rayos geométricos
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * 70, Math.sin(angle) * 70);
    ctx.lineTo(Math.cos(angle) * 160, Math.sin(angle) * 160);
    ctx.stroke();
  }

  // Triángulo central y letras "CAPAS AR"
  ctx.fillStyle = '#2f6bff';
  ctx.beginPath();
  ctx.moveTo(0, -90);
  ctx.lineTo(80, 60);
  ctx.lineTo(-80, 60);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 38px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AR', 0, 10);

  ctx.font = 'bold 22px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('TARGET', 0, 115);

  ctx.restore();

  // Texto perimetral
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('• CAPAS AR - MARCADOR DE RECONOCIMIENTO •', size / 2, size - 42);
  ctx.fillText('• APUNTA LA CÁMARA AQUÍ •', size / 2, 54);

  return {
    dataUrl: canvas.toDataURL('image/png'),
    aspectRatio: 1.0,
  };
}

/**
 * Crea las capas iniciales de demostración en alta resolución:
 * 1. Fondo: Portal cósmico y marco estelar
 * 2. Capa intermedia: Anillos rúnicos holográficos
 * 3. Personaje principal: Cristal / Insignia flotante con brillo
 * 4. Primer plano: Destellos, partículas brillantes y glifos flotantes
 */
export function generateDemoLayers(): Layer[] {
  const size = 800;

  // Capa 1: Fondo (Portal dimensional profundo)
  const c1 = document.createElement('canvas');
  c1.width = size;
  c1.height = size;
  const ctx1 = c1.getContext('2d')!;
  ctx1.clearRect(0, 0, size, size);

  // Marco exterior estilizado
  ctx1.strokeStyle = 'rgba(79, 70, 229, 0.85)';
  ctx1.lineWidth = 12;
  ctx1.strokeRect(40, 40, size - 80, size - 80);

  // Fondo gradiente circular
  const grad1 = ctx1.createRadialGradient(size / 2, size / 2, 60, size / 2, size / 2, 340);
  grad1.addColorStop(0, 'rgba(47, 107, 255, 0.7)');
  grad1.addColorStop(0.5, 'rgba(124, 58, 237, 0.5)');
  grad1.addColorStop(0.85, 'rgba(15, 23, 42, 0.85)');
  grad1.addColorStop(1, 'rgba(15, 23, 42, 0)');
  ctx1.fillStyle = grad1;
  ctx1.beginPath();
  ctx1.arc(size / 2, size / 2, 340, 0, Math.PI * 2);
  ctx1.fill();

  // Estrellas de fondo
  ctx1.fillStyle = '#ffffff';
  for (let i = 0; i < 90; i++) {
    const sx = 60 + Math.random() * (size - 120);
    const sy = 60 + Math.random() * (size - 120);
    const sr = Math.random() * 2.5 + 0.8;
    ctx1.beginPath();
    ctx1.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx1.fill();
  }

  // Capa 2: Anillos rúnicos geométricos (Capa media-profunda)
  const c2 = document.createElement('canvas');
  c2.width = size;
  c2.height = size;
  const ctx2 = c2.getContext('2d')!;
  ctx2.clearRect(0, 0, size, size);

  ctx2.save();
  ctx2.translate(size / 2, size / 2);
  ctx2.strokeStyle = 'rgba(56, 189, 248, 0.85)';
  ctx2.lineWidth = 4;
  ctx2.beginPath();
  ctx2.arc(0, 0, 250, 0, Math.PI * 2);
  ctx2.stroke();

  ctx2.strokeStyle = 'rgba(147, 51, 234, 0.7)';
  ctx2.lineWidth = 3;
  ctx2.setLineDash([12, 8]);
  ctx2.beginPath();
  ctx2.arc(0, 0, 220, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.setLineDash([]);

  // Hexágono místico
  ctx2.strokeStyle = 'rgba(47, 107, 255, 0.9)';
  ctx2.lineWidth = 6;
  ctx2.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const x = Math.cos(a) * 190;
    const y = Math.sin(a) * 190;
    if (i === 0) ctx2.moveTo(x, y);
    else ctx2.lineTo(x, y);
  }
  ctx2.closePath();
  ctx2.stroke();

  // Glifos orbitales
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const x = Math.cos(a) * 250;
    const y = Math.sin(a) * 250;
    ctx2.fillStyle = '#38bdf8';
    ctx2.beginPath();
    ctx2.arc(x, y, 7, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.restore();

  // Capa 3: Cristal Central Holográfico (Personaje/Elemento principal)
  const c3 = document.createElement('canvas');
  c3.width = size;
  c3.height = size;
  const ctx3 = c3.getContext('2d')!;
  ctx3.clearRect(0, 0, size, size);

  ctx3.save();
  ctx3.translate(size / 2, size / 2);

  // Cristal de cuarzo holográfico prismático
  const drawFacet = (pts: [number, number][], fill: string) => {
    ctx3.fillStyle = fill;
    ctx3.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx3.lineWidth = 2;
    ctx3.beginPath();
    ctx3.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      ctx3.lineTo(pts[i][0], pts[i][1]);
    }
    ctx3.closePath();
    ctx3.fill();
    ctx3.stroke();
  };

  // Caras del cristal
  drawFacet([[0, -160], [70, -40], [0, 40]], 'rgba(56, 189, 248, 0.85)');
  drawFacet([[0, -160], [-70, -40], [0, 40]], 'rgba(47, 107, 255, 0.85)');
  drawFacet([[70, -40], [0, 40], [45, 140]], 'rgba(147, 51, 234, 0.85)');
  drawFacet([[-70, -40], [0, 40], [-45, 140]], 'rgba(99, 102, 241, 0.85)');
  drawFacet([[0, 40], [45, 140], [0, 170], [-45, 140]], 'rgba(236, 72, 153, 0.85)');

  // Resplandor central
  const glow = ctx3.createRadialGradient(0, 0, 10, 0, 0, 120);
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  glow.addColorStop(0.4, 'rgba(56, 189, 248, 0.5)');
  glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
  ctx3.fillStyle = glow;
  ctx3.beginPath();
  ctx3.arc(0, 0, 120, 0, Math.PI * 2);
  ctx3.fill();

  ctx3.restore();

  // Capa 4: Destellos y Partículas en Primer Plano
  const c4 = document.createElement('canvas');
  c4.width = size;
  c4.height = size;
  const ctx4 = c4.getContext('2d')!;
  ctx4.clearRect(0, 0, size, size);

  // Destello brillante en forma de estrella de 4 puntas
  const drawStarFlare = (cx: number, cy: number, r: number) => {
    ctx4.save();
    ctx4.translate(cx, cy);
    const g = ctx4.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, 'rgba(255, 255, 255, 1)');
    g.addColorStop(0.3, 'rgba(147, 197, 253, 0.8)');
    g.addColorStop(1, 'rgba(147, 197, 253, 0)');
    ctx4.fillStyle = g;
    ctx4.beginPath();
    ctx4.arc(0, 0, r, 0, Math.PI * 2);
    ctx4.fill();

    ctx4.fillStyle = '#ffffff';
    ctx4.beginPath();
    ctx4.moveTo(-r * 1.5, 0);
    ctx4.quadraticCurveTo(0, 0, 0, -r * 1.5);
    ctx4.quadraticCurveTo(0, 0, r * 1.5, 0);
    ctx4.quadraticCurveTo(0, 0, 0, r * 1.5);
    ctx4.quadraticCurveTo(0, 0, -r * 1.5, 0);
    ctx4.fill();
    ctx4.restore();
  };

  drawStarFlare(260, 220, 35);
  drawStarFlare(560, 480, 28);
  drawStarFlare(520, 200, 22);
  drawStarFlare(230, 560, 18);

  // Partículas de luz flotantes
  ctx4.fillStyle = 'rgba(255, 255, 255, 0.9)';
  for (let i = 0; i < 40; i++) {
    const px = 100 + Math.random() * (size - 200);
    const py = 100 + Math.random() * (size - 200);
    const pr = Math.random() * 4 + 1.5;
    ctx4.beginPath();
    ctx4.arc(px, py, pr, 0, Math.PI * 2);
    ctx4.fill();
  }

  // Capas con separación Z inicial estética
  return [
    {
      id: 'layer-1-fondo',
      name: '1. Portal de Fondo',
      imageUrl: c1.toDataURL('image/png'),
      width: 2.0,
      height: 2.0,
      aspectRatio: 1.0,
      position: [0, 1.0, -0.3],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      opacity: 1.0,
      visible: true,
      order: 0,
    },
    {
      id: 'layer-2-runas',
      name: '2. Anillos Rúnicos',
      imageUrl: c2.toDataURL('image/png'),
      width: 2.0,
      height: 2.0,
      aspectRatio: 1.0,
      position: [0, 1.0, -0.1],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      opacity: 0.95,
      visible: true,
      order: 1,
    },
    {
      id: 'layer-3-cristal',
      name: '3. Cristal Holográfico',
      imageUrl: c3.toDataURL('image/png'),
      width: 2.0,
      height: 2.0,
      aspectRatio: 1.0,
      position: [0, 1.0, 0.15],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      opacity: 1.0,
      visible: true,
      order: 2,
    },
    {
      id: 'layer-4-destellos',
      name: '4. Destellos y Brillo',
      imageUrl: c4.toDataURL('image/png'),
      width: 2.0,
      height: 2.0,
      aspectRatio: 1.0,
      position: [0, 1.0, 0.35],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      opacity: 1.0,
      visible: true,
      order: 3,
    },
  ];
}

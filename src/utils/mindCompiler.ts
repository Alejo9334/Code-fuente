// Declaración para TypeScript
declare global {
  interface Window {
    MINDAR?: {
      IMAGE?: {
        Compiler?: new () => {
          compileImageTargets: (
            images: HTMLImageElement[],
            onProgress?: (progress: number) => void
          ) => Promise<unknown[]>;
          exportData: () => Promise<Uint8Array> | Uint8Array;
        };
        MindARThree?: new (options: Record<string, unknown>) => unknown;
      };
    };
  }
}

/**
 * Convierte un Uint8Array / ArrayBuffer a string Base64.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convierte una cadena Base64 a un Blob URL local utilizable por MindAR.
 */
export function base64ToBlobUrl(base64: string, mimeType = 'application/octet-stream'): string {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Asegura que el script de MindAR esté cargado en el navegador.
 */
async function ensureMindARLoaded(): Promise<boolean> {
  if (window.MINDAR?.IMAGE?.Compiler) return true;

  return new Promise((resolve) => {
    // Si ya existe la etiqueta de script, esperar a que termine
    const existing = document.querySelector('script[src*="mindar-image.prod.js"]');
    if (existing) {
      let checks = 0;
      const interval = setInterval(() => {
        checks++;
        if (window.MINDAR?.IMAGE?.Compiler) {
          clearInterval(interval);
          resolve(true);
        } else if (checks > 30) {
          clearInterval(interval);
          resolve(false);
        }
      }, 200);
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js';
    script.onload = () => {
      setTimeout(() => resolve(!!window.MINDAR?.IMAGE?.Compiler), 300);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Compila una imagen (data URL) a formato .mind utilizando el compilador oficial de MindAR en el navegador.
 */
export async function compileMarkerToMind(
  imageDataUrl: string,
  onProgress?: (progress: number) => void
): Promise<{ base64: string; byteLength: number }> {
  // Asegurar que MindAR esté cargado
  await ensureMindARLoaded();

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      try {
        if (!window.MINDAR?.IMAGE?.Compiler) {
          throw new Error(
            'El módulo MindAR Compiler no se pudo inicializar en el navegador. Verifica la conexión a internet.'
          );
        }

        const compiler = new window.MINDAR.IMAGE.Compiler();

        if (onProgress) onProgress(10);

        // Compilar la imagen con callbacks de progreso
        await compiler.compileImageTargets([img], (progress: number) => {
          if (onProgress) {
            onProgress(Math.min(95, Math.round(progress)));
          }
        });

        if (onProgress) onProgress(98);

        const exportedBuffer = await compiler.exportData();
        const uint8 = exportedBuffer instanceof Uint8Array ? exportedBuffer : new Uint8Array(exportedBuffer);
        const base64 = uint8ArrayToBase64(uint8);

        if (onProgress) onProgress(100);

        resolve({
          base64,
          byteLength: uint8.byteLength,
        });
      } catch (err) {
        console.error('Error durante la compilación de MindAR:', err);
        reject(err);
      }
    };

    img.onerror = () => {
      reject(new Error('No se pudo cargar la imagen del marcador para compilar.'));
    };

    img.src = imageDataUrl;
  });
}

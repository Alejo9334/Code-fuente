# Visor-222 v2 — prototipo de múltiples cuadros

Esta carpeta es una prueba técnica aislada de la aplicación publicada. No contiene un editor privado ni una plataforma de cuentas.

## Objetivo
Abrir una cámara en el navegador, detectar qué cuadro físico se está viendo y mostrar únicamente las capas PNG de ese cuadro, como superficies planas colocadas a distintas profundidades. Cada capa admite su propia animación.

## Archivos
- `index.html`: visor público sin herramientas de edición.
- `catalogo.json`: catálogo declarativo de imágenes y capas.

## Prueba inicial
El catálogo incluye **una referencia de demostración**, porque todavía no hay imágenes reales de los cuadros del negocio. El reconocimiento de esa imagen usa la tarjeta oficial de ejemplo de MindAR:
https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png

Se muestran dos capas PNG transparentes generadas por el visor para validar la superposición, profundidad y animaciones. **Esta demostración de un solo cuadro no valida aún reconocimiento simultáneo de varios cuadros reales.**

Abre la página en un celular con HTTPS, pulsa *Activar cámara* y apunta la cámara a la tarjeta oficial mostrada en otra pantalla o impresa.

## Agregar múltiples cuadros
1. Recopilar las imágenes **exactas** que se imprimen en los cuadros.
2. Compilar TODAS las imágenes juntas, en un orden fijo, con el compilador de imágenes MindAR: https://hiukim.github.io/mind-ar-js-doc/tools/compile/
3. Publicar el archivo `.mind` resultante bajo `public/prototipo-ar/targets/cuadros.mind` (por ejemplo).
4. Cambiar `archivoMind` en `catalogo.json` a `./targets/cuadros.mind`.
5. Agregar un registro en `cuadros` por imagen **en el mismo orden** que se usó al compilar: `targetIndex` empieza en 0 y no puede repetirse.
6. Guardar las imágenes PNG transparentes como archivos estáticos y referenciarlas desde `imagen`, por ejemplo `./capas/cuadro-001/hojas.png`.
7. Definir `x`, `y` (centro de imagen), `z` (distancia perpendicular al cuadro), `ancho`, `alto` en las unidades del marcador MindAR. El marcador mide 1 de ancho en estas unidades. Valores de `z` entre 0.01 y 0.12 son un punto de partida, no una medida física exacta.
8. Para `animacion.tipo`, usar `flotar`, `pulso`, `girar` o dejarlo sin animación. `amplitud` representa unidades del marcador (flotar), escala relativa (pulso) o grados (girar). `duracionMs` se aplica por capa.

El visor crea un ancla de seguimiento distinta para cada `targetIndex`. Sus capas se muestran únicamente si MindAR reconoce la imagen correspondiente.

## Limitaciones de esta etapa
- Para añadir imágenes reales se requiere compilar el archivo .mind y subir los archivos del catálogo. El editor visual y la publicación desde el navegador vendrán después.
- No hay inicio de sesión ni control de permisos todavía. **No usar esta carpeta para almacenar material privado**.
- GitHub Pages ofrece archivos estáticos; no es una base de datos de cuentas ni un panel de publicación seguro.
- Se requieren HTTPS, permiso de cámara y un navegador compatible.
- Las animaciones y posiciones deben comprobarse sobre cuadros impresos reales.
- El rendimiento con muchas imágenes de referencia requiere pruebas en Android y iOS. Si el catálogo crece demasiado, se dividirán imágenes en grupos descargables.
- Los scripts A-Frame y MindAR se cargan desde CDN. Para una versión comercial estable se evaluará alojarlos de forma controlada.

## Publicación
Esta rama `desarrollo/multicuadros-ar-v2` no reemplaza el contenido de la rama `main`. La URL de GitHub Pages existente continúa publicando la aplicación actual. Para probar esta versión antes de fusionar, se necesitará desplegar una vista previa aislada o ejecutar localmente.

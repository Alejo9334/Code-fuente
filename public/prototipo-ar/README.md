# Visor-222 · Prototipo multimarcador (rama de desarrollo)

Esta versión está en la rama `desarrollo/multicuadros-ar-v2`. **No reemplaza ni publica sobre la rama `main`**.

## Primer cuadro del usuario: Minecraft Creeper Graffiti

El usuario proporcionó seis imágenes originales de **1638 × 2047 píxeles**:
- Archivos 1, 2, 3, 4 y 5: capas PNG con transparencia.
- Archivo 6: imagen final exacta que se imprimirá, usada como objetivo de seguimiento.
- Orden de profundidad, de atrás hacia delante: 5 → 4 → 3 → 2 → 1.
- La separación de profundidad inicial (`z`) es: 0.015, 0.030, 0.050, 0.075, 0.105.
- Cada capa tiene animación independiente (flotación o pulso discreto).

## Herramienta para incorporar el cuadro sin editar código

Abrir `crear-cuadro.html` desde el sitio de pruebas servido por HTTPS.

1. Seleccionar la **imagen 6** donde se indica «Imagen 6 · referencia exacta que se imprime».
2. Seleccionar las **imágenes 1 a 5** en sus controles correspondientes, manteniendo los PNG con transparencia.
3. Pulsar **Actualizar vista previa**.
4. Comprobar que la composición y el orden de capas son correctos.
5. Pulsar **Probar con la cámara**. El editor pasa el catálogo temporal al visor usando `sessionStorage`; el visor compila la imagen objetivo con MindAR y activa la cámara tras pulsar «Activar cámara».
6. Apuntar la cámara a una copia **impresa o mostrada en otra pantalla** de la imagen 6.

El navegador reduce las seis imágenes a un ancho de 768 px para la prueba; no modifica los archivos originales. No se envían a un servidor.

**Limitación deliberada:** la carga local no publica los PNG para otros clientes ni los almacena en GitHub. La publicación definitiva necesitará subir los archivos estáticos y precompilar un archivo `.mind` (o incorporar almacenamiento persistente y un editor privado).

## Archivos

- `index.html`: visor público de prueba con motor MindAR. Usa `catalogo.json` en modo normal, o el catálogo temporal del editor con `?local=1`.
- `crear-cuadro.html`: formulario de carga local, composición 2D y envío del catálogo al visor.
- `catalogo.json`: demostración preexistente, mientras el primer cuadro real se prueba localmente.

## Próximos hitos

- Verificar en Android y iPhone permisos de cámara, estabilidad del seguimiento y animaciones.
- Añadir una segunda y tercera imagen real al catálogo y probar reconocimiento multimarcador.
- Convertir las capas PNG y el archivo `.mind` a activos estáticos de producción.
- Construir administración con autenticación real y permisos del lado del servidor.
- Preparar vista previa HTTPS separada de la publicación pública actual.

GitHub Pages es hosting estático. Una rama de desarrollo no está alojada automáticamente en Pages; estas páginas necesitan una vista previa separada para probar la cámara.


## Editor visual de capas (nuevo)

Abrir `editor.html` en la vista previa HTTPS. Se carga directamente el catálogo existente con el cuadro Creeper y sus cinco PNG. Permite:

- Seleccionar capas, cambiar su posición X/Y, profundidad Z, escala, opacidad, visibilidad, rotación estática y orden fondo/frente.
- Elegir una animación independiente por capa: ninguna, flotar, pulso o girar; ajustar amplitud y duración.
- Ver una previsualización aproximada en 2D con las mismas imágenes PNG.
- Agregar capas PNG conservando su transparencia o cambiar la imagen física de referencia.
- Guardar un borrador en el navegador (`localStorage`), importar/exportar un JSON y probar la configuración en cámara mediante `sessionStorage`.

**La visualización 2D no reproduce exactamente la perspectiva AR:** los cambios de profundidad deben comprobarse con el visor desde el teléfono.

**Este no es todavía un panel administrativo seguro ni un sistema de publicación:** abrir `editor.html` no requiere iniciar sesión, los cambios no actualizan los archivos del repositorio ni se publican para los clientes. Nunca usarlo para subir contenido privado. El siguiente hito comercial será autenticación y almacenamiento persistente con permisos adecuados.

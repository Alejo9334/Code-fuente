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

## Probar ajustes del PC en el celular con QR

En `editor.html`, ajustar las capas originales del cuadro Creeper y pulsar **Probar en mi celular · QR**. Escanear el código o copiar el enlace desde el teléfono: se abre `index.html?share=...` con una configuración temporal que incluye orden, posición X/Y/Z, tamaño, rotación, opacidad, visibilidad y animaciones por capa.

La configuración viaja **en el propio enlace**; no necesita base de datos ni servicio de acortamiento. Las imágenes se cargan de las rutas estáticas publicadas en GitHub Pages, no se copian al QR. La URL no modifica el catálogo ni publica cambios para otros visitantes.

**Límites:** este QR solo comparte ajustes de las capas existentes del cuadro Creeper. Si se agrega una capa nueva o cambia la imagen objetivo usando un archivo local, hay que publicar primero esos archivos en el servidor. El enlace no es privado ni un sistema de autenticación: cualquiera que lo reciba puede abrir los parámetros de prueba. Un nuevo QR captura los ajustes del momento, no se actualiza en tiempo real si después editas más.

## Administrador local de múltiples cuadros (nuevo)

El editor visual (`editor.html`) ya incluye una lista de cuadros con **Nuevo cuadro**, **Duplicar**, **Eliminar** y controles para reordenarlos. Cada cuadro tiene un identificador propio, una imagen física de reconocimiento y capas PNG independientes con sus animaciones. Al seleccionar otro cuadro, cambia la composición y sus controles.

- **Nuevo cuadro:** solicita nombre, imagen final impresa y una o más capas PNG de igual relación de aspecto. Selecciona los PNG desde el fondo hacia el frente; todos quedan guardados en el proyecto como imágenes incrustadas, sin cargarse al servidor.
- **Duplicar:** solicita otra imagen final con la misma relación de aspecto y reutiliza las capas y su configuración. La nueva imagen debe tener características visuales distintas para evitar que MindAR confunda dos referencias.
- **Editar:** cambia nombre, capas, sus propiedades y el orden de cuadros; los índices `targetIndex` se recalculan a partir de la lista.
- **Guardar/importar/exportar:** el JSON contiene el catálogo completo. Los archivos binarios nuevos van incrustados como `data:` para que puedan ser importados en otro dispositivo. Puede ocupar bastante espacio.
- **Probar en cámara AR:** guarda temporalmente el proyecto completo en IndexedDB (con respaldo de `sessionStorage`) y abre el visor con todos los cuadros. El motor MindAR compila los múltiples objetivos en una sola sesión y reconoce uno a la vez. La calidad de seguimiento de nuevos cuadros requiere pruebas físicas.
- **Prueba por QR:** sigue disponible para las cinco capas ya publicadas del cuadro Creeper. Los PNG y referencias locales nuevos *no* pueden transferirse en un QR: para probarlos en otro dispositivo, envía e importa el proyecto JSON o publica primero las imágenes en GitHub.

La lista de cuadros es **un administrador local de prototipo**, todavía no una biblioteca sincronizada ni un panel con control de acceso. Los cambios no alteran `main` ni la publicación comercial. Para usar nuevas imágenes con clientes, habrá que añadir almacenamiento, compilación y publicación persistente seguros.

**Importante:** los PNG que se importan desde archivos pueden superar la cuota del navegador. Exporta el JSON con frecuencia; no confíes solo en el almacenamiento local.

## Autenticación privada del administrador (requiere activación con Supabase)

Se incorporaron `login.html`, `auth-config.js`, `admin-auth.js` y `supabase-admin.sql`. **El editor está bloqueado por defecto y el visor AR público permanece disponible.** No hay contraseñas incrustadas en HTML.

### Pasos para activar

1. Crea un proyecto en [Supabase](https://supabase.com/dashboard) con una contraseña segura para tu cuenta.
2. Abre **SQL Editor** y ejecuta `supabase-admin.sql`. Esto crea las tablas `visor222_admins` y `visor222_admin_projects` con Row Level Security (RLS).
3. En **Authentication → Settings** o en la configuración de Auth, desactiva **Allow new users to sign up**. Así solo podrán entrar cuentas creadas o invitadas por ti.
4. En **Authentication → Users**, crea tu usuario administrador con correo y contraseña (o invita al usuario y completa la confirmación). Copia su **User UID**.
5. En Supabase **SQL Editor**, ejecuta: `insert into public.visor222_admins(user_id) values ('UUID-REAL-DE-TU-CUENTA');` sustituyendo el UUID. Solo tú, con acceso a la consola, puedes otorgar ese permiso.
6. En **Project Settings → API Keys / Data API**, copia únicamente la **Project URL** y la clave pública **publishable** (o legacy **anon**).
7. En la rama de desarrollo cambia exclusivamente `public/prototipo-ar/auth-config.js`, colocando esos dos valores públicos. **NUNCA** compartas ni incluyas una `service_role` o `secret key`, tu contraseña o tokens privados.
8. Publica nuevamente Visor-222 Preview y abre `login.html`. Ingresa con el administrador autorizado.

El editor verifica la sesión con `getUser()` y consulta la tabla `visor222_admins`; sólo un administrador autorizado puede utilizar los controles de edición y realizar lecturas/escrituras de `visor222_admin_projects`. Los datos de proyectos guardados en la nube están protegidos **en Supabase** mediante políticas RLS, no por una contraseña del navegador. Un proyecto se guarda/carga desde los botones «Guardar en nube privada» y «Cargar desde nube».

**Limitación de GitHub Pages:** cualquier persona puede descargar el código HTML, CSS y JavaScript publicados e incluso los recursos PNG públicos. La interfaz solo aparece después de verificar la cuenta, pero esto **no** es un servidor web privado ni oculta los recursos estáticos. La protección efectiva es para las operaciones y los datos guardados en Supabase. Los clientes siguen entrando a `index.html` sin autenticarse.

**Estado actual:** sin la URL y clave pública de tu propio proyecto Supabase, `login.html` mostrará «autenticación no configurada», no permitirá iniciar sesión y `editor.html` redirigirá al login. Es intencional: no se habilita ninguna contraseña ficticia o alternativa insegura.

En producción considera habilitar MFA, una política de contraseñas fuerte, recuperación de cuenta con SMTP propio y un dominio privado con control de acceso perimetral para evitar que el HTML del editor pueda descargarse.

## Siguiente etapa: publicación controlada de cuadros (sin Supabase)

Se añadió el convertidor `scripts/preparar-publicacion-ar.mjs` y el flujo `.github/workflows/publicar-cuadros-desarrollo.yml`. Ambos operan **exclusivamente en la rama** `desarrollo/multicuadros-ar-v2`, sin publicar ni fusionar cambios en `main`.

### Procedimiento para publicar nuevos cuadros en Preview

1. En el editor (cuando se haya configurado el acceso), crea o importa tus cuadros y pulsa «Descargar proyecto JSON». Si todavía no está configurada la autenticación, conserva el JSON exportado previamente.
2. **Ten en cuenta la privacidad:** este repositorio es público; subir el JSON significa publicar tanto los nombres como las imágenes incrustadas. No subas fotos privadas ni datos sensibles.
3. En GitHub, selecciona la rama `desarrollo/multicuadros-ar-v2`. Crea o reemplaza el archivo `proyectos/por-publicar.json` con el contenido del JSON exportado. Este nombre activa el flujo de publicación de desarrollo.
4. La acción automatizada valida los cuadros, extrae las imágenes incrustadas como archivos PNG/JPG en `public/prototipo-ar/cuadros/<id>/`, asigna índices de reconocimiento consecutivos y actualiza `public/prototipo-ar/catalogo.json`.
5. Si la validación falla, GitHub Actions mostrará el error y **no** confirmará cambios. Si pasa, los archivos se guardan únicamente en la rama de desarrollo.
6. El repositorio `Visor-222-preview` se sincroniza desde esta rama cada 15 minutos aproximadamente (las acciones programadas de GitHub pueden retrasarse). El resultado queda disponible en `https://alejo9334.github.io/Visor-222-preview/`.
7. Prueba desde el celular que los distintos cuadros se reconozcan y que las capas correspondan a cada obra. No fusionar a `main` sin esta prueba física.

### Revisión local sin publicar

```bash
node scripts/preparar-publicacion-ar.mjs proyectos/ejemplo-publicacion.json
```

Esto crea `tmp/ar-publicacion-revision/` con un catálogo y los PNG preparados, sin modificar los originales. Para una publicación controlada desde un runner de CI:

```bash
node scripts/preparar-publicacion-ar.mjs proyectos/por-publicar.json --apply
```

### Límites actuales

- El flujo publica archivos estáticos y no depende de Supabase, pero **no es todavía un botón de publicación directa dentro del editor**. Requiere subir el archivo JSON a GitHub con permisos de escritura.
- Los cambios del catálogo publicado son visibles para cualquiera que visite Preview. No uses el repositorio público para contenidos privados o borradores sensibles.
- Hay límites de 30 cuadros, 15 capas por cuadro, JSON de 24 MB y 8 MB por archivo incrustado. Las capas deben ser PNG.
- El motor MindAR compila el reconocimiento en el navegador. El rendimiento, los tiempos de compilación y la precisión con varios cuadros físicos deben comprobarse en dispositivos reales. Posteriormente se puede incorporar compilación previa en `.mind`.

## Optimización de reconocimiento de imágenes (MindAR .mind)

El reconocimiento del catálogo publicado usa **`targets.mind` compilado previamente en GitHub Actions**, en lugar de extraer características de imágenes dentro del celular en cada visita. La documentación oficial de MindAR recomienda preprocesar las imágenes objetivo antes de cargar la aplicación.

- Script offline: `scripts/compilar-objetivos-ar.mjs` (MindAR `OfflineCompiler`, Node.js + `canvas`). Conserva el orden de `targetIndex` de todos los cuadros, reescala referencias grandes a un máximo de 1200 px y guarda `targets.mind` junto a `catalogo.json`.
- CI: `.github/workflows/compilar-ar.yml` compila y confirma `.mind` solo en `desarrollo/multicuadros-ar-v2`; su ejecución puede iniciarse manualmente desde **Actions**.
- Publicación: `.github/workflows/publicar-cuadros-desarrollo.yml` genera `targets.mind` tras extraer los PNG y antes de confirmar el catálogo, para evitar desfases.
- Visor: al abrir `index.html` comprueba que `archivoMind` esté disponible y carga esos datos precompilados. Si faltan, intenta el compilador local de respaldo.
- Recursos: en catálogos con varios cuadros se descargan inicialmente únicamente los PNG del primer cuadro; las demás capas se solicitan cuando el cuadro correspondiente es reconocido. Esto evita una descarga masiva inicial.
- Editor: si se agregan/eliminan/reordenan cuadros o cambia la imagen física, descarta el `.mind` anterior del borrador y recompila localmente durante la prueba AR.

La primera compilación de prueba generó el objetivo Creeper en un archivo de ~484 KB. El tiempo real de apertura del visor depende del dispositivo, la red y el número de objetivos; la reducción aún requiere medición en celulares. No se ha cambiado `main` ni la aplicación comercial.

## Optimización automática de capas PNG (nuevo)

El sistema genera versiones **WebP con transparencia** de las capas PNG al publicar el catálogo o regenerar el reconocimiento. Los PNG originales permanecen intactos para poder recuperar calidad, editar o exportar.

- Script: `scripts/optimizar-imagenes-ar.mjs` (se ejecuta en GitHub Actions con `sharp`, sin instalar nada en el celular).
- Prueba primero WebP **sin pérdida** y WebP de calidad **93/100** con máscara alpha de calidad 100. Prefiere la versión totalmente sin pérdida si pesa como máximo 15 % más que la de calidad alta.
- Solo usa el archivo nuevo si ahorra como mínimo 5 %. Verifica que conserve dimensiones y presencia del canal alpha.
- Actualiza las rutas `imagen` de las capas en `catalogo.json` con `.optimized.webp` y mantiene los PNG originales al lado. Las imágenes usadas para reconocer la obra **no** se modifican.
- Genera `public/prototipo-ar/optimizacion-imagenes.json` con el ahorro por capa y el ahorro acumulado; vuelve a utilizar estos datos en ejecuciones posteriores sin perder las estadísticas.
- El visor ya admite las texturas optimizadas mediante Three.js. La preparación de nuevos cuadros desde `proyectos/por-publicar.json` incorpora la misma optimización automáticamente, antes de compilar `targets.mind`.
- Las optimizaciones se ejecutan **únicamente en la rama de desarrollo**, con publicación en `Visor-222-preview`. La versión principal no se altera.

**Primera medición con Minecraft:** cinco PNG originales ~4,08 MB → cinco WebP ~1,15 MB (**71,7 % menos bytes**), manteniendo 2200 × 2750 píxeles y transparencia. El ancho de banda real de una sesión puede variar por caché y conexión.

**Importante:** algunas capas utilizan compresión de calidad 93 (con pequeñas diferencias de color posibles). Si una obra exige fidelidad cromática pixel a pixel, configura el script para elegir siempre WebP sin pérdida o conserva PNG. Comprueba visualmente los resultados en dispositivos reales antes de publicar a clientes.

## Experiencia visual inmersiva para clientes

Se incorporaron tres efectos exclusivamente en el visor público de desarrollo:

1. **Confirmación de reconocimiento:** al recibir `targetFound` se ilumina brevemente una guía central azul con el mensaje «Imagen reconocida». Es una confirmación visual en pantalla, no un contorno que siga exactamente la silueta del objeto.
2. **Entrada cinematográfica de capas:** una vez cargadas las texturas, cada capa aparece de fondo a frente con una breve transición de escala, acercamiento en profundidad y opacidad. La animación se aplica a un elemento padre independiente, conservando las animaciones individuales existentes. Se cancela al perder el objetivo y puede reproducirse al reencontrarlo.
3. **Vista inmersiva:** botón «Pantalla completa» en la cámara. Si el navegador permite la Fullscreen API, se solicita pantalla completa; de lo contrario, se ocultan elementos secundarios y se mantiene el video AR ocupando todo el viewport. El botón «Cerrar cámara» permanece accesible.

Las personas con la opción «reducir movimiento» habilitada reciben una confirmación estática y el contenido AR aparece sin transición. La experiencia no introduce sonidos ni cambia las referencias de MindAR, el archivo .mind o el comportamiento de los PNG del catálogo.

Verificar en Android/iPhone real la disponibilidad de pantalla completa, la estabilidad del seguimiento y la transición de capas. Todo está publicado primero en Preview; la rama principal permanece intacta.

## Panel para preparar nuevas imágenes AR sin organizar carpetas

Abre `preparar-imagen.html` desde Preview. Puedes elegir una **imagen física de referencia** (PNG/JPG), subir hasta **15 capas PNG**, reordenarlas de fondo a frente y ajustar profundidad, amplitud de animación y opacidad. El panel empaqueta las imágenes en un único JSON `<id>-<fecha>.json` directamente en el navegador y no transmite contraseñas ni tokens.

**Publicación segura en dos pasos:**
1. Descarga el JSON desde el panel y usa el enlace «Abrir GitHub para subir el archivo».
2. Inicia sesión en GitHub y sube el archivo a `proyectos/pendientes/` de la rama `desarrollo/multicuadros-ar-v2`; confirma el commit. Cada archivo tiene nombre único, no requiere editar JSON ni organizar carpetas.
3. El flujo `.github/workflows/publicar-cuadros-desarrollo.yml` detecta el archivo, incorpora los nuevos cuadros al catálogo sin borrar los anteriores (`--apply --append`), extrae los archivos incrustados a `public/prototipo-ar/cuadros/<id>/`, optimiza PNG a WebP y genera el nuevo `targets.mind`.
4. El repositorio de Preview recoge los cambios de la rama de desarrollo con su flujo periódico o manual. El usuario debe comprobar el visor desde un celular antes de promocionar una imagen nueva.

**Limitaciones actuales:** el panel **no puede subir directamente a GitHub** sin un sistema de autenticación seguro. Requiere que el dueño confirme la subida en GitHub. No se deben pegar tokens personales de acceso en la página. Cuando se configure el administrador con backend seguro, se podrá ofrecer publicación directa de un clic. Este preparador es público, aunque no publica nada por sí mismo; las imágenes que se suban al repositorio público son accesibles para cualquiera. No se modifica la rama `main`.

## Acceso a editores en modo local (sin Supabase)

En la rama de desarrollo el **editor visual** (`editor.html`) está habilitado sin inicio de sesión. Los proyectos y cambios se guardan en el almacenamiento local del navegador; también se pueden importar y exportar como JSON. Se conservaron las pruebas con cámara AR y los enlaces QR. La antigua página `login.html` informa que el inicio de sesión quedó desactivado y redirige al editor.

Los botones de guardar/cargar proyectos en **nube privada** se retiraron del editor, y no se importa ni ejecuta `admin-auth.js` ni el cliente Supabase desde él. Los archivos de configuración e infraestructura de Supabase permanecen en el repositorio, sin activar, por si se decide implementar autenticación en el futuro.

- **Cliente:** recibe únicamente la URL `index.html` (o la raíz de Preview), sin cuenta.
- **Edición local:** utiliza `editor.html` y/o `preparar-imagen.html`, sin cuenta.
- **Publicación:** el operador debe entrar a GitHub con permisos de escritura y subir el archivo de proyecto a `proyectos/pendientes/`, para activar el flujo automático en la rama de desarrollo.

**No confundir un enlace no divulgado con acceso privado:** los editores se alojan en GitHub Pages y cualquier persona que conozca su URL puede abrirlos y preparar sus propios borradores en su dispositivo. No pueden modificar el catálogo publicado sin credenciales autorizadas de GitHub. No subir contenido privado a GitHub Pages ni al repositorio público.

La rama principal de Visor-222 permanece sin cambios.

## Panel unificado de creación, edición y publicación (Preview)

Ahora `editor.html` contiene todas las funciones que antes estaban repartidas entre `editor.html` y `preparar-imagen.html`:

- **Crear** cuadros AR con imagen de referencia y varias capas PNG.
- **Ajustar** tamaño, posición, orden, opacidad, profundidad y animaciones de cada capa.
- **Agregar** varias capas PNG en una sola selección.
- **Guardar** borradores locales o exportar el catálogo como JSON de respaldo.
- **Preparar publicación en GitHub** del cuadro seleccionado: comprueba que su ID todavía no esté publicado, obtiene sus imágenes, restaura PNG transparente a partir de capas WebP cuando es necesario, valida parámetros y genera un JSON con la imagen y las capas incrustadas para subir a `proyectos/pendientes/` del repositorio de desarrollo.

La publicación final sigue requiriendo confirmar manualmente el commit desde una cuenta de GitHub con permisos de escritura. El flujo de GitHub organiza los archivos, optimiza imágenes y recompila el reconocimiento. No se usan credenciales de publicación en el navegador. La ruta antigua `preparar-imagen.html` redirige al nuevo editor. El cliente recibe **exclusivamente** `index.html`.

**Precaución:** esta publicación automatizada es de **alta de nuevos cuadros**. Si un cuadro ya existe en `catalogo.json`, el editor bloquea el intento de agregarlo de nuevo, evitando sobreescritura involuntaria. Las actualizaciones de cuadros existentes necesitan un flujo de edición/publicación dedicado más adelante. Todos los editores en GitHub Pages son accesibles a quien conozca la URL; no son privados.

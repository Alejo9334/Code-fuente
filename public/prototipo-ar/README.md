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

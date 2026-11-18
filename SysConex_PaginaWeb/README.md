# SysConex — Proyecto web final

## Cómo abrir la página
1. Abre esta carpeta en Visual Studio Code.
2. Ejecuta `index.html` con Live Server.
3. Comprueba la portada, servicios y el panel «Mi solicitud» en computadora y celular.

## Archivos principales
- `index.html`: estructura, textos, menú, portada y secciones.
- `css/style.css`: estilos, paleta de colores y diseño adaptable.
- `js/app.js`: servicios, subservicios, selección y WhatsApp.
- `js/config.js`: número de WhatsApp y configuración pública de Supabase.
- `assets/Portada.mp4`: video de fondo **sin pista de audio**.
- `assets/`: fotografías e imágenes de la página.
- `supabase.sql` y `supabase_subservicios.sql`: creación y lectura de tablas (úsalos solo si necesitas configurar la base de datos; no ejecutes scripts de inserción nuevamente sobre datos reales sin revisarlos).

## Video de portada
El archivo `assets/Portada.mp4` se ha procesado para quitarle la pista de audio. Se reproduce automáticamente, en bucle y sin controles. El elemento `<video>` está en `index.html` y su tamaño y oscurecimiento se controlan al final de `css/style.css`, en la sección **PORTADA FINAL — VIDEO SILENCIOSO**.

Para reemplazarlo en el futuro, conserva el nombre `Portada.mp4`. Conviene quitarle el audio antes de subirlo; el atributo `muted` además asegura reproducción silenciosa en el navegador.

## Personalización rápida
- Nombre/logo: bloque `.brand` de `index.html`.
- Textos de la portada: bloque `.hero-copy` de `index.html`.
- Imagen/video de portada: `assets/Portada.mp4`.
- Colores y dimensiones: `css/style.css`.
- Servicios de demostración: `DEMO_SERVICES` en `js/app.js`.
- Datos reales: tablas de Supabase, una vez configuradas las credenciales públicas.
- WhatsApp: `js/config.js`.

## Nota de funcionamiento
El envío por WhatsApp abre un mensaje prellenado; el cliente confirma el envío en la aplicación. La base de datos sirve para administrar el catálogo, no para cobrar automáticamente.

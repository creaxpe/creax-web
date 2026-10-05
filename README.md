# Web de CreaX · borrador

Borrador de la web de CreaX para revisión del equipo. No es la versión publicada:
las páginas llevan `noindex`, así que no aparecen en buscadores.

**Verla en línea:** https://creaxpe.github.io/creax-web/

## Páginas

| Página | Qué tiene |
|---|---|
| `index.html` | Portada con la escena (web + WhatsApp), resultados y las tres líneas de trabajo |
| `servicios.html` | Tipos de web, selector "¿cuál le toca?", tabla comparativa y condiciones |
| `automatizaciones.html` | Flujo de n8n interactivo por rubro, integraciones y casos por rubro |
| `bocetos.html` | Cómo se hace el boceto y los tres ejemplos, recorribles |
| `nosotros.html` | Los cuatro socios, compromisos y el proceso de un proyecto |

Los tres ejemplos (`assets/ejemplos/`: repostería, clínica dental y gimnasio) son negocios de muestra, no clientes.
Están hechos a mano y cada uno tiene su propio estilo de diseño (editorial, limpio y oscuro), para mostrar variedad.
Sus fotos son libres (CC0); los créditos están en cada carpeta `fotos/CREDITOS.txt`.

Las cuatro páginas internas abren con una **cabecera viva**: la palabra clave del título en un bloque de tinta
y, al lado, un dibujo que se mueve para explicar la página (la ventana que arma los cuatro niveles de web,
el flujo que recorre un mensaje, la página que se dibuja a lápiz en tres estilos y los cuatro socios como
los bloques del logo). El dibujo es SVG dentro de cada página, sus estilos están al final de `estilos.css`
("CABECERAS VIVAS") y su movimiento en la sección 17 de `animacion.js`. Sin movimiento queda quieto.
Los íconos que van dentro de esos dibujos se escriben por su código; por eso cada página los nombra en un
comentario justo antes del dibujo, para que `aligerar.py` no los saque de la fuente.

## Pendiente

- Datos de contacto reales: Instagram y LinkedIn (marcados con `<!-- CONTACTO -->` en cada página). El WhatsApp ya es el de Juan Diego y el correo es admin@creax.net.pe (desde el 01/10/2026).
- Quitar el `noindex` cuando se publique como web oficial, con el dominio propio.

## Cómo se trabaja

Es HTML, CSS y JavaScript sin compilación: se abre `index.html` en el navegador.
Estilos en `estilos.css`, movimiento e interacción en `animacion.js` (usa anime.js, copiado en `assets/`).
`capturas.js` saca las capturas de los tres ejemplos que usan la portada y Bocetos: con la web servida en local
(`python -m http.server 8094`), se corre `node capturas.js`. Si se cambia un ejemplo, se vuelve a correr.

Cada vez que se publica, se cambia el número `?v=` de `estilos.css`, `animacion.js`, `inicio.js` e `iconos.css` en las ocho páginas (las cinco, privacidad, términos y 404):
así el navegador de quien entra baja los estilos nuevos en vez de usar los que tenía guardados.

## Seguridad

La web es estática. El borrador lo sirve GitHub Pages y la oficial, Hostinger (creax.net.pe), donde corre un
solo archivo PHP: `contacto.php`, que manda el formulario por correo. No hay base de datos, cuentas ni
contraseñas. El repositorio es público: todo lo que se sube, se ve.

- **Secretos:** ninguna clave, token ni contraseña va en este repositorio. El `.gitignore`
  bloquea `.env`, `*.key`, `*.pem` y `*-token.txt`.
- **Política de seguridad de contenido (CSP)** en el `<head>` de las cinco páginas:
  - solo se cargan archivos del propio sitio;
  - no corren scripts escritos dentro del HTML: todo el JavaScript va en `inicio.js`
    (lo primero, en el `<head>`) o en `animacion.js`;
  - no se permiten iframes ni plugins, y los formularios no se envían solos (`form-action 'none'`): el de
    correo lo manda `animacion.js` con `fetch` a `contacto.php`, del mismo sitio (`connect-src 'self'`).
- **Si algún día se carga algo de afuera** (fuentes, un video, un formulario), hay que
  agregar ese dominio a la CSP de las cinco páginas. Si no, no carga.
- **Contenido dinámico:** se arma con elementos del DOM y `textContent`, nunca con
  `innerHTML` y datos.
- **Almacenamiento en el navegador:** `creax-intro` en `sessionStorage`, para no repetir la
  intro; `creax-transicion`, también en `sessionStorage`, con el nombre de la página a la que se va
  (se borra al llegar); y `creax-cookies` en `localStorage`, con la elección del aviso de cookies. Ninguna
  cookie. Nunca datos personales ni tokens.
- **HTTPS:** GitHub Pages lo fuerza; además `inicio.js` pasa a `https` si alguien entra por `http`.
- **Enlaces que abren pestaña nueva:** siempre con `rel="noopener"`.
- **Encabezados HTTP** que GitHub Pages no permite poner (`frame-ancestors`, `X-Content-Type-Options`,
  `Strict-Transport-Security`): van en el `.htaccess` de Hostinger, que arma `preparar-hostinger.py`.

## Lanzamiento (30/09/2026)

- **Páginas legales:** `privacidad.html` y `terminos.html`, enlazadas desde el pie. Los datos de la
  empresa (razón social, RUC, domicilio) se completan cuando esté constituida. Conviene que un abogado
  las revise antes de la web oficial.
- **Aviso de cookies:** lo arma `animacion.js` (5d). La web no usa cookies; el aviso lo explica y guarda
  la elección. «Cookies», en el pie, lo vuelve a abrir. No sale con `?estatico`.
- **Tarjeta «Cuéntanos de tu proyecto»** (portada): desde el 01/10/2026 es el formulario «Contáctanos por mail»
  (ver abajo); «Prefiero WhatsApp» sigue armando el mensaje y lo abre en el WhatsApp de la persona.
- **Buscadores y redes:** cada página tiene título, descripción y etiquetas Open Graph y Twitter, con
  `assets/social.png` (1200×630). Hay `sitemap.xml`, `robots.txt`, `site.webmanifest` e íconos
  (`favicon-32.png`, `apple-touch-icon.png`, `icono-192.png`, `icono-512.png`).
- **Página 404:** `404.html` lleva `<base href="/creax-web/">` para funcionar desde cualquier dirección.
- **Velocidad:** las fuentes van en WOFF2 y solo con los caracteres del español, y los íconos, solo los
  que se usan. **Si se agrega un ícono nuevo, correr `python aligerar.py`** (si no, no se ve).
- **Publicar en creax.net.pe (Hostinger, desde el 01/10/2026):** `python preparar-hostinger.py` arma la
  carpeta `CreaX/Subir a Hostinger - creax.net.pe/`, con solo lo que la web usa (sin scripts, README,
  `node_modules`, fuentes TTF ni la hoja completa de íconos). Solo en esa copia:
  - quita el `noindex` de las páginas (los ejemplos y la 404 lo conservan);
  - cambia la dirección de GitHub por `https://creax.net.pe/` en Open Graph, `sitemap.xml` y `robots.txt`,
    y agrega la dirección canónica de cada página;
  - pasa la 404 a la raíz (`<base href="/">`);
  - agrega el `.htaccess`: HTTPS y sin www, `ErrorDocument 404`, sin listado de carpetas, encabezados de
    seguridad (HSTS de 180 días, `nosniff`, `frame-ancestors 'none'`, `Referrer-Policy`,
    `Permissions-Policy`) y caché (las páginas se revisan siempre; CSS y JS con `?v=`, un año).

  Para subirla: SSL activo en Hostinger y se sube el ZIP que el script deja al lado de la carpeta
  (`Subir a Hostinger - creax.net.pe.zip`, con todo en su raíz): los cargadores de Hostinger solo aceptan
  comprimidos. Si queda un `default.php` de Hostinger en `public_html`, se borra. Esa carpeta no se
  edita a mano: si cambia la web, se vuelve a correr el script y se sube de nuevo. Este repositorio sigue
  siendo el borrador de GitHub Pages, con su `noindex`, para revisar cambios antes de subirlos.
- **Analítica:** pendiente de elegir proveedor. Si usa cookies, se carga solo cuando la persona acepta
  en el aviso (`creax-cookies` = `todas`), y hay que sumar su dominio a la CSP.

## Formulario de correo y cambio de página (01/10/2026)

- **«Contáctanos por mail»** (portada, `#contacto`): pide nombre, empresa, a qué se dedica, celular, correo,
  qué le interesa (incluye «Referencias y más información») y sus ideas, con la casilla de la política de
  privacidad. A la izquierda, una vista del correo se escribe sola mientras la persona llena el formulario.
  - Lo envía `contacto.php` con la función `mail()` de Hostinger a **admin@creax.net.pe**, con «Responder a»
    el correo de la persona y su enlace de WhatsApp. No guarda nada en el servidor ni usa claves.
  - Antispam: campo trampa, tiempo mínimo en la página, solo peticiones desde creax.net.pe y cinco envíos por
    hora por conexión.
  - **Solo funciona en creax.net.pe** (GitHub Pages no corre PHP): en el borrador el formulario avisa que no
    pudo enviarlo y ofrece abrir el mensaje en el correo de la persona o mandarlo por WhatsApp.
  - Si un día `mail()` falla en Hostinger, el plan B es enviar por SMTP con la clave del buzón guardada en el
    servidor, nunca en este repositorio.
- **Cambio de página** (idea del portafolio de fraxbit.com): al ir a otra página de la web sube una cortina de
  tinta con el color del destino en el borde, el logo se enciende como en la intro y el nombre del destino se
  descifra al centro. La salida está en `animacion.js` (sección 18); la llegada la pone `inicio.js` desde el
  primer cuadro y la levanta el CSS (`html.con-transicion`). Al volver con «atrás» la página se descubre con su
  propio nombre. Las anclas de la misma página, los enlaces externos y los que abren pestaña nueva no la
  usan, y con menos movimiento no hay cortina. Los nombres y colores de cada página están en
  `CREAX_PAGINAS`, en `inicio.js`.

# -*- coding: utf-8 -*-
"""
preparar-hostinger.py · arma la carpeta lista para subir la web a creax.net.pe (Hostinger).

Copia solo lo que la web usa de verdad: sigue los enlaces desde las ocho páginas y se queda
con sus estilos, scripts, imágenes, fuentes e íconos, y con las páginas de ejemplo y sus fotos.
Deja afuera lo que es para trabajar: scripts, README, node_modules, fuentes TTF y la hoja
completa de íconos.

Solo en la copia (el repositorio sigue siendo el borrador de GitHub Pages) hace los cambios
del día del dominio:
  - quita el noindex de las páginas (los ejemplos y la 404 lo conservan);
  - cambia la dirección de GitHub por https://creax.net.pe/ en las etiquetas para redes,
    el sitemap y el robots, y agrega la dirección canónica de cada página;
  - la 404 toma sus archivos desde la raíz ("/");
  - agrega el .htaccess: HTTPS, sin www, página 404, encabezados de seguridad y caché.

Uso: python preparar-hostinger.py
Crea en la raíz de CreaX la carpeta "Subir a Hostinger - creax.net.pe" y, al lado, el mismo
contenido en un ZIP: es lo que piden los cargadores de Hostinger (solo aceptan comprimidos).
Se vuelve a correr cada vez que cambie la web; la carpeta anterior pasa a CreaX-version-anterior.
"""
import io
import re
import shutil
import sys
import tempfile
import zipfile
from pathlib import Path
from urllib.parse import unquote

PROYECTO = Path(__file__).resolve().parent.parent          # la carpeta Web
WEB = PROYECTO / "sitio"                                    # lo que se publica
SALIDA = Path(tempfile.gettempdir()) / "creax-subir-a-hostinger"
ZIP = PROYECTO / "Subir a Hostinger - creax.net.pe.zip"
DOMINIO = "https://creax.net.pe/"
BORRADOR = "https://creaxpe.github.io/creax-web/"

PAGINAS = ["index.html", "servicios.html", "automatizaciones.html", "bocetos.html", "nosotros.html",
           "privacidad.html", "terminos.html", "404.html"]
OTROS = ["robots.txt", "sitemap.xml", "site.webmanifest", "contacto.php"]   # contacto.php: el formulario de correo
NUNCA = {"node_modules", ".git", "README.md", "aligerar.py", "capturas.js", "preparar-hostinger.py",
         "package.json", "package-lock.json", ".gitignore", ".nojekyll"}

REFERENCIAS = [
    re.compile(r"""\b(?:src|href|poster)\s*=\s*["']([^"']+)["']""", re.I),
    re.compile(r"""url\(\s*["']?([^"')]+)["']?\s*\)""", re.I),
    re.compile(r'''"src"\s*:\s*"([^"]+)"'''),
]
SRCSET = re.compile(r"""\bsrcset\s*=\s*["']([^"']+)["']""", re.I)

HTACCESS = r"""# .htaccess de creax.net.pe (Hostinger). Lo arma preparar-hostinger.py: si se cambia acá, se pierde.

# Siempre por HTTPS y sin "www"
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTP_HOST} ^www\.creax\.net\.pe$ [NC]
  RewriteRule ^(.*)$ https://creax.net.pe/$1 [L,R=301]
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>

# La página propia para lo que no existe, y sin listado de carpetas
ErrorDocument 404 /404.html
Options -Indexes

# Encabezados de seguridad (los que GitHub Pages no dejaba poner)
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=15552000"
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "DENY"
  Header always set Content-Security-Policy "frame-ancestors 'none'"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
</IfModule>

# Caché: las páginas se revisan siempre; estilos y scripts llevan ?v= y se guardan un año
AddType font/woff2 .woff2
AddType application/manifest+json .webmanifest
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresDefault "access plus 1 day"
  ExpiresByType text/html "access plus 0 seconds"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType text/javascript "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 week"
  ExpiresByType image/png "access plus 1 week"
  ExpiresByType image/jpeg "access plus 1 week"
</IfModule>

# Comprimir lo que es texto
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript image/svg+xml application/manifest+json application/xml text/plain
</IfModule>
"""

ROBOTS = f"""# robots.txt de CreaX
User-agent: *
Allow: /

Sitemap: {DOMINIO}sitemap.xml
"""


def leer(ruta):
    return io.open(ruta, encoding="utf-8").read()


def escribir(ruta, texto):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    io.open(ruta, "w", encoding="utf-8", newline="\n").write(texto)


def local(ref, desde):
    """La ruta del archivo del sitio al que apunta una referencia, o None si es externa."""
    ref = unquote(ref.strip())
    if not ref or ref.startswith(("#", "data:", "mailto:", "tel:", "javascript:", "http:", "https:", "//")):
        return None
    ref = ref.split("#")[0].split("?")[0]
    if ref.startswith("/creax-web/"):                  # la 404 del borrador usa rutas de GitHub Pages
        ref = ref[len("/creax-web/"):]
    if not ref or ref == "/":
        return WEB / "index.html"
    base = WEB if (ref.startswith("/") or desde == WEB / "404.html") else desde.parent
    return (base / ref.lstrip("/")).resolve()


def referencias(archivo):
    texto = leer(archivo)
    encontradas = [m for patron in REFERENCIAS for m in patron.findall(texto)]
    for grupo in SRCSET.findall(texto):
        encontradas += [parte.strip().split(" ")[0] for parte in grupo.split(",")]
    return encontradas


def recorrer():
    """Sigue los enlaces desde las páginas y devuelve los archivos que la web usa."""
    pendientes = [WEB / nombre for nombre in PAGINAS + OTROS]
    usados, rotos = set(), []
    while pendientes:
        archivo = pendientes.pop()
        if archivo in usados:
            continue
        usados.add(archivo)
        if archivo.suffix not in (".html", ".css", ".webmanifest"):
            continue
        for ref in referencias(archivo):
            ruta = local(ref, archivo)
            if ruta is None:
                continue
            if WEB not in ruta.parents or not ruta.is_file():
                rotos.append(f"{archivo.relative_to(WEB)} -> {ref}")
                continue
            pendientes.append(ruta)
    # los créditos de las fotos y las licencias de las fuentes acompañan a sus archivos
    usados |= set((WEB / "assets" / "ejemplos").rglob("CREDITOS.txt"))
    usados |= set((WEB / "assets" / "ejemplos").rglob("LICENCIAS.txt"))
    return usados, rotos


def para_el_dominio(nombre, texto):
    """Los cambios del día del dominio, solo en la copia."""
    texto = texto.replace(BORRADOR, DOMINIO).replace('"/creax-web/', '"/')
    if nombre == "404.html":
        texto = re.sub(r'<base href="/">[^\n]*', '<base href="/">', texto)
        texto = re.sub(r'<meta name="robots"[^>]*>[^\n]*', '<meta name="robots" content="noindex">', texto)
        return texto
    texto, quitados = re.subn(r'[ \t]*<meta name="robots"[^>]*>[^\n]*\n', "", texto)
    assert quitados == 1, f"{nombre}: no encontré el noindex"
    texto, puestos = re.subn(r'(<meta property="og:url" content="([^"]+)">)', r'\1\n<link rel="canonical" href="\2">', texto)
    assert puestos == 1, f"{nombre}: no encontré og:url"
    return texto


def main():
    usados, rotos = recorrer()
    if rotos:
        sys.exit("Hay enlaces a archivos que no existen; arréglalos antes de subir:\n  " + "\n  ".join(rotos))
    for ruta in usados:
        partes = set(ruta.relative_to(WEB).parts)
        if partes & NUNCA or ruta.suffix.lower() == ".ttf":
            sys.exit(f"Se iba a copiar algo que no va a internet: {ruta.relative_to(WEB)}")

    if SALIDA.exists():                                  # se arma de cero en el temporal; solo queda el ZIP
        shutil.rmtree(SALIDA)

    for ruta in sorted(usados):
        rel = ruta.relative_to(WEB)
        destino = SALIDA / rel
        nombre = rel.as_posix()
        if nombre in PAGINAS:
            escribir(destino, para_el_dominio(nombre, leer(ruta)))
        elif nombre == "robots.txt":
            escribir(destino, ROBOTS)
        elif nombre == "sitemap.xml":
            escribir(destino, leer(ruta).replace(BORRADOR, DOMINIO))
        else:
            destino.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(ruta, destino)
    escribir(SALIDA / ".htaccess", HTACCESS)

    # revisión de la copia
    for nombre in PAGINAS + ["sitemap.xml", "robots.txt"]:
        texto = leer(SALIDA / nombre)
        assert "github.io" not in texto and "/creax-web/" not in texto, f"{nombre} todavía apunta al borrador"
        tiene_noindex = "noindex" in texto
        assert tiene_noindex == (nombre == "404.html"), f"{nombre}: noindex mal puesto"
    for ejemplo in (SALIDA / "assets" / "ejemplos").glob("*/index.html"):
        assert "noindex" in leer(ejemplo), f"{ejemplo}: los ejemplos deben seguir fuera de Google"

    archivos = [p for p in SALIDA.rglob("*") if p.is_file()]
    # el ZIP para Hostinger: los archivos van en la raíz del ZIP, no dentro de una carpeta
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as comprimido:
        for p in sorted(archivos):
            comprimido.write(p, p.relative_to(SALIDA).as_posix())
    peso = sum(p.stat().st_size for p in archivos) / 1024 / 1024
    print(f"ZIP para subir: {ZIP} ({ZIP.stat().st_size / 1024 / 1024:.1f} MB)")
    print(f"{len(archivos)} archivos, {peso:.1f} MB")
    print("Adentro: " + ", ".join(sorted(p.name for p in SALIDA.iterdir())))


if __name__ == "__main__":
    main()

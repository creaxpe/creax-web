# -*- coding: utf-8 -*-
"""
aligerar.py · rehace los archivos livianos de la web: fuentes e íconos.

  - Las fuentes van en WOFF2 y solo con los caracteres del español (de 1,1 MB a unos 100 KB).
    Los TTF originales se quedan en assets/fuentes: los usa también el kit de marca.
  - Los íconos: assets/iconos/iconos.css y Phosphor-web.woff2 traen solo los íconos que usa la web
    (de 76 + 143 KB a 4 + 8 KB). La hoja y la fuente completas se quedan en assets/iconos.

Cuándo correrlo: si se agrega un ícono nuevo (una clase "ph-...") a una página o a animacion.js,
o si hace falta un carácter que no está en las fuentes.  Uso: python aligerar.py
Necesita: pip install fonttools brotli
"""
import hashlib
import io
import re
from pathlib import Path

from fontTools import subset

WEB = Path(__file__).resolve().parent.parent / "sitio"   # lo que se publica
PAGINAS = sorted(p.name for p in WEB.glob("*.html"))
LATIN = "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2010-2027,U+2030-203A,U+2044,U+20AC,U+2122,U+2190-2199,U+2212"
FUENTES = ["SpaceGrotesk-700", "SpaceGrotesk-500", "Inter-400", "Inter-500", "Inter-600", "InstrumentSerif-Italic"]

# fuentes de texto
for nombre in FUENTES:
    subset.main([str(WEB / "assets" / "fuentes" / f"{nombre}.ttf"), f"--unicodes={LATIN}", "--layout-features=*",
                 "--flavor=woff2", f"--output-file={WEB / 'assets' / 'fuentes' / (nombre + '.woff2')}"])
print("fuentes:", ", ".join(f"{n}.woff2" for n in FUENTES))

# íconos: solo los que aparecen en las páginas y en los scripts
usados = set()
for archivo in PAGINAS + ["animacion.js", "inicio.js"]:
    usados |= set(re.findall(r"\bph-[a-z0-9-]+", io.open(WEB / archivo, encoding="utf-8").read()))
hoja = io.open(WEB / "assets" / "iconos" / "style.css", encoding="utf-8").read()
base = hoja[:hoja.index(".ph.ph-")]
reglas, codigos = [], []
for nombre, codigo in re.findall(r"\.ph\.(ph-[a-z0-9-]+):before\s*\{\s*content:\s*\"\\([0-9a-f]+)\";\s*\}", hoja):
    if nombre in usados:
        reglas.append(f'.ph.{nombre}:before {{ content: "\\{codigo}"; }}')
        codigos.append(int(codigo, 16))
faltan = usados - {r.split(":")[0][4:] for r in reglas}
if faltan:
    raise SystemExit(f"Estos íconos no existen en Phosphor: {', '.join(sorted(faltan))}")
# la fuente lleva una huella de los íconos que trae: si cambia la lista, cambia la dirección
# y ningún navegador se queda con la fuente vieja guardada
huella = hashlib.md5(",".join(str(c) for c in sorted(codigos)).encode()).hexdigest()[:8]
base = re.sub(r"src:\s*url\(\"\./Phosphor\.woff2\"\)[^;]*;", f'src: url("./Phosphor-web.woff2?v={huella}") format("woff2");', base, flags=re.S)
io.open(WEB / "assets" / "iconos" / "iconos.css", "w", encoding="utf-8", newline="\n").write(
    "/* Phosphor Icons (MIT), solo los íconos que usa la web de CreaX. Se arma con aligerar.py. */\n"
    + base.strip() + "\n\n" + "\n".join(sorted(reglas)) + "\n")
subset.main([str(WEB / "assets" / "iconos" / "Phosphor.woff2"), "--unicodes=" + ",".join(f"U+{c:04X}" for c in codigos),
             "--flavor=woff2", "--no-layout-closure", f"--output-file={WEB / 'assets' / 'iconos' / 'Phosphor-web.woff2'}"])
print(f"íconos: {len(reglas)} en iconos.css y Phosphor-web.woff2")
print("Recuerda subir el número ?v= en las páginas antes de publicar.")

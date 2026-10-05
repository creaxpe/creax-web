/* =============================================================================
   inicio.js · lo primero que corre en cada página (va en el <head>, sin defer).
   Antes estaba escrito dentro del HTML de las cinco páginas. Se sacó a este archivo
   para que la política de seguridad (CSP) pueda prohibir los scripts escritos
   dentro de la página, que es por donde entra una inyección de código (XSS).
   ========================================================================== */
/* siempre por HTTPS: si alguien entra por http, se pasa a https. GitHub Pages ya lo hace;
   esto lo asegura también cuando la web tenga su dominio propio. En la PC (localhost) no aplica. */
if (location.protocol === "http:" && !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
  location.replace("https:" + location.href.slice(location.protocol.length));
}
document.documentElement.classList.add("con-js");
/* con movimiento permitido, los dibujos de las cabeceras esperan escondidos hasta que animacion.js los arma */
try {
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches && location.search.indexOf("estatico") < 0) {
    document.documentElement.classList.add("con-movimiento");
  }
} catch (e) {}
/* la intro del logo: una vez por visita, y nunca si pidieron menos movimiento o es una captura */
try {
  if (!sessionStorage.getItem("creax-intro") && !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      location.search.indexOf("estatico") < 0) {
    document.documentElement.classList.add("con-intro");
    setTimeout(function () { document.documentElement.classList.remove("con-intro"); }, 5000);
  }
} catch (e) {}
/* las páginas de la web, con su nombre y su color, para la cortina del cambio de página
   (animacion.js arma la salida; acá se pone la llegada) */
window.CREAX_PAGINAS = {
  "": { palabra: "Inicio", color: "var(--c-inicio)" },
  "index.html": { palabra: "Inicio", color: "var(--c-inicio)" },
  "servicios.html": { palabra: "Servicios", color: "var(--c-servicios)" },
  "automatizaciones.html": { palabra: "Automatizaciones", color: "var(--c-automatizaciones)" },
  "bocetos.html": { palabra: "Bocetos", color: "var(--c-bocetos)" },
  "nosotros.html": { palabra: "Nosotros", color: "var(--c-nosotros)" },
  "privacidad.html": { palabra: "Privacidad", color: "var(--hueso)" },
  "terminos.html": { palabra: "Términos", color: "var(--hueso)" }
};
/* la llegada: la cortina está puesta desde el primer cuadro, con el nombre de la página,
   y el CSS (html.con-transicion) la levanta */
window.CREAX_ENTRAR = function (pagina) {
  var raiz = document.documentElement;
  raiz.classList.remove("con-transicion");
  void raiz.offsetWidth;                       // así la animación arranca de nuevo si se repite
  raiz.setAttribute("data-transicion", pagina.palabra);
  raiz.style.setProperty("--transicion-color", pagina.color);
  raiz.style.setProperty("--transicion-letras", String(pagina.palabra.length));
  raiz.classList.add("con-transicion");
  clearTimeout(window.CREAX_ENTRAR.espera);
  window.CREAX_ENTRAR.espera = setTimeout(function () { raiz.classList.remove("con-transicion"); }, 1150);
};
try {
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches && location.search.indexOf("estatico") < 0) {
    var llegada = JSON.parse(sessionStorage.getItem("creax-transicion") || "null");
    sessionStorage.removeItem("creax-transicion");
    var viaje = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
    var esta = window.CREAX_PAGINAS[location.pathname.slice(location.pathname.lastIndexOf("/") + 1)];
    if (llegada && Date.now() - llegada.t < 6000) window.CREAX_ENTRAR(llegada);       // vino desde otra página de la web
    else if (esta && viaje && viaje.type === "back_forward") window.CREAX_ENTRAR(esta);  // volvió con "atrás" o "adelante"
  }
} catch (e) {}

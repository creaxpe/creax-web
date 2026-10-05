// capturas.js · saca las capturas de los tres ejemplos (assets/ejemplos/) que usa la web:
//   assets/maqueta-<ejemplo>.jpg          la parte de arriba en computadora (1200 × 690), para la portada y el muro
//   assets/maqueta-<ejemplo>-cel.jpg      la parte de arriba en el celular (390 × 760), para Bocetos y el muro
//   assets/boceto-<ejemplo>-completo.jpg  la página entera en el celular, para recorrerla en Bocetos
// Los ejemplos están hechos a mano, cada uno con su estilo; este script solo los fotografía.
// Uso (con la web servida en local):  python -m http.server 8094  y luego  node capturas.js
let playwright;
try { playwright = require("playwright"); }
catch (e) { playwright = require("C:/Users/JuanDiego/AppData/Local/npm-cache/_npx/705bc6b22212b352/node_modules/playwright"); }
const BASE = process.env.CAPTURAS_BASE || "http://127.0.0.1:8094/";
const EJEMPLOS = ["reposteria", "clinica", "gimnasio"];

(async () => {
  const nav = await playwright.chromium.launch();
  for (const ej of EJEMPLOS) {
    const url = `${BASE}assets/ejemplos/${ej}/index.html`;
    for (const [sufijo, opciones, completa] of [
      ["", { viewport: { width: 1200, height: 690 }, deviceScaleFactor: 1 }, false],
      ["-cel", { viewport: { width: 390, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, false],
      ["-completo", { viewport: { width: 390, height: 760 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }, true],
    ]) {
      const ctx = await nav.newContext({ ...opciones, reducedMotion: "reduce" });
      const p = await ctx.newPage();
      await p.goto(url, { waitUntil: "networkidle" });
      // baja la página para que carguen las fotos diferidas, y vuelve arriba
      const alto = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < alto; y += 500) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(40); }
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(500);
      const nombre = completa ? `boceto-${ej}-completo.jpg` : `maqueta-${ej}${sufijo}.jpg`;
      await p.screenshot({ path: require("path").join(__dirname, "..", "sitio", "assets", nombre), fullPage: completa, type: "jpeg", quality: completa ? 74 : 84 });
      console.log("ok", nombre);
      await ctx.close();
    }
  }
  await nav.close();
})();

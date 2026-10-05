/* =============================================================================
   CreaX · movimiento de la web, con anime.js v4
   Cada animación tiene un motivo: guiar la lectura, mostrar que el boceto se
   adapta a cada rubro y explicar cómo viaja la información en un flujo.
   Si el visitante pidió menos movimiento, todo queda quieto.
   "?estatico" en la dirección también deja la página sin movimiento.
   ========================================================================== */

(function () {
  "use strict";

  var A = window.anime;
  var quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    || location.search.indexOf("estatico") > -1
    || !A;

  var salida = A ? A.cubicBezier(0.16, 1, 0.3, 1) : "linear";
  var rebote = A ? A.cubicBezier(0.34, 1.56, 0.64, 1) : "linear";

  var anio = document.getElementById("anio");
  if (anio) anio.textContent = new Date().getFullYear();

  /* --------------------------------------------------------------
     1. La barra flotante se apoya cuando el visitante deja la portada
     -------------------------------------------------------------- */
  var nav = document.getElementById("nav");
  if (nav && "IntersectionObserver" in window) {
    var centinela = document.createElement("div");
    centinela.setAttribute("aria-hidden", "true");
    centinela.style.cssText = "position:absolute;top:90px;left:0;height:1px;width:1px;pointer-events:none;";
    document.body.prepend(centinela);
    new IntersectionObserver(function (entradas) {
      nav.classList.toggle("encogida", !entradas[0].isIntersecting);
    }).observe(centinela);
  }

  /* --------------------------------------------------------------
     1b. En el celular, los enlaces de la barra no caben: van en un
         menú que se abre con un botón. En pantallas grandes, el CSS
         esconde el botón y el menú.
     -------------------------------------------------------------- */
  var enlacesNav = nav && nav.querySelector(".nav-enlaces");
  if (enlacesNav) {
    var botonMenu = document.createElement("button");
    botonMenu.type = "button";
    botonMenu.className = "boton-menu";
    botonMenu.setAttribute("aria-controls", "menuMovil");
    var iconoMenu = document.createElement("i");
    iconoMenu.setAttribute("aria-hidden", "true");
    botonMenu.appendChild(iconoMenu);
    enlacesNav.appendChild(botonMenu);

    var menuMovil = document.createElement("nav");
    menuMovil.className = "menu-movil";
    menuMovil.id = "menuMovil";
    menuMovil.setAttribute("aria-label", "Páginas");
    enlacesNav.querySelectorAll("a.enlace").forEach(function (enlace) {
      var item = document.createElement("a");
      var colorSector = enlace.className.match(/color-[a-z]+/);
      item.href = enlace.getAttribute("href");
      item.className = "menu-item" + (colorSector ? " " + colorSector[0] : "");
      if (enlace.getAttribute("aria-current")) item.setAttribute("aria-current", enlace.getAttribute("aria-current"));
      item.appendChild(document.createTextNode(enlace.textContent));
      var flecha = document.createElement("i");
      flecha.className = "ph ph-arrow-right";
      flecha.setAttribute("aria-hidden", "true");
      item.appendChild(flecha);
      menuMovil.appendChild(item);
    });
    nav.appendChild(menuMovil);

    var ponerMenu = function (abierto) {
      nav.classList.toggle("menu-abierto", abierto);
      botonMenu.setAttribute("aria-expanded", String(abierto));
      botonMenu.setAttribute("aria-label", abierto ? "Cerrar el menú" : "Abrir el menú");
      iconoMenu.className = "ph " + (abierto ? "ph-x" : "ph-list");
    };
    ponerMenu(false);
    botonMenu.addEventListener("click", function () { ponerMenu(!nav.classList.contains("menu-abierto")); });
    // se cierra al tocar fuera de la barra o al abrir el panel de contacto
    document.addEventListener("click", function (evento) {
      if (!nav.classList.contains("menu-abierto")) return;
      if (!nav.contains(evento.target) || evento.target.closest("[data-contacto]")) ponerMenu(false);
    });
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && nav.classList.contains("menu-abierto")) { ponerMenu(false); botonMenu.focus(); }
    });
  }

  /* --------------------------------------------------------------
     2. El titular se parte en palabras para poder escalonarlo
     -------------------------------------------------------------- */
  var titular = document.getElementById("titular");
  var piezas = [];
  if (titular) {
    var palabras = titular.textContent.trim().split(/\s+/);
    titular.textContent = "";
    palabras.forEach(function (palabra, i) {
      var linea = document.createElement("span");
      linea.className = "linea-palabra";
      var pieza = document.createElement("span");
      pieza.className = "pieza";
      pieza.textContent = palabra;
      var acentos = parseInt(titular.dataset.acento || "1", 10);
      if (i >= palabras.length - acentos) pieza.classList.add("acento");
      linea.appendChild(pieza);
      titular.appendChild(linea);
      titular.appendChild(document.createTextNode(" "));
      piezas.push(pieza);
    });
  }

  /* --------------------------------------------------------------
     5. Los pasos del método se encienden al llegar a la pantalla
     -------------------------------------------------------------- */
  var pasos = document.querySelectorAll(".paso");
  if (pasos.length && "IntersectionObserver" in window) {
    var mirón = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        entrada.target.classList.toggle("activo", entrada.isIntersecting);
      });
    }, { rootMargin: "-38% 0px -38% 0px" });
    pasos.forEach(function (paso) { mirón.observe(paso); });
  }

  /* --------------------------------------------------------------
     5b. Luz que sigue al cursor, en las tarjetas y en la portada
     -------------------------------------------------------------- */
  document.querySelectorAll(".tarjeta").forEach(function (tarjeta) {
    tarjeta.addEventListener("pointermove", function (evento) {
      var caja = tarjeta.getBoundingClientRect();
      tarjeta.style.setProperty("--mx", (evento.clientX - caja.left) + "px");
      tarjeta.style.setProperty("--my", (evento.clientY - caja.top) + "px");
    });
  });
  var portada = document.querySelector(".portada");
  if (portada) {
    portada.addEventListener("pointermove", function (evento) {
      var caja = portada.getBoundingClientRect();
      portada.style.setProperty("--gx", (evento.clientX - caja.left) + "px");
      portada.style.setProperty("--gy", (evento.clientY - caja.top) + "px");
    });
  }

  /* --------------------------------------------------------------
     5c. ¿Cuál le toca?: tres preguntas y la tabla marca la respuesta
     -------------------------------------------------------------- */
  var elegidor = document.getElementById("elegidor");
  if (elegidor) {
    var respuestas = {};
    var PLANES = {
      presentacion: { columna: 1, nombre: "Landing Page",
        porque: "El cliente necesita entender qué hace el negocio y escribirle. Con la web de presentación y el botón directo al WhatsApp alcanza." },
      pedidos: { columna: 2, nombre: "Pedidos",
        porque: "El cliente arma su pedido en la web y llega completo al WhatsApp. Se cobra como hoy, sin comisiones de pasarela." },
      tienda: { columna: 3, nombre: "Tienda",
        porque: "El cliente paga en la misma web y el stock se descuenta solo. Conviene cuando el volumen justifica la pasarela de pago." }
    };
    var tablaComparacion = document.getElementById("tablaComparacion");
    var veredictoNombre = document.getElementById("veredictoNombre");
    var veredictoPorque = document.getElementById("veredictoPorque");

    var decidir = function (porRespuesta) {
      var clave = "presentacion";
      if (respuestas.cobro === "web") clave = "tienda";
      else if (respuestas.vende === "productos" && respuestas.volumen === "muchos") clave = "tienda";
      else if (respuestas.vende === "productos") clave = "pedidos";
      var plan = PLANES[clave];
      var extra = (clave !== "tienda" && respuestas.volumen !== "pocos")
        ? " Con ese volumen, conviene mirar también Piloto automático." : "";
      veredictoNombre.textContent = plan.nombre;
      veredictoPorque.textContent = plan.porque + extra;
      if (tablaComparacion) {
        tablaComparacion.querySelectorAll("tr").forEach(function (fila) {
          Array.prototype.forEach.call(fila.children, function (celda, i) {
            celda.classList.toggle("col-activa", i === plan.columna);
          });
        });
        // en el celular la tabla se desliza de lado: se lleva a la vista la columna que le toca
        var envolturaTabla = tablaComparacion.parentElement;
        var celdaActiva = tablaComparacion.querySelector("thead th.col-activa");
        // solo cuando la persona responde: si se desliza al cargar, Chrome deja de medir la velocidad (LCP)
        if (porRespuesta && celdaActiva && envolturaTabla.scrollWidth > envolturaTabla.clientWidth + 1) {
          var fija = tablaComparacion.querySelector("thead th").offsetWidth;
          envolturaTabla.scrollTo({ left: Math.max(0, celdaActiva.offsetLeft - fija), behavior: quieto ? "auto" : "smooth" });
        }
      }
      if (!quieto) A.animate(veredictoNombre, { opacity: [0, 1], y: [12, 0], duration: 520, ease: salida });
    };

    elegidor.querySelectorAll(".pregunta").forEach(function (grupo) {
      var clave = grupo.dataset.pregunta;
      var botones = grupo.querySelectorAll(".opcion");
      botones.forEach(function (boton) {
        if (boton.getAttribute("aria-pressed") === "true") respuestas[clave] = boton.dataset.valor;
        boton.addEventListener("click", function () {
          botones.forEach(function (otro) { otro.setAttribute("aria-pressed", "false"); });
          boton.setAttribute("aria-pressed", "true");
          respuestas[clave] = boton.dataset.valor;
          decidir(true);
        });
      });
    });
    decidir();
  }

  /* --------------------------------------------------------------
     5d. El flujo cambia según el rubro, y cada paso se explica al tocarlo
     -------------------------------------------------------------- */
  var FLUJOS = {
    general: [
      ["Llega un mensaje", "WhatsApp, Instagram o el formulario de la web", "Todo lo que escriben entra por el mismo lado, venga de donde venga."],
      ["El sistema decide qué hacer", "Según el horario, el producto o el tipo de consulta", "Las reglas son las del negocio: qué se responde solo y qué necesita a una persona."],
      ["Responde y registra", "Contesta al cliente y anota el pedido donde corresponde", "El cliente recibe la respuesta al momento y el pedido queda anotado, sin copiarlo."],
      ["Avisa al equipo", "El encargado recibe el pedido listo para atender", "Llega un aviso con todo lo que hace falta: nadie tiene que volver a preguntar."]
    ],
    tienda: [
      ["Preguntan si hay stock", "Por Instagram, con la foto de un producto", "La consulta más repetida del día, contestada sin que nadie tenga que leerla."],
      ["Revisa el inventario", "Talla, color y cantidad disponibles", "Responde con lo que de verdad hay, no con lo que había la semana pasada."],
      ["Arma el pedido", "Datos de entrega y enlace de pago en un mensaje", "El cliente paga y el pedido queda registrado con su estado."],
      ["Avisa el despacho", "El cliente recibe el aviso cuando sale su envío", "Se terminan los «¿ya salió mi pedido?» en el chat."]
    ],
    servicios: [
      ["Llega una consulta", "Por WhatsApp, Instagram o la web", "El cliente cuenta su caso con sus palabras, a la hora que sea."],
      ["Ordena el caso", "Pide los datos que faltan: servicio, fecha y presupuesto", "Antes de hablar con el cliente, ya se sabe qué necesita."],
      ["Agenda la llamada", "Ofrece horarios libres y la deja en el calendario", "Sin idas y vueltas para cuadrar una reunión."],
      ["Hace el seguimiento", "Si el cliente no responde, le escribe a los días", "Ninguna oportunidad se enfría por falta de seguimiento."]
    ],
    consultorio: [
      ["Un paciente pide cita", "Por WhatsApp o desde la web", "Escribe como le escribiría a una persona; el sistema entiende qué necesita."],
      ["Revisa la agenda", "Ofrece los horarios que están libres", "Solo aparecen los espacios que de verdad están disponibles."],
      ["Reserva y registra", "La cita queda en la agenda y en la ficha del paciente", "Sin llamadas: el paciente elige y queda reservado."],
      ["Recuerda un día antes", "El paciente confirma o reprograma con un toque", "Menos ausencias, y se sabe con tiempo si se libera un espacio."]
    ]
  };
  var nodosFlujo = document.querySelectorAll(".nodo");
  var nodoDetalle = document.getElementById("nodoDetalle");
  var flujoActual = "general";
  if (nodosFlujo.length) {
    var pintarFlujo = function (clave) {
      flujoActual = clave;
      nodosFlujo.forEach(function (nodo, i) {
        var datos = FLUJOS[clave][i];
        if (!datos) return;
        nodo.classList.add("cambiando");
        setTimeout(function () {
          nodo.querySelector("b").textContent = datos[0];
          nodo.querySelector("span").textContent = datos[1];
          nodo.classList.remove("cambiando");
        }, quieto ? 0 : 220 + i * 70);
      });
    };
    var pestanasFlujo = document.querySelectorAll(".pestana[data-flujo]");
    pestanasFlujo.forEach(function (boton) {
      boton.addEventListener("click", function () {
        pestanasFlujo.forEach(function (otra) { otra.setAttribute("aria-selected", "false"); });
        boton.setAttribute("aria-selected", "true");
        pintarFlujo(boton.dataset.flujo);
      });
    });
  }

  /* --------------------------------------------------------------
     5e. Los socios se abren al tocarlos (en el celular no hay cursor)
     -------------------------------------------------------------- */
  document.querySelectorAll(".socio").forEach(function (socio) {
    var alternar = function () { socio.classList.toggle("abierto"); };
    socio.addEventListener("click", alternar);
    socio.addEventListener("keydown", function (evento) {
      if (evento.key === "Enter" || evento.key === " ") { evento.preventDefault(); alternar(); }
    });
  });

  /* --------------------------------------------------------------
     5e2. Equipo: el filtro por área resalta a los socios de esa área
          y marca su etiqueta. Los números salen de las tarjetas.
     -------------------------------------------------------------- */
  var filtroEquipo = document.querySelector(".equipo-filtro");
  var grillaSocios = document.querySelector(".socios");
  if (filtroEquipo && grillaSocios) {
    var botonesArea = filtroEquipo.querySelectorAll("button");
    var tarjetasSocio = grillaSocios.querySelectorAll(".socio");
    var tieneArea = function (tarjeta, area) {
      return area === "todos" || (" " + tarjeta.dataset.areas + " ").indexOf(" " + area + " ") > -1;
    };
    botonesArea.forEach(function (boton) {
      var area = boton.dataset.area;
      var cuenta = boton.querySelector("span");
      if (cuenta) cuenta.textContent = [].filter.call(tarjetasSocio, function (s) { return tieneArea(s, area); }).length;
      boton.addEventListener("click", function () {
        botonesArea.forEach(function (b) { b.setAttribute("aria-pressed", b === boton ? "true" : "false"); });
        grillaSocios.classList.toggle("filtrando", area !== "todos");
        tarjetasSocio.forEach(function (s) {
          s.classList.toggle("coincide", tieneArea(s, area));
          s.querySelectorAll(".socio-chips span").forEach(function (c) { c.classList.toggle("activa", c.dataset.area === area); });
        });
      });
    });
  }

  /* --------------------------------------------------------------
     5f. La escena de la portada rota: repostería, gimnasio y clínica dental,
         una a la vez, con la pantalla y la conversación de cada una
     -------------------------------------------------------------- */
  var ESCENAS = {
    reposteria: { nombre: "Repostería", icono: "ph-cake", color: "color-servicios",
      pregunta: "Hola, ¿me hacen una torta para el sábado?", respuesta: "¡Claro! Estas son las más pedidas:",
      icono1: "ph-cake", opcion1: "Torta de fresas", icono2: "ph-gift", opcion2: "Caja de macarons",
      eleccion: "La de fresas, para 12 personas", listo: "Pedido anotado", detalle: "Sábado a las 11:00 a. m., sin copiar nada a mano" },
    gimnasio: { nombre: "Gimnasio", icono: "ph-barbell", color: "color-automatizaciones",
      pregunta: "Hola, ¿qué planes tienen?", respuesta: "¡Hola! Estos son los más pedidos:",
      icono1: "ph-calendar-check", opcion1: "Plan mensual", icono2: "ph-person-simple-run", opcion2: "Clase de prueba",
      eleccion: "Quiero la clase de prueba", listo: "Clase reservada", detalle: "Miércoles a las 6:30 p. m., sin llenar nada a mano" },
    clinica: { nombre: "Clínica dental", icono: "ph-tooth", color: "color-nosotros",
      pregunta: "Hola, ¿tienen cita para limpieza esta semana?", respuesta: "¡Hola! Estos son los horarios libres:",
      icono1: "ph-calendar-check", opcion1: "Jueves, 10:30 a. m.", icono2: "ph-calendar-check", opcion2: "Viernes, 4:00 p. m.",
      eleccion: "El jueves, por favor", listo: "Cita reservada", detalle: "Jueves a las 10:30 a. m., con recordatorio un día antes" }
  };
  var escenaPortada = document.getElementById("escena");
  var fonoPortada = document.getElementById("fono");
  if (escenaPortada && fonoPortada && !quieto) {
    var ordenEscenas = ["reposteria", "gimnasio", "clinica"];
    var escenaActual = 0;
    var pantallasEscena = escenaPortada.querySelectorAll(".ventana-pantallas img");
    var rubroEscena = document.getElementById("escenaRubro");
    var COLORES = ["color-servicios", "color-automatizaciones", "color-nosotros"];
    var pintarEscena = function (clave) {
      var datos = ESCENAS[clave];
      pantallasEscena.forEach(function (img) { img.classList.toggle("activa", img.dataset.rubro === clave); });
      rubroEscena.textContent = datos.nombre;
      COLORES.forEach(function (c) { rubroEscena.classList.remove(c); });
      rubroEscena.classList.add(datos.color);
      fonoPortada.classList.add("cambiando");
      setTimeout(function () {
        COLORES.forEach(function (c) { fonoPortada.classList.remove(c); });
        fonoPortada.classList.add(datos.color);
        document.getElementById("chatNombre").textContent = datos.nombre;
        document.getElementById("chatIcono").className = "ph " + datos.icono;
        fonoPortada.querySelectorAll("[data-campo]").forEach(function (el) {
          var campo = el.dataset.campo;
          if (campo.indexOf("icono") === 0) el.className = "ph " + datos[campo];
          else el.textContent = datos[campo];
        });
        fonoPortada.classList.remove("cambiando");
      }, 380);
    };
    rubroEscena.classList.add(ESCENAS.reposteria.color);
    setInterval(function () {
      if (document.hidden) return;
      escenaActual = (escenaActual + 1) % ordenEscenas.length;
      pintarEscena(ordenEscenas[escenaActual]);
    }, 4800);
  } else if (escenaPortada) {
    var chipRubro = document.getElementById("escenaRubro");
    if (chipRubro) chipRubro.classList.add("color-servicios");
  }

  /* --------------------------------------------------------------
     5g. La conversación de la laptop se reproduce sola cuando aparece
         en pantalla: el cliente escribe, el asistente "escribe…" y
         responde, y el chat baja solo. Al final se puede ver de nuevo.
     -------------------------------------------------------------- */
  var laptopChat = document.querySelector(".laptop");
  var cajaMensajes = document.getElementById("convMensajes");
  var mensajesConversacion = document.querySelectorAll("#convMensajes [data-paso]");
  var contadorConversacion = document.getElementById("convContador");
  var repetirConversacion = document.getElementById("convRepetir");
  if (laptopChat && cajaMensajes && mensajesConversacion.length) {
    var totalMensajes = mensajesConversacion.length;
    var relojes = [];
    var bajarAlFinal = function () { cajaMensajes.scrollTop = cajaMensajes.scrollHeight; };
    var contar = function (n) { if (contadorConversacion) contadorConversacion.textContent = n; };
    var reiniciar = function () {
      relojes.forEach(clearTimeout);
      relojes = [];
      mensajesConversacion.forEach(function (m) { m.classList.remove("visto", "escribiendo"); });
      contar(0);
      if (repetirConversacion) repetirConversacion.hidden = true;
    };
    var reproducir = function () {
      reiniciar();
      var t = 400;
      mensajesConversacion.forEach(function (msj, i) {
        if (msj.classList.contains("asistente")) {
          relojes.push(setTimeout(function () { msj.classList.add("visto", "escribiendo"); contar(i + 1); bajarAlFinal(); }, t));
          t += 1150;
          relojes.push(setTimeout(function () { msj.classList.remove("escribiendo"); bajarAlFinal(); }, t));
          t += 1000;
        } else {
          relojes.push(setTimeout(function () { msj.classList.add("visto"); contar(i + 1); bajarAlFinal(); }, t));
          t += 1400;
        }
      });
      relojes.push(setTimeout(function () { if (repetirConversacion) repetirConversacion.hidden = false; }, t));
    };
    if (quieto) {
      mensajesConversacion.forEach(function (m) { m.classList.add("visto"); });
      contar(totalMensajes);
    } else {
      var yaSeVio = false;
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entradas) {
          entradas.forEach(function (entrada) {
            if (entrada.isIntersecting && !yaSeVio) { yaSeVio = true; reproducir(); }
          });
        }, { threshold: 0.4 }).observe(laptopChat);
      } else {
        reproducir();
      }
      if (repetirConversacion) repetirConversacion.addEventListener("click", reproducir);
    }
  }

  /* --------------------------------------------------------------
     5h. CreaX 360: cada opción muestra su vista en el panel
     -------------------------------------------------------------- */
  var opcionesCuidado = document.querySelectorAll(".cuidado-opcion");
  var vistasCuidado = document.querySelectorAll(".panel-vista");
  if (opcionesCuidado.length && vistasCuidado.length) {
    var elegirVista = function (clave) {
      opcionesCuidado.forEach(function (o) { o.setAttribute("aria-selected", o.dataset.vista === clave ? "true" : "false"); });
      vistasCuidado.forEach(function (v) { v.classList.toggle("activa", v.dataset.vista === clave); });
    };
    var tocadoCuidado = false;
    opcionesCuidado.forEach(function (opcion) {
      opcion.addEventListener("click", function () { tocadoCuidado = true; elegirVista(opcion.dataset.vista); });
    });
    if (!quieto) {                            // mientras nadie la toque, la interfaz se muestra sola
      var ordenCuidado = ["mantenimiento", "cambios", "reporte"];
      var pasoCuidado = 0;
      setInterval(function () {
        if (tocadoCuidado || document.hidden) return;
        pasoCuidado = (pasoCuidado + 1) % ordenCuidado.length;
        elegirVista(ordenCuidado[pasoCuidado]);
      }, 5200);
    }
  }

  /* --------------------------------------------------------------
     5i. Contáctanos: cada botón abre el panel con los canales.
         Los canales se definen solo acá. Los que todavía no existen
         van como "Próximamente" y sin enlace. Sin JavaScript, el botón
         lleva directo al WhatsApp.
     -------------------------------------------------------------- */
  var CANALES = [
    { icono: "ph-phone", nombre: "Llámanos", color: "var(--c-nosotros-tenue)", enlace: "tel:+51966980388" },
    { icono: "ph-whatsapp-logo", nombre: "WhatsApp", color: "var(--c-automatizaciones-tenue)",
      enlace: "https://wa.me/51966980388?text=Hola%20CreaX%2C%20vengo%20de%20la%20web%20y%20quisiera%20m%C3%A1s%20informaci%C3%B3n.", externo: true },
    { icono: "ph-envelope-simple", nombre: "Correo", detalle: "admin@creax.net.pe", color: "var(--c-bocetos-tenue)",
      enlace: "mailto:admin@creax.net.pe?subject=" + encodeURIComponent("Quiero más información") +
        "&body=" + encodeURIComponent("Hola CreaX, vengo de la web y quisiera más información.") },
    { icono: "ph-instagram-logo", nombre: "Instagram" },
    { icono: "ph-linkedin-logo", nombre: "LinkedIn" }
  ];
  var disparadores = document.querySelectorAll("[data-contacto]");
  if (disparadores.length) {
    var fondoContacto = document.createElement("div");
    fondoContacto.className = "contacto-fondo";
    fondoContacto.hidden = true;
    var panelContacto = document.createElement("div");
    panelContacto.className = "contacto-panel";
    panelContacto.setAttribute("role", "dialog");
    panelContacto.setAttribute("aria-modal", "true");
    panelContacto.setAttribute("aria-labelledby", "contactoTitulo");
    panelContacto.hidden = true;
    // Se arma con elementos del DOM y textContent (nada de innerHTML con datos), así un
    // canal nuevo con un texto raro nunca puede convertirse en código.
    var crear = function (etiqueta, clase, texto) {
      var el = document.createElement(etiqueta);
      if (clase) el.className = clase;
      if (texto) el.textContent = texto;
      return el;
    };
    var icono = function (nombre, clase) {
      var i = crear("i", "ph " + nombre + (clase ? " " + clase : ""));
      i.setAttribute("aria-hidden", "true");
      return i;
    };
    var cabezaContacto = crear("div", "contacto-cabeza");
    var tituloContacto = crear("h2", "", "Contáctanos");
    tituloContacto.id = "contactoTitulo";
    var botonCerrarContacto = crear("button", "contacto-cerrar");
    botonCerrarContacto.type = "button";
    botonCerrarContacto.setAttribute("aria-label", "Cerrar");
    botonCerrarContacto.appendChild(icono("ph-x"));
    cabezaContacto.appendChild(tituloContacto);
    cabezaContacto.appendChild(crear("p", "", "Elige el canal que prefieras."));
    cabezaContacto.appendChild(botonCerrarContacto);
    var listaCanales = crear("ul", "contacto-lista");
    CANALES.forEach(function (c) {
      var caja = crear(c.enlace ? "a" : "div", c.enlace ? "canal" : "canal pronto");
      if (c.enlace) {
        caja.href = c.enlace;
        if (c.externo) { caja.target = "_blank"; caja.rel = "noopener"; }
      }
      var fondoIcono = crear("span", "canal-icono");
      if (c.color) fondoIcono.style.setProperty("--color-canal", c.color);
      fondoIcono.appendChild(icono(c.icono));
      var textos = crear("span");
      textos.appendChild(crear("b", "", c.nombre));
      if (c.detalle) textos.appendChild(crear("small", "", c.detalle));
      caja.appendChild(fondoIcono);
      caja.appendChild(textos);
      caja.appendChild(c.enlace ? icono("ph-arrow-up-right", "canal-ir") : crear("span", "canal-pronto", "Próximamente"));
      var fila = crear("li");
      fila.appendChild(caja);
      listaCanales.appendChild(fila);
    });
    panelContacto.appendChild(cabezaContacto);
    panelContacto.appendChild(listaCanales);
    document.body.appendChild(fondoContacto);
    document.body.appendChild(panelContacto);

    var quienAbrio = null;
    var cerrarContacto = function () {
      document.documentElement.classList.remove("contacto-abierto");
      setTimeout(function () { panelContacto.hidden = true; fondoContacto.hidden = true; }, quieto ? 0 : 450);
      if (quienAbrio) quienAbrio.focus();
    };
    var abrirContacto = function (evento) {
      evento.preventDefault();
      quienAbrio = evento.currentTarget;
      panelContacto.hidden = false;
      fondoContacto.hidden = false;
      requestAnimationFrame(function () {
        document.documentElement.classList.add("contacto-abierto");
        panelContacto.querySelector(".contacto-cerrar").focus();
      });
    };
    disparadores.forEach(function (boton) { boton.addEventListener("click", abrirContacto); });
    fondoContacto.addEventListener("click", cerrarContacto);
    panelContacto.querySelector(".contacto-cerrar").addEventListener("click", cerrarContacto);
    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && document.documentElement.classList.contains("contacto-abierto")) cerrarContacto();
    });
  }

  /* --------------------------------------------------------------
     5c. "Contáctanos por mail": mientras la persona escribe, la vista de
         la izquierda arma el correo tal como nos va a llegar. Al enviar,
         contacto.php (solo en creax.net.pe, que tiene PHP) lo manda a
         admin@creax.net.pe. Si no se puede, por ejemplo en el borrador de
         GitHub, ofrece abrirlo en su correo o escribirnos por WhatsApp.
         "Prefiero WhatsApp" arma el mismo mensaje y lo abre en su WhatsApp.
     -------------------------------------------------------------- */
  var proyecto = document.getElementById("proyecto");
  if (proyecto) {
    var CORREO_CREAX = "admin@creax.net.pe";
    var chipsProyecto = [].slice.call(proyecto.querySelectorAll(".chip-proyecto"));
    var avisoProyecto = document.getElementById("proyectoAviso");
    var botonProyecto = document.getElementById("proyectoEnviar");
    var textoBotonProyecto = botonProyecto.querySelector(".proyecto-enviar-texto");
    var pasoProyecto = document.getElementById("proyectoPaso");
    var listoProyecto = document.getElementById("proyectoListo");
    var aceptaProyecto = document.getElementById("proyectoAcepta");
    var errorAcepta = document.getElementById("errorAcepta");
    var vistaCorreo = document.getElementById("correoVista");
    var cargadaEn = Date.now();
    var limpio = function (id) { return document.getElementById(id).value.replace(/\s+/g, " ").trim(); };
    var soloNumero = function (t) { return t.replace(/[^\d+]/g, ""); };
    // validación: cada campo dice qué le falta, debajo de sí mismo
    var CAMPOS = [
      { id: "proyectoNombre", error: "errorNombre", revisar: function (v) {
        return /^[\p{L}][\p{L} .'-]{1,59}$/u.test(v) ? "" : (v ? "Escribe tu nombre solo con letras." : "Escribe tu nombre.");
      } },
      { id: "proyectoNegocio", error: "errorNegocio", revisar: function (v) {
        return v.length >= 2 && /[\p{L}\p{N}]/u.test(v) ? "" : "Escribe el nombre de tu empresa.";
      } },
      { id: "proyectoRubro", error: "errorRubro", revisar: function (v) {
        return v.length >= 2 ? "" : "Cuéntanos a qué se dedica.";
      } },
      { id: "proyectoCelular", error: "errorCelular", revisar: function (v) {
        var n = soloNumero(v);
        return /^(\+?51)?9\d{8}$/.test(n) || /^\+\d{8,15}$/.test(n) ? "" : "Escribe tu celular (9 dígitos).";
      } },
      { id: "proyectoCorreo", error: "errorCorreo", revisar: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Escribe un correo válido.";
      } },
      { id: "proyectoMensaje", error: "errorMensaje", revisar: function (v) {
        return !v || v.length >= 10 ? "" : "Cuéntanos un poco más (al menos 10 letras).";
      } }
    ];
    var marcar = function (campo, mensaje) {
      var entrada = document.getElementById(campo.id), error = document.getElementById(campo.error);
      error.textContent = mensaje;
      error.hidden = !mensaje;
      if (mensaje) entrada.setAttribute("aria-invalid", "true"); else entrada.removeAttribute("aria-invalid");
    };
    // para el correo todo es obligatorio menos las ideas; para WhatsApp, solo se revisa lo que escribió
    var revisarCampos = function (paraCorreo) {
      var primero = null;
      CAMPOS.forEach(function (campo) {
        var v = limpio(campo.id);
        var mensaje = !v && (!paraCorreo || campo.id === "proyectoMensaje") ? "" : campo.revisar(v);
        marcar(campo, mensaje);
        if (mensaje && !primero) primero = document.getElementById(campo.id);
      });
      return primero;
    };
    var interesesProyecto = function () {
      return chipsProyecto.filter(function (chip) { return chip.getAttribute("aria-pressed") === "true"; })
        .map(function (chip) { return chip.dataset.valor; });
    };
    var datosProyecto = function () {
      return {
        nombre: limpio("proyectoNombre"), empresa: limpio("proyectoNegocio"), rubro: limpio("proyectoRubro"),
        celular: soloNumero(limpio("proyectoCelular")), correo: limpio("proyectoCorreo"),
        ideas: document.getElementById("proyectoMensaje").value.trim(), intereses: interesesProyecto(),
        acepta: aceptaProyecto.checked, sitio: document.getElementById("proyectoSitio").value,
        tiempo: Date.now() - cargadaEn
      };
    };
    // el mismo texto sirve para WhatsApp y para abrirlo en el correo de la persona
    var textoProyecto = function (d) {
      var lineas = ["Hola CreaX, vengo de la web."];
      if (d.nombre) lineas.push("Soy " + d.nombre + (d.empresa ? ", de " + d.empresa : "") + (d.rubro ? " (" + d.rubro + ")" : "") + ".");
      else if (d.empresa) lineas.push("Les escribo por " + d.empresa + (d.rubro ? " (" + d.rubro + ")" : "") + ".");
      if (d.intereses.length) lineas.push("Me interesa: " + d.intereses.join(", ") + ".");
      if (d.ideas) lineas.push(d.ideas.slice(0, 1200));
      if (d.celular) lineas.push("Mi celular: " + d.celular);
      if (d.correo) lineas.push("Mi correo: " + d.correo);
      return lineas.join("\n");
    };
    var whatsappProyecto = function (d) { return "https://wa.me/51966980388?text=" + encodeURIComponent(textoProyecto(d)); };
    var correoProyecto = function (d) {
      return "mailto:" + CORREO_CREAX + "?subject=" + encodeURIComponent("Quiero más información · " + (d.empresa || "mi empresa")) +
        "&body=" + encodeURIComponent(textoProyecto(d));
    };
    // el aviso se arma con textContent: lo que escribió la persona nunca se vuelve código
    var avisarProyecto = function (texto, enlaces) {
      avisoProyecto.textContent = texto;
      (enlaces || []).forEach(function (e) {
        avisoProyecto.appendChild(document.createTextNode(" "));
        var a = document.createElement("a");
        a.href = e.href;
        a.textContent = e.texto;
        if (e.externo) { a.target = "_blank"; a.rel = "noopener"; }
        avisoProyecto.appendChild(a);
      });
      avisoProyecto.hidden = false;
    };

    // la vista del correo se escribe sola con lo que la persona va llenando
    var pintarVista = function () {
      if (!vistaCorreo) return;
      var d = datosProyecto();
      vistaCorreo.querySelector('[data-vista="de"]').textContent =
        d.nombre ? d.nombre + (d.correo ? " · " + d.correo : "") : "Tu nombre · tu correo";
      vistaCorreo.querySelector('[data-vista="asunto"]').textContent =
        (d.empresa || "Tu empresa") + (d.intereses.length ? " · " + d.intereses.join(", ") : " quiere su página");
      var partes = ["Hola CreaX, soy " + (d.nombre || "…") + (d.empresa ? " de " + d.empresa : "") + (d.rubro ? " (" + d.rubro + ")" : "") + "."];
      if (d.intereses.length) partes.push("Me interesa: " + d.intereses.join(", ").toLowerCase() + ".");
      if (d.ideas) partes.push(d.ideas);
      if (d.celular) partes.push("Mi celular es " + limpio("proyectoCelular") + ".");
      vistaCorreo.querySelector('[data-vista="cuerpo"]').textContent = partes.join(" ");
      vistaCorreo.classList.toggle("vacia", !d.nombre && !d.empresa && !d.ideas && !d.intereses.length);
    };
    pintarVista();

    CAMPOS.forEach(function (campo) {
      // al corregir, el error se va
      document.getElementById(campo.id).addEventListener("input", function () {
        if (this.getAttribute("aria-invalid")) marcar(campo, campo.revisar(limpio(campo.id)));
        pintarVista();
      });
    });
    chipsProyecto.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chip.setAttribute("aria-pressed", chip.getAttribute("aria-pressed") === "true" ? "false" : "true");
        avisoProyecto.hidden = true;
        pintarVista();
      });
    });
    aceptaProyecto.addEventListener("change", function () {
      if (aceptaProyecto.checked) { errorAcepta.textContent = ""; errorAcepta.hidden = true; aceptaProyecto.removeAttribute("aria-invalid"); }
    });

    var listoParaEnviar = function (paraCorreo) {
      // antispam: un robot llena el campo trampa (invisible para las personas) o aprieta el botón al instante
      if (document.getElementById("proyectoSitio").value) return null;
      if (Date.now() - cargadaEn < 3000) { avisarProyecto("Un momento, vuelve a intentarlo."); return null; }
      avisoProyecto.hidden = true;
      var primero = revisarCampos(paraCorreo);
      var d = datosProyecto();
      if (!primero && !d.intereses.length && !d.ideas) {
        avisarProyecto("Elige qué te interesa o cuéntanos tus ideas.");
        chipsProyecto[0].focus();
        return null;
      }
      if (primero) { primero.focus(); return null; }
      if (paraCorreo && !d.acepta) {
        errorAcepta.textContent = "Marca la casilla para que podamos responderte.";
        errorAcepta.hidden = false;
        aceptaProyecto.setAttribute("aria-invalid", "true");
        aceptaProyecto.focus();
        return null;
      }
      return d;
    };

    var enviadoProyecto = function (d) {
      document.getElementById("proyectoListoTitulo").textContent =
        "¡Listo" + (d.nombre ? ", " + d.nombre.split(" ")[0] : "") + "! Recibimos tu mensaje";
      document.getElementById("proyectoListoTexto").textContent = "Te escribimos pronto a " + d.correo + ".";
      pasoProyecto.hidden = true;
      listoProyecto.hidden = false;
      listoProyecto.focus({ preventScroll: true });
      if (vistaCorreo) vistaCorreo.classList.add("enviada");
    };
    var noSalioProyecto = function (d, respuesta) {
      if (respuesta.error === "muchos") {
        avisarProyecto("Ya recibimos varios mensajes desde tu conexión. Si necesitas algo más,",
          [{ href: correoProyecto(d), texto: "escríbenos a " + CORREO_CREAX + "." }]);
        return;
      }
      avisarProyecto("No pudimos enviarlo desde aquí.", [
        { href: correoProyecto(d), texto: "Ábrelo en tu correo" },
        { href: whatsappProyecto(d), texto: "o escríbenos por WhatsApp.", externo: true }
      ]);
    };

    var enviando = false;
    proyecto.addEventListener("submit", function (e) {
      e.preventDefault();
      if (enviando) return;
      var d = listoParaEnviar(true);
      if (!d) return;
      enviando = true;
      botonProyecto.disabled = true;
      textoBotonProyecto.textContent = "Enviando…";
      var corte = "AbortController" in window ? new AbortController() : null;
      var limite = setTimeout(function () { if (corte) corte.abort(); }, 15000);
      fetch("contacto.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
        signal: corte ? corte.signal : undefined
      })
        .then(function (r) {
          return r.json().catch(function () { return { ok: false, error: "respuesta" }; });
        })
        .then(function (respuesta) {
          if (respuesta && respuesta.ok) enviadoProyecto(d); else noSalioProyecto(d, respuesta || {});
        })
        .catch(function () { noSalioProyecto(d, { error: "red" }); })
        .then(function () {
          clearTimeout(limite);
          enviando = false;
          botonProyecto.disabled = false;
          textoBotonProyecto.textContent = "Enviar por correo";
        });
    });

    document.getElementById("proyectoWhatsapp").addEventListener("click", function () {
      var d = listoParaEnviar(false);
      if (d) window.open(whatsappProyecto(d), "_blank", "noopener");
    });

    document.getElementById("proyectoOtro").addEventListener("click", function () {
      proyecto.reset();
      chipsProyecto.forEach(function (chip) { chip.setAttribute("aria-pressed", "false"); });
      if (vistaCorreo) vistaCorreo.classList.remove("enviada");
      listoProyecto.hidden = true;
      pasoProyecto.hidden = false;
      cargadaEn = Date.now();
      pintarVista();
      document.getElementById("proyectoNombre").focus();
    });
  }

  /* --------------------------------------------------------------
     5d. Aviso de cookies. Esta web no usa cookies de publicidad ni de
         análisis: solo guarda lo necesario para funcionar. El aviso lo
         cuenta, deja elegir y recuerda la elección. Desde el pie
         ("Cookies") se vuelve a abrir. No sale en las capturas (?estatico).
     -------------------------------------------------------------- */
  var CLAVE_COOKIES = "creax-cookies";
  var leerEleccion = function () { try { return localStorage.getItem(CLAVE_COOKIES); } catch (e) { return null; } };
  var guardarEleccion = function (valor) { try { localStorage.setItem(CLAVE_COOKIES, valor); } catch (e) { /* sin memoria: volverá a salir */ } };
  var avisoCookies = null;
  var cerrarAviso = function () {
    if (!avisoCookies) return;
    var saliente = avisoCookies;
    avisoCookies = null;
    saliente.classList.remove("visible");
    setTimeout(function () { if (saliente.parentNode) saliente.parentNode.removeChild(saliente); }, 400);
  };
  var abrirAviso = function (enfocar) {
    if (avisoCookies) return;
    avisoCookies = document.createElement("section");
    avisoCookies.className = "aviso-cookies";
    avisoCookies.setAttribute("aria-label", "Aviso de cookies");
    var tituloAviso = document.createElement("p");
    tituloAviso.className = "aviso-titulo";
    tituloAviso.textContent = "Cookies";
    var textoAviso = document.createElement("p");
    textoAviso.className = "aviso-texto";
    textoAviso.textContent = "No usamos cookies de publicidad ni de análisis: solo guardamos lo necesario para que la web funcione. ";
    var enlaceAviso = document.createElement("a");
    enlaceAviso.href = "privacidad.html#cookies";
    enlaceAviso.textContent = "Más información";
    textoAviso.appendChild(enlaceAviso);
    var botonesAviso = document.createElement("div");
    botonesAviso.className = "aviso-botones";
    [["Aceptar", "todas", "boton-oscuro"], ["Solo las necesarias", "necesarias", "boton-secundario"]].forEach(function (opcion, i) {
      var boton = document.createElement("button");
      boton.type = "button";
      boton.className = "boton boton-chico " + opcion[2];
      boton.textContent = opcion[0];
      boton.addEventListener("click", function () { guardarEleccion(opcion[1]); cerrarAviso(); });
      botonesAviso.appendChild(boton);
      if (i === 0 && enfocar) setTimeout(function () { boton.focus(); }, 50);
    });
    avisoCookies.appendChild(tituloAviso);
    avisoCookies.appendChild(textoAviso);
    avisoCookies.appendChild(botonesAviso);
    document.body.appendChild(avisoCookies);
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (avisoCookies) avisoCookies.classList.add("visible"); }); });
  };
  document.querySelectorAll("[data-cookies]").forEach(function (boton) {
    boton.addEventListener("click", function (evento) { evento.preventDefault(); abrirAviso(true); });
  });
  if (!leerEleccion() && location.search.indexOf("estatico") < 0) {
    var mostrarAviso = function () { setTimeout(function () { abrirAviso(false); }, 700); };
    if (document.documentElement.classList.contains("con-intro")) {
      // con la intro en pantalla, el aviso espera a que suba la cortina
      var vigiaIntro = new MutationObserver(function () {
        if (!document.documentElement.classList.contains("con-intro")) { vigiaIntro.disconnect(); mostrarAviso(); }
      });
      vigiaIntro.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    } else {
      mostrarAviso();
    }
  }

  /* ==============================================================
     De acá para abajo, solo si hay movimiento permitido
     ============================================================== */
  if (quieto) {
    document.documentElement.classList.remove("con-intro");
    document.documentElement.classList.remove("con-movimiento");   // los dibujos de las cabeceras se ven quietos
    document.querySelectorAll(".revelar").forEach(function (el) { el.style.opacity = "1"; });
    return;
  }

  /* --------------------------------------------------------------
     5z. La intro "Encendido": "Crea" se descifra letra por letra, la X
         se traza, los bloques se prenden como luces y el último se enciende
         en lima. Después sube la cortina. Una vez por visita; un clic la
         salta. La portada arranca recién cuando termina.
     -------------------------------------------------------------- */
  var raiz = document.documentElement;
  var intro = document.getElementById("intro");
  var conIntro = !!intro && raiz.classList.contains("con-intro");
  var alTerminarIntro = [];
  var introTerminada = !conIntro;
  var tareasHechas = false;
  var correrTareas = function () {            // la portada empieza a entrar mientras sube la cortina
    if (tareasHechas) return;
    tareasHechas = true;
    alTerminarIntro.forEach(function (tarea) { tarea(); });
  };
  var terminarIntro = function () {
    if (introTerminada) return;
    introTerminada = true;
    raiz.classList.remove("con-intro");
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    try { sessionStorage.setItem("creax-intro", "1"); } catch (e) { /* sin memoria de sesión: se verá otra vez */ }
    correrTareas();
  };
  if (conIntro) {
    var enIntro = function (sel) { return [].slice.call(intro.querySelectorAll(sel)); };
    var svgIntro = intro.querySelector(".intro-logo");
    var bloquesIntro = enIntro(".ib"), letrasIntro = enIntro(".letra");
    var barraIntro = intro.querySelector(".barra"), astaIntro = intro.querySelector(".asta");
    // "Crea" se descifra: sobre cada letra, un texto que cambia de signo hasta que la letra real se fija
    var signos = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789#&%";
    var textosIntro = letrasIntro.map(function (letra) {
      var caja = letra.getBBox();
      var t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", (caja.x + caja.width / 2).toFixed(1));
      t.setAttribute("y", "80");
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("font-family", "Space Grotesk, Inter, sans-serif");
      t.setAttribute("font-weight", "700");
      t.setAttribute("font-size", "64");
      t.setAttribute("fill", "#F4F4F2");
      svgIntro.appendChild(t);
      return t;
    });
    var descifrado = { avance: 0 };
    var apagado = "#2B2B2B", encendidos = ["#FF7A59", "#B9A6FF", "#F4F4F2", "#FFD84D"];
    var trazos = A.createDrawable([barraIntro, astaIntro]);
    var lineaIntro = A.createTimeline({ defaults: { ease: salida }, onComplete: terminarIntro })
      .set(trazos, { draw: "0 0" }, 0)
      .set([barraIntro, astaIntro], { opacity: 1 }, 0)
      .add(descifrado, {
        avance: 1, duration: 950, ease: "linear",
        onUpdate: function () {
          var a = descifrado.avance;
          textosIntro.forEach(function (t, i) {
            if (a >= 0.3 + i * 0.2) { t.style.opacity = 0; letrasIntro[i].style.opacity = 1; return; }
            t.style.opacity = 1; letrasIntro[i].style.opacity = 0;
            var paso = Math.floor(a * 16);                    // cambia de signo unas 16 veces, no en cada cuadro
            if (t.__paso !== paso) { t.__paso = paso; t.textContent = signos.charAt(Math.floor(Math.random() * signos.length)); }
          });
        }
      }, 100)
      .add(trazos[0], { draw: "0 1", duration: 380 }, 620)
      .add(trazos[1], { draw: "0 1", duration: 380 }, 860)
      .add(".intro .corte", { opacity: 1, duration: 120 }, 1000)
      .add(".intro .punta", { opacity: [0, 1], scale: [0.7, 1], ease: A.spring({ bounce: 0.4, duration: 450 }) }, 1080);
    bloquesIntro.forEach(function (bloque, i) {               // se prenden uno tras otro, con un parpadeo de luz
      lineaIntro.add(bloque, { fill: [apagado, encendidos[i]], opacity: [1, 0.35, 1, 0.6, 1], duration: 260, ease: "linear" }, 1220 + i * 110);
    });
    lineaIntro
      .add(".intro .ranura", { opacity: 0, duration: 140 }, 1740)
      .add(".intro .ib-ultimo", { opacity: [0, 1], scale: [0.6, 1], ease: A.spring({ bounce: 0.45, duration: 520 }) }, 1740)
      .add(".intro .onda", { opacity: [0.9, 0], scale: [1, 3.4], duration: 650 }, 1740)
      .call(correrTareas, 2450)
      .add("#intro", { y: ["0%", "-100%"], duration: 760, ease: "inOutQuart" }, 2500);
    intro.addEventListener("click", terminarIntro);
    setTimeout(terminarIntro, 4600);        // red de seguridad: la página nunca queda tapada
  } else if (intro && intro.parentNode) {
    intro.parentNode.removeChild(intro);
  }

  /* --------------------------------------------------------------
     6. Entrada de la portada, de arriba hacia abajo
     -------------------------------------------------------------- */
  var hayPortada = !!document.querySelector(".portada");
  var entrada = hayPortada ? A.createTimeline({ defaults: { ease: salida, duration: 900 }, autoplay: !conIntro }) : null;
  if (hayPortada && conIntro) {
    entrada.seek(0);                          // bajo la cortina, la portada espera en su punto de partida
    alTerminarIntro.push(function () { entrada.play(); });
  }
  if (hayPortada) entrada
    .add(piezas, { opacity: [0, 1], y: ["105%", "0%"], rotate: [4, 0], delay: A.stagger(80) }, 120)
    .add(".portada .entrada", { opacity: [0, 1], y: [18, 0] }, 480)
    .add(".portada .acciones .boton", { opacity: [0, 1], y: [16, 0], delay: A.stagger(80) }, 600)
    .add(".escena-grande .ventana", { opacity: [0, 1], y: [56, 0], scale: [0.985, 1], duration: 1150 }, 340)
    .add(".escena-grande .fono", { opacity: [0, 1], y: [44, 0], duration: 1000 }, 560)
    .add(".datos-sueltos .dato", { opacity: [0, 1], y: [16, 0], delay: A.stagger(90) }, 820);

  /* --------------------------------------------------------------
     8. Cada bloque aparece cuando entra en pantalla
     -------------------------------------------------------------- */
  var porRevelar = document.querySelectorAll(".revelar");
  if ("IntersectionObserver" in window) {
    var cola = [];
    var vaciando = null;
    var observador = new IntersectionObserver(function (entradas, obs) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        obs.unobserve(entrada.target);
        cola.push(entrada.target);
        clearTimeout(vaciando);
        vaciando = setTimeout(function () {
          var lote = cola.slice();
          cola.length = 0;
          // los del encabezado ya se ven desde el principio (velocidad percibida): solo se deslizan un poco
          var arriba = lote.filter(function (el) { return el.closest(".encabezado"); });
          var resto = lote.filter(function (el) { return !el.closest(".encabezado"); });
          if (arriba.length) A.animate(arriba, { y: [14, 0], duration: 760, delay: A.stagger(70), ease: salida });
          if (resto.length) A.animate(resto, { opacity: [0, 1], y: [26, 0], duration: 760, delay: A.stagger(70), ease: salida });
        }, 60);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    porRevelar.forEach(function (el) { observador.observe(el); });
  }

  /* --------------------------------------------------------------
     9. Cinta de rubros: avance continuo, sin cortes
     -------------------------------------------------------------- */
  var cinta = document.getElementById("cinta");
  if (cinta) {
    [].slice.call(cinta.children).forEach(function (pieza) {   // se duplica para que el bucle no tenga costura
      var copia = pieza.cloneNode(true);
      copia.setAttribute("aria-hidden", "true");
      cinta.appendChild(copia);
    });
    var marcha = A.animate(cinta, { x: ["0%", "-50%"], duration: 38000, loop: true, ease: "linear" });
    cinta.parentElement.addEventListener("pointerenter", function () { marcha.pause(); });
    cinta.parentElement.addEventListener("pointerleave", function () { marcha.play(); });
  }

  /* --------------------------------------------------------------
     10. Flujo de n8n: el pulso recorre los pasos, uno detrás de otro
     -------------------------------------------------------------- */
  var nodos = document.querySelectorAll(".nodo");
  if (nodos.length) {
    var pulso = A.createTimeline({ loop: true, defaults: { duration: 620, ease: salida } });
    nodos.forEach(function (nodo, i) {
      pulso
        .call(function () {
          nodos.forEach(function (otro) { otro.classList.remove("viva"); });
          nodo.classList.add("viva");
        }, i * 900)
        .add(nodo, { scale: [1, 1.022, 1] }, i * 900);
    });
    pulso.call(function () {
      nodos.forEach(function (otro) { otro.classList.remove("viva"); });
    }, nodos.length * 900 + 500);
  }

  /* --------------------------------------------------------------
     11. Botones magnéticos: siguen al cursor apenas un poco
     -------------------------------------------------------------- */
  document.querySelectorAll(".boton-principal, .pestana").forEach(function (boton) {
    var iman = A.createAnimatable(boton, { x: 420, y: 420, ease: salida });
    boton.addEventListener("pointermove", function (evento) {
      var caja = boton.getBoundingClientRect();
      iman.x((evento.clientX - caja.left - caja.width / 2) * 0.28);
      iman.y((evento.clientY - caja.top - caja.height / 2) * 0.34);
    });
    boton.addEventListener("pointerleave", function () { iman.x(0); iman.y(0); });
  });

  /* --------------------------------------------------------------
     12. Las tarjetas se inclinan apenas hacia el cursor
     -------------------------------------------------------------- */
  document.querySelectorAll(".tarjeta").forEach(function (tarjeta) {
    var giro = A.createAnimatable(tarjeta, { rotateX: 500, rotateY: 500, ease: salida });
    tarjeta.addEventListener("pointermove", function (evento) {
      var caja = tarjeta.getBoundingClientRect();
      var px = (evento.clientX - caja.left) / caja.width - 0.5;
      var py = (evento.clientY - caja.top) / caja.height - 0.5;
      giro.rotateX(py * -3);
      giro.rotateY(px * 4);
    });
    tarjeta.addEventListener("pointerleave", function () { giro.rotateX(0); giro.rotateY(0); });
  });

  /* --------------------------------------------------------------
     13. La escena de la portada sigue al cursor, por capas
     -------------------------------------------------------------- */
  var escenaGrande = document.querySelector(".escena-grande");
  if (escenaGrande && portada && window.matchMedia("(min-width: 900px)").matches) {
    portada.addEventListener("pointermove", function (evento) {
      var caja = portada.getBoundingClientRect();
      escenaGrande.style.setProperty("--px", (((evento.clientX - caja.left) / caja.width) - 0.5) * 2);
      escenaGrande.style.setProperty("--py", (((evento.clientY - caja.top) / caja.height) - 0.5) * 2);
    });
    portada.addEventListener("pointerleave", function () {
      escenaGrande.style.setProperty("--px", 0);
      escenaGrande.style.setProperty("--py", 0);
    });
  }

  /* --------------------------------------------------------------
     14. La constelación de bocetos se inclina hacia el cursor
     -------------------------------------------------------------- */
  var constelacion = document.getElementById("constelacion");
  if (constelacion && window.matchMedia("(min-width: 1000px)").matches) {
    var giroConstelacion = A.createAnimatable(constelacion, { rotateY: 900, rotateX: 900, ease: salida });
    var zonaConstelacion = constelacion.closest(".rubros-escenario") || constelacion;
    zonaConstelacion.addEventListener("pointermove", function (evento) {
      var caja = zonaConstelacion.getBoundingClientRect();
      giroConstelacion.rotateY((((evento.clientX - caja.left) / caja.width) - 0.5) * 9);
      giroConstelacion.rotateX((((evento.clientY - caja.top) / caja.height) - 0.5) * -7);
    });
    zonaConstelacion.addEventListener("pointerleave", function () {
      giroConstelacion.rotateY(0);
      giroConstelacion.rotateX(0);
    });
  }

  /* --------------------------------------------------------------
     15. Las frases grandes se encienden palabra por palabra al bajar
         (idea de fraxbit). Se parte el texto en palabras sin tocar las
         etiquetas de adentro (la cursiva, los separadores).
     -------------------------------------------------------------- */
  var partirEnPalabras = function (raizTexto) {
    var palabras = [];
    var recorrer = function (nodo) {
      [].slice.call(nodo.childNodes).forEach(function (hijo) {
        if (hijo.nodeType === 3) {
          var fragmento = document.createDocumentFragment();
          hijo.textContent.split(/(\s+)/).forEach(function (parte) {
            if (!parte) return;
            if (/^\s+$/.test(parte)) { fragmento.appendChild(document.createTextNode(parte)); return; }
            var palabra = document.createElement("span");
            palabra.className = "palabra";
            palabra.textContent = parte;
            fragmento.appendChild(palabra);
            palabras.push(palabra);
          });
          nodo.replaceChild(fragmento, hijo);
        } else if (hijo.nodeType === 1 && !hijo.classList.contains("sep")) {
          recorrer(hijo);
        }
      });
    };
    recorrer(raizTexto);
    return palabras;
  };
  var frasesQueEncienden = [].map.call(document.querySelectorAll("[data-iluminar]"), function (frase) {
    return { frase: frase, palabras: partirEnPalabras(frase) };
  });

  /* --------------------------------------------------------------
     16. El muro de bocetos: sus columnas se deslizan en sentidos
         opuestos mientras la sección pasa por la pantalla
     -------------------------------------------------------------- */
  var muro = document.getElementById("muro");
  var columnasMuro = muro ? [].slice.call(muro.querySelectorAll(".muro-columna")) : [];
  var recorridoMuro = [-70, 70, -45];

  var alBajar = function () {
    var altoVentana = window.innerHeight;
    frasesQueEncienden.forEach(function (grupo) {
      var caja = grupo.frase.getBoundingClientRect();
      // empieza cuando la frase asoma por abajo y termina cuando llega a un tercio de la pantalla
      var avance = (altoVentana * 0.92 - caja.top) / (caja.height + altoVentana * 0.4);
      var encendidas = Math.round(Math.max(0, Math.min(1, avance)) * grupo.palabras.length);
      grupo.palabras.forEach(function (palabra, i) { palabra.classList.toggle("encendida", i < encendidas); });
    });
    if (columnasMuro.length) {
      var cajaMuro = muro.getBoundingClientRect();
      var paso = Math.max(0, Math.min(1, (altoVentana - cajaMuro.top) / (altoVentana + cajaMuro.height))) - 0.5;
      columnasMuro.forEach(function (columna, i) {
        columna.style.transform = "translate3d(0," + (paso * 2 * recorridoMuro[i % recorridoMuro.length]).toFixed(1) + "px,0)";
      });
    }
  };
  if (frasesQueEncienden.length || columnasMuro.length) {
    var cuadroPedido = false;
    window.addEventListener("scroll", function () {
      if (cuadroPedido) return;
      cuadroPedido = true;
      requestAnimationFrame(function () { cuadroPedido = false; alBajar(); });
    }, { passive: true });
    window.addEventListener("resize", alBajar);
    alBajar();
  }

  /* --------------------------------------------------------------
     17. Las cabeceras vivas de Servicios, Automatizaciones, Bocetos y
         Nosotros. La palabra clave del título se cubre con su bloque de
         tinta, y el dibujo se arma y después explica la página en un
         bucle corto, con su leyenda abajo. Solo se mueve mientras la
         cabecera está a la vista. Si hay intro, espera a que termine.
     -------------------------------------------------------------- */
  var alAcabarIntro = function (tarea) { if (introTerminada) tarea(); else alTerminarIntro.push(tarea); };
  var resaltes = document.querySelectorAll(".resalte");
  if (resaltes.length) {
    alAcabarIntro(function () {
      [].forEach.call(resaltes, function (palabra) { palabra.classList.add("barrido"); });
    });
  }

  var dibujo = document.querySelector(".dibujo[data-dibujo]");
  if (dibujo && "IntersectionObserver" in window) {
    var enDibujo = function (sel, base) { return [].slice.call((base || dibujo).querySelectorAll(sel)); };
    var textoPie = dibujo.querySelector(".dibujo-texto");
    var pasosPie = enDibujo(".dibujo-pasos i");
    var vaiven = A.cubicBezier(0.77, 0, 0.175, 1);
    var resorte = A.spring({ bounce: 0.4, duration: 560 });
    var armadoListo = false, aLaVista = false, arrancado = false;
    var armado = A.createTimeline({
      autoplay: false, defaults: { ease: salida },
      onComplete: function () { armadoListo = true; if (aLaVista) bucle.play(); }
    });
    var bucle = A.createTimeline({ autoplay: false, loop: true, defaults: { ease: salida } });

    // la leyenda: cambia el texto y prende los pasos hasta el actual
    var leyenda = function (paso, texto) {
      return function () {
        pasosPie.forEach(function (marca, i) { marca.classList.toggle("activo", i <= paso); });
        textoPie.textContent = texto;
        A.animate(textoPie, { opacity: [0, 1], x: [-8, 0], duration: 380, ease: salida });
      };
    };
    // un punto que viaja por una ruta del dibujo; se mueve con cx/cy porque la ruta puede estar escalada
    var recorrer = function (punto, ruta, en, duracion, alReves) {
      var largo = ruta.getTotalLength();
      var avance = { t: 0 };
      bucle
        .add(punto, { opacity: [0, 1], duration: 120 }, en)
        .add(avance, {
          t: [0, 1], duration: duracion, ease: vaiven,
          onUpdate: function () {
            var p = ruta.getPointAtLength((alReves ? 1 - avance.t : avance.t) * largo);
            punto.setAttribute("cx", p.x.toFixed(3));
            punto.setAttribute("cy", p.y.toFixed(3));
          }
        }, en)
        .add(punto, { opacity: [1, 0], duration: 140 }, en + duracion - 90);
    };
    var aparecer = function (lista, en) {
      bucle.add(lista, { opacity: [0, 1], scale: [0.9, 1], duration: 480, delay: A.stagger(60) }, en);
    };
    var irse = function (lista, en) {
      bucle.add(lista, { opacity: [1, 0], scale: [1, 0.96], duration: 240, delay: A.stagger(22) }, en);
    };
    var tipo = dibujo.getAttribute("data-dibujo");

    if (tipo === "servicios") {
      // la ventana arma los cuatro niveles de web; el último suma la conversación automática
      var niveles = enDibujo("[data-nivel]").map(function (grupo) {
        grupo.setAttribute("opacity", "1");
        return [].slice.call(grupo.children);
      });
      var insignia = dibujo.querySelector(".d-insignia");
      var tarjeta = dibujo.querySelector(".d-tarjeta");
      var sin = function (lista, aparte) { return lista.filter(function (el) { return el !== aparte; }); };
      armado.add(enDibujo("[data-entra]"), { opacity: [0, 1], scale: [0.95, 1], duration: 640 }, 0);
      bucle.call(leyenda(0, "01 · Landing Page"), 0);
      aparecer(niveles[0], 0);
      irse(niveles[0], 2700);
      bucle.call(leyenda(1, "02 · Pedidos"), 3000);
      aparecer(sin(niveles[1], insignia), 3000);
      bucle.add(insignia, { opacity: [0, 1], scale: [0.4, 1], ease: resorte }, 3500);
      irse(niveles[1], 5700);
      bucle.call(leyenda(2, "03 · Tienda"), 6000);
      aparecer(sin(niveles[2], tarjeta), 6000);
      bucle.add(tarjeta, { opacity: [0, 1], x: [36, 0], ease: resorte }, 6400);
      bucle.call(leyenda(3, "04 · Piloto automático"), 8600)
        .add(".d-burbuja", { opacity: [0, 1], scale: [0.6, 1], ease: resorte }, 8600)
        .add(".d-chispa", { opacity: [0, 1], scale: [0.3, 1], rotate: [-30, 0], ease: resorte }, 8850);
      [9200, 9800, 10400].forEach(function (en) {   // "escribiendo...": los tres puntos saltan
        bucle.add(".d-punto", { y: [0, -6, 0], duration: 460, delay: A.stagger(110), ease: vaiven }, en);
      });
      irse(niveles[2].concat(niveles[3]), 11300);
      bucle.call(function () {}, 11800);

    } else if (tipo === "automatizaciones") {
      // el flujo de siempre, ahora con el mensaje que lo recorre: entra, la IA responde y se reparte en dos
      var nodos = enDibujo(".d-nodo");
      var luces = nodos.map(function (nodo) { return nodo.querySelector(".d-luz"); });
      var ondas = nodos.map(function (nodo) { return nodo.querySelector(".d-onda"); });
      var senales = enDibujo(".d-senal");
      var avisos = enDibujo(".d-aviso");     // lo que hace cada paso: mensaje, IA, pedido anotado y aviso
      var encender = function (i, en) {
        bucle
          .add(luces[i], { opacity: [0, 1], scale: [0.3, 1], ease: resorte }, en)
          .add(ondas[i], { opacity: [0.9, 0], scale: [1, 2.1], duration: 820 }, en)
          .add(avisos[i], { opacity: [0, 1], scale: [0.4, 1], ease: resorte }, en + 120);
      };
      armado
        .add(nodos, { opacity: [0, 1], scale: [0.4, 1], ease: resorte, delay: A.stagger(120) }, 0)
        .add(".d-cables", { opacity: [0, 1], duration: 60 }, 140)
        .add(A.createDrawable(enDibujo(".d-cable")), { draw: ["0 0", "0 1"], duration: 680, ease: vaiven }, 140);
      bucle.call(leyenda(0, "Llega un mensaje"), 0);
      encender(0, 0);
      recorrer(senales[0], document.getElementById("ruta-ab"), 480, 720);
      bucle.call(leyenda(1, "La IA lo responde"), 1200);
      encender(1, 1200);
      recorrer(senales[0], document.getElementById("ruta-bc"), 1850, 880);
      recorrer(senales[1], document.getElementById("ruta-bd"), 1850, 760);
      bucle.call(leyenda(2, "Anota el pedido y te avisa"), 2610);
      encender(3, 2610);
      encender(2, 2730);
      bucle.add(luces.concat(avisos), { opacity: [1, 0], scale: [1, 0.5], duration: 380 }, 5200);
      bucle.call(function () {}, 5900);

    } else if (tipo === "bocetos") {
      // cada estilo se dibuja primero a lápiz y después se entinta: repostería, clínica y gimnasio
      var capaLapiz = dibujo.querySelector(".d-trazos");
      var ESTILOS = ["Repostería · editorial", "Clínica dental · limpio", "Gimnasio · oscuro"];
      var estilos = enDibujo(".d-estilo").map(function (grupo) {
        grupo.setAttribute("opacity", "1");
        var lapiz = document.createElementNS("http://www.w3.org/2000/svg", "g");   // el contorno de cada forma
        lapiz.setAttribute("clip-path", "url(#d-pantalla)");
        lapiz.setAttribute("opacity", "0");
        enDibujo("rect, circle, path", grupo).forEach(function (forma) {
          var copia = forma.cloneNode(false);
          copia.setAttribute("class", "d-trazo");
          lapiz.appendChild(copia);
        });
        capaLapiz.appendChild(lapiz);
        return { lapiz: lapiz, trazos: A.createDrawable([].slice.call(lapiz.children)), piezas: [].slice.call(grupo.children) };
      });
      var adornos = enDibujo(".d-adorno").map(function (grupo) {   // la letra del estilo y el rubro, a los lados
        grupo.setAttribute("opacity", "1");
        return [].slice.call(grupo.children);
      });
      armado.add(enDibujo("[data-entra]"), { opacity: [0, 1], scale: [0.95, 1], duration: 640 }, 0);
      var PASO = 4600;
      estilos.forEach(function (estilo, i) {
        var T = i * PASO;
        bucle.call(leyenda(i, ESTILOS[i]), T)
          .set(estilo.trazos, { draw: "0 0" }, T)
          .add(estilo.lapiz, { opacity: [0, 1], duration: 80 }, T + 20)
          .add(estilo.trazos, { draw: ["0 0", "0 1"], duration: 900, delay: A.stagger(45), ease: vaiven }, T + 20)
          .add(estilo.piezas, { opacity: [0, 1], scale: [0.94, 1], duration: 420, delay: A.stagger(55) }, T + 900)
          .add(adornos[i], { opacity: [0, 1], scale: [0.5, 1], ease: resorte, delay: A.stagger(140) }, T + 1150)
          .add(estilo.lapiz, { opacity: [1, 0], duration: 500 }, T + 2000)
          .add(estilo.piezas.concat(adornos[i]), { opacity: [1, 0], duration: 260, delay: A.stagger(18) }, T + PASO - 450);
      });
      bucle.call(function () {}, 3 * PASO);

    } else if (tipo === "nosotros") {
      // los cuatro socios se prenden uno a uno con el color de su bloque del logo y le pasan la señal al centro
      var socios = enDibujo(".d-socio");
      var lucesSocios = socios.map(function (socio) { return socio.querySelector(".d-luz"); });
      var ondasSocios = socios.map(function (socio) { return socio.querySelector(".d-onda-cuadro"); });
      var radios = enDibujo(".d-radio");
      var senalCentro = dibujo.querySelector(".d-senal-grande");
      var centro = dibujo.querySelector(".d-centro");
      var SOCIOS = ["Juan Diego · Desarrollo y Marca", "Iker · Desarrollo", "Joaquín · Gerencia y Clientes", "Luis Felipe · Gerencia y Clientes"];
      armado
        .add(centro, { opacity: [0, 1], scale: [0.4, 1], ease: resorte }, 0)
        .add(".d-radios", { opacity: [0, 1], duration: 60 }, 160)
        .add(A.createDrawable(radios), { draw: ["0 0", "0 1"], duration: 560, ease: vaiven }, 160)
        .add(socios, { opacity: [0, 1], scale: [0.5, 1], ease: resorte, delay: A.stagger(90) }, 420);
      socios.forEach(function (socio, i) {
        var T = i * 1800;
        bucle.call(leyenda(i, SOCIOS[i]), T)
          .add(lucesSocios[i], { opacity: [0, 1], scale: [0.4, 1], ease: resorte }, T)
          .add(ondasSocios[i], { opacity: [0.8, 0], scale: [1, 1.4], duration: 820 }, T);
        recorrer(senalCentro, radios[i], T + 280, 640, true);
        bucle.add(centro, { scale: [1, 1.12, 1], duration: 460 }, T + 900);
      });
      var FINAL = 4 * 1800;
      bucle.call(leyenda(3, "Un solo equipo"), FINAL)
        .add(ondasSocios, { opacity: [0.8, 0], scale: [1, 1.4], duration: 900 }, FINAL)
        .add(centro, { scale: [1, 1.18, 1], duration: 620 }, FINAL)
        .add(lucesSocios, { opacity: [1, 0], scale: [1, 0.6], duration: 420 }, FINAL + 2600)
        .call(function () {}, FINAL + 3200);
    }

    var arrancar = function () {
      if (arrancado) return;
      arrancado = true;
      armado.play();
    };
    new IntersectionObserver(function (entradas) {
      aLaVista = entradas[0].isIntersecting;
      if (aLaVista && !arrancado) alAcabarIntro(arrancar);
      if (!armadoListo) return;
      if (aLaVista) bucle.play(); else bucle.pause();
    }).observe(dibujo);
  }

  /* --------------------------------------------------------------
     18. Cambio de página (idea de fraxbit.com): al ir a otra sección de
         la web sube una cortina de tinta con el color del destino en el
         borde, el logo se enciende como en la intro y el nombre del
         destino se descifra al centro, en grande. En la página nueva,
         inicio.js deja la cortina puesta desde el primer cuadro y el CSS
         la levanta. Al volver con "atrás", la página se descubre igual.
     -------------------------------------------------------------- */
  var PAGINAS_WEB = window.CREAX_PAGINAS || {};
  var raizWeb = new URL(".", document.baseURI).pathname;      // la carpeta de la web: "/" o "/creax-web/"
  var destinoDe = function (enlace) {
    if (!enlace || !enlace.href || enlace.target === "_blank" || enlace.hasAttribute("download")) return null;
    var url = new URL(enlace.href, location.href);
    if (url.origin !== location.origin) return null;
    var carpeta = url.pathname.slice(0, url.pathname.lastIndexOf("/") + 1);
    var archivo = url.pathname.slice(carpeta.length);
    if (carpeta !== raizWeb || !Object.prototype.hasOwnProperty.call(PAGINAS_WEB, archivo)) return null;
    if (url.pathname === location.pathname && url.search === location.search) return null;   // un ancla de esta misma página
    return { url: url.href, pagina: PAGINAS_WEB[archivo] };
  };
  var saliendo = false;
  var armarCortina = function (pagina) {
    var capa = document.createElement("div");
    capa.className = "transicion";
    capa.setAttribute("aria-hidden", "true");
    capa.style.setProperty("--transicion-color", pagina.color);
    capa.style.setProperty("--transicion-letras", String(pagina.palabra.length));
    // el logo de bloques, como en la intro: nace apagado y se enciende
    capa.innerHTML = '<div class="transicion-panel"></div><div class="transicion-centro"><div class="transicion-pila">' +
      '<svg class="transicion-logo" viewBox="0 0 96 96">' +
      '<rect class="tb" x="8" y="8" width="24" height="24" rx="7" fill="#2B2B2B"/>' +
      '<rect class="tb" x="64" y="8" width="24" height="24" rx="7" fill="#2B2B2B"/>' +
      '<rect class="tb" x="36" y="36" width="24" height="24" rx="7" fill="#2B2B2B"/>' +
      '<rect class="tb" x="8" y="64" width="24" height="24" rx="7" fill="#2B2B2B"/>' +
      '<rect class="tb-ultimo" x="64" y="64" width="24" height="24" rx="7" fill="#C5F82A"/>' +
      '</svg><p class="transicion-palabra"></p></div></div>';
    var palabra = capa.querySelector(".transicion-palabra");
    pagina.palabra.split("").forEach(function (letra) {
      var caja = document.createElement("span");
      caja.textContent = letra;
      palabra.appendChild(caja);
    });
    return capa;
  };
  var salirHacia = function (destino) {
    if (saliendo) return;
    saliendo = true;
    try {
      sessionStorage.setItem("creax-transicion", JSON.stringify({ palabra: destino.pagina.palabra, color: destino.pagina.color, t: Date.now() }));
    } catch (e) { /* sin memoria de sesión: la página nueva entra sin cortina */ }
    var capa = armarCortina(destino.pagina);
    document.body.appendChild(capa);
    var letras = [].slice.call(capa.querySelectorAll(".transicion-palabra span"));
    var reales = letras.map(function (s) { return s.textContent; });
    // cada letra con su ancho fijo: así la palabra no tiembla mientras se descifra
    letras.forEach(function (s) { s.style.width = s.getBoundingClientRect().width + "px"; });
    var bloques = [].slice.call(capa.querySelectorAll(".tb"));
    var encendidos = ["#FF7A59", "#B9A6FF", "#F4F4F2", "#FFD84D"];
    var signos = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789#&%";
    var mezcla = { avance: 0 };
    var yaSalio = false;
    var irse = function () { if (yaSalio) return; yaSalio = true; location.href = destino.url; };
    var linea = A.createTimeline({ defaults: { ease: salida }, onComplete: irse })
      .add(capa.querySelector(".transicion-panel"), { y: ["100%", "0%"], duration: 560, ease: "inOutQuart" }, 0)
      .add(letras, { y: ["110%", "0%"], duration: 520, delay: A.stagger(26) }, 300)
      .add(mezcla, {
        avance: 1, duration: 520, ease: "linear",
        onUpdate: function () {
          letras.forEach(function (s, i) {
            if (mezcla.avance >= 0.3 + (i / letras.length) * 0.6) { s.textContent = reales[i]; return; }
            var paso = Math.floor(mezcla.avance * 14);          // cambia de signo unas 14 veces, no en cada cuadro
            if (s.__paso !== paso) { s.__paso = paso; s.textContent = signos.charAt(Math.floor(Math.random() * signos.length)); }
          });
        },
        onComplete: function () { letras.forEach(function (s, i) { s.textContent = reales[i]; }); }
      }, 300);
    bloques.forEach(function (bloque, i) {                     // se prenden uno tras otro, con un parpadeo de luz
      linea.add(bloque, { fill: ["#2B2B2B", encendidos[i]], opacity: [1, 0.35, 1, 0.6, 1], duration: 240, ease: "linear" }, 240 + i * 80);
    });
    linea
      .add(capa.querySelector(".tb-ultimo"), { opacity: [0, 1], scale: [0.6, 1], ease: A.spring({ bounce: 0.45, duration: 480 }) }, 560)
      .add(capa.querySelector(".transicion-logo"), { opacity: [1, 0], y: [0, -10], duration: 200 }, 880)
      .call(function () {}, 1040);
    setTimeout(irse, 1700);                                     // red de seguridad: igual se va aunque la animación no termine
  };
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var destino = destinoDe(e.target.closest ? e.target.closest("a[href]") : null);
    if (!destino) return;
    e.preventDefault();
    salirHacia(destino);
  });
  // la página de destino se pide apenas el cursor o el foco llegan al enlace: así el cambio es inmediato
  var precargadas = {};
  var precargar = function (e) {
    var destino = destinoDe(e.target.closest ? e.target.closest("a[href]") : null);
    if (!destino || precargadas[destino.url]) return;
    precargadas[destino.url] = true;
    var pista = document.createElement("link");
    pista.rel = "prefetch";
    pista.href = destino.url;
    document.head.appendChild(pista);
  };
  document.addEventListener("pointerover", precargar, { passive: true });
  document.addEventListener("focusin", precargar);
  // al volver con "atrás", el navegador puede traer la página tal como quedó: con la cortina puesta
  window.addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    var capa = document.querySelector(".transicion");
    if (capa) capa.parentNode.removeChild(capa);
    saliendo = false;
    var pagina = PAGINAS_WEB[location.pathname.slice(location.pathname.lastIndexOf("/") + 1)];
    if (pagina && window.CREAX_ENTRAR) window.CREAX_ENTRAR(pagina);
  });
})();

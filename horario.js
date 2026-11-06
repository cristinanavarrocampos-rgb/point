(function () {
  'use strict';

  var TELEFONO = '34617653224';
  var CONFIRMADO = { anio: 2026, mes: 10 }; // mes del horario publicado (enero = 0). Cámbialo al actualizar el horario.
  var ULTIMO = { anio: 2100, mes: 11 }; // el calendario llega hasta diciembre de 2100
  var NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var NOMBRES_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var CLAVE_COOKIES = 'iyp-cookies';
  var DOCE_MESES = 365 * 24 * 60 * 60 * 1000;

  function $(selector, raiz) { return (raiz || document).querySelector(selector); }
  function $$(selector, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(selector)); }

  /* WhatsApp: abre la app directamente en el móvil y WhatsApp Web en el ordenador. */
  function esMovil() {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function abrirWhatsApp(texto) {
    var mensaje = encodeURIComponent(texto || '');
    if (!esMovil()) {
      window.open('https://web.whatsapp.com/send?phone=' + TELEFONO + '&text=' + mensaje, '_blank', 'noopener');
      return;
    }
    var respaldo = setTimeout(function () {
      if (!document.hidden) window.location.href = 'https://wa.me/' + TELEFONO + '?text=' + mensaje;
    }, 1500);
    function cancelar() { clearTimeout(respaldo); }
    document.addEventListener('visibilitychange', cancelar, { once: true });
    window.addEventListener('pagehide', cancelar, { once: true });
    window.location.href = 'whatsapp://send?phone=' + TELEFONO + '&text=' + mensaje;
  }

  document.addEventListener('click', function (evento) {
    var enlace = evento.target.closest ? evento.target.closest('[data-wa]') : null;
    if (!enlace) return;
    evento.preventDefault();
    abrirWhatsApp(enlace.getAttribute('data-wa'));
  });

  /* Menú móvil */
  var menuBtn = $('.menu-btn');
  var nav = $('#nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var abierto = nav.classList.toggle('abierto');
      menuBtn.setAttribute('aria-expanded', String(abierto));
      menuBtn.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    });
    nav.addEventListener('click', function (evento) {
      if (evento.target.tagName === 'A') {
        nav.classList.remove('abierto');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'Abrir menú');
      }
    });
  }

  /* Horario: la tabla semanal es la única fuente de datos. */
  function leerSemana() {
    var semana = {};
    $$('#semana .dia').forEach(function (dia) {
      semana[dia.getAttribute('data-dia')] = $$('li', dia).map(function (fila) {
        var prof = $('.prof', fila);
        return {
          clave: fila.getAttribute('data-clase'),
          hora: fila.getAttribute('data-hora'),
          nombre: $('.nombre', fila).textContent,
          prof: prof ? prof.textContent : ''
        };
      });
    });
    return semana;
  }

  function pintarHorasDeClases(semana) {
    var abreviado = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie' };
    $$('[data-horas]').forEach(function (destino) {
      var clave = destino.getAttribute('data-horas');
      var horas = [];
      Object.keys(semana).forEach(function (dia) {
        semana[dia].forEach(function (clase) {
          if (clase.clave === clave) horas.push(abreviado[dia] + ' ' + clase.hora);
        });
      });
      destino.textContent = horas.join(' · ');
    });
  }

  // Fecha actual en Ibiza, para que el cambio de día no dependa del país del visitante.
  function fechaDeHoy() {
    var partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()).split('-');
    return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  }

  function iniciarCalendario() {
    var rejilla = $('#calendario');
    var detalle = $('#detalle');
    if (!rejilla || !detalle) return;

    var semana = leerSemana();
    pintarHorasDeClases(semana);

    var hoy = fechaDeHoy();
    var titulo = $('#cal-titulo');
    var selectorMes = $('#cal-mes');
    var selectorAnio = $('#cal-anio');
    var anterior = $('#cal-anterior');
    var siguiente = $('#cal-siguiente');
    var botonHoy = $('#cal-hoy');
    var aviso = $('#aviso-mes');

    function indice(anio, mes) { return anio * 12 + mes; }
    var indiceHoy = indice(hoy.getFullYear(), hoy.getMonth());
    var minimo = Math.max(indice(CONFIRMADO.anio, CONFIRMADO.mes), indiceHoy);
    var maximo = indice(ULTIMO.anio, ULTIMO.mes);
    var vista = Math.min(minimo, maximo);

    function rellenarAnios() {
      selectorAnio.innerHTML = '';
      for (var a = Math.floor(Math.min(minimo, maximo) / 12); a <= ULTIMO.anio; a++) {
        selectorAnio.add(new Option(String(a), String(a)));
      }
    }
    rellenarAnios();
    NOMBRES_MES.forEach(function (nombre, i) {
      selectorMes.add(new Option(nombre.charAt(0).toUpperCase() + nombre.slice(1), String(i)));
    });

    function fechaEnTexto(fecha) {
      var texto = NOMBRES_DIA[fecha.getDay()] + ' ' + fecha.getDate() + ' de ' + NOMBRES_MES[fecha.getMonth()];
      return fecha.getFullYear() === hoy.getFullYear() ? texto : texto + ' de ' + fecha.getFullYear();
    }

    function pintarDetalle(fecha) {
      var texto = fechaEnTexto(fecha);
      detalle.innerHTML = '';
      var h3 = document.createElement('h3');
      h3.textContent = texto.charAt(0).toUpperCase() + texto.slice(1);
      detalle.appendChild(h3);
      var lista = document.createElement('ul');
      semana[fecha.getDay()].forEach(function (clase) {
        var fila = document.createElement('li');
        var info = document.createElement('div');
        var hora = document.createElement('time');
        hora.style.cssText = 'display:block;font:600 1rem/1.2 var(--label);color:var(--oxido)';
        hora.textContent = clase.hora;
        var nombre = document.createElement('b');
        nombre.textContent = clase.nombre + (clase.prof ? ' · ' + clase.prof : '');
        info.appendChild(hora);
        info.appendChild(nombre);
        var reservar = document.createElement('a');
        reservar.className = 'btn btn-wa';
        reservar.href = 'https://wa.me/' + TELEFONO;
        reservar.textContent = 'Reservar por WhatsApp';
        reservar.setAttribute('data-wa', 'Hola, quiero reservar ' + clase.nombre + ' el ' + texto + ' a las ' + clase.hora + '.');
        fila.appendChild(info);
        fila.appendChild(reservar);
        lista.appendChild(fila);
      });
      detalle.appendChild(lista);
    }

    function pintarSinClases() {
      detalle.innerHTML = '';
      var h3 = document.createElement('h3');
      h3.textContent = 'Sin clases este mes';
      var texto = document.createElement('p');
      texto.textContent = 'Ya no quedan clases en este mes. Escríbenos y te contamos el horario.';
      var boton = document.createElement('a');
      boton.className = 'btn btn-wa';
      boton.href = 'https://wa.me/' + TELEFONO;
      boton.textContent = 'Preguntar por WhatsApp';
      boton.setAttribute('data-wa', 'Hola, ¿me podéis pasar el horario de clases?');
      detalle.appendChild(h3);
      detalle.appendChild(texto);
      detalle.appendChild(boton);
    }

    function pintarMes() {
      var anio = Math.floor(vista / 12);
      var mes = vista % 12;
      var ultimoDia = new Date(anio, mes + 1, 0).getDate();
      var primerDiaSemana = (new Date(anio, mes, 1).getDay() + 6) % 7;
      var nombreMes = NOMBRES_MES[mes];

      titulo.textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1) + ' de ' + anio;
      rejilla.setAttribute('aria-label', 'Calendario de ' + nombreMes + ' de ' + anio + '. Elige un día para ver sus clases.');
      selectorAnio.value = String(anio);
      selectorMes.value = String(mes);
      $$('option', selectorMes).forEach(function (opcion, i) {
        var valor = indice(anio, i);
        opcion.disabled = valor < minimo || valor > maximo;
      });
      anterior.disabled = vista <= minimo;
      siguiente.disabled = vista >= maximo;
      botonHoy.disabled = vista === Math.min(minimo, maximo);
      aviso.hidden = vista === indice(CONFIRMADO.anio, CONFIRMADO.mes);

      rejilla.innerHTML = '';
      ['L', 'M', 'X', 'J', 'V', 'S', 'D'].forEach(function (letra) {
        var cabecera = document.createElement('div');
        cabecera.className = 'cal-cab';
        cabecera.textContent = letra;
        cabecera.setAttribute('aria-hidden', 'true');
        rejilla.appendChild(cabecera);
      });
      for (var h = 0; h < primerDiaSemana; h++) {
        var hueco = document.createElement('div');
        hueco.className = 'cal-hueco';
        rejilla.appendChild(hueco);
      }

      var botones = [];
      function seleccionar(boton, fecha) {
        botones.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        boton.setAttribute('aria-pressed', 'true');
        pintarDetalle(fecha);
      }

      var inicial = null;
      for (var d = 1; d <= ultimoDia; d++) {
        (function (numero) {
          var fecha = new Date(anio, mes, numero);
          var clases = semana[fecha.getDay()];
          var boton = document.createElement('button');
          boton.type = 'button';
          boton.className = 'cal-dia';
          boton.textContent = numero;
          boton.setAttribute('aria-label', numero + ' de ' + nombreMes + ', ' + NOMBRES_DIA[fecha.getDay()] + (clases ? ', ' + clases.length + ' clases' : ', sin clases'));
          if (fecha.getTime() === hoy.getTime()) {
            boton.classList.add('hoy');
            boton.setAttribute('aria-current', 'date');
          }
          var pasado = fecha < hoy;
          if (clases && !pasado) {
            boton.classList.add('activo');
            boton.appendChild(document.createElement('i'));
            boton.setAttribute('aria-pressed', 'false');
            boton.addEventListener('click', function () { seleccionar(boton, fecha); });
            botones.push(boton);
            if (!inicial) inicial = { boton: boton, fecha: fecha };
          } else {
            boton.disabled = true;
            if (pasado) boton.classList.add('pasado');
          }
          rejilla.appendChild(boton);
        })(d);
      }

      if (inicial) seleccionar(inicial.boton, inicial.fecha);
      else pintarSinClases();
    }

    function irA(valor) {
      vista = Math.max(Math.min(minimo, maximo), Math.min(maximo, valor));
      pintarMes();
    }

    anterior.addEventListener('click', function () { irA(vista - 1); });
    siguiente.addEventListener('click', function () { irA(vista + 1); });
    botonHoy.addEventListener('click', function () { irA(minimo); });
    selectorMes.addEventListener('change', function () { irA(indice(Number(selectorAnio.value), Number(selectorMes.value))); });
    selectorAnio.addEventListener('change', function () { irA(indice(Number(selectorAnio.value), Number(selectorMes.value))); });

    function pintarHoy() {
      $$('#semana .dia').forEach(function (dia) {
        dia.classList.toggle('hoy', Number(dia.getAttribute('data-dia')) === hoy.getDay());
      });
    }

    // Renueva la fecha, el horario y el calendario en cuanto cambia el día.
    function comprobarDia() {
      var nueva = fechaDeHoy();
      if (nueva.getTime() === hoy.getTime()) return;
      var enMesActual = vista === Math.min(minimo, maximo);
      hoy = nueva;
      indiceHoy = indice(hoy.getFullYear(), hoy.getMonth());
      minimo = Math.max(indice(CONFIRMADO.anio, CONFIRMADO.mes), indiceHoy);
      if (enMesActual || vista < minimo) vista = Math.min(minimo, maximo);
      rellenarAnios();
      pintarHoy();
      pintarMes();
    }

    setInterval(comprobarDia, 60000);
    document.addEventListener('visibilitychange', comprobarDia);
    window.addEventListener('focus', comprobarDia);
    window.addEventListener('pageshow', comprobarDia);

    pintarHoy();
    pintarMes();
  }

  /* Galería */
  function iniciarGaleria() {
    var visor = $('#visor');
    var rejilla = $('#galeria-grid');
    if (!visor || !rejilla) return;
    if (typeof visor.showModal !== 'function') return;
    var imagen = $('img', visor);
    var pie = $('.visor-pie', visor);
    rejilla.addEventListener('click', function (evento) {
      var boton = evento.target.closest('button');
      if (!boton) return;
      var original = $('img', boton);
      imagen.src = original.src;
      imagen.alt = original.alt;
      pie.textContent = original.alt;
      visor.showModal();
    });
    $('.visor-cerrar', visor).addEventListener('click', function () { visor.close(); });
    visor.addEventListener('click', function (evento) {
      if (evento.target === visor) visor.close();
    });
    $$('#galeria-grid button').forEach(function (boton) {
      boton.setAttribute('aria-label', 'Ampliar foto: ' + $('img', boton).alt);
    });
  }

  /* Solo un vídeo a la vez */
  function iniciarVideos() {
    var videos = $$('.videos video');
    videos.forEach(function (video) {
      video.addEventListener('play', function () {
        videos.forEach(function (otro) { if (otro !== video) otro.pause(); });
      });
    });
  }

  /* Cookies */
  function leerConsentimiento() {
    try {
      var guardado = JSON.parse(localStorage.getItem(CLAVE_COOKIES));
      if (guardado && Date.now() - guardado.fecha < DOCE_MESES) return guardado;
    } catch (error) { /* almacenamiento no disponible: se vuelve a preguntar */ }
    return null;
  }

  function guardarConsentimiento(externos) {
    try {
      localStorage.setItem(CLAVE_COOKIES, JSON.stringify({ externos: externos, fecha: Date.now() }));
    } catch (error) { /* la elección vale para esta visita */ }
  }

  function cargarMapa() {
    var mapa = $('#mapa');
    if (!mapa || mapa.classList.contains('cargado')) return;
    mapa.classList.add('cargado');
    mapa.innerHTML = '';
    var marco = document.createElement('iframe');
    marco.title = 'Mapa de Ibiza Yoga Point en Santa Eulalia del Río';
    marco.loading = 'lazy';
    marco.referrerPolicy = 'no-referrer-when-downgrade';
    marco.src = 'https://www.google.com/maps?q=Carrer+Pintor+Laureano+Barrau+5,+07840+Santa+Eulalia+del+Rio&output=embed';
    mapa.appendChild(marco);
  }

  function iniciarCookies() {
    var banner = $('.cookies');
    if (!banner) return;
    var opciones = $('#cookies-opciones');
    var casilla = $('#cookies-externos');
    var configurar = $('[data-cookies="configurar"]');

    function ajustarBoton() {
      document.documentElement.style.setProperty('--alto-banner', (banner.offsetHeight + 14) + 'px');
    }
    function mostrar() {
      var actual = leerConsentimiento();
      casilla.checked = !!(actual && actual.externos);
      banner.hidden = false;
      document.body.classList.add('con-banner');
      ajustarBoton();
    }
    function ocultar() {
      banner.hidden = true;
      opciones.hidden = true;
      configurar.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('con-banner');
    }
    function decidir(externos) {
      var anterior = leerConsentimiento();
      guardarConsentimiento(externos);
      ocultar();
      if (externos) {
        cargarMapa();
      } else if (anterior && anterior.externos && $('#mapa')) {
        window.location.reload();
      }
    }

    banner.addEventListener('click', function (evento) {
      var accion = evento.target.getAttribute && evento.target.getAttribute('data-cookies');
      if (accion === 'aceptar') decidir(true);
      if (accion === 'rechazar') decidir(false);
      if (accion === 'guardar') decidir(casilla.checked);
      if (accion === 'configurar') {
        opciones.hidden = !opciones.hidden;
        configurar.setAttribute('aria-expanded', String(!opciones.hidden));
        ajustarBoton();
      }
    });
    $$('[data-abrir-cookies]').forEach(function (boton) { boton.addEventListener('click', mostrar); });
    window.addEventListener('resize', function () { if (!banner.hidden) ajustarBoton(); });

    var botonMapa = $('#mapa-btn');
    if (botonMapa) botonMapa.addEventListener('click', function () { decidir(true); });

    var consentimiento = leerConsentimiento();
    if (!consentimiento) mostrar();
    else if (consentimiento.externos) cargarMapa();
  }

  iniciarCalendario();
  iniciarGaleria();
  iniciarVideos();
  iniciarCookies();
})();

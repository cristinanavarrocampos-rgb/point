(function () {
  var principal = document.getElementById('contenido');
  var legal = document.getElementById('pagina-legal');
  function mostrar() {
    var id = location.hash.slice(1);
    var enLegal = id.indexOf('legal-') === 0;
    legal.hidden = !enLegal;
    principal.hidden = enLegal;
    var destino = id && document.getElementById(id);
    if (destino) destino.scrollIntoView();
  }
  window.addEventListener('hashchange', mostrar);
  if (location.hash) mostrar();
})();

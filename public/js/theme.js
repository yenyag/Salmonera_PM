// Tema claro/oscuro según la preferencia guardada en el perfil del usuario.
// Escucha el evento 'usuario-actualizado' (emitido por api.setUsuario) para
// reaplicar el tema sin recargar.
(function () {
  function aplicarTema() {
    let tema = 'oscuro';
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      tema = user && user.tema ? user.tema : 'oscuro';
    } catch (_e) {
      tema = 'oscuro';
    }
    document.body.classList.toggle('tema-claro', tema === 'claro');
  }

  aplicarTema();
  window.addEventListener('usuario-actualizado', aplicarTema);
  window.aplicarTemaDesdePerfil = aplicarTema;
})();
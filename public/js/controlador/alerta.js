export const eliminarAlerta = function () {
  const divAlerta = document.querySelector('.alerta');
  // 1) si existe el "div de alerta" entonces lo eliminamos
  if (divAlerta) divAlerta.parentElement.removeChild(divAlerta);
};

//  alerta--tipo is 'success' or 'error'
export const mostrarAlerta = function (tipo, mensaje) {
  // 1) supongamos que estas mostrando una alerta (error->rojo)
  // 2) y luego el usuario hace las cosas correctas (sucess->verde)
  // 3) entonces vas a querer "eliminar" la alerta actual (error->rojo) y luego mostrar la alerta correcta (sucess->verde)
  eliminarAlerta();
  const divAlerta = `<div class="alerta alerta--${tipo}">${mensaje}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', divAlerta);
  window.setTimeout(eliminarAlerta, 3000);
};

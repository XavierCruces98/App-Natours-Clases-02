const jwt = require('jsonwebtoken'); // si es un NPM
const { token } = require('morgan');

const crearJwt = function (miId) {
  const campos = { id: miId };
  const secret = process.env.JWT_SECRETO;
  const expira = { expiresIn: process.env.JWT_EXPIRA_EN }; //'10d 1h 10m 5s'
  //const expira5S = { expiresIn: process.env.JWT_EXPIRA_EN_5S }; //'10d 1h 10m 5s'

  return jwt.sign(campos, secret, expira);
};

const respuestaWithJWT = function (resp, usuario, datos) {
  // 💻 0.0 aqui simplemente estamos ocultando la vista de respuesta en el postman
  // 💻 0.0 no estamos asignandole un valor, para ello tendriamos que poner ---await usuario.save()---
  usuario.password = undefined;

  const tokenJWT = crearJwt(usuario.id);
  const validarJWT = jwt.verify(tokenJWT, process.env.JWT_SECRETO);
  const offset = new Date().getTimezoneOffset() * 1 * 60 * 1000;
  const expiraCookie = process.env.JWT_COOKIE_EXPIRA_EN * 60 * 60 * 24 * 90; // 1000ms/s*60s/min*60min/hr*24hr/90d === 90dias

  //---------------------------------------
  // 💻 1.0 creando cookie
  // 💻 1.0 lo que hace el cookie, es almacenar y luego enviar en cada solicitud la informacion guardada de forma automatica
  const nombre = 'miJwtCookie';
  const opciones = {
    expires: new Date(Date.now() - offset + expiraCookie),
    //secure: true, // solo con metodos https, aqui estamos usando http
    httpOnly: true, // hace que el navegador no pueda acceder al cookie, ni modificarla ni cambiarla,
  };

  if (process.env.NODE_ENV === 'production') opciones.secure = true;

  resp.cookie(nombre, tokenJWT, opciones);
  //---------------------------------------

  const data = {
    tokenJWT: tokenJWT,
    fechaJWT: new Date(validarJWT.iat * 1000 - offset),
  };
  resp.status(201).json({ ...datos, ...data });
};

module.exports = respuestaWithJWT;

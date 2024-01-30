const express = require('express');
const controllerView = require(`../2controlador/controllerView`);
const controllerAuth = require('../2controlador/controllerAuthentication');
const controllerAuthString = require('../2controlador/controllerAuthString');

const routerView = express.Router();

// nota importante ❗ para que los scripts externos <script src=""> no den error
routerView.use(controllerView.permisosHttps);

routerView.route('/home').get(
  controllerAuth.verificarLogin, //
  controllerView.allTours
);

routerView.route('/login').get(
  controllerAuth.verificarLogin, //
  controllerView.login
);
routerView.route('/me').get(
  controllerAuth.validarJwtCookie, // Si se ha cambiado la CONTRASEÑA saldra ERROCLASS
  controllerView.perfil
);

//---------------------------------------------
routerView.route('/signup').get(
  controllerAuth.verificarLogin, //
  controllerView.signup
);

routerView.route('/emailEnviado').get(
  controllerAuth.verificarLogin, //
  controllerView.emailEnviado
);

routerView.route('/confirmarEmail/:stringRandom').get(
  controllerAuth.verificarLogin,
  controllerAuthString.verificarStringEmail //validar :stringRandom
);

routerView.route('/tour/:string').get(
  controllerAuth.verificarLogin, //
  controllerView.tour
);

//---------------------------------------------
routerView.route('/olvidastes-tu-password').get(
  controllerAuth.verificarLogin, // si ha iniciado sesion provocamos un ERROR
  controllerView.passwordOlvidado // aca se supone que no ha iniciado sesion
);

routerView.route('/recuperar-cuenta/:stringRandom').get(
  controllerAuth.verificarLogin, // 1.0 si ha iniciado sesion provocamos un ERROR
  controllerAuthString.passwordString, // 2.0 Aqui verificamos si el "string" de la url es valido
  controllerView.passwordReset // simplemente mostrar la pagina ---passwordReset---
  // el ---http://localhost:3000/api/v1/users/resetPassword/${string}---
  // se encargara de
  // 1.0 verificar el :stringRandom
  // 2.0 actualizar nuestra constraseña
  // 3.0 todo esto lo hace el api.recuperarCuenta()
);

// routerView ==> en este router aqui es "POST" (porque estamos usando POST desde me.pug)
// routerUser ==> en este router es "PATCH" (Asi debe de ser, pero debemos usar JS y axios(url))
// esto solo sirve

// Esto solo sirve para usar un [formulario POST directo desde ---me.pug--- sin logica JS]
// routerView
//   .route('/updateMyPerfil-view') //
//   .post(
//     controllerAuth.verificarLogin, // devuelve "resp.locals.usuarioLocal" + "req.usuarioActual"
//     // controllerUser.multerUploadPhoto, //
//     // controllerUser.resizingPhoto,
//     controllerUser.updatePerfil
//   );

module.exports = routerView;

const express = require('express');
const controllerView = require(`../2controlador/controllerView`);
const controllerAuth = require('../2controlador/controllerAuthentication');
const controllerUser = require('../2controlador/controllerUsers');
const controllerEmail = require('../2controlador/controllerEmail');

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
  controllerEmail.verificarEmailString //validar email
);

routerView.route('/tour/:string').get(
  controllerAuth.verificarLogin, //
  controllerView.tour
);

// routerView ==> en este router aqui es "POST" (porque estamos usando POST desde me.pug)
// routerUser ==> en este router es "PATCH" (Asi debe de ser, pero debemos usar JS y axios(url))
// esto solo sirve cuando quieres usar un formulario directo desde ---me.pug--- sin logica JS
routerView
  .route('/updateMyPerfil-view') //
  .post(
    controllerAuth.verificarLogin, // devuelve "resp.locals.usuarioLocal" + "req.usuarioActual"
    // controllerUser.multerUploadPhoto, //
    // controllerUser.resizingPhoto,
    controllerUser.updatePerfil
  );

module.exports = routerView;

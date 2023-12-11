const express = require('express');
const controllerView = require(`../2controlador/controllerView`);
const controllerAuth = require('../2controlador/controllerAuthentication');
const controllerEmail = require('../utilidades/Email');
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
  controllerEmail.verificarEmailConString //validar email
);

routerView.route('/tour/:string').get(
  controllerAuth.verificarLogin, //
  controllerView.tour
);

routerView
  .route('/updateMyPerfil-view') //
  .post(controllerAuth.verificarLogin, controllerView.updateMyPerfilView);

module.exports = routerView;

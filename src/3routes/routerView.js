const express = require('express');
const controllerView = require(`../2controlador/controllerView`);
const routerView = express.Router();
const controllerAuth = require('../2controlador/controllerAuthentication');

routerView.route('/home').get(
  controllerAuth.verificarLogin, //
  controllerView.allTours
);
routerView.route('/login').get(
  controllerAuth.verificarLogin, //
  controllerView.login
);

routerView.route('/emailEnviado').get(controllerView.emailEnviado);

routerView.route('/confirmarEmail/:stringRandom').get(
  controllerAuth.confirmarEmail(true), //validar email
  controllerView.emailConfirmado
);

routerView.route('/me').get(
  controllerAuth.verificarLogin, //
  controllerView.perfil
);
routerView.route('/signup').get(
  controllerAuth.verificarLogin, //
  controllerView.signup
);
routerView.route('/tour/:string').get(
  controllerAuth.verificarLogin, //
  controllerView.tour
);

module.exports = routerView;

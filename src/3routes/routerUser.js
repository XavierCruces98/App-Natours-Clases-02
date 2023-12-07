// node "src/proyect1/routes/routerUserUser.js"
const express = require('express');
const controlUsers = require(`../2controlador/controllerUsers`);
const routerUser = express.Router();
const controllerAuth = require('../2controlador/controllerAuthentication');
// nota Es necesario colocar en "permisoJWT" en cada metodo, sino no lo colocas, podra hacer GET/POST/DELETE sin el JWT

//----------------------- 1.0 Sin necesidad de iniciar sesion ---------------------------
//----------------------- 1.1 Creacion e Inicio de SESION
routerUser
  .route('/signup') // aqui un usuario normal crea una cuenta. pero solo una cuenta a la vez.
  .post(controllerAuth.signup, controllerAuth.sendEmailSignUp);

routerUser
  .route('/confirmarEmail/:stringRandom') // aqui un usuario normal crea una cuenta. pero solo una cuenta a la vez.
  .get(controllerAuth.confirmarEmail(), controllerAuth.respuestaEmail);

routerUser
  .route('/login') //
  .post(controllerAuth.login);

routerUser
  .route('/logout') //
  .post(controllerAuth.logout);

//----------------------- 1.2 confirmar EMAIL o renovar PASSOWRD
routerUser
  .route('/envioConfirmacionEmail') //
  .post(controllerAuth.sendEmailSignUp);

routerUser
  .route('/forgotPassword') //
  .post(controllerAuth.forgotPassword);

routerUser
  .route('/resetPassword/:stringRandom') //
  .patch(controllerAuth.resetPassword);

//--------------------------------------------------------------

routerUser.use(controllerAuth.permisoJWT);
// 2.0 Inicio de sesion OBLIGATORIO
// 2.1 todos los --middleware-- de abajo tendran como primer --middleware-- a [controllerAuth.permisoJWT]
// 2.2 [controllerAuth.permisoJWT] verifica el JWT del LOGIN

routerUser.route('/me').get(
  controlUsers.getMe,
  controlUsers.getUserId // ver mi perfil
);

routerUser
  .route('/updateMyPassword') //
  .patch(controllerAuth.updatePassword);

routerUser
  .route('/updateMyPerfil') //
  .patch(controlUsers.updatePerfil);

routerUser
  .route('/deleteMyPerfil') //
  .patch(controlUsers.deletePerfil);

//----------------------------------------

routerUser.use(controllerAuth.restringidoTo('admin'));
// 2.0 De apartir de aqui, solo el --admin-- tiene permiso para VER, UPDATE, DELETE ( 01 user-id o many usuarios)

routerUser
  .route('/:id')
  .get(controlUsers.getUserId)
  .patch(controlUsers.patchUserId)
  .delete(controlUsers.deleteUserId);

routerUser
  .route('/')
  .get(controlUsers.consultaAllDocuments)
  .post(controlUsers.postUser)
  .delete(controlUsers.deleteMany);
//
module.exports = routerUser;

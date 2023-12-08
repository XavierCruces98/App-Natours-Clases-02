//const util = require('util'); // esto no es un NPM, esto es una biblioteca interna de NODE.JS, es decir, ya viene incorporado

const DB_user = require('../1modelos/esquemaUser');
const jwt = require('jsonwebtoken'); // si es un NPM
const crypto = require('crypto'); // no es un NPM, es del NODEJS

const AsyncFunction = require('../utilidades/AsyncFunction');
const ErrorClass = require('../utilidades/ErrorClass');
const sendEmailString = require('../utilidades/sendEmailString');

const localTime = require('../utlidadesPropias/localTime');
const { respuestaWithJWT } = require('../utlidadesPropias/respuestaWithJWT');
//const { miPromisify02 } = require('../utlidadesPropias/miPromisify');
const filtrarObject = require('../utlidadesPropias/filtrarObject');

// http://localhost:3000/api/v1/users/logout
exports.logout = AsyncFunction(async function (req, resp, next) {
  const nombre = 'miJwtCookie';
  const offset = new Date().getTimezoneOffset() * 1 * 60 * 1000;
  const expiraCookie = 0.5 * 1000; // 0.5segundos
  const opciones = {
    expires: new Date(Date.now() - offset + expiraCookie),
    //secure: true, // solo con metodos https, aqui estamos usando http
    httpOnly: true, // hace que el navegador no pueda acceder al cookie, ni modificarla ni cambiarla,
  };
  resp.cookie(nombre, 'loggedout', opciones);
  resp.status(200).json({
    status: 'sucess logout',
  });
});

//🔵🔵001 Crearte una cuenta ==> revisar (/signup) routeruser.js
exports.signup = AsyncFunction(async function (req, resp, next) {
  // 💻 1.0 El problema con esto, es que, puedes ingresa cualquier tipo de dato como si fueras administrador
  // 💻 1.0 const nuevoUsuario = await DB_user.create(req.body);
  // 💻 1.0 En cambio con esto, solo podras guardar 4 campos, si pones mas campos, simplemente no lo guardara
  // 💻 1.0 La encriptacion-password, sucede antes de que se guarde el --nuevoUsuario-- en la data-base ---.pre("save")---
  // token_signup: "", // no puedes crear propiedades fuera del esquemaUser, si en el esquemaUser no esta la propiedad "token_signup"
  // entonces no podras crear la propiedad fuera del "esquemaUser"
  const nuevoUsuario = await DB_user.create(
    filtrarObject(
      req.body,
      'nombre',
      'email',
      'password',
      'passwordConfirm',
      'role' // agregar role aqui no es lo adecuado, porque cualquier puede ponerse como admin
    )
  );

  // 💻 3.0 enviando usuario al siguiente middleware
  req.usuarioActual = nuevoUsuario;
  next();

  // "POST" si los valores NO cumplen con las restricciones del  "ESQUEMA USER" / "ESQUEMA TOUR", no podras crear user/tour
  // "PATCH" (modificar un ID) debes de agregar una logica para que verifique los valores de las propiedades
  // { new: true, runValidators: true };
});

exports.sendEmailSignUp = AsyncFunction(async function (req, resp, next) {
  const miEmail = req.usuarioActual?.email || req.body.email;

  const datos = {
    esquema: DB_user,
    email: miEmail,
    resetToken: 'emailResetToken',
    resetTime: 'emailTimeReset',
    subject: 'Verificar tu EMAIL (valido 10min)',
    text: `Porfavor confirma tu EMAIL con el siguiente URL.`,
    status: 'Success Signup',
  };
  // lo malo de esta logica, esque cualquier "String" (sease de "forgotPassword" "signup" )
  //, ambos son validos, y puedes intercambiar STRING random, y eso esta mal
  // debemos tener un STRING para email y un STRING para "forgotPassword"
  sendEmailString(datos, req, resp, next);
});

exports.confirmarEmail = function (renderizar = false) {
  return AsyncFunction(async function (req, resp, next) {
    // 💻 1.0 creando un Token
    const randomToken = crypto
      .createHash('sha256')
      .update(req.params.stringRandom) // revisar "routerUser"
      .digest('hex');
    const vlocalTime = localTime();

    // 💻 2.0 buscando usuario
    const validarUsuario = await DB_user.findOne({
      emailResetToken: randomToken,
      emailTimeReset: { $gte: vlocalTime },
    }).select('+emailConfirm');

    if (!validarUsuario && !renderizar) {
      return next(
        new ErrorClass(
          'El token-email es invalido ó El token-email expiro',
          400
        )
      );
    }

    if (!validarUsuario && renderizar) {
      req.errorValidarEmail = true;
      return next();
    }

    // 💻 3.0 restableciendo valores
    validarUsuario.emailConfirm = true;
    validarUsuario.emailResetToken = undefined;
    validarUsuario.emailTimeReset = undefined;
    await validarUsuario.save({ validateBeforeSave: false }); // esto es necesario para guardar sin ingresar campos obligatorios,

    // 💻 4.0 creando JWT, obligatorio crear un nuevo JWT
    const misDatos = {
      status: 'Success Email Verificado!',
      nombre: validarUsuario.nombre,
    };

    req.validarUsuario = validarUsuario;
    req.misDatos = misDatos;
    req.errorValidarEmail = false;

    next();
    //respuestaWithJWT(resp, validarUsuario, data);
  });
};

exports.respuestaEmail = AsyncFunction(async function (req, resp, next) {
  respuestaWithJWT(resp, req.validarUsuario, req.misDatos);
});

//----------------------------------------------------------------------------------------------------
//🔵🔵002 iniciar sesion ==> revisar (/login) routeruser.js
// Solo estamos comprobando EMAIL + PASSWORD, en ningun momento estamos validando el JWT
exports.login = AsyncFunction(async function (req, resp, next) {
  // para iniciar sesion necesitas "email + password"
  // En este caso, no se esta tomando en cuenta "nombre_user + password" (seria una segunda forma de inicar sesion)
  const { email, password } = req.body;

  console.log({ body: req.body });
  // 💻 1.0 checkear SI el usuario ha ingresado email ó password,
  // colocar ❗return❗, para que NO continue con la logica
  if (!email || !password)
    return next(
      new ErrorClass('1.0 Porfavor Ingrese un Email y password !! ', 400) // 400 Bad Request
    );

  // 💻 2.0 checkear SI existe Email/password
  // 💻 2.0 email, puede ingresar en mayusculas, y lo convertirmos en minusculas -- email siempre es  minusculas--
  // 💻 2.0 password, debe de respectar MAYUSCULAS Y MINUSCULAS

  // 💻 2.1 *con ".find()" por alguna razon no aparece los metodos, .compararPassword()
  // const validarUsuario = await DB_user.find({ email: email.toLowerCase(),}).exec();

  //💻 2.1  *con ".findOne()" si aparece los metodos, .compararPassword()
  // primero::: ver si existe el usario segun "email"
  const validarUsuario = await DB_user.findOne({
    email: email.toLowerCase(),
    // email,
  })
    .select('+password')
    .select('+emailConfirm')
    .select('+active');

  // este metodo .compararPassword(), fue ---creado en userEsquema---, return TRUE or FALSE
  const validarPassword = await validarUsuario?.compararPassword(
    password,
    validarUsuario.password // si no ponemos .select("+password") no aparece estwtjwta propiedad
  );
  // 💻 2.0 no puedes indicar que si uno de los dos Email/password son correctos, porque le ayudas al hacker
  if (!validarUsuario || !validarPassword)
    return next(new ErrorClass('2.0 Email ó Password incorrecto ', 401)); // 401 Error Unauthorized

  if (!validarUsuario?.active)
    return next(new ErrorClass('3.0 Su cuenta a sido desactivada', 401)); // 401 Error Unauthorized

  if (!validarUsuario?.emailConfirm)
    return next(new ErrorClass('4.0 No ha confirmado su EMAIL ', 401)); // 401 Error Unauthorized

  // 💻 3.0 Crear token
  const data = {
    status: 'sucess POST login',
    user: validarUsuario, // deberiamos poder crear 01 usuario como maximo.
  };
  respuestaWithJWT(resp, validarUsuario, data);
});

//🔵🔵003 validarJWT , antes de ingresar a cualquier ruta  ==> revisar (./ ./id, etc) routeruser.js
//🔵🔵003 es decir, antes de ingresar a cualquier ruta, debes de crearte una cuenta ó iniciar sesion
exports.permisoJWT = AsyncFunction(async function (req, resp, next) {
  //console.log(`---------- 001 HEADERS --------------`);
  //console.log(req.headers);
  let token;

  // 💻 01.0 revisar si ha colocado un token, no estamos comprobado si el token es valido o no
  // 💻 01.0 estamos revisando si ha ingresado un token, que seria lo mismo que: ---no haya iniciado sesion--
  if (
    req.headers.authorization &&
    req.headers.authorization?.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token || token === 'null')
    return next(new ErrorClass('1.0 No has iniciado sesion! ', 401));

  /**
   * asi lo hace en el video 132 Protection tour routes
   * const validarJWT = await util.promisify(jwt.verify)(token, process.env.JWT_SECRETO)
   */

  // 💻 02.0 revisar si el token es valido
  //const validarJWT = await miPromisify02(jwt.verify);
  //const resultadoJWT = validarJWT(token, process.env.JWT_SECRETO);

  const validarJWT = jwt.verify(token, process.env.JWT_SECRETO);

  console.log({ miToken: req.headers.authorization });

  // 💻 3.0 revisar si el usuario sigue existiendo,
  // 💻 3.0 Si un usuario a sido eliminado, su JWT seguira siendo valido, a pesar que el usuario ya no este en la base-de-datos
  // 💻 3.0 por ello debemos de revisar la base-de-datos
  const validarUsuario = await DB_user.findOne({ _id: validarJWT.id }).select(
    '+emailConfirm'
  ); //

  if (!validarUsuario)
    return next(new ErrorClass('2.0 Su cuenta ha sido Eliminada', 401));

  if (!validarUsuario.emailConfirm)
    return next(new ErrorClass('3.0 No ha confirmado su email', 401));

  // 💻 4.0 revisar si el usuario a cambiado de contraseña despues que JWT fue enviado
  // 💻 4.0 TRUE= contraseña SI Cambiada, FALSE= contraseña NO cambiada
  const contrasenaCambiada = validarUsuario.validarCambioContrasena(
    validarJWT.iat
  );

  // console.log(`---------- 002 CONTRASEÑA CAMBIADA --------------`);
  // console.log({ contraseñaCambiada: contrasenaCambiada });

  if (contrasenaCambiada)
    return next(
      new ErrorClass(
        '4.0 La contraseña fue cambiada, iniciar sesion de nuevo',
        401
      )
    );

  // 💻 5.0 "req.user" es una propiedad que nos estamos inventando
  // 💻 5.1 es importante, porque a los siguientes --middleware--  le tendremos que pasar que "usuario" ha iniciado sesion
  req.usuarioActual = validarUsuario;

  // nota: escribimos next() porque estamos anidando middleware
  // route(./) .get(controlUsers.permisoJWT,controlUsers.consultaAllDocuments)
  next();
});

//🔵🔵004 Controlar el acceso a RUTAS segun ROLES  ==> revisar (./, /id, etc) routeruser.js
exports.restringidoTo = function (...roles) {
  // ...roles = [array] = ["admin", "lider-guia"]
  // req.validarUsuario.role = "admin" ó "lider-guia" ó "guia" ó "user-basico"

  // ["admin", "lider-guia"].includes("user") === FALSE (no tiene autorizacion)
  // ["admin", "lider-guia"].includes("admin") === TRUE (si tiene autorizacion)

  return function (req, resp, next) {
    if (!roles.includes(req.usuarioActual.role)) {
      return next(new ErrorClass('Tu no tienes autorizacion', 403)); // Prohibido
    }
    next();
  };
};

//🔵🔵005 Password olvidado, Ingresar EMAL + enviar un correo con STRING RANDOM
exports.forgotPassword = AsyncFunction(async function (req, resp, next) {
  const datos = {
    esquema: DB_user,
    email: req.body.email,
    resetToken: 'passwordResetToken',
    resetTime: 'passwordTimeReset',
    subject: 'Recuperar tu Contraseña NODEJS (valido 10min)',
    text: `Olvidastes tu password? SUBMIT un PATCH request con tu nuevo password and password al siguiente URL de abajo. Si no has olvidado tu contraseña, ignora este email.`,
    status: 'Success Email Enviado : Verifacation Password!',
  };

  sendEmailString(datos, req, resp, next);
});

//🔵🔵006 Validar StringRANDOM + Colocar una nueva contrseña
exports.resetPassword = AsyncFunction(async function (req, resp, next) {
  // nota, aqui usamos "patch" , porque vamos a modificar nuestra contraseña + estamos usando un ID
  // en "forgotPassword" usamos "post" porque simplemente estamos ingresando nuestro emal

  // 💻 1.0 creando un Token
  const randomToken = crypto
    .createHash('sha256')
    .update(req.params.stringRandom) // revisar "routerUser"
    .digest('hex');
  const vlocalTime = localTime();

  //console.log(randomToken);
  //console.log(vlocalTime);

  // 💻 2.0 Validando Token + Time Expiracion  // gte>= mayorigual, lte <= menor igual
  const validarUsuario = await DB_user.findOne({
    passwordResetToken: randomToken, // 01 un solo usuario deberia tener este token unico generado, sino lo tiene, es un token invalido
    passwordTimeReset: { $gte: vlocalTime }, // timeReset>= now() TRUE, timeReset<=now() FALSE (se vencio los 10min)
  });

  if (!validarUsuario) {
    return next(new ErrorClass('El token es invalido ó El token expiro', 400));
  }

  // 💻 3.0 SAVE "password", y reiniciando las propiedades "passwordResetToken + passwordTimeReset"
  // 💻 3.0 La encriptacion-password, sucede antes de que se guarde el --nuevoUsuario-- en la data-base ---.pre("save")---
  // 💻 3.0 solo si encontro a un (01) usuario --validarUsuario-- podremos acceder a sus propiedades
  // 💻 3.0 ❗❗❗ ojo, aqui, deberiamos tener alguna logica para que el usuario no ingrese su contraseña anterior ❗❗❗
  const timeReset = validarUsuario.passwordTimeReset;
  validarUsuario.password = req.body.password;
  validarUsuario.passwordConfirm = req.body.passwordConfirm;
  validarUsuario.passwordResetToken = undefined;
  validarUsuario.passwordTimeReset = undefined;
  await validarUsuario.save();

  // 💻 4.0 obligatorio crear un nuevo JWT
  // 💻 4.0 "validarJWT", es innecesario, aqui simplemente quiero obtener el "iat"

  const data = {
    status: 'Success resetPassword',
    nombre: validarUsuario.nombre,
    passwordTimeReset: timeReset,
    horaActual: vlocalTime,
    passwordChange: validarUsuario.passwordChange,
    nuevoPassword: validarUsuario.password,
  };

  respuestaWithJWT(resp, validarUsuario, data);
});

exports.updatePassword = AsyncFunction(async function (req, resp, next) {
  // 💻 1.0 El usuario ya tiene su seccion iniciada E ingreso a "configuraciones" para cambiar su contraseña,
  // 💻 1.0 Necesitamos tener un JWT, para esta URL,  es el "JWT" de inicio de seision
  // 💻 1.0 --authUsers.permisoJWT-- devuelve "usuarioActual" apartir del "JWT"
  // 💻 1.0 solo estamos buscando el usuario que tiene su seccion inicada, "+password" es para que se puede visulizar el password
  console.log(`---------- 004 USUARIO ACTUAL  --------------`);
  console.log(req.usuarioActual);
  const validarUsuario = await DB_user.findOne({
    _id: req.usuarioActual.id,
  }).select('+password');

  // 💻 2.0 comparamos el "passwordActual" vs el "passwordBasde-de-datos"
  const validarPassword = await validarUsuario.compararPassword(
    req.body.passwordActual,
    validarUsuario.password
  );

  if (!validarPassword)
    return next(new ErrorClass('Su passwordActual es incorrecto', 401));

  // 💻 3.0 los password no pueden ser los mismo
  if (req.body.passwordActual === req.body.passwordNuevo)
    return next(new ErrorClass('Su passwordActual es igual al PasswordNuevo'));

  // 💻 4.0 Guardamos el nuevo password
  validarUsuario.password = req.body.passwordNuevo;
  validarUsuario.passwordConfirm = req.body.passwordNuevoConfirm; // para validar que sean iguales
  await validarUsuario.save();
  // no usar el DB_user.findByIdAndUpdate() , porque las validacion del --esquemaUser-- no se aplicaraan, (revisar --esquemaUser--)

  const data = {
    status: 'Success UpdatePassword',
    usuario: validarUsuario.nombre,
    passwordChange: validarUsuario.passwordChange,
  };

  respuestaWithJWT(resp, validarUsuario, data);
});

//-------------------------------------------------------------------
//----------------------------------------------------------------
exports.verificarLogin = async function (req, resp, next) {
  try {
    // console.log({ cookie: req.headers.cookie });
    // const jwt = validarJWT(req.headers.cookie, next);
    // nota necesitas de --require('cookie-parser')-- para --req.cookies--

    const token = jwt.verify(req.cookies.miJwtCookie, process.env.JWT_SECRETO);
    const usuario = await DB_user.findOne({ _id: token.id });
    usuario.photo = usuario.photo || 'user-2.jpg';
    req.usuarioLogeado = usuario;

    return next();
  } catch (error) {
    req.usuarioLogeado = undefined;
    return next();
  }
};

// function validarJWT(cookies, next) {
//   let textoJwt = cookies.slice(
//     cookies.indexOf('miJwtCookie') + 'miJwtCookie'.length + 1
//   );
//   if (!textoJwt) return '';

//   const indiceFinal =
//     textoJwt.indexOf(' ') < 0 ? textoJwt.length : textoJwt.indexOf(' ');
//   textoJwt = textoJwt.slice(0, indiceFinal);

//   return jwt.verify(textoJwt, process.env.JWT_SECRETO);
// }

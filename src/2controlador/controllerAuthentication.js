const DB_user = require('../1modelos/esquemaUser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const AsyncFunction = require('../utilidades/AsyncFunction');
const ErrorClass = require('../utilidades/ErrorClass');
const localTime = require('../utlidadesPropias/localTime');
const { respJwtYCookie } = require('../utlidadesPropias/respJwtYCookie');
const { sendEmail } = require('../utilidades/Email');

const filtrarObject = require('../utlidadesPropias/filtrarObject');

exports.signup = AsyncFunction(async function (req, resp, next) {
  // 💻 1.0 Aqui puedes ingresa cualquier tipo de dato como si fueras administrador
  // 💻 1.0 const nuevoUsuario = await DB_user.create(req.body);

  // 💻 2.0 Aqui, podras guardar "X" campos especificos (filtrarObject objecto, camp1, camp2,..)
  // 💻 2.0 La encriptacion-password, sucede antes de que se guarde el --nuevoUsuario-- en la data-base ---.pre("save")---
  // token_signup: "", // no puedes crear propiedades fuera del esquemaUser, si en el esquemaUser no esta la propiedad "token_signup"

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

  // 💻 en "PRE SAVE" le colocamos la foto
  // 💻 colocando foto

  const data = {
    status: 'success signup',
    usuario: nuevoUsuario,
  };
  // next();
  respJwtYCookie(resp, data);

  // "POST" si los valores NO cumplen con las restricciones del  "ESQUEMA USER" / "ESQUEMA TOUR", no podras crear user/tour
  // "PATCH" (modificar un ID) debes de agregar una logica para que verifique los valores de las propiedades
  // { new: true, runValidators: true };
});

// Solo estamos comprobando EMAIL + PASSWORD, en ningun momento estamos validando el JWT
// para iniciar sesion necesitas "email + password" , no se esta tomando en cuenta "nombre_user + password" (seria una segunda forma de inicar sesion)
exports.login = AsyncFunction(async function (req, resp, next) {
  const { email, password } = req.body;

  // 💻 1.0 checkear SI el usuario ha ingresado email ó password, colocar ❗return❗
  if (!email || !password)
    return next(
      new ErrorClass('1.0 Porfavor Ingrese un Email y password !! ', 400) // 400 Bad Request
    );

  // 💻 2.0 checkear SI existe Email/password
  // 💻 2.0 email lo convertirmos en minusculas (email siempre es minusculas)
  // 💻 2.0 password, debe de respectar MAYUSCULAS Y MINUSCULAS

  // 💻 2.1 *con ".find()" por alguna razon no aparece los metodos, .compararPassword()
  // 💻 2.1 *con ".findOne()" si aparece los metodos, .compararPassword()

  // primero::: ver si existe el usario segun "email"
  // const validarUsuario = await DB_user.find({ email: email.toLowerCase(),}).exec();
  const validarUsuario = await DB_user.findOne({
    email: email.toLowerCase(),
  })
    .select('+password')
    .select('+emailConfirm')
    .select('+active');

  // este metodo .compararPassword(), fue ---creado en userEsquema---, return TRUE or FALSE
  const validarPassword = await validarUsuario?.compararPassword(
    password,
    validarUsuario.password // si no ponemos .select("+password") no aparece ".password"
  );
  // 💻 2.0 no puedes indicar que si uno de los dos Email/password son correctos, porque le ayudas al hacker
  if (!validarUsuario || !validarPassword)
    return next(new ErrorClass('2.0 Email ó Password incorrecto', 401)); // 401 Error Unauthorized

  if (!validarUsuario?.active)
    return next(new ErrorClass('3.0 Su cuenta a sido desactivada', 401)); // 401 Error Unauthorized

  if (!validarUsuario?.emailConfirm)
    return next(new ErrorClass('4.0 No ha confirmado su EMAIL', 401)); // 401 Error Unauthorized

  // 💻 3.0 Crear token
  const data = {
    status: 'success login',
    usuario: validarUsuario, // deberiamos poder crear 01 usuario como maximo.
  };
  respJwtYCookie(resp, data);
});

//🔵🔵004 Controlar el acceso a RUTAS segun ROLES  ==> revisar (./, /id, etc) routeruser.js
exports.restringidoTo = function (...roles) {
  return function (req, resp, next) {
    if (!roles.includes(req.usuarioActual.role)) {
      return next(new ErrorClass('Tu no tienes autorizacion', 403)); // Prohibido
    }
    next();
  };
};

exports.sendEmail = AsyncFunction(async function (req, resp, next) {
  req.datos = {
    email: req.body.email,
    resetToken: 'emailResetToken',
    resetTime: 'emailTimeReset',
    subject: 'Recuperar tu Contraseña NODEJS (valido 10min)',
    text: `Porfavor confirma tu EMAIL con el siguiente URL. `,
  };

  await sendEmail(req, resp, next);
});

//🔵🔵005 Password olvidado, Ingresar EMAL + enviar un correo con STRING RANDOM
exports.forgotPassword = AsyncFunction(async function (req, resp, next) {
  req.datos = {
    email: req.body.email,
    resetToken: 'passwordResetToken',
    resetTime: 'passwordTimeReset',
    subject: 'Recuperar tu Contraseña NODEJS (valido 10min)',
    text: `Olvidastes tu password? SUBMIT un PATCH request con tu nuevo password and password al siguiente URL de abajo. Si no has olvidado tu contraseña, ignora este email.`,
  };

  await sendEmail(req, resp, next);
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

  // 💻 2.0 Validando Token + Time Expiracion  // gte>= mayorigual, lte <= menor igual
  const validarUsuario = await DB_user.findOne({
    // 01 un solo usuario deberia tener este token unico generado, sino lo tiene, es un token invalido
    passwordResetToken: randomToken,
    // 02 timeReset>= now() TRUE, timeReset<=now() FALSE (se vencio los 10min)
    passwordTimeReset: { $gte: vlocalTime },
  });

  if (!validarUsuario) {
    return next(new ErrorClass('El token es invalido ó El token expiro', 400));
  }

  // 💻 3.0 SAVE "password", y reiniciando las propiedades "passwordResetToken + passwordTimeReset"
  // 💻 3.0 La encriptacion-password, sucede antes de que se guarde el --nuevoUsuario-- en la data-base ---.pre("save")---
  // 💻 3.0 ❗❗❗ OJO deberiamos tener alguna logica para que el usuario no ingrese su contraseña anterior ❗❗❗
  const timeReset = validarUsuario.passwordTimeReset;
  validarUsuario.password = req.body.password;
  validarUsuario.passwordConfirm = req.body.passwordConfirm;
  validarUsuario.passwordResetToken = undefined;
  validarUsuario.passwordTimeReset = undefined;
  await validarUsuario.save();

  // 💻 4.0 obligatorio crear un nuevo JWT
  // 💻 4.0 "validarJWT", es innecesario, aqui simplemente quiero obtener el "iat"
  const data = {
    status: 'success resetPassword',
    usuario: validarUsuario,
    passwordTimeReset: timeReset,
    horaActual: vlocalTime,
    passwordChange: validarUsuario.passwordChange,
    nuevoPassword: validarUsuario.password,
  };

  respJwtYCookie(resp, data);
});

exports.updatePassword = AsyncFunction(async function (req, resp, next) {
  // 💻 1.0 El usuario ya tiene su seccion iniciada E ingreso a "configuraciones" para cambiar su contraseña,
  // 💻 1.0 Buscando el usuario que tiene su seccion inicada para comparar password, "+password"
  const validarUsuario = await DB_user.findOne({
    _id: req.usuarioActual.id,
  }).select('+password');

  // 💻 2.0 comparamos el "passwordActual" vs el "passwordBasde-de-datos (encriptado)"
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
  validarUsuario.passwordConfirm = req.body.passwordNuevoConfirm;
  await validarUsuario.save();
  // no usar el DB_user.findByIdAndUpdate() , porque las validacion del --esquemaUser-- no se aplicaran, (revisar --esquemaUser--)

  const data = {
    status: 'success updatePassword',
    usuario: validarUsuario,
    passwordChange: validarUsuario.passwordChange,
  };

  respJwtYCookie(resp, data);
});

//------------------------------------------------------------------------------------------------
//🔵🔵003 validarJWT , antes de ingresar a cualquier ruta  ==> revisar (./ ./id, etc) routeruser.js
//🔵🔵003 es decir, antes de ingresar a cualquier ruta, debes de crearte una cuenta ó iniciar sesion
exports.validarJwtCookie = AsyncFunction(async function (req, resp, next) {
  // 💻 01.0 estamos revisando si ha ingresado un token, que seria lo mismo que: ---no haya iniciado sesion--
  let token;
  // 💻 01.0 buscar TOKEN cuando iniciamos con BODYPOSTAMN ("/api")
  if (!req.url.startsWith('api') && req.cookies.miJwtCookie) {
    token = req.cookies.miJwtCookie;
  }

  if (
    req.headers.authorization &&
    req.headers.authorization?.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 💻 01.0 buscar TOKEN cuando iniciamos con RENDERIZADO (localhost/3000/login)
  if (!token || token === 'null')
    return next(new ErrorClass('1.0 No has iniciado sesion!', 401));

  // 💻 02.0 revisar si el token es valido
  const validarJWT = jwt.verify(token, process.env.JWT_SECRETO);

  // 💻 3.0 revisar si el usuario sigue existiendo,
  // 💻 3.0 Si un usuario a sido eliminado, su JWT seguira siendo valido, a pesar que el usuario ya no este en la base-de-datos, por ello debemos de revisar la base-de-datos
  const validarUsuario = await DB_user.findOne({ _id: validarJWT.id }).select(
    '+emailConfirm'
  ); //

  if (!validarUsuario) {
    return next(new ErrorClass('2.0 Su cuenta ha sido Eliminada', 401));
  }
  // Si existe el USUARIO && RUTA="/emailEnviado" ==> nos vamos a controller.View
  if (!validarUsuario.emailConfirm) {
    return next(new ErrorClass('4.0 No ha confirmado su Email! ', 401));
  }

  // 💻 4.0 revisar si el usuario a cambiado de contraseña despues que JWT fue enviado
  // 💻 4.0 TRUE= contraseña SI Cambiada, FALSE= contraseña NO cambiada

  const contrasenaCambiada = validarUsuario.validarCambioContrasena(
    validarJWT.iat
  );

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
  resp.locals.usuarioLocal = validarUsuario; // respuesta
  next();
});

exports.verificarLogin = AsyncFunction(async function (req, resp, next) {
  // 💻 0.0 Renderizar
  // 💻 0.0 Si la ruta es "/me" y no hay COOKIE req.cookies.miJwtCookie ==> Renderizamos ERROR
  // 💻 0.0 Si la ruta es diferente ===> Continue la logica
  if (!req.cookies.miJwtCookie && req.url === '/emailEnviado')
    return next(new ErrorClass('No has iniciado Sesion', 401));

  // 1.0 Cuando hayas salido de seccion, el "miJwtCookie" ya no existira
  if (!req.cookies.miJwtCookie) return next();

  try {
    // 1) verificar TOKEN
    // nota necesitas de --require('cookie-parser')-- para --req.cookies--
    const token = jwt.verify(req.cookies.miJwtCookie, process.env.JWT_SECRETO);

    // 2) verificar USUARIO
    const usuario = await DB_user.findOne({ _id: token.id }).select(
      '+emailConfirm'
    );

    if (!usuario) return next();

    // 3) Si se ha cambiado de contraseña return TRUE
    if (usuario.validarCambioContrasena(token.iat)) {
      return next();
    }

    // 4) si no se ha confirmado "email" damos next() y "resp.locals.usuarioLocal NO existira"
    if (usuario.emailConfirm === false) {
      // resp.locals.usuarioLocal = usuario; // si quitas esto estara como NO CONECTADO
      // Como el "jwt y cookie" existen, entonces YA SE CREO LA CUENTA
      resp.locals.confirmacionEmail = false;
      resp.locals.email = usuario.email;
      if (req.url === 'me')
        return next(new ErrorClass('Confirme su Email', 401));

      // Solo en la ruta "me" ponemos "ERROR"
      // en todas las demas rutas damos permiso PERO, aparecera como "no iniciado sesion"
      // no podra iniciar sesion hasta que confirme su EMAIL
      return next();
    }

    // 4) Si todo esta okay ponemos "usuarioLocal===usuario"
    // 4) si hay algun error arriba simplemente damos en --next()-- y "usuarioLocal no existira"
    // 4) si SI existe "usuarioLocal" los botones seran (logout & "perfil") y "/me" no dara error
    // 4) si NO existe "usuarioLocal" los botones seran (login & signup) y "/me" dara error

    console.log(`CONTROLLER COOKIE`);
    req.usuarioActual = usuario; // requerimiento
    resp.locals.usuarioLocal = usuario; // respuesta

    return next();
  } catch (error) {
    return next();
  }
});

// http://localhost:3000/api/v1/users/logout
// Aqui creamos una "cookie" con el mismo nombre "miJwtCookie"
// y con el nombre clave "loggedout" eliminamos dicho cookie
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
    status: 'success logout',
  });
});

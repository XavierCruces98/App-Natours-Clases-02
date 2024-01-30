const DB_user = require('../1modelos/esquemaUser');
const jwt = require('jsonwebtoken');

const AsyncFunction = require('../utilidades/AsyncFunction');
const ErrorClass = require('../utilidades/ErrorClass');
const { respJwtYCookie } = require('../utlidadesPropias/respJwtYCookie');
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

    // 3) este paso es innecesario, solamente sirve para cuando el usuario ha cambiado su contraseña
    // 3) y queremos que todavia inicie seision de nuevo, a pesar de haber actualizado su contraseña
    // if (usuario.validarCambioContrasena(token.iat)) {
    //   // si la contraseña ha sido cambiada entonces simplemente iniciamos sesion
    //   resp.locals.usuarioLocal = usuario; // respuesta
    //   return next();
    // }

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

    // 5) Si todo esta okay ponemos "usuarioLocal===usuario"
    // 5) si hay algun error arriba simplemente damos en --next()-- y "usuarioLocal no existira"
    // 5) si SI existe "usuarioLocal" los botones seran (logout & "perfil") y "/me" no dara error
    // 5) si NO existe "usuarioLocal" los botones seran (login & signup) y "/me" dara error

    console.log(`CONTROLLER COOKIE`);
    req.usuarioActual = usuario; // requerimiento
    resp.locals.usuarioLocal = usuario; // respuesta

    // 6) Si estamos en /olvidastes-tu-password ó /recuperar-cuenta
    // 6) y ya tenemos iniciada la sesion, entonces provocamos un error
    if (
      req.url.includes('olvidastes-tu-password') ||
      req.url.includes('recuperar-cuenta')
    )
      return next(new ErrorClass('Ya has iniciado sesion!', 401));

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

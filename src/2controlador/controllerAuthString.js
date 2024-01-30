const crypto = require('crypto');
const DB_user = require('../1modelos/esquemaUser');
const AsyncFunction = require('../utilidades/AsyncFunction');
const ErrorClass = require('../utilidades/ErrorClass');
const localTime = require('../utlidadesPropias/localTime');
const {
  respJwtYCookie,
  setCookie,
} = require('../utlidadesPropias/respJwtYCookie');

async function verificarString(req, next, ResetToken, TimeReset) {
  // 💻 1.0 creando un Token
  const randomToken = crypto
    .createHash('sha256')
    .update(req.params.stringRandom) // :stringRandom
    .digest('hex');
  const vlocalTime = localTime();

  // 💻 2.0 buscando usuario
  const validarUsuario = await DB_user.findOne({
    // 01 un solo usuario deberia tener este token unico generado, sino lo tiene, es un token invalido
    [`${ResetToken}`]: randomToken,
    // 02 timeReset>= now() TRUE, timeReset<=now() FALSE (se vencio los 10min)
    [`${TimeReset}`]: { $gte: vlocalTime },
  }).select('+emailConfirm');

  // 1) Si ---validarUsuario--- NO EXISTE , provacamos un error y se RENDERIZARA EL "ERROR"
  // 1) GRACIAS a que "controllerError" hemos puesto ---.startWith("/api")---
  // 1) Cuando ejecutamos cuaqluier ruta de nuestra pagina (.pug) y sucede un error "ErrorClass"
  // 1) Si nuestra aplicacion es ---.startWith("/api")--- (POSTMAN) entonces veremos un mensaje de error
  // 1) Si nuestra aplicacion es ---sPaginas RENDERIZADAS--- => Va a renderizar el ---error.pug---
  if (!validarUsuario) {
    return next(
      new ErrorClass('El token-email es invalido ó El token-email expiro', 400)
    );
  }

  return { validarUsuario, vlocalTime };
}

exports.passwordString = AsyncFunction(async function (req, resp, next) {
  const { validarUsuario } = await verificarString(
    req,
    next,
    'passwordResetToken',
    'passwordTimeReset'
  );

  // passwordReset.pug === usuarioLocal
  resp.locals.usuarioLocal = validarUsuario;

  return next();
});

//🔵🔵006 Validar StringRANDOM + Colocar una nueva contrseña
exports.resetPassword = AsyncFunction(async function (req, resp, next) {
  // nota, aqui usamos "patch" , porque vamos a modificar nuestra contraseña + estamos usando un ID
  // en "forgotPassword" usamos "post" porque simplemente estamos ingresando nuestro emal
  const { validarUsuario, vlocalTime } = await verificarString(
    req,
    next,
    'passwordResetToken',
    'passwordTimeReset'
  );

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

exports.verificarStringEmail = AsyncFunction(async function (req, resp, next) {
  // 💻 1.0 Aqui esta el truco,
  // 💻 1.0 SOLO si estamos en "renderizar" + Y existe "usuarioLocal.confirmacionEmail === TRUE"
  // 💻 1.0 SOLO en ese caso omitimos la logica de verificarStringEmail
  if (!req.url.startsWith('/api') && resp.locals.usuarioLocal?.emailConfirm) {
    resp.status(200).render('emailConfirmado');
  }

  const { validarUsuario } = verificarString(
    req,
    next,
    'emailResetToken',
    'emailTimeReset'
  );

  // 💻 3.0 restableciendo valores
  // routerView.route('/confirmarEmail/:stringRandom')
  // http://localhost:3000/confirmarEmail/:stringRandom
  validarUsuario.emailConfirm = true;
  validarUsuario.emailResetToken = undefined;
  validarUsuario.emailTimeReset = undefined;

  await validarUsuario.save({ validateBeforeSave: false }); // esto es necesario para guardar sin ingresar campos obligatorios,

  // 💻 4.0 creando JWT, obligatorio crear un nuevo JWT
  // 1) Si RENDERIZAR==FALSE, y "validarUsuario" SI da error, damos ERRORCLASS()
  // 1) Si RENDERIZAR==TRUE, y "validarUsuario" SI da error, damos NEXT()

  // 1) Si RENDERIZAR==FALSE, y "validarUsuario" OK, creamos cookie + respuesta.json()
  // 1) Si RENDERIZAR==TRUE, y "validarUsuario" OK, creamos cookie + respesta.render()

  // req.validarUsuario = validarUsuario;
  resp.locals.usuarioLocal = validarUsuario;
  const data = {
    status: 'success emailVerificado',
    usuario: validarUsuario,
  };

  // 1.0 esto funciona porque este "middleware" lo estas poniendo dentro de --routerView--
  if (!req.url.startsWith('/api')) {
    setCookie(resp, validarUsuario);
    resp.status(200).render('emailConfirmado');
  } else {
    respJwtYCookie(resp, data);
  }
});

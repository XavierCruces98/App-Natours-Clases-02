const ErrorClass = require('./../utilidades/ErrorClass');
const EmailTrap = require('./../utilidades/EmailTrap');
const crypto = require('crypto');

const DB_user = require('../1modelos/esquemaUser');
const AsyncFunction = require('./../utilidades/AsyncFunction');
const localTime = require('../utlidadesPropias/localTime');
const {
  respJwtYCookie,
  setCookie,
} = require('../utlidadesPropias/respJwtYCookie');

const crearStringSha256 = async function (email, resetToken, resetTime) {
  // Lo malo de esta logica, esque cualquier "STRING" (sease de "forgotPassword" "signup" )
  // Ambos son validos, y puedes intercambiar STRING random, y eso esta mal
  // Debemos tener un STRING para email y un STRING para "forgotPassword"

  // 💻 1.0 comprobar si existe el usuario, segun email
  // 💻 1.0 El usuario olvido su contraseña, asi que le pedimos su email
  const usuario = await DB_user.findOne({ email: email });
  if (!usuario)
    return next(new ErrorClass('Porfavor ingrese un email valido', 404)); // not found

  // 💻2.0 GENERAR AUTOTOKEN
  // 💻2.0 debemos usar .save() para guardar las propiedades (ResetToken,ResetToken) en la base-de-datos
  // 💻2.0 usar la opcion, "{validateBeforeSave: false}" , para que te deje guardar ".save()"
  // 💻2.0 Estamos usando el metodo POST, porque el usuario solo ingresara su "email" para recuperar su contraseña
  // 💻2.0 Y no PATCH, porque PATCH significa indicar un "ID" de usuario en la URL
  // 💻2.0 en la URL debemos poner el "randomString" y no el "randomToken"
  const randomString = await usuario.crearRandomStringYToken(
    resetToken,
    resetTime
  );
  await usuario.save({ validateBeforeSave: false });
  return { randomString, usuario };
};

exports.emailWelcome = AsyncFunction(async function (req, resp, next) {
  const { randomString, usuario } = await crearStringSha256(
    req.body.email,
    'emailResetToken',
    'emailTimeReset'
  );

  // 💻 3.0 enviar el token a un EMAIL
  const url = `${req.protocol}://${req.get('host')}`;
  const realURL = `${url}/confirmarEmail/${randomString}`; // URL real para el usuario
  //const resetarURL = `${url}/api/v1/users/resetPassword/${randomString}`; //URL api

  try {
    new EmailTrap(usuario, realURL).sendWelcome();

    const data = {
      status: 'success sendEmail',
      tokenAutoGenerado: usuario['emailResetToken'],
      stringAutoGenerado: randomString,
      correoRemitente: process.env.EMAIL_EMPRESA,
      correoDestino: usuario.email,
      usuario: usuario,
    };

    respJwtYCookie(resp, data);
  } catch (error) {
    // Si sucede un error, el email no se enviara, entocnes reiniciamos estas variables,
    usuario['emailResetToken'] = undefined; // el resetToken, se eliminar, porque ya no servira
    usuario['emailTimeReset'] = undefined; // el tiempo-expira, se elimina, porque ya no servira
    await usuario.save({ validateBeforeSave: false }); // necesario para modificar las propiedades de arriba
    
    console.log(error);
    return next(
      new ErrorClass(
        'Hubo un error en envia -Email Welcome-, intentelo más tarde'
      ),
      500
    );
  }
});

//🔵🔵005 Password olvidado, Ingresar EMAL + enviar un correo con STRING RANDOM
exports.emailForgotPassword = AsyncFunction(async function (req, resp, next) {
  const { randomString, usuario } = await crearStringSha256(
    req.body.email,
    'passwordResetToken',
    'passwordTimeReset'
  );

  // 💻 3.0 enviar el token a un EMAIL
  const url = `${req.protocol}://${req.get('host')}`;
  const realURL = `${url}/recuperarPassword/${randomString}`; // URL real para el usuario
  //const resetarURL = `${url}/api/v1/users/resetPassword/${randomString}`; //URL api

  try {
    new EmailTrap(usuario, realURL).sendResetPassword();

    const data = {
      status: 'success sendEmail',
      tokenAutoGenerado: usuario['passwordResetToken'],
      stringAutoGenerado: randomString,
      correoRemitente: process.env.EMAIL_EMPRESA,
      correoDestino: usuario.email,
      usuario: usuario,
    };

    respJwtYCookie(resp, data);
  } catch (error) {
    // Si sucede un error, el email no se enviara, entocnes reiniciamos estas variables,
    usuario['emailResetToken'] = undefined; // el resetToken, se eliminar, porque ya no servira
    usuario['emailTimeReset'] = undefined; // el tiempo-expira, se elimina, porque ya no servira
    await usuario.save({ validateBeforeSave: false }); // necesario para modificar las propiedades de arriba
    console.log(error);

    return next(
      new ErrorClass(
        'Hubo un error en envia -Email ResetPassword-, intentelo más tarde'
      ),
      500
    );
  }
});

exports.verificarEmailString = AsyncFunction(async function (
  req,
  resp,
  next
) {
  // 💻 1.0 Aqui esta el truco,
  // 💻 1.0 SOLO si estamos en "renderizar" + Y existe "usuarioLocal.confirmacionEmail === TRUE"
  // 💻 1.0 solo en ese caso omitimos la logica de verificarEMAIL
  if (!req.url.startsWith('/api') && resp.locals.usuarioLocal?.emailConfirm) {
    resp.status(200).render('emailConfirmado');
  }

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

  // 💻 3.0 restableciendo valores
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

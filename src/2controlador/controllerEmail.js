const ErrorClass = require('./../utilidades/ErrorClass');
const EmailTrap = require('./../utilidades/EmailTrap');
const DB_user = require('../1modelos/esquemaUser');
const AsyncFunction = require('./../utilidades/AsyncFunction');

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
    };

    //respJwtYCookie(resp, data); NO debemos de crear una cookie, porque estamos recuperando nuestra contraseña
    // solo debemos de dar una respuesta de OK
    resp.status(201).json({ ...data });

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
  const realURL = `${url}/recuperar-cuenta/${randomString}`; // URL real para el usuario
  // nota: routerView.route('/recuperar-cuenta/:stringRandom')

  try {
    new EmailTrap(usuario, realURL).sendResetPassword();

    const data = {
      status: 'success sendEmail',
      tokenAutoGenerado: usuario['passwordResetToken'],
      stringAutoGenerado: randomString,
      correoRemitente: process.env.EMAIL_EMPRESA,
      correoDestino: usuario.email,
    };

    //respJwtYCookie(resp, data); NO debemos de crear una cookie, porque estamos recuperando nuestra contraseña
    // solo debemos de dar una respuesta de OK
    resp.status(201).json({ ...data });
  } catch (error) {
    // Si sucede un error, el email no se enviara, entocnes reiniciamos estas variables,
    usuario['passwordResetToken'] = undefined; // el resetToken, se eliminar, porque ya no servira
    usuario['passwordTimeReset'] = undefined; // el tiempo-expira, se elimina, porque ya no servira
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

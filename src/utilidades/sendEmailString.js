const ErrorClass = require('./ErrorClass');
const sendEmail = require('./sendEmail');

const sendEmailString = async function (datos, req, resp, next) {
  // 💻 1.0 comprobar si existe el usuario, segun email
  // 💻 1.0 El usuario olvido su contraseña, asi que le pedimos su email
  // 💻 1.0 email === usuario
  const usuarioActual = await datos.esquema.findOne({ email: datos.email });
  if (!usuarioActual)
    return next(new ErrorClass('Porfavor ingrese un email valido', 404)); // not found

  // 💻2.0 GENERAR AUTOTOKEN
  // 💻2.0 debemos usar .save() para que se guarde las propiedades (passwordResetToken,passwordTimeReset ) en la base-de-datos
  // 💻2.0 usar la opcion, "{validateBeforeSave: false}" , para que te deje guardar ".save()"
  // 💻2.0 aqui estamos usando el metodo POST, porque el usuario solo ingresara su "email" para recuperar su contraseña
  // 💻2.0 y no PATCH, porque PATCH significa indicar un "ID" de usuario en la URL
  // 💻2.0 en la URL debemos poner el "randomString" y no el "randomToken"
  const randomString = await usuarioActual.crearRandomStringYToken(
    datos.resetToken,
    datos.resetTime
  );
  await usuarioActual.save({ validateBeforeSave: false });

  // 💻 3.0 enviar el token a un EMAIL
  const url = `${req.protocol}://${req.get('host')}`;
  const resetarURL = `${url}/api/v1/users/resetPassword/${randomString}`; //URL api
  const realURL = `${url}/confirmarEmail/${randomString}`; // URL real para el usuario

  // colocamos un try/catch, simplemente para simplificarnos la vida (no es necesario)
  // #forma01 === encontrar el error y poner el en "controllerError" si if(err.name==="xxxx") erroClass=function()
  // #forma02 === try/catch, si sucede un error, en catch hacemos el "errorClass" y listo
  try {
    const correoRemitente = 'vier_98@hotmail.com';
    const emailEnviado = await sendEmail({
      from: `Xavier Alexander <${correoRemitente}>`, // aqui puedes poner cualquier correoOrigen, porque estamos trabajando con "mailTrap"
      to: usuarioActual.email, //(email_user === email destino)
      subject: `${datos.subject}`,
      text: `${datos.text} \n ${resetarURL} \n ${realURL} `,
      //html: "<h1>probando</h1>"
    });

    //console.log(`----------- 003 CORREO ENVIADO -------------`);
    //console.log(emailEnviado);

    const data = {
      status: datos.status,
      tokenAutoGenerado: usuarioActual[datos.resetToken],
      stringAutoGenerado: randomString,
      correoRemitente: correoRemitente,
      correoDestino: usuarioActual.email,
      user: usuarioActual,
    };

    resp.status(201).json(data); // aqui no deseamos crear un JWT
  } catch (error) {
    // userEsquema.crearPasswordResetJWT() , si sucede un error, el email no se enviara, entocnes reiniciamos estas variables,
    usuarioActual[datos.resetToken] = undefined; // el resetToken, se eliminar, porque ya no servira
    usuarioActual[datos.resetTime] = undefined; // el tiempo-expira, se elimina, porque ya no servira
    await usuarioActual.save({ validateBeforeSave: false }); // necesario para modificar las propiedades de arriba
    console.log(error);

    return next(
      new ErrorClass('Hubo un error para enviar el Email, intenta más tarde!'),
      500
    );
  }
};

module.exports = sendEmailString;

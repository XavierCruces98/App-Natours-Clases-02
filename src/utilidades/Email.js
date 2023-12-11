const ErrorClass = require('./ErrorClass');
const sendEmail = require('./sendEmail');
const crypto = require('crypto');

const DB_user = require('../1modelos/esquemaUser');
const AsyncFunction = require('./AsyncFunction');
const localTime = require('../utlidadesPropias/localTime');
const { respJwtYCookie, setCookie } = require('../utlidadesPropias/respJwtYCookie');

// Lo malo de esta logica, esque cualquier "STRING" (sease de "forgotPassword" "signup" )
// Ambos son validos, y puedes intercambiar STRING random, y eso esta mal
// Debemos tener un STRING para email y un STRING para "forgotPassword"
exports.sendEmail = async function (req, resp, next) {
  // 💻 1.0 comprobar si existe el usuario, segun email
  // 💻 1.0 El usuario olvido su contraseña, asi que le pedimos su email
  // 💻 1.0 email === usuario
  const usuarioActual = await DB_user.findOne({ email: req.datos.email });
  if (!usuarioActual)
    return next(new ErrorClass('Porfavor ingrese un email valido', 404)); // not found

  // 💻2.0 GENERAR AUTOTOKEN
  // 💻2.0 debemos usar .save() para que se guarde las propiedades (passwordResetToken,passwordTimeReset ) en la base-de-datos
  // 💻2.0 usar la opcion, "{validateBeforeSave: false}" , para que te deje guardar ".save()"
  // 💻2.0 aqui estamos usando el metodo POST, porque el usuario solo ingresara su "email" para recuperar su contraseña
  // 💻2.0 y no PATCH, porque PATCH significa indicar un "ID" de usuario en la URL
  // 💻2.0 en la URL debemos poner el "randomString" y no el "randomToken"
  const randomString = await usuarioActual.crearRandomStringYToken(
    req.datos.resetToken,
    req.datos.resetTime
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
      subject: req.datos.subject,
      text: `${req.datos.text} ${resetarURL} ${realURL}`,
      //html: "<h1>probando</h1>"
    });

    //console.log(`----------- 003 CORREO ENVIADO -------------`);
    //console.log(emailEnviado);

    const data = {
      status: 'success sendEmail',
      tokenAutoGenerado: usuarioActual[req.datos.resetToken],
      stringAutoGenerado: randomString,
      correoRemitente: correoRemitente,
      correoDestino: usuarioActual.email,
      usuario: usuarioActual,
    };

    // 1) si el email es enviado correctamente entonces:
    // A) si lo hacemos desde POSTMAN, etnocnes respondemos con un JSON

    // aqui no deseamos crear un JWT
    // B) Si lo hacemos desde paginas renderizadas , entonces RENDERIZAMOS EL "emailEnviado"
    // B) ojo,  ya no tenemos una ruta llamada "emailEnviado"
    respJwtYCookie(resp, data);
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

exports.verificarEmailConString = AsyncFunction(async function (
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

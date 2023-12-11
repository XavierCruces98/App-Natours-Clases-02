const cloneDeep = require('lodash.clonedeep');
const ErrorClass = require('./../utilidades/ErrorClass');

// TODO ERROR con ---ErroClass-- ó ERRORES imprevisto
// A) Si es solamente atravez de bodypostam (---.startswith('/api)---) solo lanzamos un mensaje de error
// B) Si estamos en nuestro "localhost/3000/home/etc" entonces, automaticamente va a renderizar --error.pug--
// es como si fuera MAGIA

const enviarProduction = function (err, req, resp) {
  console.log({ url: req.url });

  // A) Para enviar errores a la api (requerimientos usando "fecth" o "postman")
  if (req.url.startsWith('/api')) {
    // A1) Si es un "errorOperacional" es problema del CLIENTE, que ha ingresado algo mal
    // A1) Si es "OPERACIONAL" mandamos el "errorMensaje+errorStatus"
    if (err.isOperational) {
      return resp.status(err.statusCode).json({
        middleware: 'middleware error General - TRUE OPERATIONAL',
        status: err.status,
        message: err.message,
      });
    }

    // A2) si no es un errorOperacional, entonces es un ERROR DESCONOCIDO
    if (!err.isOperational) {
      // A2) A pesar que es produccion, vamos a enviarlo a la console porque es un error desconocido
      // A2)todo error que no pase por un "ErrorClass" es un error desconcido
      console.error('💥💥 Something went very Wrong - ERROR 💥💥');
      console.log(err);

      // A2) Si es un ERROR desconocido enviamos un MENSAJE-GENERICO (tanto para dev y prod)
      // A2) Si NO es "OPERACIONAL" mandamos el "errorMensaje GENERICO"
      return resp.status(err.statusCode).json({
        status: `(PROD) Algo salio muy mal ❗ ${err.status} false OPERATIONAL`,
        message: 'Intente más tarde ', // Algo salió muy mal
      });
    }
  }

  // B) Para renderizar ERRORES EN LA PAGINA WEB
  // B1) Aparece cuando ingreses una URL incorrecto (PROD) http://localhost:8000/qwewqe (cambia el puerto)
  // B1) Si es "OPERACIONAL" mandamos el "errorMensaje+errorStatus"
  if (err.isOperational) {
    return resp.status(err.statusCode).render('error', {
      tituloDinamico: `(PROD) Algo salio muy mal ❗ ${err.status} TRUE OPERATIONAL`,
      errorMensaje: err.message,
    });
  }

  // B2) Si es un ERROR desconocido enviamos un MENSAJE-GENERICO (errorMensaje)(tanto para dev y prod)
  // B2) Si NO es "OPERACIONAL" mandamos el "errorMensaje GENERICO"
  if (!err.isOperational) {
    return resp.status(err.statusCode).render('error', {
      tituloDinamico: `(PROD) Algo salio muy mal ❗ ${err.status} false OPERATIONAL`,
      errorMensaje: 'Intente más tarde ',
    });
  }
};

const enviarDeveloper = function (err, req, resp) {
  // A) Para enviar errores a la api (requerimientos usando "fecth" o "postman")
  if (req.url.startsWith('/api')) {
    // console.log({ errorMensaje: err.message });

    const operational = err.isOperational || false;
    return resp.status(err.statusCode).json({
      middleware: 'middleware error General - TRUE OPERATIONAL',
      code: err.statusCode,
      message: err.message,
      name: err.name,
      stack: err.stack,
      error: err,
      operational: operational,
    });
  }

  // B) Para renderizar ERRORES EN LA PAGINA WEB
  // esto aparece cuando ingreses una URL incorrecto (DEV) http://localhost:3000/qwewqe
  // renderizar "error.ejs" ó "error.pug"
  return resp.status(err.statusCode).render('error', {
    tituloDinamico: `(dev) Algo salio mal 😥 ${err.status} false OPERATIONAL`, // va directo a pug
    errorMensaje: `${err.message} ${err.stack}`, // va directo a pug
  });
};

//------------------------------------------------------------
const castErrorDB = function (err) {
  return new ErrorClass(
    `Invalido : "${err.path}" ; valor: "${err.value}" ; isOperational TRUE`,
    400
  );
};

const duplicateNameDB = function (err) {
  // Buscar dentro de un "err.message" cualquiera valor entre comillas "" '' (dobles o simples)
  const regex = /"([^"]*)"|'([^']*)'/g;
  const textBuscado = err.message.match(regex); // devuelve un array

  return new ErrorClass(
    `Valor duplicado: ${textBuscado[0]} ; ingrese otro valor ; isOperational TRUE`,
    400
  );
};

const validationDatosDB = function (err) {
  const listaErrores = Object.keys(err.errors).map(
    (key) => `[${key}, ${err.errors[key].message}]`
  );

  return new ErrorClass(listaErrores, 400);
};

const expiradoJWT = function () {
  return new ErrorClass('Token EXPIRADO. Porfavor Inicie Sesion de nuevo', 401);
};

const invalidoJWT = function () {
  return new ErrorClass('Token INVALIDO. Porfavor Inicie Sesion de nuevo', 401);
};

//-------------------------------------------------------------

module.exports = (err, req, resp, next) => {
  // OJO aqui me sale err.code === 8000 (prod)
  // OJO aqui me sale err.code === 11000 (dev)
  // esto debdio a que el usuario de "xavier_prod" NO tiene permisos para crear document "error 8000", porque usamos un metodo POST
  // si cambios los permisos de "xavier_prod" todo estara ok (err.code === 11000 === PROD === DEV)

  // ☝ 1.0 el "err.code ó err.StatusCode" son indefinidos en algunos casos,
  // ☝ 2.0 en caso sea undefined, se le asigna valor === "500"
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'Error Servidor';

  // 🟣 001 CLIENTE: Solo se le informa: { Status="Fail" ; Message= "un mensaje simple"}
  if (process.env.NODE_ENV === 'production') {
    //const errorCopy = cloneDeep(err); // 1. Si realiza una copia del objecto, pero por alguna razon no lo hace con "err"
    let errorClass = Object.assign(err); // 2. realiza una copia del objecto, con esto aparece la propiedad "name"

    if (err.name === 'CastError') errorClass = castErrorDB(err); //  --return Error Class--
    if (err.code === 11000) errorClass = duplicateNameDB(err); //  --return Error Class--
    if (err.name === 'ValidationError') errorClass = validationDatosDB(err);
    if (err.name === 'TokenExpiredError') errorClass = expiradoJWT();
    if (err.name === 'JsonWebTokenError') errorClass = invalidoJWT();

    // NO: si NO sucede alguna de las condicionales, ErroClass === copia (ERROR)
    // SI: si SI sucede alguna de las condicionales, ErroClass === return new ErroClass
    enviarProduction(errorClass, req, resp);
  }

  // 🟣 002 DESARROLLADOR: SI hay que informarle todo (err, err.name, err.code, etc)
  if (process.env.NODE_ENV === 'development') {
    enviarDeveloper(err, req, resp);
  }

  // nuestra pila STACK, para que nos indique en que linea de codigo sucedio el error
  // console.log(err.stack)
};

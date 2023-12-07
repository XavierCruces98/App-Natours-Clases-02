const cloneDeep = require('lodash.clonedeep');
const ErrorClass = require('./../utilidades/ErrorClass');

const enviarProduction = function (err, resp) {
  if (err.isOperational) {
    resp.status(err.statusCode).json({
      middleware: 'middleware error General - TRUE OPERATIONAL',
      status: err.status,
      message: err.message, // aqui cambios el mensaje
    });
  }

  if (!err.isOperational) {
    // en este caso, a pesar que es produccion, vamos a enviarlo a la console como un error, porque es un error desconocido
    // todo error que no pase por un "ErrorClass" es un error desconcido
    console.error('💥💥 Something went very Wrong - ERROR 💥💥');
    console.log(err);

    resp.status(err.statusCode).json({
      middleware: 'middleware error General - FALSE OPERATIONAL',
      status: err.status,
      message: 'Produccion - Something went very Wrong', // Algo salió muy mal
    });
  }
};

const enviarDeveloper = function (err, resp) {
  const operational = err.isOperational || false;
  resp.status(err.statusCode).json({
    middleware: 'middleware error General',
    code: err.statusCode,
    message: err.message,
    name: err.name,
    stack: err.stack,
    error: err,
    operational: operational,
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
    enviarProduction(errorClass, resp);
  }

  // 🟣 002 DESARROLLADOR: SI hay que informarle todo (err, err.name, err.code, etc)
  if (process.env.NODE_ENV === 'development') {
    enviarDeveloper(err, resp);
  }

  // nuestra pila STACK, para que nos indique en que linea de codigo sucedio el error
  // console.log(err.stack)
};

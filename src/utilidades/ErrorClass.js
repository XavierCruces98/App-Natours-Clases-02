module.exports = class ErrorApp extends Error {
  constructor(mensaje, errorCodigo) {
    // Este "super()" viene desde la class --Error--
    super(mensaje);
    /*this.message = mensaje;*/
    this.statusCode = errorCodigo;
    this.status = `${this.statusCode}`.startsWith('4')
      ? 'Fail'
      : 'Error Servidor';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor); // Esto lo coloco porque asi esta en clases, no se cual es su funcion
    /**
     *
     * 1. Debes de respetar la nomenclatura, porque estas extends desde CLASS ERROR
     * 2. nomenclatura = "message, statusCode, status", estas propiedades viene desde CLASS ERROR
     * 3. isOperational, simplemente es una propiedad inventada, es para saber el tipo de error,
     *    si es TRUE=== errorOperational , FALSE === errorProgramacion
     *    Los --errorOperationa-- son causado por la manipulacion del usuario (url invalidas, etc)
     *    Los --errorProgramacion-- si son por nuestra culpa
     */
  }
};

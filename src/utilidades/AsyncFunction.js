module.exports = function (miFuncion) {
  // return parametros, parametros que vienen desde el middleware
  // tampoco lo entiendo del todo
  return function (requirimiento, respuesta, next) {
    return miFuncion(requirimiento, respuesta, next) // aqui le pasamos nuestros parametros a nuestra funcion
      .catch((error) => next(error));
  };

  // nota solo aplicarlo con functions async, no con funciones normale
  // ===> "AsyncFunction( async function(par1, par2, par3, etc){} )" ✅
  // ===> "AsyncFunction(  function(par1, par2, par3, etc){} )"      ❌
};

/***
 * 1. Nuestra funcion, tiene como parametro una funcion "miFuncion"
 * 2. Al momento de llamar a "AsyncFunction( async function(par1, par2, par3, etc){})"
 *    estamos metiendo una -- function async --, como tambien puede ser una -- function -- normal
 *
 * 3. Entonces, lo que hacemos es un return dlos parametros de la ""async function(par1, par2, par3, etc){})""
 *      -- (aqui es donde se pone complicado), porque no lo entiendo del todo
 *
 * 4. Luego, al momento de llamar a --miFuncion(par1, par2, par3)--
 *    -- esta se ha convertido en la funcionInstruccion,
 *    -- osea hara lo mismo que la funcion parametro que hemos metido
 *
 * 5. Como es "async", ponemos un .catch(error=> next(error))
 *    -- el .catch() es para agarrar los errores, esto es como si fuera una promesa
 *    -- y .next() es un parametro, que viene  hacer la funcion NEXT() de toda la vida
 *    -- si sucede algun error, ya no depende del catch de cada middleware en "controllerTours"
 *    -- Sino que ira directo a "1. Servidor.js " "middleware-error" miServidor.use(ErrorController);
 *
 *    -- saldra con el codigo 500 === ERROR SERVIDOR (porque estas ingresando algo mal, como ingresar datos incorrectos)
 *    -- solo sale con el codigo 40X === cuando es URL invalida u otra cosa
 */

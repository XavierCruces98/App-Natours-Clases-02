// https://byby.dev/node-promisify   #manera01 de envolver cualquier funcion en una promesa
// https://es.javascript.info/promisify #manera02 de envolver cualquier funcion en una promesa

exports.miPromisify = function (miFunction) {
  return function (...argumentos) {
    return new Promise((resolve, reject) => {
      miFunction(...argumentos, (error, resultado) => {
        if (error) {
          reject(error);
        } else {
          resolve(resultado);
        }
      });
    });
  };
};

exports.miPromisify02 = function (miFunction) {
  // aqui, lo que estamos haciendo, es que si "miFunction" es una function normal
  // simplemente la retornamos y listo, no hacemos nada mas
  if (typeof miFunction === 'function') {
    console.log(`     ------- ES UNA FUNCION ------------`);
    return miFunction;
  }

  // pero si miFunction es un "object AND function entonces , ahi recien, la envolvemos en una promesa"
  if (typeof miFunction === 'object' && typeof miFunction === 'function') {
    console.log(`     ------- ES UN OBJECT + FUNCION ------------`);

    return function (...argumentos) {
      return new Promise((resolve, reject) => {
        function miCallback(err, resultado) {
          if (err) {
            reject(error);
          } else {
            resolve(resultado);
          }
        }
        argumentos.push(miCallback);
        miFunction.call(this, ...argumentos);
      });
    };
  }
};

exports.miPromisify03 = function (miFunction) {
  // aqui, lo que estamos haciendo, es que si "miFunction" es una function normal
  // simplemente la retornamos y listo, no hacemos nada mas
  if (typeof miFunction === 'function') {
    console.log(`     ------- ES UNA FUNCION ------------`);
    return miFunction;
  }

  // pero si miFunction es un "object AND function entonces , ahi recien, la envolvemos en una promesa"
  if (typeof miFunction === 'object' && typeof miFunction === 'function') {
    console.log(`     ------- ES UN OBJECT + FUNCION ------------`);
    return function (...argumentos) {
      return new Promise((resolve, reject) => {
        miFunction(...argumentos, (error, resultado) => {
          if (error) {
            reject(error);
          } else {
            resolve(resultado);
          }
        });
        // argumentos.push(miCallback);
        // miFunction.call(this, ...argumentos);
      });
    };
  }
};

/*

A chatGPT le pedimos traducir el siguiente codigo del archivo "util.d.ts" de --const {promisfy} =require("util")--

--------------------------------------------------------------------------------------------------------------
    export function promisify<TCustom extends Function>(fn: CustomPromisify<TCustom>): TCustom;
    export function promisify<TResult>(
        fn: (callback: (err: any, result: TResult) => void) => void,
    ): () => Promise<TResult>;

--------------------------------------------------------------------------------------------------------------

y nos arrojo el codigo de "miPromisify02"

*/

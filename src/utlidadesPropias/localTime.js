// module.exports.localTime = function () {
//   const offset = new Date().getTimezoneOffset() * 1 * 60 * 1000; //offset in milliseconds , offset return minutes
//   //const tiempoExpira = 10 * 60 * 1000; // expira despues de 10min
//   const localTime = new Date(Date.now() - offset);
//   return localTime;
// };

const localTime = function (tiempoExpira = 0) {
  const offset = new Date().getTimezoneOffset() * 1 * 60 * 1000; //offset in milliseconds , offset return minutes
  //const tiempoExpira = 10 * 60 * 1000; // expira despues de 10min
  const localTime = new Date(Date.now() - offset + tiempoExpira);
  return localTime;
};

module.exports = localTime;

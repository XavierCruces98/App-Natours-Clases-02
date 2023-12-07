// script: npm run start:dev  (OK, PORT=3000, SI morgan)
// script: npm run start:prod (OK, PORT=8000, NO morgan)
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const apiWithExpress = require('./1. App-Express'); // "app"

// 💻 1.0 Este codigo no necesario
process.on('uncaughtException', (error) => {
  console.log(
    `\n🚨🚨EXCEPCION NO DETECTADA 🚨🚨 2. ErrorPrograming NO asyncronicos de nuestra APP`
  );
  console.log(' *Error_name: ', error.name);
  console.log(' *Error_msge: ', error.message);

  console.log(`FIN - Servidor Apagado `);
  process.exit(1);

  // Aqui el servidor no nos interesa, porque AUN no ha sido creado, asi solo ponemos process.exit(1)
  // miServidor.close(() => {process.exit(1); });
});

// 💻 2.0  Los numeros se transforman en letras, PROD/DEV
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: './configProduction.env' });
  console.log(`\n1.0 ESTAMOS EN PRODUCCION 🤯🤯🤯`);
}
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: './configDesarrollo.env' });
  console.log(`\n1.0 ESTAMOS EN DESARROLLO 😴😴😴`);
}

// 💻 3.0 reemplazar PASSWORD y DATABASE en el STRING de "proyect"
const DATA_BASE = process.env.MONGODB_PROYECT.replace(
  '<PASSWORD>',
  process.env.MONGODB_PASSWORD
).replace('<DATABASE>', process.env.MONGODB_DATABASE);

// 💻 4.0  conectar data_base
mongoose.connect(DATA_BASE).then((rep) => {
  console.log(
    `4. ✨✨ Data Base Conectada !\n--------------------------------------------`
  );
});

// 💻 5.0  Conectar al puerto y GO LIVE
const PORT = process.env.PORT;
const miServidor = apiWithExpress.listen(PORT, '127.0.0.1', () => {
  console.log(`3.0 servidor corriendo en 127.0.0.1/${PORT}👇👇👇`);
});

// 💻 6.0  Esto si SIRVE, controlar rechazos no mapeados por ErrorController
process.on('unhandledRejection', (error) => {
  console.log(
    `\n🚨🚨RECHAZO NO CONTROLADO🚨🚨 1. errorPrograming asyncronicos de nuestra APP`
  );
  console.log(' *Error_name: ', error.name);
  console.log(' *Error_msge: ', error.message);

  // 4.0 APP CRASHED
  // Si solo ponemos --process.exit(1)-- hara un cierre forsozo de todo el servidor, el cual, no es buena practica
  // No estamos cerrando el proceso por algo que hemos querido, sino por algo inexperado, ponemos (1)
  miServidor.close(() => {
    process.exit(1);
  });

  console.log(`FIN - Servidor Apagado `);
});

// 💻 7.0  mensaje simple
console.log(
  `2.0 NODE_ENV == ${process.env.NODE_ENV} && PORT == ${process.env.PORT}`
);

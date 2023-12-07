// node "src/0modelos/importar-data-json0.js"
// npm run importData
// npm run deleteData

const filySystem = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const DB_user = require('./esquemaUser');
const DB_tour = require('./esquemaTour'); // aqui es donde obtenemos el collection ""collections-mis-tours""
const DB_review = require('./esquemaReview');

const DIRNAME = require('../DIRNAME');

// los numeros se transforman en letras

// Step01: Variables de Entorno haremos esto solo para "development" simplemente porque asi deseo
dotenv.config({ path: './configDesarrollo.env' });
console.log(`\n😴😴😴 ESTAMOS EN DESARROLLO 😴😴😴\n`);

// Step02. Conectando data base
const DATA_BASE = process.env.MONGODB_PROYECT.replace(
  '<PASSWORD>',
  process.env.MONGODB_PASSWORD
).replace('<DATABASE>', process.env.MONGODB_DATABASE);

mongoose
  .connect(DATA_BASE)
  .then((rep) => console.log(`\n✨✨ Data Base Conectada !`));

// Step 03 nota Read File -- aqui indicas el nombre del archivo
const userObjectJSON = JSON.parse(
  filySystem.readFileSync(`${DIRNAME}/dev_data/datos/users.json`)
);
const tourObjectJSON = JSON.parse(
  filySystem.readFileSync(`${DIRNAME}/dev_data/datos/toursComplejos.json`)
);
const reviewObjectJSON = JSON.parse(
  filySystem.readFileSync(`${DIRNAME}/dev_data/datos/reviews.json`)
);

// Step04 importando Data a collection ó eliminar Data a collection
// 1.0 aqui debes de comentar la parte en donde cifras el --password-- --esquemaUser--
// 2.0 para todos los usuarios de --users.json-- la contraseña es "test1234" , porque como esta encriptada tu no sabes la contraseña
const importarDatos = async function () {
  try {
    await DB_user.create(userObjectJSON, { validateBeforeSave: false }); // para que --PasswordConfirm-- no sea necesario colocarlo
    // await DB_tour.create(tourObjectJSON);
    // await DB_review.create(reviewObjectJSON);

    console.log(
      `1.0 ImportDATA SUCCESS en importar datos!! TOURS-COMPLEJOS + USER + REVIEW`
    );
  } catch (error) {
    console.log(
      `1.0 ImportDATA FAIL en importar datos TOURS-COMPLEJOS + USER + REVIEW`
    );
    console.log(error);
  }
  process.exit(); // para salir de la app
};


const eliminarDatos = async function () {
  try {
    await DB_user.deleteMany(); // no quiero borrar mis usuarios que he creado
    await DB_tour.deleteMany();
    await DB_review.deleteMany();

    console.log(`1.0 DeletetDATA SUCCESS en delete datos!!`);
  } catch (error) {
    console.log(`1.0 DeleteDATA FAIL en delete datos`);
    console.log(error);
  }
  process.exit(); // para salir de la app
};

// Step05 - invocar funciones con linea de comando
// node "src/proyect/1modelos/importar-data-json.js" --importarDatos
// node "src/proyect/1modelos/importar-data-json.js" --eliminarDatos
// npm run importData
// npm run deleteData

if (process.argv[2] == '--importarDatos') importarDatos();
if (process.argv[2] == '--eliminarDatos') eliminarDatos();

console.log(' 2.0 Este mensaje solo es informativo 👇');
console.log(process.argv[2]);

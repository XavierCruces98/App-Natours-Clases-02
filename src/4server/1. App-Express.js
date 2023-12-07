const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimite = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const apiWithExpress = express(); // es como new http()
const DIRNAME = require('../DIRNAME');

const userRoute = require('../3routes/routerUser');
const tourRoute = require('../3routes/routerTour');
const reviewRoute = require('../3routes/routerReview');
const ErroClass = require('../utilidades/ErrorClass');
const ErrorController = require('../2controlador/controllerError'); // globalErrorHandler
const testRoute = express.Router();

const DB_tour = require('../1modelos/esquemaTour');
const DB_user = require('../1modelos/esquemaUser');

function rutaInicialGet(req, resp) {
  resp
    .status(404) // 200
    .json({
      mensaje: '<h1> Metodo .get() </h1>',
      app: 'Natours',
    });
}

function rutaInicialPost(req, resp) {
  resp.status(200).json({
    mensaje: '<h1> Metodo .post() </h1>',
    app: 'Natours',
  });
}

//---------------------------------------------------------------------------------------------------
// 💻 1.0 Se indica el motor del plantillas a utilizar, en este caso 'pug'
// apiWithExpress.set('view engine', 'html'); // esto  no se puede :( por eso usamos 'pug'
// apiWithExpress.set('view engine', 'pug'); // para pug
// apiWithExpress.engine('ejs', engine);
apiWithExpress.set('view engine', 'ejs');

// 💻 2.0 Se indica el directorio donde se almacenarán las plantillas PUG (set)
//apiWithExpress.set('views', path.join(DIRNAME, 'public/pugPlantillas'));
apiWithExpress.set('views', path.join(DIRNAME, 'public/plantillaEjs'));

// 💻 3.0 Se indica el directorio donde se almacenarán nuestra informacion(css,js,etc)(express.static + USE)
apiWithExpress.use(express.static(path.join(DIRNAME, 'public')));

// 💻 4.0 AQUI estamos enrutando, pero aun asi te peudes ir cualquier sitio,
// 💻 4.0 se supone que solo deberias tener acceso a las rutas establecidas por NODE.JS
// render(allTours.ejs)
apiWithExpress.get('/home', async (req, resp) => {
  const data = await DB_tour.find();
  const dataTours = data.slice(1, data.length - 1);
  const usuario = undefined;

  resp.status(200).render('allTours', {
    tituloDinamico: 'titulo dinamico',
    dataTours: dataTours,
    usuario: usuario,
  });
});

// render(login.ejs)
apiWithExpress.get('/login', (req, resp) => {
  const usuario = undefined;
  resp.status(200).render('login', {
    usuario: usuario,
  });
});

// render(me.ejs)
apiWithExpress.get('/me', async (req, resp) => {
  //const usuario = await DB_user.findOne({ nombre: 'user Admin' });

  const usuario = await DB_user.findOne({ nombre: 'Xavier Alexander' });
  usuario.photo = 'user-2.jpg';

  console.log({ usuario: usuario });
  resp.status(200).render('me', {
    usuario: usuario,
  });
});

// render(tour.ejs)
apiWithExpress.get('/tour', async (req, resp) => {
  // revisar --EsquemaReview-- pre(/^find/) this.populate( path:'usuarioId')
  const tour = await DB_tour.findOne({ nombre: 'The Forest Hiker' });
  const usuario = await DB_user.findOne({ nombre: 'Xavier Alexander' });
  usuario.photo = 'user-2.jpg';

  console.log({ reviews: tour.misReviews });

  resp.status(200).render('tour', {
    tour: tour,
    usuario: usuario,
  });
});

// render(tour.ejs)
apiWithExpress.get('/tour/:string', async (req, resp) => {
  console.log({ url: req.url });
  console.log({ url: req.params.string });

  const tour = await DB_tour.findOne({ nombreSlugify: req.params.string });
  const usuario = await DB_user.findOne({ nombre: 'Xavier Alexander' });
  usuario.photo = 'user-2.jpg';

  resp.status(200).render('tour', {
    tour: tour,
    usuario: usuario,
  });
});

// render(signUp.ejs)
apiWithExpress.get('/signup', async (req, resp) => {
  resp.status(200).render('signUp', {
    usuario: undefined,
  });
});

//---------------------------------------------------------------------------------------------------

// 001 GLOBAL MIDDLEWARE -- recuerda que el orden de tu codigo SI importa, el orden que coloques estos middleware es importante
// por ello el control error va al final , de la misma forma el ".all()"

// 💻1.0 seguridad de los HEADERS HTTP
apiWithExpress.use(helmet());

// 💻2.0 Login development, Usar MORGAN si es DEVELOPMENT
if (process.env.NODE_ENV === 'development') {
  // si es development se activa morgan
  apiWithExpress.use(morgan('dev')); // aqui recien se ejecuta morgan
}

// 💻 2.0 CREANDO RATE-LIMIT DE SOLICITUDES desde una misma IP (from same api)
// 💻 2.0 "/api" nos ayuda a que todos nuestras rutas que empiecen con "/api..." se aplique este limitador de request
const limiter = rateLimite({
  //max: 3, // maximo limite de solicitudes
  max: 100,
  windowMS: 1000 * 60 * 60, // 1000ms/s*60s/min*60min/1hr === 1hr, despues de "x max solicitudes" puedes intentar ingresar despues de 1hr
  message:
    'Muchas solicitudes desde esta IP, porfavor vuelvalo a intentarlo en 1hr', // status: 429 TOO MANY REQUESTS
});

apiWithExpress.use('/api', limiter);

// 💻3.0 Limitar el tamaño en kb que se puede enviar por "body-postman"
//apiWithExpress.use(express.json()); // esto es un ""middleware"" , podemos colocar un body desde el POSTMAN
apiWithExpress.use(express.json({ imite: '10kb' })); // si el body-postman tiene más de 10kb lo rechazara

// 💻3.1 DATA-SANITIZATION NOSQL no permitir el ingreso de "consultas NoSQL"
apiWithExpress.use(mongoSanitize());

// 💻3.2 DATA-SANITIZATION XSS  no permitir el ingreso de codigo <html> (ataques XSS)
apiWithExpress.use(xss());

// 💻3.3 PREVENT PARAMETER POLLUTION,
// hpp()          === evita el duplicado de parametros                                      ❌''duracion=3 & duracion=9 & duracion=5''
// hpp(whitelist) === especificamos parametros especificos que si se les permita su duplicado ✅''duracion=3 & duracion=9 & duracion=5''
// whitelist      ===  estos parametros ingresados en URL no sera afectados por el hpp()
apiWithExpress.use(
  hpp({
    whitelist: [
      'nombre',
      'duracion',
      'maxGroupSize',
      'dificultad',
      'ratingsAverage',
      'ratingsQuantity',
      'precio',
    ],
  })
);

// 💻5.0 Rutas (iniciales, tours, users, text-middleware)
apiWithExpress.route('/').get(rutaInicialGet).post(rutaInicialPost);
apiWithExpress.use('/api/v1/tours', tourRoute); // enroutar
apiWithExpress.use('/api/v1/users', userRoute); // enroutar
apiWithExpress.use('/api/v1/reviews', reviewRoute); // enroutar
apiWithExpress.use('/api/v1/test-middleware', testRoute); // enroutar

// 💻6.0 .all("*") Cualquier otra ruta que no sea los de arriba (3.0 rutas)
// 💻6.0 Aqui estamos diciendo, Para cualquier otra ruta, retornar un "Error" ==>> next( new ErrorClass ("ruta no valida") )
// 💻6.0 Si este .all("*"), lo ponemos arriba, no podremos acceder a ninguna URL,

apiWithExpress.all('*', (req, resp, next) => {
  // next() al momento de pasarle un error, reconoce automaticamente que se trata de un error
  // se lo pasara al "middleware-error-general"
  next(
    new ErroClass(`No se puede encontrar la ruta : ${req.originalUrl}`, 404)
  );
});

// 💻 7.0 ejemplo de un middleware
apiWithExpress.use((req, resp, next) => {
  // Esto es un ejemplo, tmb puedes ver variables & headers & req.params de la URL
  //console.log(req.headers, req.body, req.params);

  // siempre se pone ""next()"" cuando no hay una respuesta --resp.status(200).json({})---
  // si hubiera una respuesta --resp.status(200).json({})--- ya no se pone ---.next()---
  next();
});
// 💻 8.0 Esto es el "middleware-error-general"
apiWithExpress.use(ErrorController);

module.exports = apiWithExpress;

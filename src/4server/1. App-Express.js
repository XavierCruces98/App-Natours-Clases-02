const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimite = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const apiWithExpress = express(); // es como new http()
const DIRNAME = require('../DIRNAME');

const userRoute = require('../3routes/routerUser');
const tourRoute = require('../3routes/routerTour');
const reviewRoute = require('../3routes/routerReview');
const viewRoute = require('../3routes/routerView');

const ErrorClass = require('../utilidades/ErrorClass');
const ErrorController = require('../2controlador/controllerError'); // globalErrorHandler
const testRoute = express.Router();


apiWithExpress.use(cookieParser()); // nota ahora recien nuestro "req" tiene "req.cookies"
// 💻  0.0 ejemplo de un middleware (debe de ir antes de cualquier route)

// 💻 1.0 Se indica el motor del plantillas a utilizar, en este caso 'pug'
// apiWithExpress.set('view engine', 'html'); // esto  no se puede :( por eso usamos 'pug'
apiWithExpress.set('view engine', 'pug'); // para pug
// apiWithExpress.engine('ejs', engine);
// apiWithExpress.set('view engine', 'ejs');

// 💻 2.0 Se indica el directorio donde se almacenarán las plantillas PUG (set)
apiWithExpress.set('views', path.join(DIRNAME, 'public/plantillaPug')); // plantijasEjs

// 💻 3.0 Se indica el directorio donde se almacenarán nuestra informacion(css,js,etc)(express.static + USE)
apiWithExpress.use(express.static(path.join(DIRNAME, 'public')));

// 💻 4.0 AQUI estamos enrutando, pero aun asi te peudes ir cualquier sitio,
// 💻 4.0 se supone que solo deberias tener acceso a las rutas establecidas por NODE.JS
// 💻1.0 seguridad de los HEADERS HTTP
apiWithExpress.use(helmet());

//--------------------------------------------------------------------------------------------

// 001 GLOBAL MIDDLEWARE -- recuerda que el orden de tu codigo SI importa, el orden que coloques estos middleware es importante
// por ello el control error va al final , de la misma forma el ".all()"
apiWithExpress.use((req, resp, next) => {
  // Puedes ver variables & headers & req.params de la URL
  //console.log(req.headers, req.body, req.params); // se dispara cada vez que se realiza una REQUEST a nuestra API
  next();
});

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

// 💻3.1 muestras las solicitudes enviadas desde archivos.pug archivo.html ---action="/url"---
apiWithExpress.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 💻3.1 DATA-SANITIZATION NOSQL no permitir el ingreso de "consultas NoSQL"
apiWithExpress.use(mongoSanitize());

// 💻3.2 DATA-SANITIZATION XSS  no permitir el ingreso de codigo <html> (ataques XSS)
apiWithExpress.use(xss());

// 💻3.3 PREVENT PARAMETER POLLUTION,
// hpp()          === evita el duplicado de parametros            ❌''duracion=3 & duracion=9 & duracion=5''
// hpp(whitelist) === especificamos parametros especificos que SI se les permite su duplicado ✅''duracion=3 & duracion=9 & duracion=5''
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

// 💻6.0 Rutas (iniciales, tours, users, text-middleware)
apiWithExpress.use('/', viewRoute); // enroutar
apiWithExpress.use('/api/v1/tours', tourRoute); // enroutar
apiWithExpress.use('/api/v1/users', userRoute); // enroutar
apiWithExpress.use('/api/v1/reviews', reviewRoute); // enroutar
apiWithExpress.use('/api/v1/test-middleware', testRoute); // enroutar

// 💻7.0 .all("*") Cualquier otra ruta que no sea los de arriba (3.0 rutas)
// 💻7.0 Aqui estamos diciendo, Para cualquier otra ruta, retornar un "Error" ==>> next( new ErrorClass ("ruta no valida") )
// 💻7.0 Si este .all("*"), lo ponemos arriba, no podremos acceder a ninguna URL,

apiWithExpress.all('*', (req, resp, next) => {
  // next() al momento de pasarle un error, reconoce automaticamente que se trata de un error
  // se lo pasara al "middleware-error-general"
  next(
    new ErrorClass(`No se puede encontrar la ruta : ${req.originalUrl}`, 404)
  );
});

// 💻 8.0 Esto es el "middleware-error-general"
apiWithExpress.use(ErrorController);

module.exports = apiWithExpress;

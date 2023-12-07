// node "src/proyect1/routes/routerTourTour.js"
const express = require('express');
const controlTours = require('../2controlador/controllerTours');
const routerTour = express.Router(); // creando routerTour
const controllerAuth = require('../2controlador/controllerAuthentication');
//const controlReview = require('../2controlador/controllerReview');
const routerReview = require('./routerReview');

/*
 * solo puede haber un "get o un post"
 * ❗❗❗ IMPORTANTE ❗❗❗ en --1. SERVIDOR.JS-- hemos definido la ruta inicial como "/api/v1/tours"
 * Por ello todo debe de ser =
 * http://127.0.0.1:3000/api/v1/tours
 * http://127.0.0.1:3000/api/v1/tours/top-5-tours,
 * http://127.0.0.1:3000/api/v1/tours/id=123,
 * http://127.0.0.1:3000/api/v1/tours?etcetc
 * http://127.0.0.1:3000/api/v1/tours/consultaSencilla
 *
 * */

// nota para encadenar varias callback en get(),post(),delete(), los metodos de "controlTours" deben tener el --next--
// nota Es necesario colocar en "permisoJWT" en cada metodo, sino no lo colocas, podra hacer GET/POST/DELETE sin el JWT

routerTour
  .route('/tours-cercanos/:distancia/center/:latitudLongitud/unidad/:unit')
  .get(controlTours.toursCercanos);

// mi == millas
// km == kilometros
// URL (tradicional): api/v1/tours/?distancia=555&center=-111,43&unidad=mi
// URL (tradicional): api/v1/tours/tours-cercanos?distancia=555&center=-111,43&unidad=mi
// URL (profesional): api/v1/tours/tours-cercanos/:distancia/center/:latitudLongitud/unidad/:unit

routerTour
  .route('/tours-distancias/:latitudLongitud/unidad/:unit')
  .get(controlTours.tourDistancias);

// URL (tradicional): api/v1/tours/tours-distancias?latitudLongitud=-111,43&unidad=mi
// URL (profesional): api/v1/tours/tours-distancias/:latitudLongitud/unidad/:unit

//-----------------------------------------------------------------------------------------------------------

routerTour
  .route('/top-5-tours-baratos-bestCalificados') // ruta especial
  .get(
    controllerAuth.permisoJWT, // Informacion libre
    controlTours.tourTop5,
    controlTours.consultaAllDocuments
  ); // podemos anidar varios --middleware--

routerTour
  .route('/agrupamiento') //
  .get(controllerAuth.permisoJWT, controlTours.getAgrupamiento);

routerTour
  .route('/plan-mensual/:miAno') //
  .get(
    controllerAuth.permisoJWT, //
    controllerAuth.restringidoTo('admin', 'lider-guia', 'guia'), // estadisticas internas de la APP
    controlTours.getAgrupamientoAno
  );

//----------------------------------------------------------

// Aqui estamos chancando al ❗❗Merge enroutar [Review, Tour]❗❗

routerTour
  .route('/:id/reviews/:idReview') //
  .get(controllerAuth.permisoJWT, controlTours.getIdTourIdReview);

routerTour.use('/:id/reviews', routerReview);

// ❗❗Merge enroutar [Review, Tour]❗❗ ==> automaticamente buscara todas las rutas que terminen en REVIEWS
// y lo reemplazara con la logica que exista en --routerReview--

// Ejemplo01: [get] api/v1/tours/....../review ===> entra la logica de routerReview
// Ejemplo01: [get] api/v1/review              ===> nuestra ruta de arriba de --TOURS-- pasa automaticamente a --REVIEW--

// Ejemplo02: [get] api/v1/tours/....../review:Xparametro ===> entra la logica de routerReview
// Ejemplo02: [get] api/v1/review:id                      ===> nuestra ruta de arriba de --TOURS-- pasa automaticamente a --REVIEW--

// como aqui existe un parametro --review:XParametro-- , entonces lo toma automaticamente como  --review:id--

/*
routerTour
  .route('/:id/reviews') //
  .post(
    controllerAuth.permisoJWT,
    controllerAuth.restringidoTo('user-basico'),
    controlReview.crearReview
  );

routerTour
  .route('/:id/reviews') //
  .get(controllerAuth.permisoJWT, controlTours.getIdTourReviews);
*/

//-----------------------------------------------

routerTour
  .route('/:id') // SI TIENE PARAMETROS "/:id"
  .get(
    // controllerAuth.permisoJWT, // nuestra API, permite ver TOUR a cualquier persona (usuario o no usuario)
    controlTours.getTourId
  )
  .patch(
    controllerAuth.permisoJWT,
    controllerAuth.restringidoTo('admin', 'lider-guia', 'guia'), // los users-bascios, no puede modificar un tour
    controlTours.patchTourId
  )
  .delete(
    controllerAuth.permisoJWT,
    controllerAuth.restringidoTo('admin', 'lider-guia'), // un admion ó lider-guia, puede borrar un ID
    controlTours.deleteTourId
  );

// [GET :/id] Para read-one-document
// [PATCH :/id] Para update-one-document
// [DELETE :/id] Para delete-one-document

//-----------------------------------------------

routerTour
  .route('/') // NO TIENE PARAMETROS
  .get(
    // controllerAuth.permisoJWT, // nuestra API, permite ver TOUR a cualquier persona (usuario o no usuario)
    controlTours.consultaAllDocuments
  )
  .post(
    controllerAuth.permisoJWT,
    controllerAuth.restringidoTo('admin', 'lider-guia', 'guia'), // los usuarios-basicos, no pueden crear nuevos tours
    controlTours.postTour
  )
  .delete(
    controllerAuth.permisoJWT,
    controllerAuth.restringidoTo('admin'), // solo el "admin" puede borrar toda la base-de-datos
    controlTours.deleteMany
  );

// [GET :/]    = para read-all-document
// [POST :/]   = para create-one-document ó create-Many-document
// [DELETE :/]  =para delete-many-documents ó delete-all-documents
module.exports = routerTour;
